import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const oldEmail = "dipti.magicscale@gmail.com";
  const newEmail = "dipti.singh@kravy.in";
  
  const oldUser = await prisma.user.findUnique({ where: { email: oldEmail } });
  const newUser = await prisma.user.findUnique({ where: { email: newEmail } });
  
  const oldId = oldUser?.clerkId;
  const newId = newUser?.clerkId;

  if (oldId) {
    const oldAssignedTo = await prisma.formResponse.count({ where: { assignedTo: { has: oldId } } });
    const oldVisible = await prisma.formResponse.count({ where: { visibleToUsers: { has: oldId } } });
    const oldSubmitted = await prisma.formResponse.count({ where: { submittedBy: oldId } });
    console.log(`Responses still on old ID -> AssignedTo: ${oldAssignedTo}, Visible: ${oldVisible}, Submitted: ${oldSubmitted}`);
  }

  if (newId) {
    const newAssignedTo = await prisma.formResponse.count({ where: { assignedTo: { has: newId } } });
    const newVisible = await prisma.formResponse.count({ where: { visibleToUsers: { has: newId } } });
    const newSubmitted = await prisma.formResponse.count({ where: { submittedBy: newId } });
    console.log(`Responses on new ID -> AssignedTo: ${newAssignedTo}, Visible: ${newVisible}, Submitted: ${newSubmitted}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
