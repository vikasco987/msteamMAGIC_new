const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const dateStr = "2026-03-31";
  const start = new Date(dateStr + "T00:00:00.000Z");
  const end = new Date(dateStr + "T23:59:59.999Z");
  const FORM_ID = "69b8f819a8a6f09fd11148c7";

  const staff = await prisma.user.findMany({ 
      where: { role: { in: ["USER", "TL", "ADMIN", "MASTER"] } },
      select: { clerkId: true, name: true, email: true }
  });

  const responses = await prisma.formResponse.findMany({ 
      where: { formId: FORM_ID },
      select: { id: true, assignedTo: true, submittedBy: true, submittedAt: true, remarks: { take: 1 } }
  });
  const remarks = await prisma.formRemark.findMany({ 
      where: { createdAt: { gte: start, lte: end } },
      select: { responseId: true, followUpStatus: true, createdById: true, columnId: true }
  });
  const tasks = await prisma.task.findMany({ where: { isHidden: false }, select: { assigneeIds: true, status: true } });

  const historicalSales = await prisma.formRemark.groupBy({
      by: ['createdById'],
      where: { followUpStatus: { in: ["CLOSED", "SALES", "PAID", "ONBOARDING"] } },
      _count: { _all: true }
  });
  const historyMap = Object.fromEntries(historicalSales.map(h => [h.createdById, h._count._all]));

  const connectedStatuses = ["CALL DONE", "CONNECTED", "BUSY", "INTERESTED", "SALES", "CLOSED", "SCHEDULED", "ONBOARDING", "FOLLOW-UP DONE", "WALKED IN"];

  const report = staff.map((u, idx) => {
      const uid = u.clerkId;
      const uLeads = responses.filter(r => r.assignedTo && r.assignedTo[r.assignedTo.length - 1] === uid);
      const uRemarks = remarks.filter(r => r.createdById === uid);
      const uSubmissions = responses.filter(r => r.submittedBy === uid && r.submittedAt >= start && r.submittedAt <= end).length;
      const uTasks = tasks.filter(t => (t.assigneeIds || []).includes(uid));

      const reachoutSet = new Set(uRemarks.map(r => r.responseId));
      const connSet = new Set(uRemarks.filter(r => connectedStatuses.includes((r.followUpStatus || "").toUpperCase())).map(r => r.responseId));

      const newReach = new Set(uRemarks.filter(r => r.columnId).map(r => r.responseId)).size;
      const newConn = new Set(uRemarks.filter(r => r.columnId && connectedStatuses.includes((r.followUpStatus || "").toUpperCase())).map(r => r.responseId)).size;
      const fuReach = new Set(uRemarks.filter(r => !r.columnId).map(r => r.responseId)).size;
      const fuConn = new Set(uRemarks.filter(r => !r.columnId && connectedStatuses.includes((r.followUpStatus || "").toUpperCase())).map(r => r.responseId)).size;

      const salesToday = new Set(uRemarks.filter(r => ["CLOSED", "SALES", "PAID"].includes((r.followUpStatus || "").toUpperCase())).map(r => r.responseId)).size;

      return {
          "No.": String(idx + 1).padStart(2, '0'),
          "Staff Member": u.name || u.email.split('@')[0],
          "Untouched": uLeads.filter(r => (!r.remarks || r.remarks.length === 0)).length,
          "Pending F/U": 0,
          "Forms Filled": uSubmissions,
          "Created": uLeads.filter(r => r.submittedAt >= start && r.submittedAt <= end).length,
          "Reachout": reachoutSet.size,
          "Conn.": connSet.size,
          "New Reach": newReach,
          "New Conn": newConn,
          "F/U Calls": fuReach,
          "F/U Conn": fuConn,
          "Total Sales": historyMap[uid] || 0,
          "Today Sales": salesToday,
          "To-Do": uTasks.filter(t => t.status === "PENDING" || t.status === "TODO").length,
          "Progress": uTasks.filter(t => t.status === "ACTIVE" || t.status === "IN_PROGRESS").length,
          "Pay Pend": uTasks.filter(t => t.status === "PAYMENT_PENDING").length,
          "P.P Work Done": uTasks.filter(t => t.status === "COMPLETED" || t.status === "DONE").length
      };
  }).filter(r => r.Untouched > 0 || r.Reachout > 0 || r["Forms Filled"] > 0 || r["To-Do"] > 0);

  console.table(report);
  process.exit(0);
}
run();
