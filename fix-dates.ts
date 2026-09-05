import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.attendance.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  
  console.log("Recent records:");
  for (const r of records) {
     console.log(`ID: ${r.id}, User: ${r.employeeName || r.userId}, CreatedAt: ${r.createdAt.toISOString()}, Date: ${r.date.toISOString()}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
