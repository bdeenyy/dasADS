import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const session = await auth()
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    try {
        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where: {
                    organizationId: session.user.organizationId,
                },
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take: limit
            }),
            prisma.customer.count({
                where: { organizationId: session.user.organizationId }
            })
        ])

        return NextResponse.json({
            data: customers,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error("[CUSTOMERS_GET]", error)
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
        const { name, inn, contactPerson, contactEmail, contactPhone } = body

        if (!name) {
            return new NextResponse("Name is required", { status: 400 })
        }

        const customer = await prisma.customer.create({
            data: {
                name,
                inn,
                contactPerson,
                contactEmail,
                contactPhone,
                organizationId: session.user.organizationId,
            },
        })

        return NextResponse.json(customer)
    } catch (error) {
        console.error("[CUSTOMERS_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
