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

    // Parse request body for specific awbNumber (optional)
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      // Ignore if no body
    }
    const { awbNumber } = body as { awbNumber?: string };

    // Find pending dispatches (or specific awb)
    const pendingDispatches = await prisma.dispatchLog.findMany({
      where: {
        ...(awbNumber ? { awbNumber } : {
          trackingStatus: {
            notIn: ["Delivered", "RTO"]
          }
        })
      }
    });

    if (pendingDispatches.length === 0) {
      return NextResponse.json({ message: "No pending shipments to sync", updatedCount: 0 });
    }

    let updatedCount = 0;

    for (const dispatch of pendingDispatches) {
      if (!dispatch.awbNumber) continue;

      try {
        const response = await fetch(
          `https://track.delhivery.com/api/v1/packages/json/?token=${DELHIVERY_API_TOKEN}&waybill=${dispatch.awbNumber}`,
          { method: "GET" }
        );

        const data = await response.json();

        if (data && data.ShipmentData && data.ShipmentData.length > 0) {
          const shipmentData = data.ShipmentData[0].Shipment;
          const status = shipmentData?.Status?.Status;
          const instruction = shipmentData?.Status?.Instructions;
          const scans = shipmentData?.Scans || [];
          const outForDeliveryScans = scans.filter((s: any) => s.Scan?.Scan?.toLowerCase().includes("out for delivery"));
          const attemptsMade = outForDeliveryScans.length;

          if ((status && status !== dispatch.trackingStatus) || attemptsMade !== (dispatch as any).attemptsMade) {
            await prisma.dispatchLog.update({
              where: { id: dispatch.id },
              data: {
                trackingStatus: status || dispatch.trackingStatus,
                attemptsMade: attemptsMade,
                ...(status && status !== dispatch.trackingStatus ? {
                  history: {
                    push: {
                      status: status,
                      changedBy: "Delhivery System Sync",
                      changedAt: new Date().toISOString(),
                      remarks: instruction
                    }
                  }
                } : {})
              }
            });
            updatedCount++;
          }
        }
      } catch (err) {
        console.error(`Error syncing AWB ${dispatch.awbNumber}:`, err);
      }
    }

    return NextResponse.json({ message: "Sync successful", updatedCount });
  } catch (error) {
    console.error("POST /api/dispatch/sync error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
