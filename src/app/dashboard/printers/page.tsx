"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  PrinterIcon, 
  TruckIcon, 
  CheckCircleIcon, 
  ArrowPathIcon, 
  ExclamationTriangleIcon, 
  ArrowUturnLeftIcon 
} from "@heroicons/react/24/outline";

export default function PrintersDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetch("/api/printers")
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredPrinters = useMemo(() => {
    if (!data?.printers) return [];
    
    return data.printers.filter((p: any) => {
      if (filter === "All") return true;
      if (filter === "In Transit") return p.status === "Shipped" || p.status === "In Transit";
      if (filter === "Out for Delivery") return p.currentTrackingStatus === "Out for Delivery";
      if (filter === "Delivered") return p.currentTrackingStatus === "Delivered";
      if (filter === "RTO") return p.currentTrackingStatus === "RTO" || p.status === "Returned";
      if (filter === "Returned") return p.status === "Available" && p.rtoCount > 0;
      if (filter === "RTO -> Reused") return p.dispatchCount > 1 && p.rtoCount > 0 && p.status === "Shipped";
      if (filter === "Multiple RTO") return p.rtoCount > 1;
      return true;
    });
  }, [data, filter]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const stats = data?.stats || {};

  const statCards = [
    { label: "Total Printers", value: stats.total, icon: <PrinterIcon className="w-6 h-6" />, color: "bg-blue-50 text-blue-700", border: "border-blue-200" },
    { label: "In Transit", value: stats.inTransit, icon: <TruckIcon className="w-6 h-6" />, color: "bg-amber-50 text-amber-700", border: "border-amber-200" },
    { label: "Delivered", value: stats.delivered, icon: <CheckCircleIcon className="w-6 h-6" />, color: "bg-emerald-50 text-emerald-700", border: "border-emerald-200" },
    { label: "Currently RTO", value: stats.currentlyRTO, icon: <ExclamationTriangleIcon className="w-6 h-6" />, color: "bg-red-50 text-red-700", border: "border-red-200" },
    { label: "Returned/Available", value: stats.returned, icon: <ArrowUturnLeftIcon className="w-6 h-6" />, color: "bg-orange-50 text-orange-700", border: "border-orange-200" },
    { label: "Reused (After RTO)", value: stats.reused, icon: <ArrowPathIcon className="w-6 h-6" />, color: "bg-purple-50 text-purple-700", border: "border-purple-200" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Printer Lifecycle Funnel</h1>
            <p className="text-slate-500 mt-1 font-medium">Track printer dispatches, RTOs, and reusability over time.</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat, idx) => (
            <div key={idx} className={`p-5 rounded-2xl border ${stat.border} bg-white shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color} mb-4`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-slate-500 font-semibold mb-1">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">Printer Inventory Log</h2>
            <select 
              value={filter} 
              onChange={e => setFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none font-medium"
            >
              <option value="All">All Printers</option>
              <option value="In Transit">In Transit</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="RTO">Currently RTO / Returned</option>
              <option value="Returned">Returned (Available)</option>
              <option value="RTO -> Reused">RTO → Reused</option>
              <option value="Multiple RTO">Multiple RTOs</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-400 uppercase bg-slate-50/50 font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Printer Serial</th>
                  <th className="px-6 py-4">Current Status</th>
                  <th className="px-6 py-4">Dispatch #</th>
                  <th className="px-6 py-4">Previous RTO</th>
                  <th className="px-6 py-4">Current Task</th>
                  <th className="px-6 py-4">Tracking</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrinters.length > 0 ? filteredPrinters.map((p: any) => (
                  <tr key={p.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap">
                      {p.number}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        p.status === 'Available' ? 'bg-blue-100 text-blue-700' :
                        p.status === 'Returned' ? 'bg-orange-100 text-orange-700' :
                        p.status === 'Shipped' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600">
                      {p.dispatchCount}
                    </td>
                    <td className="px-6 py-4">
                      {p.previousRTO ? (
                        <span className="flex items-center gap-1 text-red-600 font-semibold">
                          <ExclamationTriangleIcon className="w-4 h-4" /> Yes ({p.rtoCount})
                        </span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      {p.taskTitle ? p.taskTitle : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                       <span className={`px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                        p.currentTrackingStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                        p.currentTrackingStatus === 'RTO' ? 'bg-red-50 text-red-600 border border-red-200' :
                        'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}>
                        {p.currentTrackingStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/dashboard/printers/${p.id}`}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold transition-colors"
                      >
                        View History <span aria-hidden="true">&rarr;</span>
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No printers found for the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
