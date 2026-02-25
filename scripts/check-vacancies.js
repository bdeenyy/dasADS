const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const vacancies = await prisma.vacancy.findMany({
    where: { avitoId: { not: null } },
    select: { id: true, title: true, avitoId: true, avitoStatus: true, status: true, createdAt: true }
  });
  console.log(JSON.stringify(vacancies, null, 2));
}
check();
