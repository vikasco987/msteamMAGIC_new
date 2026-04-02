import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function countUntouched() {
  const allCount = await prisma.formResponse.count();
  const untouchedCount = await prisma.formResponse.count({
    where: { isTouched: false }
  });
  const touchedCount = await prisma.formResponse.count({
    where: { isTouched: true }
  });
  console.log(`Global: ${allCount}, Untouched (isTouched: false): ${untouchedCount}, Touched (isTouched: true): ${touchedCount}`);
}

countUntouched().finally(() => prisma.$disconnect());
