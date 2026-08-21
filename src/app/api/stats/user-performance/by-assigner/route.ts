// FILE: src/app/api/stats/user-performance/by-assigner/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

const safeFloat = (v: any): number => {
  if (v == null || v === "") return 0;
  const n = parseFloat(String(v));
  return isNaN(n) || !isFinite(n) ? 0 : n;
};

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month"); // format: YYYY-MM

    let startDate: Date;
    let endDate: Date;

    if (monthParam) {
      // Parse YYYY-MM into start & end of month
      const [year, month] = monthParam.split("-").map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 1);
    } else {
      // Default: current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    // Role and Team check
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    
    const role = String(clerkUser.publicMetadata?.role || dbUser?.role || "user").toLowerCase();
    const isTL = dbUser?.isTeamLeader || role === 'tl';
    const isPrivileged = ['admin', 'master'].includes(role);

    let filter: any = {
      createdAt: {
        gte: startDate,
        lt: endDate,
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

    // ✅ Fetch tasks within selected month
    const tasks = await prisma.task.findMany({
      where: filter,
      select: {
        assignerName: true,
        assignerEmail: true,
        createdByName: true,
        createdByEmail: true,
        amount: true,
        received: true,
        customFields: true,
      },
    });

    // ✅ Fetch employee expenses
    const employeeExpenses = await prisma.employeeExpense.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    // ✅ Group by assigner
    const assignerMap: Record<
      string,
      {
        name: string;
        email: string;
        totalRevenue: number;
        amountReceived: number;
        totalSales: number;
        taskDirectExpense: number;
        employeeManualExpense: number;
        totalExpense: number;
      }
    > = {};

    for (const task of tasks) {
      const name = task.assignerName || task.createdByName || "Unknown";
      const email = task.assignerEmail || task.createdByEmail || "";

      const key = email || name;
      if (!assignerMap[key]) {
        assignerMap[key] = {
          name,
          email,
          totalRevenue: 0,
          amountReceived: 0,
          totalSales: 0,
          taskDirectExpense: 0,
          employeeManualExpense: 0,
          totalExpense: 0,
        };
      }

      const customFields = (task.customFields as any) || {};
      const delivery = safeFloat(customFields.deliveryCharge);
      const costPrice = safeFloat(customFields.costPrice);
      const directExp = delivery + costPrice;

      assignerMap[key].totalRevenue += task.amount || 0;
      assignerMap[key].amountReceived += task.received || 0;
      assignerMap[key].taskDirectExpense += directExp;
      
      if ((task.amount || 0) > 0) {
        assignerMap[key].totalSales += 1;
      }
    }

    // Process employee expenses
    for (const exp of employeeExpenses) {
      const email = exp.assignerEmail?.trim().toLowerCase() || "";
      const name = exp.assignerName?.trim() || "Unknown";
      const key = email || name;

      if (!assignerMap[key]) {
        // If assigner has expenses but no tasks
        assignerMap[key] = {
          name,
          email,
          totalRevenue: 0,
          amountReceived: 0,
          totalSales: 0,
          taskDirectExpense: 0,
          employeeManualExpense: 0,
          totalExpense: 0,
        };
      }
      assignerMap[key].employeeManualExpense += safeFloat(exp.amount);
    }

    // ✅ Convert to array & add pending/totalExpense
    const data = Object.values(assignerMap).map((a) => {
      a.totalExpense = a.taskDirectExpense + a.employeeManualExpense;
      return {
        ...a,
        pendingAmount: a.totalRevenue - a.amountReceived,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in /by-assigner:", error);
    return NextResponse.json(
      { error: "Failed to fetch assigner stats" },
      { status: 500 }
    );
  }
}
