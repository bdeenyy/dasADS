import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ candidateId: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { candidateId } = await params

        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId },
            include: {
                applications: {
                    include: {
                        vacancy: { select: { id: true, title: true, status: true } }
                    },
                    orderBy: { updatedAt: "desc" }
                }
            }
        })

        if (!candidate || candidate.organizationId !== session.user.organizationId) {
            return new NextResponse("Not Found", { status: 404 })
        }

        // Get activities for this candidate
        const activities = await prisma.activity.findMany({
            where: {
                candidateId: candidateId,
                user: { organizationId: session.user.organizationId }
            },
            include: {
                user: { select: { name: true, email: true } },
                vacancy: { select: { title: true } }
            },
            orderBy: { createdAt: "desc" },
            take: 20
        })

        return NextResponse.json({ ...candidate, activities })
    } catch (error) {
        console.error("[CANDIDATE_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ candidateId: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { candidateId } = await params
        const body = await req.json()
        const { firstName, lastName, phone, email, resumeLink } = body

        if (!firstName) {
            return new NextResponse("First Name is required", { status: 400 })
        }

        const existing = await prisma.candidate.findUnique({ where: { id: candidateId } })
        if (!existing || existing.organizationId !== session.user.organizationId) {
            return new NextResponse("Not Found", { status: 404 })
        }

        const candidate = await prisma.candidate.update({
            where: { id: candidateId },
            data: { firstName, lastName, phone, email, resumeLink }
        })

        return NextResponse.json(candidate)
    } catch (error) {
        console.error("[CANDIDATE_PUT]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ candidateId: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { candidateId } = await params

        const existing = await prisma.candidate.findUnique({ where: { id: candidateId } })
        if (!existing || existing.organizationId !== session.user.organizationId) {
            return new NextResponse("Not Found", { status: 404 })
        }

        await prisma.candidate.delete({ where: { id: candidateId } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[CANDIDATE_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
