import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // Removed auth check to allow public access to tracking link

    const { searchParams } = new URL(req.url);
    let awb = searchParams.get("awb");

    if (!awb) {
      return NextResponse.json({ error: "AWB number or Task ID is required" }, { status: 400 });
    }
    
    awb = awb.trim();

    let isTaskId = false;
    let previousDispatches: any[] = [];
    let activeAwb: string | null = null;
    let customerPhone: string | null = null;
    let customerEmail: string | null = null;
    let productTitle: string | null = null;
    let shopName: string | null = null;
    let outletName: string | null = null;

    // Check if it's a 24-char Task ID (ObjectId)
    if (/^[0-9a-fA-F]{24}$/.test(awb)) {
      const task = await prisma.task.findUnique({
        where: { id: awb },
        include: { dispatchLog: true }
      });

      if (task && task.dispatchLog) {
        isTaskId = true;
        activeAwb = task.dispatchLog.awbNumber;
        previousDispatches = (task.customFields as any)?.previousDispatches || [];
        customerPhone = task.phone || (task.customFields as any)?.phone || null;
        customerEmail = task.email || (task.customFields as any)?.email || null;
        productTitle = task.title || null;
        shopName = task.shopName || (task.customFields as any)?.shopName || null;
        outletName = task.outletName || (task.customFields as any)?.outletName || null;
        awb = task.dispatchLog.awbNumber;
      } else {
        return NextResponse.json({ error: "No shipment found for this Task ID" }, { status: 404 });
      }
    } else {
      // It's a direct AWB. Check if we have a matching DispatchLog with a task in the database
      const dispatchLog = await prisma.dispatchLog.findUnique({
        where: { awbNumber: awb },
        include: { task: true }
      });

      if (dispatchLog && dispatchLog.task) {
        isTaskId = true; // Set this to true so the frontend loads the task details
        activeAwb = dispatchLog.awbNumber;
        previousDispatches = (dispatchLog.task.customFields as any)?.previousDispatches || [];
        customerPhone = dispatchLog.task.phone || (dispatchLog.task.customFields as any)?.phone || null;
        customerEmail = dispatchLog.task.email || (dispatchLog.task.customFields as any)?.email || null;
        productTitle = dispatchLog.task.title || null;
        shopName = dispatchLog.task.shopName || (dispatchLog.task.customFields as any)?.shopName || null;
        outletName = dispatchLog.task.outletName || (dispatchLog.task.customFields as any)?.outletName || null;
      }
    }

    const DELHIVERY_API_TOKEN = process.env.DELHIVERY_API_TOKEN;
    const SHADOWFAX_API_TOKEN = process.env.SHADOWFAX_API_TOKEN || "50b54c53d49eea0930d97763c8f57fe5a3d6357d";

    let trackingResult: any = null;
    let courierUsed = "Delhivery";

    // 1. Try Shadowfax first if token exists
    if (SHADOWFAX_API_TOKEN) {
      try {
        const sfxRes = await fetch(
          `https://dale.shadowfax.in/api/v4/clients/orders/${awb}/track/`,
          {
            method: "GET",
            headers: {
              "Authorization": `Token ${SHADOWFAX_API_TOKEN}`,
              "Content-Type": "application/json"
            }
          }
        );
        if (sfxRes.ok) {
          const sfxData = await sfxRes.json();
          if (sfxData && (sfxData.tracking_details || sfxData.order_details)) {
            courierUsed = "Shadowfax";
            // Normalize Shadowfax response to match standard tracking UI
            const order = sfxData.order_details || {};
            const history = sfxData.tracking_details || [];
            const latestStatus = order.status_display || order.status || (history[0]?.status) || "In Transit";

            const pickup = order.pickup_details || {};
            const delivery = order.delivery_details || {};

            const originStr = [pickup.city, pickup.state, pickup.pincode].filter(Boolean).join(", ") || pickup.city || "Delhi";
            const destStr = [delivery.city, delivery.state, delivery.pincode].filter(Boolean).join(", ") || delivery.city || "Mumbai";

            trackingResult = {
              Courier: "Shadowfax",
              ShipmentData: [
                {
                  Shipment: {
                    AWB: order.awb_number || awb,
                    Courier: "Shadowfax",
                    Status: {
                      Status: latestStatus,
                      Instructions: history[history.length - 1]?.remarks || order.status_display || ""
                    },
                    Consignee: {
                      Name: delivery.name || "",
                      City: delivery.city || "",
                      State: delivery.state || "",
                      PinCode: delivery.pincode || "",
                      Address: [delivery.address_line_1, delivery.address_line_2].filter(Boolean).join(", ") || ""
                    },
                    Origin: originStr,
                    Destination: destStr,
                    OrderType: (order.payment_mode || "COD").toUpperCase(),
                    CODAmount: order.cod_amount || order.product_value || 0,
                    ProductValue: order.product_value || 0,
                    ClientOrderId: order.client_order_id || null,
                    ExpectedDeliveryDate: order.promised_delivery_date || null,
                    PickUpDate: history.length > 0 ? history[0]?.created : null,
                    Scans: history.map((scan: any) => ({
                      ScanDetail: {
                        Scan: scan.status || scan.status_id || "Status Update",
                        ScanDateTime: scan.created,
                        Instructions: scan.remarks || "",
                        ScannedLocation: scan.location || "Transit Hub"
                      }
                    }))
                  }
                }
              ]
            };
          }
        }
      } catch (sfxErr) {
        console.error("Shadowfax track attempt error:", sfxErr);
      }
    }

    // 2. Fallback to Delhivery if Shadowfax didn't find the shipment
    if (!trackingResult && DELHIVERY_API_TOKEN) {
      try {
        const response = await fetch(
          `https://track.delhivery.com/api/v1/packages/json/?token=${DELHIVERY_API_TOKEN}&waybill=${awb}`,
          { method: "GET" }
        );
        const data = await response.json();
        if (data && data.ShipmentData && data.ShipmentData.length > 0) {
          trackingResult = data;
          courierUsed = "Delhivery";
        } else if (!trackingResult) {
          trackingResult = data;
        }
      } catch (delErr) {
        console.error("Delhivery track attempt error:", delErr);
      }
    }

    const data = trackingResult || { Error: "No tracking details found for this AWB number" };

    if (isTaskId) {
      return NextResponse.json({
        isTaskId: true,
        activeAwb,
        courier: courierUsed,
        previousDispatches,
        customerPhone,
        customerEmail,
        productTitle,
        shopName,
        outletName,
        activeTracking: data
      }, { status: 200 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("GET /api/dispatch/track error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
