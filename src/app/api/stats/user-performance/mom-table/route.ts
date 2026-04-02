import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

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

    if (!isPrivileged) {
      let userIds = [userId];
      if (isTL) {
          const members = await prisma.user.findMany({
              where: { leaderId: userId },
              select: { clerkId: true }
          });
          userIds = [userId, ...members.map(m => m.clerkId)];
      }
      
      baseFilter = {
          ...baseFilter,
          OR: [
              { createdByClerkId: { in: userIds } },
              { assigneeId: { in: userIds } },
              { assigneeIds: { hasSome: userIds } }
          ]
      };
    }

    const tasks = await prisma.task.findMany({
      where: baseFilter,
      select: {
        createdAt: true,
        amount: true,
        received: true,
      },
    });

    const monthlyMap: Record<
      string,
      { totalRevenue: number; amountReceived: number; totalLeads: number }
    > = {};

    for (const task of tasks) {
      if (!task.createdAt) continue;
      const monthKey = new Date(task.createdAt).toISOString().slice(0, 7); // "YYYY-MM"

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          totalRevenue: 0,
          amountReceived: 0,
          totalLeads: 0,
        };
      }

      monthlyMap[monthKey].totalRevenue +=
        typeof task.amount === "number" ? task.amount : 0;
      monthlyMap[monthKey].amountReceived +=
        typeof task.received === "number" ? task.received : 0;
      monthlyMap[monthKey].totalLeads += 1;
    }

    const sortedMonths = Object.keys(monthlyMap).sort(); // Sort chronologically ascending
    let cumulativeTotal = 0; // Initialize cumulative total

    const momStats = sortedMonths.map((month, index) => {
      const current = monthlyMap[month];
      const previous = monthlyMap[sortedMonths[index - 1]] || {
        totalRevenue: 0,
        amountReceived: 0,
        totalLeads: 0,
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
        cumulativeRevenue: cumulativeTotal, // Add the new cumulative field
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