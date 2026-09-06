import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { startOfMonth, endOfMonth, format, startOfWeek, endOfWeek, parseISO, startOfDay, getISOWeek, getYear } from "date-fns";

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
    
    // Legacy Chart Data (for Overview Tab)
    const departmentBreakdown: Record<string, number> = {};
    const salesTrend: Record<string, { sales: number, revenue: number }> = {};
    const topMembers: Record<string, { name: string, revenue: number }> = {};

    // New Data Structures
    const dayData: Record<string, any> = {};
    const weekData: Record<string, any> = {};
    const monthData: Record<string, any> = {};
    const assignerData: Record<string, any> = {};
    const ticketSizeAnalysis: Record<string, { micro: number, medium: number, enterprise: number }> = {
      "Digital": { micro: 0, medium: 0, enterprise: 0 },
      "Retention": { micro: 0, medium: 0, enterprise: 0 },
      "Onboarding": { micro: 0, medium: 0, enterprise: 0 }
    };
    
    const crossDepartmentTop: Record<string, Record<string, { name: string, revenue: number }>> = {
      "Digital": {},
      "Retention": {},
      "Onboarding": {}
    };

    filteredTasks.forEach(task => {
      const amt = task.amount || 0;
      totalRevenue += amt;
      if (task.createdByClerkId) {
        activeMembers.add(task.createdByClerkId);
      }
      
      const dept = task.departmentAtSale || "Digital";
      const memberId = task.createdByClerkId || "system";
      const memberName = task.createdByName || "Unknown";
      
      // Overview Data
      departmentBreakdown[dept] = (departmentBreakdown[dept] || 0) + amt;
      const dateStr = format(new Date(task.createdAt), 'MMM dd');
      if (!salesTrend[dateStr]) salesTrend[dateStr] = { sales: 0, revenue: 0 };
      salesTrend[dateStr].sales += 1;
      salesTrend[dateStr].revenue += amt;
      
      if (!topMembers[memberId]) topMembers[memberId] = { name: memberName, revenue: 0 };
      topMembers[memberId].revenue += amt;

      // Day-on-Day
      const dayKey = format(new Date(task.createdAt), 'yyyy-MM-dd');
      if (!dayData[dayKey]) {
        dayData[dayKey] = { date: dayKey, totalRevenue: 0, totalSales: 0, digital: 0, retention: 0, onboarding: 0 };
      }
      dayData[dayKey].totalRevenue += amt;
      dayData[dayKey].totalSales += 1;
      if (dept === 'Digital') dayData[dayKey].digital += amt;
      if (dept === 'Retention') dayData[dayKey].retention += amt;
      if (dept === 'Onboarding') dayData[dayKey].onboarding += amt;

      // Week-on-Week
      const weekKey = `W${getISOWeek(new Date(task.createdAt))} ${getYear(new Date(task.createdAt))}`;
      if (!weekData[weekKey]) {
        weekData[weekKey] = { week: weekKey, totalRevenue: 0, totalSales: 0, digital: 0, retention: 0, onboarding: 0 };
      }
      weekData[weekKey].totalRevenue += amt;
      weekData[weekKey].totalSales += 1;
      if (dept === 'Digital') weekData[weekKey].digital += amt;
      if (dept === 'Retention') weekData[weekKey].retention += amt;
      if (dept === 'Onboarding') weekData[weekKey].onboarding += amt;

      // Month-on-Month
      const monthKey = format(new Date(task.createdAt), 'MMM yyyy');
      if (!monthData[monthKey]) {
        monthData[monthKey] = { month: monthKey, totalRevenue: 0, totalSales: 0, digital: 0, retention: 0, onboarding: 0 };
      }
      monthData[monthKey].totalRevenue += amt;
      monthData[monthKey].totalSales += 1;
      if (dept === 'Digital') monthData[monthKey].digital += amt;
      if (dept === 'Retention') monthData[monthKey].retention += amt;
      if (dept === 'Onboarding') monthData[monthKey].onboarding += amt;

      // Assigner-wise
      if (!assignerData[memberId]) {
        assignerData[memberId] = { name: memberName, totalRevenue: 0, totalSales: 0, digital: 0, retention: 0, onboarding: 0 };
      }
      assignerData[memberId].totalRevenue += amt;
      assignerData[memberId].totalSales += 1;
      if (dept === 'Digital') assignerData[memberId].digital += amt;
      if (dept === 'Retention') assignerData[memberId].retention += amt;
      if (dept === 'Onboarding') assignerData[memberId].onboarding += amt;

      // Cross Department Leaderboard
      if (crossDepartmentTop[dept]) {
        if (!crossDepartmentTop[dept][memberId]) {
          crossDepartmentTop[dept][memberId] = { name: memberName, revenue: 0 };
        }
        crossDepartmentTop[dept][memberId].revenue += amt;
      }

      // Ticket Size Analysis
      if (ticketSizeAnalysis[dept]) {
        if (amt < 10000) ticketSizeAnalysis[dept].micro += 1;
        else if (amt <= 50000) ticketSizeAnalysis[dept].medium += 1;
        else ticketSizeAnalysis[dept].enterprise += 1;
      }
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
    
    // Sort and format the new structures
    const formatDepartmentLeaders = (deptMap: Record<string, { name: string, revenue: number }>) => {
      return Object.values(deptMap).sort((a, b) => b.revenue - a.revenue).slice(0, 3);
    };

    const analytics = {
      dayData: Object.values(dayData).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      weekData: Object.values(weekData), // Can just stay in order of processing
      monthData: Object.values(monthData),
      assignerData: Object.values(assignerData).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue),
      ticketSizeAnalysis: [
        { name: 'Digital', ...ticketSizeAnalysis['Digital'] },
        { name: 'Retention', ...ticketSizeAnalysis['Retention'] },
        { name: 'Onboarding', ...ticketSizeAnalysis['Onboarding'] },
      ],
      crossDepartmentLeaders: {
        digital: formatDepartmentLeaders(crossDepartmentTop['Digital']),
        retention: formatDepartmentLeaders(crossDepartmentTop['Retention']),
        onboarding: formatDepartmentLeaders(crossDepartmentTop['Onboarding']),
      }
    };

    return NextResponse.json({
      summary,
      chartData,
      analytics,
      detailedSales: filteredTasks
    });

  } catch (error) {
    console.error("Error in department sales API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
