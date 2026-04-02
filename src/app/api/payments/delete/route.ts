// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export async function DELETE(req: Request) {
//   try {
//     const { taskId, paymentId } = await req.json();

//     if (!taskId || !paymentId) {
//       return NextResponse.json(
//         { error: "taskId and paymentId required" },
//         { status: 400 }
//       );
//     }

//     const task = await prisma.task.findUnique({
//       where: { id: taskId },
//     });

//     if (!task || !Array.isArray(task.paymentHistory)) {
//       return NextResponse.json(
//         { error: "Task or payment history not found" },
//         { status: 404 }
//       );
//     }

//     const updatedPayments = (task.paymentHistory as any[]).filter(
//       (p) => p.id !== paymentId
//     );

//     await prisma.task.update({
//       where: { id: taskId },
//       data: {
//         paymentHistory: updatedPayments,
//       },
//     });

//     return NextResponse.json({ success: true });
//   } catch (err: any) {
//     console.error("Delete payment error:", err);
//     return NextResponse.json(
//       { error: err.message },
//       { status: 500 }
//     );
//   }
// }



















// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export async function DELETE(req: Request) {
//   try {
//     const { taskId, updatedAt } = await req.json();

//     if (!taskId || !updatedAt) {
//       return NextResponse.json(
//         { error: "taskId and updatedAt required" },
//         { status: 400 }
//       );
//     }

//     const task = await prisma.task.findUnique({
//       where: { id: taskId },
//       select: { paymentHistory: true },
//     });

//     if (!task || !Array.isArray(task.paymentHistory)) {
//       return NextResponse.json(
//         { error: "Task or payment history not found" },
//         { status: 404 }
//       );
//     }

//     const updatedPayments = task.paymentHistory.filter(
//       (p: any) =>
//         new Date(p.updatedAt).toISOString() !==
//         new Date(updatedAt).toISOString()
//     );

//     await prisma.task.update({
//       where: { id: taskId },
//       data: {
//         paymentHistory: updatedPayments,
//       },
//     });

//     return NextResponse.json({ success: true });
//   } catch (err: any) {
//     console.error("Delete payment error:", err);
//     return NextResponse.json(
//       { error: "Failed to delete payment" },
//       { status: 500 }
//     );
//   }
// }







// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// /**
//  * DELETE /api/payments/delete
//  * Body:
//  * {
//  *   taskId: string,
//  *   updatedAt: string (ISO date)
//  * }
//  */
// export async function DELETE(req: Request) {
//   try {
//     /* -----------------------------
//        1️⃣ Parse & validate request
//     ------------------------------ */
//     let body: any;

//     try {
//       body = await req.json();
//     } catch {
//       return NextResponse.json(
//         { error: "Invalid JSON body", code: "INVALID_JSON" },
//         { status: 400 }
//       );
//     }

//     const { taskId, updatedAt } = body;

//     if (!taskId || !updatedAt) {
//       return NextResponse.json(
//         {
//           error: "taskId and updatedAt are required",
//           code: "MISSING_FIELDS",
//         },
//         { status: 400 }
//       );
//     }

//     /* -----------------------------
//        2️⃣ Validate date format
//     ------------------------------ */
//     const parsedDate = new Date(updatedAt);

//     if (isNaN(parsedDate.getTime())) {
//       return NextResponse.json(
//         {
//           error: "Invalid updatedAt date format",
//           code: "INVALID_DATE",
//         },
//         { status: 400 }
//       );
//     }

//     /* -----------------------------
//        3️⃣ Fetch task safely
//     ------------------------------ */
//     const task = await prisma.task.findUnique({
//       where: { id: taskId },
//       select: {
//         id: true,
//         paymentHistory: true,
//       },
//     });

//     if (!task) {
//       return NextResponse.json(
//         {
//           error: "Task not found",
//           code: "TASK_NOT_FOUND",
//         },
//         { status: 404 }
//       );
//     }

//     if (!Array.isArray(task.paymentHistory)) {
//       return NextResponse.json(
//         {
//           error: "Payment history is corrupted or missing",
//           code: "INVALID_PAYMENT_HISTORY",
//         },
//         { status: 500 }
//       );
//     }

//     /* -----------------------------
//        4️⃣ Delete payment entry
//     ------------------------------ */
//     const originalLength = task.paymentHistory.length;

//     const updatedPayments = task.paymentHistory.filter((p: any) => {
//       if (!p?.updatedAt) return true;
//       return (
//         new Date(p.updatedAt).toISOString() !==
//         parsedDate.toISOString()
//       );
//     });

//     /* -----------------------------
//        5️⃣ Detect no-op delete
//     ------------------------------ */
//     if (updatedPayments.length === originalLength) {
//       return NextResponse.json(
//         {
//           error: "Payment record not found for given date",
//           code: "PAYMENT_NOT_FOUND",
//         },
//         { status: 404 }
//       );
//     }

//     /* -----------------------------
//        6️⃣ Persist changes
//     ------------------------------ */
//     await prisma.task.update({
//       where: { id: taskId },
//       data: {
//         paymentHistory: updatedPayments,
//       },
//     });

//     /* -----------------------------
//        7️⃣ Success response
//     ------------------------------ */
//     return NextResponse.json({
//       success: true,
//       deleted: originalLength - updatedPayments.length,
//     });
//   } catch (err: any) {
//     /* -----------------------------
//        8️⃣ Prisma-specific errors
//     ------------------------------ */
//     if (err?.code === "P2025") {
//       return NextResponse.json(
//         {
//           error: "Task not found during update",
//           code: "PRISMA_NOT_FOUND",
//         },
//         { status: 404 }
//       );
//     }

//     /* -----------------------------
//        9️⃣ Unknown / server error
//     ------------------------------ */
//     console.error("❌ Delete payment error:", {
//       message: err?.message,
//       stack: err?.stack,
//     });

//     return NextResponse.json(
//       {
//         error: "Internal server error while deleting payment",
//         code: "INTERNAL_ERROR",
//       },
//       { status: 500 }
//     );
//   }
// }













// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// /**
//  * DELETE /api/payments/delete
//  * Body:
//  * {
//  *   taskId: string,
//  *   paymentId: string
//  * }
//  */
// export async function DELETE(req: Request) {
//   try {
//     // 1️⃣ Parse & validate request
//     let body: any;
//     try {
//       body = await req.json();
//     } catch {
//       return NextResponse.json(
//         { error: "Invalid JSON body", code: "INVALID_JSON" },
//         { status: 400 }
//       );
//     }

//     const { taskId, paymentId } = body;

//     if (!taskId || !paymentId) {
//       return NextResponse.json(
//         {
//           error: "taskId and paymentId are required",
//           code: "MISSING_FIELDS",
//         },
//         { status: 400 }
//       );
//     }

//     // 2️⃣ Fetch task safely
//     const task = await prisma.task.findUnique({
//       where: { id: taskId },
//       select: { id: true, paymentHistory: true },
//     });

//     if (!task) {
//       return NextResponse.json(
//         { error: "Task not found", code: "TASK_NOT_FOUND" },
//         { status: 404 }
//       );
//     }

//     if (!Array.isArray(task.paymentHistory)) {
//       return NextResponse.json(
//         {
//           error: "Payment history is corrupted or missing",
//           code: "INVALID_PAYMENT_HISTORY",
//         },
//         { status: 500 }
//       );
//     }

//     // 3️⃣ Delete payment entry by paymentId
//     const originalLength = task.paymentHistory.length;
//     const updatedPayments = task.paymentHistory.filter(
//       (p: any) => p.id !== paymentId
//     );

//     // 4️⃣ Detect no-op delete
//     if (updatedPayments.length === originalLength) {
//       return NextResponse.json(
//         { error: "Payment record not found", code: "PAYMENT_NOT_FOUND" },
//         { status: 404 }
//       );
//     }

//     // 5️⃣ Persist changes
//     await prisma.task.update({
//       where: { id: taskId },
//       data: { paymentHistory: updatedPayments },
//     });

//     // 6️⃣ Success response
//     return NextResponse.json({
//       success: true,
//       deleted: originalLength - updatedPayments.length,
//     });
//   } catch (err: any) {
//     // Prisma-specific errors
//     if (err?.code === "P2025") {
//       return NextResponse.json(
//         { error: "Task not found during update", code: "PRISMA_NOT_FOUND" },
//         { status: 404 }
//       );
//     }

//     // Unknown / server error
//     console.error("❌ Delete payment error:", {
//       message: err?.message,
//       stack: err?.stack,
//     });

//     return NextResponse.json(
//       { error: "Internal server error while deleting payment", code: "INTERNAL_ERROR" },
//       { status: 500 }
//     );
//   }
// }















// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// /**
//  * DELETE /api/payments/delete
//  * Body:
//  * {
//  *   taskId: string,
//  *   paymentId: string
//  * }
//  */
// export async function DELETE(req: Request) {
//   try {
//     /* -----------------------------
//        1️⃣ Parse & validate request body
//     ------------------------------ */
//     let body: any;
//     try {
//       body = await req.json();
//     } catch (parseErr) {
//       return NextResponse.json(
//         { error: "Invalid JSON body", code: "INVALID_JSON" },
//         { status: 400 }
//       );
//     }

//     const { taskId, paymentId } = body;

//     if (!taskId || !paymentId) {
//       return NextResponse.json(
//         {
//           error: "taskId and paymentId are required",
//           code: "MISSING_FIELDS",
//         },
//         { status: 400 }
//       );
//     }

//     /* -----------------------------
//        2️⃣ Fetch task and validate paymentHistory
//     ------------------------------ */
//     const task = await prisma.task.findUnique({
//       where: { id: taskId },
//       select: { id: true, paymentHistory: true },
//     });

//     if (!task) {
//       return NextResponse.json(
//         { error: "Task not found", code: "TASK_NOT_FOUND" },
//         { status: 404 }
//       );
//     }

//     if (!Array.isArray(task.paymentHistory)) {
//       return NextResponse.json(
//         {
//           error: "Payment history is missing or corrupted",
//           code: "INVALID_PAYMENT_HISTORY",
//         },
//         { status: 500 }
//       );
//     }

//     /* -----------------------------
//        3️⃣ Delete the payment entry by paymentId
//     ------------------------------ */
//     const originalLength = task.paymentHistory.length;

//     const updatedPayments = task.paymentHistory.filter(
//       (p: any) => p.id !== paymentId
//     );

//     /* -----------------------------
//        4️⃣ Detect if nothing was deleted
//     ------------------------------ */
//     if (updatedPayments.length === originalLength) {
//       return NextResponse.json(
//         {
//           error: "Payment record not found",
//           code: "PAYMENT_NOT_FOUND",
//         },
//         { status: 404 }
//       );
//     }

//     /* -----------------------------
//        5️⃣ Persist the updated paymentHistory
//     ------------------------------ */
//     await prisma.task.update({
//       where: { id: taskId },
//       data: { paymentHistory: updatedPayments },
//     });

//     /* -----------------------------
//        6️⃣ Success response
//     ------------------------------ */
//     return NextResponse.json({
//       success: true,
//       deleted: originalLength - updatedPayments.length,
//     });

//   } catch (err: any) {
//     /* -----------------------------
//        7️⃣ Prisma-specific errors
//     ------------------------------ */
//     if (err?.code === "P2025") {
//       return NextResponse.json(
//         { error: "Task not found during update", code: "PRISMA_NOT_FOUND" },
//         { status: 404 }
//       );
//     }

//     /* -----------------------------
//        8️⃣ Unknown / server error
//     ------------------------------ */
//     console.error("❌ Delete payment error:", {
//       message: err?.message,
//       stack: err?.stack,
//     });

//     return NextResponse.json(
//       {
//         error: "Internal server error while deleting payment",
//         code: "INTERNAL_ERROR",
//       },
//       { status: 500 }
//     );
//   }
// }



































// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// /**
//  * DELETE /api/payments/delete
//  * Body:
//  * {
//  *   taskId: string,
//  *   paymentId: string,
//  *   deletedBy?: string  // optional: userId or email who deleted
//  * }
//  */
// export async function DELETE(req: Request) {
//   try {
//     /* -----------------------------
//        1️⃣ Parse & validate request body
//     ------------------------------ */
//     let body: any;
//     try {
//       body = await req.json();
//     } catch (parseErr) {
//       return NextResponse.json(
//         { error: "Invalid JSON body", code: "INVALID_JSON" },
//         { status: 400 }
//       );
//     }

//     const { taskId, paymentId, deletedBy } = body;

//     if (!taskId || !paymentId) {
//       return NextResponse.json(
//         {
//           error: "taskId and paymentId are required",
//           code: "MISSING_FIELDS",
//         },
//         { status: 400 }
//       );
//     }

//     /* -----------------------------
//        2️⃣ Fetch task and validate paymentHistory
//     ------------------------------ */
//     const task = await prisma.task.findUnique({
//       where: { id: taskId },
//       select: { id: true, paymentHistory: true },
//     });

//     if (!task) {
//       return NextResponse.json(
//         { error: "Task not found", code: "TASK_NOT_FOUND" },
//         { status: 404 }
//       );
//     }

//     if (!Array.isArray(task.paymentHistory)) {
//       return NextResponse.json(
//         {
//           error: "Payment history is missing or corrupted",
//           code: "INVALID_PAYMENT_HISTORY",
//         },
//         { status: 500 }
//       );
//     }

//     /* -----------------------------
//        3️⃣ Find payment to delete
//     ------------------------------ */
//     const paymentToDelete = task.paymentHistory.find((p: any) => p.id === paymentId);

//     if (!paymentToDelete) {
//       return NextResponse.json(
//         {
//           error: "Payment record not found",
//           code: "PAYMENT_NOT_FOUND",
//         },
//         { status: 404 }
//       );
//     }

//     /* -----------------------------
//        4️⃣ Remove from task.paymentHistory
//     ------------------------------ */
//     const updatedPayments = task.paymentHistory.filter((p: any) => p.id !== paymentId);
//     await prisma.task.update({
//       where: { id: taskId },
//       data: { paymentHistory: updatedPayments },
//     });

//     /* -----------------------------
//        5️⃣ Store deleted payment in DeletedPayment collection
//     ------------------------------ */
//     await prisma.deletedPayment.create({
//       data: {
//         originalTask: taskId,
//         paymentData: paymentToDelete,
//         deletedBy: deletedBy || null,
//       },
//     });

//     /* -----------------------------
//        6️⃣ Success response
//     ------------------------------ */
//     return NextResponse.json({
//       success: true,
//       deletedPayment: paymentToDelete,
//     });

//   } catch (err: any) {
//     /* -----------------------------
//        7️⃣ Prisma-specific errors
//     ------------------------------ */
//     if (err?.code === "P2025") {
//       return NextResponse.json(
//         { error: "Task not found during update", code: "PRISMA_NOT_FOUND" },
//         { status: 404 }
//       );
//     }

//     /* -----------------------------
//        8️⃣ Unknown / server error
//     ------------------------------ */
//     console.error("❌ Delete payment error:", {
//       message: err?.message,
//       stack: err?.stack,
//     });

//     return NextResponse.json(
//       {
//         error: "Internal server error while deleting payment",
//         code: "INTERNAL_ERROR",
//       },
//       { status: 500 }
//     );
//   }
// }









// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// /**
//  * DELETE /api/payments/delete
//  * Body:
//  * {
//  *   taskId: string,
//  *   paymentId: string,
//  *   deletedBy?: string
//  * }
//  */
// export async function DELETE(req: Request) {
//   try {
//     // 1️⃣ Parse request
//     let body: any;
//     try {
//       body = await req.json();
//     } catch {
//       return NextResponse.json(
//         { error: "Invalid JSON body", code: "INVALID_JSON" },
//         { status: 400 }
//       );
//     }

//     const { taskId, paymentId, deletedBy } = body;

//     if (!taskId || !paymentId) {
//       return NextResponse.json(
//         { error: "taskId and paymentId are required", code: "MISSING_FIELDS" },
//         { status: 400 }
//       );
//     }

//     // 2️⃣ Fetch task
//     const task = await prisma.task.findUnique({
//       where: { id: taskId },
//       select: { id: true, paymentHistory: true },
//     });

//     if (!task) {
//       return NextResponse.json(
//         { error: "Task not found", code: "TASK_NOT_FOUND" },
//         { status: 404 }
//       );
//     }

//     if (!Array.isArray(task.paymentHistory)) {
//       return NextResponse.json(
//         { error: "Payment history missing/corrupted", code: "INVALID_PAYMENT_HISTORY" },
//         { status: 500 }
//       );
//     }

//     // 3️⃣ Find payment to delete
//     const paymentToDelete = task.paymentHistory.find((p: any) => p.id === paymentId);

//     if (!paymentToDelete) {
//       return NextResponse.json(
//         { error: "Payment record not found", code: "PAYMENT_NOT_FOUND" },
//         { status: 404 }
//       );
//     }

//     // 4️⃣ Remove from task
//     const updatedPayments = task.paymentHistory.filter((p: any) => p.id !== paymentId);
//     await prisma.task.update({
//       where: { id: taskId },
//       data: { paymentHistory: updatedPayments },
//     });

//     // 5️⃣ Store deleted payment in DeletedPayment collection
//     await prisma.deletedPayment.create({
//       data: {
//         originalTask: taskId,
//         paymentData: paymentToDelete,
//         deletedBy: deletedBy || null,
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       deletedPayment: paymentToDelete,
//     });

//   } catch (err: any) {
//     if (err?.code === "P2025") {
//       return NextResponse.json(
//         { error: "Task not found during update", code: "PRISMA_NOT_FOUND" },
//         { status: 404 }
//       );
//     }

//     console.error("❌ Delete payment error:", err);
//     return NextResponse.json(
//       { error: "Internal server error", code: "INTERNAL_ERROR" },
//       { status: 500 }
//     );
//   }
// }















// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// /**
//  * DELETE /api/payments/delete
//  * Body:
//  * {
//  *   taskId: string,
//  *   paymentId: string,
//  *   deletedBy?: string
//  * }
//  */
// export async function DELETE(req: Request) {
//   try {
//     // 1️⃣ Parse request body
//     let body: any;
//     try {
//       body = await req.json();
//       console.log("DELETE request body:", body); // 🔹 Debug
//     } catch (parseErr) {
//       console.error("Invalid JSON body:", parseErr);
//       return NextResponse.json(
//         { error: "Invalid JSON body", code: "INVALID_JSON" },
//         { status: 400 }
//       );
//     }

//     const { taskId, paymentId, deletedBy } = body;

//     // 2️⃣ Validate required fields
//     if (!taskId?.trim() || !paymentId?.trim()) {
//       console.warn("Missing taskId or paymentId", { taskId, paymentId });
//       return NextResponse.json(
//         {
//           error: "taskId and paymentId are required and must be non-empty strings",
//           code: "MISSING_FIELDS",
//         },
//         { status: 400 }
//       );
//     }

//     // 3️⃣ Fetch task and validate paymentHistory
//     const task = await prisma.task.findUnique({
//       where: { id: taskId },
//       select: { id: true, paymentHistory: true },
//     });

//     if (!task) {
//       console.warn("Task not found for id:", taskId);
//       return NextResponse.json(
//         { error: "Task not found", code: "TASK_NOT_FOUND" },
//         { status: 404 }
//       );
//     }

//     if (!Array.isArray(task.paymentHistory)) {
//       console.error("Payment history corrupted for task:", taskId);
//       return NextResponse.json(
//         {
//           error: "Payment history missing or corrupted",
//           code: "INVALID_PAYMENT_HISTORY",
//         },
//         { status: 500 }
//       );
//     }

//     // 4️⃣ Find payment to delete
//     const paymentToDelete = task.paymentHistory.find((p: any) => p.id === paymentId);

//     if (!paymentToDelete) {
//       console.warn("Payment record not found", { taskId, paymentId });
//       return NextResponse.json(
//         { error: "Payment record not found", code: "PAYMENT_NOT_FOUND" },
//         { status: 404 }
//       );
//     }

//     // 5️⃣ Remove payment from task
//     const updatedPayments = task.paymentHistory.filter((p: any) => p.id !== paymentId);

//     await prisma.task.update({
//       where: { id: taskId },
//       data: { paymentHistory: updatedPayments },
//     });

//     // 6️⃣ Store deleted payment in DeletedPayment collection
//     await prisma.deletedPayment.create({
//       data: {
//         originalTask: taskId,
//         paymentData: paymentToDelete,
//         deletedBy: deletedBy || null,
//       },
//     });

//     console.log("Payment deleted successfully:", paymentToDelete);

//     return NextResponse.json({
//       success: true,
//       deletedPayment: paymentToDelete,
//     });

//   } catch (err: any) {
//     // Prisma-specific error for missing task during update
//     if (err?.code === "P2025") {
//       console.error("Task not found during update:", err);
//       return NextResponse.json(
//         { error: "Task not found during update", code: "PRISMA_NOT_FOUND" },
//         { status: 404 }
//       );
//     }

//     // Unknown server error
//     console.error("❌ Delete payment error:", err);
//     return NextResponse.json(
//       { error: "Internal server error", code: "INTERNAL_ERROR" },
//       { status: 500 }
//     );
//   }
// }












// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// /**
//  * DELETE /api/payments/delete
//  * Body:
//  * {
//  *   taskId: string,
//  *   paymentId: string,
//  *   deletedBy?: string
//  * }
//  */
// export async function DELETE(req: Request) {
//   try {
//     // 1️⃣ Parse request body
//     let body: any;
//     try {
//       body = await req.json();
//       console.log("DELETE request body:", body);
//     } catch (parseErr) {
//       console.error("Invalid JSON body:", parseErr);
//       return NextResponse.json(
//         { error: "Invalid JSON body", code: "INVALID_JSON" },
//         { status: 400 }
//       );
//     }

//     const { taskId, paymentId, deletedBy } = body;

//     if (!taskId?.trim() || !paymentId?.trim()) {
//       return NextResponse.json(
//         {
//           error: "taskId and paymentId are required",
//           code: "MISSING_FIELDS",
//         },
//         { status: 400 }
//       );
//     }

//     // 2️⃣ Extract timestamp from paymentId (format: taskId_timestamp)
//     const parts = paymentId.split("_");
//     if (parts.length !== 2) {
//       return NextResponse.json(
//         { error: "Invalid paymentId format", code: "INVALID_PAYMENT_ID" },
//         { status: 400 }
//       );
//     }
//     const timestamp = Number(parts[1]);
//     if (isNaN(timestamp)) {
//       return NextResponse.json(
//         { error: "Invalid timestamp in paymentId", code: "INVALID_PAYMENT_ID" },
//         { status: 400 }
//       );
//     }

//     // 3️⃣ Fetch task
//     const task = await prisma.task.findUnique({
//       where: { id: taskId },
//       select: { id: true, paymentHistory: true },
//     });

//     if (!task) {
//       return NextResponse.json(
//         { error: "Task not found", code: "TASK_NOT_FOUND" },
//         { status: 404 }
//       );
//     }

//     if (!Array.isArray(task.paymentHistory)) {
//       return NextResponse.json(
//         { error: "Payment history missing or corrupted", code: "INVALID_PAYMENT_HISTORY" },
//         { status: 500 }
//       );
//     }

//     // 4️⃣ Find payment to delete using updatedAt timestamp
//     const paymentToDeleteIndex = task.paymentHistory.findIndex((p: any) => {
//       return new Date(p.updatedAt).getTime() === timestamp;
//     });

//     if (paymentToDeleteIndex === -1) {
//       return NextResponse.json(
//         { error: "Payment record not found", code: "PAYMENT_NOT_FOUND" },
//         { status: 404 }
//       );
//     }

//     const paymentToDelete = task.paymentHistory[paymentToDeleteIndex];

//     // 5️⃣ Remove the payment from task
//     const updatedPayments = task.paymentHistory.filter(
//       (_: any, idx: number) => idx !== paymentToDeleteIndex
//     );

//     await prisma.task.update({
//       where: { id: taskId },
//       data: { paymentHistory: updatedPayments },
//     });

//     // 6️⃣ Optionally, store deleted payment in DeletedPayment collection
//     await prisma.deletedPayment.create({
//       data: {
//         originalTask: taskId,
//         paymentData: paymentToDelete,
//         deletedBy: deletedBy || null,
//       },
//     });

//     console.log("Payment deleted successfully:", paymentToDelete);

//     return NextResponse.json({
//       success: true,
//       deletedPayment: paymentToDelete,
//     });

//   } catch (err: any) {
//     console.error("❌ Delete payment error:", err);
//     return NextResponse.json(
//       { error: "Internal server error", code: "INTERNAL_ERROR" },
//       { status: 500 }
//     );
//   }
// }











import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/payments/delete
 * Body:
 * {
 *   taskId: string,
 *   paymentId: string
 * }
 */
export async function DELETE(req: Request) {
  try {
    // 1️⃣ Parse request body
    let body: any;
    try {
      body = await req.json();
      console.log("DELETE request body:", body);
    } catch (parseErr) {
      console.error("Invalid JSON body:", parseErr);
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_JSON" },
        { status: 400 }
      );
    }

    const { taskId, paymentId } = body;

    // 2️⃣ Validate required fields
    if (!taskId?.trim() || !paymentId?.trim()) {
      return NextResponse.json(
        {
          error: "taskId and paymentId are required",
          code: "MISSING_FIELDS",
        },
        { status: 400 }
      );
    }

    // 3️⃣ Extract timestamp from paymentId (format: taskId_timestamp)
    const parts = paymentId.split("_");
    if (parts.length !== 2) {
      return NextResponse.json(
        { error: "Invalid paymentId format", code: "INVALID_PAYMENT_ID" },
        { status: 400 }
      );
    }
    const timestamp = Number(parts[1]);
    if (isNaN(timestamp)) {
      return NextResponse.json(
        { error: "Invalid timestamp in paymentId", code: "INVALID_PAYMENT_ID" },
        { status: 400 }
      );
    }

    // 4️⃣ Fetch task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, paymentHistory: true },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found", code: "TASK_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (!Array.isArray(task.paymentHistory)) {
      return NextResponse.json(
        {
          error: "Payment history missing or corrupted",
          code: "INVALID_PAYMENT_HISTORY",
        },
        { status: 500 }
      );
    }

    // 5️⃣ Find payment to delete using updatedAt timestamp
    const paymentIndex = task.paymentHistory.findIndex(
      (p: any) => new Date(p.updatedAt).getTime() === timestamp
    );

    if (paymentIndex === -1) {
      return NextResponse.json(
        { error: "Payment record not found", code: "PAYMENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    const paymentToDelete = task.paymentHistory[paymentIndex];

    // 6️⃣ Remove payment from task
    const updatedPayments = task.paymentHistory.filter(
      (_: any, idx: number) => idx !== paymentIndex
    );

    await prisma.task.update({
      where: { id: taskId },
      data: { paymentHistory: updatedPayments },
    });

    console.log("Payment deleted successfully:", paymentToDelete);

    return NextResponse.json({
      success: true,
      deletedPayment: paymentToDelete,
    });

  } catch (err: any) {
    console.error("❌ Delete payment error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
