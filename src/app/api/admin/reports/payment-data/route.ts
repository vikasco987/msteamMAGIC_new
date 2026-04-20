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
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

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
        ]
      },
      orderBy: { updatedAt: 'desc' }
    });

    const fullReportData: any[] = [];
    let totalReceived = 0;

    tasks.forEach(task => {
      const history = Array.isArray(task.paymentHistory) ? task.paymentHistory : [];
      
      history.forEach((entry: any) => {
        const entryDate = entry.updatedAt ? new Date(entry.updatedAt) : null;
        
        // Date range filter
        if (startDate && entryDate && entryDate < new Date(startDate)) return;
        if (endDate && entryDate && entryDate > new Date(endDate)) return;

        totalReceived += (entry.received || 0);
        
        fullReportData.push({
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

    // Pagination slice
    const totalEntries = fullReportData.length;
    const totalPages = Math.ceil(totalEntries / limit);
    const paginatedData = fullReportData.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      data: paginatedData,
      pagination: {
        totalEntries,
        totalPages,
        currentPage: page,
        limit
      },
      stats: {
        totalReceived: totalReceived,
        count: totalEntries
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
