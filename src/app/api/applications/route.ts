import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const session = await auth()
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const vacancyId = searchParams.get("vacancyId")

    if (!vacancyId) {
        return new NextResponse("Vacancy ID is required", { status: 400 })
    }

    try {
        // Ensure the vacancy belongs to the org
        const vacancy = await prisma.vacancy.findUnique({
            where: { id: vacancyId },
            include: { customer: true }
        })

        if (!vacancy || vacancy.customer.organizationId !== session.user.organizationId) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const applications = await prisma.vacancyApplication.findMany({
            where: {
                vacancyId: vacancyId
            },
            include: {
                candidate: true
            },
            orderBy: {
                updatedAt: "desc",
            },
        })
        return NextResponse.json(applications)
    } catch (error) {
        console.error("[APPLICATIONS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PATCH(req: Request) {
    const session = await auth()
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const body = await req.json()
        const { applicationId, status } = body

        if (!applicationId || !status) {
            return new NextResponse("Application ID and status are required", { status: 400 })
        }

        // Verify ownership
        const existingApp = await prisma.vacancyApplication.findUnique({
            where: { id: applicationId },
            include: {
                vacancy: { include: { customer: true } },
                candidate: true
            }
        })

        if (!existingApp || existingApp.vacancy.customer.organizationId !== session.user.organizationId) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const application = await prisma.vacancyApplication.update({
            where: { id: applicationId },
            data: { status }
        })

        // Log status change
        await prisma.activity.create({
            data: {
                type: "STATUS_CHANGE",
                details: `Candidate ${existingApp.candidate.firstName} moved from ${existingApp.status} to ${status}`,
                userId: session.user.id,
                candidateId: existingApp.candidateId,
                vacancyId: existingApp.vacancyId
            }
        })

        return NextResponse.json(application)
    } catch (error) {
        console.error("[APPLICATIONS_PATCH]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
