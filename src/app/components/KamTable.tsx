"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { format, differenceInDays, isToday, subDays, startOfMonth } from "date-fns";
import { useUser } from "@clerk/nextjs";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import { FileText } from "lucide-react"; // Note icon
import NotesModal from "../components/NotesModal";
import { FaStickyNote } from "react-icons/fa";

import { saveAs } from "file-saver";

import {
  FaSearch,
  FaEdit,
  FaEye,
  FaRupeeSign,
  FaCheckCircle,
  FaMoneyBillWave,
  FaReceipt,
  FaSpinner,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaCalendarAlt,
  FaStore,
  FaUserCircle,
  FaClipboardList,
  FaUsers,
  FaTasks,
  FaDownload,
  FaCaretDown,
  FaCaretUp,
} from "react-icons/fa";
import HighlightColorPicker from "../components/ui/HighlightColorPicker";
import PaginationControls from "../components/PaginationControls";

interface Task {
  id: string;
  title: string;
  shopName?: string;
  customerName?: string;
  packageAmount?: string;
  startDate?: string;
  endDate?: string;
  timeline?: string;
  assignerName?: string;
  assigneeName?: string;
  createdAt: string;
  assignees?: { name?: string; email?: string }[];
  amount?: number | null;
  received?: number | null;
  customFields?: Record<string, string | number>;
  highlightColor?: string;
  status?: "todo" | "inprogress" | "done" | "Archived";
  notes?: any; // Changed from string to any to handle Note[] objects from API
}

function stripEmojis(str: string): string {
  return str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "").trim();
}

const TASK_CATEGORIES = [
  { label: "🍽️ Zomato Onboarding", value: "Zomato Onboarding" },
  { label: "🍔 Swiggy Onboarding", value: "Swiggy Onboarding" },
  { label: "🍽️🍔 Zomato + Swiggy Combo", value: "Zomato + Swiggy Combo" },
  { label: "🧾 Food License", value: "Food License" },
  { label: "📸 Photo Upload", value: "Photo Upload" },
  { label: "📂 Account Handling", value: "Account Handling" },
  { label: "🛠️ Other", value: "Other" },
];

export default function KamTableView() {
  const { user, isLoaded } = useUser();
  const [allRawTasks, setAllRawTasks] = useState<Task[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [editedValues, setEditedValues] = useState<{
    [key: string]: number;
  }>({});
  const [editedStatusValues, setEditedStatusValues] = useState<{
    [key: string]: "todo" | "inprogress" | "done" | "Archived";
  }>({});
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Task | "pendingAmount" | "daysRemaining";
    direction: "ascending" | "descending";
  } | null>(null);

  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
      if (
        assigneeDropdownRef.current &&
        !assigneeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAssigneeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ✅ DEBOUNCE SEARCH to prevent multiple API calls while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const fetchAllTasks = useCallback(async () => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      // ✅ Pass all pagination and filter parameters to the API
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        query: debouncedQuery || "",
        status: statusFilter || "",
        sortKey: sortConfig?.key || "createdAt",
        sortDir: sortConfig?.direction === "ascending" ? "asc" : "desc",
      });

      const res = await fetch(`/api/kam?${params.toString()}`);
      const data = await res.json();

      if (data.tasks) {
        setAllRawTasks(data.tasks);
        setTotalItems(data.pagination?.total || data.tasks.length);
      }
    } catch (err) {
      console.error("Failed to fetch Kam tasks:", err);
      toast.error("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
      setIsFirstLoad(false);
    }
  }, [user, isLoaded, page, limit, debouncedQuery, statusFilter, sortConfig]);

  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks]);

  const filteredAndSortedTasks = useMemo(() => {
    let currentTasks = [...allRawTasks];
    const now = new Date();

    if (query) {
      const lower = query.toLowerCase();
      currentTasks = currentTasks.filter((t) =>
        [
          t.title,
          t.shopName,
          t.customerName,
          t.assignerName,
          t.assigneeName,
          t.status,
          t.customFields?.email,
          t.customFields?.phone,
          t.customFields?.location,
          t.assignees?.map(a => a.name || a.email).join(' '),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(lower)
      );
    }

    if (statusFilter) {
      currentTasks = currentTasks.filter((t) => t.status === statusFilter);
    }

    if (selectedCategories.length > 0) {
      currentTasks = currentTasks.filter(
        (t) => t.title && selectedCategories.includes(stripEmojis(t.title))
      );
    }

    if (selectedAssignees.length > 0) {
      currentTasks = currentTasks.filter((t) =>
        t.assignees?.some(
          (a) => (a.name || a.email) && selectedAssignees.includes(a.name || a.email || '')
        ) || (t.assigneeName && selectedAssignees.includes(t.assigneeName))
      );
    }

    if (dateFilter) {
      currentTasks = currentTasks.filter((t) => {
        const taskDate = new Date(t.createdAt);
        switch (dateFilter) {
          case "today":
            return isToday(taskDate);
          case "yesterday":
            const yesterday = subDays(now, 1);
            return format(taskDate, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd");
          case "last_7_days":
            const sevenDaysAgo = subDays(now, 7);
            return taskDate >= sevenDaysAgo && taskDate <= now;
          case "this_month":
            const startOfCurrentMonth = startOfMonth(now);
            return taskDate >= startOfCurrentMonth && taskDate <= now;
          case "last_month":
            const startOfLastMonth = startOfMonth(subDays(now, 30));
            const endOfLastMonth = subDays(startOfMonth(now), 1);
            return taskDate >= startOfLastMonth && taskDate <= endOfLastMonth;
          case "this_year":
            const startOfCurrentYear = new Date(now.getFullYear(), 0, 1);
            return taskDate >= startOfCurrentYear && taskDate <= now;
          default:
            return true;
        }
      });
    }

    if (sortConfig !== null) {
      currentTasks.sort((a: Task, b: Task) => {
        let aValue: string | number;;
        let bValue: string | number;;

        if (sortConfig.key === "pendingAmount") {
          aValue = (Number(a.amount) || 0) - (Number(a.received) || 0);
          bValue = (Number(b.amount) || 0) - (Number(b.received) || 0);
        } else if (sortConfig.key === "daysRemaining") {
          const aEndDate = a.endDate ? new Date(a.endDate) : null;
          const bEndDate = b.endDate ? new Date(b.endDate) : null;
          aValue = aEndDate ? differenceInDays(aEndDate, new Date()) : Infinity;
          bValue = bEndDate ? differenceInDays(bEndDate, new Date()) : Infinity;
        } else if (
          sortConfig.key === "createdAt" ||
          sortConfig.key === "startDate" ||
          sortConfig.key === "endDate"
        ) {
          aValue = a[sortConfig.key]
            ? new Date(a[sortConfig.key] as string).getTime()
            : -Infinity;
          bValue = b[sortConfig.key]
            ? new Date(b[sortConfig.key] as string).getTime()
            : -Infinity;
        } else if (sortConfig.key === "shopName") {
          aValue = a.shopName || '';
          bValue = b.shopName || '';
        } else if (sortConfig.key === "customerName") {
          aValue = a.customerName || '';
          bValue = b.customerName || '';
        } else if (sortConfig.key === "assignerName") {
          aValue = a.assignerName || '';
          bValue = b.assignerName || '';
        } else if (sortConfig.key === "assigneeName") {
          // const aAssignee = a.assignees?.[0]?.name || a.assigneeName || '';
          // const bAssignee = b.assignees?.[0]?.name || b.assigneeName || '';
          const aAssignee = (a.assignees?.[0]?.name ?? a.assigneeName) ?? '';
          const bAssignee = (b.assignees?.[0]?.name ?? b.assigneeName) ?? '';

          aValue = aAssignee;
          bValue = bAssignee;
        }
        else {
          aValue = a[sortConfig.key as keyof Task] as string | number;
          bValue = b[sortConfig.key as keyof Task] as string | number;
        }
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortConfig.direction === "ascending" ? 1 : -1;
        if (bValue === undefined) return sortConfig.direction === "ascending" ? -1 : 1;

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "ascending" ? aValue - bValue : bValue - aValue;
        }
        return sortConfig.direction === "ascending"
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }

    return currentTasks;
  }, [allRawTasks, query, statusFilter, selectedCategories, selectedAssignees, dateFilter, sortConfig]);

  useEffect(() => {
    // Since API already handles pagination, we don't slice here anymore
    setTasks(filteredAndSortedTasks);
  }, [filteredAndSortedTasks]);

  useEffect(() => {
    // When filters change, go back to page 1
    if (isLoaded) {
      setPage(1);
    }
  }, [debouncedQuery, statusFilter, selectedCategories, selectedAssignees, dateFilter]);

  const handleInputChange = (
    taskId: string,
    field: "amount" | "received",
    value: number
  ) => {
    const key = `${taskId}-${field}`;
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleStatusChange = async (
    taskId: string,
    value: "todo" | "inprogress" | "done" | "Archived"
  ) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
            ...t,
            status: value,
          }
          : t
      )
    );























    setEditedStatusValues((prev) => ({ ...prev, [taskId]: value }));

    setIsSaving(`${taskId}-status`);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: value }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to update status");
      }
      toast.success("Status updated!");
      setEditedStatusValues((prev) => {
        const copy = { ...prev };
        delete copy[taskId];
        return copy;
      });

      setAllRawTasks(prevAllRawTasks =>
        prevAllRawTasks.map(task =>
          task.id === taskId ? { ...task, status: value } : task
        )
      );

    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Failed to update status. Please try again.");
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
              ...t,
              status: allRawTasks.find((task) => task.id === taskId)?.status,
            }
            : t
        )
      );
    } finally {
      setIsSaving(null);
    }
  };

  const handleBlur = async (
    taskId: string,
    field: "amount" | "received"
  ) => {
    const key = `${taskId}-${field}`;
    const value = editedValues[key];

    const originalTask = allRawTasks.find((t) => t.id === taskId);
    const originalValue = Number(originalTask?.[field]) || 0;

    if (
      typeof value === "number" &&
      !isNaN(value) &&
      value !== originalValue
    ) {
      setIsSaving(key);
      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        });

        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || `Failed to update ${field}`);
        }

        toast.success(
          `${field.charAt(0).toUpperCase() + field.slice(1)} updated!`
        );

        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                ...t,
                [field]: value,
              }
              : t
          )
        );
        setEditedValues((prev) => {
          const copy = { ...prev };
          delete copy[key];
          return copy;
        });

        setAllRawTasks(prevAllRawTasks =>
          prevAllRawTasks.map(task =>
            task.id === taskId ? { ...task, [field]: value } : task
          )
        );

      } catch (err) {
        console.error("Update error:", err);
        toast.error(`Failed to update ${field}. Please try again.`);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                ...t,
                [field]: originalValue,
              }
              : t
          )
        );
      } finally {
        setIsSaving(null);
      }
    } else {
      setEditedValues((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const formatCurrency = (amount: number | string | undefined): string => {
    if (typeof amount === "string") {
      const num = parseFloat(amount);
      if (!isNaN(num)) return `₹${num.toLocaleString("en-IN")}`;
    } else if (typeof amount === "number") {
      return `₹${amount.toLocaleString("en-IN")}`;
    }
    return "—";
  };

  const requestSort = (key: keyof Task | "pendingAmount" | "daysRemaining") => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };


















  const getSortIcon = (key: keyof Task | "pendingAmount" | "daysRemaining") => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === "ascending" ? (
      <FaArrowUp className="ml-1 text-xs" />
    ) : (
      <FaArrowDown className="ml-1 text-xs" />
    );
  };

  const getStatusBadge = (status: Task["status"]) => {
    let colorClass = "";
    switch (status) {
      case "todo":
        colorClass = "bg-gray-100 text-gray-700 ring-gray-600/20";
        break;
      case "inprogress":
        colorClass = "bg-blue-100 text-blue-700 ring-blue-700/10";
        break;
      case "done":
        colorClass = "bg-green-100 text-green-700 ring-green-600/20";
        break;
      case "Archived":
        colorClass = "bg-yellow-100 text-yellow-700 ring-yellow-600/20";
        break;
      default:
        colorClass = "bg-gray-50 text-gray-600 ring-gray-500/10";
    }
    return (
      <span
        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${colorClass}`}
      >
        {status || "N/A"}
      </span>
    );
  };

  const exportCSV = () => {
    const exportData = filteredAndSortedTasks.map((task, index) => ({
      "S. No.": index + 1,
      Title: task.title,
      Status: task.status,
      "Shop Name": task.shopName,
      "Customer Name": task.customerName,
      "Package Amount": task.packageAmount,
      "Start Date": task.startDate ? format(new Date(task.startDate), "dd MMM yyyy") : "",
      "End Date": task.endDate ? format(new Date(task.endDate), "dd MMM yyyy") : "",
      "Days Left": task.endDate ? differenceInDays(new Date(task.endDate), new Date()) : "",
      Timeline: task.timeline,
      Assigner: task.assignerName,
      // Assignee:
      //   task.assignees?.map((a) => a?.name || a?.email).filter(Boolean).join(", ") ||
      //   task.assigneeName ||
      //   "—",

      Assignee:
        (task.assignees?.map((a) => a?.name ?? a?.email).filter(Boolean).join(", ")) ??
        task.assigneeName ??
        "—",

      Amount: task.amount,
      Received: task.received,
      "Pending Amount": (Number(task.amount) || 0) - (Number(task.received) || 0),
      "Created At": task.createdAt
        ? format(new Date(task.createdAt), "dd MMM yyyy, HH:mm")
        : "",
      "Highlight Color": task.highlightColor || "",
      ...(task.customFields || {}),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Account_Handling_Tasks");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `Account_Handling_Tasks_Report_${Date.now()}.xlsx`);
    toast.success("CSV exported successfully!");
  };

  const uniqueAssigneeNames = useMemo(() => {
    const names = new Set<string>();
    allRawTasks.forEach(task => {
      task.assignees?.forEach(assignee => {
        if (assignee.name || assignee.email) {
          names.add(assignee.name || assignee.email || '');
        }
      });
      if (task.assigneeName) {
        names.add(task.assigneeName);
      }
    });
    return Array.from(names).sort();
  }, [allRawTasks]);

  const getCategoryDropdownDisplayText = () => {
    if (selectedCategories.length === 0) {
      return "All Categories";
    } else if (selectedCategories.length === TASK_CATEGORIES.length) {
      return "All Categories Selected";
    } else if (selectedCategories.length === 1) {
      return TASK_CATEGORIES.find(cat => cat.value === selectedCategories[0])?.label || "1 Category Selected";
    } else {
      return `${selectedCategories.length} Categories Selected`;
    }
  };

  const getAssigneeDropdownDisplayText = () => {
    if (selectedAssignees.length === 0) {
      return "All Assignees";
    } else if (selectedAssignees.length === uniqueAssigneeNames.length) {
      return "All Assignees Selected";
    } else if (selectedAssignees.length === 1) {
      return selectedAssignees[0];
    } else {
      return `${selectedAssignees.length} Assignees Selected`;
    }
  };

  if (loading && isFirstLoad) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl shadow-xl border border-gray-100 p-12">
        <FaSpinner className="animate-spin text-indigo-500 text-5xl mr-4" />
        <p className="text-xl text-gray-700 font-medium pt-4">
          Loading Account Handling tasks...
        </p>
      </div>
    );
  }

  // Save note handler



  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const userRole = String(user?.publicMetadata?.role || "").toLowerCase();

  if (
    !userRole ||
    (userRole !== "admin" && userRole !== "master" && userRole !== "seller" && userRole !== "tl")
  ) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-2xl shadow-lg border border-gray-200 min-h-[300px] flex flex-col items-center justify-center">
        <FaExclamationTriangle className="text-red-500 text-6xl mb-4" />
        <p className="text-2xl font-semibold text-gray-800">Access Denied</p>
        <p className="text-base mt-2 text-gray-600">
          You do not have the necessary permissions to view Account Handling
          tasks.
        </p>
        <p className="text-sm mt-1 text-gray-500">
          Please contact your administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  if (tasks.length === 0 && !loading && filteredAndSortedTasks.length === 0)
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-2xl shadow-lg border border-gray-200 min-h-[300px] flex flex-col items-center justify-center">
        <FaExclamationTriangle className="text-yellow-500 text-6xl mb-4" />
        <p className="text-2xl font-semibold text-gray-800">
          No Account Handling tasks found.
        </p>
        <p className="text-base mt-2 text-gray-600">
          Try adjusting your search or filters, or there are no tasks matching
          your permissions.
        </p>
      </div>
    );

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl shadow-xl border border-blue-200 min-h-screen">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <h2 className="text-4xl font-extrabold text-gray-900 flex items-center gap-3">
          <FaMoneyBillWave className="text-indigo-600 text-4xl" /> Account
          Handling Tracker
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex items-center">
            <FaSearch className="absolute left-3 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-base shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out modern-input w-64"
            />
            {loading && !isFirstLoad && (
              <FaSpinner className="absolute right-3 text-indigo-500 animate-spin" />
            )}
          </div>

          <button
            onClick={() => setEditMode((prev) => !prev)}
            className={`px-6 py-2.5 rounded-xl font-semibold shadow-md transition-all duration-300 flex items-center gap-2 text-base
              ${editMode
                ? "bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
                : "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${editMode ? "focus:ring-red-500" : "focus:ring-indigo-500"
              }`}
          >
            {editMode ? (
              <>
                <FaEye /> View Mode
              </>
            ) : (
              <>
                <FaEdit /> Edit Mode
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-xl mb-4 shadow-sm">
        <select
          value={statusFilter || ""}
          onChange={(e) => setStatusFilter(e.target.value || null)}
          className="p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="inprogress">In Progress</option>
          <option value="done">Done</option>
          <option value="Archived">Archived</option>
        </select>

        <div className="relative" ref={categoryDropdownRef}>
          <button
            type="button"
            className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between min-w-[150px]"
            onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
          >
            <span>{getCategoryDropdownDisplayText()}</span>
            {isCategoryDropdownOpen ? <FaCaretUp className="ml-2" /> : <FaCaretDown className="ml-2" />}
          </button>
          {isCategoryDropdownOpen && (
            <div className="absolute z-20 mt-1 w-56 max-h-60 overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                {TASK_CATEGORIES.map((cat) => (
                  <label
                    key={cat.value}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    role="menuitem"
                  >
                    <input
                      type="checkbox"
                      className="accent-blue-600"
                      checked={selectedCategories.includes(cat.value)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setSelectedCategories((prev) =>
                          isChecked ? [...prev, cat.value] : prev.filter((v) => v !== cat.value)
                        );
                      }}
                    />
                    {cat.label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={assigneeDropdownRef}>
          <button
            type="button"
            className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between min-w-[150px]"
            onClick={() => setIsAssigneeDropdownOpen((prev) => !prev)}
          >
            <span>{getAssigneeDropdownDisplayText()}</span>
            {isAssigneeDropdownOpen ? <FaCaretUp className="ml-2" /> : <FaCaretDown className="ml-2" />}
          </button>
          {isAssigneeDropdownOpen && (
            <div className="absolute z-20 mt-1 w-56 max-h-60 overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                {uniqueAssigneeNames.length > 0 ? (
                  uniqueAssigneeNames.map((assignee) => (
                    <label
                      key={assignee}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      role="menuitem"
                    >
                      <input
                        type="checkbox"
                        className="accent-blue-600"
                        checked={selectedAssignees.includes(assignee)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setSelectedAssignees((prev) =>
                            isChecked ? [...prev, assignee] : prev.filter((v) => v !== assignee)
                          );
                        }}
                      />
                      {assignee}
                    </label>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">No assignees found.</div>
                )}
              </div>
            </div>
          )}
        </div>

        <select
          value={dateFilter || ""}
          onChange={(e) => setDateFilter(e.target.value || null)}
          className="p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Dates</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last_7_days">Last 7 Days</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="this_year">This Year</option>
        </select>

        <button
          className="inline-flex items-center bg-green-600 text-white font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ease-in-out"
          onClick={exportCSV}
        >
          <FaDownload className="inline mr-2 -ml-1" /> Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-xl">
        <table className="min-w-full divide-y divide-gray-200 text-sm border-collapse">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center border-b border-gray-200 border-r
                                sticky top-0 left-0 bg-gray-200 z-30 rounded-tl-2xl"
              >
                S. No.
              </th>
              <th
                className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors
                                sticky top-0 left-[calc(0rem+48px)] bg-gray-100 z-20"
                onClick={() => requestSort("shopName")}
              >
                <div className="flex items-center whitespace-nowrap">
                  <FaStore className="mr-2 text-gray-500" /> Shop{" "}
                  {getSortIcon("shopName")}
                </div>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => requestSort("title")}
              >
                Title{" "}
                {getSortIcon("title")}
              </th>
              <th
                className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => requestSort("status")}
              >
                <div className="flex items-center whitespace-nowrap">
                  <FaTasks className="mr-2 text-gray-500" /> Status{" "}
                  {getSortIcon("status")}
                </div>
              </th>
              <th
                className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => requestSort("createdAt")}
              >
                <div className="flex items-center whitespace-nowrap">
                  <FaCalendarAlt className="mr-2 text-gray-500" /> Created{" "}
                  {getSortIcon("createdAt")}
                </div>
              </th>
              <th
                className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => requestSort("customerName")}
              >
                <div className="flex items-center whitespace-nowrap">
                  <FaUserCircle className="mr-2 text-gray-500" /> Customer{" "}
                  {getSortIcon("customerName")}
                </div>
              </th>
              <th
                className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => requestSort("startDate")}
              >
                <div className="flex items-center whitespace-nowrap">
                  <FaCalendarAlt className="mr-2 text-gray-500" /> Start Date{" "}
                  {getSortIcon("startDate")}
                </div>
              </th>
              <th
                className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => requestSort("endDate")}
              >
                <div className="flex items-center whitespace-nowrap">
                  <FaCalendarAlt className="mr-2 text-gray-500" /> End Date{" "}
                  {getSortIcon("endDate")}
                </div>
              </th>
              <th
                className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => requestSort("daysRemaining")}
              >
                <div className="flex items-center whitespace-nowrap">
                  <FaCalendarAlt className="mr-2 text-gray-500" /> Days Left{" "}
                  {getSortIcon("daysRemaining")}
                </div>
              </th>
              <th
                className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r"
              >
                <div className="flex items-center whitespace-nowrap">
                  <FaClipboardList className="mr-2 text-gray-500" /> Timeline
                </div>
              </th>
              <th
                className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => requestSort("assigneeName")}
              >
                <div className="flex items-center whitespace-nowrap">
                  <FaUsers className="mr-2 text-gray-500" /> Assignee{" "}
                  {getSortIcon("assigneeName")}
                </div>
              </th>
              <th
                className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-right border-b border-gray-200 border-r"
              >
                <div className="flex items-center justify-end whitespace-nowrap">
                  <FaRupeeSign className="mr-1 text-gray-500" /> Pkg Amount
                </div>
              </th>
              <th
                className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-right border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => requestSort("amount" as keyof Task)}
              >
                <div className="flex items-center justify-end whitespace-nowrap">
                  <FaMoneyBillWave className="mr-1 text-gray-500" /> Amount{" "}
                  {getSortIcon("amount" as keyof Task)}
                </div>
              </th>
              <th
                className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-right border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => requestSort("received" as keyof Task)}
              >
                <div className="flex items-center justify-end whitespace-nowrap">
                  <FaCheckCircle className="mr-1 text-green-600" /> Received{" "}
                  {getSortIcon("received" as keyof Task)}
                </div>
              </th>
              <th
                className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-right border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => requestSort("pendingAmount")}
              >
                <div className="flex items-center justify-end whitespace-nowrap">
                  <FaReceipt className="mr-1 text-red-600" /> Pending{" "}
                  {getSortIcon("pendingAmount")}
                </div>
              </th>

              <th
                className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center border-b border-gray-200 border-r"
              >
                <div className="flex items-center justify-center whitespace-nowrap">
                  <FaStickyNote className="mr-2 text-gray-500" /> Notes
                </div>
              </th>

              <th
                className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center border-b border-gray-200
                                sticky top-0 bg-gray-100 z-20 rounded-tr-2xl"
              >
                Highlight
              </th>


            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {tasks.map((t, index) => {
              const amount = Number(t.amount) || 0;
              const received = Number(t.received) || 0;
              const pending = amount - received;
              const isPendingPositive = pending > 0;
              const isAmountSaving = isSaving === `${t.id}-amount`;
              const isReceivedSaving = isSaving === `${t.id}-received`;
              const isStatusSaving = isSaving === `${t.id}-status`;

              const startDate = t.startDate ? new Date(t.startDate) : null;
              const endDate = t.endDate ? new Date(t.endDate) : null;
              const daysRemaining = endDate ? differenceInDays(endDate, new Date()) : null;

              return (
                <tr
                  key={t.id}
                  className="hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                  style={{
                    backgroundColor: t.highlightColor || "white",
                  }}
                >
                  <td
                    className="px-4 py-3 whitespace-nowrap text-center text-gray-700 font-medium border-r border-b
                                 sticky left-0 z-10"
                    style={{
                      backgroundColor: t.highlightColor || "white",
                    }}
                  >
                    {(page - 1) * limit + index + 1}
                  </td>
                  <td
                    className="px-4 py-3 whitespace-nowrap text-left text-gray-700 border-r border-b
                                 sticky left-[calc(0rem+48px)] z-10"
                    style={{
                      backgroundColor: t.highlightColor || "white",
                    }}
                  >
                    {t.shopName || "—"}
                  </td>
                  <td
                    className="px-4 py-3 whitespace-nowrap text-left font-medium text-gray-900 border-r border-b"
                  >
                    {t.title}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-left text-gray-700 border-r border-b">
                    {editMode ? (
                      <div className="relative">
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition modern-select"
                          value={(editedStatusValues[t.id] ?? t.status) || "todo"}
                          onChange={(e) =>
                            handleStatusChange(
                              t.id,
                              e.target.value as
                              | "todo"
                              | "inprogress"
                              | "done"
                              | "Archived"
                            )
                          }
                          disabled={isStatusSaving}
                        >
                          <option value="todo">To Do</option>
                          <option value="inprogress">In Progress</option>
                          <option value="done">Done</option>
                          <option value="Archived">Archived</option>
                        </select>
                        {isStatusSaving && (
                          <FaSpinner className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 text-sm" />
                        )}
                      </div>
                    ) : (
                      getStatusBadge(t.status)
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-left text-gray-600 border-r border-b">
                    {t.createdAt
                      ? format(new Date(t.createdAt), "dd MMM yyyy")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-left text-gray-700 border-r border-b">
                    {t.customerName || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-left text-gray-700 border-r border-b">
                    {startDate ? format(startDate, "dd MMM yyyy") : "—"}
                  </td>























                  <td className="px-4 py-3 whitespace-nowrap text-left text-gray-700 border-r border-b">
                    {endDate ? format(endDate, "dd MMM yyyy") : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-left font-semibold border-r border-b">
                    {daysRemaining !== null ? (
                      daysRemaining > 0 ? (
                        <span className="text-blue-600">
                          {daysRemaining} days left
                        </span>
                      ) : daysRemaining === 0 ? (
                        <span className="text-yellow-600">Due today</span>
                      ) : (
                        <span className="text-red-600">
                          {Math.abs(daysRemaining)} days overdue
                        </span>
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-left text-gray-700 border-r border-b">
                    {t.timeline || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-left text-gray-700 border-r border-b">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase text-gray-400">By</span>
                        <span className="text-xs font-bold text-indigo-800 tracking-tight">
                          {t.assignerName}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        {Array.isArray(t.assignees) && t.assignees.length > 0 ? (
                          t.assignees.map((a: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1 bg-indigo-50/50 pr-2 rounded-full border border-indigo-100/50 hover:bg-indigo-100 transition-colors">
                              {a.imageUrl ? (
                                <img src={a.imageUrl} className="w-5 h-5 rounded-full border border-white shadow-sm" alt={a.name || ""} />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[8px] font-black uppercase border border-white">
                                  {(a.name || "U")[0]}
                                </div>
                              )}
                              <span className="text-[10px] font-bold text-indigo-900">{a.name || "—"}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-blue-600 font-medium text-xs">
                             {t.assigneeName || "—"}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-green-700 font-semibold border-r border-b">
                    {formatCurrency(t.packageAmount)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right border-r border-b">
                    {/* {editMode ? (
                      <div className="relative flex items-center justify-end">
                        <input
                          type="number"
                          className="w-28 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition text-right modern-input"
                          value={editedValues[`${t.id}-amount`] ?? amount}
                          onChange={(e) =>
                            handleInputChange(
                              t.id,
                              "amount",
                              Number(e.target.value)
                            )
                          }
                          onBlur={() => handleBlur(t.id, "amount")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                          disabled={isAmountSaving}
                        />
                        {isAmountSaving && (
                          <FaSpinner className="animate-spin absolute right-3 text-blue-500 text-sm" />
                        )}
                      </div>
                    ) : (
                      <span className="font-medium text-blue-700">
                        {formatCurrency(amount)}
                      </span>
                    )} */}

                    {editMode && userRole === "master" ? (
                      <div className="relative flex items-center justify-end">
                        <input
                          type="number"
                          className="w-28 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition text-right modern-input"
                          value={editedValues[`${t.id}-amount`] ?? amount}
                          onChange={(e) =>
                            handleInputChange(t.id, "amount", Number(e.target.value))
                          }
                          onBlur={() => handleBlur(t.id, "amount")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                          }}
                          disabled={isAmountSaving}
                        />
                        {isAmountSaving && (
                          <FaSpinner className="animate-spin absolute right-3 text-blue-500 text-sm" />
                        )}
                      </div>
                    ) : (
                      <span className="font-medium text-blue-700">
                        {formatCurrency(amount)}
                      </span>
                    )}

                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right border-r border-b">
                    {/* {editMode ? (
                      <div className="relative flex items-center justify-end">
                        <input
                          type="number"
                          className="w-28 px-3 py-2 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition text-right modern-input"
                          value={editedValues[`${t.id}-received`] ?? received}
                          onChange={(e) =>
                            handleInputChange(
                              t.id,
                              "received",
                              Number(e.target.value)
                            )
                          }
                          onBlur={() => handleBlur(t.id, "received")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                          disabled={isReceivedSaving}
                        />
                        {isReceivedSaving && (
                          <FaSpinner className="animate-spin absolute right-3 text-emerald-500 text-sm" />
                        )}
                      </div>
                    ) : (
                      <span className="text-emerald-600 font-medium">
                        {formatCurrency(received)}
                      </span>
                    )}






 */}

                    {editMode && userRole === "master" ? (
                      <div className="relative flex items-center justify-end">
                        <input
                          type="number"
                          className="w-28 px-3 py-2 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition text-right modern-input"
                          value={editedValues[`${t.id}-received`] ?? received}
                          onChange={(e) =>
                            handleInputChange(t.id, "received", Number(e.target.value))
                          }
                          onBlur={() => handleBlur(t.id, "received")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                          }}
                          disabled={isReceivedSaving}
                        />
                        {isReceivedSaving && (
                          <FaSpinner className="animate-spin absolute right-3 text-emerald-500 text-sm" />
                        )}
                      </div>
                    ) : (
                      <span className="text-emerald-600 font-medium">
                        {formatCurrency(received)}
                      </span>
                    )}





                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right font-semibold border-r border-b">
                    <span
                      className={
                        isPendingPositive ? "text-red-600" : "text-gray-500"
                      }
                    >
                      {formatCurrency(pending)}
                    </span>
                  </td>


                  <td className="px-4 py-3 whitespace-nowrap text-center border-r border-b">
                    <button
                      onClick={() => setSelectedTask(t)}
                      className="p-2 rounded-full hover:bg-gray-100 transition"
                    >
                      <FaStickyNote className="text-indigo-600" />
                    </button>
                  </td>

                  <td className="px-4 py-3 text-center border-b">
                    <HighlightColorPicker
                      taskId={t.id}
                      value={t.highlightColor}
                      onChange={async (newColor) => {
                        setTasks((prev) =>
                          prev.map((task) =>
                            task.id === t.id
                              ? { ...task, highlightColor: newColor }
                              : task
                          )
                        );
                        try {
                          const res = await fetch(`/api/tasks/${t.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ highlightColor: newColor }),
                          });
                          if (!res.ok) throw new Error(await res.text());
                          toast.success("Highlight color updated!");
                          setAllRawTasks(prevAllRawTasks =>
                            prevAllRawTasks.map(task =>
                              task.id === t.id ? { ...task, highlightColor: newColor } : task
                            )
                          );
                        } catch (error) {
                          console.error("Highlight color update error:", error);
                          toast.error("Failed to update highlight color.");
                          setTasks((prev) =>
                            prev.map((task) =>
                              task.id === t.id
                                ? { ...task, highlightColor: allRawTasks.find(task => task.id === t.id)?.highlightColor }
                                : task
                            )
                          );
                        }
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Notes Modal */}
      {selectedTask && (
        <NotesModal
          taskId={selectedTask.id}               // ✅ pass taskId only
          initialNotes={selectedTask.notes || []} // ✅ optional if you preload notes
          onClose={(updatedNotes) => {
            if (updatedNotes) {
              setTasks((prev) =>
                prev.map((t) =>
                  t.id === selectedTask.id ? { ...t, notes: updatedNotes } : t
                )
              );
            }
            setSelectedTask(null);
          }}
        />
      )}


      <div className="mt-2 pt-6 pb-6 flex justify-end bg-gradient-to-r from-gray-50 to-gray-100 rounded-b-3xl shadow-lg">
        <PaginationControls
          limit={limit}
          setLimit={setLimit}
          page={page}
          setPage={setPage}
          totalItems={totalItems}
        />
      </div>
    </div>
  );
}
