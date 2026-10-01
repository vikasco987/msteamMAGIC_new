import { prisma } from "@/lib/prisma";
import axios from "axios";

export async function syncPendingPaymentLinks() {
  try {
    const pendingLinks = await prisma.cashfreeLink.findMany({
      where: {
        status: { in: ["pending", "PENDING", "created", "INITIALIZED", "ACTIVE"] }
      },
      take: 25,
      orderBy: { createdAt: "desc" }
    });

    if (pendingLinks.length === 0) return;

    // Check statuses in parallel to avoid long synchronous delays
    await Promise.allSettled(
      pendingLinks.map(async (link) => {
        if (!link.orderId) return;
        try {
          const backendUrl = `https://magicscale.in/api/cashfree/check-status?order_id=${link.orderId}`;
          const res = await axios.get(backendUrl, { timeout: 3000 });
          const data = res.data;

          if (data?.success && data?.status) {
            const rawStatus = String(data.status).toLowerCase();
            if (rawStatus === "paid" || rawStatus === "success" || rawStatus === "completed") {
              // Update link status
              await prisma.cashfreeLink.update({
                where: { id: link.id },
                data: { status: "paid" }
              });

              console.log(`[AutoSyncPaymentLink] Updated link ${link.orderId} to paid`);

              // If creatorId or orderId matches a task, update task's received amount as well
              if (link.creatorId) {
                const task = await prisma.task.findUnique({
                  where: { id: link.creatorId }
                });

                if (task) {
                  const existingPayment = await prisma.payment.findFirst({
                    where: {
                      taskId: task.id,
                      utr: link.orderId
                    }
                  });

                  if (!existingPayment) {
                    // Add payment record
                    await prisma.payment.create({
                      data: {
                        taskId: task.id,
                        amount: link.amount,
                        received: link.amount,
                        mode: "PAYMENT_LINK",
                        updatedBy: link.createdBy || "System/PaymentLink",
                        utr: link.orderId,
                        createdAt: new Date()
                      }
                    });

                    // Update task received total
                    const newReceived = (task.received || 0) + link.amount;
                    const newHistory = [
                      ...(Array.isArray(task.paymentHistory) ? task.paymentHistory : []),
                      {
                        amount: task.amount || link.amount,
                        received: link.amount,
                        mode: "PAYMENT_LINK",
                        updatedAt: new Date().toISOString(),
                        updatedBy: link.createdBy || "System/PaymentLink",
                        utr: link.orderId
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
        } catch (err: any) {
          // Individual check failure/timeout should not block other promises
        }
      })
    );
    // 2. Sync Razorpay Links
    const pendingRazorpayLinks = await prisma.razorpayLink.findMany({
      where: {
        status: { in: ["pending", "created"] }
      },
      take: 25,
      orderBy: { createdAt: "desc" }
    });

    if (pendingRazorpayLinks.length > 0) {
      const appId = process.env.RAZORPAY_KEY_ID?.trim() || process.env.RAZORPAY_APP_ID?.trim();
      const secretKey = process.env.RAZORPAY_KEY_SECRET?.trim() || process.env.RAZORPAY_SECRET_KEY?.trim();
      const auth = Buffer.from(`${appId}:${secretKey}`).toString("base64");

      await Promise.allSettled(
        pendingRazorpayLinks.map(async (link) => {
          if (!link.paymentSessionId || link.paymentSessionId === "PROXIED") return;

          try {
            const statusRes = await axios.get(`https://api.razorpay.com/v1/payment_links/${link.paymentSessionId}`, {
              headers: { "Authorization": `Basic ${auth}` },
              timeout: 3000
            });
            const rpStatus = statusRes.data.status;
            
            let finalStatus = link.status;
            if (rpStatus === "paid") finalStatus = "paid";
            else if (rpStatus === "cancelled" || rpStatus === "expired") finalStatus = "failed";

            if (finalStatus !== link.status) {
              await prisma.razorpayLink.update({
                where: { id: link.id },
                data: { status: finalStatus }
              });
              console.log(`[AutoSyncPaymentLink] Updated Razorpay link ${link.orderId} to ${finalStatus}`);
            }
          } catch (err) {}
        })
      );
    }
  } catch (error) {
    console.error("❌ syncPendingPaymentLinks error:", error);
  }
}
