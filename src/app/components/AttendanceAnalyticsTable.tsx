"use client";

import { useEffect, useState } from "react";

interface Attendance {
  id: string;
  userId: string;
  employeeName?: string;
  checkIn?: string;
  checkOut?: string;
  workingHours?: number;
  overtimeHours?: number;
  date: string; // UTC ISO string
}

interface AttendanceAnalyticsTableProps {
  month?: string;
  all?: boolean;
}

export default function AttendanceAnalyticsTable({ month: propMonth, all = false }: AttendanceAnalyticsTableProps) {
  const [month, setMonth] = useState<string>(() => {
    if (propMonth) return propMonth;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [data, setData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propMonth) setMonth(propMonth);
  }, [propMonth]);

  useEffect(() => {
    const fetchMonthData = async () => {
      setLoading(true);
      try {
        const url = `/api/attendance/list?month=${month}${all ? "&all=true" : ""}`;
        const res = await fetch(url);
        const json = await res.json();
        if (Array.isArray(json)) {
          // Normalize all dates to YYYY-MM-DD in UTC
          const normalized = json.map((r: Attendance) => {
            const d = new Date(r.date);
            const yyyy = d.getUTCFullYear();
            const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
            const dd = String(d.getUTCDate()).padStart(2, "0");
            return { ...r, date: `${yyyy}-${mm}-${dd}` };
          });
          setData(normalized);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error("Failed to load analytics:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthData();
  }, [month, all]);

  // Group attendance by employee
  const grouped = data.reduce((acc: any, row) => {
    // Filter by month string match (YYYY-MM)
    if (!row.date.startsWith(month)) return acc;

    const name = row.employeeName || row.userId || "Unknown";
    if (!acc[name]) {
      acc[name] = {
        employee: name,
        daysPresent: 0,
        daysLate: 0,
        daysEarlyLeave: 0,
        totalHours: 0,
        totalOvertime: 0,
      };
    }

    acc[name].daysPresent++;

    const checkIn = row.checkIn ? new Date(row.checkIn) : null;
    const checkOut = row.checkOut ? new Date(row.checkOut) : null;

    // Late if check-in after 10:15 AM local
    if (checkIn) {
      const cutoff = new Date(checkIn);
      cutoff.setHours(10, 15, 0, 0);
      if (checkIn > cutoff) acc[name].daysLate++;
    }

    // Early leave if checkout before 7:00 PM local
    if (checkOut) {
      const cutoff = new Date(checkOut);
      cutoff.setHours(19, 0, 0, 0);
      if (checkOut < cutoff) acc[name].daysEarlyLeave++;
    }

    if (row.workingHours) acc[name].totalHours += row.workingHours;
    if (row.overtimeHours) acc[name].totalOvertime += row.overtimeHours;

    return acc;
  }, {});

  const summary = Object.values(grouped);

  function formatHours(hours?: number): string {
    if (hours == null) return "-";
    const totalMinutes = Math.round(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs && mins) return `${hrs}hr ${mins}min`;
    if (hrs) return `${hrs}hr`;
    if (mins) return `${mins}min`;
    return "0min";
  }

  return (
    <div className="overflow-x-auto space-y-4">
      {/* Month Filter */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
        <h2 className="text-lg font-bold text-gray-800">Attendance Analytics</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-500">Month:</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border rounded px-3 py-1 text-sm shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <p className="p-4 text-gray-500">Loading analytics...</p>
      ) : (
        <div className="border rounded-xl shadow-lg bg-white overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 font-bold">
              <tr>
                <th className="p-4 border-b text-left">Employee</th>
                <th className="p-4 border-b text-center">Days Present</th>
                <th className="p-4 border-b text-center text-red-600">Days Late</th>
                <th className="p-4 border-b text-center text-yellow-600">Days Early Leave</th>
                <th className="p-4 border-b text-center">Total Hours</th>
                <th className="p-4 border-b text-center text-green-600">Total Overtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {summary.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No attendance records available for {month}.
                  </td>
                </tr>
              ) : (
                summary.map((row: any, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-900">{row.employee}</td>
                    <td className="p-4 text-center">{row.daysPresent}</td>
                    <td className="p-4 text-center text-red-500 font-bold">{row.daysLate}</td>
                    <td className="p-4 text-center text-yellow-600 font-bold">{row.daysEarlyLeave}</td>
                    <td className="p-4 text-center">{formatHours(row.totalHours)}</td>
                    <td className="p-4 text-center text-green-600 font-bold">
                      {formatHours(row.totalOvertime)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
