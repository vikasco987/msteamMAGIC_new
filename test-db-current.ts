import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const records = await prisma.attendance.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(records.map(r => ({ id: r.id, createdAt: r.createdAt.toISOString(), date: r.date.toISOString(), user: r.employeeName })));
}
main().finally(() => prisma.$disconnect());
