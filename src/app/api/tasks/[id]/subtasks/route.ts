import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: taskId } = await context.params;

    try {
        const { title }: { title: string } = await req.json();
        if (!title) return NextResponse.json({ error: "Missing title" }, { status: 400 });

        const subtask = await prisma.subtask.create({
            data: {
                title,
                taskId,
                completed: false
            }
        });

        const user = await currentUser();
        const userName = user?.firstName || user?.emailAddresses[0]?.emailAddress || "Unknown User";

        // Log Activity
        await logActivity({
            taskId,
            type: "SUBTASK_TOGGLED", // Reusing this type or could add SUBTASK_ADDED
            content: `added new subtask: "${title}"`,
            author: userName,
            authorId: userId
        });

        return NextResponse.json(subtask);
    } catch (error) {
        console.error("Subtask Creation Error:", error);
        return NextResponse.json({ error: "Failed to create subtask" }, { status: 500 });
    }
}
