import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const printers = await prisma.serialNumber.findMany({
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        dispatches: {
          orderBy: {
            dispatchDate: "desc"
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    let total = printers.length;
    let inTransit = 0;
    let outForDelivery = 0;
    let delivered = 0;
    let currentlyRTO = 0;
    let returned = 0;
    let reused = 0;
    let multipleRto = 0;

    const enrichedPrinters = printers.map(p => {
      const currentDispatch = p.dispatches.length > 0 ? p.dispatches[0] : null;
      let currentTrackingStatus = currentDispatch ? currentDispatch.trackingStatus : "N/A";

      // Aggregations
      if (p.status === "Shipped" || p.status === "In Transit") {
        inTransit++;
      } else if (p.status === "Returned") {
        returned++;
      } else if (p.status === "Available" && p.rtoCount > 0) {
        returned++;
      }

      if (currentTrackingStatus === "Out for Delivery") outForDelivery++;
      if (currentTrackingStatus === "Delivered") delivered++;
      if (currentTrackingStatus === "RTO") currentlyRTO++;

      if (p.rtoCount > 1) {
        multipleRto++;
      }

      if (p.dispatchCount > 1 && p.rtoCount > 0 && p.status === "Shipped") {
        reused++;
      }

      return {
        id: p.id,
        number: p.number,
        status: p.status, // Database status (Available, Shipped, Returned)
        currentTrackingStatus, // From Courier/DispatchLog (In Transit, RTO, Delivered)
        dispatchCount: p.dispatchCount,
        rtoCount: p.rtoCount,
        deliveryCount: p.deliveryCount,
        previousRTO: p.rtoCount > 0 && p.dispatchCount > p.rtoCount, 
        taskId: p.taskId,
        taskTitle: p.task?.title,
        updatedAt: p.updatedAt,
        dispatches: p.dispatches
      };
    });

    return NextResponse.json({
      printers: enrichedPrinters,
      stats: {
        total,
        inTransit,
        outForDelivery,
        delivered,
        currentlyRTO,
        returned,
        reused,
        multipleRto
      }
    });

  } catch (err: any) {
    console.error("❌ GET /api/printers error:", err);
    return NextResponse.json(
      { error: "Failed to fetch printers", details: err.message },
      { status: 500 }
    );
  }
}
