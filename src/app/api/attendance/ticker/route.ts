import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import moment from "moment-timezone";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const nowIST = moment().tz("Asia/Kolkata");
    const startOfDay = nowIST.clone().startOf("day").toDate();
    const endOfDay = nowIST.clone().endOf("day").toDate();
    const startOfMonth = nowIST.clone().startOf("month").toDate();

    // 1. Find 'Active Users' (those who marked attendance at least once this month)
    const activeAttendanceLogs = await prisma.attendance.findMany({
      where: { date: { gte: startOfMonth } },
      select: { userId: true, employeeName: true }
    });

    const activeUserMap = new Map<string, string>();
    activeAttendanceLogs.forEach(log => {
      if (log.userId && !activeUserMap.has(log.userId)) {
        activeUserMap.set(log.userId, log.employeeName || "Unknown User");
      }
    });

    // 2. Fetch all attendance logs for STRICTLY TODAY (Check-in must happen today IST)
    const todayLogs = await prisma.attendance.findMany({
      where: {
        checkIn: { gte: startOfDay, lte: endOfDay }
      },
      select: {
        employeeName: true,
        checkIn: true,
        status: true,
        userId: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    const earlyMap = new Map<string, string>();
    const lateMap = new Map<string, { name: string, latenessStr: string, minutesTotal: number }>();
    const presentUserIds = new Set<string>();

    // 3. Process existing logs (Early Birds and Late arrivals today)
    todayLogs.forEach(r => {
      if (earlyMap.has(r.userId) || lateMap.has(r.userId)) return;
      if (r.status === "Absent") return; // Skip explicit absent records in the check-in list

      const name = r.employeeName || activeUserMap.get(r.userId) || "Unknown User";
      if (!r.checkIn) return;
      
      presentUserIds.add(r.userId);
      const actualCheckIn = moment(r.checkIn).tz("Asia/Kolkata");
      const officeStart = actualCheckIn.clone().hour(10).minute(0).second(0).millisecond(0);
      
      const diffMins = Math.floor(moment.duration(actualCheckIn.diff(officeStart)).asMinutes());

      if (diffMins <= 0) {
        earlyMap.set(r.userId, name);
      } else {
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        let latenessStr = "";
        if (hrs && mins) latenessStr = `${hrs} hr ${mins} min`;
        else if (hrs) latenessStr = `${hrs} hr`;
        else if (mins) latenessStr = `${mins} min`;
        else latenessStr = "Late";

        lateMap.set(r.userId, { name, latenessStr, minutesTotal: diffMins });
      }
    });

    // 4. Identify 'Active' users who have NOT checked in today
    activeUserMap.forEach((name, userId) => {
      if (!presentUserIds.has(userId)) {
        lateMap.set(userId, { name, latenessStr: "ABSENT", minutesTotal: 9999 });
      }
    });

    return NextResponse.json({
      date: nowIST.format("DD MMM YYYY"),
      early: Array.from(earlyMap.values()),
      late: Array.from(lateMap.values()).map(({ name, latenessStr }) => ({ name, latenessStr }))
    });
  } catch (err) {
    console.error("Ticker fetch error (Connection or Query failure):", err);
    // 🛡️ Fail-safe: Return empty results to prevent dashboard crash if DB is unreachable
    return NextResponse.json({ 
        date: moment().tz("Asia/Kolkata").format("DD MMM YYYY"),
        early: [], 
        late: [] 
    }, { status: 200 });
  }
}
