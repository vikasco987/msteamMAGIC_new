"use client";
import { useUnifiedAuth as useUser } from "@/lib/useUnifiedAuth";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { format, differenceInDays, isToday, subDays, startOfMonth } from "date-fns";

import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import { FileText } from "lucide-react"; // Note icon
import NotesModal from "../components/NotesModal";
import TaskDetailsPanel from "../components/TaskDetailsPanel";
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
  FaCog,
  FaGripVertical,
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
  customFields?: Record<string, any>;
  highlightColor?: string;
  status?: "todo" | "inprogress" | "done" | "Archived";
  accountStatus?: string;
  customerStatus?: string;
  lastCheckOutletDate?: string;
  nextFollowUpDate?: string;
  recentNote?: {
    content: string;
    authorName?: string;
    createdAt?: string;
  } | null;
  notes?: any; // Changed from string to any to handle Note[] objects from API
  accountType?: string;
}

export const ACCOUNT_STATUS_OPTIONS = [
  { label: "Need To Focus", value: "Need To Focus", className: "bg-[#ffd5d2] text-[#c92a2a] border border-[#ffa8a8]" },
  { label: "Work in Progress", value: "Work in Progress", className: "bg-[#d3f9d8] text-[#2b8a3e] border border-[#b2f2bb]" },
  { label: "Growing....", value: "Growing....", className: "bg-[#d0ebff] text-[#1971c2] border border-[#a5d8ff]" },
  { label: "Business_Not_Growing", value: "Business_Not_Growing", className: "bg-[#e9ecef] text-[#495057] border border-[#dee2e6]" },
  { label: "Customer_not response", value: "Customer_not response", className: "bg-[#e9ecef] text-[#495057] border border-[#dee2e6]" },
  { label: "Ask_For_Renewal", value: "Ask_For_Renewal", className: "bg-[#e9ecef] text-[#495057] border border-[#dee2e6]" },
  { label: "Outlet Currently off", value: "Outlet Currently off", className: "bg-[#e9ecef] text-[#495057] border border-[#dee2e6]" },
  { label: "Ratting Below 3.7", value: "Ratting Below 3.7", className: "bg-[#a61e1e] text-white border border-[#861212]" },
  { label: "Conflict For week", value: "Conflict For week", className: "bg-[#ffec99] text-[#e67700] border border-[#ffe066]" },
  { label: "cretical_outlet", value: "cretical_outlet", className: "bg-[#5f3dc4] text-white border border-[#4c2889]" },
  { label: "working", value: "working", className: "bg-[#087f5b] text-white border border-[#096649]" },
];

export const CUSTOMER_STATUS_OPTIONS = [
  { label: "Active", value: "Active", className: "bg-[#d3f9d8] text-[#2b8a3e] border border-[#b2f2bb]" },
  { label: "Inactive", value: "Inactive", className: "bg-[#ffd5d2] text-[#c92a2a] border border-[#ffa8a8]" },
  { label: "Waiting For renewal", value: "Waiting For renewal", className: "bg-[#d0ebff] text-[#1971c2] border border-[#a5d8ff]" },
];

export interface ColumnDefinition {
  id: string;
  label: string;
  defaultVisible: boolean;
  isFixed?: boolean;
}

export const ALL_COLUMNS: ColumnDefinition[] = [
  { id: "sno", label: "S. No.", defaultVisible: true, isFixed: true },
  { id: "shopName", label: "Shop", defaultVisible: true, isFixed: true },
  { id: "accountStatus", label: "Account Status", defaultVisible: true },
  { id: "customerStatus", label: "Customer Status", defaultVisible: true },
  { id: "title", label: "Title", defaultVisible: true },
  { id: "status", label: "Status", defaultVisible: true },
  { id: "createdAt", label: "Created", defaultVisible: true },
  { id: "customerName", label: "Customer", defaultVisible: true },
  { id: "startDate", label: "Start Date", defaultVisible: true },
  { id: "endDate", label: "End Date", defaultVisible: true },
  { id: "daysRemaining", label: "Days Left", defaultVisible: true },
  { id: "lastCheckOutletDate", label: "Last Check Outlet Date", defaultVisible: true },
  { id: "nextFollowUpDate", label: "Next Follow Up Date", defaultVisible: true },
  { id: "timeline", label: "Timeline", defaultVisible: true },
  { id: "assigneeName", label: "Assignee", defaultVisible: true },
  { id: "packageAmount", label: "Pkg Amount", defaultVisible: true },
  { id: "amount", label: "Amount", defaultVisible: true },
  { id: "received", label: "Received", defaultVisible: true },
  { id: "pendingAmount", label: "Pending", defaultVisible: true },
  { id: "notes", label: "Notes", defaultVisible: true },
  { id: "highlight", label: "Highlight", defaultVisible: true },
  { id: "actions", label: "Actions", defaultVisible: true, isFixed: true },
];

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
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

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
  const [selectedAssigners, setSelectedAssigners] = useState<string[]>([]);
  const [isAssignerDropdownOpen, setIsAssignerDropdownOpen] = useState(false);
  const [globalFilterOptions, setGlobalFilterOptions] = useState<{ assignees: string[]; assigners: string[] }>({
    assignees: [],
    assigners: []
  });
  const [accountStatusFilter, setAccountStatusFilter] = useState<string | null>(null);
  const [customerStatusFilter, setCustomerStatusFilter] = useState<string | null>(null);
  const [followUpDateFilter, setFollowUpDateFilter] = useState<string | null>(null);
  const [lastCheckDateFilter, setLastCheckDateFilter] = useState<string | null>(null);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const assignerDropdownRef = useRef<HTMLDivElement>(null);
  const accountStatusDropdownRef = useRef<HTMLDivElement>(null);
  const customerStatusDropdownRef = useRef<HTMLDivElement>(null);
  const columnManagerRef = useRef<HTMLDivElement>(null);

  const [activeAccountStatusDropdownId, setActiveAccountStatusDropdownId] = useState<string | null>(null);
  const [activeCustomerStatusDropdownId, setActiveCustomerStatusDropdownId] = useState<string | null>(null);

  // Column Ordering & Visibility State
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kam_table_column_order");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const allIds = ALL_COLUMNS.map((c) => c.id);
            const valid = parsed.filter((id) => allIds.includes(id));
            const missing = allIds.filter((id) => !valid.includes(id));
            return [...valid, ...missing];
          }
        } catch (e) {}
      }
    }
    return ALL_COLUMNS.map((c) => c.id);
  });

  const [hiddenColumns, setHiddenColumns] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kam_table_hidden_columns");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
    }
    return [];
  });

  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);

  const normalizedUserRole = useMemo(() => {
    const rawRole = (user as any)?.publicMetadata?.role || (user as any)?.role || "";
    return String(rawRole).toLowerCase();
  }, [user]);

  const isMaster = useMemo(() => {
    return normalizedUserRole === "master" || (user as any)?.role === "MASTER";
  }, [normalizedUserRole, user]);

  const canEditStatus = useMemo(() => {
    return (
      normalizedUserRole === "admin" ||
      normalizedUserRole === "master" ||
      normalizedUserRole === "seller" ||
      normalizedUserRole === "tl" ||
      Boolean((user as any)?.isTeamLeader) ||
      Boolean((user as any)?.hasFullKamAccess)
    );
  }, [normalizedUserRole, user]);

  const handleColumnDrop = (targetColId: string) => {
    if (!draggedColumnId || draggedColumnId === targetColId) return;
    const currentList = [...columnOrder];
    const fromIndex = currentList.indexOf(draggedColumnId);
    const toIndex = currentList.indexOf(targetColId);
    if (fromIndex === -1 || toIndex === -1) return;

    currentList.splice(fromIndex, 1);
    currentList.splice(toIndex, 0, draggedColumnId);
    setColumnOrder(currentList);
    setDraggedColumnId(null);
    if (typeof window !== "undefined") {
      localStorage.setItem("kam_table_column_order", JSON.stringify(currentList));
    }
    toast.success("Column order updated!");
  };

  const toggleColumnVisibility = (colId: string) => {
    setHiddenColumns((prev) => {
      const next = prev.includes(colId)
        ? prev.filter((id) => id !== colId)
        : [...prev, colId];
      if (typeof window !== "undefined") {
        localStorage.setItem("kam_table_hidden_columns", JSON.stringify(next));
      }
      return next;
    });
  };

  const resetColumnSettings = () => {
    const defaultOrder = ALL_COLUMNS.map((c) => c.id);
    setColumnOrder(defaultOrder);
    setHiddenColumns([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("kam_table_column_order");
      localStorage.removeItem("kam_table_hidden_columns");
    }
    toast.success("Columns reset to default!");
  };

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
      if (
        assignerDropdownRef.current &&
        !assignerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAssignerDropdownOpen(false);
      }
      if (
        accountStatusDropdownRef.current &&
        !accountStatusDropdownRef.current.contains(event.target as Node)
      ) {
        setActiveAccountStatusDropdownId(null);
      }
      if (
        customerStatusDropdownRef.current &&
        !customerStatusDropdownRef.current.contains(event.target as Node)
      ) {
        setActiveCustomerStatusDropdownId(null);
      }
      if (
        columnManagerRef.current &&
        !columnManagerRef.current.contains(event.target as Node)
      ) {
        setIsColumnManagerOpen(false);
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

      if (followUpDateFilter) {
        params.set("followUpDate", followUpDateFilter);
      }
      if (lastCheckDateFilter) {
        params.set("lastCheckDate", lastCheckDateFilter);
      }
      if (accountStatusFilter) {
        params.set("accountStatus", accountStatusFilter);
      }
      if (customerStatusFilter) {
        params.set("customerStatus", customerStatusFilter);
      }
      if (selectedAssigners.length > 0) {
        params.set("assigners", selectedAssigners.join(","));
      }
      if (selectedAssignees.length > 0) {
        params.set("assignees", selectedAssignees.join(","));
      }

      const res = await fetch(`/api/kam?${params.toString()}`);
      const data = await res.json();

      if (data.tasks) {
        setAllRawTasks(data.tasks);
        setTotalItems(data.pagination?.total || data.tasks.length);
        if (data.filterOptions) {
          setGlobalFilterOptions({
            assignees: data.filterOptions.assignees || [],
            assigners: data.filterOptions.assigners || []
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch Kam tasks:", err);
      toast.error("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
      setIsFirstLoad(false);
    }
  }, [user, isLoaded, page, limit, debouncedQuery, statusFilter, followUpDateFilter, lastCheckDateFilter, accountStatusFilter, customerStatusFilter, selectedAssigners, selectedAssignees, sortConfig]);

  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks]);

  const filteredAndSortedTasks = useMemo(() => {
    // API already handles all filtering, searching, sorting and pagination on the complete database
    return allRawTasks;
  }, [allRawTasks]);

  useEffect(() => {
    // Since API already handles pagination, we don't slice here anymore
    setTasks(filteredAndSortedTasks);
  }, [filteredAndSortedTasks]);

  useEffect(() => {
    // When filters change, go back to page 1
    if (isLoaded) {
      setPage(1);
    }
  }, [debouncedQuery, statusFilter, selectedCategories, selectedAssignees, selectedAssigners, accountStatusFilter, customerStatusFilter, followUpDateFilter, lastCheckDateFilter, dateFilter]);

  const handleInputChange = (
    taskId: string,
    field: "amount" | "received",
    value: number
  ) => {
    const key = `${taskId}-${field}`;
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleAccountStatusChange = async (taskId: string, newStatus: string) => {
    const currentTask = allRawTasks.find((t) => t.id === taskId);
    const oldStatus = currentTask?.accountStatus || (currentTask?.customFields as any)?.accountStatus || "";

    if (newStatus === oldStatus) {
      setActiveAccountStatusDropdownId(null);
      return;
    }

    setActiveAccountStatusDropdownId(null);

    setAllRawTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              accountStatus: newStatus,
              customFields: { ...(t.customFields || {}), accountStatus: newStatus },
            }
          : t
      )
    );

    setIsSaving(`${taskId}-account-status`);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customFields: { accountStatus: newStatus },
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to update account status");
      }
      toast.success("Account status updated!");
    } catch (err: any) {
      console.error("Account status update error:", err);
      toast.error(err.message || "Failed to update account status.");
      setAllRawTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                accountStatus: oldStatus,
                customFields: { ...(t.customFields || {}), accountStatus: oldStatus },
              }
            : t
        )
      );
    } finally {
      setIsSaving(null);
    }
  };

  const handleDateChange = async (
    taskId: string,
    field: "lastCheckOutletDate" | "nextFollowUpDate",
    value: string
  ) => {
    const currentTask = allRawTasks.find((t) => t.id === taskId);
    const oldValue = currentTask?.[field] || (currentTask?.customFields as any)?.[field] || "";

    if (value === oldValue) return;

    // Optimistic UI update
    setAllRawTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              [field]: value,
              customFields: { ...(t.customFields || {}), [field]: value },
            }
          : t
      )
    );

    setIsSaving(`${taskId}-${field}`);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customFields: { [field]: value },
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save date");
      }
      toast.success("Date updated!");
    } catch (err: any) {
      console.error("Date update error:", err);
      toast.error(err.message || "Failed to update date");
      // Rollback
      setAllRawTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                [field]: oldValue,
                customFields: { ...(t.customFields || {}), [field]: oldValue },
              }
            : t
        )
      );
    } finally {
      setIsSaving(null);
    }
  };

  const handleCustomerStatusChange = async (taskId: string, newStatus: string) => {
    const currentTask = allRawTasks.find((t) => t.id === taskId);
    const oldStatus = currentTask?.customerStatus || (currentTask?.customFields as any)?.customerStatus || "";

    if (newStatus === oldStatus) {
      setActiveCustomerStatusDropdownId(null);
      return;
    }

    setActiveCustomerStatusDropdownId(null);

    setAllRawTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              customerStatus: newStatus,
              customFields: { ...(t.customFields || {}), customerStatus: newStatus },
            }
          : t
      )
    );

    setIsSaving(`${taskId}-customer-status`);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customFields: { customerStatus: newStatus },
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to update customer status");
      }
      toast.success("Customer status updated!");
    } catch (err: any) {
      console.error("Customer status update error:", err);
      toast.error(err.message || "Failed to update customer status.");
      setAllRawTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                customerStatus: oldStatus,
                customFields: { ...(t.customFields || {}), customerStatus: oldStatus },
              }
            : t
        )
      );
    } finally {
      setIsSaving(null);
    }
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

  const getAccountStatusBadge = (accountStatus?: string) => {
    if (!accountStatus) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-dashed border-gray-300">
          Select Status
        </span>
      );
    }

    const matchedOption = ACCOUNT_STATUS_OPTIONS.find(
      (opt) => opt.value.toLowerCase() === accountStatus.toLowerCase()
    );

    const badgeClass =
      matchedOption?.className ||
      "bg-gray-100 text-gray-700 border border-gray-300";

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm whitespace-nowrap transition-all ${badgeClass}`}
      >
        {matchedOption?.label || accountStatus}
      </span>
    );
  };

  const getCustomerStatusBadge = (customerStatus?: string) => {
    if (!customerStatus) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-dashed border-gray-300">
          Select Status
        </span>
      );
    }

    const matchedOption = CUSTOMER_STATUS_OPTIONS.find(
      (opt) => opt.value.toLowerCase() === customerStatus.toLowerCase()
    );

    const badgeClass =
      matchedOption?.className ||
      "bg-gray-100 text-gray-700 border border-gray-300";

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm whitespace-nowrap transition-all ${badgeClass}`}
      >
        {matchedOption?.label || customerStatus}
      </span>
    );
  };

  const exportExcel = () => {
    const exportData = filteredAndSortedTasks.map((task, index) => ({
      "S. No.": index + 1,
      Title: task.title,
      "Account Status": task.accountStatus || task.customFields?.accountStatus || "",
      "Customer Status": task.customerStatus || task.customFields?.customerStatus || "",
      Status: task.status,
      Tags: task.tags?.join(", ") || "",
      "Shop Name": task.shopName || task.customFields?.shopName || "",
      "Outlet Name": task.outletName || task.customFields?.outletName || "",
      "Customer Name": task.customerName || task.customFields?.customerName || "",
      Phone: task.phone || task.customFields?.phone || "",
      Email: task.email || task.customFields?.email || "",
      Location: task.location || task.customFields?.location || "",
      "Package Amount": task.packageAmount || task.customFields?.packageAmount || "",
      "Start Date": task.startDate ? format(new Date(task.startDate), "dd MMM yyyy") : (task.customFields?.startDate ? format(new Date(task.customFields.startDate), "dd MMM yyyy") : ""),
      "End Date": task.endDate ? format(new Date(task.endDate), "dd MMM yyyy") : (task.customFields?.endDate ? format(new Date(task.customFields.endDate), "dd MMM yyyy") : ""),
      "Days Left": task.endDate ? differenceInDays(new Date(task.endDate), new Date()) : "",
      Timeline: task.timeline || task.customFields?.timeline || "",
      Assigner: task.assignerName || "—",
      Assignee:
        (task.assignees?.map((a) => a?.name ?? a?.email).filter(Boolean).join(", ")) ??
        task.assigneeName ??
        "—",
      "Task Amount": task.amount,
      Received: task.received,
      "Pending Amount": (Number(task.amount) || 0) - (Number(task.received) || 0),
      "Created Date": task.createdAt
        ? format(new Date(task.createdAt), "dd MMM yyyy, HH:mm:ss")
        : "",
      "Updated Date": task.updatedAt
        ? format(new Date(task.updatedAt), "dd MMM yyyy, HH:mm:ss")
        : "",
      "Subtasks Status": task.subtasks?.map(st => `${st.title}: ${st.completed ? 'Done' : 'Pending'}`).join(" | ") || "",
      "Account Number": task.accountNumber || task.customFields?.accountNumber || "",
      "IFSC Code": task.ifscCode || task.customFields?.ifscCode || "",
      "Rest ID": task.restId || task.customFields?.restId || "",
      "Aadhaar URL": task.aadhaarUrl || "",
      "PAN URL": task.panUrl || "",
      "Selfie URL": task.selfieUrl || "",
      "Cheque URL": task.chequeUrl || "",
      "Menu URLs": task.menuCardUrls?.join(", ") || "",
      "Highlight Color": task.highlightColor || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Account_Handling_Tasks");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `Account_Handling_Tasks_Report_${Date.now()}.xlsx`);
    toast.success("Excel exported successfully!");
  };

  const uniqueAssigneeNames = useMemo(() => {
    if (globalFilterOptions.assignees && globalFilterOptions.assignees.length > 0) {
      return globalFilterOptions.assignees;
    }
    const names = new Set<string>();
    allRawTasks.forEach(task => {
      task.assignees?.forEach(assignee => {
        if (assignee.name || assignee.email) {
          names.add(assignee.name || assignee.email || '');
        }
      });
      if (task.assigneeName) {
        task.assigneeName.split(",").forEach(n => {
          const tr = n.trim();
          if (tr && tr !== "—" && tr !== "-") names.add(tr);
        });
      }
    });
    return Array.from(names).sort();
  }, [allRawTasks, globalFilterOptions.assignees]);

  const uniqueAssignerNames = useMemo(() => {
    if (globalFilterOptions.assigners && globalFilterOptions.assigners.length > 0) {
      return globalFilterOptions.assigners;
    }
    const names = new Set<string>();
    allRawTasks.forEach(task => {
      const a = (task.assignerName || (task.customFields as any)?.assignerName || "").trim();
      if (a && a !== "—" && a !== "-") {
        names.add(a);
      }
    });
    return Array.from(names).sort();
  }, [allRawTasks, globalFilterOptions.assigners]);

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

  const getAssignerDropdownDisplayText = () => {
    if (selectedAssigners.length === 0) {
      return "All Assigners";
    } else if (selectedAssigners.length === uniqueAssignerNames.length) {
      return "All Assigners Selected";
    } else if (selectedAssigners.length === 1) {
      return selectedAssigners[0];
    } else {
      return `${selectedAssigners.length} Assigners Selected`;
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
          <a
            href="/kam/reports"
            className="ml-3 inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition-all shadow-sm"
          >
            📊 View Performance Reports
          </a>
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

        {/* Assigner Filter */}
        <div className="relative" ref={assignerDropdownRef}>
          <button
            type="button"
            className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between min-w-[150px]"
            onClick={() => setIsAssignerDropdownOpen((prev) => !prev)}
          >
            <span>{getAssignerDropdownDisplayText()}</span>
            {isAssignerDropdownOpen ? <FaCaretUp className="ml-2" /> : <FaCaretDown className="ml-2" />}
          </button>
          {isAssignerDropdownOpen && (
            <div className="absolute z-20 mt-1 w-56 max-h-60 overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                {uniqueAssignerNames.length > 0 ? (
                  uniqueAssignerNames.map((assigner) => (
                    <label
                      key={assigner}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      role="menuitem"
                    >
                      <input
                        type="checkbox"
                        className="accent-blue-600"
                        checked={selectedAssigners.includes(assigner)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setSelectedAssigners((prev) =>
                            isChecked ? [...prev, assigner] : prev.filter((v) => v !== assigner)
                          );
                        }}
                      />
                      {assigner}
                    </label>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">No assigners found.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Account Status Filter */}
        <select
          value={accountStatusFilter || ""}
          onChange={(e) => setAccountStatusFilter(e.target.value || null)}
          className="p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Account Statuses</option>
          {ACCOUNT_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Customer Status Filter */}
        <select
          value={customerStatusFilter || ""}
          onChange={(e) => setCustomerStatusFilter(e.target.value || null)}
          className="p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Customer Statuses</option>
          {CUSTOMER_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Next Follow Up Date Filter */}
        <select
          value={followUpDateFilter || ""}
          onChange={(e) => setFollowUpDateFilter(e.target.value || null)}
          className="p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-700 bg-white"
        >
          <option value="">All Follow-up Dates</option>
          <option value="today">Follow-up Today</option>
          <option value="tomorrow">Follow-up Tomorrow</option>
          <option value="yesterday">Yesterday's Follow-up</option>
          <option value="overdue">Overdue Follow-up</option>
          <option value="next_7_days">Next 7 Days</option>
          <option value="next_15_days">Next 15 Days</option>
          <option value="next_30_days">Next 30 Days</option>
          <option value="this_month">This Month</option>
          <option value="has_date">Has Scheduled Follow-up</option>
          <option value="no_date">No Follow-up Scheduled</option>
        </select>

        {/* Last Check Outlet Date Filter */}
        <select
          value={lastCheckDateFilter || ""}
          onChange={(e) => setLastCheckDateFilter(e.target.value || null)}
          className="p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-700 bg-white"
        >
          <option value="">All Last Check Dates</option>
          <option value="today">Checked Today</option>
          <option value="yesterday">Checked Yesterday</option>
          <option value="last_7_days">Checked Last 7 Days</option>
          <option value="last_15_days">Checked Last 15 Days</option>
          <option value="last_30_days">Checked Last 30 Days</option>
          <option value="this_month">Checked This Month</option>
          <option value="has_date">Has Check Date</option>
          <option value="no_date">Never Checked / No Date</option>
        </select>

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
          onClick={exportExcel}
        >
          <FaDownload className="inline mr-2 -ml-1" /> Export Excel
        </button>

        {isMaster && (
          <div className="relative" ref={columnManagerRef}>
            <button
              type="button"
              onClick={() => setIsColumnManagerOpen((prev) => !prev)}
              className="inline-flex items-center bg-white text-gray-700 font-semibold px-4 py-2 rounded-lg shadow-sm border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm gap-2"
              title="Customize Columns (Master only)"
            >
              <FaCog className="text-gray-500" />
              <span>Customize Columns</span>
              <FaCaretDown className="text-xs text-gray-400" />
            </button>

            {isColumnManagerOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl ring-1 ring-black ring-opacity-10 z-50 p-4 border border-gray-100 max-h-[500px] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Columns Settings</h4>
                    <p className="text-[11px] text-gray-500">Drag to reorder, checkbox to hide/show</p>
                  </div>
                  <button
                    onClick={resetColumnSettings}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Reset
                  </button>
                </div>

                <div className="space-y-1.5">
                  {columnOrder.map((colId) => {
                    const colDef = ALL_COLUMNS.find((c) => c.id === colId);
                    if (!colDef) return null;
                    const isHidden = hiddenColumns.includes(colId);

                    return (
                      <div
                        key={colId}
                        draggable
                        onDragStart={() => setDraggedColumnId(colId)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleColumnDrop(colId)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-sm transition-all ${
                          draggedColumnId === colId
                            ? "bg-indigo-50 border-indigo-300 opacity-60"
                            : "bg-gray-50/70 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FaGripVertical className="text-gray-400 cursor-grab active:cursor-grabbing text-xs" />
                          <span className={`font-medium ${isHidden ? "line-through text-gray-400" : "text-gray-800"}`}>
                            {colDef.label}
                          </span>
                        </div>
                        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!isHidden}
                            onChange={() => toggleColumnVisibility(colId)}
                            className="rounded accent-indigo-600 cursor-pointer"
                          />
                          <span>Show</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-xl relative min-h-[300px]">
        {loading && !isFirstLoad && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-md border border-gray-100">
              <FaSpinner className="animate-spin text-indigo-600 text-lg" />
              <span className="text-xs font-semibold text-gray-700">Updating results...</span>
            </div>
          </div>
        )}
        <table className="min-w-full divide-y divide-gray-200 text-sm border-collapse">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              {columnOrder
                .filter((colId) => !hiddenColumns.includes(colId))
                .map((colId) => {
                  switch (colId) {
                    case "sno":
                      return (
                        <th
                          key="sno"
                          scope="col"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center border-b border-gray-200 border-r sticky top-0 left-0 bg-gray-200 z-30 rounded-tl-2xl"
                        >
                          S. No.
                        </th>
                      );
                    case "shopName":
                      return (
                        <th
                          key="shopName"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors sticky top-0 left-[calc(0rem+48px)] bg-gray-100 z-20"
                          onClick={() => requestSort("shopName")}
                        >
                          <div className="flex items-center whitespace-nowrap">
                            <FaStore className="mr-2 text-gray-500" /> Shop {getSortIcon("shopName")}
                          </div>
                        </th>
                      );
                    case "accountStatus":
                      return (
                        <th
                          key="accountStatus"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r"
                        >
                          <div className="flex items-center whitespace-nowrap">
                            Account Status
                          </div>
                        </th>
                      );
                    case "customerStatus":
                      return (
                        <th
                          key="customerStatus"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r"
                        >
                          <div className="flex items-center whitespace-nowrap">
                            Customer Status
                          </div>
                        </th>
                      );
                    case "title":
                      return (
                        <th
                          key="title"
                          scope="col"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => requestSort("title")}
                        >
                          Title {getSortIcon("title")}
                        </th>
                      );
                    case "status":
                      return (
                        <th
                          key="status"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => requestSort("status")}
                        >
                          <div className="flex items-center whitespace-nowrap">
                            <FaTasks className="mr-2 text-gray-500" /> Status {getSortIcon("status")}
                          </div>
                        </th>
                      );
                    case "createdAt":
                      return (
                        <th
                          key="createdAt"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => requestSort("createdAt")}
                        >
                          <div className="flex items-center whitespace-nowrap">
                            <FaCalendarAlt className="mr-2 text-gray-500" /> Created {getSortIcon("createdAt")}
                          </div>
                        </th>
                      );
                    case "customerName":
                      return (
                        <th
                          key="customerName"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => requestSort("customerName")}
                        >
                          <div className="flex items-center whitespace-nowrap">
                            <FaUserCircle className="mr-2 text-gray-500" /> Customer {getSortIcon("customerName")}
                          </div>
                        </th>
                      );
                    case "startDate":
                      return (
                        <th
                          key="startDate"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => requestSort("startDate")}
                        >
                          <div className="flex items-center whitespace-nowrap">
                            <FaCalendarAlt className="mr-2 text-gray-500" /> Start Date {getSortIcon("startDate")}
                          </div>
                        </th>
                      );
                    case "endDate":
                      return (
                        <th
                          key="endDate"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => requestSort("endDate")}
                        >
                          <div className="flex items-center whitespace-nowrap">
                            <FaCalendarAlt className="mr-2 text-gray-500" /> End Date {getSortIcon("endDate")}
                          </div>
                        </th>
                      );
                    case "daysRemaining":
                      return (
                        <th
                          key="daysRemaining"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => requestSort("daysRemaining")}
                        >
                          <div className="flex items-center whitespace-nowrap">
                            <FaCalendarAlt className="mr-2 text-gray-500" /> Days Left {getSortIcon("daysRemaining")}
                          </div>
                        </th>
                      );
                    case "lastCheckOutletDate":
                      return (
                        <th
                          key="lastCheckOutletDate"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r"
                        >
                          <div className="flex items-center whitespace-nowrap">
                            <FaCalendarAlt className="mr-2 text-gray-500" /> Last Check Outlet
                          </div>
                        </th>
                      );
                    case "nextFollowUpDate":
                      return (
                        <th
                          key="nextFollowUpDate"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r"
                        >
                          <div className="flex items-center whitespace-nowrap">
                            <FaCalendarAlt className="mr-2 text-gray-500" /> Next Follow Up
                          </div>
                        </th>
                      );
                    case "timeline":
                      return (
                        <th
                          key="timeline"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r"
                        >
                          <div className="flex items-center whitespace-nowrap">
                            <FaClipboardList className="mr-2 text-gray-500" /> Timeline
                          </div>
                        </th>
                      );
                    case "assigneeName":
                      return (
                        <th
                          key="assigneeName"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => requestSort("assigneeName")}
                        >
                          <div className="flex items-center whitespace-nowrap">
                            <FaUsers className="mr-2 text-gray-500" /> Assignee {getSortIcon("assigneeName")}
                          </div>
                        </th>
                      );
                    case "packageAmount":
                      return (
                        <th
                          key="packageAmount"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-right border-b border-gray-200 border-r"
                        >
                          <div className="flex items-center justify-end whitespace-nowrap">
                            <FaRupeeSign className="mr-1 text-gray-500" /> Pkg Amount
                          </div>
                        </th>
                      );
                    case "amount":
                      return (
                        <th
                          key="amount"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-right border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => requestSort("amount" as keyof Task)}
                        >
                          <div className="flex items-center justify-end whitespace-nowrap">
                            <FaMoneyBillWave className="mr-1 text-gray-500" /> Amount {getSortIcon("amount" as keyof Task)}
                          </div>
                        </th>
                      );
                    case "received":
                      return (
                        <th
                          key="received"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-right border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => requestSort("received" as keyof Task)}
                        >
                          <div className="flex items-center justify-end whitespace-nowrap">
                            <FaCheckCircle className="mr-1 text-green-600" /> Received {getSortIcon("received" as keyof Task)}
                          </div>
                        </th>
                      );
                    case "pendingAmount":
                      return (
                        <th
                          key="pendingAmount"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-right border-b border-gray-200 border-r cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => requestSort("pendingAmount")}
                        >
                          <div className="flex items-center justify-end whitespace-nowrap">
                            <FaReceipt className="mr-1 text-red-600" /> Pending {getSortIcon("pendingAmount")}
                          </div>
                        </th>
                      );
                    case "notes":
                      return (
                        <th
                          key="notes"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center border-b border-gray-200 border-r"
                        >
                          <div className="flex items-center justify-center whitespace-nowrap">
                            <FaStickyNote className="mr-2 text-gray-500" /> Notes
                          </div>
                        </th>
                      );
                    case "highlight":
                      return (
                        <th
                          key="highlight"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center border-b border-gray-200 sticky top-0 bg-gray-100 z-20 rounded-tr-2xl"
                        >
                          Highlight
                        </th>
                      );
                    case "actions":
                      return (
                        <th
                          key="actions"
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center border-b border-gray-200"
                        >
                          Actions
                        </th>
                      );
                    default:
                      return null;
                  }
                })}
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
              const isAccountStatusSaving = isSaving === `${t.id}-account-status`;
              const isCustomerStatusSaving = isSaving === `${t.id}-customer-status`;
              const currentAccountStatus = t.accountStatus || (t.customFields as any)?.accountStatus || "";
              const currentCustomerStatus = t.customerStatus || (t.customFields as any)?.customerStatus || "";

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
                  {columnOrder
                    .filter((colId) => !hiddenColumns.includes(colId))
                    .map((colId) => {
                      switch (colId) {
                        case "sno":
                          return (
                            <td
                              key="sno"
                              className="px-4 py-3 whitespace-nowrap text-center text-gray-700 font-medium border-r border-b sticky left-0 z-10"
                              style={{ backgroundColor: t.highlightColor || "white" }}
                            >
                              {(page - 1) * limit + index + 1}
                            </td>
                          );
                        case "shopName":
                          return (
                            <td
                              key="shopName"
                              className="px-4 py-3 whitespace-nowrap text-left text-gray-700 border-r border-b sticky left-[calc(0rem+48px)] z-10"
                              style={{ backgroundColor: t.highlightColor || "white" }}
                            >
                              {t.shopName || "—"}
                            </td>
                          );
                        case "accountStatus":
                          return (
                            <td key="accountStatus" className="px-4 py-3 whitespace-nowrap text-left text-gray-700 border-r border-b relative">
                              <div className="relative inline-block" ref={activeAccountStatusDropdownId === t.id ? accountStatusDropdownRef : undefined}>
                                {canEditStatus ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveAccountStatusDropdownId((prev) => (prev === t.id ? null : t.id))
                                    }
                                    disabled={isAccountStatusSaving}
                                    className="group inline-flex items-center gap-1.5 focus:outline-none cursor-pointer rounded-full p-0.5 hover:ring-2 hover:ring-indigo-300 transition-all"
                                    title="Click to change account status"
                                  >
                                    {getAccountStatusBadge(currentAccountStatus)}
                                    <FaCaretDown className="text-gray-400 group-hover:text-gray-600 text-xs transition-colors" />
                                    {isAccountStatusSaving && (
                                      <FaSpinner className="animate-spin text-indigo-600 text-xs ml-1" />
                                    )}
                                  </button>
                                ) : (
                                  <div className="inline-flex items-center">
                                    {getAccountStatusBadge(currentAccountStatus)}
                                  </div>
                                )}

                                {activeAccountStatusDropdownId === t.id && (
                                  <div
                                    className="absolute left-0 mt-2 w-56 rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-10 z-50 py-2 divide-y divide-gray-100 max-h-96 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
                                    style={{ minWidth: "190px" }}
                                  >
                                    <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                      Account Status
                                    </div>
                                    <div className="py-1">
                                      {ACCOUNT_STATUS_OPTIONS.map((opt) => {
                                        const isSelected =
                                          (currentAccountStatus || "").toLowerCase() === opt.value.toLowerCase();
                                        return (
                                          <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleAccountStatusChange(t.id, opt.value)}
                                            className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition-colors hover:bg-gray-50 ${
                                              isSelected ? "bg-indigo-50 font-semibold" : ""
                                            }`}
                                          >
                                            <span
                                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${opt.className}`}
                                            >
                                              {opt.label}
                                            </span>
                                            {isSelected && (
                                              <FaCheckCircle className="text-indigo-600 text-xs ml-2 flex-shrink-0" />
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        case "customerStatus":
                          return (
                            <td key="customerStatus" className="px-4 py-3 whitespace-nowrap text-left text-gray-700 border-r border-b relative">
                              <div className="relative inline-block" ref={activeCustomerStatusDropdownId === t.id ? customerStatusDropdownRef : undefined}>
                                {canEditStatus ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveCustomerStatusDropdownId((prev) => (prev === t.id ? null : t.id))
                                    }
                                    disabled={isCustomerStatusSaving}
                                    className="group inline-flex items-center gap-1.5 focus:outline-none cursor-pointer rounded-full p-0.5 hover:ring-2 hover:ring-indigo-300 transition-all"
                                    title="Click to change customer status"
                                  >
                                    {getCustomerStatusBadge(currentCustomerStatus)}
                                    <FaCaretDown className="text-gray-400 group-hover:text-gray-600 text-xs transition-colors" />
                                    {isCustomerStatusSaving && (
                                      <FaSpinner className="animate-spin text-indigo-600 text-xs ml-1" />
                                    )}
                                  </button>
                                ) : (
                                  <div className="inline-flex items-center">
                                    {getCustomerStatusBadge(currentCustomerStatus)}
                                  </div>
                                )}

                                {activeCustomerStatusDropdownId === t.id && (
                                  <div
                                    className="absolute left-0 mt-2 w-48 rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-10 z-50 py-2 divide-y divide-gray-100 max-h-96 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
                                    style={{ minWidth: "170px" }}
                                  >
                                    <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                      Customer Status
                                    </div>
                                    <div className="py-1">
                                      {CUSTOMER_STATUS_OPTIONS.map((opt) => {
                                        const isSelected =
                                          (currentCustomerStatus || "").toLowerCase() === opt.value.toLowerCase();
                                        return (
                                          <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleCustomerStatusChange(t.id, opt.value)}
                                            className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition-colors hover:bg-gray-50 ${
                                              isSelected ? "bg-indigo-50 font-semibold" : ""
                                            }`}
                                          >
                                            <span
                                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${opt.className}`}
                                            >
                                              {opt.label}
                                            </span>
                                            {isSelected && (
                                              <FaCheckCircle className="text-indigo-600 text-xs ml-2 flex-shrink-0" />
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        case "title":
                          return (
                            <td key="title" className="px-4 py-3 whitespace-nowrap text-left font-medium text-gray-900 border-r border-b">
                              <div className="flex items-center gap-2">
                                <span>{t.title}</span>
                                {t.accountType === "PREMIUM" ? (
                                  <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 rounded border border-purple-200">PREMIUM</span>
                                ) : (
                                  <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-800 rounded border border-slate-200">BASIC</span>
                                )}
                              </div>
                            </td>
                          );
                        case "status":
                          return (
                            <td key="status" className="px-4 py-3 whitespace-nowrap text-left text-gray-700 border-r border-b">
                              {editMode ? (
                                <div className="relative">
                                  <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition modern-select"
                                    value={(editedStatusValues[t.id] ?? t.status) || "todo"}
                                    onChange={(e) =>
                                      handleStatusChange(
                                        t.id,
                                        e.target.value as "todo" | "inprogress" | "done" | "Archived"
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
                          );
                        case "createdAt":
                          return (
                            <td key="createdAt" className="px-4 py-3 whitespace-nowrap text-left text-gray-600 border-r border-b">
                              {t.createdAt ? format(new Date(t.createdAt), "dd MMM yyyy") : "—"}
                            </td>
                          );
                        case "customerName":
                          return (
                            <td key="customerName" className="px-4 py-3 whitespace-nowrap text-left text-gray-700 border-r border-b">
                              {t.customerName || "—"}
                            </td>
                          );
                        case "startDate":
                          return (
                            <td key="startDate" className="px-4 py-3 whitespace-nowrap text-left text-gray-700 border-r border-b">
                              {startDate ? format(startDate, "dd MMM yyyy") : "—"}
                            </td>
                          );
                        case "endDate":
                          return (
                            <td key="endDate" className="px-4 py-3 whitespace-nowrap text-left text-gray-700 border-r border-b">
                              {endDate ? format(endDate, "dd MMM yyyy") : "—"}
                            </td>
                          );
                        case "daysRemaining":
                          return (
                            <td key="daysRemaining" className="px-4 py-3 whitespace-nowrap text-left font-semibold border-r border-b">
                              {daysRemaining !== null ? (
                                daysRemaining > 0 ? (
                                  <span className="text-blue-600">{daysRemaining} days left</span>
                                ) : daysRemaining === 0 ? (
                                  <span className="text-yellow-600">Due today</span>
                                ) : (
                                  <span className="text-red-600">{Math.abs(daysRemaining)} days overdue</span>
                                )
                              ) : (
                                "—"
                              )}
                            </td>
                          );
                        case "lastCheckOutletDate": {
                          const val = t.lastCheckOutletDate || (t.customFields as any)?.lastCheckOutletDate || "";
                          const isDateSaving = isSaving === `${t.id}-lastCheckOutletDate`;
                          return (
                            <td key="lastCheckOutletDate" className="px-4 py-3 whitespace-nowrap text-left text-gray-700 border-r border-b">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="date"
                                  value={val ? format(new Date(val), "yyyy-MM-dd") : ""}
                                  onChange={(e) => handleDateChange(t.id, "lastCheckOutletDate", e.target.value)}
                                  disabled={!canEditStatus || isDateSaving}
                                  className="text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
                                />
                                {isDateSaving && <FaSpinner className="animate-spin text-indigo-500 text-xs" />}
                              </div>
                            </td>
                          );
                        }
                        case "nextFollowUpDate": {
                          const val = t.nextFollowUpDate || (t.customFields as any)?.nextFollowUpDate || "";
                          const isDateSaving = isSaving === `${t.id}-nextFollowUpDate`;
                          return (
                            <td key="nextFollowUpDate" className="px-4 py-3 whitespace-nowrap text-left text-gray-700 border-r border-b">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="date"
                                  value={val ? format(new Date(val), "yyyy-MM-dd") : ""}
                                  onChange={(e) => handleDateChange(t.id, "nextFollowUpDate", e.target.value)}
                                  disabled={!canEditStatus || isDateSaving}
                                  className="text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
                                />
                                {isDateSaving && <FaSpinner className="animate-spin text-indigo-500 text-xs" />}
                              </div>
                            </td>
                          );
                        }
                        case "timeline":
                          return (
                            <td key="timeline" className="px-4 py-3 whitespace-nowrap text-left text-gray-700 border-r border-b">
                              {t.timeline || "—"}
                            </td>
                          );
                        case "assigneeName":
                          return (
                            <td key="assigneeName" className="px-4 py-3 whitespace-nowrap text-left text-gray-700 border-r border-b">
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
                          );
                        case "packageAmount":
                          return (
                            <td key="packageAmount" className="px-4 py-3 whitespace-nowrap text-right text-green-700 font-semibold border-r border-b">
                              {formatCurrency(t.packageAmount)}
                            </td>
                          );
                        case "amount":
                          return (
                            <td key="amount" className="px-4 py-3 whitespace-nowrap text-right border-r border-b">
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
                                  >
                                  </input>
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
                          );
                        case "received":
                          return (
                            <td key="received" className="px-4 py-3 whitespace-nowrap text-right border-r border-b">
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
                          );
                        case "pendingAmount":
                          return (
                            <td key="pendingAmount" className="px-4 py-3 whitespace-nowrap text-right font-semibold border-r border-b">
                              <span className={isPendingPositive ? "text-red-600" : "text-gray-500"}>
                                {formatCurrency(pending)}
                              </span>
                            </td>
                          );
                        case "notes": {
                          const note = t.recentNote;
                          return (
                            <td key="notes" className="px-4 py-2 border-r border-b max-w-xs">
                              <div className="flex items-start gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedTask(t)}
                                  className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-colors flex-shrink-0 mt-0.5"
                                  title="Open All Notes / Add Remarks"
                                >
                                  <FaStickyNote className="text-sm" />
                                </button>
                                {note ? (
                                  <div
                                    className="flex flex-col text-left cursor-pointer group"
                                    onClick={() => setSelectedTask(t)}
                                    title="Click to view all remarks"
                                  >
                                    <p className="text-xs text-gray-800 line-clamp-2 leading-relaxed font-medium group-hover:text-indigo-600 transition-colors">
                                      {note.content}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                                      {note.authorName && (
                                        <span className="font-semibold text-gray-600">{note.authorName}</span>
                                      )}
                                      {note.createdAt && (
                                        <span>• {format(new Date(note.createdAt), "dd MMM, HH:mm")}</span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span
                                    className="text-xs text-gray-400 italic cursor-pointer hover:text-indigo-500 pt-1"
                                    onClick={() => setSelectedTask(t)}
                                  >
                                    No remarks yet
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        }
                        case "highlight":
                          return (
                            <td key="highlight" className="px-4 py-3 text-center border-b">
                              <HighlightColorPicker
                                taskId={t.id}
                                value={t.highlightColor}
                                onChange={async (newColor) => {
                                  setTasks((prev) =>
                                    prev.map((task) =>
                                      task.id === t.id ? { ...task, highlightColor: newColor } : task
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
                                    setAllRawTasks((prevAll) =>
                                      prevAll.map((task) =>
                                        task.id === t.id ? { ...task, highlightColor: newColor } : task
                                      )
                                    );
                                  } catch (error) {
                                    console.error("Highlight color update error:", error);
                                    toast.error("Failed to update highlight color.");
                                    setTasks((prev) =>
                                      prev.map((task) =>
                                        task.id === t.id
                                          ? { ...task, highlightColor: allRawTasks.find((item) => item.id === t.id)?.highlightColor }
                                          : task
                                      )
                                    );
                                  }
                                }}
                              />
                            </td>
                          );
                        case "actions":
                          return (
                            <td key="actions" className="px-4 py-3 whitespace-nowrap text-center border-b">
                              <button
                                onClick={() => setSelectedTaskId(t.id)}
                                className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                              >
                                View Detail
                              </button>
                            </td>
                          );
                        default:
                          return null;
                      }
                    })}
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

      {selectedTaskId && (
        <TaskDetailsPanel
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
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
