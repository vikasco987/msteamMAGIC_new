import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await context.params;

  if (!taskId) {
    return NextResponse.json({ error: "Missing task ID" }, { status: 400 });
  }

  // Ensure user is authenticated to generate a share link
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const secret = process.env.JWT_SECRET || "fallback-secret-for-dev";
    
    // Create token valid for 24 hours
    const token = jwt.sign({ taskId: task.id }, secret, { expiresIn: "24h" });

    return NextResponse.json({ token }, { status: 200 });
  } catch (err) {
    console.error("❌ Share link generation failed:", err);
    return NextResponse.json({ error: "Failed to generate link" }, { status: 500 });
  }
}
