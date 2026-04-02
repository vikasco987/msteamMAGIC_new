const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const dates = ["2026-03-31"];
  const start = new Date(dates[0] + "T00:00:00.000Z");
  const end = new Date(dates[0] + "T23:59:59.999Z");
  const FORM_ID = "69b8f819a8a6f09fd11148c7";

  const responses = await prisma.formResponse.findMany({ 
      where: { formId: FORM_ID },
      select: { id: true, assignedTo: true, submittedBy: true, remarks: { orderBy: { createdAt: 'desc' }, take: 1 } }
  });

  const remarks = await prisma.formRemark.findMany({ 
      where: { createdAt: { gte: start, lte: end } },
      select: { createdById: true, responseId: true, followUpStatus: true }
  });

  const staff = await prisma.user.findMany({ select: { clerkId: true, name: true } });
  const staffMap = Object.fromEntries(staff.map(u => [u.clerkId, u.name]));

  const report = staff.map(u => {
      const uid = u.clerkId;
      const uLeads = responses.filter(r => r.assignedTo && r.assignedTo[r.assignedTo.length - 1] === uid);
      const uRmks = remarks.filter(r => r.createdById === uid);
      
      const rSet = new Set(uRmks.map(r => r.responseId));

      const uPendingFu = uLeads.filter(l => {
          const latest = l.remarks[0];
          if (!latest || !latest.nextFollowUpDate) return false;
          const sch = new Date(latest.nextFollowUpDate);
          return sch >= start && sch <= end && !rSet.has(l.id);
      }).length;

      return {
          "STAFF": u.name || uid.substring(0,6),
          "U_BACKLOG": uLeads.filter(l => l.remarks.length === 0).length,
          "PENDING_FU": uPendingFu,
          "REACHOUT": rSet.size
      };
  }).filter(r => r.REACHOUT > 0 || r.PENDING_FU > 0);

  console.table(report);
  process.exit(0);
}
run();
