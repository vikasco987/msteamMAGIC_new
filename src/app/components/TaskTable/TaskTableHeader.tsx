// src/components/tasks/TaskTableHeader.tsx
import React from "react";
import {
  FaDownload,
  FaSearch,
  FaEdit,
  FaTimesCircle,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { Task } from "../../../types/task"; // Assuming Task type is accessible

interface TaskTableHeaderProps {
  query: string;
  setQuery: (value: string) => void;
  statusFilter: string | null;
  setStatusFilter: (value: string | null) => void;
  sourceFilter: string | null;
  setSourceFilter: (value: string | null) => void;
  assigneeFilter: string | null;
  setAssigneeFilter: (value: string | null) => void;
  dateFilter: string | null;
  setDateFilter: (value: string | null) => void;
  tasksPerPage: number;
  handleTasksPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  editMode: boolean;
  setEditMode: (value: (prev: boolean) => boolean) => void;
  exportCSV: () => void;
  localTasks: Task[]; // Needed for assignee filter options
}

export const TaskTableHeader: React.FC<TaskTableHeaderProps> = ({
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  sourceFilter,
  setSourceFilter,
  assigneeFilter,
  setAssigneeFilter,
  dateFilter,
  setDateFilter,
  tasksPerPage,
  handleTasksPerPageChange,
  editMode,
  setEditMode,
  exportCSV,
  localTasks,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-gray-100 bg-gray-50">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative w-full sm:w-auto">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by shop, email, phone..."
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm transition duration-200 ease-in-out w-full"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8 bg-white transition duration-200 ease-in-out"
          value={statusFilter ?? ""}
          onChange={(e) => setStatusFilter(e.target.value || null)}
        >
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="done">Done</option>
        </select>
        <select
          className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8 bg-white transition duration-200 ease-in-out"
          value={sourceFilter ?? ""}
          onChange={(e) => setSourceFilter(e.target.value || null)}
        >
          <option value="">All Sources</option>
          <option value="zomato">Zomato</option>
          <option value="swiggy">Swiggy</option>
          <option value="license">License</option>
        </select>
        <select
          className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8 bg-white transition duration-200 ease-in-out"
          value={assigneeFilter ?? ""}
          onChange={(e) => setAssigneeFilter(e.target.value || null)}
        >
          <option value="">All Assignees</option>
          {[...new Set(localTasks.map((t) => t.assignees?.map(a => a.name || a.email)).flat().filter(Boolean))].map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8 bg-white transition duration-200 ease-in-out"
          value={dateFilter ?? ""}
          onChange={(e) => setDateFilter(e.target.value || null)}
        >
          <option value="">All Dates</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last_7_days">Last 7 Days</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="this_year">This Year</option>
        </select>

        <div className="flex items-center gap-2">
          <label htmlFor="tasksPerPageSelect" className="text-sm text-gray-600">Tasks per page:</label>
          <select
            id="tasksPerPageSelect"
            value={tasksPerPage}
            onChange={handleTasksPerPageChange}
            className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8 bg-white transition duration-200 ease-in-out"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex items-center bg-green-600 text-white font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ease-in-out"
          onClick={exportCSV}
        >
          <FaDownload className="inline mr-2 -ml-1" /> Export CSV
        </button>
        <button
          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out
          ${editMode ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500" : "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500"}`}
          onClick={() => setEditMode((prev) => !prev)}
        >
          {editMode ? <><FaTimesCircle className="mr-2" /> Exit Edit Mode</> : <><FaEdit className="mr-2" /> Enter Edit Mode</>}
        </button>
      </div>
    </div>
  );
};