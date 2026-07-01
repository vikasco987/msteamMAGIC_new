const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const tasks = await prisma.task.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
  tasks.forEach(t => {
    console.log(`Task: ${t.title}`);
  });
  process.exit(0);
}
run();
