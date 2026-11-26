import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { auth } from "@/lib/auth-utils";

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
    const secret = process.env.JWT_SECRET || "fallback-secret-for-dev";

    // 🌐 Multi-Database Support: External tasks from Secondary or 3rd CRM
    if (taskId.startsWith("ext_sec_") || taskId.startsWith("ext_trd_")) {
      const isSecondary = taskId.startsWith("ext_sec_");
      const rawId = taskId.replace(/^ext_(sec|trd)_/, "");
      const { ObjectId } = await import("mongodb");
      const { getSecondaryClient, getThirdClient } = await import("@/lib/multiDbTasks");
      const client = isSecondary ? await getSecondaryClient() : await getThirdClient();

      if (client) {
        const doc = await client.db().collection("Task").findOne({ _id: new ObjectId(rawId) }, { projection: { _id: 1 } });
        if (doc) {
          const token = jwt.sign({ taskId }, secret, { expiresIn: "24h" });
          return NextResponse.json({ token }, { status: 200 });
        }
      }
      return NextResponse.json({ error: "External task not found" }, { status: 404 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    
    // Create token valid for 24 hours
    const token = jwt.sign({ taskId: task.id }, secret, { expiresIn: "24h" });

    return NextResponse.json({ token }, { status: 200 });
  } catch (err) {
    console.error("❌ Share link generation failed:", err);
    return NextResponse.json({ error: "Failed to generate link" }, { status: 500 });
  }
}
