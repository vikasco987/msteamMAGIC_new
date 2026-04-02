"use client";

import { useEffect, useState } from "react";
import {
  FiClock,
  FiAlertCircle,
  FiEdit,
  FiBriefcase,
} from "react-icons/fi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Attendance {
  id: string;
  userId: string;
  employeeName?: string;
  checkIn?: string;
  checkOut?: string;
  workingHours?: number;
  overtimeHours?: number;
  remarks?: string;
  checkInReason?: string;
  checkOutReason?: string;
  status?: string;
  verified?: boolean;
  location?: any;
  date: string;
  isLate?: boolean;
  isEarlyLeave?: boolean;
}

interface AttendancePivotTableProps {
  month?: string;
  all?: boolean;
}

export default function AttendancePivotTable({ month: propMonth, all = false }: AttendancePivotTableProps) {
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

  function getMonthDates(month: string) {
    const [year, m] = month.split("-").map(Number);
    const lastDay = new Date(year, m, 0).getDate();
    return Array.from({ length: lastDay }, (_, i) =>
      `${year}-${String(m).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`
    );
  }

  useEffect(() => {
    const fetchMonthData = async () => {
      setLoading(true);
      try {
        const url = `/api/attendance/list?month=${month}${all ? "&all=true" : ""}`;
        const res = await fetch(url);
        const json = await res.json();
        if (Array.isArray(json)) setData(json);
        else setData([]);
      } catch (err) {
        console.error("Failed to load attendance:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMonthData();
  }, [month, all]);

  const monthDates = getMonthDates(month);

  const grouped: Record<string, Record<string, Attendance>> = {};
  data.forEach((row) => {
    const emp = row.employeeName || row.userId || "Unknown";
    const dateKey = new Date(row.date).toISOString().slice(0, 10);
    if (!grouped[emp]) grouped[emp] = {};
    grouped[emp][dateKey] = {
      ...row,
      isLate: row.isLate ?? false,
      isEarlyLeave: row.isEarlyLeave ?? false,
      workingHours: row.workingHours ?? 0,
      overtimeHours: row.overtimeHours ?? 0,
    };
  });

  function formatHours(hours?: number) {
    if (!hours) return "-";
    const totalMinutes = Math.round(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hrs ? `${hrs}h ${mins}m` : `${mins}m`;
  }

  function formatTime(date?: string) {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function formatFullTime(date?: string) {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleString();
  }

  function formatLocation(loc?: any) {
    if (!loc) return "-";
    if (typeof loc === "object") return JSON.stringify(loc);
    return String(loc);
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto space-y-4">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
          <h2 className="text-lg font-bold text-gray-800">Attendance Pivot Table</h2>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-500">Month:</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border rounded px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {loading ? (
          <p className="p-4 text-gray-500 text-center">Loading pivot data...</p>
        ) : (
          <div className="border rounded-xl shadow-lg bg-white overflow-x-auto">
            <table className="min-w-full text-[10px] border-collapse">
              <thead className="bg-gray-100 text-gray-600 font-bold sticky top-0 z-10">
                <tr>
                  <th className="p-3 border-r border-b text-left sticky left-0 bg-gray-100 z-20 min-w-[150px]">Employee</th>
                  {monthDates.map((d) => (
                    <th key={d} className="p-1 border-r border-b text-center min-w-[44px]">
                      {new Date(d).getDate()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.keys(grouped).length === 0 ? (
                  <tr>
                    <td colSpan={monthDates.length + 1} className="p-8 text-center text-gray-500">
                      No records found for {month}.
                    </td>
                  </tr>
                ) : (
                  Object.keys(grouped).map((emp, idx) => (
                    <tr
                      key={emp}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 border-r font-bold text-gray-900 sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                        {emp}
                      </td>
                      {monthDates.map((d) => {
                        const rec = grouped[emp][d];
                        const reasonText = rec
                          ? rec.checkInReason ||
                            rec.checkOutReason ||
                            rec.remarks ||
                            "-"
                          : "-";

                        return (
                          <td
                            key={d}
                            className="p-1 border-r text-center align-top relative"
                          >
                            {rec ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="bg-white rounded-md shadow-sm p-1 text-[9px] leading-tight border hover:shadow-md hover:bg-blue-50 transition-all cursor-pointer min-h-[50px] flex flex-col justify-between">
                                    <div>
                                      <div className="flex justify-between gap-1">
                                        <FiClock className="text-blue-500 shrink-0" />
                                        <span>{formatTime(rec.checkIn)}</span>
                                      </div>
                                      <div className="flex justify-between gap-1">
                                        <FiClock className="text-red-500 shrink-0" />
                                        <span>{formatTime(rec.checkOut)}</span>
                                      </div>
                                    </div>
                                    <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                                      {rec.isLate && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" title="Late" />
                                      )}
                                      {rec.isEarlyLeave && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" title="Early Leave" />
                                      )}
                                      {rec.overtimeHours && rec.overtimeHours > 0 && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="Overtime" />
                                      )}
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm p-3 text-xs bg-white text-gray-800 rounded shadow-md border z-50">
                                  <div className="space-y-1">
                                    <p><b>Check In:</b> {formatFullTime(rec.checkIn)}</p>
                                    <p><b>Check Out:</b> {formatFullTime(rec.checkOut)}</p>
                                    <p><b>Status:</b> {rec.status || "-"}</p>
                                    <p><b>Working:</b> {formatHours(rec.workingHours)}</p>
                                    <p><b>Reason/Remarks:</b> {reasonText}</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
