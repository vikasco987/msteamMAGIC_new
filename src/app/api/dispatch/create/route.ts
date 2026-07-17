import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const DELHIVERY_API_TOKEN = process.env.DELHIVERY_API_TOKEN;
    if (!DELHIVERY_API_TOKEN) {
      return NextResponse.json({ error: "Delhivery API Token not configured" }, { status: 500 });
    }

    const { taskId } = await req.json();
    if (!taskId) return NextResponse.json({ error: "taskId is required" }, { status: 400 });

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const cf = (task.customFields as any) || {};

    // Prevent duplicate AWB creation
    if (cf.awbNumber) {
      return NextResponse.json({ error: "Task already has an AWB: " + cf.awbNumber }, { status: 400 });
    }

    const customerName = task.customerName || cf.customerName || task.shopName || cf.shopName || "Customer";
    const phone = task.phone || cf.phone || "9999999999";
    const address = cf.fullAddress || task.location || "N/A";
    const pincode = cf.pincode || "000000";
    const city = cf.city || "Unknown";
    const state = cf.state || "Unknown";
    const packageAmount = task.packageAmount || cf.packageAmount || task.amount || 0;

    const payload = {
      format: "json",
      data: {
        shipments: [
          {
            name: customerName,
            add: address,
            pin: pincode,
            city: city,
            state: state,
            country: "India",
            phone: phone,
            order: task.id,
            payment_mode: "Pre-paid",
            products_desc: task.title || "Hardware / Printer",
            cod_amount: "0",
            order_date: new Date().toISOString().split("T")[0],
            total_amount: packageAmount.toString(),
            quantity: "1",
            waybill: ""
          }
        ],
        pickup_location: {
          name: "Office" // User confirmed pickup location name
        }
      }
    };

    console.log("Delhivery Payload:", JSON.stringify(payload, null, 2));

    const formData = new URLSearchParams();
    formData.append("format", "json");
    formData.append("data", JSON.stringify(payload.data));

    const response = await fetch("https://track.delhivery.com/api/cmu/create.json", {
      method: "POST",
      headers: {
        "Authorization": `Token ${DELHIVERY_API_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded" // Delhivery uses form-urlencoded for this API
      },
      body: formData.toString()
    });

    const data = await response.json();
    console.log("Delhivery Response:", JSON.stringify(data, null, 2));

    if (!data.success && !data.packages?.[0]?.waybill) {
      return NextResponse.json({ error: data.rmk || "Failed to create shipment in Delhivery", details: data }, { status: 400 });
    }

    const awbNumber = data.packages?.[0]?.waybill || (data.upload_wbn ? data.packages[0].waybill : null);
    if (!awbNumber) {
      return NextResponse.json({ error: "Delhivery didn't return an AWB", details: data }, { status: 400 });
    }

    // Success! Save to Task
    const updatedCf = { ...cf, awbNumber };
    await prisma.task.update({
      where: { id: task.id },
      data: { customFields: updatedCf }
    });

    // Ensure Printer inventory item exists
    let printerItem = await prisma.inventoryItem.findUnique({ where: { name: "Printer" } });
    if (!printerItem) {
      printerItem = await prisma.inventoryItem.create({
        data: { name: "Printer", type: "HARDWARE", quantity: 0 }
      });
    }

    // Create DispatchLog
    await prisma.dispatchLog.create({
      data: {
        awbNumber: awbNumber,
        inventoryItemId: printerItem.id,
        taskId: task.id,
        trackingStatus: "Pending",
        dispatchDate: new Date()
      }
    });

    return NextResponse.json({ message: "Order created successfully", awbNumber, data });

  } catch (error: any) {
    console.error("POST /api/dispatch/create error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
