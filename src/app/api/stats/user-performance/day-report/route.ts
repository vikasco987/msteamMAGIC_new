import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const t0 = performance.now();
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    let rawRole = dbUser?.role;
    if (!rawRole) {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      rawRole = clerkUser.publicMetadata?.role as string || "user";
    }
    
    const role = String(rawRole).toLowerCase();
    const isTL = dbUser?.isTeamLeader || role === 'tl';
    const isPrivileged = ['admin', 'master'].includes(role);

    let filter: any = {};

    if (!isPrivileged) {
      let userIds = [userId];
      if (isTL) {
          const members = await prisma.user.findMany({
              where: { leaderIds: { has: userId } },
              select: { clerkId: true }
          });
          userIds = [userId, ...members.map(m => m.clerkId)];
      }
      
      filter = {
        AND: [
          { isHidden: false },
          {
            OR: [
              { createdByClerkId: { in: userIds } },
              { assigneeId: { in: userIds } },
              { assigneeIds: { hasSome: userIds } }
            ]
          }
        ]
      };
    }
    const t1 = performance.now();

    const matchConditions: any = {};
    if (!isPrivileged) {
        matchConditions.$and = [
            { isHidden: false },
            {
                $or: [
                    { createdByClerkId: { $in: userIds } },
                    { assigneeId: { $in: userIds } },
                    { assigneeIds: { $in: userIds } }
                ]
            }
        ];
    }

    const aggregatePipeline: any[] = [];
    if (Object.keys(matchConditions).length > 0) {
        aggregatePipeline.push({ $match: matchConditions });
    }
    
    aggregatePipeline.push({
        $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            totalRevenue: { $sum: "$amount" },
            amountReceived: { $sum: "$received" },
            totalLeads: { $sum: 1 }
        }
    });

    let allDates: any[] = [];

    try {
        const rawAgg = await prisma.task.aggregateRaw({ pipeline: aggregatePipeline }) as any[];
        const newDayMap: Record<string, any> = {};
        for (const agg of rawAgg) {
            if (!agg._id) continue;
            newDayMap[agg._id] = {
                totalRevenue: typeof agg.totalRevenue === 'number' ? agg.totalRevenue : 0,
                amountReceived: typeof agg.amountReceived === 'number' ? agg.amountReceived : 0,
                totalLeads: typeof agg.totalLeads === 'number' ? agg.totalLeads : 0
            };
        }

        allDates = Object.entries(newDayMap)
          .sort(([a], [b]) => b.localeCompare(a)) // recent first
          .map(([date, stats], index, arr) => {
            const prevCumulative =
              index > 0 ? (arr[index - 1][1] as any).cumulativeRevenue ?? 0 : 0;
            const currentRevenue = stats.totalRevenue;
            const cumulativeRevenue = prevCumulative + currentRevenue;
    
            (arr[index][1] as any).cumulativeRevenue = cumulativeRevenue;
    
            return {
              date,
              totalLeads: stats.totalLeads,
              totalRevenue: stats.totalRevenue,
              amountReceived: stats.amountReceived,
              pendingAmount: stats.totalRevenue - stats.amountReceived,
              cumulativeRevenue,
            };
          });

    } catch (e) {
        console.error("[SALES_DASH_PERF] AggregateRaw failed:", e);
    }

    const t2 = performance.now();

    console.log(`[SALES_DASH_PERF] day-report | Auth: ${(t1-t0).toFixed(2)}ms | DB Aggregation: ${(t2-t1).toFixed(2)}ms | Total Days: ${allDates.length}`);

    const total = allDates.length;
    const paginated = allDates.slice((page - 1) * limit, page * limit);

    return NextResponse.json({ data: paginated, total });
  } catch (error) {
    console.error("Error in day-report:", error);
    return NextResponse.json(
      { error: "Failed to generate day report" },
      { status: 500 }
    );
  }
}
