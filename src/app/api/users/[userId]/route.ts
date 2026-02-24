import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'MASTER') {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { userId } = await params
        const body = await req.json()
        const { role } = body

        if (!role || !['MASTER', 'MANAGER', 'RECRUITER'].includes(role)) {
            return new NextResponse("Invalid role", { status: 400 })
        }

        // Cannot change own role
        if (userId === session.user.id) {
            return new NextResponse("Cannot change your own role", { status: 400 })
        }

        const existing = await prisma.user.findUnique({ where: { id: userId } })
        if (!existing || existing.organizationId !== session.user.organizationId) {
            return new NextResponse("Not Found", { status: 404 })
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: { id: true, name: true, email: true, role: true }
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error("[USER_PUT]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'MASTER') {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { userId } = await params

        // Cannot delete self
        if (userId === session.user.id) {
            return new NextResponse("Cannot delete yourself", { status: 400 })
        }

        const existing = await prisma.user.findUnique({ where: { id: userId } })
        if (!existing || existing.organizationId !== session.user.organizationId) {
            return new NextResponse("Not Found", { status: 404 })
        }

        await prisma.user.delete({ where: { id: userId } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[USER_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
