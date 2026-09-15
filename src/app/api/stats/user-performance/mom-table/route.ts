import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const yearFilter = searchParams.get("year");
    const monthFilter = searchParams.get("month");
    const assigneeId = searchParams.get("assigneeId");

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    
    const role = String(clerkUser.publicMetadata?.role || dbUser?.role || "user").toLowerCase();
    const isTL = dbUser?.isTeamLeader || role === 'tl';
    const isPrivileged = ['admin', 'master'].includes(role);

    let baseFilter: any = {
      ...(assigneeId && { assigneeIds: { has: assigneeId } }),
      ...(yearFilter || monthFilter
        ? {
            createdAt: {
              gte: new Date(
                `${yearFilter || "2000"}-${monthFilter || "01"}-01`
              ),
              lte: new Date(
                `${yearFilter || "9999"}-${monthFilter || "12"}-31`
              ),
            },
          }
        : {}),
    };

    const t0 = performance.now();
    let userIds: string[] = [];
    if (!isPrivileged) {
      userIds = [userId];
      if (isTL) {
          const members = await prisma.user.findMany({
              where: { leaderIds: { has: userId } },
              select: { clerkId: true }
          });
          userIds = [userId, ...members.map(m => m.clerkId)];
      }
    }

    const matchConditions: any[] = [];
    if (!isPrivileged) {
        matchConditions.push({
            $or: [
                { createdByClerkId: { $in: userIds } },
                { assigneeId: { $in: userIds } },
                { assigneeIds: { $in: userIds } }
            ]
        });
    }
    if (assigneeId) {
        matchConditions.push({ assigneeIds: assigneeId });
    }
    if (yearFilter || monthFilter) {
        matchConditions.push({
            createdAt: {
                $gte: { $date: new Date(`${yearFilter || "2000"}-${monthFilter || "01"}-01T00:00:00.000Z`).toISOString() },
                $lte: { $date: new Date(`${yearFilter || "9999"}-${monthFilter || "12"}-31T23:59:59.999Z`).toISOString() }
            }
        });
    }

    const aggregatePipeline: any[] = [];
    if (matchConditions.length > 0) {
        aggregatePipeline.push({ $match: { $and: matchConditions } });
    }

    // 🚀 EXTREME OPTIMIZATION: Do the grouping, filtering, and JSON extraction purely in MongoDB!
    aggregatePipeline.push({
        $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            totalRevenue: { $sum: "$amount" },
            amountReceived: { $sum: "$received" },
            totalLeads: { $sum: 1 },
            deliveryCharge: { $sum: { $convert: { input: "$customFields.deliveryCharge", to: "double", onError: 0, onNull: 0 } } },
            costPrice: { $sum: { $convert: { input: "$customFields.costPrice", to: "double", onError: 0, onNull: 0 } } }
        }
    });

    const t1 = performance.now();
    console.log(`[SALES_DASH_PERF] mom-table STEP 1: Auth & Pipeline Setup - ${(t1-t0).toFixed(2)}ms`);

    const tasksAgg: any = await prisma.task.aggregateRaw({ pipeline: aggregatePipeline });
    
    const t2 = performance.now();
    console.log(`[SALES_DASH_PERF] mom-table STEP 2: MongoDB Aggregation (Tasks) - ${(t2-t1).toFixed(2)}ms`);

    let expenseFilter = {};
    if (!isPrivileged && userIds.length > 0) {
      const targetUsers = await prisma.user.findMany({
        where: { clerkId: { in: userIds } },
        select: { email: true }
      });
      const emails = targetUsers.map(u => u.email).filter(Boolean) as string[];
      expenseFilter = { assignerEmail: { in: emails } };
    }

    const t3 = performance.now();
    const expenses = await prisma.employeeExpense.findMany({
      where: expenseFilter
    });

    const t4 = performance.now();
    console.log(`[SALES_DASH_PERF] mom-table STEP 3: Expenses DB Fetch - ${(t4-t3).toFixed(2)}ms | Rows: ${expenses.length}`);

    const monthlyMap: Record<
      string,
      { totalRevenue: number; amountReceived: number; totalLeads: number; totalExpense: number }
    > = {};

    // Map aggregated tasks to our monthlyMap
    if (Array.isArray(tasksAgg)) {
        for (const agg of tasksAgg) {
            if (!agg._id) continue;
            monthlyMap[agg._id] = {
                totalRevenue: typeof agg.totalRevenue === "number" ? agg.totalRevenue : 0,
                amountReceived: typeof agg.amountReceived === "number" ? agg.amountReceived : 0,
                totalLeads: typeof agg.totalLeads === "number" ? agg.totalLeads : 0,
                totalExpense: (typeof agg.deliveryCharge === "number" ? agg.deliveryCharge : 0) + 
                              (typeof agg.costPrice === "number" ? agg.costPrice : 0)
            };
        }
    }

    // Process expenses manually since they are separated
    for (const exp of expenses) {
      if (!exp.date) continue;
      const monthKey = new Date(exp.date).toISOString().slice(0, 7); // "YYYY-MM"
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          totalRevenue: 0,
          amountReceived: 0,
          totalLeads: 0,
          totalExpense: 0,
        };
      }
      monthlyMap[monthKey].totalExpense += safeFloat(exp.amount);
    }

    const sortedMonths = Object.keys(monthlyMap).sort(); // Sort chronologically ascending
    let cumulativeTotal = 0; // Initialize cumulative total

    const momStats = sortedMonths.map((month, index) => {
      const current = monthlyMap[month];
      const previous = monthlyMap[sortedMonths[index - 1]] || {
        totalRevenue: 0,
        amountReceived: 0,
        totalLeads: 0,
        totalExpense: 0,
      };

      cumulativeTotal += current.totalRevenue; // Add current month's revenue to the cumulative total

      const calcGrowth = (currentVal: number, previousVal: number) => {
        if (previousVal === 0) return currentVal > 0 ? 100 : 0;
        return ((currentVal - previousVal) / previousVal) * 100;
      };

      return {
        month,
        totalRevenue: current.totalRevenue,
        revenueGrowth: calcGrowth(current.totalRevenue, previous.totalRevenue),
        amountReceived: current.amountReceived,
        receivedGrowth: calcGrowth(
          current.amountReceived,
          previous.amountReceived
        ),
        pendingAmount: current.totalRevenue - current.amountReceived,
        pendingGrowth: calcGrowth(
          current.totalRevenue - current.amountReceived,
          previous.totalRevenue - previous.amountReceived
        ),
        totalLeads: current.totalLeads,
        leadsGrowth: calcGrowth(current.totalLeads, previous.totalLeads),
        cumulativeRevenue: cumulativeTotal,
        totalExpense: current.totalExpense,
        expenseGrowth: calcGrowth(current.totalExpense, previous.totalExpense),
      };
    });

    // Re-sort to show latest first for display
    const reversedMomStats = momStats.reverse();

    const total = reversedMomStats.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = reversedMomStats.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      data: paginated,
      total,
      totalPages,
      page,
      limit,
    });
  } catch (error) {
    console.error("MoM Table API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Month-over-Month data" },
      { status: 500 }
    );
  }
}