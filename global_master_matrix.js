const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const dateStr = "2026-03-31";
  const start = new Date(dateStr + "T00:00:00.000Z");
  const end = new Date(dateStr + "T23:59:59.999Z");
  const FORM_ID = "69b8f819a8a6f09fd11148c7";

  const responses = await prisma.formResponse.findMany({ where: { formId: FORM_ID } });
  const remarks = await prisma.formRemark.findMany({ where: { createdAt: { gte: start, lte: end } } });
  
  const actorIds = new Set([
      ...remarks.map(r => r.createdById),
      ...responses.filter(r => r.submittedAt >= start && r.submittedAt <= end).map(r => r.submittedBy),
      ...responses.map(r => r.assignedTo ? r.assignedTo[r.assignedTo.length-1] : null)
  ].filter(id => id));

  const staffRaw = await prisma.user.findMany({ where: { clerkId: { in: Array.from(actorIds) } } });
  const staffMap = Object.fromEntries(staffRaw.map(u => [u.clerkId, u.name]));

  const cStatuses = ["CALL DONE", "CONNECTED", "BUSY", "INTERESTED", "SALES", "CLOSED", "SCHEDULED", "ONBOARDING"];

  const report = Array.from(actorIds).map((uid, idx) => {
      const uLeads = responses.filter(r => r.assignedTo && r.assignedTo[r.assignedTo.length - 1] === uid);
      const uRmks = remarks.filter(r => r.createdById === uid);
      const uSubs = responses.filter(r => r.submittedBy === uid && r.submittedAt >= start && r.submittedAt <= end).length;
      
      const rSet = new Set(uRmks.map(r => r.responseId));
      const cSet = new Set(uRmks.filter(r => cStatuses.includes((r.followUpStatus || "").toUpperCase())).map(r => r.responseId));

      return {
          "No.": idx + 1,
          "STAFF MEMBER": staffMap[uid] || uid.substring(0,8),
          "UNTOUCHED": uLeads.filter(r => !r.remarks || r.remarks.length === 0).length,
          "FORMS FILLED": uSubs,
          "CREATED": uLeads.filter(r => r.submittedAt >= start && r.submittedAt <= end).length,
          "REACHOUT": rSet.size,
          "CONN.": cSet.size,
          "EFFICIENCY": rSet.size > 0 ? Math.round((cSet.size/rSet.size)*100) + "%" : "0%"
      };
  }).filter(r => r.UNTOUCHED > 0 || r["FORMS FILLED"] > 0 || r.REACHOUT > 0);

  console.table(report);
  process.exit(0);
}
run();
