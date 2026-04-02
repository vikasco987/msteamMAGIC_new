"use client";

import React, { useEffect, useState } from "react";

export default function ComparisonTable({ type, startDate, endDate }) {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!startDate || !endDate) return;

    fetch(
      `/api/stats/comparison-table?type=${type}&start=${startDate}&end=${endDate}&limit=10&page=${page}`
    )
      .then((res) => res.json())
      .then((res) => {
        setData(res.data);
        setTotalPages(res.totalPages);
      })
      .catch((err) => console.error("Failed to fetch comparison data", err));
  }, [type, startDate, endDate, page]);

  return (
    <div className="bg-white border rounded-xl p-4 shadow-md">
      <h2 className="text-lg font-bold mb-4 capitalize">{type} Comparison</h2>

      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Period</th>
            <th className="py-2 px-4 border-b">Sales</th>
            <th className="py-2 px-4 border-b">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row) => (
              <tr key={row.period}>
                <td className="py-2 px-4">{row.period}</td>
                <td className="py-2 px-4">{row.totalSales}</td>
                <td className="py-2 px-4">₹{row.totalRevenue}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="py-4 text-center text-gray-500">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          Page {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
