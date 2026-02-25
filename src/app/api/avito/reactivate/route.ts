import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { createAvitoClient } from "@/lib/avito"

/**
 * POST /api/avito/reactivate
 * Реактивирует (продлевает) вакансию на Avito, если она в архиве/истекла.
 */
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
        })

        if (!vacancy) {
            return new NextResponse("Vacancy not found", { status: 404 })
        }

        if (!vacancy.avitoId) {
            return new NextResponse("Vacancy is not published on Avito", { status: 400 })
        }

        // Only allow reactivation if currently archived/expired
        const reactivatableStatuses = ["archived", "expired", "closed"]
        if (vacancy.avitoStatus && !reactivatableStatuses.includes(vacancy.avitoStatus)) {
            return new NextResponse(
                `Невозможно реактивировать вакансию со статусом "${vacancy.avitoStatus}"`,
                { status: 400 }
            )
        }

        const avitoClient = await createAvitoClient(session.user.organizationId)
        await avitoClient.prolongateVacancy(vacancy.avitoId)

        // Update local status
        const updated = await prisma.vacancy.update({
            where: { id: vacancyId },
            data: {
                status: "ACTIVE",
                avitoStatus: "activated",
            }
        })

        // Log the reactivation
        await prisma.activity.create({
            data: {
                type: "AVITO_STATUS",
                details: "Вакансия реактивирована на Avito",
                userId: session.user.id,
                vacancyId: vacancy.id,
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("[AVITO_REACTIVATE_POST]", error)
        return new NextResponse(
            error instanceof Error ? error.message : "Internal Error",
            { status: 500 }
        )
    }
}
