import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: MASTER only
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const metadataRole = (clerkUser.publicMetadata as any)?.role || (clerkUser.privateMetadata as any)?.role;
    const role = String(metadataRole || dbUser?.role || "").toUpperCase();

    if (role !== "MASTER") {
      return NextResponse.json({ error: "Master access required to edit payment entries" }, { status: 403 });
    }

    const body = await req.json();
    const { taskId, paymentId, received, utr, mode, updatedAt } = body;

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, paymentHistory: true, received: true, amount: true, title: true }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const newReceived = received !== undefined ? Number(received) : undefined;
    const cleanUtr = utr !== undefined ? (utr ? String(utr).trim() : null) : undefined;
    const cleanMode = mode !== undefined ? (mode ? String(mode).trim() : null) : undefined;

    // 1️⃣ Update Payment table if record exists
    let existingPayment = null;
    if (paymentId) {
      existingPayment = await prisma.payment.findUnique({ where: { id: paymentId } });
    }

    if (existingPayment) {
      const updateData: any = {};
      if (newReceived !== undefined) updateData.received = newReceived;
      if (cleanUtr !== undefined) updateData.utr = cleanUtr;
      if (cleanMode !== undefined) updateData.mode = cleanMode;
      if (updatedAt) updateData.updatedAt = new Date(updatedAt);

      await prisma.payment.update({
        where: { id: paymentId },
        data: updateData
      });
    }

    // 2️⃣ Update Task's paymentHistory array
    let updatedHistory = Array.isArray(task.paymentHistory) ? [...task.paymentHistory] : [];
    let updated = false;

    updatedHistory = updatedHistory.map((p: any) => {
      const isMatch =
        (paymentId && p.id === paymentId) ||
        (paymentId && p.paymentId === paymentId) ||
        (existingPayment && p.updatedAt && new Date(p.updatedAt).getTime() === new Date(existingPayment.updatedAt).getTime()) ||
        (updatedAt && p.updatedAt && new Date(p.updatedAt).getTime() === new Date(updatedAt).getTime());

      if (isMatch && !updated) {
        updated = true;
        return {
          ...p,
          ...(newReceived !== undefined ? { received: newReceived } : {}),
          ...(cleanUtr !== undefined ? { utr: cleanUtr } : {}),
          ...(cleanMode !== undefined ? { mode: cleanMode } : {}),
          ...(updatedAt ? { updatedAt: new Date(updatedAt).toISOString() } : {}),
        };
      }
      return p;
    });

    // Recalculate total received on task
    const totalReceivedOnTask = updatedHistory.reduce((sum: number, p: any) => {
      const r = typeof p.received === "number" ? p.received : parseFloat(String(p.received || 0));
      return sum + (isNaN(r) ? 0 : r);
    }, 0);

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        paymentHistory: updatedHistory,
        received: totalReceivedOnTask,
        updatedAt: new Date(),
      }
    });

    const userName = clerkUser.firstName || dbUser?.name || "Master";
    await logActivity({
      taskId,
      type: "PAYMENT_ADDED",
      content: `Payment entry edited by Master user ${userName}. New total received: ₹${totalReceivedOnTask}`,
      author: userName,
      authorId: userId
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (err: any) {
    console.error("❌ Payment update failed:", err);
    return NextResponse.json(
      { error: "Failed to update payment", details: err.message },
      { status: 500 }
    );
  }
}
