import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const awb = searchParams.get("awb");

    if (!awb) {
      return NextResponse.json({ error: "AWB number is required" }, { status: 400 });
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
