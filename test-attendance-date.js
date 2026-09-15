const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const records = await prisma.attendance.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(records.map(r => ({
    id: r.id,
    date: r.date.toISOString(),
    checkIn: r.checkIn ? r.checkIn.toISOString() : null,
  })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
