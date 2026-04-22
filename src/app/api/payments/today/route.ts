import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const fromParam = searchParams.get("fromDate");
    const toParam = searchParams.get("toDate");

    let startOfDay: Date;
    let endOfDay: Date;

    if (fromParam && toParam) {
      startOfDay = new Date(fromParam);
      startOfDay.setUTCHours(0, 0, 0, 0);
      endOfDay = new Date(toParam);
      endOfDay.setUTCHours(23, 59, 59, 999);
    } else {
      const baseDate = dateParam ? new Date(dateParam) : new Date();
      startOfDay = new Date(baseDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      endOfDay = new Date(baseDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
    }

    // 🚀 NEW STEP 1: Fetch all payments for this date from the Payment collection
    const payments = await prisma.payment.findMany({
      where: {
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
