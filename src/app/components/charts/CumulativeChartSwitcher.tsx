"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

// Define the types for individual data arrays
type DayDataEntry = { date: string; cumulativeRevenue: number };
type WeekDataEntry = { week: string; cumulativeRevenue: number };
type MonthDataEntry = { month: string; cumulativeRevenue: number };

// Define the overall ChartProps
type ChartProps = {
  dayData: DayDataEntry[];
  weekData: WeekDataEntry[];
  monthData: MonthDataEntry[];
};

// Define the type for combined chart data
interface CombinedChartData {
  label: string;
  day: number | null;
  week: number | null;
  month: number | null;
}

const TABS = ["Day", "Week", "Month", "Combined"];

const colorMap = {
  Day: {
    stroke: "#3b82f6", // Blue
    fill: "#bfdbfe", // Light blue
  },
  Week: {
    stroke: "#10b981", // Green
    fill: "#bbf7d0", // Light green
  },
  Month: {
    stroke: "#a855f7", // Purple
    fill: "#e9d5ff", // Light purple
  },
};

export default function CumulativeRevenueTabs({
  dayData,
  weekData,
  monthData,
}: ChartProps) {
  const [activeTab, setActiveTab] = useState("Day");

  const renderChart = () => {
    if (activeTab === "Combined") {
      // Merge all into a single array with aligned x-axis
      // FIX (Line 47): Replace 'any[]' with the actual type 'CombinedChartData[]'
      const combined: CombinedChartData[] = [];
      const allKeys = new Set<string>();

      dayData.forEach((d) => allKeys.add(d.date));
      weekData.forEach((d) => allKeys.add(d.week));
      monthData.forEach((d) => allKeys.add(d.month));

      const sortedKeys = Array.from(allKeys).sort();

      for (const key of sortedKeys) {
        combined.push({
          label: key,
          day: dayData.find((d) => d.date === key)?.cumulativeRevenue ?? null,
          week: weekData.find((d) => d.week === key)?.cumulativeRevenue ?? null,
          month: monthData.find((d) => d.month === key)?.cumulativeRevenue ?? null,
        });
      }

      return (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={combined}>
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="day"
              stroke={colorMap.Day.stroke}
              fill={colorMap.Day.fill}
              name="Daily"
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="week"
              stroke={colorMap.Week.stroke}
              fill={colorMap.Week.fill}
              name="Weekly"
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="month"
              stroke={colorMap.Month.stroke}
              fill={colorMap.Month.fill}
              name="Monthly"
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    // Define a union type for the data entries to be used in chartMap
    type ChartDataEntry = DayDataEntry | WeekDataEntry | MonthDataEntry;

    // FIX (Line 103): Replace 'any[]' in `data` with 'ChartDataEntry[]'
    const chartMap: Record<
      string,
      { labelKey: keyof ChartDataEntry; data: ChartDataEntry[]; stroke: string; fill: string }
    > = {
      Day: {
        labelKey: "date",
        data: dayData,
        ...colorMap.Day,
      },
      Week: {
        labelKey: "week",
        data: weekData,
        ...colorMap.Week,
      },
      Month: {
        labelKey: "month",
        data: monthData,
        ...colorMap.Month,
      },
    };

    const { labelKey, data, stroke, fill } = chartMap[activeTab];

    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <XAxis dataKey={labelKey} />
          <YAxis />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="cumulativeRevenue"
            stroke={stroke}
            fill={fill}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6 mt-6">
      <h2 className="text-xl font-bold mb-4">📊 Cumulative Revenue (Area)</h2>

      {/* Tab Buttons */}
      <div className="flex space-x-2 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium border transition-all ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {renderChart()}
    </div>
  );
}