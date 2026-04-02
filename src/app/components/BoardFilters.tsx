"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  FaSearch,
  FaSortAmountDownAlt,
  FaCaretDown,
  FaCaretUp,
  // Removed FaTimesCircle as it's not directly used for rendering an icon
  // within this component, only in the logic for clearing.
} from "react-icons/fa";

// Removed TASK_CATEGORIES as it's passed via props now (allCategories)
// and thus not used directly within this component.

interface BoardFiltersProps {
  filterText: string;
  setFilterText: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortDirection: "asc" | "desc";
  setSortDirection: (value: "asc" | "desc") => void;
  selectedCategories: string[]; // These will be the 'value' strings (e.g., "zomato onboarding")
  setSelectedCategories: (cats: string[]) => void;
  selectedStatuses: string[];
  setSelectedStatuses: (statuses: string[]) => void;
  selectedAssignees: string[];
  setSelectedAssignees: (assignees: string[]) => void;
  selectedAssigners: string[];
  setSelectedAssigners: (assigners: string[]) => void;
  selectedDates: string[];
  setSelectedDates: (dates: string[]) => void;
  // allCategories now expects the full { label, value } array
  allCategories: { label: string; value: string }[];
  allStatuses: string[];
  allAssignees: string[];
  allAssigners: string[];
}

export const BoardFilters: React.FC<BoardFiltersProps> = ({
  filterText,
  setFilterText,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  selectedCategories,
  setSelectedCategories,
  selectedStatuses,
  setSelectedStatuses,
  selectedAssignees,
  setSelectedAssignees,
  selectedAssigners,
  setSelectedAssigners,
  selectedDates,
  setSelectedDates,
  allCategories, // Now explicitly used for rendering
  allStatuses,
  allAssignees,
  allAssigners,
}) => {
  const [openDropdown, setOpenDropdown] = useState<
    "category" | "assignee" | "assigner" | "status" | "date" | null
  >(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (name: typeof openDropdown) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const handleClearFilter = (
    filterType: "category" | "status" | "assignee" | "assigner" | "date"
  ) => {
    switch (filterType) {
      case "category":
        setSelectedCategories([]);
        break;
      case "status":
        setSelectedStatuses([]);
        break;
      case "assignee":
        setSelectedAssignees([]);
        break;
      case "assigner":
        setSelectedAssigners([]);
        break;
      case "date":
        setSelectedDates([]);
        break;
    }
    setOpenDropdown(null); // Close dropdown after clearing
  };

  const renderCheckboxDropdown = (
    items: string[] | { value: string; label: string }[],
    selected: string[],
    setSelected: (val: string[]) => void,
    filterType: "category" | "status" | "assignee" | "assigner" | "date" // Added for clearing
  ) => (
    <div className="absolute z-20 mt-2 w-64 max-h-60 overflow-y-auto rounded-lg bg-white shadow-xl ring-1 ring-gray-200">
      {items.length === 0 && (
        <p className="px-4 py-3 text-sm text-gray-500">No options available</p>
      )}
      {items.map((item) => {
        const value = typeof item === "string" ? item : item.value;
        const label = typeof item === "string" ? item : item.label;

        return (
          <label
            key={value}
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ease-in-out"
          >
            <input
              type="checkbox"
              checked={selected.includes(value)}
              // The fix is here, explicitly typing the event object
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSelected(
                  e.target.checked
                    ? [...selected, value]
                    : selected.filter((i) => i !== value)
                )
              }
              className="form-checkbox h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
            />
            {label}
          </label>
        );
      })}
      {selected.length > 0 && (
        <div className="border-t border-gray-100 mt-2 pt-2">
          <button
            onClick={() => handleClearFilter(filterType)}
            className="w-full text-center py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 ease-in-out rounded-b-lg"
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );

  const dateOptions = useMemo(
    () => [
      { label: "Today", value: "today" },
      { label: "Yesterday", value: "yesterday" },
      { label: "Last 7 Days", value: "last_7_days" },
      { label: "This Month", value: "this_month" },
      { label: "Last Month", value: "last_month" },
      { label: "This Year", value: "this_year" },
    ],
    []
  );

  const getFilterButtonText = (
    baseText: string,
    selectedItems: string[],
    allItems: string[] | { value: string; label: string }[]
  ) => {
    if (selectedItems.length === 0) {
      return baseText;
    } else {
      // Create a set of all possible item values for accurate comparison
      const allItemValues = new Set(
        (allItems as (string | { value: string; label: string })[]).map(item => typeof item === 'string' ? item : item.value)
      );

      // Check if all items are selected
      const areAllSelected = selectedItems.length === allItemValues.size &&
                             selectedItems.every(item => allItemValues.has(item));

      if (areAllSelected) {
        return `${baseText} (All)`;
      } else if (selectedItems.length === 1) {
        const selectedLabel =
          typeof allItems[0] === "string"
            ? selectedItems[0]
            : (allItems as { value: string; label: string }[]).find(
                (item) => item.value === selectedItems[0]
              )?.label || selectedItems[0];
        return `${baseText}: ${selectedLabel.split(" ")[0]}`; // Take only the first word for brevity
      } else {
        return `${baseText} (${selectedItems.length})`;
      }
    }
  };


  return (
    <div
      className="flex flex-wrap items-center gap-3 p-4 bg-white shadow-sm rounded-lg border border-gray-200"
      ref={dropdownRef}
    >
      {/* 🔍 Search */}
      <div className="relative flex-grow max-w-sm">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out"
        />
      </div>

      <div className="flex flex-wrap gap-3 ml-auto">
        {/* 🗓️ Date Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown("date")}
            className={`flex items-center justify-between gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out ${
              selectedDates.length > 0
                ? "bg-purple-100 text-purple-800 border-purple-300"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            } border`}
          >
            {getFilterButtonText("Date", selectedDates, dateOptions)}
            {openDropdown === "date" ? <FaCaretUp /> : <FaCaretDown />}
          </button>
          {openDropdown === "date" &&
            renderCheckboxDropdown(
              dateOptions,
              selectedDates,
              setSelectedDates,
              "date"
            )}
        </div>

        {/* 🏷️ Status Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown("status")}
            className={`flex items-center justify-between gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out ${
              selectedStatuses.length > 0
                ? "bg-purple-100 text-purple-800 border-purple-300"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            } border`}
          >
            {getFilterButtonText("Status", selectedStatuses, allStatuses)}
            {openDropdown === "status" ? <FaCaretUp /> : <FaCaretDown />}
          </button>
          {openDropdown === "status" &&
            renderCheckboxDropdown(
              allStatuses,
              selectedStatuses,
              setSelectedStatuses,
              "status"
            )}
        </div>
        {/* 👤 Assignee Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown("assignee")}
            className={`flex items-center justify-between gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out ${
              selectedAssignees.length > 0
                ? "bg-purple-100 text-purple-800 border-purple-300"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            } border`}
          >
            {getFilterButtonText("Assignee", selectedAssignees, allAssignees)}
            {openDropdown === "assignee" ? <FaCaretUp /> : <FaCaretDown />}
          </button>
          {openDropdown === "assignee" &&
            renderCheckboxDropdown(
              allAssignees,
              selectedAssignees,
              setSelectedAssignees,
              "assignee"
            )}
        </div>

        {/* 👤 Assigner Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown("assigner")}
            className={`flex items-center justify-between gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out ${
              selectedAssigners.length > 0
                ? "bg-purple-100 text-purple-800 border-purple-300"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            } border`}
          >
            {getFilterButtonText("Assigner", selectedAssigners, allAssigners)}
            {openDropdown === "assigner" ? <FaCaretUp /> : <FaCaretDown />}
          </button>
          {openDropdown === "assigner" &&
            renderCheckboxDropdown(
              allAssigners,
              selectedAssigners,
              setSelectedAssigners,
              "assigner"
            )}
        </div>

        {/* 📂 Category Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown("category")}
            className={`flex items-center justify-between gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out ${
              selectedCategories.length > 0
                ? "bg-purple-100 text-purple-800 border-purple-300"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            } border`}
          >
            {getFilterButtonText("Category", selectedCategories, allCategories)}
            {openDropdown === "category" ? <FaCaretUp /> : <FaCaretDown />}
          </button>
          {openDropdown === "category" &&
            renderCheckboxDropdown(
              allCategories,
              selectedCategories,
              setSelectedCategories,
              "category"
            )}
        </div>

        {/* Sort By Dropdown */}
        <div className="flex items-center gap-2">
          <FaSortAmountDownAlt className="text-gray-500 text-lg" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-lg text-sm bg-white focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out appearance-none pr-8"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath fill='%236B7280' d='M5 8l5 5 5-5z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
          >
            <option value="createdAt">Creation Date</option>
            <option value="dueDate">Due Date</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
            <option value="shopName">Shop Name</option>
            <option value="priority">Priority</option>
          </select>
        </div>

        {/* Sort Direction Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value as "asc" | "desc")}
            className="border border-gray-300 px-3 py-2 rounded-lg text-sm bg-white focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out appearance-none pr-8"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath fill='%236B7280' d='M5 8l5 5 5-5z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>
    </div>
  );
};