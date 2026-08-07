import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, format } from "date-fns";

const calcWorkingHours = (checkIn: Date, checkOut: Date) => {
  let ms = checkOut.getTime() - checkIn.getTime();
  let hours = ms / (1000 * 60 * 60);

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

const calcDayType = (checkIn?: Date, checkOut?: Date, hours?: number) => {
  if (!checkIn) return "Absent";
  if (!checkOut) return "Half-Day";
  if (!hours || hours < 6) return "Half-Day";
  return "Full Day";
};

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata?.role as string)?.toLowerCase() || "user";

    if (!["master", "admin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    
    const profile = await prisma.employeeProfile.findUnique({
      where: { id }
    });

    if (!profile) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Attempt to match Employee model if it exists
    const matchingUser = await prisma.user.findFirst({
      where: { email: profile.email }
    });

    const attendances = await prisma.attendance.findMany({
      where: {
        OR: [
          { employeeEmail: profile.email },
          { employeeName: profile.name || "" },
          { userId: profile.email },
          ...(matchingUser ? [{ userId: matchingUser.clerkId }] : [])
        ]
      },
      orderBy: { date: "desc" }
    });

    // Group by month
    const historyByMonth: Record<string, { month: string, present: number, absent: number, halfDay: number, paidLeave: number, holiday: number, weeklyOff: number, logs: any[] }> = {};

    attendances.forEach(att => {
      if (!att.date) return;
      const monthKey = format(new Date(att.date), "yyyy-MM");
      if (!historyByMonth[monthKey]) {
        historyByMonth[monthKey] = {
          month: format(new Date(att.date), "MMMM yyyy"),
          present: 0, absent: 0, halfDay: 0, paidLeave: 0, holiday: 0, weeklyOff: 0,
          logs: []
        };
      }
      const status = (att.status || "").toLowerCase();
      let dayType = "Absent";
      
      if (att.checkIn) {
        const checkInDate = new Date(att.checkIn);
        const checkOutDate = att.checkOut ? new Date(att.checkOut) : undefined;
        const workingHrs = checkOutDate ? calcWorkingHours(checkInDate, checkOutDate) : 0;
        dayType = calcDayType(checkInDate, checkOutDate, workingHrs);
      }

      if (dayType === "Full Day") historyByMonth[monthKey].present++;
      else if (dayType === "Half-Day") historyByMonth[monthKey].halfDay++;
      else if (status.includes("paid leave")) historyByMonth[monthKey].paidLeave++;
      else if (status.includes("holiday")) historyByMonth[monthKey].holiday++;
      else if (status.includes("weekly off") || status.includes("weekend")) historyByMonth[monthKey].weeklyOff++;
      else if (status.includes("absent")) historyByMonth[monthKey].absent++;

      historyByMonth[monthKey].logs.push(att);
    });

    return NextResponse.json({ history: Object.values(historyByMonth) });
  } catch (error: any) {
    console.error("❌ GET Employee Attendance Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
