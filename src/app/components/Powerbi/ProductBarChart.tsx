"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import React from "react";

export default function ProductBarChart({ data }: { data: any[] }) {
  return (
    <div className="bg-blue-900 p-4 rounded-lg text-white">
      <h2 className="text-lg mb-2">Top Products</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" stroke="#fff" />
          <YAxis dataKey="product" type="category" stroke="#fff" />
          <Tooltip />
          <Bar dataKey="value" fill="#fcd34d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
