import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    console.log("[mark-read] Auth userId:", userId);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("[mark-read] Request body:", body);
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: new ObjectId(taskId).toString() },
      select: { id: true },
    });
    console.log("[mark-read] Task fetched:", task?.id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const client = await clerkClient();
    const currentUser = await client.users.getUser(userId);
    const userEmail =
      currentUser.emailAddresses?.[0]?.emailAddress ||
      currentUser.primaryEmailAddress?.emailAddress ||
      "";
    console.log("[mark-read] User email:", userEmail);

    const notes = await prisma.note.findMany({
      where: { taskId: task.id },
    });
    console.log("[mark-read] Fetched notes:", notes.map(n=>({id:n.id,authorEmail:n.authorEmail,readBy:n.readBy})));

    const notesToUpdate = notes.filter(
      (n) => !(n.readBy || []).includes(userId)
    );
    console.log(
      "[mark-read] Notes to update:",
      notesToUpdate.map((n) => n.id)
    );

    console.log("[mark-read] Updating notes...");
    const updatePromises = notesToUpdate.map((note) => {
      const newReadBy = [...(note.readBy || []), userId];
      return prisma.note.update({
        where: { id: note.id },
        data: { readBy: { set: newReadBy } },
      });
    });
    await Promise.all(updatePromises);

    console.log("[mark-read] Updated count:", notesToUpdate.length);
    return NextResponse.json({ success: true, count: notesToUpdate.length });
  } catch (err: any) {
    console.error("Error marking notes as read:", err);
    return NextResponse.json(
      { error: "Failed to mark notes as read", details: err.message },
      { status: 500 }
    );
  }
}
