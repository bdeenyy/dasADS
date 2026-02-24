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
    const candidateId = searchParams.get("candidateId")
    const customerId = searchParams.get("customerId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    try {
        const whereClause: Record<string, unknown> = {
            // Activities should be inherently bound to the org via user or target
            user: {
                organizationId: session.user.organizationId
            }
        }

        if (vacancyId) whereClause.vacancyId = vacancyId
        if (candidateId) whereClause.candidateId = candidateId
        if (customerId) whereClause.customerId = customerId

        const [activities, total] = await Promise.all([
            prisma.activity.findMany({
                where: whereClause,
                include: {
                    user: {
                        select: { name: true, email: true }
                    },
                    candidate: {
                        select: { firstName: true, lastName: true }
                    },
                    vacancy: {
                        select: { title: true }
                    }
                },
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take: limit
            }),
            prisma.activity.count({ where: whereClause })
        ])

        return NextResponse.json({
            data: activities,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error("[ACTIVITIES_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
