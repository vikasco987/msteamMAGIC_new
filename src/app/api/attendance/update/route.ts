import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { users } from "@clerk/clerk-sdk-node";

export async function POST(req: NextRequest) {
  try {
    // Use same auth pattern as the rest of the project
    const { userId } = getAuth(req as any);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch role from Clerk using clerk-sdk-node (same as rest of project)
    const adminUser = await users.getUser(userId);
    const role = (adminUser.publicMetadata?.role as string || "").toUpperCase();

    console.log(`[AttendanceUpdate] userId: ${userId}, role: ${role}`);

    // Only ADMIN or MASTER can update attendance
    if (role !== "ADMIN" && role !== "MASTER") {
      return NextResponse.json({ error: "Admin/Master access only" }, { status: 403 });
    }

    const body = await req.json();
    const {
      attendanceId,
      checkIn,
      checkOut,
      checkInReason,
      checkOutReason,
      status,
      verified,
      remarks,
    } = body;

    if (!attendanceId) {
      return NextResponse.json({ error: "attendanceId is required" }, { status: 400 });
    }

    // Safety: check-out cannot be before check-in
    if (checkIn && checkOut && new Date(checkOut) < new Date(checkIn)) {
      return NextResponse.json({ error: "Check-out cannot be before check-in" }, { status: 400 });
    }

    const updateData: any = {};
    if (checkIn !== undefined) updateData.checkIn = checkIn ? new Date(checkIn) : null;
    if (checkOut !== undefined) updateData.checkOut = checkOut ? new Date(checkOut) : null;
    if (checkInReason !== undefined) updateData.checkInReason = checkInReason || null;
    if (checkOutReason !== undefined) updateData.checkOutReason = checkOutReason || null;
    if (status !== undefined) updateData.status = status || null;
    if (verified !== undefined) updateData.verified = Boolean(verified);
    if (remarks !== undefined) updateData.remarks = remarks || null;

    // Recalculate working hours if both times are present
    if (updateData.checkIn && updateData.checkOut) {
      const diffMs = new Date(updateData.checkOut).getTime() - new Date(updateData.checkIn).getTime();
      const workingHours = Math.max(0, diffMs / (1000 * 60 * 60) - 1); // minus 1hr lunch
      updateData.workingHours = workingHours;
      updateData.overtimeHours = Math.max(0, workingHours - 8);
    }

    const attendance = await (prisma as any).attendance.update({
      where: { id: attendanceId },
      data: updateData,
    });

    console.log(`[AttendanceUpdate] Success - updated record: ${attendanceId}`);
    return NextResponse.json({ success: true, attendance });
  } catch (error: any) {
    console.error("❌ Attendance update failed:", error);
    return NextResponse.json(
      { error: "Failed to update attendance", details: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}
