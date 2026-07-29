import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user role from Clerk & DB
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const metadataRole = (clerkUser.publicMetadata as any)?.role || (clerkUser.privateMetadata as any)?.role;
    const role = String(metadataRole || dbUser?.role || "").toUpperCase();

    // ONLY MASTER can delete attendance
    if (role !== "MASTER") {
      return NextResponse.json({ error: "Master access required to delete attendance" }, { status: 403 });
    }

    const body = await req.json();
    const { attendanceId } = body;

    if (!attendanceId) {
      return NextResponse.json({ error: "attendanceId is required" }, { status: 400 });
    }

    await prisma.attendance.delete({
      where: { id: attendanceId },
    });

    console.log(`[AttendanceDelete] Deleted record: ${attendanceId} by ${userId}`);
    return NextResponse.json({ success: true, message: "Attendance deleted successfully" });
  } catch (error: any) {
    console.error("❌ Attendance delete failed:", error);
    return NextResponse.json(
      { error: "Failed to delete attendance", details: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}
