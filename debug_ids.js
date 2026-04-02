const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const remark = await prisma.formRemark.findFirst({ select: { createdById: true, authorName: true } });
  console.log("REMARK CREATOR ID:", remark.createdById, " (Author: " + remark.authorName + ")");

  const user = await prisma.user.findFirst({ select: { clerkId: true, name: true } });
  console.log("USER CLERK ID:", user.clerkId, " (Name: " + user.name + ")");
  process.exit(0);
}
check();
