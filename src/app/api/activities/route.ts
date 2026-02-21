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

    try {
        const whereClause: any = {
            // Activities should be inherently bound to the org via user or target
            user: {
                organizationId: session.user.organizationId
            }
        }

        if (vacancyId) whereClause.vacancyId = vacancyId
        if (candidateId) whereClause.candidateId = candidateId
        if (customerId) whereClause.customerId = customerId

        const activities = await prisma.activity.findMany({
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
            take: 50
        })

        return NextResponse.json(activities)
    } catch (error) {
        console.error("[ACTIVITIES_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
