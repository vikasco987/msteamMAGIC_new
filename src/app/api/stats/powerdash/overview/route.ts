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
        where: { leaderId: userId },
        select: { clerkId: true }
      });
      teamMemberIds = members.map(m => m.clerkId);
    }

    const where: any = {};
    if (!isPrivileged) {
      if (isTL) {
        where.createdByClerkId = { in: [userId, ...teamMemberIds] };
      } else {
        where.createdByClerkId = userId;
      }
    }

    const tasks = await prisma.task.findMany({ where });

    const totalRevenue = tasks.reduce((sum, t) => sum + (t.amount || 0), 0);
    const amountReceived = tasks.reduce((sum, t) => sum + (t.received || 0), 0);
    const pendingAmount = totalRevenue - amountReceived;
    const totalSales = tasks.length;

    return NextResponse.json({ totalRevenue, amountReceived, pendingAmount, totalSales });
  } catch (error) {
    console.error("Overview error:", error);
    return NextResponse.json({ error: "Failed to load overview" }, { status: 500 });
  }
}
