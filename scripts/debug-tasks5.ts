import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const oldMongoId = "69b04bc62c36b34d3f896588";
  
  const tasks = await prisma.task.count({ where: { assigneeId: oldMongoId } });
  console.log("Tasks with oldMongoId:", tasks);

  const forms = await prisma.formResponse.count({ where: { submittedBy: oldMongoId } });
  console.log("FormResponses with oldMongoId:", forms);
}

main().catch(console.error).finally(() => prisma.$disconnect());
