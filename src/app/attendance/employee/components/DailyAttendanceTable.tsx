










"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser, useAuth } from "@clerk/nextjs";

interface AttendanceRecord {
  date: string | Date;
  checkIn?: string | Date;
  checkOut?: string | Date;
  status?: "Present" | "Absent" | "Leave" | "Half-Day" | "Unverified";
  verified?: boolean;
  remarks?: string | null;
  employeeName?: string;
}

// -------------------- Helpers --------------------
function parseDate(date?: any) {
  if (!date) return undefined;
  if (typeof date === "object" && "$date" in date) return new Date(date.$date);
  return new Date(date);
}

function formatDate(date?: any) {
  const d = parseDate(date);
  if (!d) return "-";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date?: any) {
  const d = parseDate(date);
  if (!d) return "0";
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDecimalHours(decimal?: number) {
  if (!decimal || decimal < 0.01) return "0";
  const hrs = Math.floor(decimal);
  const mins = Math.round((decimal - hrs) * 60);
  const parts = [];
  if (hrs > 0) parts.push(`${hrs} hr`);
  if (mins > 0) parts.push(`${mins} min`);
  return parts.join(" ");
}

// -------------------- Calculations --------------------
function calcLate(checkIn?: any) {
  const ci = parseDate(checkIn);
  if (!ci) return 0;
  const tenAM = new Date(ci);
  tenAM.setHours(10, 0, 0, 0);
  return ci > tenAM ? (ci.getTime() - tenAM.getTime()) / (1000 * 60 * 60) : 0;
}

function calcEarlyCheckout(checkOut?: any) {
  const co = parseDate(checkOut);
  if (!co) return 0;
  const sevenPM = new Date(co);
  sevenPM.setHours(19, 0, 0, 0);
  return co < sevenPM ? (sevenPM.getTime() - co.getTime()) / (1000 * 60 * 60) : 0;
}

function calcWorkingHours(checkIn?: any, checkOut?: any) {
  const ci = parseDate(checkIn);
  const co = parseDate(checkOut);
  if (!ci || !co) return 0;
  let hours = (co.getTime() - ci.getTime()) / (1000 * 60 * 60);
  if (hours > 1) hours -= 1; // subtract 1 hr lunch
  return Math.max(0, hours);
}

function calcOvertime(hours: number) {
  return hours > 8 ? hours - 8 : 0;
}

function calcDayType(checkIn?: any, checkOut?: any, hours?: number) {
  if (!parseDate(checkIn)) return "Absent";
  if (!parseDate(checkOut)) return "Half-Day";
  if (!hours || hours < 6) return "Half-Day";
  return "Full Day";
}

// -------------------- Badge Styling --------------------
const getStatusBadge = (status?: string | boolean) => {
  const value = typeof status === 'boolean' ? (status ? 'Verified' : 'Unverified') : status;
  switch (value) {
    case "Verified":
    case "Present":
    case "Full Day":
      return "bg-green-100 text-green-700 font-bold border border-green-300";
    case "Half-Day":
      return "bg-yellow-100 text-yellow-700 font-bold border border-yellow-300";
    case "Absent":
    case "Unverified":
      return "bg-red-100 text-red-700 font-bold border border-red-300";
    case "Leave":
      return "bg-blue-100 text-blue-700 font-bold border border-blue-300";
    default:
      return "bg-gray-100 text-gray-600 border border-gray-300";
  }
};

// -------------------- Component --------------------
export default function AttendanceTable() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string>(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
  );

  if (!isLoaded) return null;
  if (!user) return <p className="text-center p-8 text-gray-700">Please log in to view your attendance.</p>;

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/attendance/employeemonthly?month=${filterMonth}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data: AttendanceRecord[] = await res.json();

      const enriched = data.map((rec) => ({
        ...rec,
        employeeName: user.fullName || user.username || "Employee",
        verified: rec.verified ?? false,
        status: rec.status ?? (rec.verified ? "Present" : "Unverified"),
      }));

      setRecords(enriched);
    } catch (err) {
      console.error("Failed to fetch attendance", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [filterMonth, user.id]);

  // -------------------- Sorting --------------------
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const dateA = parseDate(a.date)?.getTime() || 0;
      const dateB = parseDate(b.date)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [records]);

  // -------------------- Totals --------------------
  const year = Number(filterMonth.split("-")[0]);
  const month = Number(filterMonth.split("-")[1]);
  const today = new Date();
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const passedDays = isCurrentMonth ? today.getDate() : totalDaysInMonth;

  const totals = records.reduce(
    (acc, rec) => {
      const workingHrs = calcWorkingHours(rec.checkIn, rec.checkOut);
      const lateHrs = calcLate(rec.checkIn);
      const earlyHrs = calcEarlyCheckout(rec.checkOut);
      const overtimeHrs = calcOvertime(workingHrs);
      const dayType = calcDayType(rec.checkIn, rec.checkOut, workingHrs);

      if (dayType === "Full Day") acc.totalPresent += 1;
      if (dayType === "Half-Day") acc.totalHalfDay += 1;
      acc.totalLate += lateHrs;
      acc.totalEarly += earlyHrs;
      acc.totalOvertime += overtimeHrs;

      return acc;
    },
    { totalPresent: 0, totalHalfDay: 0, totalAbsent: 0, totalLate: 0, totalEarly: 0, totalOvertime: 0 }
  );

  totals.totalAbsent = passedDays - (totals.totalPresent + totals.totalHalfDay);
  if (totals.totalAbsent < 0) totals.totalAbsent = 0;

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">My Attendance 📅</h1>
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-blue-500 focus:border-blue-500 transition duration-150 shadow-sm"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white rounded shadow text-center">
          <p className="text-gray-500 text-sm">Total Days</p>
          <p className="text-2xl font-bold">{totalDaysInMonth}</p>
        </div>
        <div className="p-4 bg-green-100 rounded shadow text-center">
          <p className="text-green-800 text-sm">Total Present</p>
          <p className="text-2xl font-bold">{totals.totalPresent}</p>
        </div>
        <div className="p-4 bg-yellow-100 rounded shadow text-center">
          <p className="text-yellow-800 text-sm">Total Half-Day</p>
          <p className="text-2xl font-bold">{totals.totalHalfDay}</p>
        </div>
        <div className="p-4 bg-red-100 rounded shadow text-center">
          <p className="text-red-800 text-sm">Total Absent</p>
          <p className="text-2xl font-bold">{totals.totalAbsent}</p>
        </div>
        <div className="p-4 bg-red-50 rounded shadow text-center">
          <p className="text-red-600 text-sm">Total Late</p>
          <p className="text-2xl font-bold">{formatDecimalHours(totals.totalLate)}</p>
        </div>
        <div className="p-4 bg-orange-50 rounded shadow text-center">
          <p className="text-orange-600 text-sm">Total Early Checkout</p>
          <p className="text-2xl font-bold">{formatDecimalHours(totals.totalEarly)}</p>
        </div>
        <div className="p-4 bg-green-50 rounded shadow text-center">
          <p className="text-green-700 text-sm">Total Overtime</p>
          <p className="text-2xl font-bold">{formatDecimalHours(totals.totalOvertime)}</p>
        </div>
      </div>

      {/* Attendance Table */}
      {loading ? (
        <div className="text-center p-12 bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-lg text-gray-600">Loading attendance records...</p>
        </div>
      ) : sortedRecords.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl shadow-lg border border-gray-200">
          <p className="text-xl text-gray-700 font-medium">No attendance records found for this month.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-xl bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 shadow-sm z-10">
              <tr className="text-gray-600 uppercase tracking-wider font-semibold">
                <th className="px-4 py-3 border-b-2 border-gray-200 text-left">Date</th>
                <th className="px-4 py-3 border-b-2 border-gray-200 text-left">Employee</th>
                <th className="px-4 py-3 border-b-2 border-gray-200 text-center">Check-In</th>
                <th className="px-4 py-3 border-b-2 border-gray-200 text-center">Late</th>
                <th className="px-4 py-3 border-b-2 border-gray-200 text-center">Check-Out</th>
                <th className="px-4 py-3 border-b-2 border-gray-200 text-center">Early Out</th>
                <th className="px-4 py-3 border-b-2 border-gray-200 text-center">Work Hrs</th>
                <th className="px-4 py-3 border-b-2 border-gray-200 text-center">Overtime</th>
                <th className="px-4 py-3 border-b-2 border-gray-200 text-center">Day Type</th>
                <th className="px-4 py-3 border-b-2 border-gray-200 text-center">Status</th>
                <th className="px-4 py-3 border-b-2 border-gray-200 text-center">Verified</th>
                <th className="px-4 py-3 border-b-2 border-gray-200 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecords.map((rec, idx) => {
                const workingHrs = calcWorkingHours(rec.checkIn, rec.checkOut);
                const lateHrs = calcLate(rec.checkIn);
                const earlyHrs = calcEarlyCheckout(rec.checkOut);
                const dayType = calcDayType(rec.checkIn, rec.checkOut, workingHrs);

                const rowClass =
                  idx % 2 === 0
                    ? "bg-white hover:bg-gray-50 transition duration-100"
                    : "bg-gray-50 hover:bg-gray-100 transition duration-100";

                return (
                  <tr key={idx} className={rowClass}>
                    <td className="px-4 py-3 border-b border-gray-100 text-sm font-medium text-gray-800 whitespace-nowrap">{formatDate(rec.date)}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-700 whitespace-nowrap">{rec.employeeName}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-center text-sm font-mono">{formatTime(rec.checkIn)}</td>
                    <td className={`px-4 py-3 border-b border-gray-100 text-center text-sm font-semibold ${lateHrs > 0 ? 'text-red-600' : 'text-gray-500'}`}>{formatDecimalHours(lateHrs)}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-center text-sm font-mono">{formatTime(rec.checkOut)}</td>
                    <td className={`px-4 py-3 border-b border-gray-100 text-center text-sm font-semibold ${earlyHrs > 0 ? 'text-orange-600' : 'text-gray-500'}`}>{formatDecimalHours(earlyHrs)}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-center text-sm font-bold text-blue-600">{formatDecimalHours(workingHrs)}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-center text-sm font-bold text-green-700">{formatDecimalHours(calcOvertime(workingHrs))}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-center">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(dayType)}`}>{dayType}</span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 text-center">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(rec.status)}`}>{rec.status || "-"}</span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 text-center">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(rec.verified)}`}>{rec.verified ? "Verified" : "Pending"}</span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-600 text-left">{rec.remarks || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
