import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { startOfMonth, endOfMonth, format } from "date-fns";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const memberId = searchParams.get("memberId");
    const saleType = searchParams.get("saleType");
    const paymentStatus = searchParams.get("paymentStatus");

    // Date Range Default: This Month
    let startDate = startDateParam ? new Date(startDateParam) : startOfMonth(new Date());
    let endDate = endDateParam ? new Date(endDateParam) : endOfMonth(new Date());

    // Build the query
    const whereClause: any = {
      createdAt: { gte: startDate, lte: endDate },
    };

    if (department && department !== "All Departments" && department !== "Overall") {
      whereClause.departmentAtSale = department;
    }
    
    if (memberId && memberId !== "All") {
      whereClause.createdByClerkId = memberId;
    }
    
    if (saleType && saleType !== "All") {
      whereClause.saleType = saleType;
    }

    // Fetch tasks
    const tasks = await prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        amount: true,
        received: true,
        departmentAtSale: true,
        saleType: true,
        createdAt: true,
        createdByClerkId: true,
        createdByName: true,
      },
      orderBy: { createdAt: "desc" }
    });

    // Post-process for Payment Status Filter if needed
    let filteredTasks = tasks;
    if (paymentStatus && paymentStatus !== "All") {
      filteredTasks = tasks.filter(t => {
        const amt = t.amount || 0;
        const rec = t.received || 0;
        const isCompleted = rec >= amt && amt > 0;
        
        if (paymentStatus === "Paid / Completed") return isCompleted;
        if (paymentStatus === "Pending / Partial") return !isCompleted;
        return true;
      });
    }

    // Calculate Summary KPIs
    let totalRevenue = 0;
    const activeMembers = new Set();
    
    // For Charts
    const departmentBreakdown: Record<string, number> = {};
    const salesTrend: Record<string, { sales: number, revenue: number }> = {};
    const topMembers: Record<string, { name: string, revenue: number }> = {};

    filteredTasks.forEach(task => {
      const amt = task.amount || 0;
      totalRevenue += amt;
      activeMembers.add(task.createdByClerkId);

      // Dept Breakdown
      const dept = task.departmentAtSale || "Digital";
      departmentBreakdown[dept] = (departmentBreakdown[dept] || 0) + amt;

      // Sales Trend
      const dateStr = format(new Date(task.createdAt), 'MMM dd');
      if (!salesTrend[dateStr]) salesTrend[dateStr] = { sales: 0, revenue: 0 };
      salesTrend[dateStr].sales += 1;
      salesTrend[dateStr].revenue += amt;

      // Top Members
      const memberId = task.createdByClerkId;
      const memberName = task.createdByName || "Unknown";
      if (!topMembers[memberId]) topMembers[memberId] = { name: memberName, revenue: 0 };
      topMembers[memberId].revenue += amt;
    });

    const summary = {
      totalRevenue,
      totalSalesCount: filteredTasks.length,
      aov: filteredTasks.length > 0 ? (totalRevenue / filteredTasks.length) : 0,
      activeMembersCount: activeMembers.size
    };

    const chartData = {
      departmentBreakdown: Object.entries(departmentBreakdown).map(([name, value]) => ({ name, value })),
      salesTrend: Object.entries(salesTrend).map(([date, data]) => ({ date, ...data })),
      topMembers: Object.values(topMembers).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
    };

    return NextResponse.json({
      summary,
      chartData,
      detailedSales: filteredTasks
    });

  } catch (error) {
    console.error("Error in department sales API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
