const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { startOfMonth, endOfMonth, startOfDay, endOfDay } = require('date-fns');

async function runMonthlyAudit() {
  const now = new Date();
  const mStart = startOfMonth(now);
  const mEnd = endOfMonth(now);
  const tStart = startOfDay(now);
  const tEnd = endOfDay(now);
  
  console.log("--------------------------------------------------");
  console.log(`MONTHLY SALES AUDIT (MARCH 1 - MARCH 31, 2026)`);
  console.log(`STATUS AUDIT: 'done' = SALES | 'todo' = TO-DO | 'inprogress' = PROGRESS`);
  console.log("--------------------------------------------------");

  const staff = await prisma.user.findMany({
    where: { role: { in: ["USER", "TL", "ADMIN", "MASTER", "SELLER", "INTERN", "GUEST", "MANAGER"] } },
    select: { clerkId: true, name: true, email: true }
  });

  const allTasksGlobal = await prisma.task.findMany({ where: { isHidden: false } });

  for (const user of staff) {
    const uid = user.clerkId;
    const uName = (user.name || "").toLowerCase();
    const uEmail = (user.email || "").toLowerCase();

    const userTasks = allTasksGlobal.filter(t => {
      const matchID = t.createdByClerkId === uid;
      const matchName = t.createdByName && (t.createdByName.toLowerCase() === uName || t.createdByName.toLowerCase().includes(uName));
      const matchEmail = t.createdByEmail && t.createdByEmail.toLowerCase() === uEmail;
      return matchID || matchName || matchEmail;
    });

    // SALES = 'done' status
    const monthlySales = userTasks.filter(t => {
      const isSales = (t.status || "").toLowerCase() === "done";
      if (!isSales) return false;
      const ref = t.createdAt || new Date();
      return ref >= mStart && ref <= mEnd;
    });

    // PAYMENT PENDING (Custom logic based on status string)
    const monthlyPending = userTasks.filter(t => {
        const isPend = (t.status || "").toLowerCase().includes("pending");
        if (!isPend) return false;
        const ref = t.createdAt || new Date();
        return ref >= mStart && ref <= mEnd;
    });

    const todaySales = monthlySales.filter(t => {
        const ref = t.createdAt || new Date();
        return ref >= tStart && ref <= tEnd;
    });

    if (monthlySales.length > 0 || monthlyPending.length > 0 || userTasks.length > 0) {
      console.log(`Operator: ${user.name}`);
      console.log(` - Today Sales Created (status='done'): ${todaySales.length}`);
      console.log(` - Monthly Total Sales Created (status='done'): ${monthlySales.length}`);
      console.log(` - Monthly Payment Pending Tasks Created: ${monthlyPending.length}`);
      console.log(` - Total Active Capacity (To-Do/Progress): ${userTasks.filter(t => ['todo', 'inprogress'].includes(t.status.toLowerCase())).length}`);
      console.log("--------------------------------------------------");
    }
  }

  process.exit(0);
}

runMonthlyAudit();
