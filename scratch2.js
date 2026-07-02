const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tasks = await prisma.task.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' }
  });
  const afeTasks = tasks.filter(t => t.customFields && t.customFields.afe !== undefined);
  console.log(`Found ${afeTasks.length} tasks with an 'afe' field.`);
  if (afeTasks.length > 0) {
    console.log("Example:", afeTasks[0].customFields.afe);
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
