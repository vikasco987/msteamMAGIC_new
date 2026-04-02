import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { users } from "@clerk/clerk-sdk-node";

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req as any);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await users.getUser(userId);
    const role = (adminUser.publicMetadata?.role as string || "").toUpperCase();

    if (role !== "ADMIN" && role !== "MASTER") {
      return NextResponse.json({ error: "Admin/Master access only" }, { status: 403 });
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
