import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({ select: { amount: true, createdAt: true } });

    const data: Record<string, number> = {};
    for (const task of tasks) {
      const date = format(task.createdAt, "yyyy-MM-dd");
      data[date] = (data[date] || 0) + (task.amount || 0);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Daily Revenue error:", err);
    return NextResponse.json({ error: "Failed to load daily revenue" }, { status: 500 });
  }
}
