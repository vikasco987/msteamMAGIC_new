"use client";
// src/app/components/OnboardingTable.tsx
// Complete Onboarding Management Table Component

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useUnifiedAuth as useUser } from "@/lib/useUnifiedAuth";
import toast, { Toaster } from "react-hot-toast";
import {
  FaSearch,
  FaDownload,
  FaSpinner,
  FaHistory,
  FaEdit,
  FaSave,
  FaTimes,
  FaCheck,
  FaRedo,
} from "react-icons/fa";
import {
  ClipboardList,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import PaginationControls from "./PaginationControls";

// ─── Types ────────────────────────────────────────────────────────────────────
interface OnboardingTask {
  id: string;
  taskId: string;
  title: string;
  shopName: string;
  customerName: string;
  phone: string;
  assigneeName: string;
  assignerName: string;
  taskStatus: string;
  createdAt: string;
  onboardingId: string | null;
  taskStartDate: string;
  fssaiNumber: string;
  restaurantId: string;
  isReOnboarding: boolean;
  onboardedBy: string;
  accountStatus: string;
  platform: string;
  outletCreated: string;
  remarks: string;
  hasRecord: boolean;
}

interface FilterOptions {
  titles: string[];
  assignees: string[];
  assigners: string[];
  accountStatuses: string[];
  platforms: string[];
  outletCreatedOptions: string[];
}

interface AuditEntry {
  id: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedByName: string | null;
  changedAt: string;
}

// ─── Status color helper ───────────────────────────────────────────────────────
function getAccountStatusClass(status: string) {
  switch (status) {
    case "Live":
      return "bg-green-100 text-green-800 border border-green-300";
    case "Complete":
      return "bg-blue-100 text-blue-800 border border-blue-300";
    case "In Progress":
      return "bg-yellow-100 text-yellow-800 border border-yellow-300";
    case "Duplicate":
      return "bg-gray-200 text-gray-700 border border-gray-400";
    case "Manual Uploaded":
      return "bg-purple-100 text-purple-800 border border-purple-300";
    case "Rejected":
      return "bg-red-100 text-red-800 border border-red-300";
    case "Pending":
    default:
      return "bg-orange-100 text-orange-800 border border-orange-300";
  }
}

function getPlatformClass(platform: string) {
  switch (platform) {
    case "Zomato":
      return "bg-red-100 text-red-700";
    case "Swiggy":
      return "bg-orange-100 text-orange-700";
    case "Both":
      return "bg-gradient-to-r from-red-100 to-orange-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function OnboardingTable() {
  const { user, isLoaded } = useUser();

  // ─── State ─────────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    titles: [],
    assignees: [],
    assigners: [],
    accountStatuses: [
      "Pending",
      "In Progress",
      "Live",
      "Complete",
      "Duplicate",
      "Manual Uploaded",
      "Rejected",
    ],
    platforms: ["Zomato", "Swiggy", "Both", "Other"],
    outletCreatedOptions: ["Pending", "Yes", "No"],
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [assignerFilter, setAssignerFilter] = useState("");
  const [accountStatusFilter, setAccountStatusFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [outletCreatedFilter, setOutletCreatedFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<OnboardingTask>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // Audit modal
  const [auditTaskId, setAuditTaskId] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState<any>(null);

  const queryDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Debounce search ───────────────────────────────────────────────────────
  useEffect(() => {
    if (queryDebounceRef.current) clearTimeout(queryDebounceRef.current);
    queryDebounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 400);
    return () => {
      if (queryDebounceRef.current) clearTimeout(queryDebounceRef.current);
    };
  }, [query]);

  // ─── Fetch tasks ───────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(debouncedQuery && { query: debouncedQuery }),
        ...(titleFilter && { title: titleFilter }),
        ...(assigneeFilter && { assignee: assigneeFilter }),
        ...(assignerFilter && { assigner: assignerFilter }),
        ...(accountStatusFilter && { accountStatus: accountStatusFilter }),
        ...(platformFilter && { platform: platformFilter }),
        ...(outletCreatedFilter && { outletCreated: outletCreatedFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        sortKey: "createdAt",
        sortDir: "desc",
      });

      const res = await fetch(`/api/onboarding?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      setTasks(data.tasks || []);
      setTotalItems(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
      if (data.filterOptions) setFilterOptions(data.filterOptions);
    } catch (err) {
      toast.error("Failed to load onboarding data");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    debouncedQuery,
    titleFilter,
    assigneeFilter,
    assignerFilter,
    accountStatusFilter,
    platformFilter,
    outletCreatedFilter,
    dateFrom,
    dateTo,
  ]);

  // ─── Fetch stats ───────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/onboarding/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [
    titleFilter,
    assigneeFilter,
    assignerFilter,
    accountStatusFilter,
    platformFilter,
    outletCreatedFilter,
    dateFrom,
    dateTo,
  ]);

  // ─── Edit handlers ─────────────────────────────────────────────────────────
  const startEdit = (task: OnboardingTask) => {
    setEditingId(task.taskId);
    setEditValues({
      taskStartDate: task.taskStartDate,
      fssaiNumber: task.fssaiNumber,
      restaurantId: task.restaurantId,
      isReOnboarding: task.isReOnboarding,
      onboardedBy: task.onboardedBy,
      accountStatus: task.accountStatus,
      platform: task.platform,
      outletCreated: task.outletCreated,
      remarks: task.remarks,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async (taskId: string) => {
    setSavingId(taskId);
    try {
      const res = await fetch(`/api/onboarding/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("✅ Saved successfully");
      setEditingId(null);
      setEditValues({});
      fetchTasks();
      fetchStats();
    } catch {
      toast.error("❌ Failed to save");
    } finally {
      setSavingId(null);
    }
  };

  // ─── Audit log ─────────────────────────────────────────────────────────────
  const openAuditLog = async (taskId: string) => {
    setAuditTaskId(taskId);
    setAuditLoading(true);
    try {
      const res = await fetch(`/api/onboarding/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setAuditLog(data.auditLog || []);
      }
    } catch {
      toast.error("Failed to load audit log");
    } finally {
      setAuditLoading(false);
    }
  };

  // ─── Export ────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const params = new URLSearchParams({
      ...(assigneeFilter && { assignee: assigneeFilter }),
      ...(assignerFilter && { assigner: assignerFilter }),
      ...(accountStatusFilter && { accountStatus: accountStatusFilter }),
      ...(titleFilter && { title: titleFilter }),
    });
    window.open(`/api/onboarding/export?${params}`, "_blank");
  };

  // ─── Clear filters ─────────────────────────────────────────────────────────
  const clearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setTitleFilter("");
    setAssigneeFilter("");
    setAssignerFilter("");
    setAccountStatusFilter("");
    setPlatformFilter("");
    setOutletCreatedFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const isEditing = (taskId: string) => editingId === taskId;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍽️</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Onboarding Management
            </h1>
            <p className="text-xs text-gray-500">
              Track and manage restaurant onboarding tasks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTasks}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
          >
            <FaDownload size={12} />
            Export Excel
          </button>
        </div>
      </div>

      {/* ─── Stats Cards ─────────────────────────────────────────────────────── */}
      {stats && (
        <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            {
              label: "Total Tasks",
              value: stats.totalTasks,
              color: "bg-blue-50 border-blue-200",
              textColor: "text-blue-700",
            },
            {
              label: "Pending",
              value: stats.byStatus?.pending || 0,
              color: "bg-orange-50 border-orange-200",
              textColor: "text-orange-700",
            },
            {
              label: "In Progress",
              value: stats.byStatus?.inProgress || 0,
              color: "bg-yellow-50 border-yellow-200",
              textColor: "text-yellow-700",
            },
            {
              label: "Live",
              value: stats.byStatus?.live || 0,
              color: "bg-green-50 border-green-200",
              textColor: "text-green-700",
            },
            {
              label: "Complete",
              value: stats.byStatus?.complete || 0,
              color: "bg-blue-50 border-blue-200",
              textColor: "text-blue-700",
            },
            {
              label: "Duplicate",
              value: stats.byStatus?.duplicate || 0,
              color: "bg-gray-50 border-gray-200",
              textColor: "text-gray-700",
            },
            {
              label: "Manual Upload",
              value: stats.byStatus?.manualUploaded || 0,
              color: "bg-purple-50 border-purple-200",
              textColor: "text-purple-700",
            },
            {
              label: "Rejected",
              value: stats.byStatus?.rejected || 0,
              color: "bg-red-50 border-red-200",
              textColor: "text-red-700",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`${card.color} border rounded-xl p-3 text-center cursor-pointer hover:shadow-sm transition`}
              onClick={() =>
                card.label !== "Total Tasks" &&
                setAccountStatusFilter(
                  card.label === accountStatusFilter ? "" : card.label
                )
              }
            >
              <div className={`text-2xl font-bold ${card.textColor}`}>
                {card.value}
              </div>
              <div className="text-xs text-gray-500 mt-1">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Filters ─────────────────────────────────────────────────────────── */}
      <div className="px-6 py-3 bg-white border-b">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Search restaurant, customer, phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Category */}
          <select
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value)}
            className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">All Categories</option>
            {filterOptions.titles.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Assignee */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">All Assignees</option>
            {filterOptions.assignees.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {/* Assigner */}
          <select
            value={assignerFilter}
            onChange={(e) => setAssignerFilter(e.target.value)}
            className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">All Assigners</option>
            {filterOptions.assigners.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {/* Account Status */}
          <select
            value={accountStatusFilter}
            onChange={(e) => setAccountStatusFilter(e.target.value)}
            className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">All Account Status</option>
            {filterOptions.accountStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Platform */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">All Platforms</option>
            {filterOptions.platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Outlet Created */}
          <select
            value={outletCreatedFilter}
            onChange={(e) => setOutletCreatedFilter(e.target.value)}
            className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">Outlet Created: All</option>
            {filterOptions.outletCreatedOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

          {/* Date range */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="text-sm border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
            title="From date"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="text-sm border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
            title="To date"
          />

          {/* Clear filters */}
          {(query ||
            titleFilter ||
            assigneeFilter ||
            assignerFilter ||
            accountStatusFilter ||
            platformFilter ||
            outletCreatedFilter ||
            dateFrom ||
            dateTo) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ─── Loading overlay ──────────────────────────────────────────────────── */}
      {loading && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-40 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg px-8 py-5 flex items-center gap-3">
            <FaSpinner className="animate-spin text-purple-600" size={20} />
            <span className="text-gray-700 font-medium">Loading data...</span>
          </div>
        </div>
      )}

      {/* ─── Table ───────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {[
                    "S.No",
                    "Task Created",
                    "Restaurant Name",
                    "Category",
                    "Customer",
                    "Phone",
                    "Assigned By",
                    "Assigned To",
                    "Task Start Date",
                    "FSSAI No.",
                    "Restaurant ID",
                    "Re-Onboarding",
                    "Onboarded By",
                    "Platform",
                    "Account Status",
                    "Outlet Created",
                    "Remarks",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={18}
                      className="px-6 py-16 text-center text-gray-400"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <ClipboardList size={40} className="text-gray-300" />
                        <div>
                          <p className="font-medium text-gray-500">
                            No onboarding records found
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Try adjusting your filters
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tasks.map((task, idx) => {
                    const editing = isEditing(task.taskId);
                    const sno = (page - 1) * limit + idx + 1;

                    return (
                      <tr
                        key={task.taskId}
                        className={`hover:bg-gray-50 transition ${
                          editing ? "bg-blue-50" : ""
                        }`}
                      >
                        {/* S.No */}
                        <td className="px-3 py-2.5 text-gray-500 font-medium">
                          {sno}
                        </td>

                        {/* Task Created */}
                        <td className="px-3 py-2.5 whitespace-nowrap text-gray-600">
                          {formatDate(task.createdAt)}
                        </td>

                        {/* Restaurant Name */}
                        <td className="px-3 py-2.5 font-medium text-gray-900 max-w-[180px]">
                          <div className="truncate" title={task.shopName}>
                            {task.shopName || "—"}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            {task.title
                              .replace(/^[^\w]*/, "")
                              .trim()
                              .replace("Zomato + Swiggy Combo", "Combo")}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="px-3 py-2.5 text-gray-600 max-w-[140px]">
                          <div className="truncate">{task.customerName || "—"}</div>
                        </td>

                        {/* Phone */}
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                          {task.phone || "—"}
                        </td>

                        {/* Assigned By */}
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                          {task.assignerName || "—"}
                        </td>

                        {/* Assigned To */}
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                          {task.assigneeName || "—"}
                        </td>

                        {/* Task Start Date — EDITABLE */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {editing ? (
                            <input
                              type="date"
                              value={editValues.taskStartDate || ""}
                              onChange={(e) =>
                                setEditValues((v) => ({
                                  ...v,
                                  taskStartDate: e.target.value,
                                }))
                              }
                              className="border rounded px-2 py-1 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-purple-400"
                            />
                          ) : (
                            <span className="text-gray-600">
                              {task.taskStartDate
                                ? formatDate(task.taskStartDate)
                                : "—"}
                            </span>
                          )}
                        </td>

                        {/* FSSAI — EDITABLE */}
                        <td className="px-3 py-2.5">
                          {editing ? (
                            <input
                              type="text"
                              value={editValues.fssaiNumber || ""}
                              onChange={(e) =>
                                setEditValues((v) => ({
                                  ...v,
                                  fssaiNumber: e.target.value,
                                }))
                              }
                              placeholder="FSSAI Number"
                              className="border rounded px-2 py-1 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-purple-400"
                            />
                          ) : (
                            <span className="text-gray-600 font-mono text-xs">
                              {task.fssaiNumber || "—"}
                            </span>
                          )}
                        </td>

                        {/* Restaurant ID — EDITABLE */}
                        <td className="px-3 py-2.5">
                          {editing ? (
                            <input
                              type="text"
                              value={editValues.restaurantId || ""}
                              onChange={(e) =>
                                setEditValues((v) => ({
                                  ...v,
                                  restaurantId: e.target.value,
                                }))
                              }
                              placeholder="Restaurant ID"
                              className="border rounded px-2 py-1 text-xs w-36 focus:outline-none focus:ring-1 focus:ring-purple-400"
                            />
                          ) : (
                            <span className="text-gray-600 font-mono text-xs">
                              {task.restaurantId || "—"}
                            </span>
                          )}
                        </td>

                        {/* Re-Onboarding — EDITABLE */}
                        <td className="px-3 py-2.5 text-center">
                          {editing ? (
                            <input
                              type="checkbox"
                              checked={!!editValues.isReOnboarding}
                              onChange={(e) =>
                                setEditValues((v) => ({
                                  ...v,
                                  isReOnboarding: e.target.checked,
                                }))
                              }
                              className="w-4 h-4 accent-purple-600 cursor-pointer"
                            />
                          ) : (
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                task.isReOnboarding
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {task.isReOnboarding ? "Yes" : "No"}
                            </span>
                          )}
                        </td>

                        {/* Onboarded By — EDITABLE */}
                        <td className="px-3 py-2.5">
                          {editing ? (
                            <input
                              type="text"
                              value={editValues.onboardedBy || ""}
                              onChange={(e) =>
                                setEditValues((v) => ({
                                  ...v,
                                  onboardedBy: e.target.value,
                                }))
                              }
                              placeholder="Name"
                              className="border rounded px-2 py-1 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-purple-400"
                            />
                          ) : (
                            <span className="text-gray-600">
                              {task.onboardedBy || "—"}
                            </span>
                          )}
                        </td>

                        {/* Platform — EDITABLE */}
                        <td className="px-3 py-2.5">
                          {editing ? (
                            <select
                              value={editValues.platform || ""}
                              onChange={(e) =>
                                setEditValues((v) => ({
                                  ...v,
                                  platform: e.target.value,
                                }))
                              }
                              className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                            >
                              <option value="">Select</option>
                              {filterOptions.platforms.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${getPlatformClass(
                                task.platform
                              )}`}
                            >
                              {task.platform || "—"}
                            </span>
                          )}
                        </td>

                        {/* Account Status — EDITABLE */}
                        <td className="px-3 py-2.5">
                          {editing ? (
                            <select
                              value={editValues.accountStatus || ""}
                              onChange={(e) =>
                                setEditValues((v) => ({
                                  ...v,
                                  accountStatus: e.target.value,
                                }))
                              }
                              className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                            >
                              {filterOptions.accountStatuses.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap font-medium ${getAccountStatusClass(
                                task.accountStatus
                              )}`}
                            >
                              {task.accountStatus || "Pending"}
                            </span>
                          )}
                        </td>

                        {/* Outlet Created — EDITABLE */}
                        <td className="px-3 py-2.5">
                          {editing ? (
                            <select
                              value={editValues.outletCreated || ""}
                              onChange={(e) =>
                                setEditValues((v) => ({
                                  ...v,
                                  outletCreated: e.target.value,
                                }))
                              }
                              className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                            >
                              <option value="">Select</option>
                              {filterOptions.outletCreatedOptions.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                task.outletCreated === "Yes"
                                  ? "bg-green-100 text-green-700"
                                  : task.outletCreated === "No"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {task.outletCreated || "Pending"}
                            </span>
                          )}
                        </td>

                        {/* Remarks — EDITABLE */}
                        <td className="px-3 py-2.5 max-w-[200px]">
                          {editing ? (
                            <textarea
                              value={editValues.remarks || ""}
                              onChange={(e) =>
                                setEditValues((v) => ({
                                  ...v,
                                  remarks: e.target.value,
                                }))
                              }
                              placeholder="Add remarks..."
                              rows={2}
                              className="border rounded px-2 py-1 text-xs w-44 focus:outline-none focus:ring-1 focus:ring-purple-400 resize-none"
                            />
                          ) : (
                            <div
                              className="text-gray-600 text-xs truncate max-w-[180px]"
                              title={task.remarks}
                            >
                              {task.remarks || "—"}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {editing ? (
                              <>
                                <button
                                  onClick={() => saveEdit(task.taskId)}
                                  disabled={savingId === task.taskId}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition disabled:opacity-50"
                                >
                                  {savingId === task.taskId ? (
                                    <FaSpinner className="animate-spin" size={10} />
                                  ) : (
                                    <FaSave size={10} />
                                  )}
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded-lg transition"
                                >
                                  <FaTimes size={10} />
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(task)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs rounded-lg transition"
                                  title="Edit onboarding details"
                                >
                                  <FaEdit size={10} />
                                  Edit
                                </button>
                                <button
                                  onClick={() => openAuditLog(task.taskId)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-lg transition"
                                  title="View audit log"
                                >
                                  <FaHistory size={10} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ─── Pagination ────────────────────────────────────────────────────── */}
          <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value));
                  setPage(1);
                }}
                className="border rounded px-2 py-1 text-sm focus:outline-none"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-500">
              Page {page} of {totalPages} (Total {totalItems} items)
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded border hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i + 1;
                else if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded border text-sm transition ${
                      page === pageNum
                        ? "bg-purple-600 text-white border-purple-600"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded border hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Audit Log Modal ──────────────────────────────────────────────────── */}
      {auditTaskId && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setAuditTaskId(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <FaHistory className="text-purple-600" />
                <h3 className="font-semibold text-gray-900">Audit Log</h3>
              </div>
              <button
                onClick={() => setAuditTaskId(null)}
                className="text-gray-400 hover:text-gray-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              {auditLoading ? (
                <div className="flex items-center justify-center py-8">
                  <FaSpinner className="animate-spin text-purple-600" size={20} />
                </div>
              ) : auditLog.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  No changes recorded yet
                </p>
              ) : (
                <div className="space-y-3">
                  {auditLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-gray-50 rounded-lg p-3 text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-purple-700">
                          {entry.fieldName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(entry.changedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="line-through text-red-500">
                          {entry.oldValue || "empty"}
                        </span>
                        <span>→</span>
                        <span className="text-green-600 font-medium">
                          {entry.newValue || "empty"}
                        </span>
                      </div>
                      {entry.changedByName && (
                        <div className="text-xs text-gray-400 mt-1">
                          by {entry.changedByName}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

