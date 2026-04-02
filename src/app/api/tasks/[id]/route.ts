import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";

import { Prisma } from "@prisma/client";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

interface PatchRequestBody {
  title?: string;
  status?: string;
  amount?: number | string | null;
  received?: number | string | null;
  description?: string;
  highlightColor?: string | null;
  customFields?: { [key: string]: any };
  assignerEmail?: string | null;
  assigneeEmail?: string | null;
  assignerName?: string | null;
  assigneeName?: string | null;
  assigneeId?: string | null;
  assigneeIds?: string[] | string | null;
  isHidden?: boolean;
}

// --- GET Task ---
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await context.params;
  const { userId } = await auth();

  if (!taskId || !userId) {
    return NextResponse.json({ error: "Unauthorized or missing task ID" }, { status: 400 });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { subtasks: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task, { status: 200 });
  } catch (err) {
    console.error("❌ Get task failed:", err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

// --- PATCH Task ---
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await context.params;
  const { userId } = await auth();

  if (!taskId) return NextResponse.json({ error: "Missing task ID" }, { status: 400 });
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body: PatchRequestBody = await req.json();

    // Fetch current state for logging and validation
    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!currentTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const updateData: Prisma.TaskUpdateInput = { updatedAt: new Date() };
    const user = await currentUser();
    const userName = user?.firstName || user?.emailAddresses[0]?.emailAddress || "Unknown User";

    // ✅ Resolve Role for RBAC
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    const userRole = (dbUser?.role || "USER").toUpperCase();
    const isPowerUser = userRole === "MASTER" || userRole === "ADMIN";
    const isTL = dbUser?.isTeamLeader || false;

    // 🚀 Robust Ownership/Involvement Detection
    const userEmails = user?.emailAddresses?.map(e => e.emailAddress) || [];
    const isSelfInvolved = userId === currentTask.createdByClerkId || 
                           userId === currentTask.assigneeId || 
                           (currentTask.assigneeIds as string[] || []).includes(userId) ||
                           userId === (currentTask as any).assignerId ||
                           userEmails.includes(currentTask.createdByEmail!) ||
                           userEmails.includes(currentTask.assigneeEmail!) ||
                           userEmails.includes((currentTask as any).assignerEmail);

    // 🏆 Team Leader Logic: If TL, check if any involved user is in their team
    let isTeamInvolved = false;
    if (isTL && !isPowerUser && !isSelfInvolved) {
      const taskInvolvedIds = new Set<string>();
      if (currentTask.createdByClerkId) taskInvolvedIds.add(currentTask.createdByClerkId);
      if (currentTask.assigneeId) taskInvolvedIds.add(currentTask.assigneeId);
      (currentTask.assigneeIds as string[] || []).forEach(id => taskInvolvedIds.add(id));
      
      const taskInvolvedEmails = new Set<string>();
      if (currentTask.createdByEmail) taskInvolvedEmails.add(currentTask.createdByEmail);
      if (currentTask.assigneeEmail) taskInvolvedEmails.add(currentTask.assigneeEmail);
      if ((currentTask as any).assignerEmail) taskInvolvedEmails.add((currentTask as any).assignerEmail);

      if (taskInvolvedIds.size > 0 || taskInvolvedEmails.size > 0) {
        const teamInvolvedMembers = await prisma.user.findMany({
          where: {
            OR: [
              { clerkId: { in: Array.from(taskInvolvedIds) } },
              { email: { in: Array.from(taskInvolvedEmails) } }
            ],
            leaderId: userId
          },
          select: { clerkId: true }
        });
        isTeamInvolved = teamInvolvedMembers.length > 0;
      }
    }

    // 🛡️ Global Security: If non-power user is NOT involved AND NOT a TL for this task, block all updates
    if (!isPowerUser && !isSelfInvolved && !isTeamInvolved) {
      return NextResponse.json({ 
        error: "Access denied. You are not involved in this task.",
        details: `Your ID: ${userId}, Role: ${userRole}, Involved: ${isSelfInvolved}, TL: ${isTL}`
      }, { status: 403 });
    }

    const allowedFields = [
      "title", "status", "amount", "received", "description",
      "highlightColor", "assignerEmail", "assigneeEmail",
      "assignerName", "assigneeName", "assigneeId", "assigneeIds", "assignerId",
      "isHidden"
    ];

    const logs: string[] = [];

    // Process basic field updates
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        const value = body[field as keyof PatchRequestBody];
        const oldValue = (currentTask as any)[field];

        if (field === "amount" || field === "received") {
          let numValue: number | null = null;
          if (typeof value === "number") numValue = value;
          else if (typeof value === "string" && !isNaN(parseFloat(value))) numValue = parseFloat(value);

          if (numValue !== oldValue) {
            updateData[field] = numValue;
            logs.push(`${field.toUpperCase()} updated from ${oldValue || 0} to ${numValue || 0}`);
          }
        } else if (field === "assigneeIds") {
          const newIds = Array.isArray(value) ? value.map(String) : typeof value === "string" ? [value] : [];
          updateData.assigneeIds = newIds;
        } else if (value !== oldValue) {
          updateData[field as keyof Prisma.TaskUpdateInput] = value;
          
          if (field === "status") {
            const lastChange = await prisma.activity.findFirst({
              where: { taskId, type: { in: ["STATUS_CHANGE", "TASK_CREATED"] } },
              orderBy: { createdAt: "desc" }
            });
            let timeInfo = "";
            if (lastChange) {
              const diffMs = Date.now() - new Date(lastChange.createdAt).getTime();
              const hours = Math.floor(diffMs / (1000 * 60 * 60));
              const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
              timeInfo = ` (Duration: ${hours}h ${minutes}m)`;
            }
            logs.push(`Status changed from ${oldValue || 'None'} to ${value}${timeInfo}`);
          } else if (field === "title") {
            logs.push(`Title changed to "${value}"`);
          } else {
            logs.push(`${field.toUpperCase()} changed from ${oldValue || "empty"} to ${value}`);
          }
        }
      }
    }

    // 🚀 ASSIGNER / OWNERSHIP LOGIC (Strict Master Capability)
    if (userRole === "MASTER" || userRole === "ADMIN") {
      if (body.assignerId) {
        updateData.assignerId = body.assignerId;
        updateData.assignerName = body.assignerName || "Updated User";
        updateData.assignerEmail = body.assignerEmail || "";
        logs.push(`OWNERSHIP transferred to ${updateData.assignerName}`);
      }
    }

    // ✅ Reassignment logic with RBAC
    if (updateData.assigneeIds !== undefined) {
      const ids = updateData.assigneeIds as string[];

      if (ids && ids.length > 0) {
        // Validation: Is this actually a change in leading assignee?
        const isChangingLead = ids[0] !== currentTask.assigneeId;

        // Rule: Only Power Users or the current Assigner/involved can reassign
        if (!isPowerUser && !isSelfInvolved) {
          return NextResponse.json({ error: "Access denied. Only involved users or Master can reassign." }, { status: 403 });
        }

        try {
          const client = await clerkClient();
          const leadUser = await client.users.getUser(ids[0]);
          updateData.assigneeId = leadUser.id;
          updateData.assigneeName = `${leadUser.firstName || ""} ${leadUser.lastName || ""}`.trim() || leadUser.username || "Unknown";
          updateData.assigneeEmail = leadUser.emailAddresses[0]?.emailAddress || "Unknown";
          
          // Only change assigner if it's a new assignment by the pusher
          if (!currentTask.assignerId || isPowerUser) {
             updateData.assignerId = userId;
             updateData.assignerName = userName;
             updateData.assignerEmail = user?.emailAddresses[0]?.emailAddress || "Unknown";
          }
          
          logs.push(`reassigned the task to ${updateData.assigneeName}`);
        } catch (err) {
          console.error("Failed to sync lead user on reassignment:", err);
        }
      } else {
        updateData.assigneeId = null;
        updateData.assigneeName = null;
        updateData.assigneeEmail = null;
        logs.push("removed all assignees");
      }
    }

    // 🔄 Sync Redundant Fields (Top-level <-> customFields)
    const syncableFields = [
      "phone", "email", "shopName", "location", "accountNumber", "ifscCode", 
      "restId", "customerName", "packageAmount", "startDate", "endDate", "timeline",
      "assigneeId", "assigneeName", "assigneeEmail",
      "assignerId", "assignerName", "assignerEmail"
    ];

    const currentCF = { ...(currentTask.customFields as any || {}) };
    let cfChanged = false;

    for (const f of syncableFields) {
      if ((updateData as any)[f] !== undefined) {
        currentCF[f] = (updateData as any)[f];
        cfChanged = true;
      }
    }

    if (body.customFields) {
      Object.assign(currentCF, body.customFields);
      cfChanged = true;
    }

    if (cfChanged) {
      updateData.customFields = currentCF;
    }

    // Execute update
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });

    // Logging activities
    for (const log of logs) {
      await logActivity({
        taskId,
        type: log.includes("Status") ? "STATUS_CHANGE" : "TASK_UPDATED",
        content: log,
        author: userName,
        authorId: userId
      });
    }

    // Post-update: Notifications
    // 1. Payment Update
    if (updateData.amount !== undefined || updateData.received !== undefined) {
      try {
        const client = await clerkClient();
        const allClerkUsersRes = await client.users.getUserList({ limit: 500 });
        const adminMasterIds = allClerkUsersRes.data
          .filter(u => {
            const role = ((u.publicMetadata?.role as string) || (u.privateMetadata?.role as string) || "").toLowerCase();
            return role === "admin" || role === "master";
          })
          .map(u => u.id)
          .filter(id => id !== userId);

        const cf = (updated.customFields as any) || {};
        const taskDetails = `[${cf.shopName || "N/A"}] - ${updated.title}`;
        const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

        await Promise.all(adminMasterIds.map(async recipientId => {
          await prisma.notification.create({
            data: {
              userId: recipientId,
              type: "PAYMENT_ADDED",
              content: `💳 PAYMENT UPDATE: Total ₹${updated.received || 0} for ${taskDetails}. \nUpdated By: ${userName} \nDate: ${timestamp}`,
              taskId: updated.id
            } as any
          });
        }));
      } catch (err) { console.error("Payment notification error:", err); }
    }

    // 2. Completion Update
    if (updateData.status === "done" && currentTask.status !== "done") {
      try {
        const recipientIds = new Set<string>();
        if (updated.assigneeIds && updated.assigneeIds.length > 0) updated.assigneeIds.forEach(id => { if (typeof id === 'string') recipientIds.add(id); });
        else if (updated.assigneeId) recipientIds.add(updated.assigneeId);
        if (currentTask.createdByClerkId) recipientIds.add(currentTask.createdByClerkId);
        recipientIds.delete(userId);

        const cf = (updated.customFields as any) || {};
        const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
        const notificationContent = `Task Finished: "${updated.title}"\nShop: ${cf.shopName || "N/A"}\nCompleted By: ${userName}\nDate: ${timestamp}`;

        await Promise.all(Array.from(recipientIds).map(recipientId =>
          prisma.notification.create({
            data: {
              userId: recipientId,
              type: "TASK_COMPLETED",
              title: "✅ Task Completed",
              content: notificationContent,
              taskId: updated.id
            } as any
          }).catch(e => console.error(e))
        ));
      } catch (err) { console.error("Completion notification error:", err); }
    }

    return NextResponse.json({ success: true, task: updated }, { status: 200 });
  } catch (err) {
    console.error("❌ Update failed:", err);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// --- DELETE Task ---
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await context.params;
  const { userId } = await auth();

  if (!taskId || !userId) return NextResponse.json({ error: "Unauthorized or missing task ID" }, { status: 400 });
  
  // ✅ 1. Role Check: ONLY MASTER can delete
  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (dbUser?.role !== "MASTER") {
    return NextResponse.json({ error: "Only MASTER users can delete tasks" }, { status: 403 });
  }

  try {
    // ✅ 2. Clear all related records to avoid constraint errors
    await prisma.subtask.deleteMany({ where: { taskId } });
    await prisma.note.deleteMany({ where: { taskId } });
    await prisma.activity.deleteMany({ where: { taskId } });
    await prisma.paymentRemark.deleteMany({ where: { taskId } });
    await prisma.notification.deleteMany({ where: { taskId } });

    // ✅ 3. Finally delete the task (idempotent deleteMany pattern)
    const deleted = await prisma.task.deleteMany({
      where: { id: taskId }
    });

    if (deleted.count === 0) {
      console.warn("⚠️ Delete skipped: Task already removed or invalid ID", { taskId });
    }

    return NextResponse.json({ 
      success: true, 
      deletedId: taskId,
      count: deleted.count 
    }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Delete failed:", err);
    return NextResponse.json({ error: err.message || "Delete failed" }, { status: 500 });
  }
}
