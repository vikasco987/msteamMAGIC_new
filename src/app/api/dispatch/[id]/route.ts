import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await props.params;
    const body = await req.json();
    const { trackingStatus } = body;

    if (!trackingStatus) {
      return NextResponse.json({ error: "trackingStatus is required" }, { status: 400 });
    }

    const userName = user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.username || "Unknown";

    const updatedLog = await prisma.dispatchLog.update({
      where: { id },
      data: {
        trackingStatus,
        history: {
          push: {
            status: trackingStatus,
            changedBy: userName,
            changedAt: new Date().toISOString()
          }
        }
      }
    });

    return NextResponse.json({ dispatch: updatedLog }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/dispatch/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
