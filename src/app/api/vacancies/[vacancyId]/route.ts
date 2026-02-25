import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { canEditVacancy } from "@/lib/rbac"
import { Role } from "@prisma/client"
import { NextResponse } from "next/server"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ vacancyId: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { vacancyId } = await params

        const vacancy = await prisma.vacancy.findUnique({
            where: { id: vacancyId },
            include: {
                customer: true,
                owner: {
                    select: { name: true, email: true }
                },
                applications: {
                    include: {
                        candidate: true
                    }
                }
            }
        })

        if (!vacancy || vacancy.customer.organizationId !== session.user.organizationId) {
            return new NextResponse("Not Found", { status: 404 })
        }

        // RECRUITER can only see their own vacancies
        if (session.user.role === 'RECRUITER' && vacancy.ownerId !== session.user.id) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        return NextResponse.json(vacancy)
    } catch (error) {
        console.error("[VACANCY_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ vacancyId: string }> }
) {
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

        const { vacancyId } = await params;

        // Verify vacancy exists and belongs to user's org
        const existingVacancy = await prisma.vacancy.findUnique({
            where: { id: vacancyId },
            include: { customer: true }
        })

        if (!existingVacancy || existingVacancy.customer.organizationId !== session.user.organizationId) {
            return new NextResponse("Not Found", { status: 404 })
        }

        const isOwner = existingVacancy.ownerId === session.user.id
        if (!canEditVacancy(session.user.role as Role, isOwner)) {
            return new NextResponse("Forbidden - Insufficient permissions to edit this vacancy", { status: 403 })
        }

        // Verify new customer also belongs to user's org (if changed)
        if (existingVacancy.customerId !== customerId) {
            const checkCustomer = await prisma.customer.findUnique({ where: { id: customerId } })
            if (!checkCustomer || checkCustomer.organizationId !== session.user.organizationId) {
                return new NextResponse("Invalid Customer", { status: 403 })
            }
        }

        // Validate ownerId based on role
        let finalOwnerId = existingVacancy.ownerId
        if (ownerId && (session.user.role === 'MASTER' || session.user.role === 'MANAGER')) {
            finalOwnerId = ownerId
        }

        const vacancy = await prisma.vacancy.update({
            where: {
                id: vacancyId,
            },
            data: {
                title,
                description,
                salaryMin: salaryMin ? parseInt(salaryMin) : null,
                salaryMax: salaryMax ? parseInt(salaryMax) : null,
                experience,
                workFormat,
                employmentType,
                city,
                skills: skills || [],
                status: status || existingVacancy.status,
                customerId,
                ownerId: finalOwnerId,
                avitoConfig: avitoConfig || null,
            },
        })

        // Try to publish/update on Avito if requested
        if (publishToAvito && avitoConfig) {
            try {
                const { createAvitoClient } = await import("@/lib/avito")
                const { mapVacancyToAvito } = await import("@/lib/avito-mapper")
                const avitoClient = await createAvitoClient(session.user.organizationId)
                const avitoPayload = mapVacancyToAvito(
                    { id: vacancyId, title, description, salaryMin, salaryMax, experience, employmentType, city },
                    avitoConfig as Record<string, string>
                )

                if (existingVacancy.avitoId) {
                    // Update existing Avito listing
                    await avitoClient.updateVacancy(existingVacancy.avitoId, avitoPayload)
                    await prisma.vacancy.update({
                        where: { id: vacancyId },
                        data: {
                            avitoStatus: "PUBLISHED",
                            ...(existingVacancy.status === "DRAFT" ? { status: "ACTIVE" } : {})
                        }
                    })
                } else {
                    // Create new listing on Avito
                    const avitoResponse = await avitoClient.publishVacancy(avitoPayload) as { id?: string }
                    await prisma.vacancy.update({
                        where: { id: vacancyId },
                        data: {
                            avitoId: avitoResponse.id || null,
                            avitoStatus: "PUBLISHED",
                            ...(existingVacancy.status === "DRAFT" ? { status: "ACTIVE" } : {})
                        }
                    })
                }
            } catch (err: unknown) {
                console.error("Failed to update on Avito:", err)
                await prisma.vacancy.update({
                    where: { id: vacancyId },
                    data: { avitoStatus: "ERROR" }
                })

                // Return descriptive error so the client UI shows the validation failure
                return new NextResponse(err instanceof Error ? err.message : "Ошибка публикации на Авито", { status: 400 })
            }
        }

        // Handle Archiving/Closing: Deactivate on Avito if it was published
        if (status && (status === "ARCHIVED" || status === "CLOSED") && existingVacancy.avitoId && existingVacancy.avitoStatus !== "ARCHIVED") {
            try {
                const { createAvitoClient } = await import("@/lib/avito")
                const avitoClient = await createAvitoClient(session.user.organizationId)
                await avitoClient.deactivateVacancy(existingVacancy.avitoId)

                await prisma.vacancy.update({
                    where: { id: vacancyId },
                    data: { avitoStatus: "ARCHIVED" }
                })
            } catch (err) {
                console.error("Failed to deactivate on Avito during status change:", err)
            }
        }

        return NextResponse.json(vacancy)
    } catch (error: unknown) {
        console.error("[VACANCY_PUT]", error)
        return new NextResponse(error instanceof Error ? error.message : "Internal Error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ vacancyId: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    // Only MASTER and MANAGER can delete vacancies
    if (session.user.role === 'RECRUITER') {
        return new NextResponse("Forbidden - Insufficient permissions", { status: 403 })
    }

    try {
        const { vacancyId } = await params;

        const existingVacancy = await prisma.vacancy.findUnique({
            where: { id: vacancyId },
            include: { customer: true }
        })

        if (!existingVacancy || existingVacancy.customer.organizationId !== session.user.organizationId) {
            return new NextResponse("Not Found", { status: 404 })
        }

        // Deactivate on Avito first if published
        if (existingVacancy.avitoId) {
            try {
                const { createAvitoClient } = await import("@/lib/avito")
                const avitoClient = await createAvitoClient(session.user.organizationId)
                await avitoClient.deactivateVacancy(existingVacancy.avitoId)
            } catch (err) {
                console.error("Failed to deactivate on Avito (proceeding with delete):", err)
            }
        }

        const vacancy = await prisma.vacancy.delete({
            where: {
                id: vacancyId,
            },
        })

        return NextResponse.json(vacancy)
    } catch (error) {
        console.error("[VACANCY_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
