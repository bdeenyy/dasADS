const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    await prisma.candidate.deleteMany({
        where: { firstName: 'Имя не указано' }
    });
    console.log('Deleted candidates with no names');
}
check();
