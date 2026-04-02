import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import cloudinary from "cloudinary";
import { Readable } from "stream";
import { logActivity } from "@/lib/activity";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

interface PaymentHistoryEntry {
  amount: number;
  received: number;
  fileUrl: string | null;
  updatedAt: Date;
  updatedBy: string;
  assignerName?: string;
}

async function getEffectiveTaskId(taskId: string): Promise<string> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { parentTaskId: true },
  });
  return task?.parentTaskId || taskId;
}

// 🚀 RECIPIENT DISCOVERY (Hybrid)
async function getAdminRecipients(): Promise<string[]> {
  const ids = new Set<string>();
  try {
    const db = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MASTER", "admin", "master"] } },
      select: { clerkId: true }
    });
    db.forEach(u => ids.add(u.clerkId));

    const client = await clerkClient();
    const clerk = await client.users.getUserList({ limit: 100 });
    clerk.data.forEach((u: any) => {
      const r = ((u.publicMetadata?.role as string) || (u.privateMetadata?.role as string) || "").toLowerCase();
      if (r === "admin" || r === "master") ids.add(u.id);
    });
  } catch (e) {
    console.error("Discovery Error:", e);
  }
  return Array.from(ids);
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await context.params;
  const user = await currentUser();
  const userName = user?.firstName || user?.emailAddresses[0]?.emailAddress || "Unknown";
  const originalTaskId = await getEffectiveTaskId(taskId);

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const newAmount = formData.get("amount") ? Number(formData.get("amount")) : undefined;
    const newReceived = formData.get("received") ? Number(formData.get("received")) : undefined;

    const existingTask = await prisma.task.findUnique({
      where: { id: originalTaskId },
      select: { title: true, amount: true, received: true, paymentProofs: true, paymentHistory: true, customFields: true },
    });
    if (!existingTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    let uploadedFileUrl: string | undefined;
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const uploadRes = await new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream({ folder: "payment_proofs" }, (err, res) => {
          if (err) reject(err); else resolve(res!);
        });
        Readable.from(buffer).pipe(stream);
      });
      uploadedFileUrl = uploadRes.secure_url;
    }

    const updatedAmount = (existingTask.amount === null || existingTask.amount === 0) ? (newAmount ?? existingTask.amount) : existingTask.amount;
    const updatedReceived = (existingTask.received ?? 0) + (newReceived ?? 0);

    // 💰 Backend Validation: total received cannot exceed total amount
    if (updatedAmount !== null && updatedReceived > updatedAmount) {
      return NextResponse.json({ 
        error: `Total received (₹${updatedReceived}) cannot exceed total amount (₹${updatedAmount})` 
      }, { status: 400 });
    }

    const updateData: any = {
      amount: updatedAmount,
      received: updatedReceived,
      updatedAt: new Date(),
    };

    if (uploadedFileUrl) {
      updateData.paymentProofs = [...(existingTask.paymentProofs || []), uploadedFileUrl];
    }

    const paymentEntry = {
      amount: updatedAmount ?? 0,
      received: updatedReceived,
      fileUrl: uploadedFileUrl || null,
      updatedAt: new Date(),
      updatedBy: userName,
    };
    updateData.paymentHistory = [...(existingTask.paymentHistory as any[] || []), paymentEntry];

    const updatedTask = await prisma.task.update({
      where: { id: originalTaskId },
      data: updateData,
    });

    await logActivity({
      taskId: originalTaskId,
      type: "PAYMENT_ADDED",
      content: `₹${newReceived || 0} added. Total: ₹${updatedReceived}`,
      author: userName,
      authorId: userId
    });

    // 🚀 NOTIFICATIONS
    const recipients = await getAdminRecipients();
    const shop = (updatedTask.customFields as any)?.shopName || "N/A";

    for (const rid of recipients) {
      try {
        const n = await prisma.notification.create({
          data: {
            userId: rid,
            type: "PAYMENT_ADDED",
            title: "📂 Payment Update",
            content: `New payment of ₹${newReceived || 0} for [${shop}] - ${updatedTask.title}. By: ${userName}`,
            taskId: originalTaskId,
          } as any
        });
        console.log(`DEBUG: Notification ${n.id} sent to ${rid}`);
      } catch (e) {
        console.error("Notif Error:", e);
      }
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: taskId } = await context.params;
  const originalTaskId = await getEffectiveTaskId(taskId);
  const user = await currentUser();
  const userName = user?.firstName || "Admin";

  try {
    const { amount, received } = await req.json();
    const existing = await prisma.task.findUnique({ where: { id: originalTaskId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updatedTask = await prisma.task.update({
      where: { id: originalTaskId },
      data: {
        amount: amount ?? existing.amount,
        received: received ?? existing.received,
        updatedAt: new Date(),
      }
    });

    const recipients = await getAdminRecipients();
    for (const rid of recipients) {
      await prisma.notification.create({
        data: {
          userId: rid,
          type: "PAYMENT_ADDED",
          title: "📂 Payment Update",
          content: `Payment overridden to ₹${received} for ${updatedTask.title}. By: ${userName}`,
          taskId: originalTaskId
        } as any
      });
    }
    return NextResponse.json({ success: true, task: updatedTask });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await context.params;
  const originalTaskId = await getEffectiveTaskId(taskId);
  const user = await currentUser();
  const role = (user?.publicMetadata?.role as string || "").toLowerCase();

  if (role !== "master") {
    return NextResponse.json({ error: "Only masters can delete proofs" }, { status: 403 });
  }

  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    const existingTask = await prisma.task.findUnique({
      where: { id: originalTaskId },
      select: { paymentProofs: true, title: true, customFields: true },
    });

    if (!existingTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const updatedProofs = (existingTask.paymentProofs || []).filter(p => p !== url);

    const updatedTask = await prisma.task.update({
      where: { id: originalTaskId },
      data: { paymentProofs: updatedProofs },
    });

    const userName = user?.firstName || "Admin";
    await logActivity({
      taskId: originalTaskId,
      type: "PAYMENT_DELETED",
      content: `A payment proof was deleted.`,
      author: userName,
      authorId: userId
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
