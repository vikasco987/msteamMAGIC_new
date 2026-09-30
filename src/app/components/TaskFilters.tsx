"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { Task } from "../../types/task";
import { Note } from "../../../types/note";
import {
  FaSearch,
  FaDownload,
  FaEye,
  FaEyeSlash,
  FaArrowUp,
  FaArrowDown,
  FaEdit,
  FaTimesCircle,
  FaCaretDown,
  FaCaretUp,
} from "react-icons/fa";
import { format, isToday, subDays, startOfMonth, subMonths, endOfMonth } from "date-fns";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";

interface TaskFiltersProps {
  initialTasks: Task[];
  notesMap: { [taskId: string]: Note[] };
  onFilteredTasksChange: (filteredTasks: Task[]) => void;
  onColumnVisibilityChange: (columns: string[]) => void;
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  // Controlled Props
  query: string;
  onQueryChange: (query: string) => void;
  status: string | null;
  onStatusChange: (status: string | null) => void;
  dateFilter: string | null;
  onDateFilterChange: (dateFilter: string | null) => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  selectedAssignees: string[];
  onAssigneesChange: (assignees: string[]) => void;
  selectedAssigners: string[];
  onAssignersChange: (assigners: string[]) => void;
  salesFilter: "all" | "withSales" | "noSales";
  onSalesFilterChange: (filter: "all" | "withSales" | "noSales") => void;
  pendingSalesFilter: "all" | "withPendingSales" | "fullyPaidSales" | "zeroAmountAndPaid";
  onPendingSalesFilterChange: (filter: "all" | "withPendingSales" | "fullyPaidSales" | "zeroAmountAndPaid") => void;
  availableUsers?: {id: string, name: string, email: string}[];
  availableStatuses?: string[];
  onExport?: () => void;
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
  "tracking",
  "trackingStatus",
  "actions"
];

// FIX: Updated `value` fields to be plain text (no emojis)
// Labels still retain emojis for display
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
  // Using Unicode property escapes for comprehensive emoji stripping
  // \p{Emoji_Presentation}: matches emojis that are typically presented with emoji style
  // \p{Extended_Pictographic}: matches all pictographic characters, including emojis
  // 'u' flag for Unicode support in regex
  return str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "").trim();
}


export const TaskFilters = ({
  initialTasks,
  notesMap,
  onFilteredTasksChange,
  onColumnVisibilityChange,
  editMode,
  setEditMode,
  query,
  onQueryChange,
  status,
  onStatusChange,
  dateFilter,
  onDateFilterChange,
  selectedCategories,
  onCategoriesChange,
  selectedAssignees,
  onAssigneesChange,
  selectedAssigners,
  onAssignersChange,
  salesFilter,
  onSalesFilterChange,
  pendingSalesFilter,
  onPendingSalesFilterChange,
  availableUsers,
  availableStatuses,
  onExport
}: TaskFiltersProps) => {
  // Local states for other filters
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [columns, setColumns] = useState<string[]>(ALL_COLUMNS);

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [isAssignerDropdownOpen, setIsAssignerDropdownOpen] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const assignerDropdownRef = useRef<HTMLDivElement>(null); // New ref for assigner dropdown

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
      // New logic for assigner dropdown
      if (
        assignerDropdownRef.current &&
        !assignerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAssignerDropdownOpen(false);
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
    // Rely on server-side filtering for consistent pagination (10 items per page)
    return initialTasks;
  }, [initialTasks]);

  useEffect(() => {
    onFilteredTasksChange(filteredTasks);
  }, [filteredTasks, onFilteredTasksChange]);

  const exportCSV = () => {
    const exportData = filteredTasks.map((task, index) => ({
      "S. No.": index + 1,
      Title: task.title, // This is the task's actual title/category
      Status: task.status,
      "Shop Name": task.customFields?.shopName,
      Phone: task.customFields?.phone,
      Email: task.customFields?.email,
      Category: task.title, // Export 'title' as 'Category' column
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
        task.attachments?.join(" | ") || "",
      "Payment Proofs":
        task.paymentProofs?.join(" | ") || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tasks");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `Tasks_Report_${Date.now()}.xlsx`);
    toast.success("CSV exported successfully!");
  };

























  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === "asc" ? (
      <FaArrowUp className="ml-1 text-xs" />
    ) : (
      <FaArrowDown className="ml-1 text-xs" />
    );
  };

  const statusOptions = useMemo(() => {
    if (availableStatuses && availableStatuses.length > 0) return availableStatuses;
    return Array.from(new Set(initialTasks.map((t) => t.status).filter(Boolean))) as string[];
  }, [availableStatuses, initialTasks]);

  const uniqueAssigneeNames = useMemo(() => {
    if (availableUsers && availableUsers.length > 0) {
      return Array.from(new Set(availableUsers.map(u => u.name).filter(Boolean)));
    }
    const names = new Set<string>();
    initialTasks.forEach(task => {
      task.assignees?.forEach(assignee => {
        const name = assignee.name || assignee.email;
        if (name) {
          names.add(name);
        }
      });
    });
    return Array.from(names);
  }, [availableUsers, initialTasks]);

  // New memoized list of unique assigners
  const uniqueAssignerNames = useMemo(() => {
    if (availableUsers && availableUsers.length > 0) {
      return Array.from(new Set(availableUsers.map(u => u.name).filter(Boolean)));
    }
    const names = new Set<string>();
    initialTasks.forEach(task => {
      if (task.assignerName) names.add(task.assignerName);
      else if (task.createdByName) names.add(task.createdByName);
    });
    return Array.from(names);
  }, [availableUsers, initialTasks]);


  const getCategoryDropdownDisplayText = () => {
    if (selectedCategories.length === 0) {
      return "All Categories";
    } else if (selectedCategories.length === TASK_CATEGORIES.length) {
      return "All Categories Selected";
    } else if (selectedCategories.length === 1) {
      // Find the label that matches the selected category value (which is now plain text)
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

  // New function for assigner dropdown display text
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


  return (
    <>
      <div className="px-3 md:px-4 py-3 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search tasks by text, AWB, or Printer number..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sales Filter Dropdown */}
          <select
            value={salesFilter}
            onChange={(e) => onSalesFilterChange(e.target.value as "all" | "withSales" | "noSales")}
            className="p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Sales</option>
            <option value="withSales">With Sales</option>
            <option value="noSales">No Sales</option>
          </select>

          {/* Pending Sales Filter Dropdown */}
          <select
            value={pendingSalesFilter}
            onChange={(e) => onPendingSalesFilterChange(e.target.value as "all" | "withPendingSales" | "fullyPaidSales" | "zeroAmountAndPaid")}
            className="p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Pending Sales</option>
            <option value="withPendingSales">With Pending Sales</option>
            <option value="fullyPaidSales">Fully Paid Sales</option>
            <option value="zeroAmountAndPaid">Zero Amount & Paid</option>
          </select>


          <button
            className="flex-1 md:flex-none inline-flex items-center justify-center bg-green-600 text-white font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ease-in-out text-sm"
            onClick={onExport}
          >
            <FaDownload className="inline mr-2" /> Export
          </button>
          <button
            className={`flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out
            ${editMode
                ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                : "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500"
              }`}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? (
              <>
                <FaTimesCircle className="mr-2" /> Exit
              </>
            ) : (
              <>
                <FaEdit className="mr-2" /> Edit
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 md:gap-4 px-3 md:px-4 py-3 border-b border-gray-100 bg-gray-50">
        {/* Status Filter */}
        <select
          value={status || ""}
          onChange={(e) => onStatusChange(e.target.value || null)}
          className="flex-1 md:flex-none p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          <option value="">Status: All</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        {/* Custom Assigner Filter Dropdown with Checkboxes */}
        <div className="relative" ref={assignerDropdownRef}>
          <button
            type="button"
            className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between min-w-[150px]"
            onClick={() => setIsAssignerDropdownOpen(prev => !prev)}
          >
            <span>{getAssignerDropdownDisplayText()}</span>
            {isAssignerDropdownOpen ? <FaCaretUp className="ml-2" /> : <FaCaretDown className="ml-2" />}
          </button>
          {isAssignerDropdownOpen && (
            <div className="absolute z-20 mt-1 w-56 max-h-60 overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {uniqueAssignerNames.map((assigner) => (
                  <label
                    key={assigner}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="accent-blue-600"
                      checked={selectedAssigners.includes(assigner)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        onAssignersChange(
                          isChecked ? [...selectedAssigners, assigner] : selectedAssigners.filter(v => v !== assigner)
                        );
                      }}
                    />
                    {assigner}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>


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
                {uniqueAssigneeNames.map((assignee) => (
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
                        onAssigneesChange(
                          isChecked ? [...selectedAssignees, assignee] : selectedAssignees.filter((v) => v !== assignee)
                        );
                      }}
                    />
                    {assignee}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Date Filter */}
        <select
          value={dateFilter || ""}
          onChange={(e) => onDateFilterChange(e.target.value || null)}
          className="flex-1 md:flex-none p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        onCategoriesChange(
                          isChecked ? [...selectedCategories, cat.value] : selectedCategories.filter((v) => v !== cat.value)
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
            ${columns.includes(col)
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
