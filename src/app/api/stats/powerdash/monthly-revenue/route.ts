import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  if (!year || !month) {
    return NextResponse.json({ error: "Missing year or month" }, { status: 400 });
  }

  const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(month);
  const startDate = new Date(Number(year), monthIndex, 1);
  const endDate = new Date(Number(year), monthIndex + 1, 0, 23, 59, 59);

  const sales = await prisma.task.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      createdAt: true,
      amount: true,
    },
  });

  const grouped = sales.reduce((acc, sale) => {
    const day = new Date(sale.createdAt).getDate();
    acc[day] = (acc[day] || 0) + (sale.amount || 0);
    return acc;
  }, {} as Record<number, number>);

  const result = Object.entries(grouped).map(([day, total]) => ({
    day,
    total,
  }));

  return NextResponse.json(result);
}
