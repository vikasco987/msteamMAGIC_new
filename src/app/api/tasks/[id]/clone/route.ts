// // src/app/api/tasks/[id]/clone/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import {prisma} from "@/lib/prisma"; // Make sure this matches your actual prisma import
// import { auth } from "@clerk/nextjs/server";
// import { clerkClient } from "@clerk/nextjs/server"; // To fetch user details

// export async function POST(
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   const { id: taskId } = params;
//   const { userId } = auth(); // Clerk user ID of the cloner

//   if (!userId) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   try {
//     // 🔹 Get the cloner's details from Clerk
//     const user = await clerkClient.users.getUser(userId);
//     const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
//     const userEmail = user.emailAddresses?.[0]?.emailAddress || null;

//     // 1️⃣ Find the original task
//     const original = await prisma.task.findUnique({
//       where: { id: taskId },
//       include: { subtasks: true, notes: true },
//     });

//     if (!original) {
//       return NextResponse.json({ error: "Task not found" }, { status: 404 });
//     }

//     // 2️⃣ Create a new cloned task (assign cloner's details)
//     const cloned = await prisma.task.create({
//       data: {
//         title: `${original.title} (Copy)`,
//         status: original.status,
//         description: original.description,
//         highlightColor: original.highlightColor,
//         customFields: original.customFields,
//         amount: original.amount,
//         received: original.received,
//         assignerEmail: original.assignerEmail,
//         assigneeEmail: original.assigneeEmail,
//         assignerName: original.assignerName,
//         assigneeName: original.assigneeName,
//         assigneeId: original.assigneeId,
//         assigneeIds: original.assigneeIds,
//         tags: original.tags,
//         priority: original.priority,
//         attachments: original.attachments,
//         aadhaarUrl: original.aadhaarUrl,
//         panUrl: original.panUrl,
//         selfieUrl: original.selfieUrl,
//         chequeUrl: original.chequeUrl,
//         menuCardUrls: original.menuCardUrls,

//         // 🔹 Who cloned it
//         createdByClerkId: userId,
//         createdByName: userName || null,
//         createdByEmail: userEmail || null,
//       },
//     });

//     // 3️⃣ Clone subtasks if any
//     if (original.subtasks.length > 0) {
//       await prisma.subtask.createMany({
//         data: original.subtasks.map((st) => ({
//           taskId: cloned.id,
//           title: st.title,
//           completed: st.completed,
//         })),
//       });
//     }

//     // 4️⃣ Clone notes if any
//     if (original.notes.length > 0) {
//       await prisma.note.createMany({
//         data: original.notes.map((n) => ({
//           taskId: cloned.id,
//           content: n.content,
//           authorName: n.authorName,
//           authorEmail: n.authorEmail,
//         })),
//       });
//     }

//     return NextResponse.json({ task: cloned }, { status: 201 });
//   } catch (err) {
//     console.error("❌ Clone failed:", err);
//     return NextResponse.json(
//       { error: "Failed to clone task", details: String(err) },
//       { status: 500 }
//     );
//   }
// }















// src/app/api/tasks/[id]/clone/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import {prisma} from "@/lib/prisma"; 
















// // src/app/api/tasks/[id]/clone/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import {prisma} from "@/lib/prisma"; 
// import { auth } from "@clerk/nextjs/server";
// import { clerkClient } from "@clerk/clerk-sdk-node"; // ✅ FIXED

// export async function POST(
//   req: NextRequest,
//   context: { params: Promise<{ id: string }> }
// ) {
//   // ✅ Await params
//   const { id: taskId } = await context.params;

//   // ✅ Get Clerk user ID
//   const { userId } = auth();

//   if (!userId) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   try {
//     // ✅ Fetch cloner's details from Clerk
//     const user = await clerkClient.users.getUser(userId);
//     const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
//     const userEmail = user.emailAddresses?.[0]?.emailAddress || null;

//     // 1️⃣ Find the original task
//     const original = await prisma.task.findUnique({
//       where: { id: taskId },
//       include: { subtasks: true, notes: true },
//     });

//     if (!original) {
//       return NextResponse.json({ error: "Task not found" }, { status: 404 });
//     }

//     // 2️⃣ Create cloned task with cloner info
//     const cloned = await prisma.task.create({
//       data: {
//         title: `${original.title} (Copy)`,
//         status: original.status,
//         description: original.description,
//         highlightColor: original.highlightColor,
//         customFields: original.customFields,
//         amount: original.amount,
//         received: original.received,
//         assignerEmail: original.assignerEmail,
//         assigneeEmail: original.assigneeEmail,
//         assignerName: original.assignerName,
//         assigneeName: original.assigneeName,
//         assigneeId: original.assigneeId,
//         assigneeIds: original.assigneeIds,
//         tags: original.tags,
//         priority: original.priority,
//         attachments: original.attachments,
//         aadhaarUrl: original.aadhaarUrl,
//         panUrl: original.panUrl,
//         selfieUrl: original.selfieUrl,
//         chequeUrl: original.chequeUrl,
//         menuCardUrls: original.menuCardUrls,

//         // 🔹 Store cloner info
//         createdByClerkId: userId,
//         createdByName: userName || null,
//         createdByEmail: userEmail || null,
//       },
//     });

//     // 3️⃣ Clone subtasks
//     if (original.subtasks.length > 0) {
//       await prisma.subtask.createMany({
//         data: original.subtasks.map((st) => ({
//           taskId: cloned.id,
//           title: st.title,
//           completed: st.completed,
//         })),
//       });
//     }

//     // 4️⃣ Clone notes
//     if (original.notes.length > 0) {
//       await prisma.note.createMany({
//         data: original.notes.map((n) => ({
//           taskId: cloned.id,
//           content: n.content,
//           authorName: n.authorName,
//           authorEmail: n.authorEmail,
//         })),
//       });
//     }

//     return NextResponse.json({ task: cloned }, { status: 201 });
//   } catch (err) {
//     console.error("❌ Clone failed:", err);
//     return NextResponse.json(
//       { error: "Failed to clone task", details: String(err) },
//       { status: 500 }
//     );
//   }
// }














// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { clerkClient } from "@clerk/clerk-sdk-node";

// export async function POST(
//   req: NextRequest,
//   context: { params: { id: string } }
// ) {
//   const { id: taskId } = context.params;

//   const { userId } = auth();
//   if (!userId) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   try {
//     const { title } = await req.json();

//     const user = await clerkClient.users.getUser(userId);
//     const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
//     const userEmail = user.emailAddresses?.[0]?.emailAddress || null;

//     const original = await prisma.task.findUnique({
//       where: { id: taskId },
//       include: { subtasks: true, notes: true },
//     });

//     if (!original) {
//       return NextResponse.json({ error: "Task not found" }, { status: 404 });
//     }

//     const cloned = await prisma.task.create({
//       data: {
//         title: title || `${original.title} (Copy)`,

//         // ✅ Add parentTaskId here
//         parentTaskId: original.id,

//         status: original.status,
//         description: original.description,
//         highlightColor: original.highlightColor,
//         customFields: original.customFields,
//         amount: null,
//         received: null,
//         paymentHistory: [],
//         assignerEmail: original.assignerEmail,
//         assigneeEmail: original.assigneeEmail,
//         assignerName: original.assignerName,
//         assigneeName: original.assigneeName,
//         assigneeId: original.assigneeId,
//         assigneeIds: original.assigneeIds,
//         tags: original.tags,
//         priority: original.priority,
//         attachments: original.attachments,
//         aadhaarUrl: original.aadhaarUrl,
//         panUrl: original.panUrl,
//         selfieUrl: original.selfieUrl,
//         chequeUrl: original.chequeUrl,
//         menuCardUrls: original.menuCardUrls,

//         createdByClerkId: userId,
//         createdByName: userName,
//         createdByEmail: userEmail,
//       },
//     });

//     if (original.subtasks.length > 0) {
//       await prisma.subtask.createMany({
//         data: original.subtasks.map((st) => ({
//           taskId: cloned.id,
//           title: st.title,
//           completed: st.completed,
//         })),
//       });
//     }

//     if (original.notes.length > 0) {
//       await prisma.note.createMany({
//         data: original.notes.map((n) => ({
//           taskId: cloned.id,
//           content: n.content,
//           authorName: n.authorName,
//           authorEmail: n.authorEmail,
//         })),
//       });
//     }

//     return NextResponse.json({ task: cloned }, { status: 201 });
//   } catch (err) {
//     console.error("❌ Clone failed:", err);
//     return NextResponse.json(
//       { error: "Failed to clone task", details: String(err) },
//       { status: 500 }
//     );
//   }
// }
























// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { clerkClient } from "@clerk/clerk-sdk-node";

// export async function POST(
//   req: NextRequest,
//   context: { params: { id: string } }
// ) {
//   const { id: taskId } = context.params;

//   const { userId } = auth();
//   if (!userId) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   try {
//     const { title } = await req.json();

//     const user = await clerkClient.users.getUser(userId);
//     const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
//     const userEmail = user.emailAddresses?.[0]?.emailAddress || null;

//     const original = await prisma.task.findUnique({
//       where: { id: taskId },
//       include: { subtasks: true, notes: true },
//     });

//     if (!original) {
//       return NextResponse.json({ error: "Task not found" }, { status: 404 });
//     }

//     const cloned = await prisma.task.create({
//       data: {
//         title: title || `${original.title} (Copy)`,

//         // ✅ Add parentTaskId here
//         parentTaskId: original.id,

//         status: original.status,
//         description: original.description,
//         highlightColor: original.highlightColor,
//         customFields: original.customFields,
//         amount: null,
//         received: null,
//         paymentHistory: [],
//         assignerEmail: original.assignerEmail,
//         assigneeEmail: original.assigneeEmail,
//         assignerName: original.assignerName,
//         assigneeName: original.assigneeName,
//         assigneeId: original.assigneeId,
//         assigneeIds: original.assigneeIds,
//         tags: original.tags,
//         priority: original.priority,
//         attachments: original.attachments,
//         aadhaarUrl: original.aadhaarUrl,
//         panUrl: original.panUrl,
//         selfieUrl: original.selfieUrl,
//         chequeUrl: original.chequeUrl,
//         menuCardUrls: original.menuCardUrls,

//         createdByClerkId: userId,
//         createdByName: userName,
//         createdByEmail: userEmail,
//       },
//     });

//     if (original.subtasks.length > 0) {
//       await prisma.subtask.createMany({
//         data: original.subtasks.map((st) => ({
//           taskId: cloned.id,
//           title: st.title,
//           completed: st.completed,
//         })),
//       });
//     }

//     if (original.notes.length > 0) {
//       await prisma.note.createMany({
//         data: original.notes.map((n) => ({
//           taskId: cloned.id,
//           content: n.content,
//           authorName: n.authorName,
//           authorEmail: n.authorEmail,
//         })),
//       });
//     }

//     return NextResponse.json({ task: cloned }, { status: 201 });
//   } catch (err) {
//     console.error("❌ Clone failed:", err);
//     return NextResponse.json(
//       { error: "Failed to clone task", details: String(err) },
//       { status: 500 }
//     );
//   }
// }
// 










// src/app/api/tasks/[id]/clone/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { id: taskId } = context.params;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title } = await req.json();

    const user = await clerkClient.users.getUser(userId);
    const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    const userEmail = user.emailAddresses?.[0]?.emailAddress || null;

    const original = await prisma.task.findUnique({
      where: { id: taskId },
      // ✅ FIX: No longer including notes, as we don't need them
      include: { subtasks: true },
    });

    if (!original) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Prepare data for the new task
    // Using object destructuring to safely copy fields and exclude notes/id
    const { id, subtasks, ...originalData } = original;

    const cloned = await prisma.task.create({
      data: {
        ...originalData,
        // Override specific fields for the new cloned task
        title: title || `${original.title} (Copy)`,
        parentTaskId: original.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByClerkId: userId,
        createdByName: userName,
        createdByEmail: userEmail,
        assigneeId: userId,
        assigneeIds: [userId],
        assigneeName: userName,
        assigneeEmail: userEmail,
        // Assigner also becomes the cloner
        assignerId: userId,
        assignerName: userName,
        assignerEmail: userEmail,
        // ✅ Ensure notes, paymentHistory, amount, and received are reset
        notes: undefined, // Notes are handled by the Note model, so this is correct
        paymentHistory: [],
        amount: null,
        received: null,
      },
    });

    // Copy subtasks if they exist
    if (original.subtasks.length > 0) {
      await prisma.subtask.createMany({
        data: original.subtasks.map((st) => ({
          taskId: cloned.id,
          title: st.title,
          completed: st.completed,
        })),
      });
    }

    // ❌ FIX: Removed the `if (original.notes.length > 0)` block entirely.
    // This ensures notes are never copied when a task is cloned.

    return NextResponse.json({ task: cloned }, { status: 201 });
  } catch (err) {
    console.error("❌ Clone failed:", err);
    return NextResponse.json(
      { error: "Failed to clone task", details: String(err) },
      { status: 500 }
    );
  }
}