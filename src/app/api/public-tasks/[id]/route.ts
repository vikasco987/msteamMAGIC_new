import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await context.params;

  if (!taskId) {
    return NextResponse.json({ error: "Missing task ID" }, { status: 400 });
  }

  try {
    // 🌐 Multi-Database Support: External tasks from Secondary or 3rd CRM
    if (taskId.startsWith("ext_sec_") || taskId.startsWith("ext_trd_")) {
      const isSecondary = taskId.startsWith("ext_sec_");
      const rawId = taskId.replace(/^ext_(sec|trd)_/, "");
      const { ObjectId } = await import("mongodb");
      const { getSecondaryClient, getThirdClient, fetchExternalTaskNotes } = await import("@/lib/multiDbTasks");
      const client = isSecondary ? await getSecondaryClient() : await getThirdClient();

      if (client) {
        const doc = await client.db().collection("Task").findOne({ _id: new ObjectId(rawId) });
        if (doc) {
          const notes = await fetchExternalTaskNotes(taskId);
          const task = {
            id: taskId,
            taskCode: doc.taskCode || null,
            title: doc.title || "Untitled Task",
            description: doc.description || "",
            status: (doc.status || "todo").toLowerCase(),
            priority: doc.priority || "medium",
            createdAt: doc.createdAt || new Date(),
            updatedAt: doc.updatedAt || new Date(),
            attachments: doc.attachments || [],
            aadhaarUrl: doc.aadhaarUrl || null,
            panUrl: doc.panUrl || null,
            selfieUrl: doc.selfieUrl || null,
            chequeUrl: doc.chequeUrl || null,
            menuCardUrls: doc.menuCardUrls || [],
            customFields: doc.customFields || {},
            assignerName: doc.assignerName || doc.createdByName || "—",
            assignerEmail: doc.assignerEmail || doc.createdByEmail || "",
            assigneeName: doc.assigneeName || "—",
            assigneeEmail: doc.assigneeEmail || "",
            tags: doc.tags || [],
            notes: notes || [],
            subtasks: [],
            externalSource: isSecondary ? "kravy" : "onboarding",
            externalSourceLabel: isSecondary ? "KRAVY CRM" : "Onboarding CRM",
          };
          return NextResponse.json(task, { status: 200 });
        }
      }
      return NextResponse.json({ error: "External task not found" }, { status: 404 });
    }

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

    return NextResponse.json(task, { status: 200 });
  } catch (err) {
    console.error("❌ Public get task failed:", err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
