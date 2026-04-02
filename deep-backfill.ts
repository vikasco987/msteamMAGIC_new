import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deepBackfill() {
  console.log("🚀 Starting Aggressive Matrix Touch Backfill...");

  // 1. Mark ALL with remarks as touched
  const leadsWithRemarks = await prisma.formResponse.findMany({
    where: {
      isTouched: false,
      remarks: { some: {} }
    },
    select: { id: true }
  });
  
  if (leadsWithRemarks.length > 0) {
    const ids = leadsWithRemarks.map(l => l.id);
    await prisma.formResponse.updateMany({
      where: { id: { in: ids } },
      data: { isTouched: true }
    });
    console.log(`✅ Fixed ${leadsWithRemarks.length} leads with remarks.`);
  }

  // 2. Mark ALL with internal values as touched
  // (Internal values are usually operator-added columns)
  const leadsWithInternalData = await prisma.formResponse.findMany({
    where: {
      isTouched: false,
      internalValues: { some: { value: { not: "" } } }
    },
    select: { id: true }
  });

  if (leadsWithInternalData.length > 0) {
    const ids = leadsWithInternalData.map(l => l.id);
    await prisma.formResponse.updateMany({
      where: { id: { in: ids } },
      data: { isTouched: true }
    });
    console.log(`✅ Fixed ${leadsWithInternalData.length} leads with internal data.`);
  }

  console.log(`✨ Aggressive Backfill completed.`);
}

deepBackfill().finally(() => prisma.$disconnect());
