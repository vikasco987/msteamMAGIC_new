const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const start = new Date();
  start.setHours(0,0,0,0);
  const end = new Date();
  end.setHours(23,59,59,999);

  console.log("--- BATTLE STATUS REPORT ---");
  console.log("DATE RANGE:", start.toISOString(), "to", end.toISOString());

  const forms = await prisma.dynamicForm.findMany({ select: { id: true, title: true } });
  console.log("\nTOTAL FORMS:", forms.map(f => f.title + " (" + f.id + ")"));

  const remarks = await prisma.formRemark.count({ where: { createdAt: { gte: start, lte: end } } });
  console.log("\nREMARKS CREATED TODAY:", remarks);

  const responses = await prisma.formResponse.count({ where: { submittedAt: { gte: start, lte: end } } });
  console.log("RESPONSES FILLED TODAY:", responses);

  const staff = await prisma.user.count({ where: { role: { in: ["USER", "TL", "ADMIN", "MASTER"] } } });
  console.log("STAFF MEMBERS:", staff);

  process.exit(0);
}
check();
