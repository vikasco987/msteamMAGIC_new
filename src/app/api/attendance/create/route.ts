import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId: currentUserId } = await auth();

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user role from Clerk & DB
    const dbUser = await prisma.user.findUnique({ where: { clerkId: currentUserId } });
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(currentUserId);
    const metadataRole = (clerkUser.publicMetadata as any)?.role || (clerkUser.privateMetadata as any)?.role;
    const role = String(metadataRole || dbUser?.role || "").toUpperCase();

    // ONLY MASTER can create / add attendance manually
    if (role !== "MASTER") {
      return NextResponse.json({ error: "Master access required to add attendance" }, { status: 403 });
    }

    const body = await req.json();
    const {
      targetUserId,
      employeeName,
      date,
      checkIn,
      checkOut,
      checkInReason,
      checkOutReason,
      status,
      verified,
      remarks,
    } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "Employee selection is required" }, { status: 400 });
    }
    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Determine target employee name if missing
    let finalEmployeeName = employeeName;
    if (!finalEmployeeName) {
      try {
        const u = await client.users.getUser(targetUserId);
        finalEmployeeName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "Employee";
      } catch {
        finalEmployeeName = "Employee";
      }
    }

    // Safety: check-out cannot be before check-in
    if (checkIn && checkOut && new Date(checkOut) < new Date(checkIn)) {
      return NextResponse.json({ error: "Check-out cannot be before check-in" }, { status: 400 });
    }

    const targetDate = new Date(`${date}T00:00:00.000Z`);

    const checkInDate = checkIn ? new Date(checkIn) : null;
    const checkOutDate = checkOut ? new Date(checkOut) : null;

    let workingHours = 0;
    let overtimeHours = 0;
    if (checkInDate && checkOutDate) {
      const diffMs = checkOutDate.getTime() - checkInDate.getTime();
      workingHours = Math.max(0, diffMs / (1000 * 60 * 60) - 1); // minus 1hr break
      overtimeHours = Math.max(0, workingHours - 8);
    }

    // Check if attendance record already exists for this user on this date
    const startDate = new Date(`${date}T00:00:00.000Z`);
    const endDate = new Date(`${date}T23:59:59.999Z`);

    const existing = await prisma.attendance.findFirst({
      where: {
        userId: targetUserId,
        date: { gte: startDate, lte: endDate },
      },
    });

    let attendance;
    if (existing) {
      attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          employeeName: finalEmployeeName,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          checkInReason: checkInReason || null,
          checkOutReason: checkOutReason || null,
          status: status || (checkInDate ? "Present" : "Absent"),
          verified: Boolean(verified),
          remarks: remarks || null,
          workingHours,
          overtimeHours,
        },
      });
    } else {
      attendance = await prisma.attendance.create({
        data: {
          userId: targetUserId,
          employeeName: finalEmployeeName,
          date: targetDate,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          checkInReason: checkInReason || null,
          checkOutReason: checkOutReason || null,
          status: status || (checkInDate ? "Present" : "Absent"),
          verified: Boolean(verified),
          remarks: remarks || null,
          workingHours,
          overtimeHours,
        },
      });
    }

    console.log(`[AttendanceCreate] Created/Updated record for ${targetUserId} on ${date}`);
    return NextResponse.json({ success: true, attendance });
  } catch (error: any) {
    console.error("❌ Attendance create failed:", error);
    return NextResponse.json(
      { error: "Failed to create attendance", details: error.message },
      { status: 500 }
    );
  }
}
