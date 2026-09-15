import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  console.log("Starting Benchmark...");
  const t0 = performance.now();
  
  // Overview query simulation (current month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  const overviewStart = performance.now();
  await prisma.task.findMany({
    where: { createdAt: { gte: startOfMonth, lt: startOfNextMonth } },
    select: { amount: true, received: true }
  });
  console.log(`Overview DB Query: ${(performance.now() - overviewStart).toFixed(2)}ms`);

  // Day Report query simulation (all time)
  const dayStart = performance.now();
  await prisma.task.findMany({
    select: { createdAt: true, amount: true, received: true }
  });
  console.log(`Day Report DB Query (all-time): ${(performance.now() - dayStart).toFixed(2)}ms`);

  console.log("Done.");
}
run().finally(() => prisma.$disconnect());
