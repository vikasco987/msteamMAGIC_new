import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

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
      select: { customFields: true, amount: true } 
    });

    const data: Record<string, number> = {};
    for (const task of tasks) {
      const category = (task.customFields as any)?.category || "Uncategorized";
      data[category] = (data[category] || 0) + (task.amount || 0);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Category error:", err);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
