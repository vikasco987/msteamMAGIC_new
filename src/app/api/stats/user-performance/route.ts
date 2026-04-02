import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma"; 
import { auth } from "@clerk/nextjs/server";

// Fixed path

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    const userRole = String(dbUser?.role || "USER").toUpperCase();
    const isTL = dbUser?.isTeamLeader || userRole === "TL";
    const isPrivileged = userRole === "ADMIN" || userRole === "MASTER";

    let teamMemberIds: string[] = [];
    if (isTL) {
      const members = await db.user.findMany({
        where: { leaderId: userId },
        select: { clerkId: true }
      });
      teamMemberIds = members.map(m => m.clerkId);
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month");

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (monthParam) {
      const [year, month] = monthParam.split("-");
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);

      if (!isNaN(y) && !isNaN(m)) {
        startDate = new Date(y, m - 1, 1); // First day of month
        endDate = new Date(y, m, 0, 23, 59, 59, 999); // Last day of month
      }
    }

    const where: any = startDate && endDate
      ? {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }
      : {};

    if (!isPrivileged) {
        if (isTL) {
            where.createdByClerkId = { in: [userId, ...teamMemberIds] };
        } else {
            where.createdByClerkId = userId;
        }
    }

    const tasks = await db.task.findMany({
      where,
    });

    const userStatsMap: Record<string, { email: string; count: number }> = {};

    for (const task of tasks) {
      const email = task.createdByClerkId || "unknown";
      if (!userStatsMap[email]) {
        userStatsMap[email] = {
          email,
          count: 1,
        };
      } else {
        userStatsMap[email].count++;
      }
    }

    const stats = Object.values(userStatsMap).map((u) => ({
      email: u.email,
      taskCount: u.count,
    }));

    return NextResponse.json(stats);
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user performance" },
      { status: 500 }
    );
  }
}













