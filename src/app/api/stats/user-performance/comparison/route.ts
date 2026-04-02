// FILE: src/app/api/stats/user-performance/comparison/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays, subWeeks, subMonths } from "date-fns";

// Assuming you have a Task model defined in Prisma.
// The structure of the Task object returned by Prisma.task.findMany()
// would look something like this. Adjust if your Task model has other fields or different types.
interface Task {
  id: string; // Example field
  amount: number | null; // Assuming 'amount' can be null/undefined
  received: number | null; // Assuming 'received' can be null/undefined
  createdAt: Date;
  // ... other fields from your Task model
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "7d";

    const now = new Date();

    let currentStart: Date;
    let previousStart: Date;
    let previousEnd: Date;

    switch (range) {
      case "14d":
        currentStart = subDays(now, 14);
        previousStart = subDays(now, 28);
        previousEnd = subDays(now, 14);
        break;
      case "4w":
        currentStart = subWeeks(now, 4);
        previousStart = subWeeks(now, 8);
        previousEnd = subWeeks(now, 4);
        break;
      case "8w":
        currentStart = subWeeks(now, 8);
        previousStart = subWeeks(now, 16);
        previousEnd = subWeeks(now, 8);
        break;
      case "3m":
        currentStart = subMonths(now, 3);
        previousStart = subMonths(now, 6);
        previousEnd = subMonths(now, 3);
        break;
      case "6m":
        currentStart = subMonths(now, 6);
        previousStart = subMonths(now, 12);
        previousEnd = subMonths(now, 6);
        break;
      case "7d":
      default:
        currentStart = subDays(now, 7);
        previousStart = subDays(now, 14);
        previousEnd = subDays(now, 7);
        break;
    }

    // Get tasks for both current and previous period
    const [currentPeriodTasks, previousPeriodTasks] = await Promise.all([
      prisma.task.findMany({
        where: { createdAt: { gte: currentStart } },
      }),
      prisma.task.findMany({
        where: {
          createdAt: {
            gte: previousStart,
            lt: previousEnd,
          },
        },
      }),
    ]);

    // Summary function to compute financials
    // FIX: Replaced 'any[]' with 'Task[]' for the tasks parameter
    const summarize = (tasks: Task[]) => {
      const totalRevenue = tasks.reduce((sum, t) => sum + (t.amount || 0), 0);
      const amountReceived = tasks.reduce((sum, t) => sum + (t.received || 0), 0);
      const pendingAmount = totalRevenue - amountReceived;
      const totalLeads = tasks.length;

      return {
        totalRevenue,
        amountReceived,
        pendingAmount,
        totalLeads,
      };
    };

    const summary = [
      summarize(previousPeriodTasks),
      summarize(currentPeriodTasks),
    ];

    return NextResponse.json(summary);
  } catch (error: unknown) { // It's good practice to also type caught errors as 'unknown'
    console.error("Comparison API error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to compare data" },
      { status: 500 }
    );
  }
}