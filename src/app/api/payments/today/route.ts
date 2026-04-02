import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    const baseDate = dateParam ? new Date(dateParam) : new Date();

    const startOfDay = new Date(baseDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(baseDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // 🚀 STEP 1: Find Activity logs for payments on this date to get Task IDs
    // This is MUCH faster than fetching ALL tasks and then filtering locally.
    const activities = await prisma.activity.findMany({
      where: {
        type: "PAYMENT_ADDED",
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      select: {
        taskId: true,
      }
    });

    const taskIds = activities.map(a => a.taskId);
    const uniqueTaskIds = Array.from(new Set(taskIds));

    // 🚀 STEP 2: Fetch ONLY those specific tasks
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: uniqueTaskIds }
      },
      select: {
        id: true,
        title: true,
        assignerName: true,
        paymentHistory: true,
        customFields: true,
      },
    });

    const paymentsToday: any[] = [];
    const summaryByAssigner: Record<string, number> = {};
    let totalUpdatedAmount = 0;

    for (const task of tasks) {
      if (!Array.isArray(task.paymentHistory)) continue;

      const history = task.paymentHistory as any[];

      // Extract phone and shopName from customFields for UI reporting
      const phone = (task.customFields as any)?.phone || null;
      const shopName = (task.customFields as any)?.shopName || null;

      for (let i = 0; i < history.length; i++) {
        const p = history[i];
        if (!p?.updatedAt) continue;

        const updatedAt = new Date(p.updatedAt);
        if (updatedAt < startOfDay || updatedAt > endOfDay) continue;

        const previousReceived = i > 0 ? Number(history[i - 1].received || 0) : 0;
        const currentReceived = Number(p.received || 0);
        const amountUpdated = i === 0 ? currentReceived : currentReceived - previousReceived;
        const assigner = p.assignerName || task.assignerName || "Unknown";

        paymentsToday.push({
          paymentId: `${task.id}_${updatedAt.getTime()}`,
          taskId: task.id,
          taskTitle: task.title,
          assignerName: assigner,
          received: currentReceived,
          amountUpdated,
          updatedAt,
          updatedBy: p.updatedBy || "Unknown",
          fileUrl: p.fileUrl || null,
          phone,
          shopName,
        });

        // Overall aggregates
        summaryByAssigner[assigner] = (summaryByAssigner[assigner] || 0) + amountUpdated;
        totalUpdatedAmount += amountUpdated;
      }
    }

    return NextResponse.json({
      date: startOfDay.toISOString().slice(0, 10),
      paymentsToday: paymentsToday.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
      summaryByAssigner,
      totalUpdatedAmount,
    });
  } catch (err: any) {
    console.error("❌ Error fetching payments:", err);
    return NextResponse.json(
      { error: "Failed to fetch payments", details: err.message },
      { status: 500 }
    );
  }
}
