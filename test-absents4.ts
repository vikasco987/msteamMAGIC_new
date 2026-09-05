import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.employeeProfile.findMany({});
  const actives = p.filter(x => x.employmentStatus.trim() === "Active");
  
  for (const a of actives) {
     if (a.employmentStatus !== "Active") {
        console.log(`Mismatch: '${a.employmentStatus}' for ${a.email}`);
     }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
