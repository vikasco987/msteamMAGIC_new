import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Update all records where the date ends in 'T18:30:00.000Z'
  const records = await prisma.attendance.findMany();
  let count = 0;
  for (const r of records) {
    if (r.date.toISOString().endsWith('T18:30:00.000Z')) {
      const correctDate = new Date(r.date.getTime() - 24 * 60 * 60 * 1000);
      await prisma.attendance.update({
        where: { id: r.id },
        data: { date: correctDate }
      });
      count++;
    }
  }
  console.log(`Successfully fixed ${count} attendance records that were off by 1 day!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
