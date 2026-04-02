const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const dates = ["2026-03-30", "2026-03-31"];
  
  for (const dateStr of dates) {
    console.log("\n--- REPORT FOR " + dateStr + " ---");
    const start = new Date(dateStr + "T00:00:00.000Z");
    const end = new Date(dateStr + "T23:59:59.999Z");

    const staffCount = await prisma.user.count({ where: { role: { in: ["USER", "TL", "ADMIN", "MASTER"] } } });
    const remarks = await prisma.formRemark.count({ where: { createdAt: { gte: start, lte: end } } });
    const submissions = await prisma.formResponse.count({ where: { submittedAt: { gte: start, lte: end } } });

    console.log("Total Staff Tracked:", staffCount);
    console.log("Total Reachouts (Un-deduplicated):", remarks);
    console.log("Total Forms Filled:", submissions);

    // Fetch individual staff counts (Deduplicated)
    const staff = await prisma.user.findMany({ 
        where: { role: { in: ["USER", "TL", "ADMIN", "MASTER"] } },
        select: { clerkId: true, name: true }
    });

    const activeRows = [];
    for (const user of staff) {
       const uRemarks = await prisma.formRemark.findMany({ 
           where: { createdById: user.clerkId, createdAt: { gte: start, lte: end } },
           select: { responseId: true, followUpStatus: true }
       });
       
       const uniqueReachout = new Set(uRemarks.map(r => r.responseId)).size;
       const uniqueConnected = new Set(uRemarks.filter(r => ["CALL DONE", "CONNECTED", "BUSY", "INTERESTED", "SALES", "CLOSED"].includes((r.followUpStatus || "").toUpperCase())).map(r => r.responseId)).size;
       const uSubmissions = await prisma.formResponse.count({ 
           where: { submittedBy: user.clerkId, submittedAt: { gte: start, lte: end } } 
       });

       if (uniqueReachout > 0 || uSubmissions > 0) {
           activeRows.push({
               Name: user.name,
               Reach: uniqueReachout,
               Conn: uniqueConnected,
               Forms: uSubmissions
           });
       }
    }
    console.table(activeRows);
  }
  process.exit(0);
}
run();
