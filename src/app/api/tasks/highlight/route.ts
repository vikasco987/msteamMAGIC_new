// FILE: src/app/api/tasks/highlight/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ← based on your pattern
import { auth } from "@clerk/nextjs/server";

// Define the interface for the expected request body
interface PatchRequestBody {
  taskId: string;
  highlightColor: string | null; // Assuming highlightColor can be a string (e.g., hex code, CSS color name) or null to remove highlight
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // FIX: Explicitly type the body
    const body: PatchRequestBody = await req.json();
    const { taskId, highlightColor } = body;

    if (!taskId || highlightColor === undefined) {
      return NextResponse.json({ error: "Missing taskId or highlightColor" }, { status: 400 });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { highlightColor },
    });

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (err: unknown) { // FIX: Changed 'any' to 'unknown' for error handling
    console.error("Error updating highlight:", err);
    // Safely access error message if it's an Error instance
    return NextResponse.json({ error: "Update failed", details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}