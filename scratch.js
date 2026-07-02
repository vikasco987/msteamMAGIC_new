const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const task = await prisma.task.findFirst({
    where: {
      OR: [
        { title: { contains: "Printer", mode: "insensitive" } },
        { title: { contains: "Software", mode: "insensitive" } }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(task?.customFields, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
