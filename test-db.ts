import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.attendance.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log("Last 5 attendances:", JSON.stringify(records, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
