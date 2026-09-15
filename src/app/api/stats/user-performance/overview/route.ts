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

    // ✅ Get start and end of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    let filter: any = {
      createdAt: {
        gte: startOfMonth,
        lt: startOfNextMonth,
      },
    };

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
          ...filter,
          OR: [
              { createdByClerkId: { in: userIds } },
              { assigneeId: { in: userIds } },
              { assigneeIds: { hasSome: userIds } }
          ]
      };
    }

    const t_auth_end = performance.now();

    // ✅ Fetch only current month sales
    const tasks = await prisma.task.findMany({
      where: filter,
      select: {
        amount: true,
        received: true,
      },
    });

    // ✅ Calculate current month totals
    const totalRevenue = tasks.reduce((sum, t) => sum + (t.amount || 0), 0);
    const amountReceived = tasks.reduce((sum, t) => sum + (t.received || 0), 0);
    const pendingAmount = totalRevenue - amountReceived;
    const totalSales = tasks.length;
    
    const t_db_end = performance.now();

    const authTime = (t_auth_end - t_start).toFixed(2);
    const dbTime = (t_db_end - t_auth_end).toFixed(2);
    const totalTime = (t_db_end - t_start).toFixed(2);

    console.log(`[SALES_DASH_PERF] overview | Auth: ${authTime}ms | DB & Calc: ${dbTime}ms | Total Profiled: ${totalTime}ms | Rows: ${tasks.length}`);

    return NextResponse.json({
      totalRevenue,
      amountReceived,
      pendingAmount,
      totalSales,
    });
  } catch (error) {
    console.error("Error fetching current month overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch overview stats" },
      { status: 500 }
    );
  }
}
