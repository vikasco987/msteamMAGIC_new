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
  FaUserCog,
  FaPlus,
  FaTrash,
  FaCheck,
  FaTimes,
} from "react-icons/fa";

interface Assign2Row {
  name: string;
  totalCustomer: number;
  activeCustomer: number;
  waitingRenewal: number;
}

interface TeamMemberMetric {
  name: string;
  totalCustomer: number;
  activeCustomer: number;
  waitingRenewal: number;
}

interface TeamGroupData {
  teamName: string;
  tlName: string;
  members: TeamMemberMetric[];
  totalCustomer: number;
  activeCustomer: number;
  waitingRenewal: number;
}

interface TeamConfig {
  teamName: string;
  tlName: string;
  members: string[];
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
  const [teamGroups, setTeamGroups] = useState<TeamGroupData[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Active Tab: "teams" (Onboarding & Digital) or "assign2" (Legacy Assign_2.0)
  const [activeTab, setActiveTab] = useState<"teams" | "assign2">("teams");

  // Manage Teams Modal State
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editableTeams, setEditableTeams] = useState<TeamConfig[]>([]);
  const [allAvailableUsers, setAllAvailableUsers] = useState<{ id: string; name: string }[]>([]);
  const [isSavingTeams, setIsSavingTeams] = useState(false);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<{ [teamIdx: number]: string }>({});

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kam/reports");
      const data = await res.json();
      if (res.ok) {
        setAssign2Data(data.assign2Data || []);
        setTeamGroups(data.teamGroups || []);
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

  const openTeamManager = async () => {
    setIsTeamModalOpen(true);
    try {
      const res = await fetch("/api/kam/reports/teams");
      const data = await res.json();
      if (res.ok && data.teams) {
        setEditableTeams(data.teams);
      }
      if (res.ok && data.allUsers) {
        setAllAvailableUsers(data.allUsers);
      }
    } catch (err) {
      console.error("Failed to load team configs", err);
    }
  };

  const handleSaveTeams = async () => {
    setIsSavingTeams(true);
    try {
      const res = await fetch("/api/kam/reports/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teams: editableTeams }),
      });
      if (!res.ok) throw new Error("Failed to save team assignments");
      setIsTeamModalOpen(false);
      await fetchReport();
    } catch (err: any) {
      alert(err.message || "Error saving team assignments");
    } finally {
      setIsSavingTeams(false);
    }
  };

  const handleAddMemberToTeam = (teamIdx: number) => {
    const memberName = selectedUserToAdd[teamIdx];
    if (!memberName) return;
    setEditableTeams((prev) => {
      const copy = [...prev];
      if (!copy[teamIdx].members.includes(memberName)) {
        copy[teamIdx] = {
          ...copy[teamIdx],
          members: [...copy[teamIdx].members, memberName],
        };
      }
      return copy;
    });
    setSelectedUserToAdd((prev) => ({ ...prev, [teamIdx]: "" }));
  };

  const handleRemoveMemberFromTeam = (teamIdx: number, memberIdx: number) => {
    setEditableTeams((prev) => {
      const copy = [...prev];
      const updatedMembers = copy[teamIdx].members.filter((_, idx) => idx !== memberIdx);
      copy[teamIdx] = { ...copy[teamIdx], members: updatedMembers };
      return copy;
    });
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
          <div className="flex items-center gap-3">
            <button
              onClick={openTeamManager}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-sm font-bold shadow-xs transition-all active:scale-95"
            >
              <FaUserCog /> Onboarding & Digital Members Setup
            </button>
            <button
              onClick={fetchReport}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow transition-all active:scale-95 disabled:opacity-50"
            >
              <FaSync className={loading ? "animate-spin" : ""} /> Refresh Data
            </button>
          </div>
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

            {/* Top Row: Two Side-by-Side Tables with Tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Table 1: Team Distribution (Onboarding & Digital) OR Legacy Assign_2.0 */}
              <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                {/* Tabs bar */}
                <div className="px-5 py-3.5 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab("teams")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeTab === "teams"
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      Onboarding & Digital Teams
                    </button>
                    <button
                      onClick={() => setActiveTab("assign2")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeTab === "assign2"
                          ? "bg-[#8b79b6] text-white shadow-xs"
                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      Assign_2.0 View
                    </button>
                  </div>
                  <button
                    onClick={openTeamManager}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1.5"
                  >
                    <FaPlus size={10} /> Edit / Add Members
                  </button>
                </div>

                <div className="overflow-x-auto flex-1">
                  {activeTab === "teams" ? (
                    <table className="w-full text-sm text-center border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold text-xs">
                          <th className="px-4 py-3 text-left border-r border-purple-500/40">Team Name</th>
                          <th className="px-4 py-3 text-left border-r border-purple-500/40">TL Name</th>
                          <th className="px-4 py-3 text-left border-r border-purple-500/40">Member Name</th>
                          <th className="px-3 py-3 border-r border-purple-500/40">CRM Dept</th>
                          <th className="px-3 py-3 border-r border-purple-500/40">Total Cx</th>
                          <th className="px-3 py-3 border-r border-purple-500/40">Active</th>
                          <th className="px-3 py-3">Renewal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-gray-800">
                        {teamGroups.map((group, gIdx) => (
                          <React.Fragment key={gIdx}>
                            {group.members.map((member, mIdx) => (
                              <tr key={`${gIdx}-${mIdx}`} className="hover:bg-purple-50/30 transition-colors">
                                {mIdx === 0 && (
                                  <td
                                    rowSpan={group.members.length}
                                    className="px-4 py-2.5 text-left font-black text-purple-950 bg-purple-50/50 border-r border-gray-200 align-top"
                                  >
                                    <div className="font-extrabold text-sm">{group.teamName}</div>
                                    <div className="text-[10px] text-purple-600 font-bold mt-1 uppercase tracking-wider">
                                      Total Cx: {group.totalCustomer}
                                    </div>
                                  </td>
                                )}
                                {mIdx === 0 && (
                                  <td
                                    rowSpan={group.members.length}
                                    className="px-4 py-2.5 text-left font-bold text-gray-800 bg-gray-50/30 border-r border-gray-200 align-top"
                                  >
                                    {group.tlName}
                                  </td>
                                )}
                                <td className="px-4 py-2 text-left font-semibold text-gray-900 border-r border-gray-200">
                                  {member.name}
                                </td>
                                <td className="px-3 py-2 text-xs font-bold text-gray-600 border-r border-gray-200">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                    group.teamName.toLowerCase().includes("onb")
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-indigo-100 text-indigo-800"
                                  }`}>
                                    {group.teamName.toLowerCase().includes("onb") ? "Onb" : "Digital"}
                                  </span>
                                </td>
                                <td className="px-3 py-2 font-bold border-r border-gray-200">
                                  {member.totalCustomer}
                                </td>
                                <td className="px-3 py-2 font-bold text-emerald-700 bg-emerald-50/30 border-r border-gray-200">
                                  {member.activeCustomer}
                                </td>
                                <td className="px-3 py-2 font-semibold text-blue-700">
                                  {member.waitingRenewal}
                                </td>
                              </tr>
                            ))}
                            {/* Team Subtotal Row */}
                            <tr className="bg-purple-50/60 font-black text-purple-950 text-xs border-b-2 border-purple-200">
                              <td colSpan={4} className="px-4 py-2 text-left uppercase tracking-wider">
                                {group.teamName} Subtotal
                              </td>
                              <td className="px-3 py-2 border-r border-purple-200">{group.totalCustomer}</td>
                              <td className="px-3 py-2 text-emerald-800 border-r border-purple-200">{group.activeCustomer}</td>
                              <td className="px-3 py-2 text-blue-800">{group.waitingRenewal}</td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 font-extrabold text-gray-900 border-t-2 border-gray-300">
                          <td colSpan={4} className="px-4 py-3 text-left">Grand Total</td>
                          <td className="px-3 py-3 border-r border-gray-200">
                            {teamGroups.reduce((acc, g) => acc + g.totalCustomer, 0)}
                          </td>
                          <td className="px-3 py-3 text-emerald-800 border-r border-gray-200">
                            {teamGroups.reduce((acc, g) => acc + g.activeCustomer, 0)}
                          </td>
                          <td className="px-3 py-3 text-blue-800">
                            {teamGroups.reduce((acc, g) => acc + g.waitingRenewal, 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  ) : (
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
                  )}
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

      {/* Modal: Manage Onboarding & Digital Members */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <FaUserCog /> Onboarding & Digital Team Setup
                </h3>
                <p className="text-xs text-purple-200 mt-0.5">
                  Bando ko Onboarding aur Digital team me assign karein
                </p>
              </div>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {editableTeams.map((team, tIdx) => (
                <div
                  key={tIdx}
                  className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full">
                        {team.teamName} Team
                      </span>
                      <span className="text-xs font-bold text-gray-500 ml-2">
                        TL: {team.tlName}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-gray-500">
                      {team.members.length} Members
                    </span>
                  </div>

                  {/* Member Tags */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {team.members.map((m, mIdx) => (
                      <span
                        key={mIdx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 shadow-2xs group"
                      >
                        {m}
                        <button
                          type="button"
                          onClick={() => handleRemoveMemberFromTeam(tIdx, mIdx)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                          title="Remove member"
                        >
                          <FaTimes size={10} />
                        </button>
                      </span>
                    ))}
                    {team.members.length === 0 && (
                      <span className="text-xs text-gray-400 italic">No members assigned.</span>
                    )}
                  </div>

                  {/* Add Member Dropdown & Input */}
                  <div className="flex items-center gap-2 pt-2">
                    <select
                      value={selectedUserToAdd[tIdx] || ""}
                      onChange={(e) =>
                        setSelectedUserToAdd((prev) => ({
                          ...prev,
                          [tIdx]: e.target.value,
                        }))
                      }
                      className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">— Select Member from CRM —</option>
                      {allAvailableUsers
                        .filter((u) => !team.members.includes(u.name))
                        .map((u) => (
                          <option key={u.id} value={u.name}>
                            {u.name}
                          </option>
                        ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleAddMemberToTeam(tIdx)}
                      disabled={!selectedUserToAdd[tIdx]}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold disabled:opacity-40 transition-colors shadow-2xs"
                    >
                      <FaPlus size={10} /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTeams}
                disabled={isSavingTeams}
                className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {isSavingTeams ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

