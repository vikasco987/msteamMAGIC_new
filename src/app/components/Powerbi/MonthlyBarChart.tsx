"use client";
import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function MonthlyBarChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats/powerdash/monthly-revenue")
      .then((res) => res.json())
      .then((resData) => {
        // Safe fallback in case API returns object
        const safeData = Array.isArray(resData) ? resData : [];
        setData(safeData);
      })
      .catch((err) => {
        console.error("Failed to fetch monthly revenue data:", err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Loading monthly revenue...</p>;
  if (!Array.isArray(data) || data.length === 0) return <p className="text-gray-400">No data available.</p>;

  return (
    <div className="bg-white p-4 shadow rounded-lg border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">📅 Monthly Revenue</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="revenue" fill="#4f46e5" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
