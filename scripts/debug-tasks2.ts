import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const oldEmail = "dipti.magicscale@gmail.com";
  const newEmail = "dipti.singh@kravy.in";

  const byEmail = await prisma.task.findMany({
    where: {
      OR: [
        { assigneeEmail: oldEmail },
        { assignerEmail: oldEmail },
        { createdByEmail: oldEmail },
        { assigneeEmail: newEmail },
        { assignerEmail: newEmail },
        { createdByEmail: newEmail }
      ]
    },
    select: { id: true, assigneeEmail: true, assignerEmail: true, assigneeId: true, assigneeIds: true, createdByEmail: true, createdByClerkId: true }
  });
  
  console.log(`Found ${byEmail.length} tasks by email reference`);
  console.log(JSON.stringify(byEmail.slice(0, 5), null, 2));

  // Let's also check if there are string name references
  const byName = await prisma.task.count({
    where: { assigneeName: "Dipti Singh" }
  });
  console.log(`Tasks with assigneeName 'Dipti Singh': ${byName}`);

  // check if assigneeId was wrong or missing
}

main().catch(console.error).finally(() => prisma.$disconnect());
