import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await auth()
    if (!session?.user || session.user.role !== 'MASTER') {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const organization = await prisma.organization.findUnique({
            where: { id: session.user.organizationId },
            select: {
                id: true,
                name: true,
                avitoClientId: true,
                avitoClientSecret: true,
            }
        })
        return NextResponse.json(organization)
    } catch (error) {
        console.error("[ORG_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PUT(req: Request) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'MASTER') {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const body = await req.json()
        const { name, avitoClientId, avitoClientSecret } = body

        if (!name) {
            return new NextResponse("Name is required", { status: 400 })
        }

        const organization = await prisma.organization.update({
            where: { id: session.user.organizationId },
            data: {
                name,
                avitoClientId,
                avitoClientSecret
            },
            select: {
                id: true,
                name: true,
                avitoClientId: true,
                avitoClientSecret: true,
            }
        })

        return NextResponse.json(organization)
    } catch (error) {
        console.error("[ORG_PUT]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
