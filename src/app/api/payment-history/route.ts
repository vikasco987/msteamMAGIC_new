// // /app/api/payment-history/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import {prisma }from "@/lib/prisma";

// export async function GET(req: NextRequest) {
//   const { searchParams } = new URL(req.url);
//   const taskId = searchParams.get("taskId");

//   if (!taskId) {
//     return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
//   }

//   try {
//     const payments = await prisma.payment.findMany({
//       where: { taskId },
//       orderBy: { createdAt: "desc" },
//     });

//     return NextResponse.json({ payments });
//   } catch (error) {
//     console.error("[GET_PAYMENT_HISTORY_ERROR]", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }














// // /app/api/payment-history/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export async function GET(req: NextRequest) {
//   const { searchParams } = new URL(req.url);
//   const taskId = searchParams.get("taskId");

//   if (!taskId) {
//     return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
//   }

//   try {
//     // ✅ Always get payments for this exact task only (no linking to parent)
//     const payments = await prisma.payment.findMany({
//       where: { taskId },
//       orderBy: { createdAt: "desc" },
//     });

//     return NextResponse.json({ payments });
//   } catch (error) {
//     console.error("[GET_PAYMENT_HISTORY_ERROR]", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }












// /app/api/payment-history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");

  if (!taskId) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  try {
    // First, get the task to check if it has a parent
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { parentTaskId: true },
    });

    // Use parentTaskId if present, else use current taskId
    const finalTaskId = task?.parentTaskId || taskId;

    const payments = await prisma.payment.findMany({
      where: { taskId: finalTaskId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("[GET_PAYMENT_HISTORY_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
