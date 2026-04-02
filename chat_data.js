const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const dates = ["2026-03-30", "2026-03-31"];
  
  for (const dateStr of dates) {
    console.log("\n--- GRAND MATRIX: " + dateStr + " ---");
    const start = new Date(dateStr + "T00:00:00.000Z");
    const end = new Date(dateStr + "T23:59:59.999Z");

    const allRemarks = await prisma.formRemark.findMany({ 
        where: { createdAt: { gte: start, lte: end } },
        select: { createdById: true, authorName: true, responseId: true, followUpStatus: true }
    });

    const submissions = await prisma.formResponse.findMany({
        where: { submittedAt: { gte: start, lte: end } },
        select: { submittedBy: true }
    });

    const staffMap = {};

    // Grouping Remarks
    allRemarks.forEach(r => {
        const uid = r.createdById;
        if (!staffMap[uid]) staffMap[uid] = { 
            Name: r.authorName || "Staff Member", 
            Reachout: new Set(), 
            Connected: new Set(),
            FormsFilled: 0 
        };
        staffMap[uid].Reachout.add(r.responseId);
        if (["CALL DONE", "CONNECTED", "BUSY", "INTERESTED", "SALES", "CLOSED", "SCHEDULED", "ONBOARDING"].includes((r.followUpStatus || "").toUpperCase())) {
            staffMap[uid].Connected.add(r.responseId);
        }
    });

    // Grouping Submissions
    submissions.forEach(s => {
        const uid = s.submittedBy;
        if (uid) {
            if (!staffMap[uid]) staffMap[uid] = { Name: uid.substring(0,8), Reachout: new Set(), Connected: new Set(), FormsFilled: 0 };
            staffMap[uid].FormsFilled++;
        }
    });

    const report = Object.values(staffMap).map(s => ({
        "STAFF MEMBER": s.Name,
        "FORMS FILLED": s.FormsFilled,
        "REACHOUT": s.Reachout.size,
        "CONN.": s.Connected.size,
        "EFFICIENCY": s.Reachout.size > 0 ? Math.round((s.Connected.size / s.Reachout.size) * 100) + "%" : "0%"
    }));

    if (report.length > 0) { console.table(report); } else { console.log("No data footprint found for this date."); }
  }
  process.exit(0);
}
run();
