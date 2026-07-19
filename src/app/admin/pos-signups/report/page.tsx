"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { CalendarDays, ArrowLeft, TrendingUp } from "lucide-react";

interface DailyReport {
  date: string;
  count: number;
}

export default function POSDailyReportPage() {
  const { user } = useUser();
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [reportData, setReportData] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async (pageNum = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/pos-signups/report?page=${pageNum}`);
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
    fetchData(page);
  }, [page]);

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
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <CalendarDays size={16} />
                          </div>
                          <span className="font-bold text-slate-900">{formattedDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-black text-sm">
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
    </div>
  );
}
