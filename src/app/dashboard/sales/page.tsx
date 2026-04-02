"use client";

import { useEffect, useState } from "react";
import SalesBarChart from '../../components/SalesBarChart';


export default function SalesDashboardPage() {
  const [salesData, setSalesData] = useState([]);
  const [filter, setFilter] = useState("2025");

  useEffect(() => {
    fetch(`/api/sales?year=${filter}`)
      .then((res) => res.json())
      .then((data) => setSalesData(data));
  }, [filter]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Sales Dashboard</h1>

      <div className="flex gap-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
        </select>
      </div>

      <SalesBarChart data={salesData} />
    </div>
  );
}
