
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({ select: { customFields: true, amount: true } });

    const data: Record<string, number> = {};
    for (const task of tasks) {
      const mode = task.customFields?.paymentMode || "Unknown";
      data[mode] = (data[mode] || 0) + (task.amount || 0);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Payment Mode error:", err);
    return NextResponse.json({ error: "Failed to load payment modes" }, { status: 500 });
  }
}
