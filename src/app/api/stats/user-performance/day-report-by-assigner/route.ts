import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const t0 = performance.now();
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateFilter = searchParams.get("date"); // format YYYY-MM-DD

    // Role and Team check
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    
    const role = String(clerkUser.publicMetadata?.role || dbUser?.role || "user").toLowerCase();
    const isTL = dbUser?.isTeamLeader || role === 'tl';
    const isPrivileged = ['admin', 'master'].includes(role);

    // Pre-calculate userIds for filters
    let userIds = [userId];
    if (!isPrivileged && isTL) {
        const members = await prisma.user.findMany({
            where: { leaderIds: { has: userId } },
            select: { clerkId: true }
        });
        userIds = [userId, ...members.map(m => m.clerkId)];
    }

    const t1 = performance.now();
    console.log(`[SALES_DASH_PERF] day-report-by-assigner STEP 1: Auth & User Fetch - ${(t1-t0).toFixed(2)}ms`);

    // Filter logic helper
    const applyUserFilter = (baseFilter: any) => {
      if (isPrivileged) return baseFilter;
      return {
          ...baseFilter,
          OR: [
              { createdByClerkId: { in: userIds } },
              { assigneeId: { in: userIds } },
              { assigneeIds: { hasSome: userIds } }
          ]
      };
    };

    if (dateFilter) {
      // ✅ Fetch all tasks for that day grouped by assigner
      const start = new Date(dateFilter);
      const end = new Date(dateFilter);
      end.setDate(end.getDate() + 1);

      const filter = applyUserFilter({
        createdAt: {
          gte: start,
          lt: end,
        },
      });
      const t2 = performance.now();

      const tasks = await prisma.task.findMany({
        where: filter,
        select: {
          createdByName: true,
          createdByEmail: true,
          amount: true,
          received: true
        }
      });
      const t3 = performance.now();
      console.log(`[SALES_DASH_PERF] day-report-by-assigner STEP 2 (Filtered): DB Fetch - ${(t3-t2).toFixed(2)}ms | Rows: ${tasks.length}`);

      const assignerMap: Record<string, any> = {};

      tasks.forEach((task) => {
        const assigner = task.createdByName || "Unknown";
        if (!assignerMap[assigner]) {
          assignerMap[assigner] = {
            assigner,
            email: task.createdByEmail || "",
            totalRevenue: 0,
            amountReceived: 0,
            totalSales: 0,
          };
        }
        assignerMap[assigner].totalRevenue += task.amount || 0;
        assignerMap[assigner].amountReceived += task.received || 0;
        assignerMap[assigner].totalSales += 1;
      });

      const t4 = performance.now();
      console.log(`[SALES_DASH_PERF] day-report-by-assigner STEP 3 (Filtered): JS Grouping - ${(t4-t3).toFixed(2)}ms`);

      return NextResponse.json({
        details: Object.values(assignerMap),
      });
    }

    // ✅ Summary: group by day (All-Time)
    const t2 = performance.now();
    
    // === NEW IMPLEMENTATION (DB Aggregation) ===
    let resultNew: any[] = [];
    
    try {
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

        const aggregatePipeline: any[] = [];
        if (matchConditions.length > 0) {
            aggregatePipeline.push({ $match: { $and: matchConditions } });
        }

        aggregatePipeline.push({
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                totalRevenue: { $sum: "$amount" },
                amountReceived: { $sum: "$received" },
                totalSales: { $sum: 1 }
            }
        });

        const rawAgg = await prisma.task.aggregateRaw({ pipeline: aggregatePipeline }) as any[];
        
        const newMap: Record<string, any> = {};
        for (const agg of rawAgg) {
            if (!agg._id) continue; // Ignore records without createdAt
            newMap[agg._id] = {
                date: agg._id,
                totalRevenue: typeof agg.totalRevenue === 'number' ? Number(agg.totalRevenue.toFixed(2)) : 0,
                amountReceived: typeof agg.amountReceived === 'number' ? Number(agg.amountReceived.toFixed(2)) : 0,
                totalSales: typeof agg.totalSales === 'number' ? agg.totalSales : 0
            };
        }
        
        resultNew = Object.values(newMap).sort((a: any, b: any) =>
          b.date.localeCompare(a.date)
        );
        
    } catch (e) {
        console.error("[SALES_DASH_PERF] AggregateRaw failed:", e);
        return NextResponse.json({ error: "Aggregation failed" }, { status: 500 });
    }
    const t3 = performance.now();

    console.log(`[SALES_DASH_PERF] day-report-by-assigner | DB Aggregation: ${(t3-t2).toFixed(2)}ms`);

    return NextResponse.json({ data: resultNew });
  } catch (error) {
    console.error("Error in day-report-by-assigner:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
