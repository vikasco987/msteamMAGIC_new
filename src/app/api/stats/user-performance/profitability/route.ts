import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const safeFloat = (v: any): number => {
  if (v == null || v === "") return 0;
  const n = parseFloat(String(v));
  return isNaN(n) || !isFinite(n) ? 0 : n;
};

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month"); // YYYY-MM or 'all'

    let startDate: Date | undefined;
    let endDate: Date | undefined;
    let dateFilter: any = {};
    let expDateFilter: any = {};

    if (monthParam && monthParam !== "all") {
      const [year, month] = monthParam.split("-").map(Number);
      if (year && month) {
        startDate = new Date(Date.UTC(year, month - 1, 1));
        endDate = new Date(Date.UTC(year, month, 1));

        dateFilter = {
          createdAt: { gte: startDate, lt: endDate }
        };
        expDateFilter = {
          date: { gte: startDate, lt: endDate }
        };
      }
    }

    // Role check
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });

    const role = String(clerkUser.publicMetadata?.role || dbUser?.role || "user").toLowerCase();
    const isTL = dbUser?.isTeamLeader || role === "tl";
    const isPrivileged = ["admin", "master"].includes(role);

    let taskWhere: any = { ...dateFilter };

    if (!isPrivileged) {
      let userIds = [userId];
      if (isTL) {
        const members = await prisma.user.findMany({
          where: { leaderIds: { has: userId } },
          select: { clerkId: true }
        });
        userIds = [userId, ...members.map(m => m.clerkId)];
      }

      taskWhere = {
        ...taskWhere,
        OR: [
          { createdByClerkId: { in: userIds } },
          { assigneeId: { in: userIds } },
          { assigneeIds: { hasSome: userIds } }
        ]
      };
    }

    // 1. Fetch tasks
    const tasks = await prisma.task.findMany({
      where: taskWhere,
      orderBy: { createdAt: "desc" }
    });

    // 2. Fetch employee expenses
    const employeeExpenses = await prisma.employeeExpense.findMany({
      where: expDateFilter,
      orderBy: { date: "desc" }
    });

    // 3. Map Assigner Stats
    const assignerMap: Record<string, {
      name: string;
      email: string;
      totalSales: number;
      totalRevenue: number;
      amountReceived: number;
      pendingAmount: number;
      taskDeliveryExpense: number;
      taskCostPriceExpense: number;
      totalTaskDirectExpense: number;
      grossTaskProfit: number;
      grossCashProfit: number;
      employeeManualExpenses: number;
      netProfit: number;
      netCashProfit: number;
      profitMargin: number;
      status: "PROFITABLE" | "LOSS_MAKING" | "BREAK_EVEN";
      tasks: any[];
      expensesList: any[];
    }> = {};

    for (const task of tasks) {
      const customFields = (task.customFields as any) || {};

      const name = task.assignerName || task.createdByName || "Unknown Assigner";
      const email = task.assignerEmail || task.createdByEmail || name.toLowerCase().replace(/\s+/g, ".") + "@company.com";
      const key = email || name;

      if (!assignerMap[key]) {
        assignerMap[key] = {
          name,
          email,
          totalSales: 0,
          totalRevenue: 0,
          amountReceived: 0,
          pendingAmount: 0,
          taskDeliveryExpense: 0,
          taskCostPriceExpense: 0,
          totalTaskDirectExpense: 0,
          grossTaskProfit: 0,
          grossCashProfit: 0,
          employeeManualExpenses: 0,
          netProfit: 0,
          netCashProfit: 0,
          profitMargin: 0,
          status: "BREAK_EVEN",
          tasks: [],
          expensesList: []
        };
      }

      const rev = safeFloat(customFields.packageAmount || customFields.amount || task.amount);
      const received = safeFloat(customFields.amountReceived || task.received);
      const delivery = safeFloat(customFields.deliveryCharge);
      const costPrice = safeFloat(customFields.costPrice);
      const directExp = delivery + costPrice;
      const taskProfit = rev - directExp;

      assignerMap[key].totalSales += 1;
      assignerMap[key].totalRevenue += rev;
      assignerMap[key].amountReceived += received;
      assignerMap[key].taskDeliveryExpense += delivery;
      assignerMap[key].taskCostPriceExpense += costPrice;
      assignerMap[key].totalTaskDirectExpense += directExp;
      assignerMap[key].grossTaskProfit += taskProfit;
      assignerMap[key].grossCashProfit += (received - directExp);

      assignerMap[key].tasks.push({
        id: task.id,
        title: task.title,
        status: task.status,
        customerName: customFields.customerName || task.assigneeName || "Customer",
        createdAt: task.createdAt,
        revenue: rev,
        received: received,
        deliveryCharge: delivery,
        costPrice: costPrice,
        directExpense: directExp,
        taskProfit: taskProfit
      });
    }

    // Attach Employee Manual Expenses
    for (const exp of employeeExpenses) {
      const email = exp.assignerEmail;
      const name = exp.assignerName || exp.assignerEmail;

      // Find matching key or create entry
      let key = Object.keys(assignerMap).find(
        (k) => k.toLowerCase() === email.toLowerCase() || assignerMap[k].name.toLowerCase() === name.toLowerCase()
      );

      if (!key) {
        key = email;
        assignerMap[key] = {
          name: name || "Unknown Employee",
          email,
          totalSales: 0,
          totalRevenue: 0,
          amountReceived: 0,
          pendingAmount: 0,
          taskDeliveryExpense: 0,
          taskCostPriceExpense: 0,
          totalTaskDirectExpense: 0,
          grossTaskProfit: 0,
          grossCashProfit: 0,
          employeeManualExpenses: 0,
          netProfit: 0,
          netCashProfit: 0,
          profitMargin: 0,
          status: "BREAK_EVEN",
          tasks: [],
          expensesList: []
        };
      }

      assignerMap[key].employeeManualExpenses += safeFloat(exp.amount);
      assignerMap[key].expensesList.push(exp);
    }

    // Calculate final Net Profit, Net Cash Profit, Margins, & Status
    const assignerList = Object.values(assignerMap).map((a) => {
      a.pendingAmount = a.totalRevenue - a.amountReceived;
      a.netProfit = a.grossTaskProfit - a.employeeManualExpenses;
      a.netCashProfit = a.grossCashProfit - a.employeeManualExpenses;
      a.profitMargin = a.totalRevenue > 0 ? (a.netProfit / a.totalRevenue) * 100 : (a.netProfit < 0 ? -100 : 0);

      if (a.netProfit > 0) {
        a.status = "PROFITABLE";
      } else if (a.netProfit < 0) {
        a.status = "LOSS_MAKING";
      } else {
        a.status = "BREAK_EVEN";
      }

      return a;
    });

    // Sort by Net Profit descending
    assignerList.sort((a, b) => b.netProfit - a.netProfit);

    // Total Overall Summary
    const grandTotals = {
      totalAssigners: assignerList.length,
      totalSales: assignerList.reduce((sum, a) => sum + a.totalSales, 0),
      totalRevenue: assignerList.reduce((sum, a) => sum + a.totalRevenue, 0),
      totalReceived: assignerList.reduce((sum, a) => sum + a.amountReceived, 0),
      totalPending: assignerList.reduce((sum, a) => sum + a.pendingAmount, 0),
      totalDirectTaskExpenses: assignerList.reduce((sum, a) => sum + a.totalTaskDirectExpense, 0),
      totalEmployeeExpenses: assignerList.reduce((sum, a) => sum + a.employeeManualExpenses, 0),
      grandTotalExpenses: assignerList.reduce((sum, a) => sum + (a.totalTaskDirectExpense + a.employeeManualExpenses), 0),
      grandNetProfit: assignerList.reduce((sum, a) => sum + a.netProfit, 0),
      grandNetCashProfit: assignerList.reduce((sum, a) => sum + a.netCashProfit, 0),
      profitableCount: assignerList.filter((a) => a.status === "PROFITABLE").length,
      lossMakingCount: assignerList.filter((a) => a.status === "LOSS_MAKING").length,
    };

    return NextResponse.json({
      summary: grandTotals,
      assigners: assignerList
    });
  } catch (error: any) {
    console.error("❌ Error computing profitability stats:", error);
    return NextResponse.json({ error: "Failed to compute profitability stats" }, { status: 500 });
  }
}
