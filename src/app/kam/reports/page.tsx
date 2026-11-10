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
  FaDatabase,
  FaLayerGroup,
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
  teamType?: "Retention" | "Onboarding" | "Digital" | "Other";
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

  // CRM Database Selection: "primary" (Current CRM), "secondary" (Other Server CRM), "master" (Combined Both CRMs)
  const [selectedSource, setSelectedSource] = useState<"primary" | "secondary" | "master">("master");
  const [hasSecondaryDb, setHasSecondaryDb] = useState(true);
  const [primaryCount, setPrimaryCount] = useState(0);
  const [secondaryCount, setSecondaryCount] = useState(0);

  // Active Tab: "teams" (Onboarding & Digital) or "assign2" (Legacy Assign_2.0)
  const [activeTab, setActiveTab] = useState<"teams" | "assign2">("teams");

  // Manage Teams Modal State
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editableTeams, setEditableTeams] = useState<TeamConfig[]>([]);
  const [allAvailableUsers, setAllAvailableUsers] = useState<{ id: string; name: string }[]>([]);
  const [isSavingTeams, setIsSavingTeams] = useState(false);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<{ [teamIdx: number]: string }>({});

  const fetchReport = async (source = selectedSource) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kam/reports?source=${source}`);
      const data = await res.json();
      if (res.ok) {
        setAssign2Data(data.assign2Data || []);
        setTeamGroups(data.teamGroups || []);
        setRetentionSummary(data.retentionSummary || []);
        setRetentionBreakdown(data.retentionBreakdown || []);
        setOverallStatusTotals(data.overallStatusTotals || null);
        setTotalCount(data.totalTasksCount || 0);
        setHasSecondaryDb(data.hasSecondaryDb ?? true);
        setPrimaryCount(data.primaryCount || 0);
        setSecondaryCount(data.secondaryCount || 0);
      }
    } catch (e) {
      console.error("Report fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedSource);
  }, [selectedSource]);

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
      if (res.ok) {
        setIsTeamModalOpen(false);
        fetchReport();
      } else {
        alert("Failed to save team configurations");
      }
    } catch (err) {
      console.error("Error saving teams", err);
      alert("Error saving team configuration");
    } finally {
      setIsSavingTeams(false);
    }
  };

  const handleAddMemberToTeam = (teamIdx: number) => {
    const userName = selectedUserToAdd[teamIdx];
    if (!userName) return;

    setEditableTeams((prev) => {
      const clone = [...prev];
      if (!clone[teamIdx].members.includes(userName)) {
        clone[teamIdx] = {
          ...clone[teamIdx],
          members: [...clone[teamIdx].members, userName],
        };
      }
      return clone;
    });

    setSelectedUserToAdd((prev) => ({ ...prev, [teamIdx]: "" }));
  };

  const handleRemoveMember = (teamIdx: number, memberName: string) => {
    setEditableTeams((prev) => {
      const clone = [...prev];
      clone[teamIdx] = {
        ...clone[teamIdx],
        members: clone[teamIdx].members.filter((m) => m !== memberName),
      };
      return clone;
    });
  };

  // Totals for Assign_2.0
  const assign2TotalCustomers = assign2Data.reduce(
    (acc, row) => acc + row.totalCustomer,
    0
  );
  const assign2TotalActive = assign2Data.reduce(
    (acc, row) => acc + row.activeCustomer,
    0
  );
  const assign2TotalRenewal = assign2Data.reduce(
    (acc, row) => acc + row.waitingRenewal,
    0
  );

  // Totals for Retention Summary
  const retSummaryTotalCx = retentionSummary.reduce(
    (acc, row) => acc + row.totalCx,
    0
  );
  const retSummaryTotalActive = retentionSummary.reduce(
    (acc, row) => acc + row.active,
    0
  );

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
                Live Customer Status, Retention, Onboarding & Digital Team distribution analytics ({totalCount} total accounts)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openTeamManager}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <FaUserCog /> Team Members Setup (Retention, Onboarding, Digital)
            </button>
            <button
              onClick={() => fetchReport(selectedSource)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <FaSync className={loading ? "animate-spin" : ""} /> Refresh Data
            </button>
          </div>
        </div>

        {/* Database Source Switcher: Master CRM Combined vs Single CRM */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <FaDatabase className="text-lg" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                CRM Database View
                {selectedSource === "master" && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                    Combined Master View
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-500">
                View individual CRM reports or combined Master CRM analytics from both databases safely (Read-Only).
              </p>
            </div>
          </div>

          <div className="flex items-center bg-gray-100/80 p-1.5 rounded-xl border border-gray-200 text-xs font-bold w-full md:w-auto">
            <button
              type="button"
              onClick={() => setSelectedSource("master")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedSource === "master"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-700 hover:text-indigo-600"
              }`}
            >
              <FaLayerGroup /> Master CRM (Combined: {primaryCount + secondaryCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedSource("primary")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition-all cursor-pointer ${
                selectedSource === "primary"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              Current CRM ({primaryCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedSource("secondary")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition-all cursor-pointer ${
                selectedSource === "secondary"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              Secondary CRM ({secondaryCount})
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
                    {overallStatusTotals?.growing ?? 0}
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-purple-200/80 text-purple-800 rounded-md">
                    Outlets
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-rose-100/70 border border-rose-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-black uppercase text-rose-900 tracking-wider">Need To Focus</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-rose-950">
                    {overallStatusTotals?.needToFocus ?? 0}
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-rose-200/80 text-rose-800 rounded-md">
                    Priority
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100/70 border border-amber-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-black uppercase text-amber-900 tracking-wider">Conflict For week</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-amber-950">
                    {overallStatusTotals?.conflictForWeek ?? 0}
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-200/80 text-amber-800 rounded-md">
                    Issue
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/70 border border-indigo-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-black uppercase text-indigo-900 tracking-wider">Ask_For_Renewal</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-indigo-950">
                    {overallStatusTotals?.askForRenewal ?? 0}
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-200/80 text-indigo-800 rounded-md">
                    Renewal
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-pink-50 to-pink-100/70 border border-pink-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-black uppercase text-pink-900 tracking-wider">cretical_outlet</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-pink-950">
                    {overallStatusTotals?.creticalOutlet ?? 0}
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-pink-200/80 text-pink-800 rounded-md">
                    Critical
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-black uppercase text-slate-800 tracking-wider">No Response</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900">
                    {overallStatusTotals?.customerNotResponse ?? 0}
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                    Pending
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-100 to-gray-200/70 border border-gray-300 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-black uppercase text-gray-800 tracking-wider">Currently Off</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-gray-900">
                    {overallStatusTotals?.outletCurrentlyOff ?? 0}
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-gray-300 text-gray-800 rounded-md">
                    Off
                  </span>
                </div>
              </div>
            </div>

            {/* Middle Section: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left Column: Team View (Onboarding & Digital) OR Assign_2.0 Tab */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab("teams")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        activeTab === "teams"
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      Team View (Onboarding & Digital)
                    </button>
                    <button
                      onClick={() => setActiveTab("assign2")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        activeTab === "assign2"
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      Assign_2.0 View
                    </button>
                  </div>
                  <span className="text-xs text-gray-400 font-semibold">
                    {activeTab === "teams" ? "Team Performance" : "Individual Assigners"}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  {activeTab === "teams" ? (
                    <table className="w-full text-sm text-center border-collapse">
                      <thead>
                        <tr className="bg-[#6366f1] text-white font-bold text-xs uppercase tracking-wider">
                          <th className="px-4 py-3 text-left border-r border-indigo-400">Team Name</th>
                          <th className="px-4 py-3 text-left border-r border-indigo-400">TL Name</th>
                          <th className="px-4 py-3 text-left border-r border-indigo-400">Member</th>
                          <th className="px-3 py-3 border-r border-indigo-400">CRM Role</th>
                          <th className="px-3 py-3 border-r border-indigo-400">Total Cx</th>
                          <th className="px-3 py-3 border-r border-indigo-400">Active</th>
                          <th className="px-3 py-3">Renewal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-gray-800">
                        {teamGroups.map((group, gIdx) => (
                          <React.Fragment key={gIdx}>
                            {group.members.map((member, mIdx) => (
                              <tr
                                key={mIdx}
                                className="hover:bg-indigo-50/30 transition-colors"
                              >
                                {mIdx === 0 && (
                                  <td
                                    rowSpan={group.members.length}
                                    className="px-4 py-2.5 text-left font-black text-gray-900 bg-gray-50/50 border-r border-gray-200 align-top"
                                  >
                                    <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-900 rounded-lg text-xs font-black">
                                      {group.teamName}
                                    </span>
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
                          <tr key={idx} className="hover:bg-purple-50/30 transition-colors">
                            <td className="px-4 py-2.5 text-left font-bold text-gray-900 border-r border-gray-200">
                              {row.name}
                            </td>
                            <td className="px-4 py-2.5 font-bold border-r border-gray-200">
                              {row.totalCustomer}
                            </td>
                            <td className="px-4 py-2.5 font-bold text-emerald-700 bg-emerald-50/20 border-r border-gray-200">
                              {row.activeCustomer}
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-blue-700">
                              {row.waitingRenewal}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-purple-100/60 font-extrabold text-purple-950 border-t-2 border-purple-200">
                          <td className="px-4 py-3 text-left">Total</td>
                          <td className="px-4 py-3 border-r border-purple-200">{assign2TotalCustomers}</td>
                          <td className="px-4 py-3 text-emerald-800 border-r border-purple-200">{assign2TotalActive}</td>
                          <td className="px-4 py-3 text-blue-800">{assign2TotalRenewal}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              </div>

              {/* Right Column: Retention Team Summary */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-center border-collapse">
                    <thead>
                      <tr className="bg-[#fcd34d] text-amber-950 font-bold text-xs">
                        <th className="px-4 py-3 text-left border-r border-amber-300">Retention Team</th>
                        <th className="px-4 py-3 border-r border-amber-300">Total Cx</th>
                        <th className="px-4 py-3">Active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-800">
                      {retentionSummary.map((row, idx) => (
                        <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                          <td className="px-4 py-2.5 text-left font-bold text-gray-900 border-r border-gray-200">
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

            {/* Bottom Table: Team Status Breakdown (Retention + Onboarding + Digital) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                    Team Status Breakdown (Retention, Onboarding & Digital)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Live outlet statuses mapped across Retention, Onboarding, and Digital department members.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">Retention</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">Onboarding</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px]">Digital</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center border-collapse">
                  <thead>
                    <tr className="font-bold text-xs">
                      <th className="bg-[#bbf7d0] text-emerald-950 px-4 py-3 text-left border-r border-emerald-300">
                        Member Name
                      </th>
                      <th className="bg-[#dcfce7] text-emerald-950 px-3 py-3 border-r border-emerald-200">
                        Team
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
                        <td className="px-3 py-2.5 font-bold text-xs border-r border-gray-200">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            row.teamType === "Onboarding"
                              ? "bg-amber-100 text-amber-800"
                              : row.teamType === "Digital"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {row.teamType || "Retention"}
                          </span>
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
                        <td colSpan={9} className="px-4 py-6 text-gray-400 text-xs italic">
                          No status breakdown data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#dbeafe] text-blue-950 font-extrabold border-t-2 border-blue-200">
                      <td colSpan={2} className="px-4 py-3 text-left">Total</td>
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

      {/* Modal: Setup Onboarding & Digital Teams */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <FaUsers className="text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Configure Team Members</h3>
                  <p className="text-xs text-gray-500">
                    Add or remove members belonging to Retention, Onboarding, or Digital to reflect them in the Performance Report and Filters.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
              {editableTeams.map((team, tIdx) => (
                <div key={tIdx} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black uppercase text-purple-700 tracking-wider">
                        {team.teamName} Team
                      </span>
                      <p className="text-xs text-gray-500 font-medium">Team Leader: <strong className="text-gray-800">{team.tlName}</strong></p>
                    </div>
                  </div>

                  {/* Member Tags */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {team.members.map((m, mIdx) => (
                      <span
                        key={mIdx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-800 shadow-xs"
                      >
                        {m}
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(tIdx, m)}
                          className="text-gray-400 hover:text-rose-500 transition-colors ml-0.5"
                          title="Remove member"
                        >
                          <FaTimes className="text-[10px]" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add Member Dropdown */}
                  <div className="flex items-center gap-2 pt-2">
                    <select
                      value={selectedUserToAdd[tIdx] || ""}
                      onChange={(e) =>
                        setSelectedUserToAdd((prev) => ({
                          ...prev,
                          [tIdx]: e.target.value,
                        }))
                      }
                      className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Select Member to Add --</option>
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
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <FaPlus /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTeams}
                disabled={isSavingTeams}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow transition-all flex items-center gap-2 disabled:opacity-50"
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
