import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

function getWeekKey(date: Date): string {
  const temp = new Date(date);
  temp.setHours(0, 0, 0, 0);
  const day = temp.getDay();
  const diff = temp.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(temp.setDate(diff));
  return monday.toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export async function GET(req: NextRequest) {
  try {
    const t0 = performance.now();
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "1000"); // higher limit for chart

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
          OR: [
              { createdByClerkId: { in: userIds } },
              { assigneeId: { in: userIds } },
              { assigneeIds: { hasSome: userIds } }
          ]
      };
    }
    const t1 = performance.now();

    let allWeeks: any[] = [];
    let t2 = t1;

    try {
        const matchConditions: any = {};
        if (!isPrivileged) {
            matchConditions.$or = [
                { createdByClerkId: { $in: userIds } },
                { assigneeId: { $in: userIds } },
                { assigneeIds: { $in: userIds } }
            ];
        }

        const aggregatePipeline: any[] = [];
        if (Object.keys(matchConditions).length > 0) {
            aggregatePipeline.push({ $match: matchConditions });
        }
        
        aggregatePipeline.push({
            $group: {
                _id: { 
                    $dateToString: { 
                        format: "%Y-%m-%d", 
                        date: { 
                            $dateTrunc: { 
                                date: "$createdAt", 
                                unit: "week", 
                                startOfWeek: "monday",
                                timezone: "Asia/Kolkata" 
                            } 
                        } 
                    } 
                },
                totalRevenue: { $sum: "$amount" },
                amountReceived: { $sum: "$received" },
                totalLeads: { $sum: 1 }
            }
        });

        const rawAgg = await prisma.task.aggregateRaw({ pipeline: aggregatePipeline }) as any[];
        
        const newWeekMap: Record<string, any> = {};
        for (const agg of rawAgg) {
            if (!agg._id) continue;
            newWeekMap[agg._id] = {
                totalRevenue: typeof agg.totalRevenue === 'number' ? agg.totalRevenue : 0,
                amountReceived: typeof agg.amountReceived === 'number' ? agg.amountReceived : 0,
                totalLeads: typeof agg.totalLeads === 'number' ? agg.totalLeads : 0
            };
        }

        let cumulativeTotal = 0;
        
        allWeeks = Object.entries(newWeekMap)
            .sort(([a], [b]) => a.localeCompare(b)) // oldest first
            .map(([weekStart, stats]) => {
                const start = new Date(weekStart);
                const end = new Date(start);
                end.setDate(start.getDate() + 6);
                
                cumulativeTotal += stats.totalRevenue;
                
                return {
                    week: `Week of ${formatDate(weekStart)}`,
                    startDate: weekStart,
                    endDate: end.toISOString().split("T")[0],
                    totalLeads: stats.totalLeads,
                    totalRevenue: stats.totalRevenue,
                    amountReceived: stats.amountReceived,
                    pendingAmount: stats.totalRevenue - stats.amountReceived,
                    cumulativeRevenue: cumulativeTotal,
                };
            })
            .reverse(); // newest first
            
        t2 = performance.now();
    } catch (e) {
        console.error("[SALES_DASH_PERF] week-report AggregateRaw failed:", e);
    }

    console.log(`[SALES_DASH_PERF] week-report | Auth: ${(t1-t0).toFixed(2)}ms | DB Aggregation: ${(t2-t1).toFixed(2)}ms | Total Weeks: ${allWeeks.length}`);

    const total = allWeeks.length;
    const paginated = allWeeks.slice((page - 1) * limit, page * limit);

    return NextResponse.json({ data: paginated, total });
  } catch (error) {
    console.error("Error in week-report:", error);
    return NextResponse.json(
      { error: "Failed to generate week report" },
      { status: 500 }
    );
  }
}
