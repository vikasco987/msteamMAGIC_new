import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const tasks = await prisma.task.findMany({
      select: {
        status: true,
        assigneeName: true,
        assignerName: true,
      },
    });

    const allStatuses = Array.from(new Set(tasks.map(t => t.status).filter(Boolean)));
    const allAssignees = Array.from(new Set(tasks.map(t => t.assigneeName).filter(Boolean)));
    const allAssigners = Array.from(new Set(tasks.map(t => t.assignerName).filter(Boolean)));

    return NextResponse.json({
      allStatuses,
      allAssignees,
      allAssigners,
    });
  } catch (err: unknown) {
    console.error("❌ GET /api/board/options error:", err);
    return NextResponse.json({ error: "Failed to fetch filter options" }, { status: 500 });
  }
}
