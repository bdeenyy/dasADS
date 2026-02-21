import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

import { avitoClient } from "@/lib/avito"

export async function GET() {
    const session = await auth()
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const vacancies = await prisma.vacancy.findMany({
            where: {
                customer: {
                    organizationId: session.user.organizationId,
                }
            },
            include: {
                customer: true,
                owner: {
                    select: { name: true, email: true }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
        })
        return NextResponse.json(vacancies)
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

        const data: any = {
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
            ownerId: ownerId || session.user.id,
            avitoConfig: avitoConfig || null
        }

        // Try to publish to Avito if requested
        if (publishToAvito && avitoConfig) {
            try {
                // Here we would map our data to the Avito 'VacancyCreate' format
                // For now, we assume avitoConfig already contains the proper mapped fields or we merge them
                const avitoPayload = {
                    title,
                    description,
                    ...avitoConfig
                }
                const avitoResponse = await avitoClient.publishVacancy(avitoPayload)
                data.avitoId = avitoResponse.id || null
                data.avitoStatus = "PUBLISHED"
            } catch (err: any) {
                console.error("Failed to publish to Avito:", err)
                data.avitoStatus = "ERROR"
                // Store the error in config or log it
            }
        }

        const vacancy = await prisma.vacancy.create({
            data,
        })

        return NextResponse.json(vacancy)
    } catch (error) {
        console.error("[VACANCIES_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
