import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

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
              where: { leaderId: userId },
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

    const tasks = await prisma.task.findMany({
      where: filter,
      select: {
        createdAt: true,
        amount: true,
        received: true,
      },
    });

    const dayMap: Record<
      string,
      {
        totalRevenue: number;
        amountReceived: number;
        totalLeads: number;
        cumulativeRevenue?: number;
      }
    > = {};

    for (const task of tasks) {
      const dateKey = new Date(task.createdAt).toISOString().slice(0, 10);
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = {
          totalRevenue: 0,
          amountReceived: 0,
          totalLeads: 0,
        };
      }
      dayMap[dateKey].totalRevenue += task.amount || 0;
      dayMap[dateKey].amountReceived += task.received || 0;
      dayMap[dateKey].totalLeads += 1;
    }

    // Sort newest → oldest
    const allDates = Object.entries(dayMap)
      .sort(([a], [b]) => b.localeCompare(a)) // ✅ recent first
      .map(([date, stats], index, arr) => {
        // Calculate cumulative revenue in reverse order
        const prevCumulative =
          index > 0 ? (arr[index - 1][1] as any).cumulativeRevenue ?? 0 : 0;
        const currentRevenue = stats.totalRevenue;
        const cumulativeRevenue = prevCumulative + currentRevenue;

        // Store cumulative in the source array slice so next iteration can see it
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
