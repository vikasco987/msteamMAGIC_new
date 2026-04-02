"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type ChartData = {
  week: string;
  cumulativeRevenue: number;
};

export default function CumulativeRevenueChart({ data }: { data: ChartData[] }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="p-4 bg-white shadow-md rounded-xl border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Cumulative Revenue Growth</h2>
        <p>No chart data available</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white shadow-md rounded-xl border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">Cumulative Revenue Growth</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="cumulativeRevenue"
            stroke="#38bdf8"
            fill="#bae6fd"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
