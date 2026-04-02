const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTaskAudit() {
  const now = new Date();
  
  console.log("--------------------------------------------------");
  console.log(`LIVE TASK AUDIT (TODAY - MARCH 31, 2026)`);
  console.log("--------------------------------------------------");

  const staff = await prisma.user.findMany({
    where: { role: { in: ["USER", "TL", "ADMIN", "MASTER", "SELLER", "INTERN", "GUEST", "MANAGER"] } },
    select: { clerkId: true, name: true }
  });

  for (const user of staff) {
    // Count tasks created by this user
    const [todo, inProgress] = await Promise.all([
      prisma.task.count({
        where: { 
          createdByClerkId: user.clerkId,
          status: { contains: "TODO", mode: 'insensitive' }
        }
      }),
      prisma.task.count({
        where: { 
          createdByClerkId: user.clerkId,
          status: { contains: "PROGRESS", mode: 'insensitive' }
        }
      })
    ]);

    if (todo > 0 || inProgress > 0) {
      console.log(`Operator: ${user.name}`);
      console.log(` - TO-DO Tasks Created: ${todo}`);
      console.log(` - IN-PROGRESS Tasks Created: ${inProgress}`);
      console.log("--------------------------------------------------");
    }
  }

  process.exit(0);
}

runTaskAudit();
