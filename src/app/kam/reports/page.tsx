"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useUnifiedAuth as useUser } from "@/lib/useUnifiedAuth";
import {
  FaArrowLeft,
  FaFileAlt,
  FaSpinner,
  FaSync,
  FaUsers,
  FaUserCheck,
  FaChartPie,
} from "react-icons/fa";

interface Assign2Row {
  name: string;
  totalCustomer: number;
  activeCustomer: number;
  waitingRenewal: number;
}

interface RetentionSummaryRow {
  name: string;
  totalCx: number;
  active: number;
}

interface RetentionBreakdownRow {
  name: string;
  growing: number;
  needToFocus: number;
  conflictForWeek: number;
  askForRenewal: number;
  creticalOutlet: number;
  customerNotResponse: number;
  outletCurrentlyOff: number;
}

interface OverallStatusTotals {
  growing: number;
  needToFocus: number;
  conflictForWeek: number;
  askForRenewal: number;
  creticalOutlet: number;
  customerNotResponse: number;
  outletCurrentlyOff: number;
}

export default function KamReportsPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [assign2Data, setAssign2Data] = useState<Assign2Row[]>([]);
  const [retentionSummary, setRetentionSummary] = useState<RetentionSummaryRow[]>([]);
  const [retentionBreakdown, setRetentionBreakdown] = useState<RetentionBreakdownRow[]>([]);
  const [overallStatusTotals, setOverallStatusTotals] = useState<OverallStatusTotals | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kam/reports");
      const data = await res.json();
      if (res.ok) {
        setAssign2Data(data.assign2Data || []);
        setRetentionSummary(data.retentionSummary || []);
        setRetentionBreakdown(data.retentionBreakdown || []);
        setOverallStatusTotals(data.overallStatusTotals || null);
        setTotalCount(data.totalTasksCount || 0);
      }
    } catch (e) {
      console.error("Report fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchReport();
    }
  }, [isLoaded]);

  // Totals for Assign_2.0
  const assign2TotalCustomers = assign2Data.reduce((acc, r) => acc + r.totalCustomer, 0);
  const assign2TotalActive = assign2Data.reduce((acc, r) => acc + r.activeCustomer, 0);
  const assign2TotalWaiting = assign2Data.reduce((acc, r) => acc + r.waitingRenewal, 0);

  // Totals for Retention Summary
  const retSummaryTotalCx = retentionSummary.reduce((acc, r) => acc + r.totalCx, 0);
  const retSummaryTotalActive = retentionSummary.reduce((acc, r) => acc + r.active, 0);

  // Totals for Retention Breakdown
  const bGrowing = retentionBreakdown.reduce((acc, r) => acc + r.growing, 0);
  const bNeedToFocus = retentionBreakdown.reduce((acc, r) => acc + r.needToFocus, 0);
  const bConflict = retentionBreakdown.reduce((acc, r) => acc + r.conflictForWeek, 0);
  const bRenewal = retentionBreakdown.reduce((acc, r) => acc + r.askForRenewal, 0);
  const bCretical = retentionBreakdown.reduce((acc, r) => acc + r.creticalOutlet, 0);
  const bNoResponse = retentionBreakdown.reduce((acc, r) => acc + r.customerNotResponse, 0);
  const bCurrentlyOff = retentionBreakdown.reduce((acc, r) => acc + r.outletCurrentlyOff, 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-indigo-50/40 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <Link
              href="/kam"
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              title="Back to KAM Tracker"
            >
              <FaArrowLeft className="text-sm" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <FaChartPie className="text-indigo-600" /> Account Handling Performance Report
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Live Customer Status & Retention Team distribution analytics ({totalCount} total accounts)
              </p>
            </div>
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow transition-all active:scale-95 disabled:opacity-50"
          >
            <FaSync className={loading ? "animate-spin" : ""} /> Refresh Data
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl border border-gray-200 shadow-sm min-h-[350px]">
            <FaSpinner className="animate-spin text-4xl text-indigo-600 mb-3" />
            <p className="text-sm font-semibold text-gray-600">Generating analytics report...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top Cards: Total Status Values (Image 3 Option Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/70 border border-purple-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-black uppercase text-purple-900 tracking-wider">Growing....</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-purple-950">
                    {overallStatusTotals?.growing ?? bGrowing}
                  </span>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-200/60 px-2 py-0.5 rounded-full">Outlets</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-rose-100/70 border border-rose-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-black uppercase text-rose-900 tracking-wider">Need To Focus</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-rose-950">
                    {overallStatusTotals?.needToFocus ?? bNeedToFocus}
                  </span>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-200/60 px-2 py-0.5 rounded-full">Priority</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100/70 border border-amber-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-black uppercase text-amber-900 tracking-wider">Conflict For week</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-amber-950">
                    {overallStatusTotals?.conflictForWeek ?? bConflict}
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-full">Issue</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/70 border border-indigo-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-black uppercase text-indigo-900 tracking-wider">Ask_For_Renewal</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-indigo-950">
                    {overallStatusTotals?.askForRenewal ?? bRenewal}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-200/60 px-2 py-0.5 rounded-full">Renewal</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100/70 border border-red-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-black uppercase text-red-900 tracking-wider">cretical_outlet</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-red-950">
                    {overallStatusTotals?.creticalOutlet ?? bCretical}
                  </span>
                  <span className="text-[10px] font-bold text-red-700 bg-red-200/60 px-2 py-0.5 rounded-full">Critical</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-slate-100/70 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-black uppercase text-slate-800 tracking-wider">No response</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900">
                    {overallStatusTotals?.customerNotResponse ?? bNoResponse}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded-full">Pending</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-100 to-gray-200/70 border border-gray-300 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-black uppercase text-gray-800 tracking-wider">Currently off</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-gray-900">
                    {overallStatusTotals?.outletCurrentlyOff ?? bCurrentlyOff}
                  </span>
                  <span className="text-[10px] font-bold text-gray-600 bg-gray-300/60 px-2 py-0.5 rounded-full">Off</span>
                </div>
              </div>
            </div>

            {/* Top Row: Two Side-by-Side Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Table 1: Assign_2.0 Summary */}
              <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-center border-collapse">
                    <thead>
                      <tr className="bg-[#8b79b6] text-white font-bold text-xs">
                        <th className="px-4 py-3 text-left border-r border-[#9d8cc5]">Assign_2.0</th>
                        <th className="px-4 py-3 border-r border-[#9d8cc5]">Total Customer</th>
                        <th className="px-4 py-3 border-r border-[#9d8cc5]">Active Customer</th>
                        <th className="px-4 py-3">Waiting For renewal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-800">
                      {assign2Data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-2.5 text-left font-semibold text-gray-900 border-r border-gray-200">
                            {row.name}
                          </td>
                          <td className="px-4 py-2.5 font-bold border-r border-gray-200">
                            {row.totalCustomer}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-emerald-700 bg-emerald-50/50 border-r border-gray-200">
                            {row.activeCustomer}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-blue-700">
                            {row.waitingRenewal}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 font-extrabold text-gray-900 border-t-2 border-gray-300">
                        <td className="px-4 py-3 text-left">Total</td>
                        <td className="px-4 py-3 border-r border-gray-200">{assign2TotalCustomers}</td>
                        <td className="px-4 py-3 text-emerald-800 border-r border-gray-200">{assign2TotalActive}</td>
                        <td className="px-4 py-3 text-blue-800">{assign2TotalWaiting}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Table 2: Retention Team Summary */}
              <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-center border-collapse">
                    <thead>
                      <tr className="bg-[#fed7aa] text-amber-950 font-bold text-xs">
                        <th className="px-4 py-3 text-left border-r border-amber-300">Retention Team</th>
                        <th className="px-4 py-3 border-r border-amber-300">Total Cx</th>
                        <th className="px-4 py-3">Active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-800">
                      {retentionSummary.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-2.5 text-left font-semibold text-gray-900 bg-emerald-50/40 border-r border-gray-200">
                            {row.name}
                          </td>
                          <td className="px-4 py-2.5 font-bold border-r border-gray-200">
                            {row.totalCx}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-emerald-700">
                            {row.active}
                          </td>
                        </tr>
                      ))}
                      {retentionSummary.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-gray-400 text-xs italic">
                            No Retention team accounts found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-amber-50/60 font-extrabold text-gray-900 border-t-2 border-amber-200">
                        <td className="px-4 py-3 text-left">Total</td>
                        <td className="px-4 py-3 border-r border-gray-200">{retSummaryTotalCx}</td>
                        <td className="px-4 py-3 text-emerald-800">{retSummaryTotalActive}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Table: Retention Team Status Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center border-collapse">
                  <thead>
                    <tr className="font-bold text-xs">
                      <th className="bg-[#bbf7d0] text-emerald-950 px-4 py-3 text-left border-r border-emerald-300">
                        Retention Team
                      </th>
                      <th className="bg-[#e9d5ff] text-purple-950 px-3 py-3 border-r border-purple-200">
                        Growing....
                      </th>
                      <th className="bg-[#fecdd3] text-rose-950 px-3 py-3 border-r border-rose-200">
                        Need To Focus
                      </th>
                      <th className="bg-[#fed7aa] text-amber-950 px-3 py-3 border-r border-amber-200">
                        Conflict For week
                      </th>
                      <th className="bg-[#e9d5ff] text-purple-950 px-3 py-3 border-r border-purple-200">
                        Ask_For_Renewal
                      </th>
                      <th className="bg-[#e9d5ff] text-purple-950 px-3 py-3 border-r border-purple-200">
                        cretical_outlet
                      </th>
                      <th className="bg-[#e9d5ff] text-purple-950 px-3 py-3 border-r border-purple-200">
                        Customer_not response
                      </th>
                      <th className="bg-[#e9d5ff] text-purple-950 px-3 py-3">
                        Outlet Currently off
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-800">
                    {retentionBreakdown.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-2.5 text-left font-bold text-gray-900 border-r border-gray-200">
                          {row.name}
                        </td>
                        <td className="px-3 py-2.5 font-semibold border-r border-gray-200">{row.growing}</td>
                        <td className="px-3 py-2.5 font-semibold border-r border-gray-200">{row.needToFocus}</td>
                        <td className="px-3 py-2.5 font-semibold border-r border-gray-200">{row.conflictForWeek}</td>
                        <td className="px-3 py-2.5 font-semibold border-r border-gray-200">{row.askForRenewal}</td>
                        <td className="px-3 py-2.5 font-bold border-r border-gray-200">{row.creticalOutlet}</td>
                        <td className="px-3 py-2.5 font-semibold border-r border-gray-200">{row.customerNotResponse}</td>
                        <td className="px-3 py-2.5 font-semibold">{row.outletCurrentlyOff}</td>
                      </tr>
                    ))}
                    {retentionBreakdown.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-gray-400 text-xs italic">
                          No status breakdown data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#dbeafe] text-blue-950 font-extrabold border-t-2 border-blue-200">
                      <td className="px-4 py-3 text-left">Total</td>
                      <td className="px-3 py-3 border-r border-blue-200">{bGrowing}</td>
                      <td className="px-3 py-3 border-r border-blue-200">{bNeedToFocus}</td>
                      <td className="px-3 py-3 border-r border-blue-200">{bConflict}</td>
                      <td className="px-3 py-3 border-r border-blue-200">{bRenewal}</td>
                      <td className="px-3 py-3 border-r border-blue-200">{bCretical}</td>
                      <td className="px-3 py-3 border-r border-blue-200">{bNoResponse}</td>
                      <td className="px-3 py-3">{bCurrentlyOff}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

