// src/components/tasks/TaskTableColumns.tsx
import React from "react";
import { FaEye, FaEyeSlash, FaRupeeSign, FaCheckCircle, FaReceipt, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { ALL_COLUMNS } from "./ALL_COLUMNS"; // Import ALL_COLUMNS from constants

interface TaskTableColumnsProps {
  columns: string[];
  setColumns: (cols: string[]) => void;
  requestSort: (key: string) => void;
  getSortIcon: (key: string) => JSX.Element | null;
}

export const TaskTableColumns: React.FC<TaskTableColumnsProps> = ({
  columns,
  setColumns,
  requestSort,
  getSortIcon,
}) => {
  return (
    <>
      {/* Column Visibility Controls */}
      {/* <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
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
      </div> */}

      {/* Table Headers (thead) */}
      <thead className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0 z-10">
        <tr>
          {columns.includes("rowNumber") && (
            <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-12">
              S. No.
            </th>
          )}
          {columns.includes("title") && (
            <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
              Title
            </th>
          )}
          {columns.includes("createdAt") && (
            <th
              className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-36 cursor-pointer"
              onClick={() => requestSort("createdAt")}
            >
              <div className="flex items-center">
                📅 Created {getSortIcon("createdAt")}
              </div>
            </th>
          )}
          {columns.includes("assignerName") && (
            <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-48">
              Assigned By → To
            </th>
          )}
          {columns.includes("shopName") && (
            <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-40">
              🏪 Shop Name
            </th>
          )}
          {columns.includes("location") && (
            <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
              📍 Location
            </th>
          )}
          {columns.includes("phone") && (
            <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
              📞 Phone
            </th>
          )}
          {columns.includes("email") && (
            <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-40">
              📧 Email
            </th>
          )}
          {columns.includes("status") && (
            <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
              Status
            </th>
          )}
          {columns.includes("notes") && (
            <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
              📝 Notes
            </th>
          )}
          {columns.includes("amount") && (
            <th
              className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
              onClick={() => requestSort("amount")}
            >
              <div className="flex items-center justify-end">
                <FaRupeeSign className="mr-1" /> Amount {getSortIcon("amount")}
              </div>
            </th>
          )}
          {columns.includes("amountReceived") && (
            <th
              className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
              onClick={() => requestSort("amountReceived")}
            >
              <div className="flex items-center justify-end">
                <FaCheckCircle className="mr-1 text-emerald-600" /> Received {getSortIcon("amountReceived")}
              </div>
            </th>
          )}
          {columns.includes("pendingAmount") && (
            <th
              className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
              onClick={() => requestSort("pendingAmount")}
            >
              <div className="flex items-center justify-end">
                <FaReceipt className="mr-1 text-rose-600" /> Pending {getSortIcon("pendingAmount")}
              </div>
            </th>
          )}
          {/* NEW AFE COLUMN HEADER */}
          {columns.includes("afe") && (
            <th
              className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
              onClick={() => requestSort("afe")}
            >
              <div className="flex items-center justify-end">
                <FaRupeeSign className="mr-1" /> AFE {getSortIcon("afe")}
              </div>
            </th>
          )}
        </tr>
      </thead>
    </>
  );
};
