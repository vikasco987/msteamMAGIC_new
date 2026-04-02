import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({ select: { customFields: true, amount: true } });

    const data: Record<string, number> = {};
    for (const task of tasks) {
      const category = task.customFields?.category || "Uncategorized";
      data[category] = (data[category] || 0) + (task.amount || 0);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Category error:", err);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
