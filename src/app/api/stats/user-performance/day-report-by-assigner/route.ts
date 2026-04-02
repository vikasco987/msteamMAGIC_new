// FILE: src/app/api/stats/user-performance/day-report-by-assigner/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
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

    // Filter logic helper
    const applyUserFilter = async (baseFilter: any) => {
      if (isPrivileged) return baseFilter;
      let userIds = [userId];
      if (isTL) {
          const members = await prisma.user.findMany({
              where: { leaderId: userId },
              select: { clerkId: true }
          });
          userIds = [userId, ...members.map(m => m.clerkId)];
      }
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

      const filter = await applyUserFilter({
        createdAt: {
          gte: start,
          lt: end,
        },
      });

      const tasks = await prisma.task.findMany({
        where: filter,
      });

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

      return NextResponse.json({
        details: Object.values(assignerMap),
      });
    }

    // ✅ Summary: group by day
    const filter = await applyUserFilter({});
    const tasks = await prisma.task.findMany({
      where: filter
    });

    const dayMap: Record<string, any> = {};
    tasks.forEach((task) => {
      const day = new Date(task.createdAt).toISOString().slice(0, 10);
      if (!dayMap[day]) {
        dayMap[day] = {
          date: day,
          totalRevenue: 0,
          amountReceived: 0,
          totalSales: 0,
        };
      }
      dayMap[day].totalRevenue += task.amount || 0;
      dayMap[day].amountReceived += task.received || 0;
      dayMap[day].totalSales += 1;
    });

    const result = Object.values(dayMap).sort((a: any, b: any) =>
      b.date.localeCompare(a.date)
    );

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error in day-report-by-assigner:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
