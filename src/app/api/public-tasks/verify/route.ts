import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const secret = process.env.JWT_SECRET || "fallback-secret-for-dev";
    
    // Verify token and extract payload
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (verifyErr: any) {
      if (verifyErr.name === "TokenExpiredError") {
        return NextResponse.json({ error: "Link Expired", expired: true }, { status: 410 });
      }
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const taskId = decoded.taskId;
    const expiresAt = decoded.exp * 1000; // Convert to milliseconds

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

    return NextResponse.json({ task, expiresAt }, { status: 200 });
  } catch (err) {
    console.error("❌ Public verify task failed:", err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
