import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const t_start = performance.now();
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    // Variable to hold accessible user IDs for non‑privileged users
    let userIds: string[] = [];
    const t_userids_start = performance.now();

    if (!isPrivileged) {
      // Base user ID (self)
      userIds = [userId];
      if (isTL) {
          // Include team members if the user is a team‑leader
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
    const t_userids_end = performance.now();
    console.log(`[SALES_DASH_PERF] monthly API | userIds calc: ${(t_userids_end - t_userids_start).toFixed(2)}ms`);

    const t_auth_end = performance.now();

    // === OPTIMIZED IMPLEMENTATION (DB Aggregation) ===
    let newMonthlyDataMap: Record<string, number> = {};
    let t_db_new_start = performance.now();

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
                _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                totalRevenue: { $sum: "$amount" }
            }
        });
        
        aggregatePipeline.push({
            $sort: { _id: 1 } // Sort chronologically by month
        });

        const rawAgg = await prisma.task.aggregateRaw({ pipeline: aggregatePipeline }) as any[];
        
        for (const agg of rawAgg) {
            if (!agg._id) continue;
            newMonthlyDataMap[agg._id] = typeof agg.totalRevenue === 'number' ? agg.totalRevenue : 0;
        }
    } catch (e) {
        console.error("[SALES_DASH_PERF] monthly API AggregateRaw failed:", e);
        return NextResponse.json({ error: "Aggregation failed" }, { status: 500 });
    }
    const t_db_new_end = performance.now();

    const authTime = (t_auth_end - t_start).toFixed(2);
    const dbNewTime = (t_db_new_end - t_db_new_start).toFixed(2);
    const totalTime = (t_db_new_end - t_start).toFixed(2);

    console.log(`[SALES_DASH_PERF] monthly API | Auth: ${authTime}ms | DB Aggregation: ${dbNewTime}ms | Total API: ${totalTime}ms`);

    return NextResponse.json(newMonthlyDataMap);
  } catch (err) {
    console.error("Error fetching monthly stats:", err);
    return NextResponse.json({ error: "Failed to load monthly stats" }, { status: 500 });
  }
}
