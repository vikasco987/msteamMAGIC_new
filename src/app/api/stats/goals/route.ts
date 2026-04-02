// FILE: src/app/api/stats/goals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust path if needed

// GET handler – fetch all goals or filter by ?period=2025-07
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period");

    const goals = await prisma.goal.findMany({
      where: period ? { period } : undefined,
      orderBy: { period: "desc" },
    });

    return NextResponse.json(goals);
  } catch (error: unknown) { // FIX: Changed 'any' to 'unknown'
    console.error("GET /api/stats/goals error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

// POST handler – create or update a goal
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { period, revenueGoal, leadsGoal, collectionGoal } = body;

    // Validate data types
    if (typeof period !== "string") {
      return NextResponse.json(
        { error: "Period must be a string like '2025-07'" },
        { status: 400 }
      );
    }

    if (
      typeof revenueGoal !== "number" ||
      typeof leadsGoal !== "number" ||
      typeof collectionGoal !== "number"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid data: revenueGoal and collectionGoal must be numbers, leadsGoal must be an integer",
        },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.upsert({
      where: { period },
      update: { revenueGoal, leadsGoal, collectionGoal },
      create: { period, revenueGoal, leadsGoal, collectionGoal },
    });

    return NextResponse.json(goal);
  } catch (error: unknown) { // FIX: Changed 'any' to 'unknown'
    console.error("POST /api/stats/goals error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to save goal. Check the server logs for details." },
      { status: 500 }
    );
  }
}