import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");

  if (!taskId) {
    return NextResponse.json({ error: "Missing taskId parameter" }, { status: 400 });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        restId: true,
        restIds: true
      }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({
      taskId: task.id,
      restId: task.restId,
      restIds: task.restIds
    }, { status: 200 });
  } catch (err) {
    console.error("❌ Fetch restId failed:", err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
