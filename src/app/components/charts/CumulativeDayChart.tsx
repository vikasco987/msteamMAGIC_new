"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// Define the type for each data point in the chart
interface CumulativeDayData {
  date: string;
  cumulativeRevenue: number;
}

export default function CumulativeDayChart({ data }: { data: CumulativeDayData[] }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-gray-500">No chart data available</p>;
  }

  return (
    <div className="p-4 bg-white shadow-md rounded-xl border border-gray-200 mt-6">
      <h2 className="text-lg font-semibold mb-4">📈 Cumulative Revenue Growth (Daily)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="cumulativeRevenue"
            stroke="#22c55e"
            fill="#bbf7d0"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}