// // File: src/app/api/remarks/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";

// export const dynamic = "force-dynamic";

// // ✅ GET all remarks
// export async function GET() {
//   try {
//     const remarks = await prisma.paymentRemark.findMany({
//       orderBy: { createdAt: "asc" },
//       include: {
//         task: {
//           select: { id: true, title: true, amount: true, status: true },
//         },
//       },
//     });

//     const formatted = remarks.map((r) => ({
//       id: r.id,
//       remark: r.remark,
//       createdAt: r.createdAt,
//       authorName: r.authorName ?? "Unknown",
//       authorEmail: r.authorEmail ?? "",
//       taskId: r.task?.id,
//       task: r.task
//         ? {
//             id: r.task.id,
//             title: r.task.title,
//             amount: r.task.amount,
//             status: r.task.status,
//           }
//         : null,
//     }));

//     return NextResponse.json(formatted, { status: 200 });
//   } catch (err) {
//     console.error("❌ Fetch all remarks failed:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch remarks" },
//       { status: 500 }
//     );
//   }
// }

// // ✅ POST new remark (Clerk-authenticated)
// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = auth();

//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const body = await req.json();
//     const { remark, taskId } = body;

//     if (!remark || !taskId) {
//       return NextResponse.json(
//         { error: "Remark text and taskId are required" },
//         { status: 400 }
//       );
//     }

//     // fetch user from local Prisma user table (synced with Clerk)
//     const user = await prisma.user.findUnique({
//       where: { clerkId: userId },
//     });

//     const newRemark = await prisma.paymentRemark.create({
//       data: {
//         remark,
//         taskId,
//         authorName: user?.name ?? "Unknown",
//         authorEmail: user?.email ?? "Unknown",
//       },
//       include: {
//         task: {
//           select: { id: true, title: true, amount: true, status: true },
//         },
//       },
//     });

//     const formatted = {
//       id: newRemark.id,
//       remark: newRemark.remark,
//       createdAt: newRemark.createdAt,
//       authorName: newRemark.authorName,
//       authorEmail: newRemark.authorEmail,
//       taskId: newRemark.task?.id,
//       task: newRemark.task
//         ? {
//             id: newRemark.task.id,
//             title: newRemark.task.title,
//             amount: newRemark.task.amount,
//             status: newRemark.task.status,
//           }
//         : null,
//     };

//     return NextResponse.json(formatted, { status: 201 });
//   } catch (err) {
//     console.error("❌ Add remark failed:", err);
//     return NextResponse.json(
//       { error: "Failed to add remark" },
//       { status: 500 }
//     );
//   }
// }










// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node"; // ✅ import Clerk users helper

// export const dynamic = "force-dynamic";

// // ✅ GET all remarks
// export async function GET() {
//   try {
//     const remarks = await prisma.paymentRemark.findMany({
//       orderBy: { createdAt: "asc" },
//       include: {
//         task: {
//           select: { id: true, title: true, amount: true, status: true },
//         },
//       },
//     });

//     const formatted = remarks.map((r) => ({
//       id: r.id,
//       remark: r.remark,
//       createdAt: r.createdAt,
//       authorName: r.authorName ?? "Unknown",
//       authorEmail: r.authorEmail ?? "",
//       taskId: r.task?.id,
//       task: r.task
//         ? {
//             id: r.task.id,
//             title: r.task.title,
//             amount: r.task.amount,
//             status: r.task.status,
//           }
//         : null,
//     }));

//     return NextResponse.json(formatted, { status: 200 });
//   } catch (err) {
//     console.error("❌ Fetch all remarks failed:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch remarks" },
//       { status: 500 }
//     );
//   }
// }

// // ✅ POST new remark (Clerk-authenticated)
// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = auth();

//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const body = await req.json();
//     const { remark, taskId } = body;

//     if (!remark || !taskId) {
//       return NextResponse.json(
//         { error: "Remark text and taskId are required" },
//         { status: 400 }
//       );
//     }

//     // ✅ Fetch user details from Clerk safely
//     const clerkUser = await users.getUser(userId);

//     const authorName =
//       `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
//       clerkUser.username ||
//       "Unknown";

//     const authorEmail =
//       clerkUser.emailAddresses?.[0]?.emailAddress || "Unknown";

//     // ✅ Store remark in MongoDB via Prisma
//     const newRemark = await prisma.paymentRemark.create({
//       data: {
//         remark,
//         taskId,
//         authorName,
//         authorEmail,
//       },
//       include: {
//         task: {
//           select: { id: true, title: true, amount: true, status: true },
//         },
//       },
//     });

//     const formatted = {
//       id: newRemark.id,
//       remark: newRemark.remark,
//       createdAt: newRemark.createdAt,
//       authorName: newRemark.authorName,
//       authorEmail: newRemark.authorEmail,
//       taskId: newRemark.task?.id,
//       task: newRemark.task
//         ? {
//             id: newRemark.task.id,
//             title: newRemark.task.title,
//             amount: newRemark.task.amount,
//             status: newRemark.task.status,
//           }
//         : null,
//     };

//     console.log("✅ Remark added successfully by:", authorEmail);

//     return NextResponse.json(
//       { success: true, message: "Remark added successfully", data: formatted },
//       { status: 201 }
//     );
//   } catch (err) {
//     console.error("❌ Add remark failed:", err);
//     return NextResponse.json(
//       { error: "Failed to add remark" },
//       { status: 500 }
//     );
//   }
// }










// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";

// export const dynamic = "force-dynamic";

// // ✅ GET all remarks
// export async function GET() {
//   try {
//     const remarks = await prisma.paymentRemark.findMany({
//       orderBy: { createdAt: "asc" },
//       include: {
//         task: {
//           select: { id: true, title: true, amount: true, status: true },
//         },
//       },
//     });

//     const formatted = remarks.map((r) => ({
//       id: r.id,
//       remark: r.remark,
//       createdAt: r.createdAt,
//       authorName: r.authorName ?? "Unknown",
//       authorEmail: r.authorEmail ?? "",
//       paymentStatus: r.paymentStatus ?? "",
//       amountDiscussed: r.amountDiscussed ?? 0,
//       amountReceived: r.amountReceived ?? 0,
//       nextFollowUpDate: r.nextFollowUpDate ?? null,
//       followUpStatus: r.followUpStatus ?? "",
//       contactMethod: r.contactMethod ?? "",
//       contactedBy: r.contactedBy ?? "",
//       priorityLevel: r.priorityLevel ?? "",
//       taskId: r.task?.id,
//       task: r.task
//         ? {
//             id: r.task.id,
//             title: r.task.title,
//             amount: r.task.amount,
//             status: r.task.status,
//           }
//         : null,
//     }));

//     return NextResponse.json(formatted, { status: 200 });
//   } catch (err) {
//     console.error("❌ Fetch all remarks failed:", err);
//     return NextResponse.json({ error: "Failed to fetch remarks" }, { status: 500 });
//   }
// }

// // ✅ POST new remark (Clerk-authenticated)
// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = auth();

//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const body = await req.json();
//     const {
//       remark,
//       taskId,
//       paymentStatus,
//       nextFollowUpDate,
//       followUpStatus,
//       contactMethod,
//       contactedBy,
//       priorityLevel,
//       amountDiscussed: bodyAmountDiscussed,
//       amountReceived: bodyAmountReceived,
//     } = body;

//     if (!remark || !taskId) {
//       return NextResponse.json(
//         { error: "Remark text and taskId are required" },
//         { status: 400 }
//       );
//     }

//     // ✅ Fetch user details from Clerk
//     const clerkUser = await users.getUser(userId);
//     const authorName =
//       `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
//       clerkUser.username ||
//       "Unknown";
//     const authorEmail =
//       clerkUser.emailAddresses?.[0]?.emailAddress || "Unknown";

//     // ✅ Fetch related task
//     const task = await prisma.task.findUnique({ where: { id: taskId } });
//     if (!task) {
//       return NextResponse.json({ error: "Task not found" }, { status: 404 });
//     }

//     // ✅ Create remark
//     const newRemark = await prisma.paymentRemark.create({
//       data: {
//         remark,
//         taskId,
//         authorName,
//         authorEmail,
//         paymentStatus: paymentStatus || task.status,
//         amountDiscussed: bodyAmountDiscussed ?? task.amount ?? 0,
//         amountReceived: bodyAmountReceived ?? task.received ?? 0,
//         nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
//         followUpStatus,
//         contactMethod,
//         contactedBy,
//         priorityLevel,
//       },
//       include: { task: { select: { id: true, title: true, amount: true, status: true } } },
//     });

//     const formatted = {
//       id: newRemark.id,
//       remark: newRemark.remark,
//       createdAt: newRemark.createdAt,
//       authorName: newRemark.authorName,
//       authorEmail: newRemark.authorEmail,
//       paymentStatus: newRemark.paymentStatus,
//       amountDiscussed: newRemark.amountDiscussed,
//       amountReceived: newRemark.amountReceived,
//       nextFollowUpDate: newRemark.nextFollowUpDate,
//       followUpStatus: newRemark.followUpStatus,
//       contactMethod: newRemark.contactMethod,
//       contactedBy: newRemark.contactedBy,
//       priorityLevel: newRemark.priorityLevel,
//       taskId: newRemark.task?.id,
//       task: newRemark.task
//         ? {
//             id: newRemark.task.id,
//             title: newRemark.task.title,
//             amount: newRemark.task.amount,
//             status: newRemark.task.status,
//           }
//         : null,
//     };

//     console.log("✅ Remark added successfully by:", authorEmail);

//     return NextResponse.json(
//       { success: true, message: "Remark added successfully", data: formatted },
//       { status: 201 }
//     );
//   } catch (err) {
//     console.error("❌ Add remark failed:", err);
//     return NextResponse.json({ error: "Failed to add remark" }, { status: 500 });
//   }
// }












// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";

// export const dynamic = "force-dynamic";

// // GET all remarks
// export async function GET() {
//   try {
//     const remarks = await prisma.paymentRemark.findMany({
//       orderBy: { createdAt: "asc" },
//       include: {
//         task: {
//           select: { id: true, title: true, amount: true, status: true },
//         },
//       },
//     });

//     const formatted = remarks.map((r) => ({
//       id: r.id,
//       remark: r.remark,
//       createdAt: r.createdAt,
//       authorName: r.authorName ?? "Unknown",
//       authorEmail: r.authorEmail ?? "",
//       paymentStatus: r.paymentStatus ?? "",
//       amountDiscussed: r.amountDiscussed ?? 0,
//       amountReceived: r.amountReceived ?? 0,
//       nextFollowUpDate: r.nextFollowUpDate ?? null,
//       followUpStatus: r.followUpStatus ?? "",
//       contactMethod: r.contactMethod ?? "",
//       contactedBy: r.contactedBy ?? "",
//       priorityLevel: r.priorityLevel ?? "",
//       taskId: r.task?.id,
//       task: r.task
//         ? {
//             id: r.task.id,
//             title: r.task.title,
//             amount: r.task.amount,
//             status: r.task.status,
//           }
//         : null,
//     }));

//     return NextResponse.json(formatted, { status: 200 });
//   } catch (err) {
//     console.error("❌ Fetch all remarks failed:", err);
//     return NextResponse.json({ error: "Failed to fetch remarks" }, { status: 500 });
//   }
// }

// // POST new remark (Clerk-authenticated)
// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = auth();

//     if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const body = await req.json();
//     const {
//       remark,
//       taskId,
//       paymentStatus,
//       nextFollowUpDate,
//       followUpStatus,
//       contactMethod,
//       contactedBy,
//       priorityLevel,
//       amountDiscussed: bodyAmountDiscussed,
//       amountReceived: bodyAmountReceived,
//     } = body;

//     if (!remark || !taskId) {
//       return NextResponse.json({ error: "Remark text and taskId are required" }, { status: 400 });
//     }

//     // Clerk user info
//     const clerkUser = await users.getUser(userId);
//     const authorName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || clerkUser.username || "Unknown";
//     const authorEmail = clerkUser.emailAddresses?.[0]?.emailAddress || "Unknown";

//     // Fetch task
//     const task = await prisma.task.findUnique({ where: { id: taskId } });
//     if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

//     // Create remark
//     const newRemark = await prisma.paymentRemark.create({
//       data: {
//         remark,
//         taskId,
//         authorName,
//         authorEmail,
//         createdById: userId,
//         paymentStatus: paymentStatus ?? task.status,
//         amountDiscussed: bodyAmountDiscussed ?? task.amount ?? 0,
//         amountReceived: bodyAmountReceived ?? task.received ?? 0,
//         nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
//         followUpStatus,
//         contactMethod,
//         contactedBy,
//         priorityLevel,
//       },
//       include: { task: { select: { id: true, title: true, amount: true, status: true } } },
//     });

//     return NextResponse.json({ success: true, data: newRemark }, { status: 201 });
//   } catch (err) {
//     console.error("❌ Add remark failed:", err);
//     return NextResponse.json({ error: "Failed to add remark" }, { status: 500 });
//   }
// }






// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";

// export const dynamic = "force-dynamic";

// // ✅ GET all remarks (with pagination for infinite scroll)
// export async function GET(req: NextRequest) {
//   try {
//     // Extract pagination params from query string
//     const { searchParams } = new URL(req.url);
//     const pageParam = searchParams.get("page") ?? "1";
//     const limitParam = searchParams.get("limit") ?? "20";

//     const page = parseInt(pageParam, 10);
//     const limit = parseInt(limitParam, 10);
//     const skip = (page - 1) * limit;

//     // Fetch limited records
//     const remarks = await prisma.paymentRemark.findMany({
//       skip,
//       take: limit,
//       orderBy: { createdAt: "desc" },
//       include: {
//         task: {
//           select: { id: true, title: true, amount: true, status: true },
//         },
//       },
//     });

//     // Count total for pagination info
//     const totalCount = await prisma.paymentRemark.count();

//     const formatted = remarks.map((r) => ({
//       id: r.id,
//       remark: r.remark,
//       createdAt: r.createdAt,
//       authorName: r.authorName ?? "Unknown",
//       authorEmail: r.authorEmail ?? "",
//       paymentStatus: r.paymentStatus ?? "",
//       amountDiscussed: r.amountDiscussed ?? 0,
//       amountReceived: r.amountReceived ?? 0,
//       nextFollowUpDate: r.nextFollowUpDate ?? null,
//       followUpStatus: r.followUpStatus ?? "",
//       contactMethod: r.contactMethod ?? "",
//       contactedBy: r.contactedBy ?? "",
//       priorityLevel: r.priorityLevel ?? "",
//       taskId: r.task?.id,
//       task: r.task
//         ? {
//             id: r.task.id,
//             title: r.task.title,
//             amount: r.task.amount,
//             status: r.task.status,
//           }
//         : null,
//     }));

//     return NextResponse.json(
//       {
//         data: formatted,
//         pagination: {
//           total: totalCount,
//           page,
//           limit,
//           totalPages: Math.ceil(totalCount / limit),
//           hasMore: skip + remarks.length < totalCount,
//         },
//       },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("❌ Fetch remarks failed:", err);
//     return NextResponse.json({ error: "Failed to fetch remarks" }, { status: 500 });
//   }
// }

// // ✅ POST new remark (Clerk-authenticated)
// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = auth();
//     if (!userId)
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const body = await req.json();
//     const {
//       remark,
//       taskId,
//       paymentStatus,
//       nextFollowUpDate,
//       followUpStatus,
//       contactMethod,
//       contactedBy,
//       priorityLevel,
//       amountDiscussed: bodyAmountDiscussed,
//       amountReceived: bodyAmountReceived,
//     } = body;

//     if (!remark || !taskId) {
//       return NextResponse.json(
//         { error: "Remark text and taskId are required" },
//         { status: 400 }
//       );
//     }

//     // Clerk user info
//     const clerkUser = await users.getUser(userId);
//     const authorName =
//       `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
//       clerkUser.username ||
//       "Unknown";
//     const authorEmail =
//       clerkUser.emailAddresses?.[0]?.emailAddress || "Unknown";

//     // Fetch task
//     const task = await prisma.task.findUnique({ where: { id: taskId } });
//     if (!task)
//       return NextResponse.json({ error: "Task not found" }, { status: 404 });

//     // Create remark
//     const newRemark = await prisma.paymentRemark.create({
//       data: {
//         remark,
//         taskId,
//         authorName,
//         authorEmail,
//         createdById: userId,
//         paymentStatus: paymentStatus ?? task.status,
//         amountDiscussed: bodyAmountDiscussed ?? task.amount ?? 0,
//         amountReceived: bodyAmountReceived ?? task.received ?? 0,
//         nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
//         followUpStatus,
//         contactMethod,
//         contactedBy,
//         priorityLevel,
//       },
//       include: {
//         task: { select: { id: true, title: true, amount: true, status: true } },
//       },
//     });

//     return NextResponse.json({ success: true, data: newRemark }, { status: 201 });
//   } catch (err) {
//     console.error("❌ Add remark failed:", err);
//     return NextResponse.json({ error: "Failed to add remark" }, { status: 500 });
//   }
// }












// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";

// export const dynamic = "force-dynamic";

// // ✅ GET pending payment remarks for a task (with pagination)
// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const taskId = searchParams.get("taskId");
//     const pageParam = searchParams.get("page") ?? "1";
//     const limitParam = searchParams.get("limit") ?? "20";

//     if (!taskId)
//       return NextResponse.json({ error: "Task ID is required" }, { status: 400 });

//     const page = parseInt(pageParam, 10);
//     const limit = parseInt(limitParam, 10);
//     const skip = (page - 1) * limit;

//     // Fetch only pending remarks for the task
//     const remarks = await prisma.paymentRemark.findMany({
//       where: {
//         taskId,
//         paymentStatus: "todo", // only pending
//       },
//       skip,
//       take: limit,
//       orderBy: { createdAt: "desc" },
//       include: {
//         task: {
//           select: { id: true, title: true, amount: true, status: true },
//         },
//       },
//     });

//     const totalCount = await prisma.paymentRemark.count({
//       where: { taskId, paymentStatus: "todo" },
//     });

//     const formatted = remarks.map((r) => ({
//       id: r.id,
//       remark: r.remark,
//       createdAt: r.createdAt,
//       authorName: r.authorName ?? "Unknown",
//       authorEmail: r.authorEmail ?? "",
//       paymentStatus: r.paymentStatus ?? "",
//       amountDiscussed: r.amountDiscussed ?? 0,
//       amountReceived: r.amountReceived ?? 0,
//       nextFollowUpDate: r.nextFollowUpDate ?? null,
//       followUpStatus: r.followUpStatus ?? "",
//       contactMethod: r.contactMethod ?? "",
//       contactedBy: r.contactedBy ?? "",
//       priorityLevel: r.priorityLevel ?? "",
//       taskId: r.task?.id,
//       task: r.task
//         ? {
//             id: r.task.id,
//             title: r.task.title,
//             amount: r.task.amount,
//             status: r.task.status,
//           }
//         : null,
//     }));

//     return NextResponse.json(
//       {
//         data: formatted,
//         pagination: {
//           total: totalCount,
//           page,
//           limit,
//           totalPages: Math.ceil(totalCount / limit),
//           hasMore: skip + remarks.length < totalCount,
//         },
//       },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("❌ Fetch pending remarks failed:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch pending remarks" },
//       { status: 500 }
//     );
//   }
// }

// // ✅ POST new remark (Clerk-authenticated)
// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = auth();
//     if (!userId)
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const body = await req.json();
//     const {
//       remark,
//       taskId,
//       paymentStatus,
//       nextFollowUpDate,
//       followUpStatus,
//       contactMethod,
//       contactedBy,
//       priorityLevel,
//       amountDiscussed: bodyAmountDiscussed,
//       amountReceived: bodyAmountReceived,
//     } = body;

//     if (!remark || !taskId) {
//       return NextResponse.json(
//         { error: "Remark text and taskId are required" },
//         { status: 400 }
//       );
//     }

//     // Clerk user info
//     const clerkUser = await users.getUser(userId);
//     const authorName =
//       `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
//       clerkUser.username ||
//       "Unknown";
//     const authorEmail =
//       clerkUser.emailAddresses?.[0]?.emailAddress || "Unknown";

//     // Fetch task
//     const task = await prisma.task.findUnique({ where: { id: taskId } });
//     if (!task)
//       return NextResponse.json({ error: "Task not found" }, { status: 404 });

//     // Create remark
//     const newRemark = await prisma.paymentRemark.create({
//       data: {
//         remark,
//         taskId,
//         authorName,
//         authorEmail,
//         createdById: userId,
//         paymentStatus: paymentStatus ?? "todo", // default to pending
//         amountDiscussed: bodyAmountDiscussed ?? task.amount ?? 0,
//         amountReceived: bodyAmountReceived ?? task.received ?? 0,
//         nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
//         followUpStatus,
//         contactMethod,
//         contactedBy,
//         priorityLevel,
//       },
//       include: {
//         task: { select: { id: true, title: true, amount: true, status: true } },
//       },
//     });

//     return NextResponse.json({ success: true, data: newRemark }, { status: 201 });
//   } catch (err) {
//     console.error("❌ Add remark failed:", err);
//     return NextResponse.json({ error: "Failed to add remark" }, { status: 500 });
//   }
// }










// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";

// export const dynamic = "force-dynamic";

// // ✅ GET pending payment remarks for a task (with pagination)
// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const taskId = searchParams.get("taskId");
//     const pageParam = searchParams.get("page") ?? "1";
//     const limitParam = searchParams.get("limit") ?? "10";

//     if (!taskId) {
//       return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
//     }

//     const page = Math.max(1, parseInt(pageParam, 10));
//     const limit = Math.max(1, parseInt(limitParam, 10));
//     const skip = (page - 1) * limit;

//     // Fetch remarks for the task
//     const [remarks, totalCount] = await Promise.all([
//       prisma.paymentRemark.findMany({
//         where: { taskId, paymentStatus: "todo" },
//         skip,
//         take: limit,
//         orderBy: { createdAt: "desc" },
//         include: { task: { select: { id: true, title: true, amount: true, status: true } } },
//       }),
//       prisma.paymentRemark.count({ where: { taskId, paymentStatus: "todo" } }),
//     ]);

//     const formatted = remarks.map((r) => ({
//       id: r.id,
//       remark: r.remark,
//       createdAt: r.createdAt,
//       authorName: r.authorName ?? "Unknown",
//       authorEmail: r.authorEmail ?? "",
//       paymentStatus: r.paymentStatus ?? "",
//       amountDiscussed: r.amountDiscussed ?? 0,
//       amountReceived: r.amountReceived ?? 0,
//       nextFollowUpDate: r.nextFollowUpDate ?? null,
//       followUpStatus: r.followUpStatus ?? "",
//       contactMethod: r.contactMethod ?? "",
//       contactedBy: r.contactedBy ?? "",
//       priorityLevel: r.priorityLevel ?? "",
//       taskId: r.task?.id,
//       task: r.task
//         ? { id: r.task.id, title: r.task.title, amount: r.task.amount, status: r.task.status }
//         : null,
//     }));

//     return NextResponse.json({
//       data: formatted,
//       pagination: {
//         total: totalCount,
//         page,
//         limit,
//         totalPages: Math.ceil(totalCount / limit),
//         hasPrevious: page > 1,
//         hasNext: skip + remarks.length < totalCount,
//       },
//     });
//   } catch (err) {
//     console.error("❌ Fetch pending remarks failed:", err);
//     return NextResponse.json({ error: "Failed to fetch pending remarks" }, { status: 500 });
//   }
// }

// // ✅ POST new remark (Clerk-authenticated)
// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = auth();
//     if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const body = await req.json();
//     const {
//       remark,
//       taskId,
//       paymentStatus,
//       nextFollowUpDate,
//       followUpStatus,
//       contactMethod,
//       contactedBy,
//       priorityLevel,
//       amountDiscussed: bodyAmountDiscussed,
//       amountReceived: bodyAmountReceived,
//     } = body;

//     if (!remark || !taskId)
//       return NextResponse.json({ error: "Remark text and taskId are required" }, { status: 400 });

//     // Clerk user info
//     const clerkUser = await users.getUser(userId);
//     const authorName =
//       `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
//       clerkUser.username ||
//       "Unknown";
//     const authorEmail = clerkUser.emailAddresses?.[0]?.emailAddress || "Unknown";

//     // Fetch task
//     const task = await prisma.task.findUnique({ where: { id: taskId } });
//     if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

//     // Create remark
//     const newRemark = await prisma.paymentRemark.create({
//       data: {
//         remark,
//         taskId,
//         authorName,
//         authorEmail,
//         createdById: userId,
//         paymentStatus: paymentStatus ?? "todo",
//         amountDiscussed: bodyAmountDiscussed ?? task.amount ?? 0,
//         amountReceived: bodyAmountReceived ?? task.received ?? 0,
//         nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
//         followUpStatus,
//         contactMethod,
//         contactedBy,
//         priorityLevel,
//       },
//       include: { task: { select: { id: true, title: true, amount: true, status: true } } },
//     });

//     return NextResponse.json({ success: true, data: newRemark }, { status: 201 });
//   } catch (err) {
//     console.error("❌ Add remark failed:", err);
//     return NextResponse.json({ error: "Failed to add remark" }, { status: 500 });
//   }
// }









// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";

// export const dynamic = "force-dynamic";

// // ✅ GET pending payment remarks (with pagination and task info)
// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const taskId = searchParams.get("taskId");
//     const status = searchParams.get("paymentStatus") || "todo";
//     const page = parseInt(searchParams.get("page") ?? "1", 10);
//     const limit = parseInt(searchParams.get("limit") ?? "10", 10);
//     const skip = (page - 1) * limit;

//     const whereClause = taskId
//       ? { taskId, paymentStatus: status }
//       : { paymentStatus: status };

//     const [remarks, total] = await Promise.all([
//       prisma.paymentRemark.findMany({
//         where: whereClause,
//         orderBy: { createdAt: "desc" },
//         skip,
//         take: limit,
//         include: {
//           task: { select: { id: true, title: true, amount: true, status: true } },
//         },
//       }),
//       prisma.paymentRemark.count({ where: whereClause }),
//     ]);

//     const formatted = remarks.map((r) => ({
//       id: r.id,
//       remark: r.remark,
//       authorName: r.authorName || "Unknown",
//       authorEmail: r.authorEmail || "",
//       paymentStatus: r.paymentStatus,
//       amountDiscussed: r.amountDiscussed ?? 0,
//       amountReceived: r.amountReceived ?? 0,
//       nextFollowUpDate: r.nextFollowUpDate,
//       followUpStatus: r.followUpStatus ?? "",
//       contactMethod: r.contactMethod ?? "",
//       contactedBy: r.contactedBy ?? "",
//       priorityLevel: r.priorityLevel ?? "",
//       createdAt: r.createdAt,
//       task: r.task
//         ? {
//             id: r.task.id,
//             title: r.task.title,
//             amount: r.task.amount,
//             status: r.task.status,
//           }
//         : null,
//     }));

//     return NextResponse.json({
//       data: formatted,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//         hasNext: skip + remarks.length < total,
//         hasPrevious: page > 1,
//       },
//     });
//   } catch (err) {
//     console.error("❌ Fetch pending remarks failed:", err);
//     return NextResponse.json({ error: "Failed to fetch pending remarks" }, { status: 500 });
//   }
// }

// // ✅ POST new remark (authenticated via Clerk)
// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = auth();
//     if (!userId)
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const body = await req.json();
//     const {
//       remark,
//       taskId,
//       paymentStatus = "todo",
//       amountDiscussed,
//       amountReceived,
//       nextFollowUpDate,
//       followUpStatus,
//       contactMethod,
//       contactedBy,
//       priorityLevel,
//     } = body;

//     if (!remark || !taskId)
//       return NextResponse.json({ error: "Remark text and taskId required" }, { status: 400 });

//     // Fetch Clerk user
//     const clerkUser = await users.getUser(userId);
//     const authorName =
//       `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
//       clerkUser.username ||
//       "Unknown";
//     const authorEmail =
//       clerkUser.emailAddresses?.[0]?.emailAddress || "unknown";

//     // Fetch task info
//     const task = await prisma.task.findUnique({ where: { id: taskId } });
//     if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

//     const newRemark = await prisma.paymentRemark.create({
//       data: {
//         remark,
//         taskId,
//         authorName,
//         authorEmail,
//         createdById: userId,
//         paymentStatus,
//         amountDiscussed: amountDiscussed ?? task.amount ?? 0,
//         amountReceived: amountReceived ?? 0,
//         nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
//         followUpStatus,
//         contactMethod,
//         contactedBy,
//         priorityLevel,
//       },
//       include: { task: { select: { id: true, title: true, amount: true, status: true } } },
//     });

//     return NextResponse.json({ success: true, data: newRemark }, { status: 201 });
//   } catch (err) {
//     console.error("❌ Add remark failed:", err);
//     return NextResponse.json({ error: "Failed to add remark" }, { status: 500 });
//   }
// }





// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";

// export const dynamic = "force-dynamic";

// // ✅ GET pending payment remarks (with pagination and task info)
// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const taskId = searchParams.get("taskId"); // make sure frontend sends this
//     const status = searchParams.get("paymentStatus") || "todo";
//     const page = parseInt(searchParams.get("page") ?? "1", 10);
//     const limit = parseInt(searchParams.get("limit") ?? "10", 10);
//     const skip = (page - 1) * limit;

//     if (!taskId) {
//       return NextResponse.json(
//         { error: "taskId query parameter is required" },
//         { status: 400 }
//       );
//     }

//     const [remarks, total] = await Promise.all([
//       prisma.paymentRemark.findMany({
//         where: { taskId, paymentStatus: status },
//         orderBy: { createdAt: "desc" },
//         skip,
//         take: limit,
//         include: {
//           task: { select: { id: true, title: true, amount: true, status: true } },
//         },
//       }),
//       prisma.paymentRemark.count({ where: { taskId, paymentStatus: status } }),
//     ]);

//     const formatted = remarks.map((r) => ({
//       id: r.id,
//       remark: r.remark,
//       authorName: r.authorName || "Unknown",
//       authorEmail: r.authorEmail || "",
//       paymentStatus: r.paymentStatus,
//       amountDiscussed: r.amountDiscussed ?? 0,
//       amountReceived: r.amountReceived ?? 0,
//       nextFollowUpDate: r.nextFollowUpDate,
//       followUpStatus: r.followUpStatus ?? "",
//       contactMethod: r.contactMethod ?? "",
//       contactedBy: r.contactedBy ?? "",
//       priorityLevel: r.priorityLevel ?? "",
//       createdAt: r.createdAt,
//       task: r.task
//         ? {
//             id: r.task.id,
//             title: r.task.title,
//             amount: r.task.amount,
//             status: r.task.status,
//           }
//         : null,
//     }));

//     return NextResponse.json({
//       data: formatted,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//         hasNext: skip + remarks.length < total,
//         hasPrevious: page > 1,
//       },
//     });
//   } catch (err) {
//     console.error("❌ Fetch pending remarks failed:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch pending remarks" },
//       { status: 500 }
//     );
//   }
// }

// // ✅ POST new remark (authenticated via Clerk)
// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = auth();
//     if (!userId)
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const body = await req.json();
//     const {
//       remark,
//       taskId,
//       paymentStatus = "todo",
//       amountDiscussed,
//       amountReceived,
//       nextFollowUpDate,
//       followUpStatus,
//       contactMethod,
//       contactedBy,
//       priorityLevel,
//     } = body;

//     if (!remark || !taskId)
//       return NextResponse.json(
//         { error: "Remark text and taskId required" },
//         { status: 400 }
//       );

//     // Fetch Clerk user
//     const clerkUser = await users.getUser(userId);
//     const authorName =
//       `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
//       clerkUser.username ||
//       "Unknown";
//     const authorEmail =
//       clerkUser.emailAddresses?.[0]?.emailAddress || "unknown";

//     // Fetch task info
//     const task = await prisma.task.findUnique({ where: { id: taskId } });
//     if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

//     const newRemark = await prisma.paymentRemark.create({
//       data: {
//         remark,
//         taskId,
//         authorName,
//         authorEmail,
//         createdById: userId,
//         paymentStatus,
//         amountDiscussed: amountDiscussed ?? task.amount ?? 0,
//         amountReceived: amountReceived ?? 0,
//         nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
//         followUpStatus,
//         contactMethod,
//         contactedBy,
//         priorityLevel,
//       },
//       include: { task: { select: { id: true, title: true, amount: true, status: true } } },
//     });

//     return NextResponse.json({ success: true, data: newRemark }, { status: 201 });
//   } catch (err) {
//     console.error("❌ Add remark failed:", err);
//     return NextResponse.json({ error: "Failed to add remark" }, { status: 500 });
//   }
// }





// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";

// export const dynamic = "force-dynamic";

// // ✅ GET remarks — works for both taskId and global view
// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const taskId = searchParams.get("taskId");
//     const status = searchParams.get("paymentStatus") || "all";
//     const page = parseInt(searchParams.get("page") ?? "1", 10);
//     const limit = parseInt(searchParams.get("limit") ?? "10", 10);
//     const skip = (page - 1) * limit;

//     // ✅ Build dynamic where filter
//     const where: any = {};
//     if (taskId) where.taskId = taskId;
//     if (status && status !== "all") where.paymentStatus = status;

//     // ✅ Fetch paginated remarks
//     const [remarks, total] = await Promise.all([
//       prisma.paymentRemark.findMany({
//         where,
//         orderBy: { createdAt: "desc" },
//         skip,
//         take: limit,
//         include: {
//           task: { select: { id: true, title: true, amount: true, status: true } },
//         },
//       }),
//       prisma.paymentRemark.count({ where }),
//     ]);

//     const formatted = remarks.map((r) => ({
//       id: r.id,
//       remark: r.remark,
//       authorName: r.authorName || "Unknown",
//       authorEmail: r.authorEmail || "",
//       paymentStatus: r.paymentStatus,
//       amountDiscussed: r.amountDiscussed ?? 0,
//       amountReceived: r.amountReceived ?? 0,
//       nextFollowUpDate: r.nextFollowUpDate,
//       followUpStatus: r.followUpStatus ?? "",
//       contactMethod: r.contactMethod ?? "",
//       contactedBy: r.contactedBy ?? "",
//       priorityLevel: r.priorityLevel ?? "",
//       createdAt: r.createdAt,
//       task: r.task
//         ? {
//             id: r.task.id,
//             title: r.task.title,
//             amount: r.task.amount,
//             status: r.task.status,
//           }
//         : null,
//     }));

//     return NextResponse.json({
//       data: formatted,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//         hasNext: skip + remarks.length < total,
//         hasPrevious: page > 1,
//       },
//     });
//   } catch (err) {
//     console.error("❌ Fetch pending remarks failed:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch pending remarks" },
//       { status: 500 }
//     );
//   }
// }

// // ✅ POST new remark (authenticated via Clerk)
// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = auth();
//     if (!userId)
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const body = await req.json();
//     const {
//       remark,
//       taskId,
//       paymentStatus = "todo",
//       amountDiscussed,
//       amountReceived,
//       nextFollowUpDate,
//       followUpStatus,
//       contactMethod,
//       contactedBy,
//       priorityLevel,
//     } = body;

//     if (!remark || !taskId)
//       return NextResponse.json(
//         { error: "Remark text and taskId required" },
//         { status: 400 }
//       );

//     // Fetch Clerk user details
//     const clerkUser = await users.getUser(userId);
//     const authorName =
//       `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
//       clerkUser.username ||
//       "Unknown";
//     const authorEmail =
//       clerkUser.emailAddresses?.[0]?.emailAddress || "unknown";

//     // Fetch task info
//     const task = await prisma.task.findUnique({ where: { id: taskId } });
//     if (!task)
//       return NextResponse.json({ error: "Task not found" }, { status: 404 });

//     // ✅ Create remark
//     const newRemark = await prisma.paymentRemark.create({
//       data: {
//         remark,
//         taskId,
//         authorName,
//         authorEmail,
//         createdById: userId,
//         paymentStatus,
//         amountDiscussed: amountDiscussed ?? task.amount ?? 0,
//         amountReceived: amountReceived ?? 0,
//         nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
//         followUpStatus,
//         contactMethod,
//         contactedBy,
//         priorityLevel,
//       },
//       include: {
//         task: { select: { id: true, title: true, amount: true, status: true } },
//       },
//     });

//     return NextResponse.json({ success: true, data: newRemark }, { status: 201 });
//   } catch (err) {
//     console.error("❌ Add remark failed:", err);
//     return NextResponse.json({ error: "Failed to add remark" }, { status: 500 });
//   }
// }







// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";

// export const dynamic = "force-dynamic";

// // ✅ GET remarks — works for both taskId and global view
// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const taskId = searchParams.get("taskId");
//     const status = searchParams.get("paymentStatus") || "all";
//     const page = parseInt(searchParams.get("page") ?? "1", 10);
//     const limit = parseInt(searchParams.get("limit") ?? "10", 10);
//     const skip = (page - 1) * limit;

//     const where: any = {};
//     if (taskId) where.taskId = taskId;
//     if (status && status !== "all") where.paymentStatus = status;

//     const [remarks, total] = await Promise.all([
//       prisma.paymentRemark.findMany({
//         where,
//         orderBy: { createdAt: "desc" },
//         skip,
//         take: limit,
//         include: {
//           task: { select: { id: true, title: true, amount: true, status: true } },
//         },
//       }),
//       prisma.paymentRemark.count({ where }),
//     ]);

//     const formatted = remarks.map((r) => {
//       let overdueDays: number | null = null;
//       if (r.pendingDeadline) {
//         const diff = new Date().getTime() - new Date(r.pendingDeadline).getTime();
//         overdueDays = diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
//       }
//       return {
//         id: r.id,
//         remark: r.remark,
//         authorName: r.authorName || "Unknown",
//         authorEmail: r.authorEmail || "",
//         paymentStatus: r.paymentStatus,
//         amountDiscussed: r.amountDiscussed ?? 0,
//         amountReceived: r.amountReceived ?? 0,
//         nextFollowUpDate: r.nextFollowUpDate,
//         followUpStatus: r.followUpStatus ?? "",
//         contactMethod: r.contactMethod ?? "",
//         contactedBy: r.contactedBy ?? "",
//         priorityLevel: r.priorityLevel ?? "",
//         pendingDeadline: r.pendingDeadline,
//         pendingReason: r.pendingReason ?? "",
//         customerFeedback: r.customerFeedback ?? "",
//         internalNotes: r.internalNotes ?? "",
//         overdueDays,
//         followUpCount: r.followUpCount ?? 0,
//         reminderSent: r.reminderSent ?? false,
//         createdAt: r.createdAt,
//         task: r.task
//           ? {
//               id: r.task.id,
//               title: r.task.title,
//               amount: r.task.amount,
//               status: r.task.status,
//             }
//           : null,
//       };
//     });

//     return NextResponse.json({
//       data: formatted,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//         hasNext: skip + remarks.length < total,
//         hasPrevious: page > 1,
//       },
//     });
//   } catch (err) {
//     console.error("❌ Fetch pending remarks failed:", err);
//     return NextResponse.json({ error: "Failed to fetch pending remarks" }, { status: 500 });
//   }
// }

// // ✅ POST new remark (authenticated via Clerk)
// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = auth();
//     if (!userId)
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const body = await req.json();
//     const {
//       remark,
//       taskId,
//       paymentStatus = "todo",
//       amountDiscussed,
//       amountReceived,
//       nextFollowUpDate,
//       followUpStatus,
//       contactMethod,
//       contactedBy,
//       priorityLevel,
//       pendingDeadline,
//       pendingReason,
//       customerFeedback,
//       internalNotes,
//     } = body;

//     if (!remark || !taskId)
//       return NextResponse.json({ error: "Remark text and taskId required" }, { status: 400 });

//     const clerkUser = await users.getUser(userId);
//     const authorName =
//       `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
//       clerkUser.username ||
//       "Unknown";
//     const authorEmail =
//       clerkUser.emailAddresses?.[0]?.emailAddress || "unknown";

//     const task = await prisma.task.findUnique({ where: { id: taskId } });
//     if (!task)
//       return NextResponse.json({ error: "Task not found" }, { status: 404 });

//     // ✅ Only allow pendingDeadline to be set once
//     let deadline: Date | null = null;
//     let deadlineSet = false;
//     if (pendingDeadline) {
//       const existingRemarkWithDeadline = await prisma.paymentRemark.findFirst({
//         where: { 
//           taskId, 
//           pendingDeadlineSet: { equals: true } 
//         },
//       });

//       if (!existingRemarkWithDeadline) {
//         deadline = new Date(pendingDeadline);
//         deadlineSet = true;
//       }
//     }

//     // ✅ Calculate overdueDays
//     let overdueDays: number | null = null;
//     if (deadline) {
//       const diff = new Date().getTime() - deadline.getTime();
//       overdueDays = diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
//     }

//     const newRemark = await prisma.paymentRemark.create({
//       data: {
//         remark,
//         taskId,
//         authorName,
//         authorEmail,
//         createdById: userId,
//         paymentStatus,
//         amountDiscussed: amountDiscussed ?? task.amount ?? 0,
//         amountReceived: amountReceived ?? 0,
//         nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
//         followUpStatus,
//         contactMethod,
//         contactedBy,
//         priorityLevel,
//         pendingDeadline: deadline,
//         pendingDeadlineSet: deadlineSet,
//         pendingReason,
//         customerFeedback,
//         internalNotes,
//         overdueDays,
//       },
//       include: {
//         task: { select: { id: true, title: true, amount: true, status: true } },
//       },
//     });

//     return NextResponse.json({ success: true, data: newRemark }, { status: 201 });
//   } catch (err) {
//     console.error("❌ Add remark failed:", err);
//     return NextResponse.json({ error: "Failed to add remark" }, { status: 500 });
//   }
// }









import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { users } from "@clerk/clerk-sdk-node";

export const dynamic = "force-dynamic";

// ✅ GET remarks — works for both taskId and global view
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    const status = searchParams.get("paymentStatus") || "all";
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "10", 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (taskId) where.taskId = taskId;
    if (status && status !== "all") where.paymentStatus = status;

    const [remarks, total] = await Promise.all([
      prisma.paymentRemark.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          task: { select: { id: true, title: true, amount: true, status: true } },
        },
      }),
      prisma.paymentRemark.count({ where }),
    ]);

    const formatted = remarks.map((r) => {
      let overdueDays: number | null = null;
      if (r.pendingDeadline) {
        const diff = new Date().getTime() - new Date(r.pendingDeadline).getTime();
        overdueDays = diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
      }
      return {
        id: r.id,
        remark: r.remark,
        authorName: r.authorName || "Unknown",
        authorEmail: r.authorEmail || "",
        paymentStatus: r.paymentStatus || "todo",
        amountDiscussed: r.amountDiscussed ?? 0,
        amountReceived: r.amountReceived ?? 0,
        nextFollowUpDate: r.nextFollowUpDate,
        followUpStatus: r.followUpStatus ?? "",
        contactMethod: r.contactMethod ?? "",
        contactedBy: r.contactedBy ?? "",
        contactOutcome: r.contactOutcome ?? "",
        priorityLevel: r.priorityLevel ?? "",
        pendingDeadline: r.pendingDeadline,
        pendingDeadlineSet: r.pendingDeadlineSet ?? false,
        pendingReason: r.pendingReason ?? "",
        customerFeedback: r.customerFeedback ?? "",
        internalNotes: r.internalNotes ?? "",
        overdueDays,
        followUpCount: r.followUpCount ?? 0,
        reminderSent: r.reminderSent ?? false,
        createdAt: r.createdAt,
        task: r.task
          ? {
              id: r.task.id,
              title: r.task.title,
              amount: r.task.amount,
              status: r.task.status,
            }
          : null,
      };
    });

    return NextResponse.json({
      data: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + remarks.length < total,
        hasPrevious: page > 1,
      },
    });
  } catch (err) {
    console.error("❌ Fetch pending remarks failed:", err);
    return NextResponse.json({ error: "Failed to fetch pending remarks" }, { status: 500 });
  }
}

// ✅ POST new remark (authenticated via Clerk)
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      remark,
      taskId,
      paymentStatus = "todo",
      amountDiscussed,
      amountReceived,
      nextFollowUpDate,
      followUpStatus,
      contactMethod,
      contactedBy,
      contactOutcome,
      priorityLevel,
      pendingDeadline,
      pendingReason,
      customerFeedback,
      internalNotes,
    } = body;

    if (!remark || !taskId)
      return NextResponse.json({ error: "Remark text and taskId required" }, { status: 400 });

    const clerkUser = await users.getUser(userId);
    const authorName =
      `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
      clerkUser.username ||
      "Unknown";
    const authorEmail =
      clerkUser.emailAddresses?.[0]?.emailAddress || "unknown";

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task)
      return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // ✅ Only allow pendingDeadline to be set once
    let deadline: Date | null = null;
    let deadlineSet = false;
    if (pendingDeadline) {
      const existingRemarkWithDeadline = await prisma.paymentRemark.findFirst({
        where: { taskId, pendingDeadlineSet: true },
      });

      if (!existingRemarkWithDeadline) {
        deadline = new Date(pendingDeadline);
        deadlineSet = true;
      }
    }

    // ✅ Calculate overdueDays
    let overdueDays: number | null = null;
    if (deadline) {
      const diff = new Date().getTime() - deadline.getTime();
      overdueDays = diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
    }

    const newRemark = await prisma.paymentRemark.create({
      data: {
        remark,
        taskId,
        authorName,
        authorEmail,
        createdById: userId,
        paymentStatus,
        amountDiscussed: amountDiscussed ?? task.amount ?? 0,
        amountReceived: amountReceived ?? 0,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        followUpStatus: followUpStatus ?? "",
        contactMethod: contactMethod ?? "",
        contactedBy: contactedBy ?? "",
        contactOutcome: contactOutcome ?? "",
        priorityLevel: priorityLevel ?? "",
        pendingDeadline: deadline,
        pendingDeadlineSet: deadlineSet,
        pendingReason: pendingReason ?? "",
        customerFeedback: customerFeedback ?? "",
        internalNotes: internalNotes ?? "",
        overdueDays,
      },
      include: {
        task: { select: { id: true, title: true, amount: true, status: true } },
      },
    });

    return NextResponse.json({ success: true, data: newRemark }, { status: 201 });
  } catch (err) {
    console.error("❌ Add remark failed:", err);
    return NextResponse.json({ error: "Failed to add remark" }, { status: 500 });
  }
}
