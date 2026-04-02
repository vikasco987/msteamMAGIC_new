import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { userId, sessionClaims } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  try {
    const { content }: { content: string } = await req.json();

    if (!content) return NextResponse.json({ error: "Missing content" }, { status: 400 });

    const user = await currentUser();
    const authorName = user?.firstName || user?.emailAddresses[0]?.emailAddress || "Anonymous";
    const authorEmail = user?.emailAddresses[0]?.emailAddress || "unknown@example.com";

    // Extract mentions (e.g., @user123 or @[Name](user123))
    const mentionRegex = /@(?:\[[^\]]+\]\()?(user_[a-zA-Z0-9_]+)\)?/g;
    const mentions = Array.from(content.matchAll(mentionRegex)).map(match => match[1]);

    // Redirect note to parent if it's a sub-task display
    const currentTask = await prisma.task.findUnique({
      where: { id },
      select: { parentTaskId: true },
    });
    const targetTaskId = currentTask?.parentTaskId || id;

    const note = await prisma.note.create({
      data: {
        content,
        taskId: targetTaskId,
        authorName,
        authorEmail,
        mentions,
      },
    });

    // Log Activity
    await logActivity({
      taskId: targetTaskId,
      type: "NOTE_ADDED",
      content: `added a new note: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
      author: authorName,
      authorId: userId
    });

    // Create notifications for mentions
    if (mentions.length > 0) {
      await Promise.all(mentions.map(mentionedUserId =>
        prisma.notification.create({
          data: {
            userId: mentionedUserId,
            type: "MENTION",
            content: `${authorName} mentioned you in a note: "${content.substring(0, 50)}..."`,
            taskId: targetTaskId
          }
        }).catch(err => console.error("Mention alert error:", err))
      ));
    }

    return NextResponse.json(note);
  } catch (err: unknown) {
    console.error("Note creation error:", err);
    return NextResponse.json(
      { error: "Server error", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
