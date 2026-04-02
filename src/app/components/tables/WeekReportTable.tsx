"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Users, IndianRupee, ArrowUp, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip } from "react-tooltip";

type WeekReport = {
  week: string;
  startDate: string;
  endDate: string;
  totalLeads: number;
  totalRevenue: number;
  amountReceived: number;
  pendingAmount: number;
};

export default function WeekReportTable() {
  const [data, setData] = useState<WeekReport[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / limit);

  const fetchData = async () => {
    try {
      const res = await fetch(
        `/api/stats/user-performance/week-report?page=${page}&limit=${limit}`
      );
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error("Failed to load week report:", err);
      setData([]);
      setTotal(0);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit]);

  const today = new Date();
  
  // Find the data for the current week
  const currentWeekData = data.find(week => 
    today >= new Date(week.startDate) && today <= new Date(week.endDate)
  );

  // Calculate overall pending percentage for the current week for the card
  const currentWeekPendingPercent = currentWeekData?.totalRevenue > 0
    ? (currentWeekData.pendingAmount / currentWeekData.totalRevenue) * 100
    : 0;

  return (
    <div className="bg-white p-8 rounded-lg shadow-2xl border border-gray-100 font-sans text-gray-900 transition-shadow duration-300 hover:shadow-3xl">
      {/* Header */}
      <div className="mb-8 border-b-2 border-gray-200 pb-4 flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Week-over-Week Report</h2>
      </div>

      {data.length === 0 ? (
        <p className="text-gray-500 text-center py-16 text-lg">
          No weekly data available.
        </p>
      ) : (
        <>
          {/* Summary Section - Displays only current week's data */}
          {currentWeekData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-purple-50 p-4 rounded-lg shadow-sm text-center">
                <p className="text-sm text-purple-700">Total Leads</p>
                <p className="text-2xl font-bold text-purple-900">{currentWeekData.totalLeads.toLocaleString()}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg shadow-sm text-center">
                <p className="text-sm text-green-700">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900">₹{currentWeekData.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm text-center">
                <p className="text-sm text-blue-700">Amount Received</p>
                <p className="text-2xl font-bold text-blue-900">₹{currentWeekData.amountReceived.toLocaleString()}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg shadow-sm text-center">
                <p className="text-sm text-red-700">Pending Amount</p>
                <p className="text-2xl font-bold text-red-900">₹{currentWeekData.pendingAmount.toLocaleString()}</p>
              </div>
              {/* NEW CARD: Pending Percentage */}
              <div className="bg-orange-50 p-4 rounded-lg shadow-sm text-center border-2 border-orange-200">
                <p className="text-sm text-orange-700 font-medium">Pending %</p>
                <p className="text-2xl font-black text-orange-900">
                    {currentWeekPendingPercent.toFixed(1)}%
                </p>
              </div>
            </div>
          )}

          {/* Table Container with Rounded Corners and Shadow */}
          <div className="overflow-x-auto rounded-lg shadow-lg">
            <table className="min-w-full text-left text-sm">
              {/* Sticky Header with Gradient */}
              <thead className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-bold tracking-wider" data-tooltip-id="week-tip">
                    <span className="flex items-center gap-2"><Calendar size={16} /> Week</span>
                  </th>
                  <th className="p-4 font-bold tracking-wider" data-tooltip-id="date-range-tip">
                    <span className="flex items-center gap-2"><Calendar size={16} /> Date Range</span>
                  </th>
                  <th className="p-4 font-bold tracking-wider text-right" data-tooltip-id="leads-tip">
                    <span className="flex items-center justify-end gap-2"><Users size={16} /> Leads</span>
                  </th>
                  <th className="p-4 font-bold tracking-wider text-right" data-tooltip-id="revenue-tip">
                    <span className="flex items-center justify-end gap-2"><IndianRupee size={16} /> Total Revenue</span>
                  </th>
                  <th className="p-4 font-bold tracking-wider text-right" data-tooltip-id="received-tip">
                    <span className="flex items-center justify-end gap-2"><IndianRupee size={16} /> Amount Received</span>
                  </th>
                  <th className="p-4 font-bold tracking-wider text-right" data-tooltip-id="pending-tip">
                    <span className="flex items-center justify-end gap-2"><IndianRupee size={16} /> Pending</span>
                  </th>
                  {/* PENDING PERCENTAGE COLUMN */}
                  <th className="p-4 font-bold tracking-wider text-right" data-tooltip-id="pending-percent-tip">
                    <span className="flex items-center justify-end gap-2"><ArrowDown size={16} /> Pending %</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((week, i) => {
                  const isCurrentWeek =
                    today >= new Date(week.startDate) && today <= new Date(week.endDate);
                  
                  // Determine the row background color
                  const rowBg = isCurrentWeek
                    ? "bg-yellow-100"
                    : i % 2 === 0
                    ? "bg-white"
                    : "bg-gray-50";

                  // Get previous week's data for comparison
                  const prevWeek = data[i + 1];

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

                  const receivedPercentage = week.totalRevenue > 0 
                    ? (week.amountReceived / week.totalRevenue) * 100 
                    : 0;

                  // Calculation for the new column
                  const pendingPercentage = week.totalRevenue > 0 
                    ? (week.pendingAmount / week.totalRevenue) * 100 
                    : 0;

                  return (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`last:border-b-0 transition-colors duration-200 hover:bg-gray-100 ${rowBg}`}
                    >
                      <td className="p-4 font-bold text-gray-700">
                        Week of {format(new Date(week.week), "d MMM yyyy")}
                      </td>
                      <td className="p-4 font-bold text-gray-600">
                        {format(new Date(week.startDate), "d MMM yyyy")} -{" "}
                        {format(new Date(week.endDate), "d MMM yyyy")}
                      </td>
                      <td className="p-4 font-bold text-gray-600 text-right">
                        <span className="flex items-center justify-end gap-2">
                          {week.totalLeads}
                          {getTrendIndicator(week.totalLeads, prevWeek?.totalLeads)}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-gray-600 text-right">
                        <span className="flex items-center justify-end gap-2">
                          ₹{week.totalRevenue.toLocaleString()}
                          {getTrendIndicator(week.totalRevenue, prevWeek?.totalRevenue)}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-gray-600 text-right">
                        <span className="flex flex-col items-end gap-1">
                          <span className="flex items-center gap-2">
                            ₹{week.amountReceived.toLocaleString()}
                            {getTrendIndicator(week.amountReceived, prevWeek?.amountReceived)}
                          </span>
                          {week.totalRevenue > 0 && (
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${receivedPercentage}%` }}
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
                              week.pendingAmount === 0
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            ₹{week.pendingAmount.toLocaleString()}
                          </span>
                          {getTrendIndicator(week.pendingAmount, prevWeek?.pendingAmount, true)}
                        </span>
                      </td>
                      {/* PENDING PERCENTAGE DATA CELL */}
                      <td className="p-4 font-bold text-gray-600 text-right">
                        <span className="flex flex-col items-end gap-1">
                            <span className="text-sm font-extrabold text-red-700">
                                {pendingPercentage.toFixed(1)}%
                            </span>
                            {week.totalRevenue > 0 && (
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
                {[5, 10, 20, 50].map((num) => (
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
      <Tooltip id="week-tip" content="The starting date of the weekly report." />
      <Tooltip id="date-range-tip" content="The start and end dates of the week." />
      <Tooltip id="leads-tip" content="Total number of leads acquired during the week." />
      <Tooltip id="revenue-tip" content="Total revenue generated from all leads in this week." />
      <Tooltip id="received-tip" content="Total amount paid by clients during this week." />
      <Tooltip id="pending-tip" content="The remaining unpaid balance for all work in this week." />
      <Tooltip id="pending-percent-tip" content="Percentage of total revenue that remains pending." />
    </div>
  );
}