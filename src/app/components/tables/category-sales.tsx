"use client";

import React, { useEffect, useState, useMemo } from "react";
import { IndianRupee, Calendar, Users, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip } from "react-tooltip"; // Assuming you have 'react-tooltip' installed

// Note: If your API is already calculating pendingPercentage (as in the last API code), 
// you can remove the calculation logic from this component's rendering loop.
// For robustness, I'll keep the calculation here for now, as it only uses the existing props.
type CategorySales = {
  category: string;
  label: string;
  totalSales: number;
  totalRevenue: number;
  amountReceived: number;
  // If API is updated, these props would also be here:
  // pendingAmount?: number;
  // pendingPercentage?: number; 
};

export default function CategorySalesTable() {
  const [data, setData] = useState<CategorySales[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Format month label (Aug 2025)
  const formatMonthLabel = (date: Date) =>
    date.toLocaleString("en-US", { month: "short", year: "numeric" });

  // Format month value (2025-08)
  const formatMonthValue = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  // Last 12 months (Use useMemo for stability)
  const monthsList = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        label: formatMonthLabel(date),
        value: formatMonthValue(date),
      };
    });
  }, []);

  // Fetch API
  const fetchData = async (month: string) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/stats/user-performance/category-sales?month=${month}`
      );
      if (!res.ok) throw new Error("Failed to fetch category sales data.");
      
      const json = await res.json();
      setData(json.data || []);
    } catch (error) {
      console.error("Failed to load category sales:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set initial month to the current month's value from the list
    if (monthsList.length > 0 && !selectedMonth) {
        const currentMonth = monthsList[0].value;
        setSelectedMonth(currentMonth);
        fetchData(currentMonth);
    }
  }, [monthsList, selectedMonth]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = e.target.value;
    setSelectedMonth(month);
    fetchData(month);
  };
  
  const selectedMonthLabel = monthsList.find(m => m.value === selectedMonth)?.label || 'Current Month';

  return (
    <div className="bg-white p-8 rounded-lg shadow-2xl border border-gray-100 font-sans text-gray-900 transition-shadow duration-300 hover:shadow-3xl">
      
      {/* Header and Month Selector */}
      <div className="mb-6 border-b pb-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          📊 Category-wise Sales
        </h2>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-blue-500" />
          <select
            value={selectedMonth}
            onChange={handleMonthChange}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
          >
            {monthsList.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Conditional Rendering: Loading, Empty, or Table */}
      {loading ? (
        <p className="text-gray-500 text-center py-10">Loading data for {selectedMonthLabel}...</p>
      ) : data.length === 0 ? (
        <p className="text-gray-500 text-center py-10 text-lg">
          No sales data available for **{selectedMonthLabel}**.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-lg">
          <table className="min-w-full text-left text-sm">
            {/* Table Header: Added Pending % */}
            <thead className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white sticky top-0 z-10">
              <tr>
                <th className="p-4 font-bold tracking-wider">Category</th>
                <th className="p-4 font-bold tracking-wider text-right">
                  Sales Count
                </th>
                <th className="p-4 font-bold tracking-wider text-right">
                  Total Revenue
                </th>
                <th className="p-4 font-bold tracking-wider text-right">
                  Amount Received
                </th>
                <th className="p-4 font-bold tracking-wider text-right">
                  Pending
                </th>
                {/* NEW COLUMN */}
                <th className="p-4 font-bold tracking-wider text-right">
                  Pending %
                </th>
              </tr>
            </thead>
            
            {/* Table Body */}
            <tbody>
              {data.map((c, idx) => {
                const pending = c.totalRevenue - c.amountReceived;
                const pendingPercentage = c.totalRevenue > 0 
                    ? (pending / c.totalRevenue) * 100 
                    : 0;

                const rowBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50";

                let percentBgColor = '';
                let percentTextColor = 'text-red-700'; // Default for high pending
                if (pendingPercentage === 0) {
                    percentBgColor = 'bg-green-100';
                    percentTextColor = 'text-green-700';
                } else if (pendingPercentage <= 10) {
                    percentBgColor = 'bg-yellow-100';
                    percentTextColor = 'text-yellow-700';
                } else {
                    percentBgColor = 'bg-red-100';
                }
                
                // Determine progress bar color based on percentage (opposite of pending)
                const receivedPercent = 100 - pendingPercentage;
                const progressBarColor = receivedPercent >= 90 ? 'bg-green-500' : (receivedPercent >= 50 ? 'bg-blue-500' : 'bg-yellow-500');

                return (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`border-b hover:bg-gray-100 transition-colors duration-200 ${rowBg}`}
                  >
                    <td className="p-4 font-bold text-gray-700">{c.label}</td>
                    
                    <td className="p-4 text-right font-semibold text-gray-600">
                      {c.totalSales.toLocaleString()}
                    </td>
                    
                    <td className="p-4 text-right font-bold text-green-700">
                      ₹{c.totalRevenue.toLocaleString()}
                    </td>
                    
                    {/* Amount Received with Progress Bar (Design from previous fix) */}
                    <td className="p-4 text-right font-bold text-blue-700">
                        <span className="flex flex-col items-end gap-1">
                            ₹{c.amountReceived.toLocaleString()}
                            {c.totalRevenue > 0 && (
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        style={{ width: `${(c.amountReceived / c.totalRevenue) * 100}%` }}
                                        className={`h-full ${progressBarColor} transition-all duration-500 ease-out`}
                                    ></div>
                                </div>
                            )}
                        </span>
                    </td>
                    
                    {/* Pending with Status Pill */}
                    <td className="p-4 text-right">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-bold inline-block min-w-[70px] text-center ${
                          pending === 0
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        ₹{pending.toLocaleString()}
                      </span>
                    </td>
                    
                    {/* NEW COLUMN: Pending % */}
                    <td className="p-4 text-right">
                        <span className="flex flex-col items-end gap-1">
                            <span className={`text-sm font-extrabold px-3 py-1 rounded-full ${percentBgColor} ${percentTextColor}`}>
                                {pendingPercentage.toFixed(1)}%
                            </span>
                            {c.totalRevenue > 0 && (
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        // Width based on pending percentage (0% to 100% of the bar)
                                        style={{ width: `${pendingPercentage}%` }}
                                        className={`h-full ${pendingPercentage === 0 ? 'bg-transparent' : 'bg-red-500'} transition-all duration-500 ease-out`}
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
      )}
      
      {/* Tooltip (Added a placeholder for completeness, assuming you might need it) */}
      <Tooltip id="pending-percent-tip" content="Percentage of total revenue that remains pending." />
    </div>
  );
}