import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { syncPendingPaymentLinks } from "@/lib/sync-payment-links";

export const dynamic = "force-dynamic";

// Safe float helper — returns 0 for NaN/null/undefined
const safeFloat = (v: any): number => {
  if (v == null || v === "") return 0;
  const n = parseFloat(String(v));
  return isNaN(n) || !isFinite(n) ? 0 : n;
};

interface UserPublicMetadata {
  role?: string;
}

interface UserPrivateMetadata {
  role?: string;
}

async function getUserRole(userId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return (
      (user.publicMetadata as UserPublicMetadata)?.role ||
      (user.privateMetadata as UserPrivateMetadata)?.role ||
      null
    );
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getUserRole(userId);
    
    if (role !== "master") {
      return NextResponse.json({ error: "Forbidden: Master access required" }, { status: 403 });
    }

    // Auto-verify and sync any pending payment links in background/realtime
    await syncPendingPaymentLinks();

    const businessSettings = await prisma.businessSettings.findFirst();
    const syncLinks = businessSettings?.syncLinksToProfitLoss !== false; // Default to TRUE so payment links auto-sync!
    const syncTasks = typeof businessSettings?.syncTasksToProfitLoss === 'boolean' ? businessSettings.syncTasksToProfitLoss : true;

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month');

    let dateFilter: any = {};
    let expDateFilter: any = {};
    if (monthParam && monthParam !== "all") {
      const [yearStr, monthStr] = monthParam.split("-");
      const startDate = new Date(Date.UTC(parseInt(yearStr), parseInt(monthStr) - 1, 1));
      const endDate = new Date(Date.UTC(parseInt(yearStr), parseInt(monthStr), 1));
      
      dateFilter = {
        createdAt: { gte: startDate, lt: endDate }
      };
      expDateFilter = {
        date: { gte: startDate, lt: endDate }
      };
    }

    let tasks: any[] = [];
    if (syncTasks) {
      tasks = await prisma.task.findMany({
        where: dateFilter,
        orderBy: { createdAt: "desc" },
      });
    }

    const generalExpenses = await prisma.generalExpense.findMany({
      where: expDateFilter,
      orderBy: { date: "desc" }
    });

    // --- RECURRING EXPENSES LOGIC ---
    if (monthParam && monthParam !== "all") {
      const [yearStr, monthStr] = monthParam.split("-");
      const startDate = new Date(Date.UTC(parseInt(yearStr), parseInt(monthStr) - 1, 1));
      
      const recurringExpenses = await prisma.generalExpense.findMany({
        where: {
          isRecurring: true,
          date: { lt: startDate }
        }
      });

      const projectedRecurring = recurringExpenses.map(exp => {
         const newDate = new Date(exp.date);
         newDate.setUTCFullYear(startDate.getUTCFullYear());
         newDate.setUTCMonth(startDate.getUTCMonth());
         return { ...exp, id: `${exp.id}-projected-${monthParam}`, date: newDate };
      });
      
      generalExpenses.push(...projectedRecurring);
    } else {
      const now = new Date();
      const currentYear = now.getUTCFullYear();
      const currentMonth = now.getUTCMonth();
      
      const recurringExpenses = generalExpenses.filter(e => e.isRecurring);
      const allProjected: any[] = [];
      
      recurringExpenses.forEach(exp => {
        const start = new Date(exp.date);
        let iterYear = start.getUTCFullYear();
        let iterMonth = start.getUTCMonth() + 1;
        
        while (iterYear < currentYear || (iterYear === currentYear && iterMonth <= currentMonth)) {
          if (iterMonth > 11) {
            iterMonth = 0;
            iterYear++;
          }
          if (iterYear < currentYear || (iterYear === currentYear && iterMonth <= currentMonth)) {
            const newDate = new Date(start);
            newDate.setUTCFullYear(iterYear);
            newDate.setUTCMonth(iterMonth);
            
            allProjected.push({
              ...exp,
              id: `${exp.id}-projected-${iterYear}-${iterMonth}`,
              date: newDate
            });
          }
          iterMonth++;
        }
      });
      generalExpenses.push(...allProjected);
    }
    generalExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let cashfreeLinks: any[] = [];
    if (syncLinks) {
      cashfreeLinks = await prisma.cashfreeLink.findMany({
        where: {
          status: { in: ["paid", "PAID", "SUCCESS", "completed"] },
          ...dateFilter
        },
        orderBy: { createdAt: "desc" }
      });
    }

    let totalRevenue = 0;
    let totalExpense = 0;

    const formattedTasks = tasks.map((task) => {
      const customFields = task.customFields as any || {};
      
      const rev = safeFloat(customFields.packageAmount || customFields.amount || task.amount);
      const received = safeFloat(customFields.amountReceived || task.received);
      
      const delivery = safeFloat(customFields.deliveryCharge);
      const costPrice = safeFloat(customFields.costPrice);
      const exp = delivery + costPrice;

      const profit = rev - exp;
      const cashProfit = received - exp;

      totalRevenue += rev;
      totalExpense += exp;

      return {
        id: task.id,
        title: task.title,
        status: task.status,
        createdAt: task.createdAt,
        revenue: rev,
        received: received,
        expense: exp,
        profit: profit,
        cashProfit: cashProfit,
        deliveryCharge: delivery,
        costPrice: costPrice,
        customerName: customFields.customerName || task.assigneeName || "Unknown",
        awbNumber: customFields.awbNumber || "",
        softwareDuration: customFields.softwareDuration || "",
      };
    });

    if (syncLinks && cashfreeLinks.length > 0) {
      const linkTasks = cashfreeLinks.map((link) => {
        const rev = safeFloat(link.amount);
        const received = safeFloat(link.amount);
        const exp = 0;
        
        totalRevenue += rev;
        // Expense is 0, so profit and cashProfit equal received/revenue

        return {
          id: link.id,
          title: `Payment Link: ${link.purpose || "Payment"}`,
          status: link.status,
          createdAt: link.createdAt,
          revenue: rev,
          received: received,
          expense: exp,
          profit: rev,
          cashProfit: received,
          deliveryCharge: 0,
          costPrice: 0,
          customerName: link.name || "Unknown",
          awbNumber: "",
          softwareDuration: "",
        };
      });
      formattedTasks.push(...linkTasks);
    }

    const totalReceived = formattedTasks.reduce((acc, t) => acc + t.received, 0);

    // Grouping for Reports
    const dayReportMap: Record<string, any> = {};
    const weekReportMap: Record<string, any> = {};
    const monthReportMap: Record<string, any> = {};

    formattedTasks.forEach(task => {
      const date = new Date(task.createdAt);
      // Skip tasks with invalid dates
      if (isNaN(date.getTime())) return;
      const d = date.getDate().toString().padStart(2, '0');
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const y = date.getFullYear();
      
      const dayKey = `${y}-${m}-${d}`;
      const monthKey = `${y}-${m}`;
      
      // Simple ISO week logic
      const dCopy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = dCopy.getUTCDay() || 7;
      dCopy.setUTCDate(dCopy.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(dCopy.getUTCFullYear(),0,1));
      const weekNo = Math.ceil((((dCopy.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
      const weekKey = `${dCopy.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;

      const updateMap = (map: Record<string, any>, key: string) => {
        if (!map[key]) {
          map[key] = { dateKey: key, totalRevenue: 0, totalReceived: 0, totalExpense: 0, netProfit: 0, cashProfit: 0, tasksCount: 0 };
        }
        map[key].totalRevenue += task.revenue;
        map[key].totalReceived += task.received;
        map[key].totalExpense += task.expense;
        map[key].netProfit += task.profit;
        map[key].cashProfit += task.cashProfit;
        map[key].tasksCount += 1;
      };

      updateMap(dayReportMap, dayKey);
      updateMap(weekReportMap, weekKey);
      updateMap(monthReportMap, monthKey);
    });

    // Add General Expenses to maps and summary
    generalExpenses.forEach(exp => {
      const date = new Date(exp.date);
      // Skip expenses with invalid dates
      if (isNaN(date.getTime())) return;
      const d = date.getDate().toString().padStart(2, '0');
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const y = date.getFullYear();
      
      const dayKey = `${y}-${m}-${d}`;
      const monthKey = `${y}-${m}`;
      
      const dCopy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = dCopy.getUTCDay() || 7;
      dCopy.setUTCDate(dCopy.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(dCopy.getUTCFullYear(),0,1));
      const weekNo = Math.ceil((((dCopy.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
      const weekKey = `${dCopy.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;

      const expAmt = safeFloat(exp.amount);
      totalExpense += expAmt;

      const addExpenseToMap = (map: Record<string, any>, key: string) => {
        if (!map[key]) {
          map[key] = { dateKey: key, totalRevenue: 0, totalReceived: 0, totalExpense: 0, netProfit: 0, cashProfit: 0, tasksCount: 0 };
        }
        map[key].totalExpense += expAmt;
        map[key].netProfit -= expAmt;
        map[key].cashProfit -= expAmt;
      };

      addExpenseToMap(dayReportMap, dayKey);
      addExpenseToMap(weekReportMap, weekKey);
      addExpenseToMap(monthReportMap, monthKey);
    });

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalReceived,
        totalExpense,
        netProfit: totalRevenue - totalExpense,
        cashProfit: totalReceived - totalExpense,
      },
      tasks: formattedTasks,
      generalExpenses,
      dayReport: Object.values(dayReportMap).sort((a, b) => b.dateKey.localeCompare(a.dateKey)),
      weekReport: Object.values(weekReportMap).sort((a, b) => b.dateKey.localeCompare(a.dateKey)),
      monthReport: Object.values(monthReportMap).sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Profit & Loss Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getUserRole(userId);
    if (role !== "master") {
      return NextResponse.json({ error: "Forbidden: Master access required" }, { status: 403 });
    }

    const body = await req.json();
    const { taskId, costPrice, deliveryCharge, revenue, received } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    // Fetch the task first to retain other customFields
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { customFields: true, amount: true, received: true }
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const currentFields = existingTask.customFields as Record<string, any> || {};

    const updatedFields = {
      ...currentFields,
      costPrice: costPrice !== undefined ? costPrice.toString() : currentFields.costPrice,
      deliveryCharge: deliveryCharge !== undefined ? deliveryCharge.toString() : currentFields.deliveryCharge,
      packageAmount: revenue !== undefined ? revenue.toString() : currentFields.packageAmount,
      amount: revenue !== undefined ? revenue.toString() : currentFields.amount,
      amountReceived: received !== undefined ? received.toString() : currentFields.amountReceived,
    };

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        customFields: updatedFields,
        // Sync top-level fields too
        amount: revenue !== undefined ? parseFloat(revenue) : existingTask.amount,
        received: received !== undefined ? parseFloat(received) : existingTask.received,
      }
    });

    return NextResponse.json({ success: true, task: updatedTask }, { status: 200 });

  } catch (error) {
    console.error("❌ Profit & Loss Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
