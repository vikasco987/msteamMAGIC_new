"use client";

import React, { useEffect, useState } from "react";

type Stats = {
  totalRevenue: number;
  amountReceived: number;
  pendingAmount: number;
  totalSales: number;
};

export default function KPICards() {
  const [data, setData] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats/powerdash/overview")
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded shadow text-gray-500">Loading...</div>
      </div>
    );
  }

  const {
    totalRevenue = 0,
    amountReceived = 0,
    pendingAmount = 0,
    totalSales = 0,
  } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} />
      <Card title="Received" value={`₹${amountReceived.toLocaleString()}`} />
      <Card title="Pending" value={`₹${pendingAmount.toLocaleString()}`} />
      <Card title="Sales" value={totalSales.toLocaleString()} />
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="p-4 border rounded shadow bg-white">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-lg font-bold text-gray-900">{value}</h3>
    </div>
  );
}
