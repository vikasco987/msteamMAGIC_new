import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: noteId } = await context.params;
    const body = await req.json();
    const { emoji } = body;

    if (!noteId || !emoji) {
      return NextResponse.json({ error: "Missing noteId or emoji" }, { status: 400 });
    }

    // Get user details
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.emailAddresses[0]?.emailAddress || "Unknown";

    // Get the note
    const note = await prisma.note.findUnique({
      where: { id: noteId }
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const currentReactions: any[] = Array.isArray(note.reactions) ? note.reactions : [];
    
    // Check if user already reacted with this emoji
    const existingIndex = currentReactions.findIndex(
      (r: any) => r.userId === userId && r.emoji === emoji
    );

    let newReactions = [...currentReactions];

    if (existingIndex > -1) {
      // Toggle off (remove reaction)
      newReactions.splice(existingIndex, 1);
    } else {
      // Add reaction
      newReactions.push({ emoji, userId, userName });
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: { reactions: newReactions }
    });

    return NextResponse.json(updatedNote);
  } catch (err: any) {
    console.error("Error toggling reaction:", err);
    return NextResponse.json(
      { error: "Failed to toggle reaction", details: err.message },
      { status: 500 }
    );
  }
}
