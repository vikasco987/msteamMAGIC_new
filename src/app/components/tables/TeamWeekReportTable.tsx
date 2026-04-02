"use client";

import React, { useEffect, useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { ChevronLeft, ChevronRight, Users, IndianRupee, ArrowUp, ArrowDown, Search, Calendar, Maximize2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type WeekReport = {
  week: string;
  startDate: string;
  endDate: string;
  totalLeads: number;
  totalRevenue: number;
  amountReceived: number;
  pendingAmount: number;
};

interface TeamWeekReportTableProps {
  tlId?: string;
  memberId?: string;
  startDate?: string;
  endDate?: string;
}

export default function TeamWeekReportTable({ tlId, memberId, startDate, endDate }: TeamWeekReportTableProps) {
  const router = useRouter();
  const [data, setData] = useState<WeekReport[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / limit);

  const fetchData = async () => {
    try {
      let url = `/api/stats/team/week-report?page=${page}&limit=${limit}`;
      if (memberId) url += `&memberId=${memberId}`;
      else if (tlId) url += `&tlId=${tlId}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      const res = await fetch(url);
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error("Failed to load team weekly report:", err);
      setData([]);
      setTotal(0);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, tlId, memberId, startDate, endDate]);

  const getTrendIndicator = (currentValue: number, previousValue?: number, reverse?: boolean) => {
    if (previousValue === undefined) return null;
    if (reverse) {
      if (currentValue < previousValue) return <ArrowDown size={14} className="text-emerald-500" />;
      if (currentValue > previousValue) return <ArrowUp size={14} className="text-rose-500" />;
    } else {
      if (currentValue > previousValue) return <ArrowUp size={14} className="text-emerald-500" />;
      if (currentValue < previousValue) return <ArrowDown size={14} className="text-rose-500" />;
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 transition-all duration-300">
      <div className="mb-8 border-b border-slate-100 dark:border-slate-800 pb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Team Week-over-Week Report</h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Weekly aggregated team performance</p>
        </div>
        <button 
          onClick={() => router.push(`/tl-dashboard/week-report?tlId=${tlId || ""}&memberId=${memberId || ""}`)}
          className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-2xl hover:text-indigo-600 transition-all shadow-sm"
        >
          <Maximize2 size={20} />
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4 text-slate-400">
             <Calendar size={32} />
          </div>
          <p className="text-slate-500 font-bold">No weekly data available for this squad.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Week Range</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-right">Projects</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-right">Revenue</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-right">Received</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-right">Pending</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-right">Pending %</th>
                </tr>
              </thead>
              <tbody>
                {data.map((week, i) => {
                  const prevWeek = data[i + 1];
                  const completionPercentage = week.totalRevenue > 0 ? (week.amountReceived / week.totalRevenue) * 100 : 0;
                  const pendingPercentage = week.totalRevenue > 0 ? (week.pendingAmount / week.totalRevenue) * 100 : 0;

                  return (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0"
                    >
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                            <span className="font-black text-slate-700 dark:text-slate-300">
                                Week of {format(new Date(week.week), "d MMM yyyy")}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                {format(new Date(week.startDate), "d MMM")} - {format(new Date(week.endDate), "d MMM")}
                            </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-white">
                        <div className="flex items-center justify-end gap-2">
                          {week.totalLeads}
                          {getTrendIndicator(week.totalLeads, prevWeek?.totalLeads)}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-white">
                        <div className="flex items-center justify-end gap-2 text-indigo-500">
                          ₹{week.totalRevenue.toLocaleString()}
                          {getTrendIndicator(week.totalRevenue, prevWeek?.totalRevenue)}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center justify-end gap-2 font-black text-emerald-500">
                            ₹{week.amountReceived.toLocaleString()}
                            {getTrendIndicator(week.amountReceived, prevWeek?.amountReceived)}
                          </div>
                          {week.totalRevenue > 0 && (
                            <div className="w-20 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${completionPercentage}%` }}
                                className="h-full bg-emerald-500"
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 font-black text-amber-500">
                          ₹{week.pendingAmount.toLocaleString()}
                          {getTrendIndicator(week.pendingAmount, prevWeek?.pendingAmount, true)}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex flex-col items-end gap-1.5 font-black text-rose-500">
                            <span>{pendingPercentage.toFixed(1)}%</span>
                            {week.totalRevenue > 0 && (
                                <div className="w-20 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        style={{ width: `${pendingPercentage}%` }}
                                        className="h-full bg-rose-500"
                                    />
                                </div>
                            )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap justify-between items-center mt-8 gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setPage(1);
                  setLimit(Number(e.target.value));
                }}
                className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-1.5 text-xs font-black text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              >
                {[5, 10, 20, 50].map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:text-indigo-500 transition-all shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                Page {page} <span className="text-slate-300 dark:text-slate-600 px-1">/</span> {totalPages || 1}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:text-indigo-500 transition-all shadow-sm"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
