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

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    
    const role = String(clerkUser.publicMetadata?.role || dbUser?.role || "user").toLowerCase();
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

    const t_auth_end = performance.now();

    // === NEW IMPLEMENTATION (DB Aggregation) ===
    let groupedNew: Record<string, number> = {};
    
    try {
      const groupedNewRaw = await prisma.task.groupBy({
        by: ['assigneeName'],
        where: filter,
        _sum: { amount: true },
      });

      for (const group of groupedNewRaw) {
        const name = group.assigneeName || "Unassigned";
        groupedNew[name] = (groupedNew[name] || 0) + (group._sum.amount || 0);
      }
    } catch (e) {
      console.error("[SALES_DASH_PERF] groupBy failed:", e);
      return NextResponse.json({ error: "Aggregation failed" }, { status: 500 });
    }
    const t_db_end = performance.now();

    const authTime = (t_auth_end - t_start).toFixed(2);
    const dbTime = (t_db_end - t_auth_end).toFixed(2);
    const totalTime = (t_db_end - t_start).toFixed(2);

    console.log(`[SALES_DASH_PERF] by-assignee | Auth: ${authTime}ms | DB GroupBy: ${dbTime}ms | Total Profiled: ${totalTime}ms`);

    return NextResponse.json(groupedNew);
  } catch (error) {
    console.error("Error in by-assignee stats:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
