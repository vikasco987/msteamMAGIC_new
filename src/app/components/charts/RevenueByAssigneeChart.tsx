"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Define the precise type for each data point in the chart
interface AssigneeRevenueData {
  assignee: string; // Corresponds to dataKey="assignee" in YAxis
  revenue: number;   // Corresponds to dataKey="revenue" in Bar
}

// FIX: Changed 'data: any[]' to 'data: AssigneeRevenueData[]'
export default function RevenueByAssigneeChart({ data }: { data: AssigneeRevenueData[] }) {
  // It's good practice to handle cases where data might be empty or not an array
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-gray-500 text-center p-4">No revenue by assignee data available.</p>;
  }

  return (
    <div className="p-4 bg-white shadow-md rounded-xl border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">Revenue by Assignee</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart layout="vertical" data={data}>
          <XAxis type="number" />
          <YAxis dataKey="assignee" type="category" />
          <Tooltip />
          <Bar dataKey="revenue" fill="#38bdf8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}