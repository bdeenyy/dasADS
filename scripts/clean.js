const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  const result = await prisma.vacancy.deleteMany({
    where: {
      avitoId: { not: null },
      createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } // last 30 mins
    }
  });
  console.log('Deleted:', result.count);
}
clean();
