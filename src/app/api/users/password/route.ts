import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function PUT(req: Request) {
    const session = await auth()
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const body = await req.json()
        const { currentPassword, newPassword } = body

        if (!currentPassword || !newPassword) {
            return new NextResponse("Current and new passwords are required", { status: 400 })
        }

        if (newPassword.length < 6) {
            return new NextResponse("New password must be at least 6 characters", { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        })

        if (!user || !user.hashedPassword) {
            return new NextResponse("User not found", { status: 404 })
        }

        const isValid = await bcrypt.compare(currentPassword, user.hashedPassword)
        if (!isValid) {
            return new NextResponse("Текущий пароль неверный", { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await prisma.user.update({
            where: { id: session.user.id },
            data: { hashedPassword }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[PASSWORD_PUT]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
