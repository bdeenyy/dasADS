import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await auth()
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const orgId = session.user.organizationId

    try {
        // Active vacancies count
        const activeVacancies = await prisma.vacancy.count({
            where: {
                customer: { organizationId: orgId },
                status: "ACTIVE",
                ...(session.user.role === 'RECRUITER' ? { ownerId: session.user.id } : {})
            }
        })

        // Total vacancies count
        const totalVacancies = await prisma.vacancy.count({
            where: {
                customer: { organizationId: orgId },
                ...(session.user.role === 'RECRUITER' ? { ownerId: session.user.id } : {})
            }
        })

        // New candidates in last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const newCandidates = await prisma.candidate.count({
            where: {
                organizationId: orgId,
                createdAt: { gte: sevenDaysAgo }
            }
        })

        // Total candidates
        const totalCandidates = await prisma.candidate.count({
            where: { organizationId: orgId }
        })

        // Candidates at INTERVIEW stage
        const interviewCount = await prisma.vacancyApplication.count({
            where: {
                status: "INTERVIEW",
                vacancy: {
                    customer: { organizationId: orgId }
                }
            }
        })

        // Customers count
        const customersCount = await prisma.customer.count({
            where: { organizationId: orgId }
        })

        return NextResponse.json({
            activeVacancies,
            totalVacancies,
            newCandidates,
            totalCandidates,
            interviewCount,
            customersCount,
        })
    } catch (error) {
        console.error("[STATS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
