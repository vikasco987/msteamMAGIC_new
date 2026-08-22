import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    if (!year || !month) {
      return NextResponse.json({ error: "Missing year or month" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    const userRole = String(dbUser?.role || "USER").toUpperCase();
    const isTL = dbUser?.isTeamLeader || userRole === "TL";
    const isPrivileged = userRole === "ADMIN" || userRole === "MASTER";

    let teamMemberIds: string[] = [];
    if (isTL) {
      const members = await prisma.user.findMany({
        where: { leaderIds: { has: userId } },
        select: { clerkId: true }
      });
      teamMemberIds = members.map(m => m.clerkId);
    }

    const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(month);
    const startDate = new Date(Number(year), monthIndex, 1);
    const endDate = new Date(Number(year), monthIndex + 1, 0, 23, 59, 59);

    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (!isPrivileged) {
      if (isTL && teamMemberIds.length > 0) {
        where.OR = [
          { createdByClerkId: { in: [userId, ...teamMemberIds] } },
          { assigneeIds: { hasSome: [userId, ...teamMemberIds] } },
          { assigneeId: { in: [userId, ...teamMemberIds] } }
        ];
      } else {
        where.OR = [
          { createdByClerkId: userId },
          { assigneeIds: { has: userId } },
          { assigneeId: userId }
        ];
      }
    }

    const sales = await prisma.task.findMany({
      where,
      select: {
        createdAt: true,
        amount: true,
      },
    });

    const grouped = sales.reduce((acc, sale) => {
      const day = new Date(sale.createdAt).getDate();
      acc[day] = (acc[day] || 0) + (sale.amount || 0);
      return acc;
    }, {} as Record<number, number>);

    const result = Object.entries(grouped).map(([day, total]) => ({
      day,
      total,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Monthly Revenue error:", err);
    return NextResponse.json({ error: "Failed to load monthly revenue" }, { status: 500 });
  }
}
