import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const targetDateStr = "2026-09-05";
  const currentMonthStart = new Date(targetDateStr);
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);

  const endOfCurrentMonth = new Date(currentMonthStart);
  endOfCurrentMonth.setMonth(endOfCurrentMonth.getMonth() + 1);

  const thisMonthAttendances = await prisma.attendance.findMany({
    where: {
      date: { gte: currentMonthStart, lt: endOfCurrentMonth }
    },
    select: { userId: true },
    distinct: ['userId']
  });
  const activeUserIdsThisMonth = new Set(thisMonthAttendances.map(a => a.userId));
  console.log("Active users this month:", Array.from(activeUserIdsThisMonth));
}

main().catch(console.error).finally(() => prisma.$disconnect());
