const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tasks = await prisma.task.findMany({
    where: {
      amount: 4631
    }
  });
  console.log("Tasks with 4631:", tasks);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
