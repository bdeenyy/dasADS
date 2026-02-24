/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // Create a demo organization
    const org = await prisma.organization.upsert({
        where: { name: 'Demo Organization' },
        update: {},
        create: {
            name: 'Demo Organization',
        },
    })

    // Create a master user for demo org
    const hashedPassword = await bcrypt.hash('password123', 10)

    const masterUser = await prisma.user.upsert({
        where: { email: 'admin@demo.com' },
        update: {},
        create: {
            email: 'admin@demo.com',
            name: 'Admin User',
            hashedPassword,
            role: 'MASTER',
            organizationId: org.id,
        },
    })

    console.log('Database seeded successfully!')
    console.log({
        Organization: org.name,
        User: masterUser.email,
        Role: masterUser.role,
        Password: 'password123'
    })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
