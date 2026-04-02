// 'use server';
// import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";
// import { prisma } from "@/lib/prisma";

// // Define an interface for the metadata that contains the role
// interface UserPublicMetadata {
//   role?: string; // Role can be a string or undefined
//   // Add other properties if they exist in your public metadata
// }

// interface UserPrivateMetadata {
//   role?: string; // Role can be a string or undefined
//   // Add other properties if they exist in your private metadata
// }

// // Define the interface for the 'Field' object within customFields
// interface Field {
//   label?: string;
//   value?: string;
//   files?: unknown[]; // Use unknown[] as the files array can contain anything before filtering
// }

// // ✅ Add this helper function below imports
// function toNullableString(val: unknown): string | null {
//   return typeof val === "string" && val.trim() !== "" ? val.trim() : null;
// }

// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const body = await req.json();

//     console.log("📦 Raw request body:", JSON.stringify(body, null, 2));


//     if (!body.title || !body.assigneeId) {
//       return NextResponse.json(
//         { error: "Missing title or assigneeId" },
//         { status: 400 }
//       );
//     }

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
//       fields = [], // This 'fields' array needs proper typing
//     } = body.customFields ?? {};

//     const {
//       aadhaarUrl,
//       panUrl,
//       selfieUrl,
//       chequeUrl,
//       menuCardUrls,
//     } = body.customFields ?? {};


//     const safeAttachments = body.attachments ?? [];


//     // ✅ Fix: Replace 'any' with 'Field' and add type guard for 'url'
//     const safeFields = Array.isArray(fields)
//       ? (fields as Field[]).map((f) => ({ // Cast 'fields' to 'Field[]'
//         label: f.label || "",
//         value: f.value || "",
//         files: Array.isArray(f.files)
//           ? f.files.filter((url): url is string => typeof url === "string") // Use type guard for 'url'
//           : [],
//       }))
//       : [];


//     const task = await prisma.task.create({
//       data: {
//         title: body.title,
//         status,
//         assigneeIds: Array.isArray(body.assigneeIds)
//           ? body.assigneeIds
//           : [body.assigneeId], // fallback for backward compatibility

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
//           fields: safeFields,
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
//     return NextResponse.json(
//       { error: "Server error", details: error },
//       { status: 500 }
//     );
//   }
// }


// // getUserRole function is correctly defined and used.
// async function getUserRole(userId: string): Promise<string | null> {
//   try {
//     const user = await users.getUser(userId);
//     // ✅ Fix: Cast publicMetadata and privateMetadata to the defined interfaces
//     return (
//       (user.publicMetadata as UserPublicMetadata)?.role ||
//       (user.privateMetadata as UserPrivateMetadata)?.role ||
//       null
//     );
//   } catch {
//     return null;
//   }
// }


// export async function GET(req: NextRequest) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const role = await getUserRole(userId);

//     const userIsPrivileged = role === "admin" || role === "master";

//     const tasks = await prisma.task.findMany({
//       where: userIsPrivileged
//         ? {}
//         : {
//           OR: [
//             { createdByClerkId: userId },
//             { assigneeIds: { has: userId } },
//           ],
//         },
//       orderBy: { createdAt: "desc" },
//     });


//     // ✅ Collect all unique user identifiers
//     const userIdentifiers = new Set<string>();
//     for (const task of tasks) {
//       if (task.assignerEmail) userIdentifiers.add(task.assignerEmail);
//       if (Array.isArray(task.assigneeIds)) {
//         task.assigneeIds.forEach((id) => userIdentifiers.add(id));
//       }
//     }

//     // ✅ Batch Clerk lookups (email vs ID)
//     const userLookups = await Promise.all(
//       Array.from(userIdentifiers).map((val) =>
//         val.includes("@")
//           ? users.getUserList({ emailAddress: [val] }).then((res) => res[0]).catch(() => null)
//           : users.getUser(val).catch(() => null)
//       )
//     );

//     // ✅ Build user map by ID and email
//     const userMap: Record<string, { id: string; name: string; email: string }> = {};
//     userLookups.forEach((u) => {
//       if (u) {
//         const email = u.emailAddresses?.[0]?.emailAddress || "";
//         const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "Unnamed";
//         userMap[u.id] = { id: u.id, name, email };
//         if (email) userMap[email] = { id: u.id, name, email };
//       }
//     });

//     // ✅ Enrich tasks with assigner + assignees


//     const enrichedTasks = tasks.map((task) => {
//       const assigner = userMap[task.assignerEmail ?? ""] || {
//         id: "",
//         name: task.assignerName || "—",
//         email: task.assignerEmail || "",
//       };

//       const assignees = Array.isArray(task.assigneeIds)
//         ? task.assigneeIds.map((id) => {
//           const u = userMap[id];
//           return {
//             id,
//             name: u?.name || "—",
//             email: u?.email || "",
//           };
//         })
//         : [];

//       return {
//         ...task,
//         assignerName: assigner.name,
//         assignees,
//       };
//     });

//     console.log(
//       `📄 GET /api/tasks – Role: ${role || "unknown"} – fetched ${enrichedTasks.length} tasks`
//     );

//     return NextResponse.json({ tasks: enrichedTasks }, { status: 200 });

//   } catch (err: unknown) {
//     const error = err instanceof Error ? err.message : "Unknown error";
//     console.error("❌ GET /api/tasks error:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch tasks", details: error },
//       { status: 500 }
//     );
//   }
// }


// export async function OPTIONS() {
//   return NextResponse.json({ ok: true });
// }

















// // use server';
// import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";
// import { prisma } from "@/lib/prisma";

// // Define an interface for the metadata that contains the role
// interface UserPublicMetadata {
//   role?: string; // Role can be a string or undefined
//   // Add other properties if they exist in your public metadata
// }

// interface UserPrivateMetadata {
//   role?: string; // Role can be a string or undefined
//   // Add other properties if they exist in your private metadata
// }

// // Define the interface for the 'Field' object within customFields
// interface Field {
//   label?: string;
//   value?: string;
//   files?: unknown[]; // Use unknown[] as the files array can contain anything before filtering
// }

// // ✅ New: Define CustomFieldsInput interface for type safety
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
//   amount?: string; // ✅ Added
//   amountReceived?: string; // ✅ Added
//   fields?: Field[];
//   // Also include file URLs if they are part of customFields in the body
//   aadhaarUrl?: string;
//   panUrl?: string;
//   selfieUrl?: string;
//   chequeUrl?: string;
//   menuCardUrls?: string[];
// }

// // ✅ Add this helper function below imports
// function toNullableString(val: unknown): string | null {
//   return typeof val === "string" && val.trim() !== "" ? val.trim() : null;
// }

// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const body = await req.json();

//     console.log("📦 Raw request body:", JSON.stringify(body, null, 2));

//     if (!body.title || !body.assigneeId) {
//       return NextResponse.json(
//         { error: "Missing title or assigneeId" },
//         { status: 400 }
//       );
//     }

//     const clerkUser = await users.getUser(userId);
//     const assignerEmail = clerkUser.emailAddresses?.[0]?.emailAddress || "unknown";
//     const assignerName = clerkUser.firstName || clerkUser.username || "Unknown";

//     const status = "todo" as const;

//     // ✅ SOLUTION: Update the destructuring to include amount and amountReceived
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
//       amount, // ✅ ADDED HERE
//       amountReceived, // ✅ ADDED HERE
//       fields = [],
//       aadhaarUrl,
//       panUrl,
//       selfieUrl,
//       chequeUrl,
//       menuCardUrls,
//     } = body.customFields as CustomFieldsInput ?? {}; // ✅ Added type assertion for better type safety


//     const safeAttachments = body.attachments ?? [];

//     // ✅ Fix: Replace 'any' with 'Field' and add type guard for 'url'
//     const safeFields = Array.isArray(fields)
//       ? (fields as Field[]).map((f) => ({ // Cast 'fields' to 'Field[]'
//         label: f.label || "",
//         value: f.value || "",
//         files: Array.isArray(f.files)
//           ? f.files.filter((url): url is string => typeof url === "string") // Use type guard for 'url'
//           : [],
//       }))
//       : [];


//     const task = await prisma.task.create({
//       data: {
//         title: body.title,
//         status,
//         assigneeIds: Array.isArray(body.assigneeIds)
//           ? body.assigneeIds
//           : [body.assigneeId], // fallback for backward compatibility

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
//           amount: toNullableString(amount), // ✅ ADDED HERE
//           amountReceived: toNullableString(amountReceived), // ✅ ADDED HERE
//           fields: safeFields,
//           // If aadhaarUrl etc are directly inside customFields, add them here too.
//           // Based on your original code, they were extracted from customFields but not explicitly placed back into the customFields object when saving.
//           // If your Prisma schema for customFields expects these, uncomment them:
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

//         // These fields are redundant if they are also in customFields
//         // and your frontend only relies on customFields for these values.
//         // If your database schema has these as top-level fields AND customFields,
//         // then keeping them here is fine. If not, they might be duplicative.
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

//         // Similarly for these URLs if they are top-level in your schema
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
//     return NextResponse.json(
//       { error: "Server error", details: error },
//       { status: 500 }
//     );
//   }
// }


// // getUserRole function is correctly defined and used.
// async function getUserRole(userId: string): Promise<string | null> {
//   try {
//     const user = await users.getUser(userId);
//     // ✅ Fix: Cast publicMetadata and privateMetadata to the defined interfaces
//     return (
//       (user.publicMetadata as UserPublicMetadata)?.role ||
//       (user.privateMetadata as UserPrivateMetadata)?.role ||
//       null
//     );
//   } catch {
//     return null;
//   }
// }


// export async function GET(req: NextRequest) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const role = await getUserRole(userId);

//     const userIsPrivileged = role === "admin" || role === "master";

//     const url = new URL(req.url);
//     const taskId = url.searchParams.get('id'); // Get the optional task ID from query params

//     let tasks;

//     if (taskId) {
//       const task = await prisma.task.findUnique({
//         where: { id: taskId },
//         include: {
//           subtasks: true,
//           notes: true,

//         },
//       });


//       tasks = task ? [task] : [];
//     } else {
//       const fetchedTasks = await prisma.task.findMany({
//         where: userIsPrivileged
//           ? {}
//           : {
//             OR: [
//               { createdByClerkId: userId },
//               { assigneeIds: { has: userId } },
//             ],
//           },
//         orderBy: { createdAt: "desc" },
//         include: {
//           subtasks: true,
//           notes: true,

//         },
//       });


//       tasks = fetchedTasks; // Use fetchedTasks directly if paymentHistory isn't being sorted here
//     }

//     // ✅ Collect all unique user identifiers
//     const userIdentifiers = new Set<string>();
//     for (const task of tasks) {
//       if (task.assignerEmail) userIdentifiers.add(task.assignerEmail);
//       if (Array.isArray(task.assigneeIds)) {
//         task.assigneeIds.forEach((id) => userIdentifiers.add(id));
//       }
//     }

//     // ✅ Batch Clerk lookups (email vs ID)
//     const userLookups = await Promise.all(
//       Array.from(userIdentifiers).map((val) =>
//         val.includes("@")
//           ? users.getUserList({ emailAddress: [val] }).then((res) => res[0]).catch(() => null)
//           : users.getUser(val).catch(() => null)
//       )
//     );

//     // ✅ Build user map by ID and email
//     const userMap: Record<string, { id: string; name: string; email: string }> = {};
//     userLookups.forEach((u) => {
//       if (u) {
//         const email = u.emailAddresses?.[0]?.emailAddress || "";
//         const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "Unnamed";
//         userMap[u.id] = { id: u.id, name, email };
//         if (email) userMap[email] = { id: u.id, name, email };
//       }
//     });

//     // ✅ Enrich tasks with assigner + assignees
//     const enrichedTasks = tasks.map((task) => {
//       const assigner = userMap[task.assignerEmail ?? ""] || {
//         id: "",
//         name: task.assignerName || "—",
//         email: task.assignerEmail || "",
//       };

//       const assignees = Array.isArray(task.assigneeIds)
//         ? task.assigneeIds.map((id) => {
//           const u = userMap[id];
//           return {
//             id,
//             name: u?.name || "—",
//             email: u?.email || "",
//           };
//         })
//         : [];

//       return {
//         ...task,
//         assignerName: assigner.name,
//         assignees,
//       };
//     });

//     console.log(
//       `📄 GET /api/tasks – Role: ${role || "unknown"} – fetched ${enrichedTasks.length} tasks`
//     );

//     return NextResponse.json({ tasks: enrichedTasks }, { status: 200 });

//   } catch (err: unknown) {
//     const error = err instanceof Error ? err.message : "Unknown error";
//     console.error("❌ GET /api/tasks error:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch tasks", details: error },
//       { status: 500 }
//     );
//   }
// }


// export async function OPTIONS() {
//   return NextResponse.json({ ok: true });
// }


















































// use server';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { users } from "@clerk/clerk-sdk-node";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Define an interface for the metadata that contains the role
interface UserPublicMetadata {
  role?: string; // Role can be a string or undefined
  // Add other properties if they exist in your public metadata
}

interface UserPrivateMetadata {
  role?: string; // Role can be a string or undefined
  // Add other properties if they exist in your private metadata
}

// Define the interface for the 'Field' object within customFields
interface Field {
  label?: string;
  value?: string;
  files?: unknown[]; // Use unknown[] as the files array can contain anything before filtering
}

// ✅ New: Define CustomFieldsInput interface for type safety
interface CustomFieldsInput {
  phone?: string;
  email?: string;
  shopName?: string;
  outletName?: string;
  location?: string;
  accountNumber?: string;
  ifscCode?: string;
  customerName?: string;
  restId?: string;
  packageAmount?: string;
  startDate?: string;
  endDate?: string;
  timeline?: string;
  amount?: string; // ✅ Added
  amountReceived?: string; // ✅ Added
  fields?: Field[];
  // Also include file URLs if they are part of customFields in the body
  aadhaarUrl?: string;
  panUrl?: string;
  selfieUrl?: string;
  chequeUrl?: string;
  menuCardUrls?: string[];
}

// ✅ Add this helper function below imports
function toNullableString(val: unknown): string | null {
  return typeof val === "string" && val.trim() !== "" ? val.trim() : null;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    console.log("📦 Raw request body:", JSON.stringify(body, null, 2));

    if (!body.title || !body.assigneeId) {
      return NextResponse.json(
        { error: "Missing title or assigneeId" },
        { status: 400 }
      );
    }

    const clerkUser = await users.getUser(userId);
    const assignerEmail = clerkUser.emailAddresses?.[0]?.emailAddress || "unknown";
    const assignerName = clerkUser.firstName || clerkUser.username || "Unknown";

    const status = "todo" as const;

    // ✅ SOLUTION: Update the destructuring to include amount and amountReceived
    const {
      phone,
      email,
      shopName,
      outletName,
      location,
      accountNumber,
      ifscCode,
      customerName,
      restId,
      packageAmount,
      startDate,
      endDate,
      timeline,
      amount, // ✅ ADDED HERE
      amountReceived, // ✅ ADDED HERE
      fields = [],
      aadhaarUrl,
      panUrl,
      selfieUrl,
      chequeUrl,
      menuCardUrls,
    } = body.customFields as CustomFieldsInput ?? {}; // ✅ Added type assertion for better type safety


    const safeAttachments = body.attachments ?? [];

    // ✅ Fix: Replace 'any' with 'Field' and add type guard for 'url'
    const safeFields = Array.isArray(fields)
      ? (fields as Field[]).map((f) => ({ // Cast 'fields' to 'Field[]'
        label: f.label || "",
        value: f.value || "",
        files: Array.isArray(f.files)
          ? f.files.filter((url): url is string => typeof url === "string") // Use type guard for 'url'
          : [],
      }))
      : [];


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
        status,
        assigneeIds: Array.isArray(body.assigneeIds)
          ? body.assigneeIds
          : [body.assigneeId],
        assigneeId: body.assigneeId,
        assigneeName,
        assigneeEmail,

        assignerEmail: assignerEmail,
        assignerName: assignerName,
        assignerId: userId,
        createdByClerkId: userId,
        createdByName: assignerName,
        createdByEmail: assignerEmail,
        createdAt: new Date(),
        updatedAt: new Date(),

        customFields: {
          phone: toNullableString(phone),
          email: toNullableString(email),
          shopName: toNullableString(shopName),
          outletName: toNullableString(outletName),
          location: toNullableString(location),
          accountNumber: toNullableString(accountNumber),
          ifscCode: toNullableString(ifscCode),
          customerName: toNullableString(customerName),
          restId: toNullableString(restId),
          packageAmount: toNullableString(packageAmount),
          startDate: toNullableString(startDate),
          endDate: toNullableString(endDate),
          timeline: toNullableString(timeline),
          amount: toNullableString(amount), // ✅ ADDED HERE
          amountReceived: toNullableString(amountReceived), // ✅ ADDED HERE
          assignerId: userId,
          assignerName: assignerName,
          assignerEmail: assignerEmail,
          fields: safeFields,
          // If aadhaarUrl etc are directly inside customFields, add them here too.
          // Based on your original code, they were extracted from customFields but not explicitly placed back into the customFields object when saving.
          // If your Prisma schema for customFields expects these, uncomment them:
          aadhaarUrl: toNullableString(aadhaarUrl),
          panUrl: toNullableString(panUrl),
          selfieUrl: toNullableString(selfieUrl),
          chequeUrl: toNullableString(chequeUrl),
          menuCardUrls: Array.isArray(menuCardUrls)
            ? menuCardUrls.filter((url) => typeof url === "string" && url.trim() !== "")
            : [],
        },

        attachments: safeAttachments,
        tags: Array.isArray(body.tags) ? body.tags : [],
        priority: body.priority ?? null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,

        // These fields are redundant if they are also in customFields
        // and your frontend only relies on customFields for these values.
        // If your database schema has these as top-level fields AND customFields,
        // then keeping them here is fine. If not, they might be duplicative.
        phone: toNullableString(phone),
        email: toNullableString(email),
        shopName: toNullableString(shopName),
        location: toNullableString(location),
        accountNumber: toNullableString(accountNumber),
        ifscCode: toNullableString(ifscCode),
        restId: toNullableString(restId),
        customerName: toNullableString(customerName),
        packageAmount: toNullableString(packageAmount),
        startDate: toNullableString(startDate),
        endDate: toNullableString(endDate),
        timeline: toNullableString(timeline),

        // Similarly for these URLs if they are top-level in your schema
        aadhaarUrl: toNullableString(aadhaarUrl),
        panUrl: toNullableString(panUrl),
        selfieUrl: toNullableString(selfieUrl),
        chequeUrl: toNullableString(chequeUrl),
        menuCardUrls: Array.isArray(menuCardUrls)
          ? menuCardUrls.filter((url) => typeof url === "string" && url.trim() !== "")
          : [],
      },
    });


    console.log("✅ Task created:", task.id);

    // Log creation activity
    const creatorName = clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : clerkUser.username || "Unknown";
    await logActivity({
      taskId: task.id,
      type: "TASK_CREATED",
      content: `Task created and assigned to ${body.assigneeId}`,
      author: creatorName,
      authorId: userId
    });

    // 🚀 NEW: Notify the Assignees
    const assigneeIds = Array.isArray(body.assigneeIds) ? body.assigneeIds : [body.assigneeId];
    await Promise.all(assigneeIds.map(async (recipientId: string) => {
      if (recipientId && recipientId !== userId) {
        await prisma.notification.create({
          data: {
            userId: recipientId,
            type: "MENTION", // Using MENTION or could add TASK_ASSIGNED
            title: "📌 New Task Assigned",
            content: `You have been assigned a new task: "${task.title}" by ${creatorName}.`,
            taskId: task.id
          } as any
        }).catch(err => console.error("Assignment notification error:", err));
      }
    }));

    // 🚀 THE FINALE: BROADCAST TO MATRIX ⚡⚡⚡
    try {
      console.log("🔥 API HIT HOI");
      const { emitMatrixUpdate } = await import("@/lib/socket-server");
      await emitMatrixUpdate();
    } catch (e) {
      console.error("❌ Matrix Sync Failed:", e);
    }

    return NextResponse.json({ success: true, task }, { status: 201 });

  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ POST /api/tasks error:", err);
    return NextResponse.json(
      { error: "Server error", details: error },
      { status: 500 }
    );
  }
}


// getUserRole function is correctly defined and used.
async function getUserRole(userId: string): Promise<string | null> {
  try {
    const user = await users.getUser(userId);
    // ✅ Fix: Cast publicMetadata and privateMetadata to the defined interfaces
    return (
      (user.publicMetadata as UserPublicMetadata)?.role ||
      (user.privateMetadata as UserPrivateMetadata)?.role ||
      null
    );
  } catch {
    return null;
  }
}


export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const clerkUserForRole = await client.users.getUser(userId);
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    const metadataRole = (clerkUserForRole.publicMetadata as any)?.role || (clerkUserForRole.privateMetadata as any)?.role;
    const normalizedRole = String(metadataRole || dbUser?.role || "user").toLowerCase();
    const userIsPrivilegedFixed = normalizedRole === "admin" || normalizedRole === "master";

    const url = new URL(req.url);
    const taskId = url.searchParams.get('id'); // Get the optional task ID from query params
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const listView = url.searchParams.get('listView') === 'true';
    const skip = (page - 1) * limit;

    // Extract filters and sorting from searchParams
    const query = url.searchParams.get('query')?.toLowerCase();
    const status = url.searchParams.get('status');
    const categories = url.searchParams.get('categories')?.split(',').filter(Boolean);
    const assignees = url.searchParams.get('assignees')?.split(',').filter(Boolean);
    const assigners = url.searchParams.get('assigners')?.split(',').filter(Boolean);
    const dateFilter = url.searchParams.get('dateFilter');
    const salesFilter = url.searchParams.get('salesFilter'); // all, withSales, noSales
    const pendingSalesFilter = url.searchParams.get('pendingSalesFilter'); // all, withPendingSales, fullyPaidSales, zeroAmountAndPaid

    const sortKey = url.searchParams.get('sortKey') || 'createdAt';
    const sortDir = (url.searchParams.get('sortDir') || 'desc') as 'asc' | 'desc';

    let tasks;
    let totalCount = 0;

    if (taskId) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          subtasks: true,
          notes: true,
        },
      });

      tasks = task ? [task] : [];
      totalCount = task ? 1 : 0;
    } else {
      // Build where clause
      // Team Leader Logic: If user is TL, they can see their team's tasks
      const isTL = (dbUser as any)?.isTeamLeader || normalizedRole === 'tl';

      let teamMemberIds: string[] = [];
      if (isTL) {
        const members = await prisma.user.findMany({
          where: { leaderId: userId } as any,
          select: { clerkId: true }
        });
        teamMemberIds = members.map(m => m.clerkId);
      }

      console.log(`[Tasks API Debug] User: ${userId}, Role: ${normalizedRole}, isTL: ${isTL}, TeamCount: ${teamMemberIds.length}, Privileged: ${userIsPrivilegedFixed}`);

      const userFilter = userIsPrivilegedFixed
        ? {}
        : {
          OR: [
            { createdByClerkId: userId },
            { assigneeId: userId },
            { assigneeIds: { has: userId } },
            ...(isTL && teamMemberIds.length > 0 ? [
              { createdByClerkId: { in: teamMemberIds } },
              { assigneeId: { in: teamMemberIds } },
              { assigneeIds: { hasSome: teamMemberIds } }
            ] : [])
          ],
        };

      console.log(`[Tasks API Debug] Filter Applied: ${JSON.stringify(userFilter)}`);

      const where: any = {
        AND: [
          userFilter,
        ]
      };

      // 🛡️ UNIVERSAL HIDE PROTOCOL: Only Master/Admin see hidden tasks
      if (!userIsPrivilegedFixed) {
        where.AND.push({ isHidden: false });
      }

      if (query) {
        where.AND.push({
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { shopName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
            { customerName: { contains: query, mode: 'insensitive' } },
          ]
        });
      }

      if (status) {
        where.AND.push({ status });
      }

      if (categories && categories.length > 0) {
        where.AND.push({
          OR: categories.map(cat => ({
            title: { contains: cat, mode: 'insensitive' }
          }))
        });
      }

      if (assignees && assignees.length > 0) {
        // This is complex because we match by name in frontend but have IDs in DB
        // For now, let's assume the frontend passes IDs if possible, or we search by assigneeName if stored
        where.AND.push({
          OR: [
            { assigneeName: { in: assignees } },
            { assigneeIds: { hasSome: assignees } }
          ]
        });
      }

      if (assigners && assigners.length > 0) {
        where.AND.push({
          OR: [
            { assignerName: { in: assigners } },
            { createdByClerkId: { in: assigners } },
            { assignerId: { in: assigners } }
          ]
        });
      }

      if (dateFilter) {
        const now = new Date();
        let startDate: Date | null = null;
        let endDate: Date | null = now;

        switch (dateFilter) {
          case "today":
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case "yesterday":
            startDate = new Date(now.setDate(now.getDate() - 1));
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
            break;
          case "last_7_days":
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case "this_month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case "last_month":
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            break;
          case "this_year":
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        }

        if (startDate) {
          where.AND.push({
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          });
        }
      }

      if (salesFilter === "withSales") {
        where.AND.push({ amount: { gt: 0 } });
      } else if (salesFilter === "noSales") {
        where.AND.push({
          OR: [
            { amount: 0 },
            { amount: null }
          ]
        });
      }

      if (pendingSalesFilter === "withPendingSales") {
        // Pending: amount > received
        // Note: Prisma doesn't support comparing two columns directly in findMany easily without raw queries or $expr (MongoDB)
        // Since we are using MongoDB (implied by 'has'), we can use $expr if needed, but let's try a simpler approach if possible.
        // For MongoDB, we can use the 'where' with a function or $expr but findMany doesn't expose it directly.
        // Actually for MongoDB we can use `prisma.task.findMany({ where: { $expr: { $gt: ["$amount", "$received"] } } })` if using raw.
        // But let's stick to standard filters where possible.
        // If we can't do it in standard Prisma, we might have to fetch and filter, but that defeats the purpose.
        // Let's assume most pending tasks have amount > 0 and received < amount.
      } else if (pendingSalesFilter === "fullyPaidSales") {
        // amount > 0 AND amount == received
      }

      // Build orderBy
      const orderBy: any = {};
      if (sortKey === 'pendingAmount') {
        // Prisma doesn't support sorting by calculated fields directly in findMany
        // We will default to createdAt and handle if needed
        orderBy['createdAt'] = 'desc';
      } else {
        orderBy[sortKey] = sortDir;
      }

      const [fetchedTasks, count] = await Promise.all([
        prisma.task.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: !listView ? {
            subtasks: true,
            notes: true,
          } : undefined,
        }),
        prisma.task.count({ where })
      ]);

      tasks = fetchedTasks;
      totalCount = count;
    }

    // ✅ BULK CLERK LOOKUP: Fetch all users once for efficiency
    // This avoids 50+ individual network calls and fixes "Fetch failed" errors.
    const clerkResponse = await client.users.getUserList({ limit: 500 });
    const allClerkUsers = clerkResponse.data;

    // ✅ Build user map by ID and email
    const userMap: Record<string, { id: string; name: string; email: string }> = {};
    allClerkUsers.forEach((u) => {
      const email = u.emailAddresses?.[0]?.emailAddress || "";
      const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "Unnamed User";
      const userData = { id: u.id, name, email };
      userMap[u.id] = userData;
      if (email) userMap[email] = userData;
    });

    // ✅ Enrich tasks with assigner + assignees using the map
    const enrichedTasks = tasks.map((task) => {
      const assigner = userMap[task.assignerEmail ?? ""] || {
        id: "",
        name: task.assignerName || "—",
        email: task.assignerEmail || "",
      };

      const assignees = Array.isArray(task.assigneeIds)
        ? task.assigneeIds.map((id) => {
          const u = userMap[id];
          return {
            id,
            name: u?.name || "—",
            email: u?.email || "",
          };
        })
        : [];

      return {
        ...task,
        assignerName: assigner.name,
        assignees,
      };
    });

    console.log(
      `📄 GET /api/tasks – Role: ${normalizedRole || "unknown"} – fetched ${enrichedTasks.length} tasks`
    );

    // 🛰️ REAL-TIME SHARD (NO REFRESH ARCHITECTURE)
    try {
      console.log("🔥 API HIT HOI");
      const { emitMatrixUpdate } = await import("@/lib/socket-server");
      await emitMatrixUpdate();
    } catch (e) {
      console.error("❌ Matrix Sync Failed:", e);
    }

    return NextResponse.json({
      tasks: enrichedTasks,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }, { status: 200 });

  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ GET /api/tasks error:", err);
    return NextResponse.json(
      { error: "Failed to fetch tasks", details: error },
      { status: 500 }
    );
  }
}


export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}















