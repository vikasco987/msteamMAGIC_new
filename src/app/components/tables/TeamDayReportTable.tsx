"use client";

import React, { useEffect, useState, useMemo } from "react";
import { format, parseISO, isValid } from "date-fns";
import { ChevronLeft, ChevronRight, Users, IndianRupee, ArrowUpIcon, ArrowDownIcon, Search, ArrowUp, ArrowDown, Maximize2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Tooltip } from "react-tooltip";

type DayReport = {
  date: string;
  totalLeads: number;
  totalRevenue: number;
  amountReceived: number;
  pendingAmount: number;
};

type SortConfig = {
  key: keyof DayReport | 'pendingPercentage' | null;
  direction: "ascending" | "descending";
};

interface TeamDayReportTableProps {
  tlId?: string;
  memberId?: string;
  startDate?: string;
  endDate?: string;
}

export default function TeamDayReportTable({ tlId, memberId, startDate, endDate }: TeamDayReportTableProps) {
  const router = useRouter();
  const [data, setData] = useState<DayReport[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "date", direction: "descending" });
  const [searchQuery, setSearchQuery] = useState("");

  const totalPages = Math.ceil(total / limit);

  const fetchData = async () => {
    try {
      let url = `/api/stats/team/day-report?page=${page}&limit=${limit}`;
      if (memberId) url += `&memberId=${memberId}`;
      else if (tlId) url += `&tlId=${tlId}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      const res = await fetch(url);
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error("Failed to load team daily report:", err);
      setData([]);
      setTotal(0);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, tlId, memberId, startDate, endDate]);

  const processedData = useMemo(() => {
    const dataWithCalculations = data.map(day => ({
        ...day,
        pendingPercentage: day.totalRevenue > 0 ? (day.pendingAmount / day.totalRevenue) * 100 : 0,
    }));

    let sortedData = [...dataWithCalculations];

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      sortedData = sortedData.filter(day => {
        const dateFormatted = day.date && isValid(parseISO(day.date))
          ? format(parseISO(day.date), "d MMM yyyy")
          : "";
        
        return (
          dateFormatted.toLowerCase().includes(lowerCaseQuery) ||
          day.totalLeads.toLocaleString().includes(lowerCaseQuery) ||
          day.totalRevenue.toLocaleString().includes(lowerCaseQuery) ||
          day.amountReceived.toLocaleString().includes(lowerCaseQuery) ||
          day.pendingAmount.toLocaleString().includes(lowerCaseQuery)
        );
      });
    }

    if (sortConfig.key !== null) {
      sortedData.sort((a, b) => {
        if (sortConfig.key === "date") {
          const dateA = isValid(parseISO(a.date)) ? parseISO(a.date).getTime() : 0;
          const dateB = isValid(parseISO(b.date)) ? parseISO(b.date).getTime() : 0;
          return sortConfig.direction === "ascending" ? dateA - dateB : dateB - dateA;
        }

        const aValue = sortConfig.key === 'pendingPercentage' ? a.pendingPercentage : a[sortConfig.key as keyof DayReport];
        const bValue = sortConfig.key === 'pendingPercentage' ? b.pendingPercentage : b[sortConfig.key as keyof DayReport];

        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    return sortedData;
  }, [data, sortConfig, searchQuery]);
  
  const requestSort = (key: keyof DayReport | 'pendingPercentage') => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof DayReport | 'pendingPercentage') => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "ascending" ? <ArrowUpIcon size={14} /> : <ArrowDownIcon size={14} />;
  };

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
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Team Day-to-Day Report</h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Daily aggregated team performance</p>
        </div>
        <button 
          onClick={() => router.push(`/tl-dashboard/day-report?tlId=${tlId || ""}&memberId=${memberId || ""}`)}
          className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-2xl hover:text-indigo-600 transition-all shadow-sm"
        >
          <Maximize2 size={20} />
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4 text-slate-400">
             <Users size={32} />
          </div>
          <p className="text-slate-500 font-bold">No daily data available for this squad.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 mb-8 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20">
            <Search size={20} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 font-bold"
            />
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] cursor-pointer" onClick={() => requestSort("date")}>
                    <div className="flex items-center gap-2">Date {getSortIcon("date")}</div>
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-right cursor-pointer" onClick={() => requestSort("totalLeads")}>
                    <div className="flex items-center justify-end gap-2">Projects {getSortIcon("totalLeads")}</div>
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-right cursor-pointer" onClick={() => requestSort("totalRevenue")}>
                    <div className="flex items-center justify-end gap-2 text-indigo-500">Revenue {getSortIcon("totalRevenue")}</div>
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-right cursor-pointer" onClick={() => requestSort("amountReceived")}>
                    <div className="flex items-center justify-end gap-2 text-emerald-500">Received {getSortIcon("amountReceived")}</div>
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-right cursor-pointer" onClick={() => requestSort("pendingAmount")}>
                    <div className="flex items-center justify-end gap-2 text-amber-500">Pending {getSortIcon("pendingAmount")}</div>
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-right cursor-pointer" onClick={() => requestSort("pendingPercentage")}>
                    <div className="flex items-center justify-end gap-2">Pending % {getSortIcon("pendingPercentage")}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {processedData.map((day, i) => {
                  const prevDay = processedData[i + 1];
                  const completionPercentage = day.totalRevenue > 0 ? (day.amountReceived / day.totalRevenue) * 100 : 0;
                  const pendingPercentage = day.pendingPercentage;

                  return (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0"
                    >
                      <td className="px-6 py-5 font-black text-slate-700 dark:text-slate-300">
                        {day.date && isValid(parseISO(day.date)) ? format(parseISO(day.date), "d MMM yyyy") : "—"}
                      </td>
                      <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-white">
                        <div className="flex items-center justify-end gap-2">
                          {day.totalLeads}
                          {getTrendIndicator(day.totalLeads, prevDay?.totalLeads)}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-white">
                        <div className="flex items-center justify-end gap-2">
                          ₹{day.totalRevenue.toLocaleString()}
                          {getTrendIndicator(day.totalRevenue, prevDay?.totalRevenue)}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center justify-end gap-2 font-black text-emerald-500">
                            ₹{day.amountReceived.toLocaleString()}
                            {getTrendIndicator(day.amountReceived, prevDay?.amountReceived)}
                          </div>
                          {day.totalRevenue > 0 && (
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
                          ₹{day.pendingAmount.toLocaleString()}
                          {getTrendIndicator(day.pendingAmount, prevDay?.pendingAmount, true)}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex flex-col items-end gap-1.5 font-black text-rose-500">
                            <span>{pendingPercentage.toFixed(1)}%</span>
                            {day.totalRevenue > 0 && (
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
                {[5, 10, 25, 50].map((num) => (
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
