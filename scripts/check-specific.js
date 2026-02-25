const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const v = await prisma.vacancy.findUnique({ where: { avitoId: "7931154562" } });
  console.log("Vacancy 7931154562 in DB:", v);
}
check();
