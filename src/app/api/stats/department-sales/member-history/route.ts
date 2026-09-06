import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all users with their history logs
    const users = await prisma.user.findMany({
      include: {
        historyLogs: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    const results = [];

    // For each user, compute their tenures
    for (const u of users) {
      const tenures = [];
      let currentStartDate = u.createdAt;
      
      for (const log of u.historyLogs) {
        tenures.push({
          department: log.previousDepartment || "Digital",
          startDate: currentStartDate,
          endDate: log.createdAt,
          isCurrent: false
        });
        currentStartDate = log.createdAt; 
      }
      
      tenures.push({
        department: u.currentDepartment || "Digital",
        startDate: currentStartDate,
        endDate: new Date(),
        isCurrent: true
      });

      let hasSales = false;

      // Query tasks for each tenure
      for (const tenure of tenures) {
        const tasks = await prisma.task.findMany({
          where: {
            createdByClerkId: u.clerkId,
            createdAt: {
              gte: tenure.startDate,
              lte: tenure.endDate,
            }
          },
          select: { amount: true }
        });

        const totalRevenue = tasks.reduce((sum, t) => sum + (t.amount || 0), 0);
        tenure.totalSales = tasks.length;
        tenure.totalRevenue = totalRevenue;

        if (tasks.length > 0) hasSales = true;
      }

      // Only return users who actually have sales OR have a transfer history, to avoid clutter
      if (hasSales || u.historyLogs.length > 0) {
        results.push({
          clerkId: u.clerkId,
          name: u.name || "Unknown",
          email: u.email,
          currentDepartment: u.currentDepartment || "Digital",
          tenures: tenures.reverse() // Most recent first
        });
      }
    }

    return NextResponse.json({ data: results });

  } catch (error) {
    console.error("Error in member-history API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
