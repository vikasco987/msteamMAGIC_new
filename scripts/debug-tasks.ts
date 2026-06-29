import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const oldEmail = "dipti.magicscale@gmail.com";
  const newEmail = "dipti.singh@kravy.in";
  
  const oldUser = await prisma.user.findUnique({ where: { email: oldEmail } });
  const newUser = await prisma.user.findUnique({ where: { email: newEmail } });
  
  const oldId = oldUser?.clerkId;
  const newId = newUser?.clerkId;

  console.log("Old ID:", oldId);
  console.log("New ID:", newId);

  if (oldId) {
    const oldAssigner = await prisma.task.count({ where: { assignerId: oldId } });
    const oldAssignee = await prisma.task.count({ where: { assigneeId: oldId } });
    const oldCreator = await prisma.task.count({ where: { createdByClerkId: oldId } });
    const oldAssigneeIds = await prisma.task.count({ where: { assigneeIds: { has: oldId } } });
    console.log(`Tasks still on old ID -> Assigner: ${oldAssigner}, Assignee: ${oldAssignee}, Creator: ${oldCreator}, AssigneeIds: ${oldAssigneeIds}`);
  }

  if (newId) {
    const newAssigner = await prisma.task.count({ where: { assignerId: newId } });
    const newAssignee = await prisma.task.count({ where: { assigneeId: newId } });
    const newCreator = await prisma.task.count({ where: { createdByClerkId: newId } });
    const newAssigneeIds = await prisma.task.count({ where: { assigneeIds: { has: newId } } });
    console.log(`Tasks on new ID -> Assigner: ${newAssigner}, Assignee: ${newAssignee}, Creator: ${newCreator}, AssigneeIds: ${newAssigneeIds}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
