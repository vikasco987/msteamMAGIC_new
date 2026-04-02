




// // use server';
// import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";
// import { prisma } from "@/lib/prisma";

// // ========== INTERFACES ==========
// interface UserPublicMetadata {
//   role?: string;
// }
// interface UserPrivateMetadata {
//   role?: string;
// }
// interface Field {
//   label?: string;
//   value?: string;
//   files?: unknown[];
// }
// interface CustomFieldsInput {
//   phone?: string;
//   email?: string;
//   shopName?: string;
//   outletName?: string;
//   location?: string;
//   accountNumber?: string;
//   ifscCode?: string;
//   customerName?: string;
//   restId?: string;
//   packageAmount?: string;
//   startDate?: string;
//   endDate?: string;
//   timeline?: string;
//   amount?: string;
//   amountReceived?: string;
//   fields?: Field[];
//   aadhaarUrl?: string;
//   panUrl?: string;
//   selfieUrl?: string;
//   chequeUrl?: string;
//   menuCardUrls?: string[];
// }

// // ========== HELPERS ==========
// function toNullableString(val: unknown): string | null {
//   return typeof val === "string" && val.trim() !== "" ? val.trim() : null;
// }

// // ✅ Get User Role
// async function getUserRole(userId: string): Promise<string | null> {
//   try {
//     const user = await users.getUser(userId);
//     return (
//       (user.publicMetadata as UserPublicMetadata)?.role ||
//       (user.privateMetadata as UserPrivateMetadata)?.role ||
//       null
//     );
//   } catch {
//     return null;
//   }
// }

// // ========== POST: CREATE NEW TASK ==========
// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = await auth();
//     if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const body = await req.json();
//     console.log("📦 Raw request body:", JSON.stringify(body, null, 2));

//     if (!body.title || !body.assigneeId)
//       return NextResponse.json({ error: "Missing title or assigneeId" }, { status: 400 });

//     const clerkUser = await users.getUser(userId);
//     const assignerEmail = clerkUser.emailAddresses?.[0]?.emailAddress || "unknown";
//     const assignerName = clerkUser.firstName || clerkUser.username || "Unknown";
//     const status = "todo" as const;

//     const {
//       phone,
//       email,
//       shopName,
//       outletName,
//       location,
//       accountNumber,
//       ifscCode,
//       customerName,
//       restId,
//       packageAmount,
//       startDate,
//       endDate,
//       timeline,
//       amount,
//       amountReceived,
//       fields = [],
//       aadhaarUrl,
//       panUrl,
//       selfieUrl,
//       chequeUrl,
//       menuCardUrls,
//     } = (body.customFields as CustomFieldsInput) ?? {};

//     const safeAttachments = body.attachments ?? [];
//     const safeFields = Array.isArray(fields)
//       ? (fields as Field[]).map((f) => ({
//           label: f.label || "",
//           value: f.value || "",
//           files: Array.isArray(f.files)
//             ? f.files.filter((url): url is string => typeof url === "string")
//             : [],
//         }))
//       : [];

//     const task = await prisma.task.create({
//       data: {
//         title: body.title,
//         status,
//         assigneeIds: Array.isArray(body.assigneeIds)
//           ? body.assigneeIds
//           : [body.assigneeId],
//         assignerEmail,
//         assignerName,
//         createdByClerkId: userId,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         customFields: {
//           phone: toNullableString(phone),
//           email: toNullableString(email),
//           shopName: toNullableString(shopName),
//           outletName: toNullableString(outletName),
//           location: toNullableString(location),
//           accountNumber: toNullableString(accountNumber),
//           ifscCode: toNullableString(ifscCode),
//           customerName: toNullableString(customerName),
//           restId: toNullableString(restId),
//           packageAmount: toNullableString(packageAmount),
//           startDate: toNullableString(startDate),
//           endDate: toNullableString(endDate),
//           timeline: toNullableString(timeline),
//           amount: toNullableString(amount),
//           amountReceived: toNullableString(amountReceived),
//           fields: safeFields,
//           aadhaarUrl: toNullableString(aadhaarUrl),
//           panUrl: toNullableString(panUrl),
//           selfieUrl: toNullableString(selfieUrl),
//           chequeUrl: toNullableString(chequeUrl),
//           menuCardUrls: Array.isArray(menuCardUrls)
//             ? menuCardUrls.filter((url) => typeof url === "string" && url.trim() !== "")
//             : [],
//         },
//         attachments: safeAttachments,
//         tags: Array.isArray(body.tags) ? body.tags : [],
//         priority: body.priority ?? null,
//         dueDate: body.dueDate ? new Date(body.dueDate) : null,
//         phone: toNullableString(phone),
//         email: toNullableString(email),
//         shopName: toNullableString(shopName),
//         location: toNullableString(location),
//         accountNumber: toNullableString(accountNumber),
//         ifscCode: toNullableString(ifscCode),
//         restId: toNullableString(restId),
//         customerName: toNullableString(customerName),
//         packageAmount: toNullableString(packageAmount),
//         startDate: toNullableString(startDate),
//         endDate: toNullableString(endDate),
//         timeline: toNullableString(timeline),
//         aadhaarUrl: toNullableString(aadhaarUrl),
//         panUrl: toNullableString(panUrl),
//         selfieUrl: toNullableString(selfieUrl),
//         chequeUrl: toNullableString(chequeUrl),
//         menuCardUrls: Array.isArray(menuCardUrls)
//           ? menuCardUrls.filter((url) => typeof url === "string" && url.trim() !== "")
//           : [],
//       },
//     });

//     console.log("✅ Task created:", task.id);
//     return NextResponse.json({ success: true, task }, { status: 201 });
//   } catch (err: unknown) {
//     const error = err instanceof Error ? err.message : "Unknown error";
//     console.error("❌ POST /api/tasks error:", err);
//     return NextResponse.json({ error: "Server error", details: error }, { status: 500 });
//   }
// }

// // ========== GET: FETCH TASKS (with Pagination + Enrichment) ==========
// export async function GET(req: NextRequest) {
//   try {
//     const { userId } = await auth();
//     if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const role = await getUserRole(userId);
//     const userIsPrivileged = role === "admin" || role === "master";

//     const url = new URL(req.url);
//     const taskId = url.searchParams.get("id");
//     const page = parseInt(url.searchParams.get("page") || "1", 10);
//     const limit = parseInt(url.searchParams.get("limit") || "20", 10);
//     const skip = (page - 1) * limit;

//     // ✅ If fetching single task
//     if (taskId) {
//       const task = await prisma.task.findUnique({
//         where: { id: taskId },
//         include: { subtasks: true, notes: true },
//       });
//       return NextResponse.json({ tasks: task ? [task] : [] }, { status: 200 });
//     }

//     // ✅ Paginated list
//     const [tasks, total] = await Promise.all([
//       prisma.task.findMany({
//         where: userIsPrivileged
//           ? {}
//           : {
//               OR: [{ createdByClerkId: userId }, { assigneeIds: { has: userId } }],
//             },
//         orderBy: { createdAt: "desc" },
//         skip,
//         take: limit,
//         include: { subtasks: true, notes: true },
//       }),
//       prisma.task.count({
//         where: userIsPrivileged
//           ? {}
//           : {
//               OR: [{ createdByClerkId: userId }, { assigneeIds: { has: userId } }],
//             },
//       }),
//     ]);

//     // ✅ Fetch unique users for enrichment
//     const userIdentifiers = new Set<string>();
//     tasks.forEach((t) => {
//       if (t.assignerEmail) userIdentifiers.add(t.assignerEmail);
//       t.assigneeIds?.forEach((id) => userIdentifiers.add(id));
//     });

//     const userLookups = await Promise.all(
//       Array.from(userIdentifiers).map((val) =>
//         val.includes("@")
//           ? users.getUserList({ emailAddress: [val] }).then((r) => r[0]).catch(() => null)
//           : users.getUser(val).catch(() => null)
//       )
//     );

//     const userMap: Record<string, { id: string; name: string; email: string }> = {};
//     userLookups.forEach((u) => {
//       if (u) {
//         const email = u.emailAddresses?.[0]?.emailAddress || "";
//         const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "Unnamed";
//         userMap[u.id] = { id: u.id, name, email };
//         if (email) userMap[email] = { id: u.id, name, email };
//       }
//     });

//     const enriched = tasks.map((task) => {
//       const assigner = userMap[task.assignerEmail ?? ""] || {
//         id: "",
//         name: task.assignerName || "—",
//         email: task.assignerEmail || "",
//       };
//       const assignees = task.assigneeIds?.map((id) => {
//         const u = userMap[id];
//         return { id, name: u?.name || "—", email: u?.email || "" };
//       });
//       return { ...task, assignerName: assigner.name, assignees };
//     });

//     console.log(
//       `📄 GET /api/tasks – Role: ${role || "unknown"} – fetched ${enriched.length} tasks (Page ${page})`
//     );

//     return NextResponse.json(
//       {
//         tasks: enriched,
//         total,
//         totalPages: Math.ceil(total / limit),
//         page,
//       },
//       { status: 200 }
//     );
//   } catch (err: unknown) {
//     const error = err instanceof Error ? err.message : "Unknown error";
//     console.error("❌ GET /api/tasks error:", err);
//     return NextResponse.json({ error: "Failed to fetch tasks", details: error }, { status: 500 });
//   }
// }

// // ========== OPTIONS ==========
// export async function OPTIONS() {
//   return NextResponse.json({ ok: true });
// }



























"use server";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { users } from "@clerk/clerk-sdk-node";
import { prisma } from "@/lib/prisma";

// ========== HELPERS ==========
interface UserPublicMetadata { role?: string }
interface UserPrivateMetadata { role?: string }

async function getUserRole(userId: string): Promise<string | null> {
  try {
    const user = await users.getUser(userId);
    return (
      (user.publicMetadata as UserPublicMetadata)?.role ||
      (user.privateMetadata as UserPrivateMetadata)?.role ||
      null
    );
  } catch {
    return null;
  }
}

// ========== POST: CREATE TASK ==========
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.title || !body.assigneeId)
      return NextResponse.json({ error: "Missing title or assigneeId" }, { status: 400 });

    const clerkUser = await users.getUser(userId);
    const assignerEmail = clerkUser.emailAddresses?.[0]?.emailAddress || "unknown";
    const assignerName = clerkUser.firstName || clerkUser.username || "Unknown";

    // Rule: Creator (current user) is the Assigner. Assignee is the one picked.
    let assigneeName = assignerName;
    let assigneeEmail = assignerEmail;
    if (body.assigneeId && body.assigneeId !== userId) {
      try {
        const u = await users.getUser(body.assigneeId);
        if (u) {
          assigneeName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "Unknown";
          assigneeEmail = u.emailAddresses?.[0]?.emailAddress || "Unknown";
        }
      } catch (err) {
        console.error("Failed to fetch assignee details:", err);
      }
    }

    const task = await prisma.task.create({
      data: {
        title: body.title,
        status: body.status || "todo",
        assigneeId: body.assigneeId,
        assigneeIds: Array.isArray(body.assigneeIds) ? body.assigneeIds : (body.assigneeId ? [body.assigneeId] : []),
        assigneeName,
        assigneeEmail,
        projectId: body.projectId || undefined,
        assignerEmail: assignerEmail,
        assignerName: assignerName,
        assignerId: userId,
        createdByClerkId: userId,
        createdByName: assignerName,
        createdByEmail: assignerEmail,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: Array.isArray(body.tags) ? body.tags : [],
        priority: body.priority ?? null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        customFields: body.customFields ?? {},
      },
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ POST /api/tasks error:", err);
    return NextResponse.json({ error: "Server error", details: error }, { status: 500 });
  }
}

// ========== GET: PAGINATED TASKS + LATEST 5 PAYMENT REMARKS ==========
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const clerkUserForRole = await client.users.getUser(userId);
    const metadataRole = (clerkUserForRole.publicMetadata as any)?.role || (clerkUserForRole.privateMetadata as any)?.role;
    const normalizedRole = String(metadataRole || dbUser?.role || "user").toLowerCase();

    const isTL = (dbUser as any)?.isTeamLeader || normalizedRole === 'tl';
    const userIsPrivileged = normalizedRole === "admin" || normalizedRole === "master";

    let teamMemberIds: string[] = [];
    if (isTL) {
        const members = await prisma.user.findMany({
            where: { leaderId: userId } as any,
            select: { clerkId: true }
        });
        teamMemberIds = members.map(m => m.clerkId);
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const userFilter = userIsPrivileged
      ? {}
      : {
          OR: [
            { createdByClerkId: userId },
            { assigneeIds: { has: userId } },
            ...(isTL && teamMemberIds.length > 0 ? [
              { createdByClerkId: { in: teamMemberIds } },
              { assigneeIds: { hasSome: teamMemberIds } }
            ] : [])
          ]
        };

    console.log(`[Tasks Paginated API Debug] User: ${userId}, Role: ${normalizedRole}, isTL: ${isTL}, TeamCount: ${teamMemberIds.length}, Privileged: ${userIsPrivileged}`);

    // ✅ Fetch tasks + top 5 latest paymentRemarks
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where: userFilter as any,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          paymentRemarks: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          subtasks: true,
          notes: true,
        },
      }),
      prisma.task.count({
        where: userFilter as any,
      }),
    ]);

    // ✅ Enrich assigner/assignee names
    const userIdentifiers = new Set<string>();
    tasks.forEach((t) => {
      if (t.assignerEmail) userIdentifiers.add(t.assignerEmail);
      t.assigneeIds?.forEach((id) => userIdentifiers.add(id));
    });

    const userLookups = await Promise.all(
      Array.from(userIdentifiers).map((val) =>
        val.includes("@")
          ? users.getUserList({ emailAddress: [val] }).then((r) => r[0]).catch(() => null)
          : users.getUser(val).catch(() => null)
      )
    );

    const userMap: Record<string, { id: string; name: string; email: string }> = {};
    userLookups.forEach((u) => {
      if (u) {
        const email = u.emailAddresses?.[0]?.emailAddress || "";
        const name =
          `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "Unnamed";
        userMap[u.id] = { id: u.id, name, email };
        if (email) userMap[email] = { id: u.id, name, email };
      }
    });

    const enriched = tasks.map((task) => {
      const assigner = userMap[task.assignerEmail ?? ""] || {
        id: "",
        name: task.assignerName || "—",
        email: task.assignerEmail || "",
      };
      const assignees = task.assigneeIds?.map((id) => {
        const u = userMap[id];
        return { id, name: u?.name || "—", email: u?.email || "" };
      });
      return { ...task, assignerName: assigner.name, assignees };
    });

    return NextResponse.json({
      tasks: enriched,
      total,
      totalPages: Math.ceil(total / limit),
      page,
    });
  } catch (err) {
    console.error("❌ GET /api/tasks failed:", err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// ========== OPTIONS ==========
export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}
