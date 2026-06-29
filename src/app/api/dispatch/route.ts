import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    // Build query
    const query: any = {};
    if (status && status !== "All") {
      query.trackingStatus = status;
    }

    const dispatches = await prisma.dispatchLog.findMany({
      where: query,
      include: {
        task: true,
        inventoryItem: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ dispatches }, { status: 200 });
  } catch (error) {
    console.error("GET /api/dispatch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
