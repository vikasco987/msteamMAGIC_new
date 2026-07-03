import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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
        awb = task.dispatchLog.awbNumber;
      } else {
        return NextResponse.json({ error: "No shipment found for this Task ID" }, { status: 404 });
      }
    }

    const DELHIVERY_API_TOKEN = process.env.DELHIVERY_API_TOKEN;
    if (!DELHIVERY_API_TOKEN) {
      return NextResponse.json({ error: "Delhivery API Token not configured" }, { status: 500 });
    }

    const response = await fetch(
      `https://track.delhivery.com/api/v1/packages/json/?token=${DELHIVERY_API_TOKEN}&waybill=${awb}`,
      { method: "GET" }
    );

    const data = await response.json();

    if (isTaskId) {
      return NextResponse.json({
        isTaskId: true,
        activeAwb,
        previousDispatches,
        customerPhone,
        activeTracking: data
      }, { status: 200 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("GET /api/dispatch/track error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
