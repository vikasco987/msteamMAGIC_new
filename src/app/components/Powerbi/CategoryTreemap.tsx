"use client";
import { Treemap, Tooltip, ResponsiveContainer } from "recharts";
import React from "react";

export default function CategoryTreemap({ data }: { data: any[] }) {
  return (
    <div className="bg-blue-900 p-4 rounded-lg text-white">
      <h2 className="text-lg mb-2">Category Performance</h2>
      <ResponsiveContainer width="100%" height={300}>
        <Treemap
          data={data}
          dataKey="value"
          nameKey="category"
          stroke="#fff"
          fill="#3b82f6"
        >
          <Tooltip />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
