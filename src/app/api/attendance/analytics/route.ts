import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { users } from "@clerk/clerk-sdk-node";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // e.g. "2025-09"
    const weekStart = searchParams.get("weekStart"); // optional YYYY-MM-DD

    let startDate: Date;
    let endDate: Date;

    if (weekStart) {
      // weekly mode
      startDate = new Date(weekStart);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // 7 days range
    } else if (month) {
      // monthly mode
      const [year, monthNum] = month.split("-").map(Number);
      startDate = new Date(year, monthNum - 1, 1);
      endDate = new Date(year, monthNum, 0);
    } else {
      return NextResponse.json({ error: "Provide ?month=YYYY-MM or ?weekStart=YYYY-MM-DD" }, { status: 400 });
    }

    // fetch records
    const records = await prisma.attendance.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      orderBy: { date: "asc" },
    });

    if (records.length === 0) {
      return NextResponse.json({ headers: ["Employee"], rows: [] });
    }

    const userIds = [...new Set(records.map(r => r.userId))];

    // map userId -> name
    const userMap = new Map<string, string>();
    for (const id of userIds) {
      try {
        const user = await users.getUser(id);
        userMap.set(
          id,
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            records.find(r => r.userId === id)?.employeeName ||
            "Unknown"
        );
      } catch {
        userMap.set(id, records.find(r => r.userId === id)?.employeeName || "Unknown");
      }
    }

    const rows = userIds.map(userId => {
      const empRecords = records.filter(r => r.userId === userId);

      const daysPresent = empRecords.filter(r => r.checkIn).length;
      const daysLate = empRecords.filter(r => r.checkInReason === "Late").length;
      const daysEarly = empRecords.filter(r => r.checkOutReason === "Early Leave").length;

      const totalMinutes = empRecords.reduce((acc, r) => acc + (r.workingHours || 0), 0);
      const overtimeMinutes = empRecords.reduce((acc, r) => acc + (r.overtimeHours || 0), 0);

      const formatHrs = (min: number) => {
        const h = Math.floor(min / 60);
        const m = min % 60;
        return h && m ? `${h} hr ${m} min` : h ? `${h} hr` : `${m} min`;
      };

      return {
        Employee: userMap.get(userId) || "Unknown",
        "Days Present": daysPresent,
        "Days Late": daysLate,
        "Days Early Leave": daysEarly,
        "Total Hours Worked": formatHrs(totalMinutes),
        "Total Overtime": formatHrs(overtimeMinutes),
      };
    });

    const headers = [
      "Employee",
      "Days Present",
      "Days Late",
      "Days Early Leave",
      "Total Hours Worked",
      "Total Overtime",
    ];

    return NextResponse.json({ headers, rows });
  } catch (error) {
    console.error("💥 Analytics failed:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

