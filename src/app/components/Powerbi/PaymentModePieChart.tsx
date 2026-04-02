"use client";
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#4f46e5", "#ec4899", "#10b981", "#f59e0b", "#3b82f6"];

type PaymentModeData = { mode: string; value: number }[];

export default function PaymentModePieChart({ data }: { data: PaymentModeData | undefined }) {
  // ✅ Safe check for undefined or invalid data
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-md text-center text-gray-500">
        No payment mode data available.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-md">
      <h2 className="text-lg font-semibold mb-4">💳 Payment Mode Distribution</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="mode"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
