import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📥 Received Cashfree Payment Webhook:", JSON.stringify(body));

    const orderId = body.orderId || body.order_id || body.data?.order?.order_id || body.data?.payment?.order_id;
    const paymentStatus = body.status || body.payment_status || body.data?.payment?.payment_status || body.type;

    if (!orderId) {
      return NextResponse.json({ success: false, message: "No orderId found in payload" }, { status: 400 });
    }

    const isPaid =
      String(paymentStatus).toUpperCase().includes("SUCCESS") ||
      String(paymentStatus).toUpperCase().includes("PAID") ||
      String(paymentStatus).toUpperCase().includes("COMPLETED");

    if (isPaid) {
      const link = await prisma.cashfreeLink.findFirst({
        where: { orderId }
      });

      if (link) {
        await prisma.cashfreeLink.update({
          where: { id: link.id },
          data: { status: "paid" }
        });

        if (link.creatorId) {
          const task = await prisma.task.findUnique({ where: { id: link.creatorId } });
          if (task) {
            const existing = await prisma.payment.findFirst({
              where: { taskId: task.id, amount: link.amount }
            });

            if (!existing) {
              await prisma.payment.create({
                data: {
                  taskId: task.id,
                  amount: link.amount,
                  received: link.amount,
                  mode: "PAYMENT_LINK",
                  updatedBy: link.createdBy || "System/Webhook",
                  utr: orderId,
                  createdAt: new Date()
                }
              });

              const newReceived = (task.received || 0) + link.amount;
              const newHistory = [
                ...(Array.isArray(task.paymentHistory) ? task.paymentHistory : []),
                {
                  amount: task.amount || link.amount,
                  received: link.amount,
                  mode: "PAYMENT_LINK",
                  updatedAt: new Date().toISOString(),
                  updatedBy: link.createdBy || "System/Webhook",
                  utr: orderId
                }
              ];

              await prisma.task.update({
                where: { id: task.id },
                data: {
                  received: newReceived,
                  paymentHistory: newHistory as any,
                  updatedAt: new Date()
                }
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  } catch (error: any) {
    console.error("❌ Cashfree Webhook Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Cashfree Webhook Endpoint Active" });
}
