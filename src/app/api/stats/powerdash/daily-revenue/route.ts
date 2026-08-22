import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    const where: any = {};
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

    const tasks = await prisma.task.findMany({ 
      where,
      select: { amount: true, createdAt: true } 
    });

    const data: Record<string, number> = {};
    for (const task of tasks) {
      const date = format(task.createdAt, "yyyy-MM-dd");
      data[date] = (data[date] || 0) + (task.amount || 0);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Daily Revenue error:", err);
    return NextResponse.json({ error: "Failed to load daily revenue" }, { status: 500 });
  }
}
