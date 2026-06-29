import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const byAssignerName = await prisma.task.count({
    where: { assignerName: "Dipti Singh" }
  });
  console.log(`Tasks with assignerName 'Dipti Singh': ${byAssignerName}`);

  const byCreatorName = await prisma.task.count({
    where: { createdByName: "Dipti Singh" }
  });
  console.log(`Tasks with createdByName 'Dipti Singh': ${byCreatorName}`);

  // check if 'Dipti' appears anywhere in any assignee/creator fields
  const byPartialName = await prisma.task.findMany({
    where: {
      OR: [
        { assigneeName: { contains: "Dipti", mode: "insensitive" } },
        { assignerName: { contains: "Dipti", mode: "insensitive" } },
        { createdByName: { contains: "Dipti", mode: "insensitive" } },
      ]
    },
    select: { id: true, assigneeName: true, assignerName: true, createdByName: true }
  });
  console.log(`Tasks with any 'Dipti' name match: ${byPartialName.length}`);

  // What is the total number of tasks in the system?
  const totalTasks = await prisma.task.count();
  console.log(`Total tasks in system: ${totalTasks}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
