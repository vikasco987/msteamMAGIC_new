"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, ArrowLeft, TrendingUp, X, Loader2, Phone, Mail, User } from "lucide-react";

interface DailyReport {
  date: string;
  count: number;
}

export default function POSDailyReportPage() {
  const { user } = useUser();
  const [page, setPage] = useState<number>(1);
  const [month, setMonth] = useState<string>(""); // Format: YYYY-MM
  const [totalPages, setTotalPages] = useState<number>(1);
  const [reportData, setReportData] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalUsers, setModalUsers] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const fetchData = async (pageNum = 1, filterMonth = "") => {
    setLoading(true);
    setError("");
    try {
      let url = `/api/pos-signups/report?page=${pageNum}`;
      if (filterMonth) url += `&month=${filterMonth}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch report data");
      
      setReportData(data.report);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page, month);
  }, [page, month]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMonth(e.target.value);
    setPage(1);
  };

  const handleRowClick = async (date: string) => {
    setSelectedDate(date);
    setModalLoading(true);
    setModalError("");
    setModalUsers([]);
    try {
      const res = await fetch(`/api/pos-signups?date=${date}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch users");
      setModalUsers(data.users || []);
    } catch (err: any) {
      setModalError(err.message || "Failed to load details");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link href="/admin/pos-signups" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-bold mb-2 transition-colors">
            <ArrowLeft size={16} /> Back to Sign-ups Monitor
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={28} /> POS Daily Report
          </h1>
          <p className="text-sm text-slate-500 font-medium">Day-by-day sign-up tracking from Billgsoftware POS</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700">Filter Month:</label>
          <input
            type="month"
            value={month}
            onChange={handleMonthChange}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {month && (
            <button
              onClick={() => { setMonth(""); setPage(1); }}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg transition-colors font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-slate-500 font-black uppercase text-[11px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Total Sign-ups</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      Loading report...
                    </div>
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-slate-400">
                    No data found.
                  </td>
                </tr>
              ) : (
                reportData.map((row, idx) => {
                  const dateObj = new Date(row.date);
                  const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  return (
                    <tr 
                      key={idx} 
                      onClick={() => handleRowClick(row.date)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                            <CalendarDays size={16} />
                          </div>
                          <span className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{formattedDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-black text-sm group-hover:bg-emerald-100 transition-colors">
                          {row.count}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Page <span className="font-medium text-slate-900">{page}</span> of <span className="font-medium text-slate-900">{totalPages}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Drill-down Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                Sign-ups on {format(new Date(selectedDate), "MMMM d, yyyy")}
              </h2>
              <button 
                onClick={() => setSelectedDate(null)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              {modalLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                  <Loader2 size={24} className="animate-spin text-indigo-600" />
                  Fetching details...
                </div>
              ) : modalError ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 text-center">
                  {modalError}
                </div>
              ) : modalUsers.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-medium">
                  No users found for this date.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {modalUsers.map((u) => (
                    <div key={u.id} className="p-4 border border-slate-100 rounded-xl hover:border-indigo-100 hover:shadow-md transition-all bg-slate-50/30 group">
                      <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <User size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-900 truncate">{u.name || "Unknown Name"}</h3>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            {u.role || "USER"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate font-medium">{u.phone || "No Phone"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">{u.email}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setSelectedDate(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
