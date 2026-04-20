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
    // 🛡️ Build Filter
    const where: any = {
      AND: [
        startDate ? { updatedAt: { gte: new Date(startDate) } } : {},
        endDate ? { updatedAt: { lte: new Date(endDate) } } : {},
        search ? {
          task: {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { shopName: { contains: search, mode: 'insensitive' } },
              { customerName: { contains: search, mode: 'insensitive' } },
            ]
          }
        } : {},
      ]
    };

    // 🛡️ Fetch Paginated Payments
    const [payments, totalEntries] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { task: true },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where })
    ]);

    // 🛡️ Calculate Total Received (for stats)
    // For large datasets, this could be a prisma.payment.aggregate, 
    // but for 1000s it's fine to do a quick sum or a separate aggregate call.
    const statsResult = await prisma.payment.aggregate({
      where,
      _sum: { received: true }
    });

    const reportData = payments.map(p => ({
      id: p.id,
      taskId: p.taskId,
      date: p.updatedAt,
      title: p.task.title,
      shopName: p.task.shopName,
      customerName: p.task.customerName,
      phone: (p.task as any).phone,
      location: (p.task as any).location,
      totalBudget: p.task.amount || 0,
      received: p.received || 0,
      utr: p.utr,
      updatedBy: p.updatedBy,
      proof: p.fileUrl
    }));

    const totalPages = Math.ceil(totalEntries / limit);

    return NextResponse.json({
      data: reportData,
      pagination: {
        totalEntries,
        totalPages,
        currentPage: page,
        limit
      },
      stats: {
        totalReceived: statsResult._sum.received || 0,
        count: totalEntries
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
