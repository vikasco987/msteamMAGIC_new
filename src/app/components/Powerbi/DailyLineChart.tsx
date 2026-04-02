"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import React from "react";

export default function DailyLineChart({ data }: { data: any[] }) {
  return (
    <div className="bg-blue-900 p-4 rounded-lg text-white">
      <h2 className="text-lg mb-2">Daily Sales</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="day" stroke="#fff" />
          <YAxis stroke="#fff" />
          <Tooltip />
          <Line type="monotone" dataKey="sale" stroke="#34d399" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
