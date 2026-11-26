// import { prisma } from "@/lib/prisma";
// import { NextRequest, NextResponse } from "next/server";
// import { ObjectId } from "mongodb";

// // Define an interface for the expected structure of the POST request body for notes
// interface CreateNoteRequestBody {
//   taskId: string;
//   content: string;
//   authorName?: string; // Optional field
//   authorEmail?: string; // Optional field
// }

// export async function GET(req: NextRequest) {
//   const { searchParams } = new URL(req.url);
//   const taskId = searchParams.get("taskId");

//   if (!taskId) {
//     return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
//   }

//   const notes = await prisma.note.findMany({
//     where: {
//       taskId: new ObjectId(taskId).toString(),
//     },
//     orderBy: {
//       createdAt: "desc",
//     },
//   });

//   return NextResponse.json(notes);
// }

// export async function POST(req: NextRequest) {
//   try { // Added try-catch for better error handling
//     // FIX: Explicitly type the body
//     const body: CreateNoteRequestBody = await req.json();
//     const { taskId, content, authorName, authorEmail } = body;

//     if (!taskId || !content) {
//       return NextResponse.json({ error: "Missing fields" }, { status: 400 });
//     }

//     const note = await prisma.note.create({
//       data: {
//         taskId: new ObjectId(taskId).toString(),
//         content,
//         authorName,
//         authorEmail,
//       },
//     });

//     return NextResponse.json(note);
//   } catch (err: unknown) { // FIX: Changed 'any' to 'unknown' for error handling
//     console.error("Error creating note:", err);
//     return NextResponse.json(
//       { error: "Failed to create note", details: err instanceof Error ? err.message : String(err) },
//       { status: 500 }
//     );
//   }
// }















// FILE: /app/api/notes/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { fetchExternalTaskNotes, createExternalTaskNote } from "@/lib/multiDbTasks";

interface CreateNoteRequestBody {
  taskId: string;
  content: string;
  authorName?: string;
  authorEmail?: string;
  fileUrl?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");

  if (!taskId) {
    return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
  }

  // 🌐 External DB Task Notes Support (Secondary / Tertiary)
  if (taskId.startsWith("ext_sec_") || taskId.startsWith("ext_trd_")) {
    const externalNotes = await fetchExternalTaskNotes(taskId);
    return NextResponse.json(externalNotes);
  }

  // ✅ Primary CRM task
  try {
    const task = await prisma.task.findUnique({
      where: { id: new ObjectId(taskId).toString() },
      select: { id: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const notes = await prisma.note.findMany({
      where: {
        taskId: task.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(notes);
  } catch (e: any) {
    return NextResponse.json({ error: "Invalid task ID", details: e?.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateNoteRequestBody = await req.json();
    const { taskId, content, authorName, authorEmail, fileUrl } = body;

    if (!taskId || (!content && !fileUrl)) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 🌐 External DB Task Note Creation Support (Secondary / Tertiary)
    if (taskId.startsWith("ext_sec_") || taskId.startsWith("ext_trd_")) {
      const createdExternalNote = await createExternalTaskNote(taskId, {
        content: content || "Sent an attachment",
        authorName,
        authorEmail,
        fileUrl,
      });

      if (!createdExternalNote) {
        return NextResponse.json({ error: "Failed to create note in external CRM" }, { status: 500 });
      }
      return NextResponse.json(createdExternalNote);
    }

    // ✅ Primary CRM task
    const task = await prisma.task.findUnique({
      where: { id: new ObjectId(taskId).toString() },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const note = await prisma.note.create({
      data: {
        taskId: task.id,
        content: content || "Sent an attachment",
        authorName,
        authorEmail,
        fileUrl,
      },
    });

    return NextResponse.json(note);
  } catch (err: unknown) {
    console.error("Error creating note:", err);
    return NextResponse.json(
      { error: "Failed to create note", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
