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

    try {
        const whereClause: any = {
            organizationId: session.user.organizationId,
        }

        // If filtering by specific vacancy
        if (vacancyId) {
            whereClause.applications = {
                some: {
                    vacancyId: vacancyId
                }
            }
        }

        const candidates = await prisma.candidate.findMany({
            where: whereClause,
            include: {
                applications: {
                    include: {
                        vacancy: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
        })
        return NextResponse.json(candidates)
    } catch (error) {
        console.error("[CANDIDATES_GET]", error)
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
        const { firstName, lastName, phone, email, resumeLink, avitoResumeId, vacancyId } = body

        if (!firstName) {
            return new NextResponse("First Name is required", { status: 400 })
        }

        // Create the candidate
        const candidate = await prisma.candidate.create({
            data: {
                firstName,
                lastName,
                phone,
                email,
                resumeLink,
                avitoResumeId,
                organizationId: session.user.organizationId,
                // Optionally link to a vacancy immediately if provided
                ...(vacancyId && {
                    applications: {
                        create: {
                            vacancyId,
                            status: "NEW"
                        }
                    }
                })
            },
            include: {
                applications: true
            }
        })

        // Log activity
        await prisma.activity.create({
            data: {
                type: "CANDIDATE_CREATED",
                details: `Added new candidate: ${firstName} ${lastName || ''}`,
                userId: session.user.id,
                candidateId: candidate.id,
                vacancyId: vacancyId || null
            }
        })

        return NextResponse.json(candidate)
    } catch (error) {
        console.error("[CANDIDATES_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
