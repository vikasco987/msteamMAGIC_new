import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const metadataRole = (clerkUser.publicMetadata as any)?.role || (clerkUser.privateMetadata as any)?.role;
    const userRole = String(metadataRole || dbUser?.role || "USER").toUpperCase();
    
    const isTL = (dbUser as any)?.isTeamLeader || userRole === "TL";
    const isPrivileged = userRole === "ADMIN" || userRole === "MASTER";

    let teamMemberIds: string[] = [];
    if (isTL) {
      const members = await prisma.user.findMany({
        where: { leaderId: userId } as any,
        select: { clerkId: true }
      });
      teamMemberIds = members.map(m => m.clerkId);
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // YYYY-MM

    const startDate = new Date(`${month}-01`);
    const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));

    const where: any = {
      createdAt: { gte: startDate, lt: endDate },
    };

    if (!isPrivileged) {
      where.AND = [
        { isHidden: false }
      ];
      if (isTL) {
        where.AND.push({ createdByClerkId: { in: [userId, ...teamMemberIds] } });
      } else {
        where.AND.push({ createdByClerkId: userId });
      }
    }

    const tasks = await prisma.task.findMany({ where });

    const totalRevenue = tasks.reduce((sum, t) => sum + (t.amount || 0), 0);
    const amountReceived = tasks.reduce((sum, t) => sum + (t.received || 0), 0);
    const pendingAmount = totalRevenue - amountReceived;
    const totalSales = tasks.length;

    // Monthly breakdown
    const monthlyDataMap: { [key: string]: number } = {};
    tasks.forEach((t) => {
      const monthKey = new Date(t.createdAt).toISOString().slice(0, 7); // "2025-07"
      monthlyDataMap[monthKey] = (monthlyDataMap[monthKey] || 0) + (t.amount || 0);
    });

    const monthlyData = Object.entries(monthlyDataMap).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    return NextResponse.json({
      totalRevenue,
      amountReceived,
      pendingAmount,
      totalSales,
      monthlyData,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
