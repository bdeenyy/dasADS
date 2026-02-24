import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { createAvitoClient } from "@/lib/avito"

export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const body = await req.json()
        const { vacancyId } = body

        if (!vacancyId) {
            return new NextResponse("vacancyId is required", { status: 400 })
        }

        const vacancy = await prisma.vacancy.findUnique({
            where: { id: vacancyId, customer: { organizationId: session.user.organizationId } },
            include: { customer: true }
        })

        if (!vacancy) {
            return new NextResponse("Vacancy not found", { status: 404 })
        }

        if (!vacancy.avitoId) {
            return new NextResponse("Vacancy is not published on Avito", { status: 400 })
        }

        const avitoClient = await createAvitoClient(session.user.organizationId)

        // Fetch applies from Avito
        const avitoResponse = await avitoClient.getApplies(vacancy.avitoId) as unknown

        const responseObj = avitoResponse as Record<string, unknown>

        // Structure is assumed based on common Avito models
        const appliesList = Array.isArray(responseObj)
            ? responseObj
            : (Array.isArray(responseObj.applies) ? responseObj.applies : (Array.isArray(responseObj.items) ? responseObj.items : []))

        let newCount = 0

        for (const apply of appliesList as Record<string, unknown>[]) {
            const applyIdStr = String(apply.apply_id || apply.id || "")
            if (!applyIdStr || applyIdStr === "undefined") continue;
            const applicantName = (apply.applicant as Record<string, unknown>)?.name as string || "Имя не указано"
            const applicantPhone = (apply.applicant as Record<string, unknown>)?.phone as string || null
            const applicantEmail = (apply.applicant as Record<string, unknown>)?.email as string || null
            const resumeLink = (apply.resume as Record<string, unknown>)?.url as string || null
            const resumeId = (apply.resume as { id?: string })?.id ? String((apply.resume as { id?: string }).id) : null

            // Determine First and Last names
            const nameParts = applicantName.split(" ")
            const firstName = nameParts[0]
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null

            // Check if VacancyApplication already exists for this avitoApplyId
            const existingApplication = await prisma.vacancyApplication.findUnique({
                where: { avitoApplyId: applyIdStr }
            })

            if (existingApplication) {
                continue; // Already synced this apply
            }

            // Match existing candidates by resume ID, phone, or email
            let candidateId: string | undefined;

            if (resumeId) {
                const existingCandidate = await prisma.candidate.findFirst({
                    where: { avitoResumeId: resumeId, organizationId: session.user.organizationId }
                })
                if (existingCandidate) candidateId = existingCandidate.id
            }

            if (!candidateId && applicantPhone) {
                const existingCandidate = await prisma.candidate.findFirst({
                    where: { phone: applicantPhone, organizationId: session.user.organizationId }
                })
                if (existingCandidate) candidateId = existingCandidate.id
            }

            if (!candidateId && applicantEmail) {
                const existingCandidate = await prisma.candidate.findFirst({
                    where: { email: applicantEmail, organizationId: session.user.organizationId }
                })
                if (existingCandidate) candidateId = existingCandidate.id
            }

            // Create new Candidate if not found
            if (!candidateId) {
                const newCandidate = await prisma.candidate.create({
                    data: {
                        firstName,
                        lastName,
                        phone: applicantPhone,
                        email: applicantEmail,
                        avitoResumeId: resumeId,
                        resumeLink: resumeLink,
                        organizationId: session.user.organizationId
                    }
                })
                candidateId = newCandidate.id

                // Log activity
                await prisma.activity.create({
                    data: {
                        type: "CANDIDATE_CREATED",
                        details: `Загружен из откликов Avito: ${applicantName}`,
                        userId: session.user.id,
                        candidateId: candidateId,
                        vacancyId: vacancy.id
                    }
                })
            }

            // Create VacancyApplication
            const existingBaseApply = await prisma.vacancyApplication.findUnique({
                where: {
                    vacancyId_candidateId: {
                        vacancyId: vacancy.id,
                        candidateId: candidateId
                    }
                }
            })

            if (existingBaseApply) {
                await prisma.vacancyApplication.update({
                    where: { id: existingBaseApply.id },
                    data: { avitoApplyId: applyIdStr }
                })
            } else {
                await prisma.vacancyApplication.create({
                    data: {
                        vacancyId: vacancy.id,
                        candidateId: candidateId,
                        avitoApplyId: applyIdStr,
                        status: "NEW"
                    }
                })
                newCount++;
            }
        }

        return NextResponse.json({ success: true, newApplies: newCount })
    } catch (error) {
        console.error("[AVITO_SYNC_POST]", error)
        return new NextResponse(error instanceof Error ? error.message : "Internal Error", { status: 500 })
    }
}
