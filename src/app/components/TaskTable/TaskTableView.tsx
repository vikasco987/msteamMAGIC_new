// // components/TaskTableView.tsx
// "use client";

// import React, { useState, useEffect, useMemo } from "react";
// import { Task } from "../../../types/task";
// import { Note } from "../../../../types/note";
// import { useUser, UserResource } from "@clerk/nextjs";
// import { format, isToday, subDays, startOfMonth } from "date-fns";
// import { FaSpinner, FaArrowUp, FaArrowDown } from "react-icons/fa"; // Only import what's needed here
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
// import toast from "react-hot-toast";
// import NotesModal from "../../components/NotesModal"; // Assuming this path is correct

// // Import the new modular components
// import { TaskTableHeader } from "./TaskTableHeader";
// import { TaskTableColumns } from "./TaskTableColumns";
// import { TaskTableBody } from "./TaskTableBody";
// import { TaskTablePagination } from "./TaskTablePagination";
// import { ALL_COLUMNS } from "./ALL_COLUMNS"; // Import ALL_COLUMNS from constants

// interface Props {
//   tasks: Task[];
//   user: UserResource;
//   onTasksUpdate?: (updatedTasks: Task[]) => void;
// }

// export default function TaskTableView({ tasks, user, onTasksUpdate }: Props) {
//   const [editMode, setEditMode] = useState(false);
//   const [editedValues, setEditedValues] = useState<{ [key: string]: number }>({});
//   const [localTasks, setLo
// calTasks] = useState<Task[]>(tasks || []);
//   const [isSaving, setIsSaving] = useState<string | null>(null);

//   const [query, setQuery] = useState("");
//   const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
//   const [columns, setColumns] = useState<string[]>(ALL_COLUMNS); // Initialize with all columns
//   const [statusFilter, setStatusFilter] = useState<string | null>(null);
//   const [sourceFilter, setSourceFilter] = useState<string | null>(null);
//   const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
//   const [dateFilter, setDateFilter] = useState<string | null>(null);

//   const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
//   const [selectedTaskIdForNotes, setSelectedTaskIdForNotes] = useState<string | null>(null);
//   const [notesMap, setNotesMap] = useState<{ [taskId: string]: Note[] }>({});

//   const [currentPage, setCurrentPage] = useState(1);
//   const [tasksPerPage, setTasksPerPage] = useState(10);

//   const { user: clerkUser } = useUser();
//   const currentUserId = clerkUser?.id;

//   const role = (user.publicMetadata?.role as string) || "";

//   useEffect(() => {
//     if (!user) return;

//     if (!Array.isArray(tasks)) {
//       console.warn("⚠️ Invalid task data received:", tasks);
//       setLocalTasks([]);
//       setNotesMap({});
//       return;
//     }

//     const initialNotes = tasks.reduce((acc, task) => {
//       if (Array.isArray(task.notes)) {
//         acc[task.id] = task.notes;
//       } else {
//         acc[task.id] = [];
//       }
//       return acc;
//     }, {} as { [taskId: string]: Note[] });
//     setNotesMap(initialNotes);

//     let filteredByRoleTasks: Task[] = [];
//     if (role === "admin" || role === "master") {
//       filteredByRoleTasks = tasks;
//     } else if (role === "seller" && currentUserId) {
//       filteredByRoleTasks = tasks.filter(
//         (t) =>
//           t.createdByClerkId === currentUserId ||
//           (Array.isArray(t.assigneeIds) && t.assigneeIds.includes(currentUserId))
//       );
//     } else {
//       filteredByRoleTasks = [];
//     }
//     setLocalTasks(filteredByRoleTasks);
//     setCurrentPage(1);
//   }, [tasks, user, currentUserId, role]);

//   const refetchTasks = async () => {
//     try {
//       const res = await fetch("/api/tasks");
//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.error || 'Failed to refetch tasks');
//       }
//       const data = await res.json();
//       if (Array.isArray(data.tasks)) {
//         setLocalTasks(data.tasks);
//         onTasksUpdate?.(data.tasks);
//       } else {
//         console.warn("RefetchTasks: API returned non-array for tasks:", data);
//         toast.error("Refetching tasks failed: Invalid data format.");
//       }
//     } catch (err: any) {
//       console.error("❌ Error during refetch:", err);
//       toast.error(`Refetch error: ${err.message || 'An unknown error occurred.'}`);
//     }
//   };

//   const filtered = useMemo(() => {
//     let filteredTasks = [...localTasks];
//     const now = new Date();

//     if (query) {
//       const lower = query.toLowerCase();
//       filteredTasks = filteredTasks.filter((t) =>
//         [
//           t.customFields?.shopName,
//           t.customFields?.email,
//           t.customFields?.phone,
//           t.assignee?.name,
//           t.title,
//           t.status,
//           t.assignerName,
//           t.customFields?.location,
//           ...(notesMap[t.id] || []).map((note) => note.content),
//         ]
//           .filter(Boolean)
//           .join(" ")
//           .toLowerCase()
//           .includes(lower)
//       );
//     }
//     if (statusFilter) {
//       filteredTasks = filteredTasks.filter((t) => t.status === statusFilter);
//     }
//     if (assigneeFilter) {
//       filteredTasks = filteredTasks.filter((t) => t.assignee?.name === assigneeFilter);
//     }
//     if (sourceFilter) {
//       filteredTasks = filteredTasks.filter((t) => t.customFields?.source === sourceFilter);
//     }

//     if (dateFilter) {
//       filteredTasks = filteredTasks.filter((t) => {
//         const taskDate = new Date(t.createdAt);
//         switch (dateFilter) {
//           case "today":
//             return isToday(taskDate);
//           case "yesterday":
//             const yesterday = subDays(now, 1);
//             return format(taskDate, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd");
//           case "last_7_days":
//             const sevenDaysAgo = subDays(now, 7);
//             return taskDate >= sevenDaysAgo && taskDate <= now;
//           case "this_month":
//             const startOfCurrentMonth = startOfMonth(now);
//             return taskDate >= startOfCurrentMonth && taskDate <= now;
//           case "last_month":
//             const startOfLastMonth = startOfMonth(subDays(now, 30));
//             const endOfLastMonth = subDays(startOfMonth(now), 1);
//             return taskDate >= startOfLastMonth && taskDate <= endOfLastMonth;
//           case "this_year":
//             const startOfCurrentYear = new Date(now.getFullYear(), 0, 1);
//             return taskDate >= startOfCurrentYear && taskDate <= now;
//           default:
//             return true;
//         }
//       });
//     }

//     if (sortConfig) {
//       filteredTasks.sort((a, b) => {
//         let aValue: any;
//         let bValue: any;

//         if (sortConfig.key === 'pendingAmount') {
//           aValue = (Number(a.customFields?.amount) || 0) - (Number(a.customFields?.amountReceived) || 0);
//           bValue = (Number(b.customFields?.amount) || 0) - (Number(b.customFields?.amountReceived) || 0);
//         } else if (sortConfig.key === 'amount' || sortConfig.key === 'amountReceived' || sortConfig.key === 'afe') {
//             aValue = Number(a.customFields?.[sortConfig.key]) || 0;
//             bValue = Number(b.customFields?.[sortConfig.key]) || 0;
//         } else if (
//           sortConfig.key === "createdAt"
//         ) {
//           aValue = new Date(a.createdAt || 0).getTime();
//           bValue = new Date(b.createdAt || 0).getTime();
//         } else {
//           aValue = (a as any)[sortConfig.key];
//           bValue = (b as any)[sortConfig.key];
//         }

//         if (aValue === undefined && bValue === undefined) return 0;
//         if (aValue === undefined) return sortConfig.direction === "asc" ? 1 : -1;
//         if (bValue === undefined) return sortConfig.direction === "asc" ? -1 : 1;

//         if (typeof aValue === 'number' && typeof bValue === 'number') {
//             return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
//         }
//         return sortConfig.direction === "asc"
//           ? String(aValue).localeCompare(String(bValue))
//           : String(bValue).localeCompare(String(aValue));
//       });
//     }

//     return filteredTasks;
//   }, [localTasks, query, sortConfig, statusFilter, assigneeFilter, dateFilter, notesMap, sourceFilter]);

//   const totalPages = Math.ceil(filtered.length / tasksPerPage);
//   const paginatedTasks = useMemo(() => {
//     const startIndex = (currentPage - 1) * tasksPerPage;
//     const endIndex = startIndex + tasksPerPage;
//     return filtered.slice(startIndex, endIndex);
//   }, [filtered, currentPage, tasksPerPage]);

//   const handleTasksPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setTasksPerPage(Number(e.target.value));
//     setCurrentPage(1);
//   };

//   const handlePageChange = (pageNumber: number) => {
//     setCurrentPage(pageNumber);
//   };

//   const exportCSV = () => {
//     const exportData = filtered.map((task, index) => ({
//       "S. No.": index + 1,
//       "Title": task.title,
//       "Status": task.status,
//       "Shop Name": task.customFields?.shopName,
//       "Phone": task.customFields?.phone,
//       "Email": task.customFields?.email,
//       "Assignee": task.assignees?.map(a => a?.name || a?.email).filter(Boolean).join(", ") || task.assignee?.name,
//       "Assigner": task.assignerName,
//       "Created At": task.createdAt ? format(new Date(task.createdAt), "dd MMM yyyy, HH:mm") : "",
//       "Location": task.customFields?.location,
//       "Amount": Number(task.customFields?.amount) || 0,
//       "Amount Received": Number(task.customFields?.amountReceived) || 0,
//       "Pending Amount": (Number(task.customFields?.amount) || 0) - (Number(task.customFields?.amountReceived) || 0),
//       "AFE": Number(task.customFields?.afe) || 0, // Added AFE to export
//       "Notes": (notesMap[task.id] || []).map((note) => note.content).join(" | "),
//     }));

//     const ws = XLSX.utils.json_to_sheet(exportData);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Tasks");
//     const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
//     const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
//     saveAs(blob, `Tasks_Report_${Date.now()}.xlsx`);
//     toast.success("CSV exported successfully!");
//   };

//   const handleInputChange = (
//     taskId: string,
//     field: "amount" | "amountReceived" | "afe",
//     value: number
//   ) => {
//     const key = `${taskId}-${field}`;
//     setEditedValues((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleBlur = async (taskId: string, field: "amount" | "amountReceived" | "afe") => {
//     const key = `${taskId}-${field}`;
//     const value = editedValues[key];

//     const originalTask = localTasks.find(t => t.id === taskId);
//     const originalValue = Number(originalTask?.customFields?.[field]) || 0;

//     if (typeof value === "number" && !isNaN(value) && value !== originalValue) {
//       setIsSaving(key);
//       try {
//         const res = await fetch("/api/tasks/update", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ taskId, field, value }),
//         });

//         if (!res.ok) {
//           const contentType = res.headers.get("content-type");
//           const errorText = await res.text();

//           let errorMessage = "Failed to update task.";
//           if (contentType && contentType.includes("application/json")) {
//             try {
//               const errorJson = JSON.parse(errorText);
//               errorMessage = errorJson.error || errorMessage;
//             } catch (jsonErr) {
//               console.error("Failed to parse error JSON:", jsonErr, errorText);
//               errorMessage = "Server returned malformed error. Contact support.";
//             }
//           } else {
//             errorMessage = `Server error: ${res.status} ${res.statusText}. Please try again.`;
//             console.error("Server returned non-JSON error:", errorText);
//           }

//           toast.error(errorMessage);
//           setEditedValues((prev) => ({ ...prev, [key]: originalValue }));
//         } else {
//           toast.success("Task updated successfully!");
//           await refetchTasks();
//         }
//       } catch (err: any) {
//         console.error("❌ Network or unexpected error:", err);
//         toast.error(err.message || "An unexpected error occurred while updating the task.");
//         setEditedValues((prev) => ({ ...prev, [key]: originalValue }));
//       } finally {
//         setIsSaving(null);
//       }
//     } else {
//       setEditedValues((prev) => {
//         const newState = { ...prev };
//         delete newState[key];
//         return newState;
//       });
//     }
//   };

//   const requestSort = (key: string) => {
//     let direction: "asc" | "desc" = "asc";
//     if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
//       direction = "desc";
//     }
//     setSortConfig({ key, direction });
//   };

//   const getSortIcon = (key: string) => {
//     if (!sortConfig || sortConfig.key !== key) {
//       return null;
//     }
//     return sortConfig.direction === "asc" ? <FaArrowUp className="ml-1 text-xs" /> : <FaArrowDown className="ml-1 text-xs" />;
//   };

//   return (
//     <div className="bg-white rounded-xl shadow-lg border border-gray-100 mt-6 overflow-hidden">
//       {/* Header with Search, Filters, Export, and Edit Mode Toggle */}
//       <TaskTableHeader
//         query={query}
//         setQuery={setQuery}
//         statusFilter={statusFilter}
//         setStatusFilter={setStatusFilter}
//         sourceFilter={sourceFilter}
//         setSourceFilter={setSourceFilter}
//         assigneeFilter={assigneeFilter}
//         setAssigneeFilter={setAssigneeFilter}
//         dateFilter={dateFilter}
//         setDateFilter={setDateFilter}
//         tasksPerPage={tasksPerPage}
//         handleTasksPerPageChange={handleTasksPerPageChange}
//         editMode={editMode}
//         setEditMode={setEditMode}
//         exportCSV={exportCSV}
//         localTasks={localTasks} // Pass localTasks for assignee filter options
//       />

//       <div className="overflow-x-auto">
//         <table className="min-w-full table-fixed border-collapse border border-gray-200 text-sm shadow-md rounded-md overflow-hidden">
//           {/* Column Visibility Controls and Table Headers */}
//           <TaskTableColumns
//             columns={columns}
//             setColumns={setColumns}
//             requestSort={requestSort}
//             getSortIcon={getSortIcon}
//           />

//           {/* Table Body */}
//           {paginatedTasks.length === 0 ? (
//             <tbody className="bg-white">
//               <tr>
//                 <td colSpan={columns.length} className="text-center px-4 py-8 text-gray-500 text-base">
//                   <div className="flex flex-col items-center justify-center h-full">
//                     <svg
//                       className="w-12 h-12 text-gray-400 mb-3"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                       xmlns="http://www.w3.org/2000/svg"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth="1.5"
//                         d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
//                       ></path>
//                     </svg>
//                     <p className="text-lg font-medium">No tasks found</p>
//                     <p className="text-sm text-gray-500">
//                       Adjust your filters or add new tasks to see them here.
//                     </p>
//                   </div>
//                 </td>
//               </tr>
//             </tbody>
//           ) : (
//             <TaskTableBody
//               tasks={paginatedTasks}
//               columns={columns}
//               editMode={editMode}
//               editedValues={editedValues}
//               handleInputChange={handleInputChange}
//               handleBlur={handleBlur}
//               isSaving={isSaving}
//               selectedTaskIdForNotes={selectedTaskIdForNotes}
//               setIsNoteModalOpen={setIsNoteModalOpen}
//               notesMap={notesMap}
//             />
//           )}
//         </table>
//       </div>

//       {/* Pagination Controls */}
//       <TaskTablePagination
//         currentPage={currentPage}
//         totalPages={totalPages}
//         filteredCount={filtered.length}
//         paginatedCount={paginatedTasks.length}
//         handlePageChange={handlePageChange}
//       />

//       {selectedTaskIdForNotes && (
//         <NotesModal
//           isOpen={isNoteModalOpen}
//           onClose={() => {
//             setIsNoteModalOpen(false);
//             setSelectedTaskIdForNotes(null);
//           }}
//           taskId={selectedTaskIdForNotes}
//           initialNotes={notesMap[selectedTaskIdForNotes] || []}
//           onNotesUpdated={refetchTasks}
//         />
//       )}
//     </div>
//   );
// }













// components/TaskTableView.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Task } from "../../../types/task";
import { Note } from "../../../../types/note";
import { useUser, UserResource } from "@clerk/nextjs";
import { format, isToday, subDays, startOfMonth } from "date-fns";
import { FaEye, FaEyeSlash, FaArrowUp, FaArrowDown } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import NotesModal from "../../components/NotesModal";

// Import the new modular components
import { TaskTableHeader } from "./TaskTableHeader";
import { TaskTableColumns } from "./TaskTableColumns";
import { TaskTableBody } from "./TaskTableBody";
import { TaskTablePagination } from "./TaskTablePagination";
import { ALL_COLUMNS } from "./ALL_COLUMNS";

interface Props {
  tasks: Task[];
  user: UserResource;
  onTasksUpdate?: (updatedTasks: Task[]) => void;
}

export default function TaskTableView({ tasks, user, onTasksUpdate }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [editedValues, setEditedValues] = useState<{ [key: string]: number }>({});
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks || []);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [columns, setColumns] = useState<string[]>(ALL_COLUMNS);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedTaskIdForNotes, setSelectedTaskIdForNotes] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<{ [taskId: string]: Note[] }>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(10);

  const { user: clerkUser } = useUser();
  const currentUserId = clerkUser?.id;

  const role = (user.publicMetadata?.role as string) || "";

  useEffect(() => {
    if (!user) return;

    if (!Array.isArray(tasks)) {
      console.warn("⚠️ Invalid task data received:", tasks);
      setLocalTasks([]);
      setNotesMap({});
      return;
    }

    const initialNotes = tasks.reduce((acc, task) => {
      if (Array.isArray(task.notes)) {
        acc[task.id] = task.notes;
      } else {
        acc[task.id] = [];
      }
      return acc;
    }, {} as { [taskId: string]: Note[] });
    setNotesMap(initialNotes);

    let filteredByRoleTasks: Task[] = [];
    if (role === "admin" || role === "master") {
      filteredByRoleTasks = tasks;
    } else if (role === "seller" && currentUserId) {
      filteredByRoleTasks = tasks.filter(
        (t) =>
          t.createdByClerkId === currentUserId ||
          (Array.isArray(t.assigneeIds) && t.assigneeIds.includes(currentUserId))
      );
    } else {
      filteredByRoleTasks = [];
    }
    setLocalTasks(filteredByRoleTasks);
    setCurrentPage(1);
  }, [tasks, user, currentUserId, role]);

  const refetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to refetch tasks');
      }
      const data = await res.json();
      if (Array.isArray(data.tasks)) {
        setLocalTasks(data.tasks);
        onTasksUpdate?.(data.tasks);
      } else {
        console.warn("RefetchTasks: API returned non-array for tasks:", data);
        toast.error("Refetching tasks failed: Invalid data format.");
      }
    } catch (err: any) {
      console.error("❌ Error during refetch:", err);
      toast.error(`Refetch error: ${err.message || 'An unknown error occurred.'}`);
    }
  };

  const filtered = useMemo(() => {
    let filteredTasks = [...localTasks];
    const now = new Date();

    if (query) {
      const lower = query.toLowerCase();
      filteredTasks = filteredTasks.filter((t) =>
        [
          t.customFields?.shopName,
          t.customFields?.email,
          t.customFields?.phone,
          t.assignee?.name,
          t.title,
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
      filteredTasks = filteredTasks.filter((t) => t.status === statusFilter);
    }
    if (assigneeFilter) {
      filteredTasks = filteredTasks.filter((t) => t.assignee?.name === assigneeFilter);
    }
    if (sourceFilter) {
      filteredTasks = filteredTasks.filter((t) => t.customFields?.source === sourceFilter);
    }

    if (dateFilter) {
      filteredTasks = filteredTasks.filter((t) => {
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

    if (sortConfig) {
      filteredTasks.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'pendingAmount') {
          aValue = (Number(a.customFields?.amount) || 0) - (Number(a.customFields?.amountReceived) || 0);
          bValue = (Number(b.customFields?.amount) || 0) - (Number(b.customFields?.amountReceived) || 0);
        } else if (sortConfig.key === 'amount' || sortConfig.key === 'amountReceived' || sortConfig.key === 'afe') {
            aValue = Number(a.customFields?.[sortConfig.key]) || 0;
            bValue = Number(b.customFields?.[sortConfig.key]) || 0;
        } else if (
          sortConfig.key === "createdAt"
        ) {
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
        } else {
          aValue = (a as any)[sortConfig.key];
          bValue = (b as any)[sortConfig.key];
        }

        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortConfig.direction === "asc" ? 1 : -1;
        if (bValue === undefined) return sortConfig.direction === "asc" ? -1 : 1;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return sortConfig.direction === "asc"
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }












    return filteredTasks;
  }, [localTasks, query, sortConfig, statusFilter, assigneeFilter, dateFilter, notesMap, sourceFilter]);

  const totalPages = Math.ceil(filtered.length / tasksPerPage);
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage, tasksPerPage]);

  const handleTasksPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTasksPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const exportCSV = () => {
    const exportData = filtered.map((task, index) => ({
      "S. No.": index + 1,
      "Title": task.title,
      "Status": task.status,
      "Shop Name": task.customFields?.shopName,
      "Phone": task.customFields?.phone,
      "Email": task.customFields?.email,
      "Assignee": task.assignees?.map(a => a?.name || a?.email).filter(Boolean).join(", ") || task.assignee?.name,
      "Assigner": task.assignerName,
      "Created At": task.createdAt ? format(new Date(task.createdAt), "dd MMM yyyy, HH:mm") : "",
      "Location": task.customFields?.location,
      "Amount": Number(task.customFields?.amount) || 0,
      "Amount Received": Number(task.customFields?.amountReceived) || 0,
      "Pending Amount": (Number(task.customFields?.amount) || 0) - (Number(task.customFields?.amountReceived) || 0),
      "AFE": Number(task.customFields?.afe) || 0,
      "Notes": (notesMap[task.id] || []).map((note) => note.content).join(" | "),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tasks");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `Tasks_Report_${Date.now()}.xlsx`);
    toast.success("CSV exported successfully!");
  };

  const handleInputChange = (
    taskId: string,
    field: "amount" | "amountReceived" | "afe",
    value: number
  ) => {
    const key = `${taskId}-${field}`;
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleBlur = async (taskId: string, field: "amount" | "amountReceived" | "afe") => {
    const key = `${taskId}-${field}`;
    const value = editedValues[key];

    const originalTask = localTasks.find(t => t.id === taskId);
    const originalValue = Number(originalTask?.customFields?.[field]) || 0;

    if (typeof value === "number" && !isNaN(value) && value !== originalValue) {
      setIsSaving(key);
      try {
        const res = await fetch("/api/tasks/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId, field, value }),
        });

        if (!res.ok) {
          const contentType = res.headers.get("content-type");
          const errorText = await res.text();

          let errorMessage = "Failed to update task.";
          if (contentType && contentType.includes("application/json")) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error || errorMessage;
            } catch (jsonErr) {
              console.error("Failed to parse error JSON:", jsonErr, errorText);
              errorMessage = "Server returned malformed error. Contact support.";
            }
          } else {
            errorMessage = `Server error: ${res.status} ${res.statusText}. Please try again.`;
            console.error("Server returned non-JSON error:", errorText);
          }

          toast.error(errorMessage);
          setEditedValues((prev) => ({ ...prev, [key]: originalValue }));
        } else {
          toast.success("Task updated successfully!");
          await refetchTasks();
        }
      } catch (err: any) {
        console.error("❌ Network or unexpected error:", err);
        toast.error(err.message || "An unexpected error occurred while updating the task.");
        setEditedValues((prev) => ({ ...prev, [key]: originalValue }));
      } finally {
        setIsSaving(null);
      }
    } else {
      setEditedValues((prev) => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }
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
    return sortConfig.direction === "asc" ? <FaArrowUp className="ml-1 text-xs" /> : <FaArrowDown className="ml-1 text-xs" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 mt-6 overflow-hidden">
      {/* Header with Search, Filters, Export, and Edit Mode Toggle */}
      <TaskTableHeader
        query={query}
        setQuery={setQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sourceFilter={sourceFilter}
        setSourceFilter={setSourceFilter}
        assigneeFilter={assigneeFilter}
        setAssigneeFilter={setAssigneeFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        tasksPerPage={tasksPerPage}
        handleTasksPerPageChange={handleTasksPerPageChange}
        editMode={editMode && (role === "admin" || role === "master")}
        setEditMode={setEditMode}
        exportCSV={exportCSV}
        localTasks={localTasks}
      />

      {/* Column Visibility Controls (Horizontal) - This section is now correctly placed outside the table */}
      <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <span className="text-gray-700 text-sm font-medium mr-2">Show/Hide Columns:</span>
        <div className="flex flex-wrap gap-2"> {/* This inner div ensures the buttons themselves wrap horizontally */}
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
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed border-collapse border border-gray-200 text-sm shadow-md rounded-md overflow-hidden">
          {/* Table Headers (thead) - rendered by TaskTableColumns */}
          <TaskTableColumns
            columns={columns}
            requestSort={requestSort}
            getSortIcon={getSortIcon}
          />






















          {/* Table Body */}
          {paginatedTasks.length === 0 ? (
            <tbody className="bg-white">
              <tr>
                <td colSpan={columns.length} className="text-center px-4 py-8 text-gray-500 text-base">
                  <div className="flex flex-col items-center justify-center h-full">
                    <svg
                      className="w-12 h-12 text-gray-400 mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
                    <p className="text-lg font-medium">No tasks found</p>
                    <p className="text-sm text-gray-500">
                      Adjust your filters or add new tasks to see them here.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          ) : (
            // <TaskTableBody
            //   tasks={paginatedTasks}
            //   columns={columns}
            //   editMode={editMode}
            //   editedValues={editedValues}
            //   handleInputChange={handleInputChange}
            //   handleBlur={handleBlur}
            //   isSaving={isSaving}
            //   selectedTaskIdForNotes={selectedTaskIdForNotes}
            //   setIsNoteModalOpen={setIsNoteModalOpen}
            //   notesMap={notesMap}
            // />
            <TaskTableBody
  tasks={paginatedTasks}
  columns={columns}
  editMode={editMode && (role === "admin" || role === "master")} // Only admins can edit
  editedValues={editedValues}
  handleInputChange={handleInputChange}
  handleBlur={handleBlur}
  isSaving={isSaving  && (role === "admin" || role === "master")}
  selectedTaskIdForNotes={selectedTaskIdForNotes}
  setIsNoteModalOpen={setIsNoteModalOpen}
  notesMap={notesMap}
  currentUserRole={role} // Pass role to body for any role-specific rendering
/>

          )}
        </table>
      </div>

      {/* Pagination Controls */}
      <TaskTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        filteredCount={filtered.length}
        paginatedCount={paginatedTasks.length}
        handlePageChange={handlePageChange}
      />

      {selectedTaskIdForNotes && (
        <NotesModal
          isOpen={isNoteModalOpen}
          onClose={() => {
            setIsNoteModalOpen(false);
            setSelectedTaskIdForNotes(null);
          }}
          taskId={selectedTaskIdForNotes}
          initialNotes={notesMap[selectedTaskIdForNotes] || []}
          onNotesUpdated={refetchTasks}
        />
      )}
    </div>
  );
}
