"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Task } from "../../types/task"; // Adjusted import path
import { Note } from "../../../types/note"; // Adjusted import path
import {
  FaSearch,
  FaDownload,
  FaEye,
  FaEyeSlash,
  FaEdit,
  FaTimesCircle,
  FaCaretDown,
  FaCaretUp,
} from "react-icons/fa";
import { format, isToday, subDays, startOfMonth } from "date-fns";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import useDebounce from "../../hooks/useDebounce"; // Import useDebounce

interface TaskFiltersProps {
  initialTasks: Task[];
  notesMap: { [taskId: string]: Note[] };
  onFilteredTasksChange: (filteredTasks: Task[]) => void;
  onColumnVisibilityChange: (columns: string[]) => void;
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  setPage: (page: number) => void; // Added setPage prop
}

const ALL_COLUMNS = [
  "rowNumber",
  "highlightColor",
  "title", // This will now effectively act as the 'category' for filtering
  "status",
  "shopName",
  "email",
  "phone",
  "assignerName",
  "assignee",
  "createdAt",
  "location",
  "notes",
  "amount",
  "amountReceived",
  "pendingAmount",
  "attachments",
  "paymentProofs",
];

const TASK_CATEGORIES = [
  { label: "🍽️ Zomato Onboarding", value: "Zomato Onboarding" },
  { label: "🍔 Swiggy Onboarding", value: "Swiggy Onboarding" },
  { label: "🍽️🍔 Zomato + Swiggy Combo", value: "Zomato + Swiggy Combo" },
  { label: "🧾 Food License", value: "Food License" },
  { label: "📸 Photo Upload", value: "Photo Upload" },
  { label: "📂 Account Handling", value: "Account Handling" },
  { label: "🛠️ Other", value: "Other" },
];

// Helper function to strip emojis from a string
function stripEmojis(str: string): string {
  return str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "").trim();
}

export const TaskFilters = ({
  initialTasks,
  notesMap,
  onFilteredTasksChange,
  onColumnVisibilityChange,
  editMode,
  setEditMode,
  setPage, // Destructure setPage
}: TaskFiltersProps) => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [columns, setColumns] = useState<string[]>(ALL_COLUMNS);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  // Debounce the query for better performance
  const debouncedQuery = useDebounce(query, 300);

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

  useEffect(() => {
    onColumnVisibilityChange(columns);
  }, [columns, onColumnVisibilityChange]);

  const filteredTasks = useMemo(() => {
    let currentFilteredTasks = [...initialTasks];
    const now = new Date();

    // Apply search query filter (using debounced query)
    if (debouncedQuery) {
      const lower = debouncedQuery.toLowerCase();
      currentFilteredTasks = currentFilteredTasks.filter((t) =>
        [
          t.customFields?.shopName,
          t.customFields?.email,
          t.customFields?.phone,
          t.assignee?.name,
          t.title, // Keep title for general search
          t.status,
          t.assignerName,
          t.customFields?.location,
          ...(notesMap[t.id] || []).map((note) => note.content),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(lower)
      );
    }
    if (statusFilter) {
      currentFilteredTasks = currentFilteredTasks.filter((t) => t.status === statusFilter);
    }

    if (selectedAssignees.length > 0) {
      currentFilteredTasks = currentFilteredTasks.filter((t) =>
        t.assignees?.some(
          (a) => (a.name || a.email) && selectedAssignees.includes(a.name || a.email || '')
        ) || (t.assignee?.name && selectedAssignees.includes(t.assignee.name))
      );
    }

    if (selectedCategories.length > 0) {
      currentFilteredTasks = currentFilteredTasks.filter(
        (t) => t.title && selectedCategories.includes(stripEmojis(t.title))
      );
    }

    if (dateFilter) {
      currentFilteredTasks = currentFilteredTasks.filter((t) => {
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
            const startOfLastMonth = startOfMonth(subDays(now, 30)); // Simple approximation
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

    if (sortConfig) {
      currentFilteredTasks.sort((a, b) => {
        let aValue: string | number | undefined; // FIX: Specific type for aValue/bValue
        let bValue: string | number | undefined; // FIX: Specific type for aValue/bValue

        if (sortConfig.key === "pendingAmount") {
          aValue = (Number(a.amount) || 0) - (Number(a.received) || 0);
          bValue = (Number(b.amount) || 0) - (Number(b.received) || 0);
        } else if (sortConfig.key === "amount") {
          aValue = Number(a.amount) || 0;
          bValue = Number(b.amount) || 0;
        } else if (sortConfig.key === "amountReceived") {
          aValue = Number(a.received) || 0;
          bValue = Number(b.received) || 0;
        } else if (sortConfig.key === "createdAt") {
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
        } else if (sortConfig.key === "shopName") { // Handle customFields sorting
          aValue = a.customFields?.shopName || '';
          bValue = b.customFields?.shopName || '';
        } else if (sortConfig.key === "email") {
          aValue = a.customFields?.email || '';
          bValue = b.customFields?.email || '';
        } else if (sortConfig.key === "phone") {
          aValue = a.customFields?.phone || '';
          bValue = b.customFields?.phone || '';
        } else if (sortConfig.key === "location") {
          aValue = a.customFields?.location || '';
          bValue = b.customFields?.location || '';
        } else if (sortConfig.key === "assignee") { // Sorting for assignee name
          const aAssignee = a.assignees?.[0]?.name || a.assignee?.name || '';
          const bAssignee = b.assignees?.[0]?.name || b.assignee?.name || '';
          aValue = aAssignee;
          bValue = bAssignee;
        }
        else {
          // FIX: Type assertion for accessing properties dynamically
          aValue = (a as Record<string, any>)[sortConfig.key];
          bValue = (b as Record<string, any>)[sortConfig.key];
        }

        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortConfig.direction === "asc" ? 1 : -1;
        if (bValue === undefined) return sortConfig.direction === "asc" ? -1 : 1;

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
        }
        return sortConfig.direction === "asc"
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }

    return currentFilteredTasks;
  }, [
    initialTasks,
    debouncedQuery, // Use debounced query here
    sortConfig,
    statusFilter,
    selectedAssignees,
    selectedCategories,
    dateFilter,
    notesMap,
  ]);

  // Trigger onFilteredTasksChange and reset page when filters change
  useEffect(() => {
    onFilteredTasksChange(filteredTasks);
    setPage(1); // Reset page to 1 whenever filters or sorting changes
  }, [filteredTasks, onFilteredTasksChange, setPage]);

  const exportCSV = () => {
    const exportData = filteredTasks.map((task, index) => ({
      "S. No.": index + 1,
      Title: task.title,
      Status: task.status,
      "Shop Name": task.customFields?.shopName,
      Phone: task.customFields?.phone,
      Email: task.customFields?.email,
      Category: task.title,
      Assignee:
        task.assignees?.map((a) => a?.name || a?.email).filter(Boolean).join(", ") ||
        task.assignee?.name,
      Assigner: task.assignerName,
      "Created At": task.createdAt
        ? format(new Date(task.createdAt), "dd MMM yyyy, HH:mm")
        : "",
      Location: task.customFields?.location,
      Notes: (notesMap[task.id] || []).map((note) => note.content).join(" | "),
      Attachments:
        task.attachments?.map((a) => (typeof a === "string" ? a : a.url)).join(" | ") || "",
      "Payment Proofs":
        task.paymentProofs?.map((p) => (typeof p === "string" ? p : p.url)).filter(Boolean).join(" | ") || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tasks");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `Tasks_Report_${Date.now()}.xlsx`);
    toast.success("CSV exported successfully!");
  };

  // Removed requestSort and getSortIcon from here as they are not used within this component's UI directly
  // They are typically used by the table headers, which are in KamTableView.tsx

  const statusOptions = Array.from(new Set(initialTasks.map((t) => t.status).filter(Boolean))) as string[];
  const uniqueAssigneeNames = useMemo(() => {
    const names = new Set<string>();
    initialTasks.forEach(task => {
      // Check both new 'assignees' array and old 'assignee' object
      task.assignees?.forEach(assignee => {
        if (assignee.name || assignee.email) {
          names.add(assignee.name || assignee.email || '');
        }
      });
      if (task.assignee?.name) { // For backward compatibility
        names.add(task.assignee.name);
      }
    });
    return Array.from(names).sort(); // Sort assignee names alphabetically
  }, [initialTasks]);

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

  return (
    <>
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-grow mr-4 min-w-[200px]">
          <input
            type="text"
            placeholder="Filter tasks by text..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="inline-flex items-center bg-green-600 text-white font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ease-in-out"
            onClick={exportCSV}
          >
            <FaDownload className="inline mr-2 -ml-1" /> Export CSV
          </button>
          <button
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out
            ${
              editMode
                ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                : "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500"
            }`}
            onClick={() => setEditMode((prev) => !prev)}
          >
            {editMode ? (
              <>
                <FaTimesCircle className="mr-2" /> Exit Edit Mode
              </>
            ) : (
              <>
                <FaEdit className="mr-2" /> Enter Edit Mode
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50">
        {/* Status Filter */}
        <select
          value={statusFilter || ""}
          onChange={(e) => setStatusFilter(e.target.value || null)}
          className="p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        {/* Custom Assignee Filter Dropdown with Checkboxes */}
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { // FIX: Specific event type
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

        {/* Date Filter */}
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

        {/* Custom Category Filter Dropdown with Checkboxes */}
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => { // FIX: Specific event type
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
      </div>

      <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <span className="text-gray-700 text-sm font-medium mr-2">Show/Hide Columns:</span>
        {ALL_COLUMNS.map((col) => (
          <button
            key={col}
            onClick={() =>
              setColumns((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]))
            }
            className={`inline-flex items-center px-3 py-1.5 border rounded-full text-xs font-medium transition-all duration-200 ease-in-out
            ${
              columns.includes(col)
                ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            }`}
          >
            {columns.includes(col) ? <FaEye className="mr-1" /> : <FaEyeSlash className="mr-1" />}{" "}
            {col.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
          </button>
        ))}
      </div>
    </>
  );
};