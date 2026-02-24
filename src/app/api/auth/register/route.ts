import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, email, password } = body

        if (!name || !email || !password) {
            return new NextResponse("Missing required fields", { status: 400 })
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return new NextResponse("User with this email already exists", { status: 409 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        // Generate placeholder organization name
        const orgName = `Личный кабинет - ${name.substring(0, 20)}`

        // Use Prisma transaction to create organization and master user reliably
        const newUser = await prisma.$transaction(async (tx) => {
            // Check if organization name is magically taken (unlikely, but safe)
            let finalOrgName = orgName
            const existingOrg = await tx.organization.findUnique({
                where: { name: finalOrgName }
            })
            if (existingOrg) {
                finalOrgName = `${orgName} (${Date.now()})`
            }

            const newOrganization = await tx.organization.create({
                data: {
                    name: finalOrgName,
                }
            })

            const user = await tx.user.create({
                data: {
                    email,
                    name,
                    hashedPassword,
                    role: "MASTER", // The creator is the MASTER of the new organization
                    organizationId: newOrganization.id
                }
            })

            return user
        })

        return NextResponse.json({
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        }, { status: 201 })

    } catch (error) {
        console.error("Registration error:", error)
        return new NextResponse("Internal server error", { status: 500 })
    }
}
