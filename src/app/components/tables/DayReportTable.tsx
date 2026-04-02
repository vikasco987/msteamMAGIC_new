"use client";

import React, { useEffect, useState, useMemo } from "react";
import { format, parseISO, isValid } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Users, IndianRupee, ArrowUpIcon, ArrowDownIcon, Search, ArrowUp, ArrowDown } from "lucide-react";
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
  key: keyof DayReport | 'pendingPercentage' | null; // Added 'pendingPercentage' for sorting
  direction: "ascending" | "descending";
};

export default function DayReportTable() {
  const [data, setData] = useState<DayReport[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "date", direction: "descending" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState<DayReport | null>(null);

  const totalPages = Math.ceil(total / limit);

  const fetchData = async () => {
    try {
      const res = await fetch(
        `/api/stats/user-performance/day-report?page=${page}&limit=${limit}`
      );
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error("Failed to load daily report:", err);
      setData([]);
      setTotal(0);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit]);

  // Memoize filtered and sorted data for performance
  const processedData = useMemo(() => {
    // 1. Map data to include calculated pendingPercentage
    const dataWithCalculations = data.map(day => ({
        ...day,
        pendingPercentage: day.totalRevenue > 0 ? (day.pendingAmount / day.totalRevenue) * 100 : 0,
    }));

    let sortedData = [...dataWithCalculations];

    // Filter data based on search query
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

    // Sort data
    if (sortConfig.key !== null) {
      sortedData.sort((a, b) => {
        // Special handling for date sorting
        if (sortConfig.key === "date") {
          const dateA = isValid(parseISO(a.date)) ? parseISO(a.date).getTime() : 0;
          const dateB = isValid(parseISO(b.date)) ? parseISO(b.date).getTime() : 0;
          return sortConfig.direction === "ascending" ? dateA - dateB : dateB - dateA;
        }

        // Special handling for 'pendingPercentage'
        const aValue = sortConfig.key === 'pendingPercentage' ? a.pendingPercentage : a[sortConfig.key as keyof DayReport];
        const bValue = sortConfig.key === 'pendingPercentage' ? b.pendingPercentage : b[sortConfig.key as keyof DayReport];

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return sortedData;
  }, [data, sortConfig, searchQuery]);
  
  const requestSort = (key: keyof DayReport | 'pendingPercentage') => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    } else if (sortConfig.key === key && sortConfig.direction === "descending") {
        // Default date sorting to descending, all others to ascending for first click
        if (key === 'date') {
            direction = "ascending"; // Cycle back to ascending for date
        } else {
            direction = "ascending";
        }
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof DayReport | 'pendingPercentage') => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === "ascending" ? <ArrowUpIcon size={14} /> : <ArrowDownIcon size={14} />;
  };

  const getTrendIndicator = (currentValue: number, previousValue?: number, reverse?: boolean) => {
    if (previousValue === undefined) return null;
    if (reverse) {
      if (currentValue < previousValue) return <ArrowDown size={14} className="text-green-500" />;
      if (currentValue > previousValue) return <ArrowUp size={14} className="text-red-500" />;
    } else {
      if (currentValue > previousValue) return <ArrowUp size={14} className="text-green-500" />;
      if (currentValue < previousValue) return <ArrowDown size={14} className="text-red-500" />;
    }
    return null;
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-2xl border border-gray-100 font-sans text-gray-900 transition-shadow duration-300 hover:shadow-3xl">
      {/* Header */}
      <div className="mb-8 border-b-2 border-gray-200 pb-4 flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Day-to-Day Report</h2>
      </div>

      {data.length === 0 ? (
        <p className="text-gray-500 text-center py-16 text-lg">
          No daily data available.
        </p>
      ) : (
        <>
          {/* Search Bar */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200 mb-6">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by date, leads, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />
          </div>

          {/* Table Container with Rounded Corners and Shadow */}
          <div className="overflow-x-auto rounded-lg shadow-lg">
            <table className="min-w-full text-left text-sm">
              {/* Sticky Header with Gradient */}
              <thead className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-bold tracking-wider cursor-pointer" data-tooltip-id="date-tip" onClick={() => requestSort("date")}>
                    <span className="flex items-center gap-2">Date {getSortIcon("date")}</span>
                  </th>
                  <th className="p-4 font-bold tracking-wider text-right cursor-pointer" data-tooltip-id="leads-tip" onClick={() => requestSort("totalLeads")}>
                    <span className="flex items-center justify-end gap-2"><Users size={16} /> Leads {getSortIcon("totalLeads")}</span>
                  </th>
                  <th className="p-4 font-bold tracking-wider text-right cursor-pointer" data-tooltip-id="revenue-tip" onClick={() => requestSort("totalRevenue")}>
                    <span className="flex items-center justify-end gap-2"><IndianRupee size={16} /> Revenue {getSortIcon("totalRevenue")}</span>
                  </th>
                  <th className="p-4 font-bold tracking-wider text-right cursor-pointer" data-tooltip-id="received-tip" onClick={() => requestSort("amountReceived")}>
                    <span className="flex items-center justify-end gap-2"><IndianRupee size={16} /> Received {getSortIcon("amountReceived")}</span>
                  </th>
                  <th className="p-4 font-bold tracking-wider text-right cursor-pointer" data-tooltip-id="pending-tip" onClick={() => requestSort("pendingAmount")}>
                    <span className="flex items-center justify-end gap-2"><IndianRupee size={16} /> Pending {getSortIcon("pendingAmount")}</span>
                  </th>
                  {/* NEW COLUMN HEADER: Pending Percentage */}
                  <th className="p-4 font-bold tracking-wider text-right cursor-pointer" data-tooltip-id="pending-percent-tip" onClick={() => requestSort("pendingPercentage")}>
                    <span className="flex items-center justify-end gap-2"><ArrowDown size={16} /> Pending % {getSortIcon("pendingPercentage")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {processedData.map((day, i) => {
                  const rowBg = i % 2 === 0 ? "bg-white" : "bg-gray-50";
                  
                  // For daily reporting, prevDay is the next item in the array if sorted descending by date
                  const prevDay = processedData[i + 1];

                  const completionPercentage = day.totalRevenue > 0 
                    ? (day.amountReceived / day.totalRevenue) * 100 
                    : 0;
                  
                  // Pending percentage is already calculated in processedData
                  const pendingPercentage = day.pendingPercentage;

                  return (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedDay(day)}
                      className={`cursor-pointer last:border-b-0 transition-colors duration-200 hover:bg-gray-100 ${rowBg}`}
                    >
                      <td className="p-4 font-bold text-gray-700">
                        {day.date && isValid(parseISO(day.date)) ? format(parseISO(day.date), "d MMM yyyy") : "—"}
                      </td>
                      <td className="p-4 font-bold text-gray-600 text-right">
                        <span className="flex items-center justify-end gap-2">
                          {day.totalLeads.toLocaleString()}
                          {getTrendIndicator(day.totalLeads, prevDay?.totalLeads)}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-gray-600 text-right">
                        <span className="flex items-center justify-end gap-2">
                          ₹{day.totalRevenue.toLocaleString()}
                          {getTrendIndicator(day.totalRevenue, prevDay?.totalRevenue)}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-gray-600 text-right">
                        <span className="flex flex-col items-end gap-1">
                          <span className="flex items-center justify-end gap-2">
                            ₹{day.amountReceived.toLocaleString()}
                            {getTrendIndicator(day.amountReceived, prevDay?.amountReceived)}
                          </span>
                          {day.totalRevenue > 0 && (
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${completionPercentage}%` }}
                                className="h-full bg-blue-500 transition-all duration-500 ease-out"
                              ></div>
                            </div>
                          )}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-gray-600 text-right">
                        <span className="flex items-center justify-end gap-2">
                          <span
                            className={`px-3 py-1 text-xs rounded-full inline-block min-w-[70px] text-center ${
                              day.pendingAmount === 0
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            ₹{day.pendingAmount.toLocaleString()}
                          </span>
                          {getTrendIndicator(day.pendingAmount, prevDay?.pendingAmount, true)}
                        </span>
                      </td>
                      {/* NEW COLUMN DATA CELL: Pending Percentage */}
                      <td className="p-4 font-bold text-gray-600 text-right">
                        <span className="flex flex-col items-end gap-1">
                            <span className="text-sm font-extrabold text-red-700">
                                {pendingPercentage.toFixed(1)}%
                            </span>
                            {day.totalRevenue > 0 && (
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        style={{ width: `${pendingPercentage}%` }}
                                        className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500 ease-out"
                                    ></div>
                                </div>
                            )}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-wrap justify-between items-center mt-6">
            {/* Rows per page selector */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <label htmlFor="limit" className="font-bold">
                Rows:
              </label>
              <select
                id="limit"
                value={limit}
                onChange={(e) => {
                  setPage(1);
                  setLimit(Number(e.target.value));
                }}
                className="border border-gray-300 rounded-lg px-2 py-1 bg-white font-bold focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
              >
                {[5, 10, 25, 50, 100].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 text-gray-500 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors duration-200"
                aria-label="Previous page"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-bold text-gray-600">
                Page {page} of {totalPages || 1}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                className="p-2 text-gray-500 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors duration-200"
                aria-label="Next page"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Tooltip Definitions */}
      <Tooltip id="date-tip" content="The specific date of the report." />
      <Tooltip id="leads-tip" content="Total number of leads acquired on this day." />
      <Tooltip id="revenue-tip" content="Total revenue generated on this day." />
      <Tooltip id="received-tip" content="Total amount paid by clients on this day." />
      <Tooltip id="pending-tip" content="The remaining unpaid balance for all work on this day." />
      <Tooltip id="pending-percent-tip" content="Percentage of total revenue that remains pending (Pending Amount / Total Revenue)." />
    </div>
  );
}