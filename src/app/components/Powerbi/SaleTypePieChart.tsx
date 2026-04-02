"use client";

import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F"];

export default function SaleTypePieChart() {
  const [data, setData] = useState<{ type: string; value: number }[]>([]);

  useEffect(() => {
    fetch("/api/stats/powerdash/sales-by-type")
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData([])); // fallback to empty array
  }, []);

  return (
    <div className="bg-white border border-gray-200 shadow-md rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-4">🧾 Sales by Type</h2>
      {data.length === 0 ? (
        <p className="text-gray-500">No data available</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="type"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
