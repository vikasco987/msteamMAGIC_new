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

    // 🔒 1. Strict Server-Side RBAC Check: MASTER role only
    const dbCaller = await prisma.user.findUnique({ where: { clerkId: userId } });
    const callerRole = (dbCaller?.role || "").toUpperCase();
    if (callerRole !== "MASTER") {
      return NextResponse.json(
        { error: "Access denied: Only MASTER role can transfer task creator identity." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { newCreatorId } = body;

    if (!newCreatorId || typeof newCreatorId !== "string" || !newCreatorId.trim()) {
      return NextResponse.json(
        { error: "Invalid or missing parameter: newCreatorId is required." },
        { status: 400 }
      );
    }

    const targetIdClean = newCreatorId.trim();

    // 🔍 2. Verify Task Existence
    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!currentTask) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    // 🏛️ 3. Authoritative Employee Resolution (NEVER trust client-provided name/email)
    let authoritativeClerkId = "";
    let authoritativeName = "";
    let authoritativeEmail = "";

    // Step 3a: Lookup in Prisma User table (by clerkId or MongoDB ObjectId)
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(targetIdClean);
    const userSearchConditions: any[] = [{ clerkId: targetIdClean }];
    if (isMongoId) {
      userSearchConditions.push({ id: targetIdClean });
    }

    const dbTarget = await prisma.user.findFirst({
      where: {
        OR: userSearchConditions,
      },
    });

    if (dbTarget) {
      if (dbTarget.isDisabled) {
        return NextResponse.json(
          { error: "Cannot assign creator to an inactive or disabled user." },
          { status: 400 }
        );
      }
      authoritativeClerkId = dbTarget.clerkId;
      authoritativeName = dbTarget.name?.trim() || "";
      authoritativeEmail = dbTarget.email?.trim() || "";
    }

    // Step 3b: If Clerk ID available, verify against Clerk directory for latest authoritative metadata
    const lookupId = authoritativeClerkId || targetIdClean;
    if (!lookupId.startsWith("custom_")) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(lookupId);
        if (clerkUser) {
          if (clerkUser.banned) {
            return NextResponse.json(
              { error: "Cannot assign creator to a banned employee." },
              { status: 400 }
            );
          }
          authoritativeClerkId = clerkUser.id;
          const clerkName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || clerkUser.username;
          if (clerkName) authoritativeName = clerkName;
          const clerkEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
          if (clerkEmail) authoritativeEmail = clerkEmail;
        }
      } catch (clerkErr) {
        // If Clerk lookup fails and we didn't find them in dbTarget either, it is an invalid user ID
        if (!dbTarget) {
          return NextResponse.json(
            { error: `Invalid employee ID: User "${targetIdClean}" not found in system.` },
            { status: 404 }
          );
        }
      }
    }

    if (!authoritativeClerkId) {
      authoritativeClerkId = targetIdClean;
    }
    if (!authoritativeName) {
      authoritativeName = "Unknown Employee";
    }

    // 📦 4. Prepare Atomic Identity Update Payload
    // Build customFields with updated creator/assigner identity
    const currentCustomFields = (currentTask.customFields as Record<string, any>) || {};
    const updatedCustomFields: Record<string, any> = {
      ...currentCustomFields,
      assignerId: authoritativeClerkId,
      assignerName: authoritativeName,
      assignerEmail: authoritativeEmail,
    };

    // Keep old values for audit logging
    const previousCreatorName = currentTask.createdByName || currentTask.assignerName || "Unknown";
    const previousCreatorId = currentTask.createdByClerkId || currentTask.assignerId || "Unknown";
    const previousCreatorEmail = currentTask.createdByEmail || currentTask.assignerEmail || "Unknown";

    const callerUser = await currentUser();
    const callerName = callerUser?.firstName || callerUser?.username || dbCaller?.name || "Master";

    // ⚛️ 5. Single Atomic DB Update with Prisma
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        createdByClerkId: authoritativeClerkId,
        createdByName: authoritativeName,
        createdByEmail: authoritativeEmail,
        assignerId: authoritativeClerkId,
        assignerName: authoritativeName,
        assignerEmail: authoritativeEmail,
        customFields: updatedCustomFields,
        updatedAt: new Date(),
      },
    });

    // 📜 6. Comprehensive Audit Log
    const auditContent = `Creator identity transferred from "${previousCreatorName}" (${previousCreatorId}, ${previousCreatorEmail}) to "${authoritativeName}" (${authoritativeClerkId}, ${authoritativeEmail}) by Master ${callerName}`;
    
    await logActivity({
      taskId,
      type: "TASK_UPDATED",
      content: auditContent,
      author: callerName,
      authorId: userId,
    });

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: `Task creator successfully transferred to ${authoritativeName}.`,
      transferredIdentity: {
        createdByClerkId: authoritativeClerkId,
        createdByName: authoritativeName,
        createdByEmail: authoritativeEmail,
        assignerId: authoritativeClerkId,
        assignerName: authoritativeName,
        assignerEmail: authoritativeEmail,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in Creator Identity Transfer:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to transfer creator identity." },
      { status: 500 }
    );
  }
}
