"use client";

import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Record = {
  period: string;
  totalSales: number;
  totalRevenue: number;
};

export default function PeriodComparisonTable() {
  const [type, setType] = useState("day");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Record[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = () => {
    if (!startDate || !endDate) return;

    const params = new URLSearchParams({
      type,
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
      limit: limit.toString(),
      page: page.toString(),
    });

    fetch(`/api/stats/comparison-table?${params.toString()}`)
      .then((res) => res.json())
      .then((res) => {
        setData(res.data);
        setTotalPages(res.totalPages);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, [type, startDate, endDate, limit, page]);

  return (
    <div className="bg-white border rounded-xl p-6 mt-10 shadow-md">
      <h2 className="text-xl font-bold mb-6">📅 Period Sales Table</h2>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>

        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          dateFormat="yyyy-MM-dd"
          placeholderText="Start Date"
          className="border px-3 py-2 rounded"
        />

        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
          dateFormat="yyyy-MM-dd"
          placeholderText="End Date"
          className="border px-3 py-2 rounded"
        />

        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="border rounded px-3 py-2"
        >
          <option value={5}>5 entries</option>
          <option value={10}>10 entries</option>
          <option value={20}>20 entries</option>
        </select>
      </div>

      {/* Table */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Period</th>
            <th className="p-2 border">Total Sales</th>
            <th className="p-2 border">Total Revenue (₹)</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, idx) => (
              <tr key={idx} className="text-center">
                <td className="p-2 border">{row.period}</td>
                <td className="p-2 border">{row.totalSales}</td>
                <td className="p-2 border">₹{row.totalRevenue}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="p-4 text-center text-gray-500">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-center items-center mt-4 gap-2">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          Page {page} / {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
