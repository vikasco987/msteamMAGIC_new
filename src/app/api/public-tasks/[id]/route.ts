import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await context.params;

  if (!taskId) {
    return NextResponse.json({ error: "Missing task ID" }, { status: 400 });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { 
        subtasks: true,
        notes: true
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task, { status: 200 });
  } catch (err) {
    console.error("❌ Public get task failed:", err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
