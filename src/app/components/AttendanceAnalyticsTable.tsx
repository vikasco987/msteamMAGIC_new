"use client";

import { useEffect, useState } from "react";
import { CheckCircle, X, Clock, MapPin, Activity, Calendar, TrendingUp, Award, Percent, Hourglass, UserMinus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RankedEmployee {
  userId: string;
  employeeName: string;
  daysPresent: number;
  halfDays: number;
  daysLate: number;
  earlyLeaves: number;
  earlyArrival: number;
  totalWorkingHours: number;
  overtimeHours: number;
  score: number;
  rank: number;
  medal?: string;
  // Calculated fields
  attendancePercent?: number;
  daysAbsent?: number;
}

interface Attendance {
  id: string;
  userId: string;
  employeeName?: string;
  checkIn?: string;
  checkOut?: string;
  workingHours?: number;
  overtimeHours?: number;
  date: string; 
  status?: string;
  remarks?: string;
  location?: any;
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

  const [summaryData, setSummaryData] = useState<RankedEmployee[]>([]);
  const [granularData, setGranularData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propMonth) setMonth(propMonth);
  }, [propMonth]);

  // Helper to calculate days till today in the selected month
  const getDaysTillToday = (monthParam: string) => {
    const [year, monthStr] = monthParam.split("-");
    const currentDate = new Date();
    const selectedMonth = Number(monthStr) - 1;
    const selectedYear = Number(year);
    
    // If it's the current month, count till today. Otherwise, count full month.
    if (selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth()) {
      return currentDate.getDate();
    } else {
      return new Date(selectedYear, selectedMonth + 1, 0).getDate();
    }
  };

  const fetchRankings = async () => {
    try {
      const res = await fetch(`/api/attendance/employeerank?month=${month}`);
      const json = await res.json();
      if (Array.isArray(json)) {
        const daysTillToday = getDaysTillToday(month);
        
        const enriched = json.map((it: any) => {
          const present = Number(it.daysPresent ?? 0);
          const half = Number(it.halfDays ?? 0);
          
          // Logic: Half day counts as 0.5 present
          const effectivePresent = present + (half * 0.5);
          const absent = Math.max(daysTillToday - (present + half), 0);
          const percent = daysTillToday > 0 ? (effectivePresent / daysTillToday) * 100 : 0;

          return {
            ...it,
            daysAbsent: absent,
            attendancePercent: percent
          };
        });
        setSummaryData(enriched);
      }
    } catch (err) {
      console.error("Failed to fetch rankings:", err);
    }
  };

  const fetchGranularLogs = async () => {
    try {
      const url = `/api/attendance/list?month=${month}${all ? "&all=true" : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      if (Array.isArray(json)) {
        const normalized = json.map((r: any) => ({
          ...r,
          date: new Date(r.date).toISOString().slice(0, 10)
        }));
        setGranularData(normalized);
      }
    } catch (err) {
      console.error("Failed to fetch granular logs:", err);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchRankings(), fetchGranularLogs()]);
      setLoading(false);
    };
    loadAll();
  }, [month, all]);

  function formatHours(hours?: number): string {
    if (hours == null) return "0h 0m";
    const totalMinutes = Math.round(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins}m`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Attendance Analytics</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Performance Intelligence</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <Calendar size={18} className="text-indigo-500 ml-2" />
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none pr-2"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rank</th>
                  <th className="p-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Employee</th>
                  <th className="p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Present</th>
                  <th className="p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Absent</th>
                  <th className="p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Half Days</th>
                  <th className="p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Attd %</th>
                  <th className="p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Late</th>
                  <th className="p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Score</th>
                  <th className="p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaryData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400 font-bold">No records found.</td>
                  </tr>
                ) : (
                  summaryData.map((row: RankedEmployee, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-all group">
                      <td className="p-5 text-center font-black text-indigo-600">
                        {row.medal} {row.rank}
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs border border-indigo-100 shadow-sm">
                            {row.employeeName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 leading-none">{row.employeeName}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">ID: {row.userId?.slice(-6) || "N/A"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full font-black text-xs border border-emerald-100">
                          {row.daysPresent}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <span className="px-3 py-1 bg-rose-50 text-rose-500 rounded-full font-black text-xs border border-rose-100">
                          {row.daysAbsent}
                        </span>
                      </td>
                      <td className="p-5 text-center font-black text-xs text-amber-600">{row.halfDays}</td>
                      <td className="p-5 text-center">
                        <span className="font-black text-xs text-indigo-600">
                          {row.attendancePercent?.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-5 text-center font-black text-xs text-rose-400">{row.daysLate}</td>
                      <td className="p-5 text-center">
                        <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                          {row.score}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <button
                          onClick={() => window.open(`/dashboard/attendance/report/${row.userId}?month=${month}`, '_blank')}
                          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md group-hover:scale-105 active:scale-95"
                        >
                          Deep Report
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
