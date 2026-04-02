import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// Helper: calculate working hours excluding lunch 2–3 PM
const calcWorkingHours = (checkIn: Date, checkOut: Date) => {
  let ms = checkOut.getTime() - checkIn.getTime();
  let hours = ms / (1000 * 60 * 60);

  // Subtract lunch if check-in < 14:00 and check-out > 15:00
  const lunchStart = new Date(checkIn);
  lunchStart.setUTCHours(14, 0, 0, 0);
  const lunchEnd = new Date(checkIn);
  lunchEnd.setUTCHours(15, 0, 0, 0);

  if (checkIn < lunchStart && checkOut > lunchEnd) {
    hours -= 1;
  } else if (checkIn < lunchStart && checkOut > lunchStart && checkOut <= lunchEnd) {
    hours -= (checkOut.getTime() - lunchStart.getTime()) / (1000 * 60 * 60);
  } else if (checkIn >= lunchStart && checkIn < lunchEnd && checkOut > lunchEnd) {
    hours -= (lunchEnd.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
  }

  return Math.max(0, hours);
};

// Helper: determine day type
const calcDayType = (checkIn?: Date, checkOut?: Date, hours?: number) => {
  if (!checkIn) return "Absent";
  if (!checkOut) return "Half-Day";
  if (!hours || hours < 6) return "Half-Day";
  return "Full Day";
};

export async function GET(req: Request) {
  try {
    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const { userId } = await auth({ token });
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Month filter
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // YYYY-MM
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Invalid month format. Use YYYY-MM" }, { status: 400 });
    }

    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0)); // 1st day 00:00 UTC
    const endDate = new Date(Date.UTC(year, monthNum - 1, new Date(year, monthNum, 0).getDate(), 23, 59, 59)); // last day 23:59:59 UTC

    // Fetch attendance
    const records = await prisma.attendance.findMany({
      where: { 
        userId,
        date: { gte: startDate, lte: endDate } // only current month
      },
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        checkIn: true,
        checkOut: true,
        status: true,
        workingHours: true,
        overtimeHours: true,
        remarks: true,
        employeeName: true,
        verified: true,
      },
    });

    // Format response
    const formatted = records.map((r, i) => {
      const checkInDate = r.checkIn ? new Date(r.checkIn) : undefined;
      const checkOutDate = r.checkOut ? new Date(r.checkOut) : undefined;

      const workingHrs = checkInDate && checkOutDate ? calcWorkingHours(checkInDate, checkOutDate) : 0;
      const dayType = calcDayType(checkInDate, checkOutDate, workingHrs);

      return {
        serial: i + 1,
        date: r.date.toISOString().split("T")[0],
        employeeName: r.employeeName ?? "-",
        checkIn: checkInDate?.toISOString() ?? null,
        checkOut: checkOutDate?.toISOString() ?? null,
        status: r.status ?? (dayType === "Absent" ? "Absent" : "Present"),
        dayType,
        workingHours: workingHrs,
        overtime: Math.max(0, workingHrs - 8),
        lateBy: checkInDate ? Math.max(0, (checkInDate.getUTCHours() + checkInDate.getUTCMinutes() / 60) - 10).toFixed(2) + " hr" : null,
        earlyBy: checkOutDate ? Math.max(0, 19 - (checkOutDate.getUTCHours() + checkOutDate.getUTCMinutes() / 60)).toFixed(2) + " hr" : null,
        verified: !!r.verified,
        remarks: r.remarks ?? null,
      };
    });

    return NextResponse.json(formatted);
  } catch (e: any) {
    console.error("💥 Monthly Attendance error:", e);
    return NextResponse.json({ error: "Internal Error", details: e.message }, { status: 500 });
  }
}
