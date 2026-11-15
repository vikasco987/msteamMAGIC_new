import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await context.params;
    const { userId } = await auth();

    if (!taskId) {
      return NextResponse.json({ error: "Missing task ID" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔒 STRICT RBAC: Master Role ONLY
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    const userRole = (dbUser?.role || "").toUpperCase();
    if (userRole !== "MASTER") {
      return NextResponse.json(
        { error: "Access denied: Only MASTER role can change task creator/assigner identity." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { newCreatorId, newCreatorName, newCreatorEmail } = body;

    if (!newCreatorId) {
      return NextResponse.json(
        { error: "Missing required parameter: newCreatorId" },
        { status: 400 }
      );
    }

    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Resolve target creator details
    let resolvedName = newCreatorName?.trim() || "";
    let resolvedEmail = newCreatorEmail?.trim() || "";
    let resolvedClerkId = newCreatorId;

    // Look up in Prisma User table
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { clerkId: newCreatorId },
          { id: newCreatorId }
        ]
      }
    });

    if (targetUser) {
      resolvedClerkId = targetUser.clerkId;
      resolvedName = resolvedName || targetUser.name || "Unknown User";
      resolvedEmail = resolvedEmail || targetUser.email || "";
    } else if (!newCreatorId.startsWith("custom_")) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(newCreatorId);
        resolvedClerkId = clerkUser.id;
        resolvedName = resolvedName || `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || clerkUser.username || "Unknown User";
        resolvedEmail = resolvedEmail || clerkUser.emailAddresses[0]?.emailAddress || "";
      } catch (e) {
        console.warn("Clerk lookup for target creator failed:", e);
      }
    }

    if (!resolvedName) resolvedName = "Unknown User";

    const oldCreatorName = currentTask.createdByName || currentTask.assignerName || "Unknown";
    const user = await currentUser();
    const masterAdminName = user?.firstName || user?.emailAddresses[0]?.emailAddress || dbUser?.name || "Master";

    // Update both creator and assigner fields (and sync into customFields)
    const cf = { ...((currentTask.customFields as any) || {}) };
    cf.assignerId = resolvedClerkId;
    cf.assignerName = resolvedName;
    cf.assignerEmail = resolvedEmail;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        createdByClerkId: resolvedClerkId,
        createdByName: resolvedName,
        createdByEmail: resolvedEmail,
        assignerId: resolvedClerkId,
        assignerName: resolvedName,
        assignerEmail: resolvedEmail,
        customFields: cf,
        updatedAt: new Date(),
      },
    });

    // Audit log
    await logActivity({
      taskId,
      type: "TASK_UPDATED",
      content: `Creator/Assigner updated from "${oldCreatorName}" to "${resolvedName}" by Master (${masterAdminName})`,
      author: masterAdminName,
      authorId: userId,
    });

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: `Creator updated to ${resolvedName}`,
    });
  } catch (error: any) {
    console.error("❌ Error updating task creator:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update task creator" },
      { status: 500 }
    );
  }
}
