"use client";

import { useEffect, useState } from "react";

interface TableData {
  headers: string[];
  rows: Record<string, any>[];
}

interface MonthlyAttendanceTableProps {
  month?: string;
  all?: boolean;
}

// -------------------- Helpers --------------------
// Display date in IST and decrease by 1 day
function formatDateMinusOne(dateInput?: any): string {
  if (!dateInput) return "-";
  try {
    const raw = typeof dateInput === "string" ? dateInput : dateInput.$date || dateInput;
    const date = new Date(raw);
    date.setDate(date.getDate() - 1); 
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return "-";
  }
}

// Format checkIn/checkOut times in IST
function formatTime(dateInput?: any): string {
  if (!dateInput) return "-";
  try {
    const raw = typeof dateInput === "string" ? dateInput : dateInput.$date || dateInput;
    const date = new Date(raw);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return "-";
  }
}

export default function MonthlyAttendanceTable({ month }: MonthlyAttendanceTableProps) {
  const today = new Date();
  const defaultMonth = today.toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(month || defaultMonth);
  const [data, setData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (month) {
      setSelectedMonth(month);
    }
  }, [month]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/attendance/monthly?month=${selectedMonth}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (!json || !Array.isArray(json.headers) || !Array.isArray(json.rows)) {
          throw new Error("Invalid response format");
        }

        json.rows.sort((a: any, b: any) => {
          const dateA = new Date(a.checkIn || 0).getTime();
          const dateB = new Date(b.checkIn || 0).getTime();
          return dateA - dateB;
        });

        setData(json);
      } catch (err: any) {
        console.error("❌ Fetch monthly failed:", err);
        setError(err.message || "Failed to load data");
        setData({ headers: ["Employee"], rows: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth]);

  return (
    <div className="space-y-4">
      {/* Month Selector */}
      <div className="flex items-center gap-3">
        <label htmlFor="month" className="font-medium text-sm">
          Select Month:
        </label>
        <input
          type="month"
          id="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border rounded px-3 py-1 text-sm shadow-sm"
        />
      </div>

      {/* Table */}
      {loading ? (
        <p className="p-4 text-gray-500">Loading monthly attendance...</p>
      ) : error ? (
        <p className="p-4 text-red-600">Error: {error}</p>
      ) : !data || data.rows.length === 0 ? (
        <p className="p-4 text-gray-500 text-center border rounded-lg bg-white">
          No attendance records for {selectedMonth}
        </p>
      ) : (
        <div className="overflow-auto border rounded-xl shadow-lg bg-white">
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-gray-100 text-gray-600 font-bold">
              <tr>
                {data.headers.map((h) => (
                  <th key={h} className="px-4 py-3 border-b text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.rows.map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {data.headers.map((h) => {
                    const val = row[h];
                    if (!val) return <td key={h} className="px-4 py-3 text-center text-gray-400">-</td>;

                    if (h.toLowerCase().includes("checkin") || h.toLowerCase().includes("checkout")) {
                      return (
                        <td key={h} className="px-4 py-3">
                          {formatTime(val)}
                        </td>
                      );
                    }

                    if (h.toLowerCase().includes("date")) {
                      return (
                        <td key={h} className="px-4 py-3 whitespace-nowrap">
                          {formatDateMinusOne(val)}
                        </td>
                      );
                    }

                    return (
                      <td key={h} className="px-4 py-3">{String(val)}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
