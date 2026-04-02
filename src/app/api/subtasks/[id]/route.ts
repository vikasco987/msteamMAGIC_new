import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { logActivity } from "@/lib/activity";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { userId, sessionClaims } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: subtaskId } = await context.params;

  try {
    const subtask = await prisma.subtask.findUnique({
      where: { id: subtaskId },
    });

    if (!subtask) return NextResponse.json({ error: "Subtask not found" }, { status: 404 });

    const updatedSubtask = await prisma.subtask.update({
      where: { id: subtaskId },
      data: { completed: !subtask.completed },
    });

    const user = await currentUser();
    const userName = user?.firstName || user?.emailAddresses[0]?.emailAddress || "Unknown User";

    // Log Activity
    await logActivity({
      taskId: subtask.taskId,
      type: "SUBTASK_TOGGLED",
      content: `${updatedSubtask.completed ? "completed" : "uncompleted"} subtask: "${subtask.title}"`,
      author: userName,
      authorId: userId
    });

    // Notify relevant users
    const task = await prisma.task.findUnique({
      where: { id: subtask.taskId },
      select: { createdByClerkId: true, assigneeIds: true, title: true }
    });

    if (task) {
      const recipientIds = new Set<string>();
      if (task.createdByClerkId) recipientIds.add(task.createdByClerkId);
      if (task.assigneeIds) task.assigneeIds.forEach(id => recipientIds.add(id));
      recipientIds.delete(userId);

      await Promise.all(Array.from(recipientIds).map(recipientId =>
        prisma.notification.create({
          data: {
            userId: recipientId,
            type: "SUBTASK_TOGGLED",
            title: `🔄 Subtask ${updatedSubtask.completed ? "Done" : "Reopened"}`,
            content: `Subtask "${subtask.title}" in task "${task.title}" was ${updatedSubtask.completed ? "completed" : "set as incomplete"} by ${userName}.`,
            taskId: subtask.taskId
          } as any
        }).catch(err => console.error("Subtask notification error:", err))
      ));
    }

    return NextResponse.json(updatedSubtask);
  } catch (err) {
    console.error("Subtask Update Error:", err);
    return NextResponse.json({ error: "Failed to update subtask" }, { status: 500 });
  }
}
