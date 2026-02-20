require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
})

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10)

    const org = await prisma.organization.upsert({
        where: { name: 'Recruiting HQ' },
        update: {},
        create: {
            name: 'Recruiting HQ',
            users: {
                create: {
                    email: 'admin@recruiting.hq',
                    name: 'Super Admin',
                    role: 'MASTER',
                    hashedPassword,
                },
            },
        },
    })

    console.log({ org })
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
