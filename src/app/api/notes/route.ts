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

interface CreateNoteRequestBody {
  taskId: string;
  content: string;
  authorName?: string;
  authorEmail?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");

  if (!taskId) {
    return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
  }

  // ✅ Ensure task exists
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
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateNoteRequestBody = await req.json();
    const { taskId, content, authorName, authorEmail } = body;

    if (!taskId || !content) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: new ObjectId(taskId).toString() },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const note = await prisma.note.create({
      data: {
        taskId: task.id,
        content,
        authorName,
        authorEmail,
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
