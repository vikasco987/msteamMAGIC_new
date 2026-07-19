"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ArrowLeft, BarChart3, Loader2 } from "lucide-react";

interface MonthlyReport {
  month: string;
  count: number;
}

export default function POSMonthlyReportPage() {
  const { user } = useUser();
  const router = useRouter();
  const [reportData, setReportData] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/pos-signups/monthly-report`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch report data");
      
      setReportData(data.report || []);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRowClick = (month: string) => {
    router.push(`/admin/pos-signups/report?month=${month}`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link href="/admin/pos-signups" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-bold mb-2 transition-colors">
            <ArrowLeft size={16} /> Back to Sign-ups Monitor
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-indigo-600" size={28} /> POS Monthly Report
          </h1>
          <p className="text-sm text-slate-500 font-medium">Month-on-month sign-up tracking from Billgsoftware POS</p>
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
                <th className="px-6 py-4">Month</th>
                <th className="px-6 py-4 text-right">Total Sign-ups</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 size={24} className="animate-spin text-indigo-600" />
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
                  const dateObj = new Date(row.month + "-01");
                  const formattedMonth = dateObj.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
                  return (
                    <tr 
                      key={idx} 
                      onClick={() => handleRowClick(row.month)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors shrink-0">
                            <CalendarDays size={16} />
                          </div>
                          <span className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{formattedMonth}</span>
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
      </div>
    </div>
  );
}
