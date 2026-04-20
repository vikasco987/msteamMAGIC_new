const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log("🚀 Starting Payment Migration...");
  
  const tasks = await prisma.task.findMany();
  const tasksWithHistory = tasks.filter(t => t.paymentHistory && t.paymentHistory.length > 0);

  console.log(`Found ${tasksWithHistory.length} tasks with payment history.`);

  let migratedCount = 0;
  let skipCount = 0;

  for (const task of tasksWithHistory) {
    const history = task.paymentHistory || [];
    
    for (const entry of history) {
      try {
        // Sanitize UTR
        const utr = entry.utr ? entry.utr.toString().trim() : null;
        
        await prisma.payment.create({
          data: {
            taskId: task.id,
            utr: utr,
            amount: entry.amount || 0,
            received: entry.received || 0,
            fileUrl: entry.fileUrl || null,
            updatedBy: entry.updatedBy || "System",
            updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
          }
        });
        migratedCount++;
      } catch (err) {
        if (err.code === 'P2002') {
          console.warn(`⚠️ Skipping duplicate UTR: ${entry.utr} in task ${task.title}`);
        } else {
          console.error(`❌ Error migrating entry for task ${task.id}:`, err.message);
        }
        skipCount++;
      }
    }
  }

  console.log("\n✅ Migration Finished!");
  console.log(`Total Migrated: ${migratedCount}`);
  console.log(`Total Skipped: ${skipCount}`);
}

migrate()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
