"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Users,
  Building,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  Download,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ChevronDown,
  Layers,
  Sparkles,
  PieChart as PieChartIcon,
  HelpCircle,
  X,
  Eye,
  EyeOff,
  Settings,
  RotateCcw,
  Sliders,
  Check,
} from "lucide-react";
import * as XLSX from "xlsx";

const PIE_COLORS = ["#10B981", "#F59E0B", "#6366F1", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"];

export default function OnboardingReportsPage() {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);

  // Global advanced filters
  const [dateRange, setDateRange] = useState<string>("last7Days"); // default 'last7Days'
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("All");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");
  const [taskScope, setTaskScope] = useState<string>("allTasks"); // 'allTasks' | 'onboardingOnly'

  // Employee Visibility Management
  const [hiddenEmployees, setHiddenEmployees] = useState<string[]>([]);
  const [isEmployeeManagerOpen, setIsEmployeeManagerOpen] = useState<boolean>(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState<string>("");

  // Load hidden employees from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("onboarding_reports_hidden_employees");
      if (saved) {
        setHiddenEmployees(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const saveHiddenEmployees = (newHidden: string[]) => {
    setHiddenEmployees(newHidden);
    try {
      localStorage.setItem("onboarding_reports_hidden_employees", JSON.stringify(newHidden));
    } catch {}
  };

  const toggleEmployeeVisibility = (empName: string) => {
    const lower = empName.toLowerCase();
    const exists = hiddenEmployees.some((h) => h.toLowerCase() === lower);
    let updated: string[];
    if (exists) {
      updated = hiddenEmployees.filter((h) => h.toLowerCase() !== lower);
    } else {
      updated = [...hiddenEmployees, empName];
    }
    saveHiddenEmployees(updated);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setDateRange("last7Days");
    setDateFrom("");
    setDateTo("");
    setSelectedEmployee("All");
    setSelectedPlatform("All");
    setSelectedStatus("All");
    setSelectedPriority("All");
    setTaskScope("allTasks");
  };

  // Drilldown Modal
  const [drilldownTitle, setDrilldownTitle] = useState<string | null>(null);
  const [drilldownRecords, setDrilldownRecords] = useState<any[]>([]);
  const [drilldownFilterText, setDrilldownFilterText] = useState<string>("");

  // Detailed Restaurant Drawer
  const [detailRecord, setDetailRecord] = useState<any | null>(null);

  // Fetch report data
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("dateRange", dateRange);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (selectedEmployee !== "All") params.append("employee", selectedEmployee);
      if (selectedPlatform !== "All") params.append("platform", selectedPlatform);
      if (selectedStatus !== "All") params.append("status", selectedStatus);
      if (selectedPriority !== "All") params.append("priority", selectedPriority);
      params.append("scope", taskScope);
      if (hiddenEmployees.length > 0) {
        params.append("hiddenEmployees", hiddenEmployees.join(","));
      }

      const res = await fetch(`/api/onboarding/reports?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange, dateFrom, dateTo, selectedEmployee, selectedPlatform, selectedStatus, selectedPriority, taskScope, hiddenEmployees]);

  const currentData = data;

  // Filter options from API
  const employeeOptions = useMemo(() => {
    if (data?.filters?.employees && data.filters.employees.length > 0) {
      return ["All", ...data.filters.employees];
    }
    return ["All"];
  }, [data]);

  const platformOptions = useMemo(() => {
    if (data?.filters?.platforms && data.filters.platforms.length > 0) {
      return ["All", ...data.filters.platforms];
    }
    return ["All", "Swiggy", "Zomato", "Both", "Toing", "Only", "FSSAI / License", "Other"];
  }, [data]);

  const statusOptions = useMemo(() => {
    if (data?.filters?.statuses && data.filters.statuses.length > 0) {
      return ["All", ...data.filters.statuses];
    }
    return ["All", "Live", "Pending", "Duplicate", "In Progress", "todo", "done"];
  }, [data]);

  const priorityOptions = useMemo(() => {
    if (data?.filters?.priorities && data.filters.priorities.length > 0) {
      return ["All", ...data.filters.priorities];
    }
    return ["All", "Normal", "High"];
  }, [data]);

  // Drill down trigger
  const openDrilldown = (title: string, records: any[]) => {
    setDrilldownTitle(title);
    setDrilldownRecords(records);
    setDrilldownFilterText("");
  };

  // Export current report to Excel
  const handleExportExcel = () => {
    const rawList = currentData?.rawRecords || drilldownRecords || [];
    if (rawList.length === 0) {
      alert("No data available to export");
      return;
    }
    const cleanList = rawList.map((r: any) => ({
      "Shop / Restaurant Name": r.shopName,
      "Customer Name": r.customerName,
      "Phone": r.phone,
      "Task Title": r.title,
      "Platform": r.platform,
      "Status Category": r.accountStatus,
      "Display Status": r.displayStatus,
      "Assigned To": r.assignedTo,
      "All Assignees": Array.isArray(r.assignedEmployees) ? r.assignedEmployees.join(", ") : r.assignedTo,
      "Onboarded By": r.onboardedBy,
      "Restaurant ID": r.restaurantId,
      "FSSAI Number": r.fssaiNumber,
      "Priority": r.priority,
      "Age Days": r.ageDays,
      "Aging Bucket": r.agingBucket,
      "Created At": r.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : "",
      "Updated At": r.updatedAt ? new Date(r.updatedAt).toLocaleString("en-IN") : "",
      "Remarks": r.remarks,
    }));

    const worksheet = XLSX.utils.json_to_sheet(cleanList);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "OnboardingReport");
    XLSX.writeFile(workbook, `Onboarding_BI_Report_${dateRange}_${Date.now()}.xlsx`);
  };

  // Filtered Drilldown Records
  const visibleDrilldownList = useMemo(() => {
    if (!drilldownFilterText.trim()) return drilldownRecords;
    const q = drilldownFilterText.toLowerCase();
    return drilldownRecords.filter(
      (r) =>
        r.shopName?.toLowerCase().includes(q) ||
        r.restaurantId?.toLowerCase().includes(q) ||
        r.fssaiNumber?.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q) ||
        r.assignedTo?.toLowerCase().includes(q) ||
        (Array.isArray(r.assignedEmployees) && r.assignedEmployees.some((e: string) => e.toLowerCase().includes(q))) ||
        r.platform?.toLowerCase().includes(q)
    );
  }, [drilldownRecords, drilldownFilterText]);

  // Employee Visibility List
  const filteredAllEmployeesForManager = useMemo(() => {
    const list = data?.filters?.allEmployeesWithVisibility || [];
    if (!employeeSearchQuery.trim()) return list;
    const q = employeeSearchQuery.toLowerCase();
    return list.filter((e: any) => e.name.toLowerCase().includes(q));
  }, [data, employeeSearchQuery]);

  const tabs = [
    { id: 1, label: "Overview Dashboard", icon: Layers },
    { id: 2, label: "Employee Performance", icon: Users },
    { id: 3, label: "Platform-wise Analysis", icon: Building },
    { id: 4, label: "Pending & Ageing", icon: Clock },
    { id: 5, label: "Daily / Monthly Trend", icon: TrendingUp },
    { id: 6, label: "Duplicate & Re-Onboard", icon: AlertTriangle },
    { id: 7, label: "Data Quality Audit", icon: ShieldCheck },
    { id: 8, label: "Outlet Creation", icon: FileSpreadsheet },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* ─── Top Header ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-200 font-bold text-lg">
                🍽️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Onboarding Business Intelligence & Analytics
                  </h1>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Real Database Sync</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Accurate multi-assignee attribution, dynamic platform support, aging buckets & employee visibility
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Back to Onboarding Table */}
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition"
              >
                <span>← Back to Table</span>
              </Link>

              {/* Task Scope Filter (All Tasks vs Onboarding Only) */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setTaskScope("allTasks")}
                  className={`px-2.5 py-1 rounded-md transition ${
                    taskScope === "allTasks" ? "bg-white text-purple-700 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Include all operation & onboarding tasks in calculations"
                >
                  All Tasks (2,600+)
                </button>
                <button
                  type="button"
                  onClick={() => setTaskScope("onboardingOnly")}
                  className={`px-2.5 py-1 rounded-md transition ${
                    taskScope === "onboardingOnly" ? "bg-white text-purple-700 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Filter to strict 5 Onboarding titles"
                >
                  Strict Onboarding Only
                </button>
              </div>

              {/* Export to Excel */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
              >
                <Download size={13} />
                <span>Export Excel</span>
              </button>

              {/* Refresh */}
              <button
                type="button"
                onClick={fetchReportData}
                disabled={loading}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition disabled:opacity-50"
                title="Refresh Analytics from Database"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Global Advanced Filter Bar ──────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Filter size={14} className="text-purple-600" />
            <span className="font-bold text-slate-800">Advanced Filters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Range Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <Calendar size={13} className="text-slate-400" />
              <label className="text-slate-500">Date Range:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7Days">Last 7 Days</option>
                <option value="last15Days">Last 15 Days</option>
                <option value="last30Days">Last 30 Days</option>
                <option value="thisWeek">This Week</option>
                <option value="lastWeek">Last Week</option>
                <option value="thisMonth">This Month (Nov 2026)</option>
                <option value="lastMonth">Last Month (Oct 2026)</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {/* Custom Date Inputs if custom selected */}
            {dateRange === "custom" && (
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border border-slate-200 rounded-md px-2 py-0.5 text-xs text-slate-700 focus:outline-none"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border border-slate-200 rounded-md px-2 py-0.5 text-xs text-slate-700 focus:outline-none"
                />
              </div>
            )}

            {/* Employee Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <Users size={13} className="text-slate-400" />
              <label className="text-slate-500">Employee:</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer max-w-[130px] truncate"
              >
                {employeeOptions.map((emp) => (
                  <option key={emp} value={emp}>
                    {emp === "All" ? "All Employees" : emp}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Platform Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <Building size={13} className="text-slate-400" />
              <label className="text-slate-500">Platform:</label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer max-w-[120px] truncate"
              >
                {platformOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <ShieldCheck size={13} className="text-slate-400" />
              <label className="text-slate-500">Status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer max-w-[110px] truncate"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <label className="text-slate-500">Priority:</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                {priorityOptions.map((pr) => (
                  <option key={pr} value={pr}>
                    {pr}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition font-medium flex items-center gap-1"
              title="Reset all filters"
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── Top 4 Executive Summary Cards ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
              Executive Overview • Real-Time Database Metrics
            </h2>
            <span className="text-[11px] text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full font-medium">
              💡 Click any card below for instant Drill Down
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Total Matching: <strong className="text-slate-900">{currentData?.overview?.totalOnboarding ?? 0}</strong> records
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Onboarding */}
          <div
            onClick={() => openDrilldown("Total Onboarding Records", currentData?.rawRecords || [])}
            className="group relative bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-purple-300 transition cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-6 -mt-6 transition group-hover:bg-purple-100/70" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Tasks
                </span>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                  Active Filter
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {currentData?.overview?.totalOnboarding ?? 0}
                </span>
                <span className="text-xs text-slate-500 font-medium">All records</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 group-hover:text-purple-600 flex items-center gap-1 font-medium transition">
                <span>Click to drill down</span>
                <ChevronRight size={12} />
              </p>
            </div>
          </div>

          {/* Card 2: Live Accounts */}
          <div
            onClick={() =>
              openDrilldown(
                "Live Accounts (Done & Activated)",
                (currentData?.rawRecords || []).filter((r: any) => r.accountStatus === "Live")
              )
            }
            className="group relative bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-6 -mt-6 transition group-hover:bg-emerald-100/70" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Live Accounts
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {currentData?.overview?.distribution?.livePct ?? 0}% of total
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                  {currentData?.overview?.liveAccounts ?? 0}
                </span>
                <span className="text-xs text-slate-500 font-medium">Accounts Live</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 group-hover:text-emerald-600 flex items-center gap-1 font-medium transition">
                <span>Click to drill down ({currentData?.overview?.liveAccounts ?? 0} restaurants)</span>
                <ChevronRight size={12} />
              </p>
            </div>
          </div>

          {/* Card 3: Pending */}
          <div
            onClick={() =>
              openDrilldown(
                "Pending Tasks Requiring Follow-up",
                (currentData?.rawRecords || []).filter((r: any) => r.accountStatus === "Pending")
              )
            }
            className="group relative bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-amber-300 transition cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-6 -mt-6 transition group-hover:bg-amber-100/70" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Pending
                </span>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                  {currentData?.overview?.distribution?.pendingPct ?? 0}%
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-600 tracking-tight">
                  {currentData?.overview?.pending ?? 0}
                </span>
                <span className="text-xs text-slate-500 font-medium">Action Required</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 group-hover:text-amber-600 flex items-center gap-1 font-medium transition">
                <span>View pending queue</span>
                <ChevronRight size={12} />
              </p>
            </div>
          </div>

          {/* Card 4: Duplicate */}
          <div
            onClick={() =>
              openDrilldown(
                "Duplicate Listing Records",
                (currentData?.rawRecords || []).filter((r: any) => r.accountStatus === "Duplicate")
              )
            }
            className="group relative bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-rose-300 transition cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-6 -mt-6 transition group-hover:bg-rose-100/70" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Duplicate
                </span>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                  {currentData?.overview?.distribution?.duplicatePct ?? 0}%
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-rose-600 tracking-tight">
                  {currentData?.overview?.duplicate ?? 0}
                </span>
                <span className="text-xs text-slate-500 font-medium">Flagged</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 group-hover:text-rose-600 flex items-center gap-1 font-medium transition">
                <span>View duplicate details</span>
                <ChevronRight size={12} />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Navigation Tabs ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-purple-600 text-white shadow-sm shadow-purple-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}>
                    {tab.id}
                  </span>
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </section>

      {/* ─── Main Reports Content Body ────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* =========================================================================
            REPORT 1: Onboarding Overview Dashboard
        ========================================================================== */}
        {activeTab === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    1. Onboarding Analytics & Account Status Distribution
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real database-backed conversions, completion ratios and status breakdown
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                    Live Rate: {currentData?.overview?.distribution?.livePct ?? 0}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-center">
                {/* Visual Chart */}
                <div className="lg:col-span-7 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Live", value: currentData?.overview?.distribution?.livePct ?? 0 },
                          { name: "Pending", value: currentData?.overview?.distribution?.pendingPct ?? 0 },
                          { name: "Other", value: currentData?.overview?.distribution?.otherPct ?? 0 },
                          { name: "Duplicate", value: currentData?.overview?.distribution?.duplicatePct ?? 0 },
                        ].filter((d) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {PIE_COLORS.map((col, index) => (
                          <Cell key={`cell-${index}`} fill={col} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value}%`, "Share"]} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Status Breakdown Legend & Drill-down cards */}
                <div className="lg:col-span-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Account Status Breakdown
                  </h4>

                  <div
                    onClick={() =>
                      openDrilldown(
                        "Live Accounts",
                        (currentData?.rawRecords || []).filter((r: any) => r.accountStatus === "Live")
                      )
                    }
                    className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-emerald-50 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <div>
                        <div className="font-bold text-xs text-slate-800">Live ({currentData?.overview?.liveAccounts ?? 0})</div>
                        <div className="text-[11px] text-slate-500">Platform activated & published</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-sm text-emerald-700">
                        {currentData?.overview?.distribution?.livePct ?? 0}%
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">Click to view</div>
                    </div>
                  </div>

                  <div
                    onClick={() =>
                      openDrilldown(
                        "Pending Accounts",
                        (currentData?.rawRecords || []).filter((r: any) => r.accountStatus === "Pending")
                      )
                    }
                    className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-amber-50 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div>
                        <div className="font-bold text-xs text-slate-800">Pending ({currentData?.overview?.pending ?? 0})</div>
                        <div className="text-[11px] text-slate-500">In process or waiting approval</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-sm text-amber-700">
                        {currentData?.overview?.distribution?.pendingPct ?? 0}%
                      </div>
                      <div className="text-[10px] text-amber-600 font-medium">Click to view</div>
                    </div>
                  </div>

                  <div
                    onClick={() =>
                      openDrilldown(
                        "Other Accounts",
                        (currentData?.rawRecords || []).filter(
                          (r: any) => r.accountStatus !== "Live" && r.accountStatus !== "Pending" && r.accountStatus !== "Duplicate"
                        )
                      )
                    }
                    className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-indigo-50 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-indigo-500" />
                      <div>
                        <div className="font-bold text-xs text-slate-800">Other / In Progress</div>
                        <div className="text-[11px] text-slate-500">Under verification / Hold</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-sm text-indigo-700">
                        {currentData?.overview?.distribution?.otherPct ?? 0}%
                      </div>
                      <div className="text-[10px] text-indigo-600 font-medium">Click to view</div>
                    </div>
                  </div>

                  <div
                    onClick={() =>
                      openDrilldown(
                        "Duplicate Accounts",
                        (currentData?.rawRecords || []).filter((r: any) => r.accountStatus === "Duplicate")
                      )
                    }
                    className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-rose-50 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500" />
                      <div>
                        <div className="font-bold text-xs text-slate-800">Duplicate ({currentData?.overview?.duplicate ?? 0})</div>
                        <div className="text-[11px] text-slate-500">Already exists on platform</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-sm text-rose-700">
                        {currentData?.overview?.distribution?.duplicatePct ?? 0}%
                      </div>
                      <div className="text-[10px] text-rose-600 font-medium">Click to view</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            REPORT 2: Employee Performance Report & Visibility Manager
        ========================================================================== */}
        {activeTab === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  2. Employee Performance & Onboarding Efficiency Report
                </h3>
                <p className="text-xs text-slate-500">
                  Shows all employees with assigned tasks (including multi-assignee attribution). Real database counts.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Employee Visibility Management Button */}
                <button
                  type="button"
                  onClick={() => setIsEmployeeManagerOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition"
                >
                  <Settings size={13} />
                  <span>Manage Employee Visibility ({hiddenEmployees.length} hidden)</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4 text-center">Total Tasks Assigned</th>
                    <th className="py-3 px-4 text-center">Live Accounts</th>
                    <th className="py-3 px-4 text-center">Pending Tasks</th>
                    <th className="py-3 px-4 text-center">Duplicate</th>
                    <th className="py-3 px-4 text-center">Live Conversion %</th>
                    <th className="py-3 px-4 text-center">Avg Onboarding Time</th>
                    <th className="py-3 px-4 text-center">Re-Onboard Count</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(currentData?.employeePerformance || []).length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No employees found matching the current filters.
                      </td>
                    </tr>
                  ) : (
                    (currentData?.employeePerformance || []).map((emp: any, idx: number) => (
                      <tr key={emp.employee || idx} className="hover:bg-purple-50/30 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                              {emp.employee[0]?.toUpperCase() || "E"}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900">{emp.employee}</span>
                              <div className="text-[10px] text-slate-400">Operations Team</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              openDrilldown(
                                `Tasks Assigned to ${emp.employee}`,
                                (currentData?.rawRecords || []).filter(
                                  (r: any) =>
                                    r.assignedEmployees?.includes(emp.employee) ||
                                    r.assignedTo === emp.employee ||
                                    r.onboardedBy === emp.employee
                                )
                              )
                            }
                            className="font-bold text-slate-800 hover:text-purple-600 underline decoration-dotted text-sm"
                          >
                            {emp.assigned}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700">
                            {emp.live}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-700">
                            {emp.pending}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700">
                            {emp.duplicate}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-purple-600 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, emp.liveConversionPct)}%` }}
                              />
                            </div>
                            <span className="font-extrabold text-slate-800">{emp.liveConversionPct}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-600">
                          {emp.avgDays}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                            {emp.reOnboardCount}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openDrilldown(
                                `All Records for ${emp.employee}`,
                                (currentData?.rawRecords || []).filter(
                                  (r: any) =>
                                    r.assignedEmployees?.includes(emp.employee) ||
                                    r.assignedTo === emp.employee ||
                                    r.onboardedBy === emp.employee
                                )
                              )
                            }
                            className="px-2.5 py-1 text-[11px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                          >
                            Drill Down →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            REPORT 3: Platform-wise Report (Dynamic from DB)
        ========================================================================== */}
        {activeTab === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(currentData?.platformWise || []).map((plat: any) => (
                <div
                  key={plat.platform}
                  onClick={() =>
                    openDrilldown(
                      `${plat.platform} Onboarding Tasks`,
                      (currentData?.rawRecords || []).filter((r: any) => r.platform === plat.platform)
                    )
                  }
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-purple-300 hover:shadow-md transition cursor-pointer"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                        {plat.platform === "Swiggy"
                          ? "🍔"
                          : plat.platform === "Zomato"
                          ? "🍽️"
                          : plat.platform === "Both"
                          ? "🍔🍽️"
                          : plat.platform === "Toing"
                          ? "📱"
                          : plat.platform === "Only"
                          ? "⚡"
                          : plat.platform === "FSSAI / License"
                          ? "📜"
                          : "🏢"}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{plat.platform}</h4>
                        <p className="text-[10px] text-slate-400">Platform Analytics</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      {plat.conversionRate} Conv.
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Total Tasks:</span>
                      <span className="font-extrabold text-slate-900 text-sm">{plat.total}</span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-700">
                      <span>Live Accounts:</span>
                      <span className="font-bold">{plat.live}</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-700">
                      <span>Pending Tasks:</span>
                      <span className="font-bold">{plat.pending}</span>
                    </div>
                    <div className="flex justify-between items-center text-rose-700">
                      <span>Duplicates:</span>
                      <span className="font-bold">{plat.duplicate}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-right">
                    <span className="text-[11px] font-semibold text-purple-600 hover:underline">
                      View {plat.platform} Records →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            REPORT 4: Pending & Ageing Report (Distinguished Buckets)
        ========================================================================== */}
        {activeTab === 4 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    4. Pending Task Ageing Distribution
                  </h3>
                  <p className="text-xs text-slate-500">
                    Distinguished by business age buckets: 0–1d, 2–3d, 4–7d, 8–15d, 16–30d, and 30+ days
                  </p>
                </div>
                <div className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  Critical 30+ Days: {currentData?.pendingAgeing?.summary?.find((b: any) => b.range === "30+ Days")?.records ?? 0} Records
                </div>
              </div>

              {/* Ageing Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
                {(currentData?.pendingAgeing?.summary || []).map((bucket: any) => (
                  <div
                    key={bucket.range}
                    onClick={() => {
                      const list = (currentData?.rawRecords || []).filter(
                        (r: any) => r.accountStatus === "Pending" && r.agingBucket === bucket.range
                      );
                      openDrilldown(`Pending Ageing: ${bucket.range}`, list);
                    }}
                    className={`p-4 rounded-xl border text-center cursor-pointer transition hover:shadow-md ${
                      bucket.range === "30+ Days"
                        ? "bg-rose-50 border-rose-200 text-rose-900"
                        : bucket.range === "16–30 Days"
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-500">{bucket.range}</div>
                    <div className="text-2xl font-black mt-1">{bucket.records}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Pending Records</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Restaurants List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Pending Tasks Requiring Follow-up
                </span>
                <span className="text-xs text-slate-400">Showing recent pending tasks from database</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Restaurant / Shop Name</th>
                      <th className="py-3 px-4">Platform</th>
                      <th className="py-3 px-4">Assigned To</th>
                      <th className="py-3 px-4 text-center">Pending Age</th>
                      <th className="py-3 px-4 text-center">Ageing Bucket</th>
                      <th className="py-3 px-4">Last Updated</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {((currentData?.pendingAgeing?.tasks || []).length > 0
                      ? currentData.pendingAgeing.tasks
                      : (currentData?.rawRecords || []).filter((r: any) => r.accountStatus === "Pending")
                    )
                      .slice(0, 20)
                      .map((task: any, i: number) => (
                        <tr key={task.id || i} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900">{task.shopName}</span>
                            <div className="text-[10px] text-slate-400">{task.customerName || task.phone || "No customer phone"}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700">
                              {task.platform}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {task.assignedTo || "Unassigned"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              task.ageDays > 15 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                            }`}>
                              {task.ageDays} Days
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                              {task.agingBucket}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {task.updatedAt ? new Date(task.updatedAt).toLocaleDateString("en-IN") : "N/A"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setDetailRecord(task)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                            >
                              Inspect →
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            REPORT 5: Daily / Weekly / Monthly Trend
        ========================================================================== */}
        {activeTab === 5 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  5. Onboarding Trend (Created vs Live Accounts Over Time)
                </h3>
                <p className="text-xs text-slate-500">
                  Throughput and velocity aggregated directly from the Task database
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-purple-700 font-semibold bg-purple-50 px-2.5 py-1 rounded-md">
                  <div className="w-2.5 h-2.5 rounded-sm bg-purple-600" />
                  <span>Created</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md">
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  <span>Live</span>
                </span>
              </div>
            </div>

            <div className="h-80 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentData?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="label" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="created" fill="#8B5CF6" name="Created Tasks" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="live" fill="#10B981" name="Live Accounts" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* =========================================================================
            REPORT 6: Duplicate & Re-Onboarding Report
        ========================================================================== */}
        {activeTab === 6 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 uppercase">Total Duplicates Flagged</div>
                <div className="text-3xl font-extrabold text-rose-600 mt-2">
                  {currentData?.duplicateReport?.summary?.totalDuplicates ?? 0}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Identified duplicate accounts across platforms</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 uppercase">Re-Onboarding Tasks</div>
                <div className="text-3xl font-extrabold text-indigo-600 mt-2">
                  {currentData?.duplicateReport?.summary?.totalReOnboardings ?? 0}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Tasks marked with Re-Onboarding flag</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 uppercase">Duplicates by Platform</div>
                <div className="flex flex-wrap gap-2 mt-2 text-xs font-bold">
                  {Object.entries(currentData?.duplicateReport?.summary?.byPlatform || {}).map(([p, count]: any) => (
                    <span key={p} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md">
                      {p}: {count}
                    </span>
                  ))}
                  {Object.keys(currentData?.duplicateReport?.summary?.byPlatform || {}).length === 0 && (
                    <span className="text-slate-400">0 duplicate tasks found</span>
                  )}
                </div>
              </div>
            </div>

            {/* List of Duplicates */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Duplicate & Re-Onboarded Tasks
                </span>
                <span className="text-xs text-slate-400">Drill down to inspect audit history</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Restaurant</th>
                      <th className="py-3 px-4">Platform</th>
                      <th className="py-3 px-4">Restaurant ID</th>
                      <th className="py-3 px-4">Assigned To</th>
                      <th className="py-3 px-4">Status Flag</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {((currentData?.duplicateReport?.records || []).length > 0
                      ? currentData.duplicateReport.records
                      : (currentData?.rawRecords || []).filter((r: any) => r.accountStatus === "Duplicate" || r.isReOnboarding)
                    )
                      .slice(0, 15)
                      .map((item: any, i: number) => (
                        <tr key={item.id || i} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">{item.shopName}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                              {item.platform}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">{item.restaurantId || "Not assigned"}</td>
                          <td className="py-3 px-4 text-slate-700">{item.assignedTo}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                              {item.accountStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setDetailRecord(item)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                            >
                              Inspect →
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            REPORT 7: Data Quality Report
        ========================================================================== */}
        {activeTab === 7 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  7. Data Quality & Field Completeness Audit
                </h3>
                <p className="text-xs text-slate-500">
                  Identifies critical missing records: Restaurant ID, FSSAI Number, Phone Number, Onboarded By & Remarks
                </p>
              </div>
              <span className="text-xs text-purple-700 bg-purple-50 font-semibold px-3 py-1 rounded-full border border-purple-200">
                💡 Click any field row to open missing records
              </span>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Data Field</th>
                    <th className="py-3 px-4 text-center">Missing Records Count</th>
                    <th className="py-3 px-4 text-center">Data Health Status</th>
                    <th className="py-3 px-4 text-right">Drill Down Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(currentData?.dataQuality || []).map((dq: any) => {
                    const count = dq.missingCount ?? 0;
                    const isSevere = count > 15;
                    return (
                      <tr
                        key={dq.field}
                        onClick={() => {
                          const missingList = (currentData?.rawRecords || []).filter((r: any) => {
                            if (dq.key === "restaurantId") return !r.restaurantId?.trim();
                            if (dq.key === "fssaiNumber") return !r.fssaiNumber?.trim();
                            if (dq.key === "phone") return !r.phone?.trim();
                            if (dq.key === "onboardedBy") return !r.onboardedBy || r.onboardedBy === "Unassigned";
                            if (dq.key === "remarks") return !r.remarks?.trim();
                            return false;
                          });
                          openDrilldown(`Missing Data: ${dq.field}`, missingList);
                        }}
                        className="hover:bg-purple-50/40 cursor-pointer transition"
                      >
                        <td className="py-4 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-600" />
                          <span>{dq.field}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              isSevere ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {count} Missing
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-[11px] text-slate-500 font-medium">
                            {count === 0 ? "✅ 100% Complete" : `⚠️ ${count} need update`}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="px-3 py-1 text-[11px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition inline-flex items-center gap-1">
                            <span>Open Records</span>
                            <ChevronRight size={12} />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            REPORT 8: Outlet Creation Report
        ========================================================================== */}
        {activeTab === 8 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <span className="text-xs font-semibold uppercase text-slate-500">Total Outlet Created</span>
                <div className="text-3xl font-extrabold text-emerald-600 mt-2">
                  {currentData?.outletCreation?.totalCreated ?? 0}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Successfully published to POS / CRM</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <span className="text-xs font-semibold uppercase text-slate-500">Pending Outlet Creation</span>
                <div className="text-3xl font-extrabold text-amber-600 mt-2">
                  {currentData?.outletCreation?.pendingCreation ?? 0}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Awaiting merchant mapping</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <span className="text-xs font-semibold uppercase text-slate-500">Completion %</span>
                <div className="text-3xl font-extrabold text-purple-600 mt-2">
                  {currentData?.outletCreation?.completionRate ?? "0%"}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Total completion benchmark</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <span className="text-xs font-semibold uppercase text-slate-500">Restaurant ID Missing</span>
                <div className="text-3xl font-extrabold text-rose-600 mt-2">
                  {currentData?.outletCreation?.missingRestaurantId ?? 0}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Requires platform ID entry</p>
              </div>
            </div>

            {/* Outlet Creation by Employee */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Outlet Creation by Employee
                </span>
                <span className="text-xs text-slate-400">Team operational velocity</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4 text-center">Outlets Created</th>
                      <th className="py-3 px-4 text-center">Outlets Pending</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(currentData?.outletCreation?.byEmployee || []).map((row: any, i: number) => (
                      <tr key={row.employee || i} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">{row.employee}</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-700">{row.created}</td>
                        <td className="py-3 px-4 text-center font-bold text-amber-700">{row.pending}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openDrilldown(
                                `Outlets for ${row.employee}`,
                                (currentData?.rawRecords || []).filter((r: any) => r.assignedTo === row.employee)
                              )
                            }
                            className="px-2.5 py-1 text-[11px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                          >
                            Drill Down →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          EMPLOYEE VISIBILITY MANAGEMENT MODAL
      ========================================================================== */}
      {isEmployeeManagerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-base text-slate-900">Employee Visibility Settings</h3>
                <p className="text-xs text-slate-500">
                  Select which employees should appear in reports. Hiding an employee does not delete their tasks.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEmployeeManagerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={employeeSearchQuery}
                  onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                  placeholder="Search employee by name..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>

            {/* Employee List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredAllEmployeesForManager.map((emp: any) => {
                const isHidden = hiddenEmployees.some((h) => h.toLowerCase() === emp.name.toLowerCase());
                return (
                  <div
                    key={emp.name}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                  >
                    <div>
                      <span className="font-bold text-xs text-slate-900">{emp.name}</span>
                      <span className="text-[11px] text-slate-400 ml-2">({emp.totalAssigned} tasks)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleEmployeeVisibility(emp.name)}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition ${
                        isHidden
                          ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                      }`}
                    >
                      {isHidden ? (
                        <>
                          <EyeOff size={13} />
                          <span>Hidden (Click to Show)</span>
                        </>
                      ) : (
                        <>
                          <Eye size={13} />
                          <span>Visible (Click to Hide)</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => saveHiddenEmployees([])}
                className="text-purple-600 hover:text-purple-800 font-semibold"
              >
                Restore All (Make Everyone Visible)
              </button>
              <button
                type="button"
                onClick={() => setIsEmployeeManagerOpen(false)}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DRILL DOWN MODAL (Table of Records)
      ========================================================================== */}
      {drilldownTitle && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-base text-slate-900">{drilldownTitle}</h3>
                <p className="text-xs text-slate-500">
                  {visibleDrilldownList.length} total tasks matching this metric
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Search in drilldown */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={drilldownFilterText}
                    onChange={(e) => setDrilldownFilterText(e.target.value)}
                    placeholder="Search restaurant, ID, phone..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 w-56"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setDrilldownTitle(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Table Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {visibleDrilldownList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No records match current filters in this drill down.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold sticky top-0 z-10">
                      <th className="py-2.5 px-3">Restaurant / Title</th>
                      <th className="py-2.5 px-3">Platform</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Restaurant ID</th>
                      <th className="py-2.5 px-3">Assigned Employees</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {visibleDrilldownList.map((rec, i) => (
                      <tr
                        key={rec.id || i}
                        className="hover:bg-purple-50/40 cursor-pointer transition"
                        onClick={() => setDetailRecord(rec)}
                      >
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block">{rec.shopName}</span>
                          <span className="text-[10px] text-slate-400">{rec.title}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {rec.platform}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.accountStatus === "Live"
                                ? "bg-emerald-100 text-emerald-800"
                                : rec.accountStatus === "Duplicate"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {rec.displayStatus || rec.accountStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {rec.restaurantId || <span className="text-slate-300 italic">None</span>}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {Array.isArray(rec.assignedEmployees) ? rec.assignedEmployees.join(", ") : rec.assignedTo}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{rec.phone || "—"}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailRecord(rec);
                            }}
                            className="px-2 py-0.5 text-[11px] font-semibold text-purple-600 hover:text-purple-800 hover:underline"
                          >
                            View Record →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>Click any row to open the complete restaurant task audit details</span>
              <button
                type="button"
                onClick={() => setDrilldownTitle(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DETAILED RESTAURANT DRAWER / MODAL (Single Task Audit Inspector)
      ========================================================================== */}
      {detailRecord && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-end p-0">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  Restaurant Audit File
                </span>
                <h3 className="font-extrabold text-lg text-slate-900 mt-1">
                  {detailRecord.shopName}
                </h3>
                <p className="text-xs text-slate-500">Task: {detailRecord.title} • ID: {detailRecord.taskId || detailRecord.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Status Banner */}
              <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Account Status</div>
                  <div className="text-sm font-extrabold text-purple-900">
                    {detailRecord.displayStatus || detailRecord.accountStatus}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Platform</div>
                  <div className="text-sm font-bold text-slate-800">{detailRecord.platform}</div>
                </div>
              </div>

              {/* Core Information Grid */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Core Restaurant Credentials
                </h4>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Restaurant ID</span>
                    <span className="font-mono font-bold text-slate-900">
                      {detailRecord.restaurantId || "Not assigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">FSSAI Number</span>
                    <span className="font-mono font-bold text-slate-900">
                      {detailRecord.fssaiNumber || "Not entered"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Customer Phone</span>
                    <span className="font-mono font-bold text-slate-900">
                      {detailRecord.phone || "Not entered"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Outlet Created</span>
                    <span className="font-bold text-slate-900">{detailRecord.outletCreated || "Pending"}</span>
                  </div>
                </div>
              </div>

              {/* Assignment & Audit Dimensions */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Assignment & Timestamps
                </h4>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[10px] block">All Assigned Employees</span>
                    <span className="font-bold text-slate-900">
                      {Array.isArray(detailRecord.assignedEmployees)
                        ? detailRecord.assignedEmployees.join(", ")
                        : detailRecord.assignedTo}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Onboarded By</span>
                    <span className="font-bold text-slate-900">{detailRecord.onboardedBy}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Created Date</span>
                    <span className="text-slate-700">
                      {detailRecord.createdAt ? new Date(detailRecord.createdAt).toLocaleString("en-IN") : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Last Updated Date</span>
                    <span className="text-slate-700">
                      {detailRecord.updatedAt ? new Date(detailRecord.updatedAt).toLocaleString("en-IN") : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Priority</span>
                    <span className="font-bold text-slate-900">{detailRecord.priority || "Normal"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Aging</span>
                    <span className="font-bold text-slate-900">
                      {detailRecord.ageDays} Days ({detailRecord.agingBucket})
                    </span>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Remarks & Notes
                </h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-wrap">
                  {detailRecord.remarks || "No remarks logged for this record."}
                </div>
              </div>

              {/* Link to Full Task in Onboarding Table */}
              <div className="pt-2">
                <Link
                  href="/onboarding"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition shadow-xs text-xs"
                >
                  <span>Open Full Task in Onboarding Table</span>
                  <ExternalLink size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
