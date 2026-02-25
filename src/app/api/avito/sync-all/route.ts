import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { createAvitoClient } from "@/lib/avito"

const AVITO_STATUS_MAP: Record<string, { localStatus: string; activityType: string; message: string }> = {
    created: { localStatus: "DRAFT", activityType: "AVITO_STATUS", message: "Вакансия создана на Avito (черновик)" },
    activated: { localStatus: "ACTIVE", activityType: "AVITO_STATUS", message: "Вакансия активирована на Avito" },
    archived: { localStatus: "ARCHIVED", activityType: "AVITO_STATUS", message: "Вакансия снята с публикации на Avito" },
    blocked: { localStatus: "ARCHIVED", activityType: "AVITO_BLOCKED", message: "⚠️ Вакансия ЗАБЛОКИРОВАНА модерацией Avito" },
    rejected: { localStatus: "ARCHIVED", activityType: "AVITO_REJECTED", message: "⚠️ Вакансия ОТКЛОНЕНА модерацией Avito" },
    expired: { localStatus: "ARCHIVED", activityType: "AVITO_EXPIRED", message: "Истёк срок публикации на Avito" },
    closed: { localStatus: "CLOSED", activityType: "AVITO_STATUS", message: "Вакансия закрыта на Avito" },
    unblocked: { localStatus: "ACTIVE", activityType: "AVITO_STATUS", message: "Вакансия разблокирована на Avito" },
}

/**
 * POST /api/avito/sync-all
 * Синхронизирует отклики и статусы для всех опубликованных на Avito вакансий организации.
 */
export async function POST() {
    const session = await auth()
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    // Only MASTER and MANAGER can run mass sync
    if (session.user.role === "RECRUITER") {
        return new NextResponse("Forbidden", { status: 403 })
    }

    try {
        const avitoClient = await createAvitoClient(session.user.organizationId)

        // Get all published Avito vacancies for this org
        const vacancies = await prisma.vacancy.findMany({
            where: {
                customer: { organizationId: session.user.organizationId },
                avitoId: { not: null }
            },
            select: {
                id: true,
                avitoId: true,
                avitoStatus: true,
                status: true,
                lastSyncAt: true,
            }
        })

        if (vacancies.length === 0) {
            return NextResponse.json({ success: true, message: "Нет вакансий, опубликованных на Avito", synced: 0 })
        }

        // --- Step 1: Bulk status sync for all vacancies ---
        try {
            const activeIds = await avitoClient.getActiveItemIds();
            const oldIds = await avitoClient.getOldItemIds();

            for (const vacancy of vacancies) {
                if (!vacancy.avitoId) continue;

                let avitoStatusLabel = vacancy.avitoStatus;
                if (activeIds.includes(vacancy.avitoId)) {
                    avitoStatusLabel = "activated";
                } else if (oldIds.includes(vacancy.avitoId)) {
                    avitoStatusLabel = "archived";
                } else {
                    // Item might be blocked, rejected, or simply unchanged
                    // For now, if we can't find it in active or old, we skip updating its status
                    continue;
                }

                if (avitoStatusLabel === vacancy.avitoStatus) continue;

                const mapping = AVITO_STATUS_MAP[avitoStatusLabel];
                if (!mapping) continue;

                const localStatusChanged = mapping.localStatus !== vacancy.status;

                await prisma.vacancy.update({
                    where: { id: vacancy.id },
                    data: {
                        avitoStatus: avitoStatusLabel,
                        ...(localStatusChanged ? { status: mapping.localStatus as any } : {}),
                    }
                });

                await prisma.activity.create({
                    data: {
                        type: mapping.activityType,
                        details: mapping.message,
                        userId: session.user.id,
                        vacancyId: vacancy.id,
                    }
                });
            }
        } catch (err) {
            console.error("Bulk status sync failed:", err)
        }

        // --- Step 2: Sync applies for each vacancy ---
        let totalNew = 0
        let totalProcessed = 0

        for (const vacancy of vacancies) {
            try {
                const syncFrom = vacancy.lastSyncAt
                    ? vacancy.lastSyncAt.toISOString().slice(0, 10)
                    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

                const allApplyIds: string[] = []
                let cursor: string | undefined = undefined

                do {
                    const idsResponse = await avitoClient.getApplyIds({
                        updatedAtFrom: syncFrom,
                        vacancyIds: vacancy.avitoId!,
                        cursor,
                    }) as Record<string, unknown>

                    const ids = Array.isArray(idsResponse.applies)
                        ? (idsResponse.applies as Array<{ id: string }>).map(a => a.id)
                        : []

                    allApplyIds.push(...ids)
                    cursor = ids.length > 0 ? ids[ids.length - 1] : undefined
                    if (ids.length < 100) break
                } while (cursor)

                if (allApplyIds.length === 0) {
                    await prisma.vacancy.update({ where: { id: vacancy.id }, data: { lastSyncAt: new Date() } })
                    continue
                }

                // Batch fetch full apply data
                const BATCH_SIZE = 100
                const allApplies: Record<string, unknown>[] = []
                for (let i = 0; i < allApplyIds.length; i += BATCH_SIZE) {
                    const batch = allApplyIds.slice(i, i + BATCH_SIZE)
                    const batchData = await avitoClient.getAppliesByIds(batch) as Record<string, unknown>
                    const applies = Array.isArray(batchData.applies) ? batchData.applies as Record<string, unknown>[] : []
                    allApplies.push(...applies)
                }

                const applyIdsToMarkViewed: string[] = []

                for (const apply of allApplies) {
                    const applyIdStr = String(apply.id || apply.apply_id || "")
                    if (!applyIdStr || applyIdStr === "undefined") continue

                    const existing = await prisma.vacancyApplication.findUnique({
                        where: { avitoApplyId: applyIdStr }
                    })
                    if (existing) {
                        applyIdsToMarkViewed.push(applyIdStr)
                        continue
                    }

                    const applicant = apply.applicant as Record<string, unknown> || {}
                    const applicantName = applicant.name as string || "Имя не указано"
                    const applicantPhone = applicant.phone as string | null || null
                    const applicantEmail = applicant.email as string | null || null
                    const resume = apply.resume as Record<string, unknown> | null
                    const resumeLink = resume?.url as string | null || null
                    const resumeId = resume?.id ? String(resume.id) : null
                    const enrichedProps = apply.enriched_properties as Record<string, unknown> | null
                    const enrichedAge = enrichedProps?.age ? (enrichedProps.age as Record<string, unknown>)?.value as number | null : null
                    const enrichedCitizenship = enrichedProps?.citizenship ? (enrichedProps.citizenship as Record<string, unknown>)?.value as string | null : null
                    const enrichedGender = enrichedProps?.gender ? (enrichedProps.gender as Record<string, unknown>)?.value as string | null : null
                    const enrichedExperience = enrichedProps?.experience ? (enrichedProps.experience as Record<string, unknown>)?.value as string | null : null

                    const nameParts = applicantName.split(" ")
                    const firstName = nameParts[0]
                    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null

                    let candidateId: string | undefined
                    if (resumeId) {
                        const c = await prisma.candidate.findFirst({ where: { avitoResumeId: resumeId, organizationId: session.user.organizationId } })
                        if (c) candidateId = c.id
                    }
                    if (!candidateId && applicantPhone) {
                        const c = await prisma.candidate.findFirst({ where: { phone: applicantPhone, organizationId: session.user.organizationId } })
                        if (c) candidateId = c.id
                    }
                    if (!candidateId && applicantEmail) {
                        const c = await prisma.candidate.findFirst({ where: { email: applicantEmail, organizationId: session.user.organizationId } })
                        if (c) candidateId = c.id
                    }

                    if (!candidateId) {
                        const newCandidate = await prisma.candidate.create({
                            data: {
                                firstName, lastName, phone: applicantPhone, email: applicantEmail,
                                avitoResumeId: resumeId, resumeLink,
                                age: enrichedAge, citizenship: enrichedCitizenship, gender: enrichedGender, experienceYears: enrichedExperience,
                                organizationId: session.user.organizationId
                            }
                        })
                        candidateId = newCandidate.id
                        await prisma.activity.create({
                            data: { type: "CANDIDATE_CREATED", details: `Загружен из откликов Avito: ${applicantName}`, userId: session.user.id, candidateId, vacancyId: vacancy.id }
                        })
                    }

                    const existingBase = await prisma.vacancyApplication.findUnique({
                        where: { vacancyId_candidateId: { vacancyId: vacancy.id, candidateId: candidateId! } }
                    })
                    if (existingBase) {
                        await prisma.vacancyApplication.update({ where: { id: existingBase.id }, data: { avitoApplyId: applyIdStr, enrichedData: enrichedProps ? JSON.parse(JSON.stringify(enrichedProps)) : undefined } })
                    } else {
                        await prisma.vacancyApplication.create({
                            data: { vacancyId: vacancy.id, candidateId: candidateId!, avitoApplyId: applyIdStr, enrichedData: enrichedProps ? JSON.parse(JSON.stringify(enrichedProps)) : undefined, status: "NEW" }
                        })
                        totalNew++
                    }
                    applyIdsToMarkViewed.push(applyIdStr)
                    totalProcessed++
                }

                // Mark viewed on Avito
                if (applyIdsToMarkViewed.length > 0) {
                    try {
                        for (let i = 0; i < applyIdsToMarkViewed.length; i += 100) {
                            await avitoClient.setAppliesViewed(
                                applyIdsToMarkViewed.slice(i, i + 100).map(id => ({ id, is_viewed: true }))
                            )
                        }
                        await prisma.vacancyApplication.updateMany({
                            where: { avitoApplyId: { in: applyIdsToMarkViewed } },
                            data: { isViewedOnAvito: true }
                        })
                    } catch (err) {
                        console.error(`Mark viewed failed for vacancy ${vacancy.id}:`, err)
                    }
                }

                await prisma.vacancy.update({ where: { id: vacancy.id }, data: { lastSyncAt: new Date() } })
            } catch (err) {
                console.error(`Failed to sync vacancy ${vacancy.id}:`, err)
                // Continue with other vacancies
            }
        }

        return NextResponse.json({
            success: true,
            vacanciesSynced: vacancies.length,
            newApplies: totalNew,
            totalProcessed,
        })
    } catch (error) {
        console.error("[AVITO_SYNC_ALL_POST]", error)
        return new NextResponse(
            error instanceof Error ? error.message : "Internal Error",
            { status: 500 }
        )
    }
}
