import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function initializeTouchedField() {
  console.log("🚀 Initializing isTouched field for all leads...");

  // In MongoDB with Prisma, documents missing a field won't match { isTouched: false } 
  // but will match { isTouched: { not: true } } or similar depending on setup.
  // We'll just fetch everything that isn't explicitly true.

  const leadsToInit = await prisma.formResponse.findMany({
    where: {
      isTouched: { not: true }
    },
    select: { id: true }
  });

  console.log(`📊 Found ${leadsToInit.length} leads needing field initialization.`);

  if (leadsToInit.length > 0) {
    const ids = leadsToInit.map(l => l.id);
    const batchSize = 500;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      await prisma.formResponse.updateMany({
        where: { id: { in: batch } },
        data: { isTouched: false }
      });
      console.log(`✅ Initialized batch ${Math.floor(i / batchSize) + 1}`);
    }
  }

  console.log("✨ Initialization complete. Now running Aggressive Backfill to refine...");

  // Aggressive check to mark as touched if data exists
  const leadsWithData = await prisma.formResponse.findMany({
    where: {
      isTouched: false,
      OR: [
        { remarks: { some: {} } },
        { internalValues: { some: { value: { not: "" } } } }
      ]
    },
    select: { id: true }
  });

  console.log(`📉 Refinement: Found ${leadsWithData.length} records that actually have data but were just initialized to false.`);

  if (leadsWithData.length > 0) {
    const ids = leadsWithData.map(l => l.id);
    const batchSize = 500;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      await prisma.formResponse.updateMany({
        where: { id: { in: batch } },
        data: { isTouched: true }
      });
      console.log(`✅ Refined batch ${Math.floor(i / batchSize) + 1}`);
    }
  }

  console.log("🎊 Full Process Completed.");
}

initializeTouchedField().finally(() => prisma.$disconnect());
