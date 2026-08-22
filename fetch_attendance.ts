import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const attendances = await prisma.attendance.findMany({
    take: 50,
    orderBy: {
      createdAt: 'desc'
    }
  });
  console.log(JSON.stringify(attendances, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
