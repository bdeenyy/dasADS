import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { createAvitoClient } from "@/lib/avito"

// Avito status → local action mapping
const AVITO_STATUS_MAP: Record<string, {
    localStatus: string;
    activityType: string;
    message: string;
}> = {
    created: { localStatus: "DRAFT", activityType: "AVITO_STATUS", message: "Вакансия создана на Avito (черновик)" },
    activated: { localStatus: "ACTIVE", activityType: "AVITO_STATUS", message: "Вакансия активирована на Avito" },
    archived: { localStatus: "ARCHIVED", activityType: "AVITO_STATUS", message: "Вакансия снята с публикации на Avito" },
    blocked: { localStatus: "ARCHIVED", activityType: "AVITO_BLOCKED", message: "⚠️ Вакансия ЗАБЛОКИРОВАНА модерацией Avito" },
    rejected: { localStatus: "ARCHIVED", activityType: "AVITO_REJECTED", message: "⚠️ Вакансия ОТКЛОНЕНА модерацией Avito" },
    expired: { localStatus: "ARCHIVED", activityType: "AVITO_EXPIRED", message: "Истёк срок публикации на Avito" },
    closed: { localStatus: "CLOSED", activityType: "AVITO_STATUS", message: "Вакансия закрыта на Avito" },
    unblocked: { localStatus: "ACTIVE", activityType: "AVITO_STATUS", message: "Вакансия разблокирована на Avito" },
}

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
        let currentLocalStatus = vacancy.status;

        // --- Step 1: Sync vacancy status from Avito ---
        try {
            if (vacancy.avitoId) {
                const activeIds = await avitoClient.getActiveItemIds();
                const oldIds = await avitoClient.getOldItemIds();

                let avitoStatusLabel = vacancy.avitoStatus;

                if (activeIds.includes(vacancy.avitoId)) {
                    avitoStatusLabel = "activated";
                } else if (oldIds.includes(vacancy.avitoId)) {
                    avitoStatusLabel = "archived";
                }

                if (avitoStatusLabel && avitoStatusLabel !== vacancy.avitoStatus) {
                    const mapping = AVITO_STATUS_MAP[avitoStatusLabel];

                    if (mapping) {
                        const statusChanged = avitoStatusLabel !== vacancy.avitoStatus;
                        const localStatusChanged = mapping.localStatus !== currentLocalStatus;

                        await prisma.vacancy.update({
                            where: { id: vacancy.id },
                            data: {
                                avitoStatus: avitoStatusLabel,
                                ...(localStatusChanged ? { status: mapping.localStatus as any } : {}),
                            }
                        });

                        // Create an activity entry when status changes
                        if (statusChanged) {
                            await prisma.activity.create({
                                data: {
                                    type: mapping.activityType,
                                    details: mapping.message,
                                    userId: session.user.id,
                                    vacancyId: vacancy.id,
                                }
                            });
                        }

                        if (localStatusChanged) {
                            currentLocalStatus = mapping.localStatus;
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Failed to sync vacancy status:", err);
            // Non-fatal, continue to fetch applies
        }

        // --- Step 2: Fetch apply IDs updated since last sync ---
        const syncFrom = vacancy.lastSyncAt
            ? vacancy.lastSyncAt.toISOString().slice(0, 10) // YYYY-MM-DD
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) // last 30 days by default

        const allApplyIds: string[] = []
        let cursor: string | undefined = undefined

        // Paginate through all apply IDs
        do {
            const idsResponse = await avitoClient.getApplyIds({
                updatedAtFrom: syncFrom,
                vacancyIds: vacancy.avitoId,
                cursor,
            }) as Record<string, unknown>

            const ids = Array.isArray(idsResponse.applies)
                ? (idsResponse.applies as Array<{ id: string }>).map(a => a.id)
                : []

            allApplyIds.push(...ids)

            // Cursor for next page is the ID of the last item
            cursor = ids.length > 0 ? ids[ids.length - 1] : undefined

            // If we got fewer than 100, we're on the last page
            if (ids.length < 100) break
        } while (cursor)

        if (allApplyIds.length === 0) {
            // Update lastSyncAt even if no new applies
            await prisma.vacancy.update({
                where: { id: vacancy.id },
                data: { lastSyncAt: new Date() }
            })
            return NextResponse.json({ success: true, newApplies: 0 })
        }

        // --- Step 3: Fetch full data for all apply IDs (batches of 100) ---
        const BATCH_SIZE = 100
        const allApplies: Record<string, unknown>[] = []

        for (let i = 0; i < allApplyIds.length; i += BATCH_SIZE) {
            const batch = allApplyIds.slice(i, i + BATCH_SIZE)
            const batchData = await avitoClient.getAppliesByIds(batch) as Record<string, unknown>
            const applies = Array.isArray(batchData.applies) ? batchData.applies as Record<string, unknown>[] : []
            allApplies.push(...applies)
        }

        // --- Step 4: Process each apply ---
        let newCount = 0
        const applyIdsToMarkViewed: string[] = []

        for (const apply of allApplies) {
            const applyIdStr = String(apply.id || apply.apply_id || "")
            if (!applyIdStr || applyIdStr === "undefined") continue;

            // Extract applicant data
            const applicant = apply.applicant as Record<string, unknown> || {}
            const applicantData = applicant.data as Record<string, unknown> || {}

            // Name can be in applicant.data.name or applicant.data.full_name
            const applicantName = (applicantData.name as string) || "Имя не указано"

            const contacts = apply.contacts as Record<string, unknown> || {}
            const phonesArray = contacts.phones as Array<{ value: string }> || []
            let applicantPhone = phonesArray.length > 0 ? phonesArray[0].value : null
            const applicantEmail = applicant.email as string | null || applicantData.email as string | null || null

            // Extract resume data
            const resume = apply.resume as Record<string, unknown> | null
            const resumeLink = resume?.url as string | null || null
            const resumeId = resume?.id ? String(resume.id) : null

            // Parse enriched properties (from Avito assistant survey)
            const enrichedProps = apply.enriched_properties as Record<string, unknown> | null
            const enrichedAge = enrichedProps?.age
                ? (enrichedProps.age as Record<string, unknown>)?.value as number | null
                : null
            const enrichedCitizenship = enrichedProps?.citizenship
                ? (enrichedProps.citizenship as Record<string, unknown>)?.value as string | null
                : null
            const enrichedGender = enrichedProps?.gender
                ? (enrichedProps.gender as Record<string, unknown>)?.value as string | null
                : null
            const enrichedExperience = enrichedProps?.experience
                ? (enrichedProps.experience as Record<string, unknown>)?.value as string | null
                : null

            // Phone might be in enriched properties if missing from contacts
            if (!applicantPhone && enrichedProps?.phone) {
                applicantPhone = (enrichedProps.phone as Record<string, unknown>)?.value as string | null
            }
            // Format phone to strip + if present
            if (applicantPhone && applicantPhone.startsWith('+')) {
                applicantPhone = applicantPhone.substring(1);
            }

            // Determine First and Last names
            const nameParts = applicantName.split(" ")
            const firstName = nameParts[0]
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null

            // Skip if already synced
            const existingApplication = await prisma.vacancyApplication.findUnique({
                where: { avitoApplyId: applyIdStr }
            })
            if (existingApplication) {
                applyIdsToMarkViewed.push(applyIdStr)
                continue;
            }

            // Match existing candidates by resume ID, phone, or email
            let candidateId: string | undefined;

            if (resumeId) {
                const existing = await prisma.candidate.findFirst({
                    where: { avitoResumeId: resumeId, organizationId: session.user.organizationId }
                })
                if (existing) candidateId = existing.id
            }
            if (!candidateId && applicantPhone) {
                const existing = await prisma.candidate.findFirst({
                    where: { phone: applicantPhone, organizationId: session.user.organizationId }
                })
                if (existing) candidateId = existing.id
            }
            if (!candidateId && applicantEmail) {
                const existing = await prisma.candidate.findFirst({
                    where: { email: applicantEmail, organizationId: session.user.organizationId }
                })
                if (existing) candidateId = existing.id
            }

            // Create or update candidate
            if (!candidateId) {
                const newCandidate = await prisma.candidate.create({
                    data: {
                        firstName,
                        lastName,
                        phone: applicantPhone,
                        email: applicantEmail,
                        avitoResumeId: resumeId,
                        resumeLink,
                        age: enrichedAge,
                        citizenship: enrichedCitizenship,
                        gender: enrichedGender,
                        experienceYears: enrichedExperience,
                        organizationId: session.user.organizationId
                    }
                })
                candidateId = newCandidate.id

                await prisma.activity.create({
                    data: {
                        type: "CANDIDATE_CREATED",
                        details: `Загружен из откликов Avito: ${applicantName}`,
                        userId: session.user.id,
                        candidateId,
                        vacancyId: vacancy.id
                    }
                })
            } else {
                // Update enriched fields on existing candidate if not yet filled
                await prisma.candidate.updateMany({
                    where: {
                        id: candidateId,
                        age: null,
                    },
                    data: {
                        age: enrichedAge ?? undefined,
                        citizenship: enrichedCitizenship ?? undefined,
                        gender: enrichedGender ?? undefined,
                        experienceYears: enrichedExperience ?? undefined,
                    }
                })
            }

            // Deduplicate by (vacancyId, candidateId)
            const existingBase = await prisma.vacancyApplication.findUnique({
                where: { vacancyId_candidateId: { vacancyId: vacancy.id, candidateId: candidateId! } }
            })

            if (existingBase) {
                await prisma.vacancyApplication.update({
                    where: { id: existingBase.id },
                    data: {
                        avitoApplyId: applyIdStr,
                        enrichedData: enrichedProps ? JSON.parse(JSON.stringify(enrichedProps)) : undefined,
                    }
                })
            } else {
                await prisma.vacancyApplication.create({
                    data: {
                        vacancyId: vacancy.id,
                        candidateId: candidateId!,
                        avitoApplyId: applyIdStr,
                        enrichedData: enrichedProps ? JSON.parse(JSON.stringify(enrichedProps)) : undefined,
                        status: "NEW"
                    }
                })
                newCount++
            }

            applyIdsToMarkViewed.push(applyIdStr)
        }

        // --- Step 5: Mark all processed applies as viewed on Avito ---
        if (applyIdsToMarkViewed.length > 0) {
            try {
                const viewBatches: string[][] = []
                for (let i = 0; i < applyIdsToMarkViewed.length; i += 100) {
                    viewBatches.push(applyIdsToMarkViewed.slice(i, i + 100))
                }
                for (const batch of viewBatches) {
                    await avitoClient.setAppliesViewed(batch.map(id => ({ id, is_viewed: true })))
                }
                // Update isViewedOnAvito flag locally
                await prisma.vacancyApplication.updateMany({
                    where: { avitoApplyId: { in: applyIdsToMarkViewed } },
                    data: { isViewedOnAvito: true }
                })
            } catch (err) {
                console.error("Failed to mark applies as viewed on Avito:", err)
                // Non-fatal
            }
        }

        // --- Step 6: Update lastSyncAt ---
        await prisma.vacancy.update({
            where: { id: vacancy.id },
            data: { lastSyncAt: new Date() }
        })

        return NextResponse.json({ success: true, newApplies: newCount, totalProcessed: allApplyIds.length })
    } catch (error) {
        console.error("[AVITO_SYNC_POST]", error)
        return new NextResponse(error instanceof Error ? error.message : "Internal Error", { status: 500 })
    }
}
