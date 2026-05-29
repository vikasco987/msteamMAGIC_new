import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, context: { params: { pincode: string } }) {
  try {
    const { pincode } = await context.params;

    if (!pincode || pincode.length !== 6) {
      return NextResponse.json({ error: "Invalid pincode" }, { status: 400 });
    }

    // Try primary postalpincode API (over HTTP to bypass SSL issues on their end)
    const response = await fetch(`http://www.postalpincode.in/api/pincode/${pincode}`, {
      cache: "force-cache"
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Pincode API error:", error);
    return NextResponse.json({ error: "Failed to fetch pincode data" }, { status: 500 });
  }
}
