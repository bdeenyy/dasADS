import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

import { createAvitoClient } from "@/lib/avito"

export async function GET(req: Request) {
    const session = await auth()
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    try {
        const queryWhere: Record<string, unknown> = {
            customer: {
                organizationId: session.user.organizationId,
            }
        }

        // If RECRUITER, only show vacancies owned by them
        if (session.user.role === 'RECRUITER') {
            queryWhere.ownerId = session.user.id;
        }

        const [vacancies, total] = await Promise.all([
            prisma.vacancy.findMany({
                where: queryWhere,
                include: {
                    customer: true,
                    owner: {
                        select: { name: true, email: true }
                    }
                },
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take: limit
            }),
            prisma.vacancy.count({ where: queryWhere })
        ])

        return NextResponse.json({
            data: vacancies,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error("[VACANCIES_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const body = await req.json()
        const {
            title, description, salaryMin, salaryMax,
            experience, workFormat, employmentType, city,
            skills, status, customerId, ownerId, avitoConfig, publishToAvito
        } = body

        if (!title || !customerId) {
            return new NextResponse("Title and Customer are required", { status: 400 })
        }

        // Verify the customer belongs to the user's organization
        const customer = await prisma.customer.findUnique({
            where: { id: customerId }
        })

        if (!customer || customer.organizationId !== session.user.organizationId) {
            return new NextResponse("Invalid Customer", { status: 403 })
        }

        // Validate ownerId based on role
        let finalOwnerId = session.user.id
        if (ownerId && (session.user.role === 'MASTER' || session.user.role === 'MANAGER')) {
            finalOwnerId = ownerId
        }

        const data: Prisma.VacancyUncheckedCreateInput = {
            title,
            description,
            salaryMin: salaryMin ? parseInt(salaryMin) : null,
            salaryMax: salaryMax ? parseInt(salaryMax) : null,
            experience,
            workFormat,
            employmentType,
            city,
            skills: skills || [],
            status: status || "DRAFT",
            customerId,
            ownerId: finalOwnerId,
            avitoConfig: avitoConfig || null
        }

        // Try to publish to Avito if requested
        if (publishToAvito && avitoConfig) {
            try {
                const { mapVacancyToAvito } = await import("@/lib/avito-mapper")
                const avitoClient = await createAvitoClient(session.user.organizationId)
                const avitoPayload = mapVacancyToAvito(
                    { id: 'new', title, description, salaryMin, salaryMax, experience, employmentType, city },
                    avitoConfig as Record<string, string>
                )
                const avitoResponse = await avitoClient.publishVacancy(avitoPayload) as { id?: number };
                data.avitoId = avitoResponse.id || null
                data.avitoStatus = "PUBLISHED"
            } catch (err: unknown) {
                console.error("Failed to publish to Avito:", err)
                data.avitoStatus = "ERROR"
            }
        }

        const vacancy = await prisma.vacancy.create({
            data,
        })

        return NextResponse.json(vacancy)
    } catch (error: unknown) {
        console.error("[VACANCIES_POST]", error)
        return new NextResponse(error instanceof Error ? error.message : "Internal Error", { status: 500 })
    }
}
