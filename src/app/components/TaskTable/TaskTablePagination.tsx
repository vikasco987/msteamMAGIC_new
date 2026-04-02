// // src/components/tasks/TaskTablePagination.tsx
// import React from "react";

// interface TaskTablePaginationProps {
//   currentPage: number;
//   totalPages: number;
//   filteredCount: number; // Total count of filtered tasks
//   paginatedCount: number; // Count of tasks on the current page
//   handlePageChange: (pageNumber: number) => void;
// }

// export const TaskTablePagination: React.FC<TaskTablePaginationProps> = ({
//   currentPage,
//   totalPages,
//   filteredCount,
//   paginatedCount,
//   handlePageChange,
// }) => {
//   const pageNumbers = React.useMemo(() => {
//     const pages = [];
//     const maxPagesToShow = 5;
//     let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
//     let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

//     if (endPage - startPage + 1 < maxPagesToShow) {
//       startPage = Math.max(1, endPage - maxPagesToShow + 1);
//     }
//     if (startPage === 1 && endPage < totalPages) {
//         endPage = Math.min(totalPages, maxPagesToShow);
//     }

//     for (let i = startPage; i <= endPage; i++) {
//       pages.push(i);
//     }
//     return pages;
//   }, [totalPages, currentPage]);

//   return (
//     <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
//       <div className="text-sm text-gray-600 mb-2 sm:mb-0">
//         Showing {paginatedCount} of {filteredCount} tasks
//       </div>
//       <div className="flex items-center space-x-2">
//         <button
//           onClick={() => handlePageChange(1)}
//           disabled={currentPage === 1}
//           className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
//         >
//           First
//         </button>
//         <button
//           onClick={() => handlePageChange(currentPage - 1)}
//           disabled={currentPage === 1}
//           className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
//         >
//           Prev
//         </button>
//         {pageNumbers.map((page) => (
//           <button
//             key={page}
//             onClick={() => handlePageChange(page)}
//             className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors duration-200 ${
//               currentPage === page
//                 ? "bg-blue-600 text-white shadow-md"
//                 : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//             }`}
//           >
//             {page}
//           </button>
//         ))}
//         <button
//           onClick={() => handlePageChange(currentPage + 1)}
//           disabled={currentPage === totalPages}
//           className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
//         >
//           Next
//         </button>
//         <button
//           onClick={() => handlePageChange(totalPages)}
//           disabled={currentPage === totalPages}
//           className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
//         >
//           Last
//         </button>
//       </div>
//     </div>
//   );
// };














"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { TaskTablePagination } from "./TaskTablePagination";

interface Task {
  id: string;
  title: string;
  status: string;
  shopName?: string;
  customerName?: string;
  packageAmount?: number;
  startDate?: string;
  endDate?: string;
  timeline?: string;
  amount?: number;
  amountReceived?: number;
  pending?: number;
  assignees?: string[];
  assignerName?: string;
  highlightColor?: string;
}

export default function TaskTableView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state (optional)
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage] = useState(50); // change to how many to show per page

  useEffect(() => {
    fetchAllTasks();
  }, []);

  const fetchAllTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks?limit=all");
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  // Paginate client-side (optional)
  const totalPages = Math.ceil(tasks.length / tasksPerPage);
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10 text-gray-600">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto bg-white rounded-2xl shadow-md">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-gray-800 text-xs uppercase font-semibold">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Shop Name</th>
              <th className="px-4 py-3">Customer Name</th>
              <th className="px-4 py-3">Package Amount</th>
              <th className="px-4 py-3">Start Date</th>
              <th className="px-4 py-3">End Date</th>
              <th className="px-4 py-3">Timeline</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3">Pending</th>
              <th className="px-4 py-3">Assignees</th>
              <th className="px-4 py-3">Assigner</th>
            </tr>
          </thead>
          <tbody>
            {currentTasks.map((task) => (
              <tr
                key={task.id}
                className={`border-b ${
                  task.highlightColor ? `bg-[${task.highlightColor}]` : "bg-white"
                } hover:bg-gray-50 transition`}
              >
                <td className="px-4 py-3">{task.title}</td>
                <td className="px-4 py-3">{task.shopName || "-"}</td>
                <td className="px-4 py-3">{task.customerName || "-"}</td>
                <td className="px-4 py-3">{task.packageAmount || "-"}</td>
                <td className="px-4 py-3">
                  {task.startDate ? new Date(task.startDate).toLocaleDateString() : "-"}
                </td>
                <td className="px-4 py-3">
                  {task.endDate ? new Date(task.endDate).toLocaleDateString() : "-"}
                </td>
                <td className="px-4 py-3">{task.timeline || "-"}</td>
                <td className="px-4 py-3">{task.amount || "-"}</td>
                <td className="px-4 py-3">{task.amountReceived || "-"}</td>
                <td className="px-4 py-3">
                  {(task.amount || 0) - (task.amountReceived || 0)}
                </td>
                <td className="px-4 py-3">{task.assignees?.join(", ") || "-"}</td>
                <td className="px-4 py-3">{task.assignerName || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Optional client-side pagination */}
      {tasks.length > tasksPerPage && (
        <TaskTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          filteredCount={tasks.length}
          paginatedCount={currentTasks.length}
          handlePageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
