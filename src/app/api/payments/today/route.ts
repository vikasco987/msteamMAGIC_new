import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getISTDateRange(fromDateStr?: string | null, toDateStr?: string | null, dateStr?: string | null) {
  let startStr = fromDateStr || dateStr;
  let endStr = toDateStr || dateStr || fromDateStr;

  if (!startStr) {
    // Current date in IST YYYY-MM-DD
    const nowInIST = new Date(new Date().getTime() + 330 * 60 * 1000);
    startStr = nowInIST.toISOString().split("T")[0];
    endStr = startStr;
  }
  if (!endStr) {
    endStr = startStr;
  }

  const [sy, sm, sd] = startStr.split("T")[0].split("-").map(Number);
  const [ey, em, ed] = endStr.split("T")[0].split("-").map(Number);

  // 00:00:00 IST = UTC minus 330 minutes
  const startOfDay = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0, 0) - 330 * 60 * 1000);
  // 23:59:59.999 IST = UTC minus 330 minutes
  const endOfDay = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999) - 330 * 60 * 1000);

  return { startOfDay, endOfDay };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const fromParam = searchParams.get("fromDate");
    const toParam = searchParams.get("toDate");

    const { startOfDay, endOfDay } = getISTDateRange(fromParam, toParam, dateParam);

    // 🚀 NEW STEP 1: Fetch all payments with received > 0 for this date from the Payment collection
    const payments = await prisma.payment.findMany({
      where: {
        received: { gt: 0 },
        updatedAt: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            assignerName: true,
            assignerId: true,
            customerName: true,
            shopName: true,
            phone: true,
            location: true,
            customFields: true
          }
        }
      }
    });

    // 🚀 STEP 2: Fetch all Users to get Full Names
    const users = await prisma.user.findMany({
      select: { clerkId: true, name: true }
    });
    const userMap: Record<string, string> = {};
    users.forEach(u => {
      if (u.clerkId && u.name) userMap[u.clerkId] = u.name;
    });

    const paymentsToday: any[] = [];
    const summaryByAssigner: Record<string, number> = {};
    let totalUpdatedAmount = 0;

    for (const p of payments) {
      const task = p.task;
      if (!task) continue;
      const cf = (task.customFields as any) || {};
      
      // Get Full Name from Map, fallback to task.assignerName
      const assigner = (task.assignerId ? userMap[task.assignerId] : null) || task.assignerName || "Unknown";
      
      const fullAddr = [cf.fullAddress, cf.city, cf.state, cf.country, cf.pincode].filter(Boolean).join(", ") || task.location;

      const entry = {
        paymentId: p.id, // 👈 Now using REAL MongoDB ID
        taskId: task.id,
        taskTitle: task.title,
        assignerName: assigner,
        received: p.received,
        amountUpdated: p.received,
        updatedAt: p.updatedAt,
        updatedBy: p.updatedBy || "Unknown",
        fileUrl: p.fileUrl,
        invoiceUrl: p.invoiceUrl,
        invoiceNo: p.invoiceNo,
        utr: p.utr,
        phone: cf.phone || task.phone,
        shopName: cf.shopName || task.shopName,
        customerName: task.customerName,
        address: fullAddr || null,
        gstin: cf.gstin || null,
      };

      paymentsToday.push(entry);
      summaryByAssigner[assigner] = (summaryByAssigner[assigner] || 0) + p.received;
      totalUpdatedAmount += p.received;
    }

    return NextResponse.json({
      date: startOfDay.toISOString().slice(0, 10),
      paymentsToday: paymentsToday.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
      summaryByAssigner,
      totalUpdatedAmount,
    });
  } catch (err: any) {
    console.error("❌ Error fetching payments:", err);
    return NextResponse.json(
      { error: "Failed to fetch payments", details: err.message },
      { status: 500 }
    );
  }
}
