import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function GET() {
    const session = await auth()

    // MASTER and MANAGER can view users
    if (!session?.user || session.user.role === 'RECRUITER') {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const users = await prisma.user.findMany({
            where: {
                organizationId: session.user.organizationId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        })
        return NextResponse.json(users)
    } catch (error) {
        console.error("[USERS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()

    // Only MASTER can create new users
    if (!session?.user || session.user.role !== 'MASTER') {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const body = await req.json()
        const { name, email, password, role } = body

        if (!name || !email || !password || !role) {
            return new NextResponse("Missing required fields", { status: 400 })
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return new NextResponse("User with this email already exists", { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                name,
                email,
                hashedPassword,
                role,
                organizationId: session.user.organizationId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error("[USERS_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
