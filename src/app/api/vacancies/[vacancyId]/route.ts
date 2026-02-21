import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

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
            skills, status, customerId
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

        // Verify new customer also belongs to user's org (if changed)
        if (existingVacancy.customerId !== customerId) {
            const checkCustomer = await prisma.customer.findUnique({ where: { id: customerId } })
            if (!checkCustomer || checkCustomer.organizationId !== session.user.organizationId) {
                return new NextResponse("Invalid Customer", { status: 403 })
            }
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
                status: status || "DRAFT",
                customerId,
            },
        })

        return NextResponse.json(vacancy)
    } catch (error) {
        console.error("[VACANCY_PUT]", error)
        return new NextResponse("Internal Error", { status: 500 })
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
