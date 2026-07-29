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

    console.log(`[AttendanceUpdate] userId: ${userId}, role: ${role}`);

    // ONLY MASTER can update attendance
    if (role !== "MASTER") {
      return NextResponse.json({ error: "Master access required to edit attendance" }, { status: 403 });
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

    // Recalculate working hours if checkIn / checkOut present
    const existing = await prisma.attendance.findUnique({ where: { id: attendanceId } });
    const finalCheckIn = updateData.checkIn !== undefined ? updateData.checkIn : existing?.checkIn;
    const finalCheckOut = updateData.checkOut !== undefined ? updateData.checkOut : existing?.checkOut;

    if (finalCheckIn && finalCheckOut) {
      const diffMs = new Date(finalCheckOut).getTime() - new Date(finalCheckIn).getTime();
      const workingHours = Math.max(0, diffMs / (1000 * 60 * 60) - 1); // minus 1hr lunch
      updateData.workingHours = workingHours;
      updateData.overtimeHours = Math.max(0, workingHours - 8);
    }

    const attendance = await prisma.attendance.update({
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
