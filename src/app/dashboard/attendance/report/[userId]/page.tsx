"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { 
  CheckCircle, X, Clock, MapPin, Activity, Calendar, 
  TrendingUp, Award, Percent, Hourglass, ArrowLeft, Printer, UserMinus, Info
} from "lucide-react";
import { motion } from "framer-motion";

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

function ReportContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = params.userId as string;
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

  const [logs, setLogs] = useState<Attendance[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const daysInMonth = useMemo(() => {
    const [year, monthStr] = month.split("-").map(Number);
    const currentDate = new Date();
    const lastDay = (year === currentDate.getFullYear() && (monthStr - 1) === currentDate.getMonth())
      ? currentDate.getDate()
      : new Date(year, monthStr, 0).getDate();
    
    const days = [];
    for (let i = 1; i <= lastDay; i++) {
      days.push(`${year}-${String(monthStr).padStart(2, "0")}-${String(i).padStart(2, "0")}`);
    }
    return days.reverse(); // Newest first
  }, [month]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Optimized: Fetch only this user's summary from rankings
        const rankRes = await fetch(`/api/attendance/employeerank?month=${month}`);
        const rankings = await rankRes.json();
        const userSummary = rankings.find((r: any) => r.userId === userId);
        
        // Fetch only this month's logs (still fetching all for now as API might not support user-specific yet, but we'll filter efficiently)
        const logRes = await fetch(`/api/attendance/list?month=${month}&all=true`);
        const allLogs = await logRes.json();
        const userLogs = allLogs.filter((l: any) => l.userId === userId)
          .map((r: any) => ({
             ...r, 
             date: new Date(r.date).toISOString().slice(0, 10) 
          }));
        
        setLogs(userLogs);
        
        if (userSummary) {
          const daysTillToday = daysInMonth.length;
          const present = Number(userSummary.daysPresent ?? 0);
          const half = Number(userSummary.halfDays ?? 0);
          const effectivePresent = present + (half * 0.5);
          const absent = Math.max(daysTillToday - (present + half), 0);
          const percent = daysTillToday > 0 ? (effectivePresent / daysTillToday) * 100 : 0;
          
          setSummary({
            ...userSummary,
            daysAbsent: absent,
            attendancePercent: percent
          });
        }
      } catch (err) {
        console.error("Failed to fetch report data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, month, daysInMonth]);

  function formatHours(hours?: number): string {
    if (hours == null || hours === 0) return "0h 0m";
    const totalMinutes = Math.round(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins}m`;
  }

  function formatTimeIST(dateStr?: string) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata"
    });
  }

  const getDayStatus = (date: string) => {
    const record = logs.find(l => l.date === date);
    if (!record) return { label: "ABSENT", type: "absent", color: "rose" };
    
    const hrs = record.workingHours || 0;
    if (hrs > 3 && hrs < 6) return { label: "HALF DAY", type: "half", color: "amber" };
    if (!record.checkOut && hrs < 6) return { label: "HALF DAY", type: "half", color: "amber" };
    
    return { label: "FULL DAY", type: "full", color: "emerald" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Analyzing Employee Lifecycle...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-black text-xs uppercase tracking-widest transition-all">
            <ArrowLeft size={18} />
            Dashboard
          </button>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Cycle</p>
              <p className="text-sm font-black text-slate-900">{month}</p>
            </div>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
              <Printer size={18} />
              Print Deep Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-10 space-y-10">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[48px] p-10 border border-slate-200 shadow-2xl flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12">
            <Award size={200} />
          </div>
          <div className="w-32 h-32 rounded-[40px] bg-indigo-600 flex items-center justify-center text-white text-4xl font-black border-8 border-slate-50 shadow-2xl relative shrink-0">
            {summary?.employeeName?.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 text-center md:text-left z-10">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">{summary?.employeeName}</h1>
              <span className="inline-flex items-center px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black border border-indigo-100 uppercase tracking-widest">
                RANK #{summary?.rank} {summary?.medal}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                <Percent size={16} className="text-indigo-500" />
                <span className="text-sm font-black text-slate-600">{summary?.attendancePercent?.toFixed(1)}% Attd.</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                <Award size={16} className="text-amber-500" />
                <span className="text-sm font-black text-slate-600">{summary?.score} Points</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { label: "Present", val: summary?.daysPresent, color: "emerald", icon: CheckCircle },
            { label: "Absent", val: summary?.daysAbsent, color: "rose", icon: UserMinus },
            { label: "Half Days", val: summary?.halfDays, color: "amber", icon: Clock },
            { label: "Total Hours", val: formatHours(summary?.totalWorkingHours), color: "blue", icon: Hourglass },
            { label: "Overtime", val: formatHours(summary?.overtimeHours), color: "indigo", icon: TrendingUp }
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-xl text-center group">
              <div className={`w-12 h-12 bg-${s.color}-50 rounded-2xl flex items-center justify-center text-${s.color}-500 mx-auto mb-4 border border-${s.color}-100`}>
                <s.icon size={20} />
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{s.label}</p>
              <p className={`text-2xl font-black text-${s.color}-600 leading-none`}>{s.val}</p>
            </motion.div>
          ))}
        </div>

        {/* Detailed Logs Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[48px] border border-slate-200 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
              <Activity size={18} className="text-indigo-500" />
              Detailed Attendance Lifecycle
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white">
                  <th className="p-8 text-left font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Date</th>
                  <th className="p-8 text-center font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Status</th>
                  <th className="p-8 text-center font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Check In</th>
                  <th className="p-8 text-center font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Check Out</th>
                  <th className="p-8 text-center font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Duration</th>
                  <th className="p-8 text-left font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Remarks/Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {daysInMonth.map((date, i) => {
                  const record = logs.find(l => l.date === date);
                  const status = getDayStatus(date);
                  const isWeekend = new Date(date).getDay() === 0;

                  return (
                    <tr key={i} className={`
                      transition-all group 
                      ${status.type === 'absent' ? 'bg-rose-50/30' : ''} 
                      ${status.type === 'half' ? 'bg-amber-50/30' : ''}
                      ${isWeekend && status.type === 'absent' ? 'bg-slate-50/50 opacity-60' : ''}
                    `}>
                      <td className="p-8">
                        <p className={`font-black text-base ${status.type === 'absent' ? 'text-rose-900' : 'text-slate-900'}`}>
                          {new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        {isWeekend && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Sunday</p>}
                      </td>
                      <td className="p-8 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border 
                          bg-${status.color}-50 text-${status.color}-600 border-${status.color}-100 shadow-sm`}>
                          {status.label}
                        </span>
                      </td>
                      <td className={`p-8 text-center font-bold ${status.type === 'absent' ? 'text-slate-300' : 'text-slate-600'}`}>
                        {record ? formatTimeIST(record.checkIn) : "-"}
                      </td>
                      <td className={`p-8 text-center font-bold ${status.type === 'absent' ? 'text-slate-300' : 'text-slate-600'}`}>
                        {record ? formatTimeIST(record.checkOut) : "-"}
                      </td>
                      <td className="p-8 text-center">
                        <span className={`font-black text-base ${status.type === 'absent' ? 'text-slate-300' : 'text-indigo-600'}`}>
                          {record ? formatHours(record.workingHours) : "-"}
                        </span>
                      </td>
                      <td className="p-8">
                        {record ? (
                          <div className="space-y-1">
                            {record.location && (
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                                <MapPin size={10} className="text-indigo-400" />
                                <span className="max-w-[150px] truncate">
                                  {typeof record.location === 'string' ? record.location : (record.location.address || 'Verified')}
                                </span>
                              </div>
                            )}
                            <p className="text-[10px] text-slate-500 italic">{record.remarks || record.checkInReason || "-"}</p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic">No digital activity</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        @media print {
          .print\:hidden { display: none !important; }
          body { background: white !important; }
          .max-w-7xl { max-width: 100% !important; width: 100% !important; margin: 0 !important; }
          .rounded-\[48px\] { border-radius: 0 !important; border: none !important; }
          .bg-rose-50\/30 { background-color: #fff1f2 !important; -webkit-print-color-adjust: exact; }
          .bg-amber-50\/30 { background-color: #fffbeb !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}

export default function DeepReportPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ReportContent />
    </Suspense>
  );
}
