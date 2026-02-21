import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ customerId: string }> }
) {
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

        const { customerId } = await params;

        // Ensure the customer belongs to the user's organization
        const existingCustomer = await prisma.customer.findUnique({
            where: { id: customerId }
        })

        if (!existingCustomer || existingCustomer.organizationId !== session.user.organizationId) {
            return new NextResponse("Not Found", { status: 404 })
        }

        const customer = await prisma.customer.update({
            where: {
                id: customerId,
            },
            data: {
                name,
                inn,
                contactPerson,
                contactEmail,
                contactPhone,
            },
        })

        return NextResponse.json(customer)
    } catch (error) {
        console.error("[CUSTOMER_PUT]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ customerId: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { customerId } = await params;

        const existingCustomer = await prisma.customer.findUnique({
            where: { id: customerId }
        })

        if (!existingCustomer || existingCustomer.organizationId !== session.user.organizationId) {
            return new NextResponse("Not Found", { status: 404 })
        }

        const customer = await prisma.customer.delete({
            where: {
                id: customerId,
            },
        })

        return NextResponse.json(customer)
    } catch (error) {
        console.error("[CUSTOMER_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
