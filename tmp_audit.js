const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runAudit() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  console.log("--------------------------------------------------");
  console.log(`LIVE AUDIT DUMP (TODAY - MARCH 31, 2026)`);
  console.log(`Window: ${start.toISOString()} to ${end.toISOString()}`);
  console.log("--------------------------------------------------");

  const staff = await prisma.user.findMany({
    where: { role: { in: ["USER", "TL", "ADMIN", "MASTER", "SELLER", "INTERN", "GUEST", "MANAGER"] } },
    select: { clerkId: true, name: true }
  });

  const connectedStatuses = [
    "CALL DONE", "CALL AGAIN", "MEETING", "DUPLICATE", "CONNECTED", "INTERESTED", "BUSY",
    "Call Again", "Call done", "Not interested", "Walk-in scheduled", "Closed", "Follow up done", "Called", "Scheduled", "Follow-up Done", "Walked In",
    "ONBOARDED", "ONBOARDING", "PAYMENT PENDING", "FOLLOW-UP DONE", "WALKED IN", "INTERESTED", "BUSY", "CONNECTED", "SALES", "CLOSED", "SCHEDULED"
  ];

  const notConnectedStatuses = [
    "RNR", "RNR 2", "RNR3", "SWITCH OFF", "INVALID NUMBER", "INCOMING NOT AVAIABLE", "WRONG NUMBER", "REJECTED",
    "RNR", "RNR2 (Checked)", "RNR3", "Switch off", "Invalid Number", "Missed"
  ];

  const ALL_CALL_STATUSES = [...connectedStatuses, ...notConnectedStatuses].map(s => s.toUpperCase());
  const CONN_STATUSES = connectedStatuses.map(s => s.toUpperCase());

  for (const user of staff) {
    const remarks = await prisma.formRemark.findMany({
      where: { 
        createdById: user.clerkId, 
        createdAt: { gte: start, lte: end } 
      }
    });

    if (remarks.length > 0) {
      const uniqueLeads = new Set(remarks.map(r => r.responseId)).size;
      const reachouts = new Set(remarks.filter(r => ALL_CALL_STATUSES.includes((r.followUpStatus || "").trim().toUpperCase())).map(r => r.responseId)).size;
      const connections = new Set(remarks.filter(r => CONN_STATUSES.includes((r.followUpStatus || "").trim().toUpperCase())).map(r => r.responseId)).size;

      console.log(`Operator: ${user.name}`);
      console.log(` - Raw Remarks: ${remarks.length}`);
      console.log(` - Reachout Volume (Unique Leads): ${reachouts}`);
      console.log(` - Connections (Unique Leads): ${connections}`);
      console.log("--------------------------------------------------");
    }
  }

  process.exit(0);
}

runAudit();
