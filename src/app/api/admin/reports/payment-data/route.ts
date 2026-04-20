import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const role = (user?.publicMetadata?.role as string || "").toLowerCase();
  if (role !== "master" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const search = searchParams.get("search");

  try {
    const tasks = await prisma.task.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { shopName: { contains: search, mode: 'insensitive' } },
              { customerName: { contains: search, mode: 'insensitive' } },
            ]
          } : {},
          // Date filtering is tricky because history is JSON
          // We'll filter in-memory if needed or filter by Task updatedAt
        ]
      },
      orderBy: { updatedAt: 'desc' }
    });

    const reportData: any[] = [];
    let totalReceived = 0;

    tasks.forEach(task => {
      const history = Array.isArray(task.paymentHistory) ? task.paymentHistory : [];
      
      history.forEach((entry: any) => {
        const entryDate = entry.updatedAt ? new Date(entry.updatedAt) : null;
        
        // Date range filter
        if (startDate && entryDate && entryDate < new Date(startDate)) return;
        if (endDate && entryDate && entryDate > new Date(endDate)) return;

        totalReceived += (entry.received || 0);
        
        reportData.push({
          id: task.id,
          date: entryDate,
          title: task.title,
          shopName: task.shopName,
          customerName: task.customerName,
          phone: (task as any).phone,
          location: (task as any).location,
          totalBudget: task.amount || 0,
          received: entry.received || 0,
          utr: entry.utr,
          updatedBy: entry.updatedBy,
          proof: entry.fileUrl
        });
      });
    });

    // Recalculate unique total budget across filtered tasks
    const uniqueTaskIds = new Set(reportData.map(r => r.id));
    const uniqueTasks = tasks.filter(t => uniqueTaskIds.has(t.id));
    const calculatedTotalBudget = uniqueTasks.reduce((acc, t) => acc + (t.amount || 0), 0);

    return NextResponse.json({
      data: reportData,
      stats: {
        totalBudget: calculatedTotalBudget,
        totalReceived: totalReceived,
        totalPending: calculatedTotalBudget - totalReceived,
        count: reportData.length
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
