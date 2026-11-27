import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const SHADOWFAX_API_TOKEN = process.env.SHADOWFAX_API_TOKEN || "50b54c53d49eea0930d97763c8f57fe5a3d6357d";
    if (!SHADOWFAX_API_TOKEN) {
      return NextResponse.json({ error: "Shadowfax API Token not configured" }, { status: 500 });
    }

    const body = await req.json();
    const {
      taskId,
      customerName,
      phone,
      address,
      city,
      state,
      pincode,
      paymentMode = "COD",
      orderAmount = 4500,
      codAmount = 4500,
    } = body;

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const cleanPhone = String(phone || "").replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json({ error: "Valid 10-digit phone number is required" }, { status: 400 });
    }

    // Generate unique client_order_id based on Task Code or Task ID
    const clientOrderId = `SFX_${taskId.replace(/^ext_(sec|trd)_/, "").slice(-8)}_${Date.now().toString().slice(-4)}`;

    // Prepare Shadowfax forward order payload
    const payload = {
      order_details: {
        client_order_id: clientOrderId,
        order_value: Number(orderAmount) || 4500,
        payment_mode: paymentMode.toLowerCase() === "cod" ? "cod" : "prepaid",
        cod_amount: paymentMode.toLowerCase() === "cod" ? Number(codAmount) || 0 : 0,
        product_value: Number(orderAmount) || 4500,
      },
      customer_details: {
        name: customerName || "Customer",
        contact: cleanPhone.slice(-10),
        address_line_1: address || "Office/Shop Address",
        city: city || "Darbhanga",
        state: state || "Bihar",
        pincode: String(pincode || "846009"),
      },
      pickup_details: {
        name: "Kravy Software Development",
        contact: "9289507882",
        address_line_1: "3rd floor PLOT IN MUSTATIL. NO 14, KILLA NO 12/2, 19/1, 20/ FIRST FLOOR VILL. SAMALKA",
        city: "NEW DELHI",
        state: "DELHI",
        pincode: "110037",
      },
      return_details: {
        return_type: "origin",
        name: "Kravy Software Development",
        contact: "9289507882",
        address_line_1: "3rd floor PLOT IN MUSTATIL. NO 14, KILLA NO 12/2, 19/1, 20/ FIRST FLOOR VILL. SAMALKA",
        city: "NEW DELHI",
        state: "DELHI",
        pincode: "110037",
      },
      product_details: [
        {
          sku_name: "Printer + Software Package",
          price: Number(orderAmount) || 4500,
          quantity: 1,
          additional_details: JSON.stringify({ quantity: 1 }),
        },
      ],
    };

    console.log("Creating Shadowfax Order with payload:", JSON.stringify(payload));

    const sfxRes = await fetch("https://dale.shadowfax.in/api/v3/clients/orders/", {
      method: "POST",
      headers: {
        "Authorization": `Token ${SHADOWFAX_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const sfxData = await sfxRes.json();
    console.log("Shadowfax Order creation response:", JSON.stringify(sfxData));

    let awbNumber = sfxData.awb_number || sfxData.data?.awb_number || sfxData.order_details?.awb_number;

    if (!awbNumber && sfxData.message && sfxData.message !== "Success") {
      const errMsg = sfxData.errors || sfxData.message || "Failed to create Shadowfax order";
      return NextResponse.json({ error: typeof errMsg === "object" ? JSON.stringify(errMsg) : String(errMsg) }, { status: 400 });
    }

    // If Shadowfax returned success or AWB, save into task
    if (awbNumber) {
      // 1. If it's a primary task
      if (!taskId.startsWith("ext_sec_") && !taskId.startsWith("ext_trd_")) {
        const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
        if (existingTask) {
          const cf = (existingTask.customFields as any) || {};

          // 🔄 If task already had an active AWB, push it to previousDispatches (for reorders/reshipments)
          if (cf.awbNumber && cf.awbNumber !== awbNumber) {
            const prevList = Array.isArray(cf.previousDispatches) ? [...cf.previousDispatches] : [];
            prevList.push({
              awbNumber: cf.awbNumber,
              courierName: cf.courierName || "Shadowfax",
              dispatchStatus: cf.dispatchStatus || "Replaced",
              date: new Date().toISOString(),
            });
            cf.previousDispatches = prevList;
          }

          cf.awbNumber = awbNumber;
          cf.courierName = "Shadowfax";
          cf.dispatchStatus = "In Manifest";

          await prisma.task.update({
            where: { id: taskId },
            data: { customFields: cf },
          });

          // Also create or update DispatchLog
          let printerItem = await prisma.inventoryItem.findUnique({ where: { name: "Printer" } });
          if (!printerItem) {
            printerItem = await prisma.inventoryItem.create({
              data: { name: "Printer", type: "HARDWARE", quantity: 0 },
            });
          }

          const existingLog = await prisma.dispatchLog.findUnique({ where: { taskId } });
          if (existingLog) {
            await prisma.dispatchLog.update({
              where: { id: existingLog.id },
              data: {
                awbNumber,
                courierName: "Shadowfax",
                trackingStatus: "Pending",
                dispatchDate: new Date(),
              },
            });
          } else {
            await prisma.dispatchLog.create({
              data: {
                awbNumber,
                courierName: "Shadowfax",
                inventoryItemId: printerItem.id,
                taskId,
                trackingStatus: "Pending",
                dispatchDate: new Date(),
              },
            });
          }
        }
      } else {
        // External task: secondary / third CRM
        const isSecondary = taskId.startsWith("ext_sec_");
        const rawId = taskId.replace(/^ext_(sec|trd)_/, "");
        const { ObjectId } = await import("mongodb");
        const { getSecondaryClient, getThirdClient } = await import("@/lib/multiDbTasks");
        const client = isSecondary ? await getSecondaryClient() : await getThirdClient();

        if (client) {
          const db = client.db();
          await db.collection("Task").updateOne(
            { _id: new ObjectId(rawId) },
            {
              $set: {
                "customFields.awbNumber": awbNumber,
                "customFields.courierName": "Shadowfax",
                "customFields.dispatchStatus": "In Manifest",
                updatedAt: new Date(),
              },
            }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      awbNumber: awbNumber || "In Process",
      courier: "Shadowfax",
      details: sfxData,
    });
  } catch (error: any) {
    console.error("Shadowfax Create Order Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
