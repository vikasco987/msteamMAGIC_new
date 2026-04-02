import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { isHidden: false },
          { isHidden: false }
        ]
      },
      select: {
        createdAt: true,
        amount: true,
        received: true,
      },
    });

    const monthMap: Record<string, { totalRevenue: number; amountReceived: number; totalLeads: number }> = {};

    for (const task of tasks) {
      const monthKey = new Date(task.createdAt).toISOString().slice(0, 7); // YYYY-MM

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          totalRevenue: 0,
          amountReceived: 0,
          totalLeads: 0,
        };
      }

      monthMap[monthKey].totalRevenue += task.amount || 0;
      monthMap[monthKey].amountReceived += task.received || 0;
      monthMap[monthKey].totalLeads += 1;
    }

    const result = Object.entries(monthMap)
      .sort(([a], [b]) => b.localeCompare(a)) // latest first
      .map(([month, stats]) => ({
        month,
        ...stats,
        pendingAmount: stats.totalRevenue - stats.amountReceived,
      }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in month-report:", error);
    return NextResponse.json({ error: "Failed to generate month report" }, { status: 500 });
  }
}













