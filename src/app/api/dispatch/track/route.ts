import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    let awb = searchParams.get("awb");

    if (!awb) {
      return NextResponse.json({ error: "AWB number or Task ID is required" }, { status: 400 });
    }
    
    awb = awb.trim();

    // Check if it's a 24-char Task ID (ObjectId)
    if (/^[0-9a-fA-F]{24}$/.test(awb)) {
      const dispatchLog = await prisma.dispatchLog.findUnique({
        where: { taskId: awb }
      });
      if (dispatchLog) {
        awb = dispatchLog.awbNumber;
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

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("GET /api/dispatch/track error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
