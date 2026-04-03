import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // YYYY-MM

    if (!month) {
      return NextResponse.json(
        { error: "Month query param required (YYYY-MM)" },
        { status: 400 }
      );
    }

    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Fetch tasks created by this seller for the month
    const tasks = await prisma.task.findMany({
      where: {
        createdByClerkId: userId,
        isHidden: false,
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        id: true,
        shopName: true,
        amount: true,
        received: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group by day for "day-wise" view
    const dayWise: Record<string, any[]> = {};
    tasks.forEach(task => {
      const day = format(new Date(task.createdAt), "yyyy-MM-dd");
      if (!dayWise[day]) dayWise[day] = [];
      dayWise[day].push(task);
    });

    const history = Object.entries(dayWise).map(([date, tasks]) => ({
      date,
      count: tasks.length,
      revenue: tasks.reduce((sum, t) => sum + (t.amount || 0), 0),
      tasks: tasks.map(t => ({
        id: t.id,
        shopName: t.shopName || "Unknown Shop",
        amount: t.amount || 0,
        received: t.received || 0,
        time: format(new Date(t.createdAt), "hh:mm a"),
      }))
    })).sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({ history }, { status: 200 });
  } catch (error: any) {
    console.error("🔥 Error in /api/seller/sales-history:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
