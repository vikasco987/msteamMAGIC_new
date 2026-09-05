import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const p1 = await prisma.employeeProfile.findMany({ 
    where: { employmentStatus: { in: ["Active", "Notice Period"] } }
  });
  console.log("With 'in':", p1.map(x => x.email));

  const p2 = await prisma.employeeProfile.findMany({ 
    where: { employmentStatus: "Active" }
  });
  console.log("With 'Active':", p2.map(x => x.email));

  const p3 = await prisma.employeeProfile.findMany({});
  console.log("Total active according to JS filter:", p3.filter(x => x.employmentStatus === "Active").map(x => x.email));
}

main().catch(console.error).finally(() => prisma.$disconnect());
