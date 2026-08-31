import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testTopSeller() {
  const month = "2026-08";
  const startDate = new Date(`${month}-01T00:00:00.000Z`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const topSellers = await prisma.task.groupBy({
    by: ['assignerId', 'assignerName'],
    where: {
      createdAt: { gte: startDate, lt: endDate },
      assignerId: { not: null },
    },
    _sum: {
      amount: true
    },
    orderBy: {
      _sum: {
        amount: 'desc'
      }
    },
    take: 1
  });

  console.log(JSON.stringify(topSellers, null, 2));
}

testTopSeller().catch(console.error).finally(() => prisma.$disconnect());
