"use client";
// src/app/components/OnboardingTable.tsx
// Complete Onboarding Management Table Component

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
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
  FaGripVertical,
} from "react-icons/fa";
import {
  ClipboardList,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Pin,
  PinOff,
  Columns3,
  RotateCcw,
  ChevronDown,
  MessageSquare,
  Clock,
  Timer,
  Send,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  Store,
  FileText,
  Calendar,
  User,
  ShieldCheck,
  Check,
  BarChart3,
  GripVertical,
  Lock,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";
import PaginationControls from "./PaginationControls";

// ─── Reusable Multi-Select Dropdown Filter Component ──────────────────────────
interface MultiSelectFilterProps {
  label: string;
  allLabel?: string;
  options: { label: string; value: string; className?: string }[] | string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  enableSearch?: boolean;
  getItemBadgeClass?: (value: string) => string;
}

function MultiSelectFilter({
  label,
  allLabel,
  options,
  selectedValues,
  onChange,
  enableSearch = true,
  getItemBadgeClass,
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const normalizedOptions = useMemo(() => {
    return options.map((opt) =>
      typeof opt === "string" ? { label: opt, value: opt, className: "" } : opt
    );
  }, [options]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggle = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleSelectAll = () => {
    onChange([]);
  };

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return normalizedOptions;
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [normalizedOptions, searchTerm]);

  const defaultAllText = allLabel || `All ${label}`;

  const buttonDisplay = useMemo(() => {
    if (selectedValues.length === 0) return defaultAllText;
    if (selectedValues.length === 1) {
      const match = normalizedOptions.find((o) => o.value === selectedValues[0]);
      return match ? match.label : selectedValues[0];
    }
    return `${label} (${selectedValues.length})`;
  }, [selectedValues, defaultAllText, label, normalizedOptions]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white flex items-center justify-between gap-2 min-w-[140px] transition ${
          selectedValues.length > 0
            ? "border-purple-400 text-purple-900 font-medium bg-purple-50/30"
            : "border-gray-200 text-gray-700"
        }`}
      >
        <span className="truncate max-w-[150px]">{buttonDisplay}</span>
        <ChevronDown size={14} className="text-gray-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-64 bg-white rounded-xl shadow-2xl ring-1 ring-black/10 z-50 p-2.5 border border-gray-100 max-h-72 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
            <span className="text-xs font-semibold text-gray-800">
              {label} Filter
            </span>
            {selectedValues.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] text-purple-600 hover:text-purple-800 font-medium"
              >
                Reset All
              </button>
            )}
          </div>

          {enableSearch && (
            <div className="mb-2">
              <input
                type="text"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
            </div>
          )}

          <div className="overflow-y-auto flex-1 space-y-1 pr-1">
            <label
              onClick={handleSelectAll}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-gray-100 transition ${
                selectedValues.length === 0
                  ? "bg-purple-50 text-purple-900 font-semibold"
                  : "text-gray-700"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedValues.length === 0}
                onChange={handleSelectAll}
                className="rounded accent-purple-600 cursor-pointer"
              />
              <span>{defaultAllText}</span>
            </label>

            {filteredOptions.map((opt) => {
              const isChecked = selectedValues.includes(opt.value);
              const customBadgeClass = getItemBadgeClass
                ? getItemBadgeClass(opt.value)
                : opt.className || "";

              return (
                <label
                  key={opt.value}
                  onClick={() => handleToggle(opt.value)}
                  className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-gray-100 transition ${
                    isChecked
                      ? "bg-purple-50 text-purple-900 font-medium"
                      : "text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(opt.value)}
                      className="rounded accent-purple-600 cursor-pointer shrink-0"
                    />
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {customBadgeClass && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${customBadgeClass}`}
                    >
                      {opt.value}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Platform & Account Status Configurations ─────────────────────────────────
export const PLATFORM_OPTIONS = [
  "Swiggy and Zomato combo",
  "Swiggy",
  "Zomato",
  "Rapido",
  "Only",
  "Toing",
  "FSSAI",
  "Other",
];

export const ACCOUNT_STATUS_OPTIONS = [
  { label: "ACCOUNT LIVE", value: "ACCOUNT LIVE", className: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { label: "COMPLETE", value: "COMPLETE", className: "bg-blue-100 text-blue-800 border-blue-300" },
  { label: "DUPLICATE LISTING", value: "DUPLICATE LISTING", className: "bg-gray-100 text-gray-700 border-gray-300" },
  { label: "Menu updated", value: "Menu updated", className: "bg-teal-100 text-teal-800 border-teal-300" },
  { label: "VAITING FOR APPROVEL", value: "VAITING FOR APPROVEL", className: "bg-amber-100 text-amber-800 border-amber-300" },
  { label: "WORK IN MANU", value: "WORK IN MANU", className: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  { label: "Menu pending", value: "Menu pending", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { label: "Re--Onboarding", value: "Re--Onboarding", className: "bg-purple-100 text-purple-800 border-purple-300" },
  { label: "Cretical", value: "Cretical", className: "bg-red-700 text-white border-red-800 font-semibold" },
  { label: "Hold From Customer side", value: "Hold From Customer side", className: "bg-slate-200 text-slate-800 border-slate-300" },
  { label: "Cx Onboarding not willing to pay", value: "Cx Onboarding not willing to pay", className: "bg-red-900 text-white border-red-950 font-semibold" },
  { label: "Pending", value: "Pending", className: "bg-orange-100 text-orange-800 border-orange-300" },
];

export const TASK_STAGE_OPTIONS = [
  {
    label: "To Do",
    value: "todo",
    className: "bg-blue-100 text-blue-800 border-blue-300 font-medium",
  },
  {
    label: "In Progress",
    value: "inprogress",
    className: "bg-amber-100 text-amber-800 border-amber-300 font-medium",
  },
  {
    label: "Done",
    value: "done",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300 font-medium",
  },
];

export const TIME_ELAPSED_OPTIONS = [
  { label: "Today (< 24h ago)", value: "today", className: "bg-sky-50 text-sky-800 border-sky-200" },
  { label: "1–2 Days ago", value: "1-2days", className: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  { label: "3–5 Days ago", value: "3-5days", className: "bg-amber-50 text-amber-800 border-amber-200" },
  { label: "6–10 Days ago", value: "6-10days", className: "bg-orange-50 text-orange-800 border-orange-200" },
  { label: "11–20 Days ago", value: "11-20days", className: "bg-rose-50 text-rose-800 border-rose-200" },
  { label: "20+ Days ago", value: "20plus", className: "bg-red-100 text-red-900 border-red-300 font-bold" },
];

export const TIMELINE_SLA_OPTIONS = [
  { label: "Completed", value: "completed", className: "bg-emerald-100 text-emerald-800 border-emerald-300 font-medium" },
  { label: "On Track / Within SLA", value: "on-track", className: "bg-blue-50 text-blue-700 border-blue-200 font-medium" },
  { label: "Urgent (< 12h left)", value: "urgent", className: "bg-amber-100 text-amber-800 border-amber-300 font-semibold" },
  { label: "Overdue (SLA Breached)", value: "overdue", className: "bg-red-100 text-red-700 border-red-300 font-bold animate-pulse" },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface TaskNote {
  id: string;
  content: string;
  authorName: string;
  authorEmail?: string;
  fileUrl?: string | null;
  createdAt: string;
}

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
  taskStartDate?: string;
  fssaiNumber?: string;
  restaurantId?: string;
  swiggyRestaurantId?: string;
  zomatoRestaurantId?: string;
  isReOnboarding?: boolean;
  onboardedBy?: string;
  accountStatus: string;
  platform: string;
  outletCreated: string;
  remarks: string;
  hasRecord: boolean;
  recentNotes?: TaskNote[];
}

export interface ColumnDefinition {
  id: string;
  label: string;
  defaultVisible: boolean;
  isFixed?: boolean;
  minWidth?: string;
}

export const ALL_COLUMNS: ColumnDefinition[] = [
  { id: "sno", label: "S.No", defaultVisible: true, isFixed: true, minWidth: "60px" },
  { id: "createdAt", label: "Task Created", defaultVisible: true, minWidth: "120px" },
  { id: "timeElapsed", label: "Time Elapsed", defaultVisible: true, minWidth: "130px" },
  { id: "timelineRemaining", label: "Timeline (SLA)", defaultVisible: true, minWidth: "150px" },
  { id: "stage", label: "Stage (Team Board)", defaultVisible: true, minWidth: "150px" },
  { id: "shopName", label: "Restaurant Name", defaultVisible: true, minWidth: "180px" },
  { id: "category", label: "Category", defaultVisible: true, minWidth: "140px" },
  { id: "customerName", label: "Customer", defaultVisible: true, minWidth: "140px" },
  { id: "phone", label: "Phone", defaultVisible: true, minWidth: "120px" },
  { id: "assignerName", label: "Assigned By", defaultVisible: true, minWidth: "120px" },
  { id: "assigneeName", label: "Assigned To", defaultVisible: true, minWidth: "120px" },
  { id: "swiggyRestaurantId", label: "Swiggy Restaurant ID", defaultVisible: true, minWidth: "170px" },
  { id: "zomatoRestaurantId", label: "Zomato Restaurant ID", defaultVisible: true, minWidth: "170px" },
  { id: "platform", label: "Platform", defaultVisible: true, minWidth: "120px" },
  { id: "accountStatus", label: "Account Status", defaultVisible: true, minWidth: "140px" },
  { id: "outletCreated", label: "Outlet Created", defaultVisible: true, minWidth: "130px" },
  { id: "remarks", label: "Remarks / Notes", defaultVisible: true, minWidth: "240px" },
];

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
  const found = ACCOUNT_STATUS_OPTIONS.find(
    (o) => o.value.toLowerCase() === (status || "").toLowerCase()
  );
  if (found) {
    return `${found.className} border`;
  }
  // Fallbacks for legacy/general values
  switch (status) {
    case "ACCOUNT LIVE":
    case "Live":
      return "bg-green-100 text-green-800 border border-green-300";
    case "COMPLETE":
    case "Complete":
      return "bg-blue-100 text-blue-800 border border-blue-300";
    case "In Progress":
      return "bg-yellow-100 text-yellow-800 border border-yellow-300";
    case "DUPLICATE LISTING":
    case "Duplicate":
      return "bg-gray-200 text-gray-700 border border-gray-400";
    case "Cretical":
    case "Cx Onboarding not willing to pay":
    case "Rejected":
      return "bg-red-700 text-white border border-red-800 font-semibold";
    default:
      return "bg-gray-100 text-gray-700 border border-gray-300";
  }
}

function getPlatformClass(platform: string) {
  switch (platform) {
    case "Zomato":
      return "bg-red-100 text-red-700 border border-red-200 font-medium";
    case "Swiggy":
      return "bg-orange-100 text-orange-700 border border-orange-200 font-medium";
    case "Swiggy and Zomato combo":
    case "Combo":
    case "Both":
      return "bg-purple-100 text-purple-700 border border-purple-200 font-medium";
    case "Rapido":
      return "bg-yellow-100 text-yellow-800 border border-yellow-200 font-medium";
    case "Only":
      return "bg-blue-100 text-blue-800 border border-blue-200 font-medium";
    case "Toing":
      return "bg-indigo-100 text-indigo-800 border border-indigo-200 font-medium";
    case "FSSAI":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium";
    default:
      return "bg-gray-100 text-gray-600 border border-gray-200";
  }
}

// ─── Category badge color helper ───────────────────────────────────────────────
function getCategoryBadgeClass(title: string) {
  const t = (title || "").toLowerCase();
  if (t.includes("zomato") && t.includes("swiggy")) {
    return "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200 font-semibold";
  }
  if (t.includes("zomato")) {
    return "bg-red-50 text-red-700 border border-red-200 font-medium";
  }
  if (t.includes("swiggy")) {
    return "bg-orange-50 text-orange-700 border border-orange-200 font-medium";
  }
  if (t.includes("food license") || t.includes("license") || t.includes("fssai")) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium";
  }
  if (t.includes("photo")) {
    return "bg-sky-50 text-sky-700 border border-sky-200 font-medium";
  }
  return "bg-gray-100 text-gray-700 border border-gray-200";
}

// ─── Time Elapsed and SLA Timeline Helpers ─────────────────────────────────────
function getTimeElapsed(dateStr: string): { text: string; hours: number } {
  if (!dateStr) return { text: "—", hours: 0 };
  const created = new Date(dateStr).getTime();
  const diffMs = Date.now() - created;
  if (isNaN(diffMs) || diffMs < 0) return { text: "Just now", hours: 0 };

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  if (days === 0 && totalHours === 0) {
    const mins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return { text: `${mins}m ago`, hours: 0 };
  }
  if (days === 0) {
    return { text: `${totalHours}h ago`, hours: totalHours };
  }
  return {
    text: remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d ago`,
    hours: totalHours,
  };
}

// SLA Definition based on user requirements:
// Fssai - 24 hr
// Zomato and Swiggy - 3 days (72 hr)
// GST - 2 days (48 hr)
// Photo uploading - 2 days (48 hr)
function getTaskSLAHours(title: string): number {
  const t = (title || "").toLowerCase();
  if (t.includes("fssai") || t.includes("food license") || t.includes("license")) {
    return 24;
  }
  if (t.includes("gst")) {
    return 48;
  }
  if (t.includes("photo")) {
    return 48;
  }
  if (t.includes("zomato") || t.includes("swiggy")) {
    return 72; // 3 days
  }
  return 48; // default 2 days
}

function getTimelineRemaining(dateStr: string, title: string, status: string): {
  text: string;
  isOverdue: boolean;
  className: string;
} {
  if (status === "done") {
    return {
      text: "Completed",
      isOverdue: false,
      className: "bg-emerald-100 text-emerald-800 border-emerald-300 font-medium",
    };
  }
  if (!dateStr) return { text: "—", isOverdue: false, className: "text-gray-400" };

  const created = new Date(dateStr).getTime();
  const slaHours = getTaskSLAHours(title);
  const targetTime = created + slaHours * 60 * 60 * 1000;
  const remainingMs = targetTime - Date.now();

  if (remainingMs <= 0) {
    const overdueMs = Math.abs(remainingMs);
    const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
    const overdueDays = Math.floor(overdueHours / 24);
    const text =
      overdueDays > 0
        ? `Overdue ${overdueDays}d`
        : `Overdue ${overdueHours}h`;
    return {
      text,
      isOverdue: true,
      className: "bg-red-100 text-red-700 border-red-300 font-semibold animate-pulse",
    };
  }

  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingDays = Math.floor(remainingHours / 24);
  const remHoursAfterDays = remainingHours % 24;

  let text = "";
  if (remainingDays > 0) {
    text = remHoursAfterDays > 0 ? `${remainingDays}d ${remHoursAfterDays}h left` : `${remainingDays}d left`;
  } else {
    text = `${Math.max(1, remainingHours)}h left`;
  }

  const isUrgent = remainingHours <= 12;
  const className = isUrgent
    ? "bg-amber-100 text-amber-800 border-amber-300 font-semibold"
    : "bg-blue-50 text-blue-700 border-blue-200 font-medium";

  return { text, isOverdue: false, className };
}

function getStageBadgeClass(stage: string) {
  switch (stage) {
    case "done":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 font-medium";
    case "inprogress":
      return "bg-amber-100 text-amber-800 border-amber-300 font-medium";
    case "todo":
    default:
      return "bg-blue-100 text-blue-800 border-blue-300 font-medium";
  }
}

function getStageLabel(stage: string) {
  switch (stage) {
    case "done":
      return "Done";
    case "inprogress":
      return "In Progress";
    case "todo":
    default:
      return "To Do";
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

// ─── Format Date YYYY-MM-DD for native date picker ────────────────────────────
function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─── Task Created Date Quick Filter Preset Helper ─────────────────────────────
interface TaskCreatedPreset {
  label: string;
  value: string;
  calc: () => { from: string; to: string };
}

const TASK_CREATED_PRESETS: TaskCreatedPreset[] = [
  {
    label: "Today",
    value: "today",
    calc: () => {
      const now = new Date();
      const s = formatYMD(now);
      return { from: s, to: s };
    },
  },
  {
    label: "Yesterday",
    value: "yesterday",
    calc: () => {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const s = formatYMD(y);
      return { from: s, to: s };
    },
  },
  {
    label: "Last 7 Days",
    value: "last7Days",
    calc: () => {
      const now = new Date();
      const past = new Date();
      past.setDate(past.getDate() - 6);
      return { from: formatYMD(past), to: formatYMD(now) };
    },
  },
  {
    label: "Last 15 Days (Default)",
    value: "last15Days",
    calc: () => {
      const now = new Date();
      const past = new Date();
      past.setDate(past.getDate() - 14);
      return { from: formatYMD(past), to: formatYMD(now) };
    },
  },
  {
    label: "Last 30 Days",
    value: "last30Days",
    calc: () => {
      const now = new Date();
      const past = new Date();
      past.setDate(past.getDate() - 29);
      return { from: formatYMD(past), to: formatYMD(now) };
    },
  },
  {
    label: "This Month",
    value: "thisMonth",
    calc: () => {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: formatYMD(firstDay), to: formatYMD(now) };
    },
  },
  {
    label: "Last Month",
    value: "lastMonth",
    calc: () => {
      const now = new Date();
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: formatYMD(firstDayLastMonth), to: formatYMD(lastDayLastMonth) };
    },
  },
  {
    label: "All Time",
    value: "allTime",
    calc: () => ({ from: "", to: "" }),
  },
];

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
    accountStatuses: ACCOUNT_STATUS_OPTIONS.map((o) => o.value),
    platforms: PLATFORM_OPTIONS,
    outletCreatedOptions: ["Pending", "Yes", "No"],
  });

  // Multi-select Filters
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedAssigners, setSelectedAssigners] = useState<string[]>([]);
  const [selectedAccountStatuses, setSelectedAccountStatuses] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedOutletCreated, setSelectedOutletCreated] = useState<string[]>([]);
  const [selectedTimeElapsed, setSelectedTimeElapsed] = useState<string[]>([]);
  const [selectedTimelineSla, setSelectedTimelineSla] = useState<string[]>([]);

  // Task Created Date Range & Quick Selection: Default Last 15 Days
  const defaultDates = useMemo(() => {
    const p = TASK_CREATED_PRESETS.find((x) => x.value === "last15Days");
    return p ? p.calc() : { from: "", to: "" };
  }, []);

  const [datePreset, setDatePreset] = useState<string>("last15Days");
  const [dateFrom, setDateFrom] = useState<string>(() => defaultDates.from);
  const [dateTo, setDateTo] = useState<string>(() => defaultDates.to);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close Date Picker dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setIsDatePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const applyPreset = (presetKey: string) => {
    setDatePreset(presetKey);
    const p = TASK_CREATED_PRESETS.find((x) => x.value === presetKey);
    if (p) {
      const res = p.calc();
      setDateFrom(res.from);
      setDateTo(res.to);
      if (presetKey !== "customRange") {
        setIsDatePickerOpen(false);
      }
    }
  };

  const titleFilter = useMemo(() => selectedTitles.join(","), [selectedTitles]);
  const assigneeFilter = useMemo(() => selectedAssignees.join(","), [selectedAssignees]);
  const assignerFilter = useMemo(() => selectedAssigners.join(","), [selectedAssigners]);
  const accountStatusFilter = useMemo(() => selectedAccountStatuses.join(","), [selectedAccountStatuses]);
  const platformFilter = useMemo(() => selectedPlatforms.join(","), [selectedPlatforms]);
  const outletCreatedFilter = useMemo(() => selectedOutletCreated.join(","), [selectedOutletCreated]);
  const timeElapsedFilter = useMemo(() => selectedTimeElapsed.join(","), [selectedTimeElapsed]);
  const timelineSlaFilter = useMemo(() => selectedTimelineSla.join(","), [selectedTimelineSla]);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

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

  // ─── Fetch data (Parallelized) ─────────────────────────────────────────────
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
        ...(timeElapsedFilter && { timeElapsed: timeElapsedFilter }),
        ...(timelineSlaFilter && { timelineSla: timelineSlaFilter }),
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
    timeElapsedFilter,
    timelineSlaFilter,
    dateFrom,
    dateTo,
  ]);

  // ─── Fetch stats (Syncs with Active Date Range) ───────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`/api/onboarding/stats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {}
  }, [dateFrom, dateTo]);

  // Fetch tasks on initial render or filter change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Fetch stats when date filter changes
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
    timeElapsedFilter,
    timelineSlaFilter,
    dateFrom,
    dateTo,
  ]);

  // ─── Column customizer & float (sticky) state ──────────────────────────────
  const [columnOrder, setColumnOrder] = useState<string[]>(() => ALL_COLUMNS.map((c) => c.id));
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [floatingColumns, setFloatingColumns] = useState<string[]>(["sno"]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [savingColumnConfig, setSavingColumnConfig] = useState(false);
  const [activeConfigRole, setActiveConfigRole] = useState<string>("seller");

  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);

  const normalizedUserRole = useMemo(() => {
    const rawRole =
      (user as any)?.publicMetadata?.role ||
      (user as any)?.role ||
      "";
    return String(rawRole).toLowerCase();
  }, [user]);

  // Only Master role can change column positions, freeze and visibility
  const isMaster = useMemo(() => {
    return normalizedUserRole === "master";
  }, [normalizedUserRole]);

  const isMasterOrAdmin = useMemo(() => {
    return normalizedUserRole === "master" || normalizedUserRole === "admin";
  }, [normalizedUserRole]);

  // Load persistent column configuration from Database API (falls back to localStorage)
  const fetchColumnConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/onboarding/columns");
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          const cfg = data.config;
          if (Array.isArray(cfg.columnOrder) && cfg.columnOrder.length > 0) {
            const allIds = ALL_COLUMNS.map((c) => c.id);
            const valid = cfg.columnOrder.filter((id: string) => allIds.includes(id));
            const missing = allIds.filter((id: string) => !valid.includes(id));
            setColumnOrder([...valid, ...missing]);
          }
          if (Array.isArray(cfg.floatingColumns)) {
            setFloatingColumns(cfg.floatingColumns);
          }
          if (Array.isArray(cfg.hiddenColumns)) {
            setHiddenColumns(cfg.hiddenColumns);
          }
          if (cfg.rolePermissions && typeof cfg.rolePermissions === "object") {
            setRolePermissions(cfg.rolePermissions);
          }
          return;
        }
      }
    } catch {}

    // Fallback to localStorage if API unavailable
    if (typeof window !== "undefined") {
      try {
        const savedOrder = localStorage.getItem("onboarding_table_column_order");
        if (savedOrder) setColumnOrder(JSON.parse(savedOrder));
        const savedHidden = localStorage.getItem("onboarding_table_hidden_columns");
        if (savedHidden) setHiddenColumns(JSON.parse(savedHidden));
        const savedFloat = localStorage.getItem("onboarding_table_floating_columns");
        if (savedFloat) setFloatingColumns(JSON.parse(savedFloat));
      } catch {}
    }
  }, []);

  useEffect(() => {
    fetchColumnConfig();
  }, [fetchColumnConfig]);

  // Save Column Config to database API
  const persistColumnConfig = async (
    newOrder: string[],
    newHidden: string[],
    newFloat: string[],
    newRolePerms: Record<string, string[]>
  ) => {
    if (!isMaster) {
      toast.error("Only Master role can configure columns");
      return;
    }
    setSavingColumnConfig(true);
    try {
      const config = {
        columnOrder: newOrder,
        hiddenColumns: newHidden,
        floatingColumns: newFloat,
        rolePermissions: newRolePerms,
      };

      const res = await fetch("/api/onboarding/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("onboarding_table_column_order", JSON.stringify(newOrder));
        localStorage.setItem("onboarding_table_hidden_columns", JSON.stringify(newHidden));
        localStorage.setItem("onboarding_table_floating_columns", JSON.stringify(newFloat));
        localStorage.setItem("onboarding_table_role_permissions", JSON.stringify(newRolePerms));
      }

      toast.success("✅ Column settings saved across database!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save column config");
    } finally {
      setSavingColumnConfig(false);
    }
  };

  // Handle Drag & Drop reorder (Master only)
  const handleColumnDrop = (targetColId: string) => {
    if (!isMaster) {
      toast.error("🔒 Only Master role can reorder columns");
      return;
    }
    if (!draggedColumnId || draggedColumnId === targetColId) return;
    const currentList = [...columnOrder];
    const fromIndex = currentList.indexOf(draggedColumnId);
    const toIndex = currentList.indexOf(targetColId);
    if (fromIndex === -1 || toIndex === -1) return;

    currentList.splice(fromIndex, 1);
    currentList.splice(toIndex, 0, draggedColumnId);
    setColumnOrder(currentList);
    setDraggedColumnId(null);
    persistColumnConfig(currentList, hiddenColumns, floatingColumns, rolePermissions);
  };

  // Toggle Hide / Show column (Master only)
  const toggleColumnVisibility = (colId: string) => {
    if (!isMaster) {
      toast.error("🔒 Only Master role can hide/show columns");
      return;
    }
    const next = hiddenColumns.includes(colId)
      ? hiddenColumns.filter((id) => id !== colId)
      : [...hiddenColumns, colId];
    setHiddenColumns(next);
    persistColumnConfig(columnOrder, next, floatingColumns, rolePermissions);
  };

  // Toggle Float / Pin column (Sticky) (Master only)
  const toggleColumnFloat = (colId: string) => {
    if (!isMaster) {
      toast.error("🔒 Only Master role can freeze/pin columns");
      return;
    }
    const next = floatingColumns.includes(colId)
      ? floatingColumns.filter((id) => id !== colId)
      : [...floatingColumns, colId];
    setFloatingColumns(next);
    persistColumnConfig(columnOrder, hiddenColumns, next, rolePermissions);
  };

  // Toggle role-specific column hidden status (Master only)
  const toggleRoleColumnVisibility = (targetRole: string, colId: string) => {
    if (!isMaster) {
      toast.error("🔒 Only Master role can configure role column visibility");
      return;
    }
    const currentHiddenForRole = rolePermissions[targetRole] || [];
    const nextHidden = currentHiddenForRole.includes(colId)
      ? currentHiddenForRole.filter((id) => id !== colId)
      : [...currentHiddenForRole, colId];

    const nextPerms = {
      ...rolePermissions,
      [targetRole]: nextHidden,
    };
    setRolePermissions(nextPerms);
    persistColumnConfig(columnOrder, hiddenColumns, floatingColumns, nextPerms);
  };

  // Reset column settings (Master only)
  const resetColumnSettings = () => {
    if (!isMaster) {
      toast.error("🔒 Only Master role can reset column settings");
      return;
    }
    const defaultOrder = ALL_COLUMNS.map((c) => c.id);
    setColumnOrder(defaultOrder);
    setHiddenColumns([]);
    setFloatingColumns(["sno"]);
    setRolePermissions({});
    persistColumnConfig(defaultOrder, [], ["sno"], {});
  };

  // Visible columns calculated based on Master configuration + Current User's Role Permissions
  const visibleColumns = useMemo(() => {
    const hiddenForCurrentRole = rolePermissions[normalizedUserRole] || [];
    return columnOrder
      .filter((colId) => !hiddenColumns.includes(colId) && !hiddenForCurrentRole.includes(colId))
      .map((colId) => ALL_COLUMNS.find((c) => c.id === colId))
      .filter(Boolean) as ColumnDefinition[];
  }, [columnOrder, hiddenColumns, rolePermissions, normalizedUserRole]);

  // Compute sticky left offsets for floating columns
  const getStickyStyle = useCallback(
    (colId: string, isHeader: boolean = false) => {
      if (!floatingColumns.includes(colId)) return {};
      // Calculate accumulated left position of all preceding floating columns
      let left = 0;
      for (const col of visibleColumns) {
        if (col.id === colId) break;
        if (floatingColumns.includes(col.id)) {
          // approximate or base width
          const widthVal = parseInt(col.minWidth || "120");
          left += widthVal;
        }
      }
      return {
        position: "sticky" as const,
        left: `${left}px`,
        zIndex: isHeader ? 30 : 20,
        boxShadow: "2px 0 5px -2px rgba(0,0,0,0.08)",
      };
    },
    [floatingColumns, visibleColumns]
  );

  // Quick note modal state
  const [activeNotesTask, setActiveNotesTask] = useState<OnboardingTask | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  // Edit Drawer Side Panel state & resizable width
  const [drawerTask, setDrawerTask] = useState<OnboardingTask | null>(null);
  const [drawerValues, setDrawerValues] = useState<Partial<OnboardingTask>>({});
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [drawerNewNote, setDrawerNewNote] = useState("");
  const [drawerPostingNote, setDrawerPostingNote] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("onboarding_drawer_width");
      if (saved) {
        const num = parseInt(saved);
        if (!isNaN(num) && num >= 420 && num <= 1200) return num;
      }
    }
    return 600; // default 600px width
  });
  const [isResizingDrawer, setIsResizingDrawer] = useState(false);

  // Resize handler for Edit Drawer side panel
  const handleDrawerResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingDrawer(true);

    const startX = e.clientX;
    const startW = drawerWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // Dragging left increases width, dragging right decreases width
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.min(1200, Math.max(420, startW + delta));
      setDrawerWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingDrawer(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      setDrawerWidth((finalWidth) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("onboarding_drawer_width", String(finalWidth));
        }
        return finalWidth;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [drawerWidth]);

  const openEditDrawer = (task: OnboardingTask) => {
    setDrawerTask(task);
    setDrawerNewNote("");
    setDrawerValues({
      taskStatus: task.taskStatus || "todo",
      accountStatus: task.accountStatus || "Pending",
      platform: task.platform || "Other",
      outletCreated: task.outletCreated || "Pending",
      swiggyRestaurantId: task.swiggyRestaurantId || "",
      zomatoRestaurantId: task.zomatoRestaurantId || "",
      remarks: task.remarks || "",
    });
  };

  const closeEditDrawer = () => {
    setDrawerTask(null);
    setDrawerValues({});
    setDrawerNewNote("");
  };

  const handleDrawerAddNote = async () => {
    if (!drawerTask || !drawerNewNote.trim()) return;
    setDrawerPostingNote(true);
    try {
      const res = await fetch(`/api/tasks/${drawerTask.taskId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: drawerNewNote.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      const createdNote = await res.json();
      toast.success("✅ Note / Remark posted to Team Board");
      setDrawerNewNote("");
      // Update local drawer task notes
      setDrawerTask((prev) =>
        prev
          ? {
              ...prev,
              recentNotes: [
                {
                  id: createdNote.id || Date.now().toString(),
                  content: createdNote.content || drawerNewNote.trim(),
                  authorName: createdNote.authorName || "You",
                  authorEmail: createdNote.authorEmail || "",
                  createdAt: new Date().toISOString(),
                },
                ...(prev.recentNotes || []),
              ],
            }
          : null
      );
      fetchTasks();
    } catch {
      toast.error("❌ Failed to post note");
    } finally {
      setDrawerPostingNote(false);
    }
  };

  const saveEditDrawer = async () => {
    if (!drawerTask) return;
    setDrawerSaving(true);
    try {
      if (drawerValues.taskStatus) {
        await fetch(`/api/tasks/${drawerTask.taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: drawerValues.taskStatus }),
        }).catch(() => {});
      }

      // If user typed a note in the drawer, post it too
      if (drawerNewNote.trim()) {
        await fetch(`/api/tasks/${drawerTask.taskId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: drawerNewNote.trim() }),
        }).catch(() => {});
      }

      const res = await fetch(`/api/onboarding/${drawerTask.taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(drawerValues),
      });

      if (!res.ok) throw new Error("Drawer save failed");
      toast.success("✅ Onboarding details updated successfully");
      closeEditDrawer();
      fetchTasks();
      fetchStats();
    } catch {
      toast.error("❌ Failed to update details");
    } finally {
      setDrawerSaving(false);
    }
  };

  // Quick stage update handler
  const handleQuickStageChange = async (taskId: string, newStage: string) => {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.taskId === taskId ? { ...t, taskStatus: newStage } : t))
      );
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStage }),
      });
      if (!res.ok) {
        // Fallback to onboarding patch
        await fetch(`/api/onboarding/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskStatus: newStage }),
        });
      }
      toast.success(`Stage updated to ${getStageLabel(newStage)}`);
      fetchTasks();
    } catch {
      toast.error("Failed to update stage");
      fetchTasks();
    }
  };

  // Add note / remark handler
  const handleAddNote = async (taskId: string) => {
    if (!newNoteContent.trim()) return;
    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNoteContent.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      toast.success("✅ Remark / Note added to task");
      setNewNoteContent("");
      setActiveNotesTask(null);
      fetchTasks();
    } catch {
      toast.error("❌ Failed to add note");
    } finally {
      setSubmittingNote(false);
    }
  };

  // Edit handlers
  const startEdit = (task: OnboardingTask) => {
    setEditingId(task.taskId);
    setEditValues({
      taskStatus: task.taskStatus || "todo",
      swiggyRestaurantId: task.swiggyRestaurantId || "",
      zomatoRestaurantId: task.zomatoRestaurantId || "",
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
      // If taskStatus changed, sync with Task API
      if (editValues.taskStatus) {
        await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: editValues.taskStatus }),
        }).catch(() => {});
      }

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
    setSelectedTitles([]);
    setSelectedAssignees([]);
    setSelectedAssigners([]);
    setSelectedAccountStatuses([]);
    setSelectedPlatforms([]);
    setSelectedOutletCreated([]);
    setSelectedTimeElapsed([]);
    setSelectedTimelineSla([]);
    setDatePreset("allTime");
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
          {/* Customize Columns Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsColumnManagerOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-gray-700 font-medium transition shadow-sm"
              title="Drag to reorder, toggle show/hide or float/pin columns"
            >
              <Columns3 size={15} className="text-purple-600" />
              <span>Customize Columns</span>
            </button>

            {isColumnManagerOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl ring-1 ring-black/10 z-50 p-4 border border-gray-100 max-h-[560px] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-gray-900 text-sm">Columns Settings</h4>
                      {isMaster ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                          Master Control
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 flex items-center gap-1">
                          <Lock size={10} /> Read Only
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500">
                      {isMaster
                        ? "Configure order, freeze & per-role column visibility"
                        : "Only Master role can modify column positions and visibility"}
                    </p>
                  </div>
                  {isMaster && (
                    <button
                      onClick={resetColumnSettings}
                      className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
                      title="Reset to default columns"
                    >
                      <RotateCcw size={12} />
                      Reset
                    </button>
                  )}
                </div>

                {/* Master Role Visibility Switcher Tab */}
                {isMaster && (
                  <div className="mb-3 p-2 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                        Role Visibility Target:
                      </span>
                      <span className="text-[10px] text-purple-600">Click hide/show per role</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {["global", "seller", "tl", "user", "guest", "admin"].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setActiveConfigRole(r)}
                          className={`px-2 py-0.5 text-xs font-semibold rounded-md transition ${
                            activeConfigRole === r
                              ? "bg-purple-600 text-white shadow-xs"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {r === "global" ? "All (Global)" : r.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-purple-600 pt-0.5">
                      Configuring: <strong className="font-bold">{activeConfigRole === "global" ? "Global Columns" : `${activeConfigRole.toUpperCase()} Role View`}</strong>
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  {columnOrder.map((colId) => {
                    const colDef = ALL_COLUMNS.find((c) => c.id === colId);
                    if (!colDef) return null;
                    const isGloballyHidden = hiddenColumns.includes(colId);
                    const isRoleHidden = (rolePermissions[activeConfigRole] || []).includes(colId);
                    const isEffectiveHidden = activeConfigRole === "global" ? isGloballyHidden : isRoleHidden;
                    const isFloating = floatingColumns.includes(colId);

                    return (
                      <div
                        key={colId}
                        draggable={isMaster}
                        onDragStart={() => isMaster && setDraggedColumnId(colId)}
                        onDragOver={(e) => isMaster && e.preventDefault()}
                        onDrop={() => isMaster && handleColumnDrop(colId)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-sm transition-all ${
                          draggedColumnId === colId
                            ? "bg-purple-50 border-purple-300 opacity-60"
                            : "bg-gray-50/70 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isMaster ? (
                            <FaGripVertical className="text-gray-400 cursor-grab active:cursor-grabbing text-xs" />
                          ) : (
                            <Lock size={12} className="text-gray-400" />
                          )}
                          <span
                            className={`font-medium text-xs ${
                              isEffectiveHidden ? "line-through text-gray-400" : "text-gray-800"
                            }`}
                          >
                            {colDef.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Float (Sticky Pin) toggle (Master only) */}
                          {isMaster && (
                            <button
                              type="button"
                              onClick={() => toggleColumnFloat(colId)}
                              title={isFloating ? "Unpin column (Disable Float)" : "Pin column (Enable Float)"}
                              className={`p-1 rounded text-xs transition ${
                                isFloating
                                  ? "bg-purple-100 text-purple-700"
                                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {isFloating ? <Pin size={13} className="fill-purple-700" /> : <Pin size={13} />}
                            </button>
                          )}

                          {/* Show / Hide toggle */}
                          {isMaster ? (
                            <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!isEffectiveHidden}
                                onChange={() => {
                                  if (activeConfigRole === "global") {
                                    toggleColumnVisibility(colId);
                                  } else {
                                    toggleRoleColumnVisibility(activeConfigRole, colId);
                                  }
                                }}
                                className="rounded accent-purple-600 cursor-pointer"
                              />
                              <span>Show</span>
                            </label>
                          ) : (
                            <span className="text-[11px] text-gray-400">
                              {isEffectiveHidden ? "Hidden" : "Visible"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Save Confirmation Indicator */}
                {isMaster && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <Save size={12} />
                      {savingColumnConfig ? "Saving to database..." : "Synced with Database"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsColumnManagerOpen(false)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-xs"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <Link
            href="/onboarding/reports"
            className="flex items-center gap-2 px-3.5 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-semibold shadow-xs"
            title="Open Onboarding Business Intelligence & Analytics Reports"
          >
            <BarChart3 size={15} />
            <span>Reports & BI</span>
          </Link>

          <button
            onClick={fetchTasks}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            <RefreshCw size={14} />
            Refresh
          </button>

          {isMasterOrAdmin ? (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
              title="Export whole table data to Excel (Master / Admin)"
            >
              <FaDownload size={12} />
              Export Excel
            </button>
          ) : (
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-200 text-gray-400 rounded-lg cursor-not-allowed font-medium"
              title="Only Master role can export whole data"
            >
              <FaDownload size={12} />
              Export Excel
            </button>
          )}
        </div>
      </div>

      {/* ─── Compact Status Cards (Single Clean Row) ─────────────────────────── */}
      {stats && (
        <div className="px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Overview Statistics
            </span>
            <Link
              href="/onboarding/reports"
              className="text-xs font-semibold text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1"
            >
              <span>View In-depth BI Reports</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              {
                label: "Total Tasks",
                value: stats.totalTasks,
                color: "bg-blue-50 border-blue-200 hover:border-blue-300",
                textColor: "text-blue-700",
                type: "clear",
                filterValue: "",
              },
              {
                label: "To Do (Board)",
                value: stats.taskBoardStatus?.todo ?? 0,
                color: "bg-sky-50 border-sky-300 hover:border-sky-400 ring-1 ring-sky-200",
                textColor: "text-sky-700 font-extrabold",
                type: "taskBoard",
                filterValue: "todo",
              },
              {
                label: "In Progress (Board)",
                value: stats.taskBoardStatus?.inProgress ?? 0,
                color: "bg-yellow-50 border-yellow-300 hover:border-yellow-400 ring-1 ring-yellow-200",
                textColor: "text-yellow-700 font-extrabold",
                type: "taskBoard",
                filterValue: "inprogress",
              },
              {
                label: "Done (Board)",
                value: stats.taskBoardStatus?.done ?? 0,
                color: "bg-emerald-50 border-emerald-300 hover:border-emerald-400 ring-1 ring-emerald-200",
                textColor: "text-emerald-700 font-extrabold",
                type: "taskBoard",
                filterValue: "done",
              },
              {
                label: "Overdue (SLA)",
                value: stats.sla?.overdue ?? 0,
                color: "bg-red-50 border-red-300 hover:border-red-400 ring-1 ring-red-200",
                textColor: "text-red-700 font-black",
                type: "sla",
                filterValue: "overdue",
                isPillBadge: true,
              },
              {
                label: "Urgent (<12h)",
                value: stats.sla?.urgent ?? 0,
                color: "bg-amber-50 border-amber-300 hover:border-amber-400 ring-1 ring-amber-200",
                textColor: "text-amber-800 font-extrabold",
                type: "sla",
                filterValue: "urgent",
                isPillBadge: true,
              },
              {
                label: "Account Pending",
                value: stats.byStatus?.pending || 0,
                color: "bg-orange-50 border-orange-200 hover:border-orange-300",
                textColor: "text-orange-700",
                type: "status",
                filterValue: "Pending",
              },
              {
                label: "Account Live",
                value: stats.byStatus?.live || 0,
                color: "bg-teal-50 border-teal-200 hover:border-teal-300",
                textColor: "text-teal-700",
                type: "status",
                filterValue: "Live",
              },
            ].map((card) => {
              const isSelected =
                card.type === "sla"
                  ? selectedTimelineSla.includes(card.filterValue)
                  : card.type === "taskBoard"
                  ? false // task status filter can be added if desired
                  : card.filterValue
                  ? selectedAccountStatuses.includes(card.filterValue)
                  : selectedAccountStatuses.length === 0 && selectedTimelineSla.length === 0;

              return (
                <div
                  key={card.label}
                  className={`${card.color} border rounded-lg px-2.5 py-1.5 text-center cursor-pointer transition shadow-xs ${
                    isSelected ? "ring-2 ring-purple-500 scale-[1.02]" : ""
                  }`}
                  onClick={() => {
                    if (card.type === "sla") {
                      setSelectedTimelineSla((prev) =>
                        prev.includes(card.filterValue)
                          ? prev.filter((s) => s !== card.filterValue)
                          : [card.filterValue]
                      );
                    } else if (card.type === "clear" || !card.filterValue) {
                      setSelectedAccountStatuses([]);
                      setSelectedTimelineSla([]);
                    } else if (card.type === "status") {
                      setSelectedAccountStatuses((prev) =>
                        prev.includes(card.filterValue)
                          ? prev.filter((s) => s !== card.filterValue)
                          : [card.filterValue]
                      );
                    }
                  }}
                  title={card.type === "sla" ? `Filter table by ${card.label}` : undefined}
                >
                  <div className={`text-base font-extrabold ${card.textColor} leading-tight flex items-center justify-center gap-1`}>
                    {card.type === "sla" && card.filterValue === "overdue" && (
                      <AlertTriangle size={13} className="text-red-600 animate-pulse" />
                    )}
                    {card.type === "sla" && card.filterValue === "urgent" && (
                      <Clock size={13} className="text-amber-600" />
                    )}
                    <span>{card.value}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                    {card.label}
                  </div>
                </div>
              );
            })}
          </div>
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

          {/* Category Multi-Select Filter */}
          <MultiSelectFilter
            label="Category"
            allLabel="All Categories"
            options={filterOptions.titles}
            selectedValues={selectedTitles}
            onChange={setSelectedTitles}
            getItemBadgeClass={(val) => getCategoryBadgeClass(val)}
          />

          {/* Assignee Multi-Select Filter */}
          <MultiSelectFilter
            label="Assignee"
            allLabel="All Assignees"
            options={filterOptions.assignees}
            selectedValues={selectedAssignees}
            onChange={setSelectedAssignees}
          />

          {/* Assigner Multi-Select Filter */}
          <MultiSelectFilter
            label="Assigner"
            allLabel="All Assigners"
            options={filterOptions.assigners}
            selectedValues={selectedAssigners}
            onChange={setSelectedAssigners}
          />

          {/* Account Status Multi-Select Filter */}
          <MultiSelectFilter
            label="Account Status"
            allLabel="All Account Status"
            options={ACCOUNT_STATUS_OPTIONS}
            selectedValues={selectedAccountStatuses}
            onChange={setSelectedAccountStatuses}
            getItemBadgeClass={(val) => getAccountStatusClass(val)}
          />

          {/* Platform Multi-Select Filter */}
          <MultiSelectFilter
            label="Platform"
            allLabel="All Platforms"
            options={PLATFORM_OPTIONS}
            selectedValues={selectedPlatforms}
            onChange={setSelectedPlatforms}
            enableSearch={false}
            getItemBadgeClass={(val) => getPlatformClass(val)}
          />

          {/* Outlet Created Multi-Select Filter */}
          <MultiSelectFilter
            label="Outlet Created"
            allLabel="Outlet Created: All"
            options={filterOptions.outletCreatedOptions}
            selectedValues={selectedOutletCreated}
            onChange={setSelectedOutletCreated}
            enableSearch={false}
            getItemBadgeClass={(val) =>
              val === "Yes"
                ? "bg-green-100 text-green-700 border border-green-200"
                : val === "No"
                ? "bg-red-100 text-red-700 border border-red-200"
                : "bg-gray-100 text-gray-500 border border-gray-200"
            }
          />

          {/* Time Elapsed Filter */}
          <MultiSelectFilter
            label="Time Elapsed"
            allLabel="All Time Elapsed"
            options={TIME_ELAPSED_OPTIONS}
            selectedValues={selectedTimeElapsed}
            onChange={setSelectedTimeElapsed}
            enableSearch={false}
          />

          {/* Timeline (SLA) Filter */}
          <MultiSelectFilter
            label="Timeline (SLA)"
            allLabel="All SLA Status"
            options={TIMELINE_SLA_OPTIONS}
            selectedValues={selectedTimelineSla}
            onChange={setSelectedTimelineSla}
            enableSearch={false}
          />

          {/* Task Created Date Range & Quick Selection (Default 15 Days) */}
          <div className="relative" ref={datePickerRef}>
            <button
              type="button"
              onClick={() => setIsDatePickerOpen((prev) => !prev)}
              className={`text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white flex items-center gap-2 transition ${
                dateFrom || dateTo
                  ? "border-purple-400 text-purple-900 font-medium bg-purple-50/40"
                  : "border-gray-200 text-gray-700"
              }`}
            >
              <Calendar size={14} className="text-purple-600 shrink-0" />
              <span>
                {datePreset && datePreset !== "customRange"
                  ? TASK_CREATED_PRESETS.find((p) => p.value === datePreset)?.label || "Task Created"
                  : dateFrom && dateTo
                  ? `${dateFrom} to ${dateTo}`
                  : dateFrom
                  ? `From ${dateFrom}`
                  : "Task Created Date"}
              </span>
              <ChevronDown size={14} className="text-gray-400 shrink-0" />
            </button>

            {/* Quick Selection Dropdown Menu */}
            {isDatePickerOpen && (
              <div className="absolute left-0 mt-1 w-72 bg-[#0f172a] text-slate-100 rounded-2xl shadow-2xl ring-1 ring-white/10 z-50 p-3 border border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1 mb-1">
                  QUICK SELECTION
                </div>

                <div className="space-y-0.5">
                  {TASK_CREATED_PRESETS.map((preset) => {
                    const isSelected = datePreset === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => applyPreset(preset.value)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                          isSelected
                            ? "bg-purple-600 text-white"
                            : "hover:bg-slate-800/80 text-slate-300 hover:text-white"
                        }`}
                      >
                        <span>{preset.label}</span>
                        {isSelected && <Check size={14} className="text-white" />}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-800/80 my-2 pt-2">
                  <div className="px-3 py-1 text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
                    Custom Range
                  </div>
                  <div className="space-y-2 px-1">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">From Date</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => {
                          setDatePreset("customRange");
                          setDateFrom(e.target.value);
                        }}
                        className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">To Date</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => {
                          setDatePreset("customRange");
                          setDateTo(e.target.value);
                        }}
                        className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-400"
                      />
                    </div>
                    <div className="pt-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => applyPreset("allTime")}
                        className="text-[11px] text-slate-400 hover:text-slate-200 underline"
                      >
                        Clear Range
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDatePickerOpen(false)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clear filters */}
          {(query ||
            titleFilter ||
            assigneeFilter ||
            assignerFilter ||
            accountStatusFilter ||
            platformFilter ||
            outletCreatedFilter ||
            timeElapsedFilter ||
            timelineSlaFilter ||
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

      {/* ─── Loading Bar Indicator (Non-blocking) ───────────────────────────── */}
      {loading && (
        <div className="h-0.5 w-full bg-purple-100 overflow-hidden relative">
          <div className="h-full bg-purple-600 animate-pulse w-full" />
        </div>
      )}

      {/* ─── Table ───────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {visibleColumns.map((col) => {
                    const isFloating = floatingColumns.includes(col.id);
                    const stickyStyle = getStickyStyle(col.id, true);

                    return (
                      <th
                        key={col.id}
                        style={{
                          minWidth: col.minWidth,
                          ...stickyStyle,
                        }}
                        className={`px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap select-none ${
                          isFloating ? "bg-purple-50 text-purple-900 border-r border-purple-200" : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col.label}</span>
                          {isFloating && (
                            <Pin size={11} className="text-purple-600 fill-purple-600" />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && tasks.length === 0 ? (
                  // Elegant Skeleton Rows
                  Array.from({ length: 6 }).map((_, rIdx) => (
                    <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                      {visibleColumns.map((col, cIdx) => (
                        <td key={`sk-${rIdx}-${col.id}`} className="px-3 py-3.5">
                          <div
                            className="h-4 bg-gray-200 rounded-md"
                            style={{
                              width: cIdx === 0 ? "24px" : cIdx === 4 ? "120px" : "80px",
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : tasks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumns.length || 1}
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
                        className={`hover:bg-purple-50/30 transition ${
                          editing ? "bg-blue-50/70" : ""
                        }`}
                      >
                        {visibleColumns.map((col) => {
                          const isFloating = floatingColumns.includes(col.id);
                          const stickyStyle = getStickyStyle(col.id, false);
                          const cellBg = isFloating
                            ? editing
                              ? "bg-blue-100"
                              : "bg-white hover:bg-purple-50/50"
                            : "";

                          // Click on frozen column cells opens the edit panel
                          const handleCellClick = isFloating
                            ? () => {
                                if (!editing) openEditDrawer(task);
                              }
                            : undefined;

                          switch (col.id) {
                            case "sno":
                              return (
                                <td
                                  key="sno"
                                  onClick={handleCellClick}
                                  style={stickyStyle}
                                  className={`px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap ${
                                    isFloating ? `${cellBg} border-r border-purple-100 cursor-pointer` : ""
                                  }`}
                                  title={isFloating ? "Click to open edit panel" : undefined}
                                >
                                  {sno}
                                </td>
                              );

                            case "createdAt":
                              return (
                                <td
                                  key="createdAt"
                                  onClick={handleCellClick}
                                  style={stickyStyle}
                                  className={`px-3 py-2.5 whitespace-nowrap text-gray-600 ${
                                    isFloating ? `${cellBg} border-r border-purple-100 cursor-pointer` : ""
                                  }`}
                                  title={isFloating ? "Click to open edit panel" : undefined}
                                >
                                  {formatDate(task.createdAt)}
                                </td>
                              );

                            case "timeElapsed": {
                              const elapsed = getTimeElapsed(task.createdAt);
                              return (
                                <td
                                  key="timeElapsed"
                                  onClick={handleCellClick}
                                  style={stickyStyle}
                                  className={`px-3 py-2.5 whitespace-nowrap ${
                                    isFloating ? `${cellBg} border-r border-purple-100 cursor-pointer` : ""
                                  }`}
                                  title={isFloating ? "Click to open edit panel" : undefined}
                                >
                                  <div className="flex items-center gap-1.5 font-medium text-xs text-slate-700 bg-slate-100/80 px-2 py-1 rounded-lg border border-slate-200/80 w-fit">
                                    <Clock size={12} className="text-slate-500" />
                                    <span>{elapsed.text}</span>
                                  </div>
                                </td>
                              );
                            }

                            case "timelineRemaining": {
                              const rem = getTimelineRemaining(
                                task.createdAt,
                                task.title,
                                task.taskStatus
                              );
                              return (
                                <td
                                  key="timelineRemaining"
                                  onClick={handleCellClick}
                                  style={stickyStyle}
                                  className={`px-3 py-2.5 whitespace-nowrap ${
                                    isFloating ? `${cellBg} border-r border-purple-100 cursor-pointer` : ""
                                  }`}
                                  title={isFloating ? "Click to open edit panel" : undefined}
                                >
                                  <div
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${rem.className}`}
                                    title={`SLA: ${getTaskSLAHours(task.title)} hours`}
                                  >
                                    <Timer size={12} />
                                    <span>{rem.text}</span>
                                  </div>
                                </td>
                              );
                            }

                            case "stage":
                              return (
                                <td
                                  key="stage"
                                  style={stickyStyle}
                                  className={`px-3 py-2.5 whitespace-nowrap ${
                                    isFloating ? `${cellBg} border-r border-purple-100` : ""
                                  }`}
                                >
                                  {editing ? (
                                    <select
                                      value={editValues.taskStatus || "todo"}
                                      onChange={(e) =>
                                        setEditValues((v) => ({
                                          ...v,
                                          taskStatus: e.target.value,
                                        }))
                                      }
                                      className={`border rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 ${getStageBadgeClass(
                                        editValues.taskStatus || "todo"
                                      )}`}
                                    >
                                      {TASK_STAGE_OPTIONS.map((st) => (
                                        <option
                                          key={st.value}
                                          value={st.value}
                                          className="bg-white text-gray-800 font-normal"
                                        >
                                          {st.label}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <select
                                      value={task.taskStatus || "todo"}
                                      onChange={(e) =>
                                        handleQuickStageChange(task.taskId, e.target.value)
                                      }
                                      className={`border rounded-lg px-2 py-0.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer shadow-sm transition ${getStageBadgeClass(
                                        task.taskStatus || "todo"
                                      )}`}
                                      title="Synced live with Team Board stage"
                                    >
                                      {TASK_STAGE_OPTIONS.map((st) => (
                                        <option
                                          key={st.value}
                                          value={st.value}
                                          className="bg-white text-gray-800 font-normal"
                                        >
                                          {st.label}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </td>
                              );

                            case "shopName":
                              return (
                                <td
                                  key="shopName"
                                  onClick={handleCellClick}
                                  style={stickyStyle}
                                  className={`px-3 py-2.5 font-medium text-gray-900 max-w-[180px] ${
                                    isFloating ? `${cellBg} border-r border-purple-100 cursor-pointer` : ""
                                  }`}
                                  title={isFloating ? "Click to open edit panel" : task.shopName}
                                >
                                  <div className="truncate" title={task.shopName}>
                                    {task.shopName || "—"}
                                  </div>
                                </td>
                              );

                            case "category":
                              return (
                                <td
                                  key="category"
                                  onClick={handleCellClick}
                                  style={stickyStyle}
                                  className={`px-3 py-2.5 whitespace-nowrap ${
                                    isFloating ? `${cellBg} border-r border-purple-100 cursor-pointer` : ""
                                  }`}
                                  title={isFloating ? "Click to open edit panel" : undefined}
                                >
                                  <span
                                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getCategoryBadgeClass(
                                      task.title
                                    )}`}
                                  >
                                    {task.title
                                      .replace(/^[^\w]*/, "")
                                      .trim()
                                      .replace("Zomato + Swiggy Combo", "Swiggy & Zomato Combo")}
                                  </span>
                                </td>
                              );

                            case "customerName":
                              return (
                                <td
                                  key="customerName"
                                  onClick={handleCellClick}
                                  style={stickyStyle}
                                  className={`px-3 py-2.5 text-gray-600 max-w-[140px] ${
                                    isFloating ? `${cellBg} border-r border-purple-100 cursor-pointer` : ""
                                  }`}
                                  title={isFloating ? "Click to open edit panel" : undefined}
                                >
                                  <div className="truncate">{task.customerName || "—"}</div>
                                </td>
                              );

                            case "phone":
                              return (
                                <td
                                  key="phone"
                                  onClick={handleCellClick}
                                  style={stickyStyle}
                                  className={`px-3 py-2.5 text-gray-600 whitespace-nowrap ${
                                    isFloating ? `${cellBg} border-r border-purple-100 cursor-pointer` : ""
                                  }`}
                                  title={isFloating ? "Click to open edit panel" : undefined}
                                >
                                  {task.phone || "—"}
                                </td>
                              );

                            case "assignerName":
                              return (
                                <td
                                  key="assignerName"
                                  onClick={handleCellClick}
                                  style={stickyStyle}
                                  className={`px-3 py-2.5 text-gray-600 whitespace-nowrap ${
                                    isFloating ? `${cellBg} border-r border-purple-100 cursor-pointer` : ""
                                  }`}
                                  title={isFloating ? "Click to open edit panel" : undefined}
                                >
                                  {task.assignerName || "—"}
                                </td>
                              );

                            case "assigneeName":
                              return (
                                <td
                                  key="assigneeName"
                                  onClick={handleCellClick}
                                  style={stickyStyle}
                                  className={`px-3 py-2.5 text-gray-600 whitespace-nowrap ${
                                    isFloating ? `${cellBg} border-r border-purple-100 cursor-pointer` : ""
                                  }`}
                                  title={isFloating ? "Click to open edit panel" : undefined}
                                >
                                  {task.assigneeName || "—"}
                                </td>
                              );

                            case "swiggyRestaurantId":
                              return (
                                <td
                                  key="swiggyRestaurantId"
                                  style={stickyStyle}
                                  className={`px-3 py-2.5 whitespace-nowrap ${
                                    isFloating ? `${cellBg} border-r border-purple-100` : ""
                                  }`}
                                >
                                  {editing ? (
                                    <input
                                      type="text"
                                      value={editValues.swiggyRestaurantId || ""}
                                      onChange={(e) =>
                                        setEditValues((v) => ({
                                          ...v,
                                          swiggyRestaurantId: e.target.value,
                                        }))
                                      }
                                      placeholder="Swiggy ID"
                                      className="border rounded-lg px-2 py-1 text-xs w-36 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-orange-50/30 border-orange-200"
                                    />
                                  ) : task.swiggyRestaurantId ? (
                                    <span className="inline-block px-2 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200 font-mono text-xs font-semibold">
                                      {task.swiggyRestaurantId}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 font-mono text-xs">—</span>
                                  )}
                                </td>
                              );

                            case "zomatoRestaurantId":
                              return (
                                <td
                                  key="zomatoRestaurantId"
                                  style={stickyStyle}
                                  className={`px-3 py-2.5 whitespace-nowrap ${
                                    isFloating ? `${cellBg} border-r border-purple-100` : ""
                                  }`}
                                >
                                  {editing ? (
                                    <input
                                      type="text"
                                      value={editValues.zomatoRestaurantId || ""}
                                      onChange={(e) =>
                                        setEditValues((v) => ({
                                          ...v,
                                          zomatoRestaurantId: e.target.value,
                                        }))
                                      }
                                      placeholder="Zomato ID"
                                      className="border rounded-lg px-2 py-1 text-xs w-36 focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50/30 border-red-200"
                                    />
                                  ) : task.zomatoRestaurantId ? (
                                    <span className="inline-block px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200 font-mono text-xs font-semibold">
                                      {task.zomatoRestaurantId}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 font-mono text-xs">—</span>
                                  )}
                                </td>
                              );

                            case "platform":
                              return (
                                <td
                                  key="platform"
                                  style={stickyStyle}
                                  className={`px-3 py-2.5 whitespace-nowrap ${
                                    isFloating ? `${cellBg} border-r border-purple-100` : ""
                                  }`}
                                >
                                  {editing ? (
                                    <select
                                      value={editValues.platform || ""}
                                      onChange={(e) =>
                                        setEditValues((v) => ({
                                          ...v,
                                          platform: e.target.value,
                                        }))
                                      }
                                      className={`border rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 ${getPlatformClass(
                                        editValues.platform || ""
                                      )}`}
                                    >
                                      <option value="" className="bg-white text-gray-700">Select Platform</option>
                                      {PLATFORM_OPTIONS.map((p) => (
                                        <option key={p} value={p} className="bg-white text-gray-800">
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
                              );

                            case "accountStatus":
                              return (
                                <td
                                  key="accountStatus"
                                  style={stickyStyle}
                                  className={`px-3 py-2.5 whitespace-nowrap ${
                                    isFloating ? `${cellBg} border-r border-purple-100` : ""
                                  }`}
                                >
                                  {editing ? (
                                    <select
                                      value={editValues.accountStatus || ""}
                                      onChange={(e) =>
                                        setEditValues((v) => ({
                                          ...v,
                                          accountStatus: e.target.value,
                                        }))
                                      }
                                      className={`border rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 ${getAccountStatusClass(
                                        editValues.accountStatus || "Pending"
                                      )}`}
                                    >
                                      {ACCOUNT_STATUS_OPTIONS.map((opt) => (
                                        <option
                                          key={opt.value}
                                          value={opt.value}
                                          className="bg-white text-gray-800 font-normal"
                                        >
                                          {opt.label}
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
                              );

                            case "outletCreated":
                              return (
                                <td
                                  key="outletCreated"
                                  style={stickyStyle}
                                  className={`px-3 py-2.5 whitespace-nowrap ${
                                    isFloating ? `${cellBg} border-r border-purple-100` : ""
                                  }`}
                                >
                                  {editing ? (
                                    <select
                                      value={editValues.outletCreated || ""}
                                      onChange={(e) =>
                                        setEditValues((v) => ({
                                          ...v,
                                          outletCreated: e.target.value,
                                        }))
                                      }
                                      className={`border rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                                        editValues.outletCreated === "Yes"
                                          ? "bg-green-100 text-green-700 border-green-300"
                                          : editValues.outletCreated === "No"
                                          ? "bg-red-100 text-red-700 border-red-300"
                                          : "bg-gray-100 text-gray-700 border-gray-300"
                                      }`}
                                    >
                                      <option value="" className="bg-white text-gray-700">Select</option>
                                      {filterOptions.outletCreatedOptions.map((o) => (
                                        <option key={o} value={o} className="bg-white text-gray-800">
                                          {o}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                        task.outletCreated === "Yes"
                                          ? "bg-green-100 text-green-700 border border-green-200"
                                          : task.outletCreated === "No"
                                          ? "bg-red-100 text-red-700 border border-red-200"
                                          : "bg-gray-100 text-gray-500 border border-gray-200"
                                      }`}
                                    >
                                      {task.outletCreated || "Pending"}
                                    </span>
                                  )}
                                </td>
                              );

                            case "remarks": {
                              const latestNote = task.recentNotes?.[0];
                              const notesCount = task.recentNotes?.length || 0;
                              return (
                                <td
                                  key="remarks"
                                  style={stickyStyle}
                                  className={`px-3 py-2.5 min-w-[220px] max-w-[280px] ${
                                    isFloating ? `${cellBg} border-r border-purple-100` : ""
                                  }`}
                                >
                                  {editing ? (
                                    <div className="space-y-1.5">
                                      <textarea
                                        value={editValues.remarks || ""}
                                        onChange={(e) =>
                                          setEditValues((v) => ({
                                            ...v,
                                            remarks: e.target.value,
                                          }))
                                        }
                                        placeholder="Add onboarding remark..."
                                        rows={2}
                                        className="border rounded-lg px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-purple-400 resize-none shadow-sm"
                                      />
                                      {latestNote && (
                                        <div className="text-[11px] text-gray-500 bg-gray-50 p-1.5 rounded border border-gray-100">
                                          <span className="font-semibold text-gray-700">Team Note:</span>{" "}
                                          <span className="line-clamp-1">{latestNote.content}</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() => setActiveNotesTask(task)}
                                      className="group cursor-pointer p-1.5 rounded-lg hover:bg-purple-50/60 border border-transparent hover:border-purple-200 transition"
                                      title="Click to view notes and add new remark"
                                    >
                                      {latestNote ? (
                                        <div className="space-y-0.5">
                                          <div className="flex items-center justify-between gap-1 text-[11px]">
                                            <span className="font-semibold text-purple-900 truncate">
                                              {latestNote.authorName}
                                            </span>
                                            <span className="text-gray-400 text-[10px] shrink-0">
                                              {getTimeElapsed(latestNote.createdAt).text}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
                                            {latestNote.content}
                                          </p>
                                          {notesCount > 1 && (
                                            <span className="inline-flex items-center gap-1 text-[10px] text-purple-600 font-medium pt-0.5">
                                              <MessageSquare size={10} />
                                              {notesCount} total notes
                                            </span>
                                          )}
                                        </div>
                                      ) : task.remarks ? (
                                        <div className="text-xs text-gray-700 truncate" title={task.remarks}>
                                          {task.remarks}
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-purple-600">
                                          <MessageSquare size={12} />
                                          <span>Add remark / note...</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>
                              );
                            }

                            default:
                              return null;
                          }
                        })}
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

      {/* ─── Task Notes & Remarks Modal (Synced with Team Board) ──────────────── */}
      {activeNotesTask && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => {
            setActiveNotesTask(null);
            setNewNoteContent("");
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col border border-gray-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-purple-50 via-white to-pink-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    Task Notes & Remarks
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    {activeNotesTask.shopName || activeNotesTask.title} • Live with Team Board
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveNotesTask(null);
                  setNewNoteContent("");
                }}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Existing Notes List */}
            <div className="overflow-y-auto flex-1 p-5 space-y-3 bg-gray-50/50">
              {(!activeNotesTask.recentNotes || activeNotesTask.recentNotes.length === 0) ? (
                <div className="text-center py-10">
                  <MessageSquare size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-500">No remarks or notes yet</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Add a note below to update remarks both here and in Team Board
                  </p>
                </div>
              ) : (
                activeNotesTask.recentNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-sm space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                          {(note.authorName || "A")[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-xs text-gray-900">
                          {note.authorName}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {formatDate(note.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed pl-8">
                      {note.content}
                    </p>
                    {note.fileUrl && (
                      <div className="pl-8 pt-1">
                        <a
                          href={note.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-purple-600 hover:underline inline-flex items-center gap-1"
                        >
                          📎 View attachment
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add New Note Box */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Type a new remark or update note for this task..."
                  rows={2}
                  className="flex-1 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none border-gray-200 shadow-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleAddNote(activeNotesTask.taskId);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddNote(activeNotesTask.taskId)}
                  disabled={submittingNote || !newNoteContent.trim()}
                  className="px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shrink-0"
                >
                  {submittingNote ? (
                    <FaSpinner className="animate-spin" size={12} />
                  ) : (
                    <Send size={13} />
                  )}
                  <span>Post</span>
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 pl-1">
                Press Ctrl+Enter to post • Updates sync live with Team Board
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Drawer Side Panel (Section-wise Onboarding Details) ─────────── */}
      {drawerTask && (
        <div className="fixed inset-0 z-[200] overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={closeEditDrawer}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
            <div
              style={{ width: `${drawerWidth}px`, maxWidth: "95vw" }}
              className="relative bg-white shadow-2xl flex flex-col border-l border-slate-200 h-full transition-[width] duration-75 ease-out select-text"
            >
              {/* Draggable Vertical Resize Handle on Left Border */}
              <div
                onMouseDown={handleDrawerResizeStart}
                className={`absolute -left-2 top-0 bottom-0 w-4 cursor-col-resize z-50 group flex items-center justify-center hover:bg-purple-500/10 transition select-none ${
                  isResizingDrawer ? "bg-purple-500/20" : ""
                }`}
                title="Drag left/right to resize panel width"
              >
                <div
                  className={`w-1.5 h-12 rounded-full transition shadow-sm ${
                    isResizingDrawer
                      ? "bg-purple-600 ring-4 ring-purple-300"
                      : "bg-slate-300 group-hover:bg-purple-500"
                  }`}
                />
              </div>

              {/* Drawer Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-purple-50 via-white to-indigo-50/70 border-b border-slate-200/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl shadow-md shrink-0">
                    <SlidersHorizontal size={20} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                      Edit Onboarding Record
                    </h2>
                    <p className="text-xs text-purple-700 font-semibold truncate max-w-[340px]">
                      Task & Account Controls
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeEditDrawer}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
                  title="Close panel"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content — Scrollable Section Wise Form */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-slate-50/40">
                {/* ── Prominent Restaurant Headline Card ── */}
                <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/10 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-purple-400/20 rounded-full blur-xl pointer-events-none" />

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold uppercase tracking-wider text-purple-100 mb-2 backdrop-blur-sm border border-white/10">
                    <Store size={13} />
                    <span>Restaurant / Shop</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm line-clamp-2 px-2">
                    {drawerTask.shopName || drawerTask.title || "—"}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-purple-900 shadow-sm">
                      {drawerTask.title.replace(/^[^\w]*/, "").trim()}
                    </span>
                    {drawerTask.phone && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                        📞 {drawerTask.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Section 1: Task Overview ── */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                      <Store size={14} className="text-purple-600" />
                      <span>Task Information</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getCategoryBadgeClass(drawerTask.title)}`}>
                      {drawerTask.title.replace(/^[^\w]*/, "").trim()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 text-xs pt-2 border-t border-slate-100">
                    <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/60 col-span-2">
                      <span className="text-purple-600 block text-[10px] font-bold uppercase tracking-wider mb-0.5">
                        Restaurant Name
                      </span>
                      <span className="font-extrabold text-slate-900 text-base">
                        {drawerTask.shopName || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                        Customer & Phone
                      </span>
                      <span className="font-semibold text-slate-800">
                        {drawerTask.customerName || "—"} {drawerTask.phone ? `(${drawerTask.phone})` : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                        Assigned To
                      </span>
                      <span className="font-semibold text-slate-800">
                        {drawerTask.assigneeName || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                        Assigned By
                      </span>
                      <span className="font-semibold text-slate-800">
                        {drawerTask.assignerName || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                        Created Date
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatDate(drawerTask.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Workflow & Statuses ── */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <Layers size={14} className="text-purple-600" />
                    <span>Workflow & Account Status</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    {/* Team Board Stage */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Team Board Stage
                      </label>
                      <select
                        value={drawerValues.taskStatus || "todo"}
                        onChange={(e) =>
                          setDrawerValues((v) => ({ ...v, taskStatus: e.target.value }))
                        }
                        className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm transition ${getStageBadgeClass(
                          drawerValues.taskStatus || "todo"
                        )}`}
                      >
                        {TASK_STAGE_OPTIONS.map((st) => (
                          <option key={st.value} value={st.value} className="bg-white text-gray-800 font-normal">
                            {st.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Syncs live with Team Board
                      </p>
                    </div>

                    {/* Account Status */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Account Status
                      </label>
                      <select
                        value={drawerValues.accountStatus || "Pending"}
                        onChange={(e) =>
                          setDrawerValues((v) => ({ ...v, accountStatus: e.target.value }))
                        }
                        className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm transition ${getAccountStatusClass(
                          drawerValues.accountStatus || "Pending"
                        )}`}
                      >
                        {ACCOUNT_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-white text-gray-800 font-normal">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Platform */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Platform
                      </label>
                      <select
                        value={drawerValues.platform || ""}
                        onChange={(e) =>
                          setDrawerValues((v) => ({ ...v, platform: e.target.value }))
                        }
                        className={`w-full border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm transition ${getPlatformClass(
                          drawerValues.platform || ""
                        )}`}
                      >
                        <option value="" className="bg-white text-gray-700">Select Platform</option>
                        {PLATFORM_OPTIONS.map((p) => (
                          <option key={p} value={p} className="bg-white text-gray-800">
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Outlet Created */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Outlet Created
                      </label>
                      <select
                        value={drawerValues.outletCreated || "Pending"}
                        onChange={(e) =>
                          setDrawerValues((v) => ({ ...v, outletCreated: e.target.value }))
                        }
                        className={`w-full border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm transition ${
                          drawerValues.outletCreated === "Yes"
                            ? "bg-green-100 text-green-700 border-green-300"
                            : drawerValues.outletCreated === "No"
                            ? "bg-red-100 text-red-700 border-red-300"
                            : "bg-gray-100 text-gray-700 border-gray-300"
                        }`}
                      >
                        {["Pending", "Yes", "No"].map((o) => (
                          <option key={o} value={o} className="bg-white text-gray-800">
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* ── Section 3: Platform IDs ── */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <FileText size={14} className="text-purple-600" />
                    <span>Restaurant Platform IDs</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    {/* Swiggy Restaurant ID */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Swiggy Restaurant ID
                      </label>
                      <input
                        type="text"
                        value={drawerValues.swiggyRestaurantId || ""}
                        onChange={(e) =>
                          setDrawerValues((v) => ({ ...v, swiggyRestaurantId: e.target.value }))
                        }
                        placeholder="e.g. SWIGGY-12938"
                        className="w-full border border-orange-200 bg-orange-50/20 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
                      />
                    </div>

                    {/* Zomato Restaurant ID */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Zomato Restaurant ID
                      </label>
                      <input
                        type="text"
                        value={drawerValues.zomatoRestaurantId || ""}
                        onChange={(e) =>
                          setDrawerValues((v) => ({ ...v, zomatoRestaurantId: e.target.value }))
                        }
                        placeholder="e.g. ZOMATO-94812"
                        className="w-full border border-red-200 bg-red-50/20 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-red-400 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section 4: Team Board Notes & Remarks ── */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                      <MessageSquare size={14} className="text-purple-600" />
                      <span>Task Notes & Remarks</span>
                    </div>
                    <span className="text-[11px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                      Live Sync with Team Board
                    </span>
                  </div>

                  {/* Existing Notes History */}
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {(!drawerTask.recentNotes || drawerTask.recentNotes.length === 0) ? (
                      <p className="text-xs text-slate-400 italic py-2 text-center">
                        No previous notes on this task
                      </p>
                    ) : (
                      drawerTask.recentNotes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-purple-900">
                              {note.authorName}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {formatDate(note.createdAt)}
                            </span>
                          </div>
                          <p className="text-slate-700 text-xs whitespace-pre-wrap leading-relaxed">
                            {note.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add New Note inline in drawer */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Add New Note / Remark
                    </label>
                    <div className="flex gap-2">
                      <textarea
                        value={drawerNewNote}
                        onChange={(e) => setDrawerNewNote(e.target.value)}
                        placeholder="Write a remark or update for team board..."
                        rows={2}
                        className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none shadow-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            handleDrawerAddNote();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleDrawerAddNote}
                        disabled={drawerPostingNote || !drawerNewNote.trim()}
                        className="px-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition disabled:opacity-40 shadow-sm shrink-0"
                        title="Post immediately to team board"
                      >
                        {drawerPostingNote ? (
                          <FaSpinner className="animate-spin" size={12} />
                        ) : (
                          <Send size={13} />
                        )}
                        <span>Post</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Press Ctrl+Enter or click Post to send to Team Board
                    </p>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Buttons — Fixed at bottom with high z-index and spacing above bottom bar */}
              <div className="px-6 py-3.5 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex items-center justify-between gap-3 shrink-0 mb-10">
                <button
                  type="button"
                  onClick={closeEditDrawer}
                  disabled={drawerSaving}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (drawerTask) {
                        openAuditLog(drawerTask.taskId);
                      }
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                  >
                    <FaHistory size={11} />
                    Audit Log
                  </button>

                  <button
                    type="button"
                    onClick={saveEditDrawer}
                    disabled={drawerSaving}
                    className="px-6 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl transition shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    {drawerSaving ? (
                      <FaSpinner className="animate-spin" size={12} />
                    ) : (
                      <FaSave size={12} />
                    )}
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

