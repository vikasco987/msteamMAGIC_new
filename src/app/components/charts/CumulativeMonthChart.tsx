"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// Define the precise type for each data point in the monthly chart
interface CumulativeMonthData {
  month: string; // Corresponds to dataKey="month" in XAxis
  cumulativeRevenue: number; // Corresponds to dataKey="cumulativeRevenue" in Area
}

// FIX: Changed 'data: any[]' to 'data: CumulativeMonthData[]'
export default function CumulativeMonthChart({ data }: { data: CumulativeMonthData[] }) {
  // It's a good practice to handle cases where data might be empty or not an array
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-gray-500 text-center p-4">No cumulative monthly revenue data available.</p>;
  }

  return (
    <div className="p-4 bg-white shadow-md rounded-xl border border-gray-200 mb-6">
      <h2 className="text-lg font-semibold mb-4">📅 Cumulative Monthly Revenue</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="cumulativeRevenue"
            stroke="#4f46e5"
            fill="#c7d2fe"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}