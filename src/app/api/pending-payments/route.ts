// // File: src/app/api/pending-payments/route.ts

// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";

// export const dynamic = "force-dynamic";

// // --- GET all pending payments ---
// export async function GET(req: NextRequest) {
//   const { userId } = auth();

//   if (!userId) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   try {
//     const pendingPayments = await prisma.task.findMany({
//       where: {
//         status: "PENDING", // 🔴 change if your enum/value is different
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//       include: {
//         remarks: {
//           orderBy: { createdAt: "asc" },
//           select: {
//             id: true,
//             remark: true,
//             createdAt: true,
//             authorName: true,
//             authorEmail: true,
//           },
//         },
//       },
//     });

//     return NextResponse.json(
//       pendingPayments.map((task) => ({
//         id: task.id,
//         title: task.title,
//         amount: task.amount,
//         status: task.status,
//         shopName: task.shopName,
//         phone: task.phone,
//         createdAt: task.createdAt,
//         remarks: task.remarks.map((r) => ({
//           id: r.id,
//           remark: r.remark,
//           createdAt: r.createdAt,
//           authorName: r.authorName || "Unknown",
//           authorEmail: r.authorEmail || "",
//         })),
//       }))
//     );
//   } catch (err) {
//     console.error("❌ Fetch pending payments failed:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch pending payments" },
//       { status: 500 }
//     );
//   }
// }








// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";

// export const dynamic = "force-dynamic";

// export async function GET(req: NextRequest) {
//   // 🔐 Clerk auth
//   const { userId } = auth();

//   if (!userId) {
//     return NextResponse.json(
//       { error: "Unauthorized" },
//       { status: 401 }
//     );
//   }

//   try {
//     const { searchParams } = new URL(req.url);
//     const dateParam = searchParams.get("date");

//     const baseDate = dateParam ? new Date(dateParam) : new Date();

//     const startOfDay = new Date(baseDate);
//     startOfDay.setUTCHours(0, 0, 0, 0);

//     const endOfDay = new Date(baseDate);
//     endOfDay.setUTCHours(23, 59, 59, 999);

//     // 🔥 Fetch tasks
//     const tasks = await prisma.task.findMany({
//       select: {
//         id: true,
//         title: true,
//         assignerName: true,
//         amount: true,
//         paymentHistory: true,
//         customFields: true, // phone, shopName
//       },
//     });

//     const paymentsToday: any[] = [];
//     const summaryByAssigner: Record<string, number> = {};
//     let totalUpdatedAmount = 0;

//     for (const task of tasks) {
//       if (!Array.isArray(task.paymentHistory)) continue;

//       const history = task.paymentHistory as any[];

//       const phone = task.customFields?.phone || null;
//       const shopName = task.customFields?.shopName || null;

//       for (let i = 0; i < history.length; i++) {
//         const p = history[i];
//         if (!p?.updatedAt) continue;

//         const updatedAt = new Date(p.updatedAt);
//         if (updatedAt < startOfDay || updatedAt > endOfDay) continue;

//         const previousReceived =
//           i > 0 ? Number(history[i - 1]?.received || 0) : 0;

//         const currentReceived = Number(p.received || 0);

//         const amountUpdated =
//           i === 0 ? currentReceived : currentReceived - previousReceived;

//         if (amountUpdated <= 0) continue;

//         const assigner =
//           p.assignerName || task.assignerName || "Unknown";

//         paymentsToday.push({
//           paymentId: `${task.id}_${updatedAt.getTime()}`,
//           taskId: task.id,
//           taskTitle: task.title,
//           totalAmount: task.amount || 0,

//           receivedTillNow: currentReceived,
//           amountUpdated,

//           pendingAmount:
//             (task.amount || 0) - currentReceived,

//           updatedAt,
//           updatedBy: p.updatedBy || "Unknown",
//           fileUrl: p.fileUrl || null,

//           phone,
//           shopName,
//           assignerName: assigner,
//         });

//         // ✅ Assign­er wise summary
//         summaryByAssigner[assigner] =
//           (summaryByAssigner[assigner] || 0) + amountUpdated;

//         totalUpdatedAmount += amountUpdated;
//       }
//     }

//     return NextResponse.json({
//       date: startOfDay.toISOString().slice(0, 10),
//       paymentsToday,
//       summaryByAssigner,
//       totalUpdatedAmount,
//       count: paymentsToday.length,
//     });
//   } catch (err) {
//     console.error("❌ Error fetching pending payments:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch pending payments" },
//       { status: 500 }
//     );
//   }
// }













// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export const dynamic = "force-dynamic";

// export async function GET(req: NextRequest) {
//   try {
//     // 1️⃣ Fetch tasks that are NOT fully paid
//     const tasks = await prisma.task.findMany({
//       where: {
//         status: {
//           not: "paid", // ✅ only pending / partial
//         },
//       },
//       select: {
//         id: true,
//         title: true,
//         amount: true,
//         status: true,
//         shopName: true,
//         phone: true,
//         paymentHistory: true,
//         paymentRemarks: {
//           orderBy: { createdAt: "desc" },
//           take: 1, // ✅ latest remark only
//           select: {
//             remark: true,
//             nextFollowUpDate: true,
//             paymentStatus: true,
//             createdAt: true,
//           },
//         },
//       },
//     });

//     const pendingPayments = tasks.map((task) => {
//       const history = Array.isArray(task.paymentHistory)
//         ? task.paymentHistory
//         : [];

//       const totalReceived =
//         history.length > 0
//           ? Number(history[history.length - 1]?.received || 0)
//           : 0;

//       const totalAmount = Number(task.amount || 0);
//       const pendingAmount = Math.max(totalAmount - totalReceived, 0);

//       const latestRemark = task.paymentRemarks[0] || null;

//       return {
//         taskId: task.id,
//         taskTitle: task.title,
//         phone: task.phone || null,
//         shopName: task.shopName || null,

//         totalAmount,
//         receivedAmount: totalReceived,
//         pendingAmount,

//         paymentStatus: latestRemark?.paymentStatus || "pending",
//         remark: latestRemark?.remark || "",
//         nextFollowUpDate: latestRemark?.nextFollowUpDate || null,
//         lastUpdatedAt: latestRemark?.createdAt || null,
//       };
//     });

//     return NextResponse.json({
//       total: pendingPayments.length,
//       data: pendingPayments,
//     });
//   } catch (err) {
//     console.error("❌ Pending payments error:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch pending payments" },
//       { status: 500 }
//     );
//   }
// }





// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export const dynamic = "force-dynamic";

// export async function GET(req: NextRequest) {
//   try {
//     const tasks = await prisma.task.findMany({
//       where: {
//         status: { not: "paid" },
//       },
//       select: {
//         id: true,
//         title: true,
//         amount: true,
//         shopName: true,
//         phone: true,
//         paymentHistory: true,
//         paymentRemarks: {
//           orderBy: { createdAt: "desc" },
//           take: 1,
//           select: {
//             remark: true,
//             paymentStatus: true,
//             nextFollowUpDate: true,
//             followUpStatus: true,
//             priorityLevel: true,
//             createdAt: true,
//           },
//         },
//       },
//     });

//     const data = tasks.map((task) => {
//       const history = Array.isArray(task.paymentHistory)
//         ? task.paymentHistory
//         : [];

//       const receivedAmount =
//         history.length > 0
//           ? Number(history[history.length - 1]?.received || 0)
//           : 0;

//       const totalAmount = Number(task.amount || 0);
//       const pendingAmount = Math.max(totalAmount - receivedAmount, 0);

//       const latest = task.paymentRemarks[0];

//       return {
//         taskId: task.id,
//         taskTitle: task.title,
//         phone: task.phone || null,

//         totalAmount,
//         receivedAmount,
//         pendingAmount,

//         paymentStatus: latest?.paymentStatus || "todo",
//         latestRemark: latest?.remark || "",
//         nextFollowUpDate: latest?.nextFollowUpDate || null,
//         followUpStatus: latest?.followUpStatus || null,
//         priorityLevel: latest?.priorityLevel || "medium",
//       };
//     });

//     return NextResponse.json({ data });
//   } catch (err) {
//     console.error("❌ Pending payments error:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch pending payments" },
//       { status: 500 }
//     );
//   }
// }




// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export const dynamic = "force-dynamic";

// export async function GET(req: NextRequest) {
//   try {
//     // 1️⃣ Fetch unpaid / partial tasks
//     const tasks = await prisma.task.findMany({
//       where: {
//         status: { not: "paid" },
//       },
//       select: {
//         id: true,
//         title: true,
//         amount: true,
//         phone: true,
//         paymentHistory: true,
//       },
//     });

//     // 2️⃣ Fetch latest remark PER task (IMPORTANT FIX)
//     const remarks = await prisma.paymentRemark.findMany({
//       where: {
//         taskId: { in: tasks.map((t) => t.id) },
//       },
//       orderBy: { createdAt: "desc" },
//       distinct: ["taskId"], // 🔥 only latest per task
//       select: {
//         taskId: true,
//         remark: true,
//         nextFollowUpDate: true,
//         createdAt: true,
//       },
//     });

//     // 3️⃣ Convert remarks to map
//     const remarkMap = new Map(
//       remarks.map((r) => [r.taskId, r])
//     );

//     // 4️⃣ Build response
//     const data = tasks.map((task) => {
//       const history = Array.isArray(task.paymentHistory)
//         ? task.paymentHistory
//         : [];

//       const receivedAmount =
//         history.length > 0
//           ? Number(history[history.length - 1]?.received || 0)
//           : 0;

//       const totalAmount = Number(task.amount || 0);
//       const pendingAmount = Math.max(totalAmount - receivedAmount, 0);

//       const latestRemark = remarkMap.get(task.id);

//       return {
//         taskId: task.id,
//         taskTitle: task.title,
//         phone: task.phone || null,

//         totalAmount,
//         receivedAmount,
//         pendingAmount,

//         latestRemark: latestRemark?.remark || "",
//         nextFollowUpDate: latestRemark?.nextFollowUpDate || null,
//       };
//     });

//     return NextResponse.json({ data });
//   } catch (err) {
//     console.error("❌ Pending payments error:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch pending payments" },
//       { status: 500 }
//     );
//   }
// }















import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1️⃣ Fetch unpaid / partial tasks (INCLUDE customFields)
    const tasks = await prisma.task.findMany({
      where: {
        status: { not: "paid" },
      },
      select: {
        id: true,
        title: true,
        amount: true,
        paymentHistory: true,
        customFields: true, // ✅ IMPORTANT (shopName + phone)
      },
    });

    // 2️⃣ Fetch latest remark PER task
    const remarks = await prisma.paymentRemark.findMany({
      where: {
        taskId: { in: tasks.map((t) => t.id) },
      },
      orderBy: { createdAt: "desc" },
      distinct: ["taskId"], // 🔥 latest per task
      select: {
        taskId: true,
        remark: true,
        nextFollowUpDate: true,
        createdAt: true,
      },
    });

    // 3️⃣ Convert remarks to map
    const remarkMap = new Map(
      remarks.map((r) => [r.taskId, r])
    );

    // 4️⃣ Build response
    const data = tasks.map((task) => {
      const history = Array.isArray(task.paymentHistory)
        ? task.paymentHistory
        : [];

      // ✅ CORRECT received calculation (sum till now)
      const receivedAmount = history.reduce(
        (sum, h) => sum + Number(h?.received || 0),
        0
      );

      const totalAmount = Number(task.amount || 0);
      const pendingAmount = Math.max(totalAmount - receivedAmount, 0);

      const latestRemark = remarkMap.get(task.id);

      // ✅ Extract from customFields (SAME AS OTHER FILE)
      const phone = task.customFields?.phone || null;
      const shopName = task.customFields?.shopName || "Unknown Shop";
      const customerName = task.customFields?.customerName || "";

      return {
        taskId: task.id,
        taskTitle: task.title,

        shopName,       // ✅ NOW WILL SHOW
        customerName,   // optional
        phone,

        totalAmount,
        receivedAmount,
        pendingAmount,

        latestRemark: latestRemark?.remark || "",
        nextFollowUpDate: latestRemark?.nextFollowUpDate || null,
      };
    });

    return NextResponse.json({ data });
  } catch (err) {
    console.error("❌ Pending payments error:", err);
    return NextResponse.json(
      { error: "Failed to fetch pending payments" },
      { status: 500 }
    );
  }
}





// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export const dynamic = "force-dynamic";

// export async function GET(req: NextRequest) {
//   try {
//     const url = new URL(req.url);

//     // ---------- PAGINATION ----------
//     const page = parseInt(url.searchParams.get("page") || "1", 10);
//     const limit = parseInt(url.searchParams.get("limit") || "10", 10);
//     const skip = (page - 1) * limit;

//     // ---------- FILTERS ----------
//     const search = url.searchParams.get("search")?.trim();
//     const followUp = url.searchParams.get("followUp"); // today | overdue | upcoming
//     const fromDate = url.searchParams.get("fromDate");
//     const toDate = url.searchParams.get("toDate");

//     // ---------- TASK FILTER ----------
//     const taskWhere: any = {
//       status: { not: "paid" },
//     };

//     if (search) {
//       taskWhere.OR = [
//         { title: { contains: search, mode: "insensitive" } },
//         { phone: { contains: search } },
//       ];
//     }

//     // ---------- FETCH TASKS ----------
//     const [tasks, total] = await Promise.all([
//       prisma.task.findMany({
//         where: taskWhere,
//         orderBy: { createdAt: "desc" },
//         skip,
//         take: limit,
//         select: {
//           id: true,
//           title: true,
//           amount: true,
//           phone: true,
//           paymentHistory: true,
//         },
//       }),
//       prisma.task.count({ where: taskWhere }),
//     ]);

//     if (tasks.length === 0) {
//       return NextResponse.json({
//         data: [],
//         pagination: {
//           page,
//           limit,
//           total,
//           totalPages: Math.ceil(total / limit),
//         },
//       });
//     }

//     // ---------- REMARK FILTER ----------
//     const remarkWhere: any = {
//       taskId: { in: tasks.map((t) => t.id) },
//     };

//     const now = new Date();
//     const startOfToday = new Date();
//     startOfToday.setHours(0, 0, 0, 0);

//     if (followUp === "today") {
//       const end = new Date(startOfToday);
//       end.setHours(23, 59, 59, 999);
//       remarkWhere.nextFollowUpDate = { gte: startOfToday, lte: end };
//     }

//     if (followUp === "overdue") {
//       remarkWhere.nextFollowUpDate = { lt: startOfToday };
//     }

//     if (followUp === "upcoming") {
//       remarkWhere.nextFollowUpDate = { gt: now };
//     }

//     if (fromDate || toDate) {
//       remarkWhere.nextFollowUpDate = {
//         ...(fromDate && { gte: new Date(fromDate) }),
//         ...(toDate && { lte: new Date(toDate) }),
//       };
//     }

//     // ---------- FETCH LATEST REMARK PER TASK ----------
//     const remarks = await prisma.paymentRemark.findMany({
//       where: remarkWhere,
//       orderBy: { createdAt: "desc" },
//       distinct: ["taskId"],
//       select: {
//         taskId: true,
//         remark: true,
//         nextFollowUpDate: true,
//         createdAt: true,
//       },
//     });

//     const remarkMap = new Map(remarks.map((r) => [r.taskId, r]));

//     // ---------- BUILD RESPONSE ----------
//     const data = tasks.map((task) => {
//       const history = Array.isArray(task.paymentHistory)
//         ? task.paymentHistory
//         : [];

//       const receivedAmount =
//         history.length > 0
//           ? Number(history[history.length - 1]?.received || 0)
//           : 0;

//       const totalAmount = Number(task.amount || 0);
//       const pendingAmount = Math.max(totalAmount - receivedAmount, 0);

//       const latest = remarkMap.get(task.id);

//       return {
//         taskId: task.id,
//         taskTitle: task.title,
//         phone: task.phone || null,

//         totalAmount,
//         receivedAmount,
//         pendingAmount,

//         latestRemark: latest?.remark || "",
//         nextFollowUpDate: latest?.nextFollowUpDate || null,
//       };
//     });

//     return NextResponse.json({
//       data,
//       pagination: {
//         page,
//         limit,
//         total,
//         totalPages: Math.ceil(total / limit),
//         hasNext: skip + data.length < total,
//         hasPrevious: page > 1,
//       },
//     });
//   } catch (err) {
//     console.error("❌ Pending payments error:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch pending payments" },
//       { status: 500 }
//     );
//   }
// }





// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import jwt from "jsonwebtoken";

// export const dynamic = "force-dynamic";

// interface TokenPayload {
//   id: string;
//   role: string;
// }

// export async function GET(req: NextRequest) {
//   try {
//     // ---------------- AUTH ----------------
//     const authHeader = req.headers.get("authorization");

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const token = authHeader.split(" ")[1];

//     let decoded: TokenPayload;
//     try {
//       decoded = jwt.verify(
//         token,
//         process.env.JWT_SECRET!
//       ) as TokenPayload;
//     } catch {
//       return NextResponse.json({ error: "Invalid token" }, { status: 401 });
//     }

//     const userId = decoded.id;
//     const userRole = decoded.role; // admin | user

//     // ---------------- QUERY PARAMS ----------------
//     const url = new URL(req.url);
//     const page = parseInt(url.searchParams.get("page") || "1", 10);
//     const limit = parseInt(url.searchParams.get("limit") || "10", 10);
//     const skip = (page - 1) * limit;

//     const search = url.searchParams.get("search")?.trim();
//     const followUp = url.searchParams.get("followUp");
//     const fromDate = url.searchParams.get("fromDate");
//     const toDate = url.searchParams.get("toDate");

//     // ---------------- TASK FILTER ----------------
//     const taskWhere: any = {
//       status: { not: "paid" },
//     };

//     // 🔐 ROLE BASED FILTER
//     if (userRole !== "admin") {
//       taskWhere.createdById = userId;
//     }

//     // 🔍 SEARCH
//     if (search) {
//       taskWhere.OR = [
//         { title: { contains: search, mode: "insensitive" } },
//         { phone: { contains: search } },
//       ];
//     }

//     // ---------------- FETCH TASKS ----------------
//     const [tasks, total] = await Promise.all([
//       prisma.task.findMany({
//         where: taskWhere,
//         orderBy: { createdAt: "desc" },
//         skip,
//         take: limit,
//         select: {
//           id: true,
//           title: true,
//           amount: true,
//           phone: true,
//           paymentHistory: true,
//         },
//       }),
//       prisma.task.count({ where: taskWhere }),
//     ]);

//     if (!tasks.length) {
//       return NextResponse.json({
//         data: [],
//         pagination: {
//           page,
//           limit,
//           total,
//           totalPages: Math.ceil(total / limit),
//         },
//       });
//     }

//     // ---------------- REMARK FILTER ----------------
//     const remarkWhere: any = {
//       taskId: { in: tasks.map((t) => t.id) },
//     };

//     const now = new Date();
//     const startOfToday = new Date();
//     startOfToday.setHours(0, 0, 0, 0);

//     if (followUp === "today") {
//       const end = new Date(startOfToday);
//       end.setHours(23, 59, 59, 999);
//       remarkWhere.nextFollowUpDate = { gte: startOfToday, lte: end };
//     }

//     if (followUp === "overdue") {
//       remarkWhere.nextFollowUpDate = { lt: startOfToday };
//     }

//     if (followUp === "upcoming") {
//       remarkWhere.nextFollowUpDate = { gt: now };
//     }

//     if (fromDate || toDate) {
//       remarkWhere.nextFollowUpDate = {
//         ...(fromDate && { gte: new Date(fromDate) }),
//         ...(toDate && { lte: new Date(toDate) }),
//       };
//     }

//     // ---------------- FETCH LATEST REMARK ----------------
//     const remarks = await prisma.paymentRemark.findMany({
//       where: remarkWhere,
//       orderBy: { createdAt: "desc" },
//       distinct: ["taskId"],
//       select: {
//         taskId: true,
//         remark: true,
//         nextFollowUpDate: true,
//       },
//     });

//     const remarkMap = new Map(remarks.map((r) => [r.taskId, r]));

//     // ---------------- BUILD RESPONSE ----------------
//     const data = tasks.map((task) => {
//       const history = Array.isArray(task.paymentHistory)
//         ? task.paymentHistory
//         : [];

//       const receivedAmount =
//         history.length > 0
//           ? Number(history[history.length - 1]?.received || 0)
//           : 0;

//       const totalAmount = Number(task.amount || 0);
//       const pendingAmount = Math.max(totalAmount - receivedAmount, 0);

//       const latest = remarkMap.get(task.id);

//       return {
//         taskId: task.id,
//         taskTitle: task.title,
//         phone: task.phone || null,
//         totalAmount,
//         receivedAmount,
//         pendingAmount,
//         latestRemark: latest?.remark || "",
//         nextFollowUpDate: latest?.nextFollowUpDate || null,
//       };
//     });

//     return NextResponse.json({
//       data,
//       pagination: {
//         page,
//         limit,
//         total,
//         totalPages: Math.ceil(total / limit),
//         hasNext: skip + data.length < total,
//         hasPrevious: page > 1,
//       },
//     });
//   } catch (err) {
//     console.error("❌ Pending payments error:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch pending payments" },
//       { status: 500 }
//     );
//   }
// }
