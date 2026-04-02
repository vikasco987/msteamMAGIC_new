// // components/TaskTableView.tsx
// "use client";

// import React, { useState, useEffect, useMemo } from "react";
// import { Task } from "../../types/task";
// import { Note } from "../../../types/note";
// import { useUser, UserResource } from "@clerk/nextjs";
// import { format, isToday, subDays, startOfMonth } from "date-fns";
// import * as Dialog from "@radix-ui/react-dialog"; // CORRECTED: Namespace import for Radix UI Dialog
// import {
//   FaDownload,
//   FaSearch,
//   FaEye,
//   FaEyeSlash,
//   FaMapMarkerAlt,
//   FaEdit,
//   FaTimesCircle,
//   FaSpinner,
//   FaRupeeSign,
//   FaCheckCircle,
//   FaReceipt,
//   FaArrowUp,
//   FaArrowDown,
//   FaTimes,
// } from "react-icons/fa";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
// import toast from "react-hot-toast";
// import NotesModal from "../components/NotesModal";
// import Image from "next/image";

// // Define AttachmentType within this file or import if it's in a shared types file
// type AttachmentType = {
//   url: string;
//   name?: string;
// };

// // PaymentProofsModal.tsx (This component is embedded directly within TaskTableView)
// function PaymentProofsModal({
//   urls,
//   onClose,
// }: {
//   urls: string[];
//   onClose: () => void;
// }) {
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);

//   return (
//     <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
//       <div className="bg-white max-w-3xl w-full p-4 rounded shadow-lg relative">
//         <button
//           onClick={() => {
//             if (previewUrl) {
//               setPreviewUrl(null);
//             } else {
//               onClose();
//             }
//           }}
//           className="absolute top-3 right-3 text-gray-600 hover:text-red-500"
//           title={previewUrl ? "Back to list" : "Close modal"}
//         >
//           <FaTimes size={20} />
//         </button>

//         <h2 className="text-xl font-bold mb-4">Payment Proofs</h2>

//         {previewUrl ? (
//           <div className="overflow-auto max-h-[80vh]">
//             {previewUrl.toLowerCase().endsWith(".pdf") ? (
//               <iframe
//                 src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`}
//                 className="w-full h-[70vh] border rounded"
//                 title="PDF Preview"
//               />
//             ) : (
//               <Image
//                 src={previewUrl}
//                 alt="Proof Preview"
//                 width={800}
//                 height={600}
//                 className="max-w-full max-h-[70vh] object-contain mx-auto"
//                 unoptimized
//               />
//             )}
//           </div>
//         ) : (
//           <div className="space-y-4 max-h-[70vh] overflow-y-auto px-2">
//             {urls.filter(url => typeof url === "string").map((url, i) => {
//               const label = url.toLowerCase().endsWith(".pdf") ? "📄 PDF Proof" : "🖼️ Image Proof";
//               return (
//                 <div key={i} className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded shadow-sm">
//                   <span className="text-sm text-gray-700">{label}</span>
//                   <div className="flex gap-3">
//                     <button
//                       onClick={() => setPreviewUrl(url)}
//                       className="text-purple-700 underline hover:text-purple-900 text-sm"
//                     >
//                       👁️ Preview
//                     </button>
//                     <a
//                       href={url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-green-600 underline hover:text-green-800 text-sm"
//                     >
//                       ⬇️ Download
//                     </a>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// interface Props {
//   tasks: Task[];
//   user: UserResource;
//   onTasksUpdate?: (updatedTasks: Task[]) => void;
// }

// const ALL_COLUMNS = [
//   "rowNumber",
//   "title",
//   "status",
//   "shopName",
//   "email",
//   "phone",
//   "assignerName",
//   "assignee",
//   "createdAt",
//   "location",
//   "notes",
//   "amount",
//   "amountReceived",
//   "pendingAmount",
//   "attachments",
//   "paymentProofs",
// ];

// export default function TaskTableView({ tasks, user, onTasksUpdate }: Props) {
//   const [editMode, setEditMode] = useState(false);
//   const [editedValues, setEditedValues] = useState<{ [key: string]: number }>({});
//   const [localTasks, setLocalTasks] = useState<Task[]>(tasks || []);
//   const [isSaving, setIsSaving] = useState<string | null>(null);

//   const [query, setQuery] = useState("");
//   const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
//   const [columns, setColumns] = useState<string[]>(ALL_COLUMNS);
//   const [statusFilter, setStatusFilter] = useState<string | null>(null);
//   const [sourceFilter, setSourceFilter] = useState<string | null>(null);
//   const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
//   const [dateFilter, setDateFilter] = useState<string | null>(null);

//   const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
//   const [selectedTaskIdForNotes, setSelectedTaskIdForNotes] = useState<string | null>(null);
//   const [notesMap, setNotesMap] = useState<{ [taskId: string]: Note[] }>({});

//   const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
//   const [selectedAttachments, setSelectedAttachments] = useState<AttachmentType[]>([]); // This state expects AttachmentType[]

//   const [showPaymentProofsModal, setShowPaymentProofsModal] = useState(false);
//   const [selectedPaymentProofs, setSelectedPaymentProofs] = useState<string[]>([]);

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
//       filteredTasks = filteredTasks.filter((t) => t.assignees?.some(a => (a.name || a.email) === assigneeFilter));
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
//           aValue = (Number(a.amount) || 0) - (Number(a.received) || 0);
//           bValue = (Number(b.amount) || 0) - (Number(b.received) || 0);
//         } else if (sortConfig.key === 'amount') {
//             aValue = Number(a.amount) || 0;
//             bValue = Number(b.amount) || 0;
//         } else if (sortConfig.key === 'amountReceived') {
//             aValue = Number(a.received) || 0;
//             bValue = Number(b.received) || 0;
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
//       "Amount": Number(task.amount) || 0,
//       "Amount Received": Number(task.received) || 0,
//       "Pending Amount": (Number(task.amount) || 0) - (Number(task.received) || 0),
//       "Notes": (notesMap[task.id] || []).map((note) => note.content).join(" | "),
//       "Attachments": task.attachments?.map(a => typeof a === 'string' ? a : a.url).join(" | ") || "", // Normalized for export
//       "Payment Proofs": task.paymentProofs?.map(p => typeof p === 'string' ? p : p.url).filter(Boolean).join(" | ") || "",
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
//     field: "amount" | "received",
//     value: number
//   ) => {
//     const key = `${taskId}-${field}`;
//     setEditedValues((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleBlur = async (taskId: string, field: "amount" | "received") => {
//     const key = `${taskId}-${field}`;
//     const value = editedValues[key];

//     const originalTask = localTasks.find(t => t.id === taskId);
//     const originalValue = field === 'amount' ? (Number(originalTask?.amount) || 0) : (Number(originalTask?.received) || 0);

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
//           setEditedValues((prev) => {
//             const newState = { ...prev };
//             delete newState[key];
//             return newState;
//           });
//         }
//       } catch (err: unknown) {
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

//   const formatCurrency = (amount: number | string | undefined): string => {
//     if (typeof amount === 'string') {
//         const num = parseFloat(amount);
//         if (!isNaN(num)) return `₹${num.toLocaleString("en-IN")}`;
//     } else if (typeof amount === 'number') {
//         return `₹${amount.toLocaleString("en-IN")}`;
//     }
//     return "—";
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

//   const pageNumbers = useMemo(() => {
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
//     <div className="bg-white rounded-xl shadow-lg border border-gray-100 mt-6 overflow-hidden">
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-gray-100 bg-gray-50">
//         <div className="flex flex-wrap gap-3 items-center">
//           <div className="relative w-full sm:w-auto">
//             <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
//             <input
//               type="text"
//               placeholder="Search by shop, email, phone..."
//               className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm transition duration-200 ease-in-out w-full"
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//             />
//           </div>
//           <select
//             className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8 bg-white transition duration-200 ease-in-out"
//             value={statusFilter ?? ""}
//             onChange={(e) => setStatusFilter(e.target.value || null)}
//           >
//             <option value="">All Status</option>
//             <option value="todo">To Do</option>
//             <option value="done">Done</option>
//           </select>
//           <select
//             className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8 bg-white transition duration-200 ease-in-out"
//             value={sourceFilter ?? ""}
//             onChange={(e) => setSourceFilter(e.target.value || null)}
//           >
//             <option value="">All Sources</option>
//             <option value="zomato">Zomato</option>
//             <option value="swiggy">Swiggy</option>
//             <option value="license">License</option>
//           </select>
//           <select
//             className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8 bg-white transition duration-200 ease-in-out"
//             value={assigneeFilter ?? ""}
//             onChange={(e) => setAssigneeFilter(e.target.value || null)}
//           >
//             <option value="">All Assignees</option>
//             {[...new Set(localTasks.map((t) => t.assignees?.map(a => a.name || a.email)).flat().filter(Boolean))].map((name) => (
//               <option key={name} value={name}>
//                 {name}
//               </option>
//             ))}
//           </select>
//           <select
//             className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8 bg-white transition duration-200 ease-in-out"
//             value={dateFilter ?? ""}
//             onChange={(e) => setDateFilter(e.target.value || null)}
//           >
//             <option value="">All Dates</option>
//             <option value="today">Today</option>
//             <option value="yesterday">Yesterday</option>
//             <option value="last_7_days">Last 7 Days</option>
//             <option value="this_month">This Month</option>
//             <option value="last_month">Last Month</option>
//             <option value="this_year">This Year</option>
//           </select>

//           <div className="flex items-center gap-2">
//             <label htmlFor="tasksPerPageSelect" className="text-sm text-gray-600">Tasks per page:</label>
//             <select
//               id="tasksPerPageSelect"
//               value={tasksPerPage}
//               onChange={handleTasksPerPageChange}
//               className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8 bg-white transition duration-200 ease-in-out"
//             >
//               <option value={5}>5</option>
//               <option value={10}>10</option>
//               <option value={15}>15</option>
//               <option value={20}>20</option>
//               <option value={50}>50</option>
//               <option value={100}>100</option>
//             </select>
//           </div>

//         </div>

//         <div className="flex flex-wrap gap-2">
//           <button
//             className="inline-flex items-center bg-green-600 text-white font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ease-in-out"
//             onClick={exportCSV}
//           >
//             <FaDownload className="inline mr-2 -ml-1" /> Export CSV
//           </button>
//           <button
//             className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out
//             ${editMode ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500" : "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500"}`}
//             onClick={() => setEditMode((prev) => !prev)}
//           >
//             {editMode ? <><FaTimesCircle className="mr-2" /> Exit Edit Mode</> : <><FaEdit className="mr-2" /> Enter Edit Mode</>}
//           </button>
//         </div>
//       </div>

//       <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
//         <span className="text-gray-700 text-sm font-medium mr-2">Show/Hide Columns:</span>
//         {ALL_COLUMNS.map((col) => (
//           <button
//             key={col}
//             onClick={() =>
//               setColumns((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]))
//             }
//             className={`inline-flex items-center px-3 py-1.5 border rounded-full text-xs font-medium transition-all duration-200 ease-in-out
//               ${
//                 columns.includes(col)
//                   ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                   : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
//               }`}
//           >
//             {columns.includes(col) ? <FaEye className="mr-1" /> : <FaEyeSlash className="mr-1" />}{" "}
//             {col.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
//           </button>
//         ))}
//       </div>

//       <div className="overflow-x-auto">
//         <table className="min-w-full table-fixed border-collapse border border-gray-200 text-sm shadow-md rounded-md overflow-hidden">
//           <thead className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0 z-10">
//             <tr>
//               {columns.includes("rowNumber") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-12">
//                   S. No.
//                 </th>
//               )}
//               {columns.includes("title") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
//                   Title
//                 </th>
//               )}
//               {columns.includes("createdAt") && (
//                 <th
//                   className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-36 cursor-pointer"
//                   onClick={() => requestSort("createdAt")}
//                 >
//                   <div className="flex items-center">
//                     📅 Created {getSortIcon("createdAt")}
//                   </div>
//                 </th>
//               )}
//               {columns.includes("assignerName") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-48">
//                   Assigned By → To
//                 </th>
//               )}
//               {columns.includes("shopName") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-40">
//                   🏪 Shop Name
//                 </th>
//               )}
//               {columns.includes("location") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
//                   📍 Location
//                 </th>
//               )}
//               {columns.includes("phone") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
//                   📞 Phone
//                 </th>
//               )}
//               {columns.includes("email") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-40">
//                   📧 Email
//                 </th>
//               )}
//               {columns.includes("status") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
//                   Status
//                 </th>
//               )}
//               {columns.includes("notes") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
//                   📝 Notes
//                 </th>
//               )}
//               {columns.includes("amount") && (
//                 <th
//                   className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
//                   onClick={() => requestSort("amount")}
//                 >
//                   <div className="flex items-center justify-end">
//                     <FaRupeeSign className="mr-1" /> Amount {getSortIcon("amount")}
//                   </div>
//                 </th>
//               )}
//               {columns.includes("amountReceived") && (
//                 <th
//                   className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
//                   onClick={() => requestSort("amountReceived")}
//                 >
//                   <div className="flex items-center justify-end">
//                     <FaCheckCircle className="mr-1 text-emerald-600" /> Received {getSortIcon("amountReceived")}
//                   </div>
//                 </th>
//               )}
//               {columns.includes("pendingAmount") && (
//                 <th
//                   className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
//                   onClick={() => requestSort("pendingAmount")}
//                 >
//                   <div className="flex items-center justify-end">
//                     <FaReceipt className="mr-1 text-rose-600" /> Pending {getSortIcon("pendingAmount")}
//                   </div>
//                 </th>
//               )}
//               {columns.includes("attachments") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
//                   📎 Attachments
//                 </th>
//               )}
//               {columns.includes("paymentProofs") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-32">
//                   🧾 Payment Proofs
//                 </th>
//               )}
//             </tr>
//           </thead>

//           <tbody className="bg-white">
//             {paginatedTasks.length === 0 ? (
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
//             ) : (
//               paginatedTasks.map((task, index) => {
//                 const amount = Number(task.amount) || 0;
//                 const received = Number(task.received) || 0;
//                 const pending = amount - received;
//                 const rowNumber = (currentPage - 1) * tasksPerPage + index + 1;
//                 const hasNotes = (notesMap[task.id]?.length || 0) > 0;

//                 return (
//                   <tr
//                     key={task.id}
//                     className="h-12 hover:bg-blue-50 transition-all duration-150 ease-in-out"
//                   >
//                     {columns.includes("rowNumber") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center text-gray-700 font-medium">
//                         {rowNumber}
//                       </td>
//                     )}
//                     {columns.includes("title") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left font-medium text-gray-900">
//                         {task.title}
//                       </td>
//                     )}
//                     {columns.includes("createdAt") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-600">
//                         {task.createdAt ? format(new Date(task.createdAt), "dd MMM, HH:mm") : "—"}
//                       </td>
//                     )}
//                     {columns.includes("assignerName") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
//                         <span className="font-semibold text-gray-800">{task.assignerName || "—"}</span>{" "}
//                         <span className="text-blue-500">→</span>{" "}
//                         <span className="text-blue-600 font-medium">
//                           {Array.isArray(task.assignees) && task.assignees.length > 0
//                             ? task.assignees.map((a) => a?.name || a?.email || "—").filter(Boolean).join(", ")
//                             : task.assigneeEmail || "—"}
//                         </span>
//                       </td>
//                     )}
//                     {columns.includes("shopName") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-700">
//                         {task.customFields?.shopName || "—"}
//                       </td>
//                     )}
//                     {columns.includes("location") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                         {task.customFields?.location ? (
//                           <a
//                             href={String(task.customFields?.location || "")}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
//                           >
//                             <FaMapMarkerAlt className="text-blue-500" /> View
//                           </a>
//                         ) : (
//                           <span className="text-gray-400">—</span>
//                         )}
//                       </td>
//                     )}
//                     {columns.includes("phone") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
//                         {task.customFields?.phone || "—"}
//                       </td>
//                     )}
//                     {columns.includes("email") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
//                         {task.customFields?.email || "—"}
//                       </td>
//                     )}
//                     {columns.includes("status") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                         <span
//                           className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                             task.status === "done" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
//                           }`}
//                         >
//                           {task.status || "Pending"}
//                         </span>
//                       </td>
//                     )}
//                     {columns.includes("notes") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                         <button
//                           onClick={() => {
//                             setSelectedTaskIdForNotes(task.id);
//                             setIsNoteModalOpen(true);
//                           }}
//                           className={`flex items-center gap-1 transition-colors duration-200 ${
//                             hasNotes
//                               ? "text-blue-600 hover:text-blue-800"
//                               : "text-gray-400 hover:text-gray-600"
//                           }`}
//                           title={hasNotes ? "View/Edit Notes" : "Add Note"}
//                         >
//                           📝
//                           {hasNotes && (
//                             <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
//                               {notesMap[task.id].length}
//                             </span>
//                           )}
//                         </button>
//                       </td>
//                     )}
//                     {columns.includes("amount") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right text-gray-900">
//                         {editMode ? (
//                           <div className="relative flex items-center justify-end">
//                             <input
//                               type="number"
//                               className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right text-sm"
//                               value={editedValues[`${task.id}-amount`] ?? Number(task.amount)}
//                               onChange={(e) => handleInputChange(task.id, "amount", Number(e.target.value))}
//                               onBlur={() => handleBlur(task.id, "amount")}
//                             />
//                             {isSaving === `${task.id}-amount` && (
//                               <FaSpinner className="absolute right-2 text-blue-500 animate-spin" />
//                             )}
//                           </div>
//                         ) : (
//                           formatCurrency(amount)
//                         )}
//                       </td>
//                     )}
//                     {columns.includes("amountReceived") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right text-gray-900">
//                         {editMode ? (
//                           <div className="relative flex items-center justify-end">
//                             <input
//                               type="number"
//                               className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right text-sm"
//                               value={editedValues[`${task.id}-received`] ?? Number(task.received)}
//                               onChange={(e) => handleInputChange(task.id, "received", Number(e.target.value))}
//                               onBlur={() => handleBlur(task.id, "received")}
//                             />
//                             {isSaving === `${task.id}-received` && (
//                               <FaSpinner className="absolute right-2 text-blue-500 animate-spin" />
//                             )}
//                           </div>
//                         ) : (
//                           formatCurrency(received)
//                         )}
//                       </td>
//                     )}
//                     {columns.includes("pendingAmount") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right text-gray-900 font-bold">
//                         {formatCurrency(pending)}
//                       </td>
//                     )}
//                     {columns.includes("attachments") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                         {task.attachments && task.attachments.length > 0 ? (
//                           <button
//                             onClick={() => {
//                               // Normalize attachments to ensure { url: string, name?: string } format
//                               const normalizedAttachments: AttachmentType[] = (task.attachments || []).map((item) =>
//                                 typeof item === "string" ? { url: item } : item
//                               );
//                               setSelectedAttachments(normalizedAttachments);
//                               setAttachmentModalOpen(true);
//                             }}
//                             className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
//                           >
//                             📎 View ({task.attachments.length})
//                           </button>
//                         ) : (
//                           <span className="text-gray-400">—</span>
//                         )}
//                       </td>
//                     )}
//                     {columns.includes("paymentProofs") && (
//                       <td className="border border-gray-200 px-3 py-2 text-center">
//                         {Array.isArray(task.paymentProofs) && task.paymentProofs.length > 0 ? (
//                           <button
//                             onClick={() => {
//                               const proofUrls = task.paymentProofs
//                                 .map(p => typeof p === 'string' ? p : p.url)
//                                 .filter((url): url is string => typeof url === 'string');
//                               setSelectedPaymentProofs(proofUrls);
//                               setShowPaymentProofsModal(true);
//                             }}
//                             title="View Payment Proofs"
//                             className="text-blue-600 hover:text-blue-800 underline"
//                           >
//                             🧾 {task.paymentProofs.length}
//                           </button>
//                         ) : (
//                           <span className="text-gray-400">—</span>
//                         )}
//                       </td>
//                     )}
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>

//       {totalPages > 1 && (
//         <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50">
//           <button
//             onClick={() => handlePageChange(currentPage - 1)}
//             disabled={currentPage === 1}
//             className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             Previous
//           </button>
//           <div className="flex gap-1">
//             {pageNumbers[0] > 1 && (
//                 <>
//                     <button
//                         onClick={() => handlePageChange(1)}
//                         className={`px-3 py-1 text-sm rounded-lg ${
//                             currentPage === 1 ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
//                         }`}
//                     >
//                         1
//                     </button>
//                     {pageNumbers[0] > 2 && <span className="px-3 py-1 text-sm text-gray-500">...</span>}
//                 </>
//             )}
//             {pageNumbers.map((page) => (
//               <button
//                 key={page}
//                 onClick={() => handlePageChange(page)}
//                 className={`px-3 py-1 text-sm rounded-lg ${
//                   currentPage === page ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
//                 }`}
//               >
//                 {page}
//               </button>
//             ))}
//             {pageNumbers[pageNumbers.length - 1] < totalPages && (
//                 <>
//                     {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="px-3 py-1 text-sm text-gray-500">...</span>}
//                     <button
//                         onClick={() => handlePageChange(totalPages)}
//                         className={`px-3 py-1 text-sm rounded-lg ${
//                             currentPage === totalPages ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
//                         }`}
//                     >
//                         {totalPages}
//                     </button>
//                 </>
//             )}
//           </div>
//           <button
//             onClick={() => handlePageChange(currentPage + 1)}
//             disabled={currentPage === totalPages}
//             className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             Next
//           </button>
//         </div>
//       )}

//       {selectedTaskIdForNotes && (
//         <NotesModal
//           isOpen={isNoteModalOpen}
//           onClose={() => setIsNoteModalOpen(false)}
//           taskId={selectedTaskIdForNotes}
//           initialNotes={notesMap[selectedTaskIdForNotes] || []}
//           onSave={(updatedNotes) => {
//             setNotesMap((prev) => ({
//               ...prev,
//               [selectedTaskIdForNotes]: updatedNotes,
//             }));
//           }}
//         />
//       )}

//       {/* General Attachment Modal (using Radix Dialog) */}
//       {attachmentModalOpen && (
//         <Dialog.Root open={attachmentModalOpen} onOpenChange={setAttachmentModalOpen}>
//           <Dialog.Portal>
//             <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[100]" />
//             <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl z-[101] max-w-2xl w-full max-h-[80vh] overflow-y-auto">
//               <Dialog.Title className="text-lg font-semibold mb-4">Attachments</Dialog.Title>
//               <div className="grid gap-4 grid-cols-2">
//                 {selectedAttachments.map((file, idx) => {
//                   const fileUrl = file?.url || "";
//                   const isPdf = fileUrl.toLowerCase().endsWith(".pdf");

//                   return (
//                     <a
//                       key={idx}
//                       href={fileUrl}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="block border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition"
//                     >
//                       {isPdf ? (
//                         <div className="flex items-center gap-2">
//                           📄 <span className="text-sm truncate">{file.name || `Attachment ${idx + 1}`}</span>
//                         </div>
//                       ) : (
//                         <img
//                           src={fileUrl}
//                           alt={file.name || `Attachment ${idx + 1}`}
//                           className="w-full h-32 object-contain rounded"
//                         />
//                       )}
//                     </a>
//                   );
//                 })}
//               </div>
//               <div className="mt-4 text-right">
//                 <button
//                   onClick={() => setAttachmentModalOpen(false)}
//                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
//                 >
//                   Close
//                 </button>
//               </div>
//             </Dialog.Content>
//           </Dialog.Portal>
//         </Dialog.Root>
//       )}

//       {/* PaymentProofsModal (custom) */}
//       {showPaymentProofsModal && selectedPaymentProofs.length > 0 && (
//         <PaymentProofsModal
//           urls={selectedPaymentProofs}
//           onClose={() => setShowPaymentProofsModal(false)}
//         />
//       )}
//     </div>
//   );
// }























































































































// // components/TaskTableView.tsx
// "use client";

// import React, { useState, useEffect, useMemo } from "react";
// import { Task } from "../../types/task";
// import { Note } from "../../../types/note";
// import { useUser, UserResource } from "@clerk/nextjs";
// import { format, isToday, subDays, startOfMonth } from "date-fns";
// import * as Dialog from "@radix-ui/react-dialog"; // CORRECTED: Namespace import for Radix UI Dialog
// import {
//   FaDownload,
//   FaSearch,
//   FaEye,
//   FaEyeSlash,
//   FaMapMarkerAlt,
//   FaEdit,
//   FaTimesCircle,
//   FaSpinner,
//   FaRupeeSign,
//   FaCheckCircle,
//   FaReceipt,
//   FaArrowUp,
//   FaArrowDown,
//   FaTimes,
// } from "react-icons/fa";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
// import toast from "react-hot-toast";
// import NotesModal from "../components/NotesModal";
// import Image from "next/image";

// // Define AttachmentType within this file or import if it's in a shared types file
// type AttachmentType = {
//   url: string;
//   name?: string;
// };

// // PaymentProofsModal.tsx (This component is embedded directly within TaskTableView)
// function PaymentProofsModal({
//   urls,
//   onClose,
// }: {
//   urls: string[];
//   onClose: () => void;
// }) {
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);

//   return (
//     <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
//       <div className="bg-white max-w-3xl w-full p-4 rounded shadow-lg relative">
//         <button
//           onClick={() => {
//             if (previewUrl) {
//               setPreviewUrl(null);
//             } else {
//               onClose();
//             }
//           }}
//           className="absolute top-3 right-3 text-gray-600 hover:text-red-500"
//           title={previewUrl ? "Back to list" : "Close modal"}
//         >
//           <FaTimes size={20} />
//         </button>

//         <h2 className="text-xl font-bold mb-4">Payment Proofs</h2>

//         {previewUrl ? (
//           <div className="overflow-auto max-h-[80vh]">
//             {previewUrl.toLowerCase().endsWith(".pdf") ? (
//               <iframe
//                 src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`}
//                 className="w-full h-[70vh] border rounded"
//                 title="PDF Preview"
//               />
//             ) : (
//               <Image
//                 src={previewUrl}
//                 alt="Proof Preview"
//                 width={800}
//                 height={600}
//                 className="max-w-full max-h-[70vh] object-contain mx-auto"
//                 unoptimized
//               />
//             )}
//           </div>
//         ) : (
//           <div className="space-y-4 max-h-[70vh] overflow-y-auto px-2">
//             {urls.filter(url => typeof url === "string").map((url, i) => {
//               const label = url.toLowerCase().endsWith(".pdf") ? "📄 PDF Proof" : "🖼️ Image Proof";
//               return (
//                 <div key={i} className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded shadow-sm">
//                   <span className="text-sm text-gray-700">{label}</span>
//                   <div className="flex gap-3">
//                     <button
//                       onClick={() => setPreviewUrl(url)}
//                       className="text-purple-700 underline hover:text-purple-900 text-sm"
//                     >
//                       👁️ Preview
//                     </button>
//                     <a
//                       href={url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-green-600 underline hover:text-green-800 text-sm"
//                     >
//                       ⬇️ Download
//                     </a>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// interface Props {
//   tasks: Task[];
//   user: UserResource;
//   onTasksUpdate?: (updatedTasks: Task[]) => void;
// }

// const ALL_COLUMNS = [
//   "rowNumber",
//   "title",
//   "status",
//   "shopName",
//   "email",
//   "phone",
//   "assignerName",
//   "assignee",
//   "createdAt",
//   "location",
//   "notes",
//   "amount",
//   "amountReceived",
//   "pendingAmount",
//   "attachments",
//   "paymentProofs",
// ];

// export default function TaskTableView({ tasks, user, onTasksUpdate }: Props) {
//   const [editMode, setEditMode] = useState(false);
//   const [editedValues, setEditedValues] = useState<{ [key: string]: number }>({});
//   const [localTasks, setLocalTasks] = useState<Task[]>(tasks || []);
//   const [isSaving, setIsSaving] = useState<string | null>(null);

//   const [query, setQuery] = useState("");
//   const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
//   const [columns, setColumns] = useState<string[]>(ALL_COLUMNS);
//   const [statusFilter, setStatusFilter] = useState<string | null>(null);
//   const [sourceFilter, setSourceFilter] = useState<string | null>(null);
//   const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
//   const [dateFilter, setDateFilter] = useState<string | null>(null);

//   const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
//   const [selectedTaskIdForNotes, setSelectedTaskIdForNotes] = useState<string | null>(null);
//   const [notesMap, setNotesMap] = useState<{ [taskId: string]: Note[] }>({});

//   const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
//   const [selectedAttachments, setSelectedAttachments] = useState<AttachmentType[]>([]); // This state expects AttachmentType[]

//   const [showPaymentProofsModal, setShowPaymentProofsModal] = useState(false);
//   const [selectedPaymentProofs, setSelectedPaymentProofs] = useState<string[]>([]);

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
//       filteredTasks = filteredTasks.filter((t) => t.assignees?.some(a => (a.name || a.email) === assigneeFilter));
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
//           aValue = (Number(a.amount) || 0) - (Number(a.received) || 0);
//           bValue = (Number(b.amount) || 0) - (Number(b.received) || 0);
//         } else if (sortConfig.key === 'amount') {
//             aValue = Number(a.amount) || 0;
//             bValue = Number(b.amount) || 0;
//         } else if (sortConfig.key === 'amountReceived') {
//             aValue = Number(a.received) || 0;
//             bValue = Number(b.received) || 0;
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
//       "Amount": Number(task.amount) || 0,
//       "Amount Received": Number(task.received) || 0,
//       "Pending Amount": (Number(task.amount) || 0) - (Number(task.received) || 0),
//       "Notes": (notesMap[task.id] || []).map((note) => note.content).join(" | "),
//       "Attachments": task.attachments?.map(a => typeof a === 'string' ? a : a.url).join(" | ") || "", // Normalized for export
//       "Payment Proofs": task.paymentProofs?.map(p => typeof p === 'string' ? p : p.url).filter(Boolean).join(" | ") || "",
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
//     field: "amount" | "received",
//     value: number
//   ) => {
//     const key = `${taskId}-${field}`;
//     setEditedValues((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleBlur = async (taskId: string, field: "amount" | "received") => {
//     const key = `${taskId}-${field}`;
//     const value = editedValues[key];

//     const originalTask = localTasks.find(t => t.id === taskId);
//     const originalValue = field === 'amount' ? (Number(originalTask?.amount) || 0) : (Number(originalTask?.received) || 0);

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
//           setEditedValues((prev) => {
//             const newState = { ...prev };
//             delete newState[key];
//             return newState;
//           });
//         }
//       } catch (err: unknown) {
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

//   const formatCurrency = (amount: number | string | undefined): string => {
//     if (typeof amount === 'string') {
//         const num = parseFloat(amount);
//         if (!isNaN(num)) return `₹${num.toLocaleString("en-IN")}`;
//     } else if (typeof amount === 'number') {
//         return `₹${amount.toLocaleString("en-IN")}`;
//     }
//     return "—";
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

//   const pageNumbers = useMemo(() => {
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
//     <div className="bg-white rounded-xl shadow-lg border border-gray-100 mt-6 overflow-hidden">
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-gray-100 bg-gray-50">
//         <div className="flex flex-wrap gap-3 items-center">
//           <div className="relative w-full sm:w-auto">
//             <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
//             <input
//               type="text"
//               placeholder="Search by shop, email, phone..."
//               className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm transition duration-200 ease-in-out w-full"
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//             />
//           </div>
//           <select
//             className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8 bg-white transition duration-200 ease-in-out"
//             value={statusFilter ?? ""}
//             onChange={(e) => setStatusFilter(e.target.value || null)}
//           >
//             <option value="">All Status</option>
//             <option value="todo">To Do</option>
//             <option value="done">Done</option>
//           </select>
//           <select
//             className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8 bg-white transition duration-200 ease-in-out"
//             value={sourceFilter ?? ""}
//             onChange={(e) => setSourceFilter(e.target.value || null)}
//           >
//             <option value="">All Sources</option>
//             <option value="zomato">Zomato</option>
//             <option value="swiggy">Swiggy</option>
//             <option value="license">License</option>
//           </select>
//           <select
//             className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8 bg-white transition duration-200 ease-in-out"
//             value={assigneeFilter ?? ""}
//             onChange={(e) => setAssigneeFilter(e.target.value || null)}
//           >
//             <option value="">All Assignees</option>
//             {[...new Set(localTasks.map((t) => t.assignees?.map(a => a.name || a.email)).flat().filter(Boolean))].map((name) => (
//               <option key={name} value={name}>
//                 {name}
//               </option>
//             ))}
//           </select>
//           <select
//             className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8 bg-white transition duration-200 ease-in-out"
//             value={dateFilter ?? ""}
//             onChange={(e) => setDateFilter(e.target.value || null)}
//           >
//             <option value="">All Dates</option>
//             <option value="today">Today</option>
//             <option value="yesterday">Yesterday</option>
//             <option value="last_7_days">Last 7 Days</option>
//             <option value="this_month">This Month</option>
//             <option value="last_month">Last Month</option>
//             <option value="this_year">This Year</option>
//           </select>

//           <div className="flex items-center gap-2">
//             <label htmlFor="tasksPerPageSelect" className="text-sm text-gray-600">Tasks per page:</label>
//             <select
//               id="tasksPerPageSelect"
//               value={tasksPerPage}
//               onChange={handleTasksPerPageChange}
//               className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8 bg-white transition duration-200 ease-in-out"
//             >
//               <option value={5}>5</option>
//               <option value={10}>10</option>
//               <option value={15}>15</option>
//               <option value={20}>20</option>
//               <option value={50}>50</option>
//               <option value={100}>100</option>
//             </select>
//           </div>

//         </div>

//         <div className="flex flex-wrap gap-2">
//           <button
//             className="inline-flex items-center bg-green-600 text-white font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ease-in-out"
//             onClick={exportCSV}
//           >
//             <FaDownload className="inline mr-2 -ml-1" /> Export CSV
//           </button>
//           <button
//             className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out
//             ${editMode ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500" : "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500"}`}
//             onClick={() => setEditMode((prev) => !prev)}
//           >
//             {editMode ? <><FaTimesCircle className="mr-2" /> Exit Edit Mode</> : <><FaEdit className="mr-2" /> Enter Edit Mode</>}
//           </button>
//         </div>
//       </div>

//       <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
//         <span className="text-gray-700 text-sm font-medium mr-2">Show/Hide Columns:</span>
//         {ALL_COLUMNS.map((col) => (
//           <button
//             key={col}
//             onClick={() =>
//               setColumns((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]))
//             }
//             className={`inline-flex items-center px-3 py-1.5 border rounded-full text-xs font-medium transition-all duration-200 ease-in-out
//               ${
//                 columns.includes(col)
//                   ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                   : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
//               }`}
//           >
//             {columns.includes(col) ? <FaEye className="mr-1" /> : <FaEyeSlash className="mr-1" />}{" "}
//             {col.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
//           </button>
//         ))}
//       </div>

//       <div className="overflow-x-auto">
//         <table className="min-w-full table-fixed border-collapse border border-gray-200 text-sm shadow-md rounded-md overflow-hidden">
//           <thead className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0 z-10">
//             <tr>
//               {columns.includes("rowNumber") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-12">
//                   S. No.
//                 </th>
//               )}
//               {columns.includes("title") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
//                   Title
//                 </th>
//               )}
//               {columns.includes("createdAt") && (
//                 <th
//                   className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-36 cursor-pointer"
//                   onClick={() => requestSort("createdAt")}
//                 >
//                   <div className="flex items-center">
//                     📅 Created {getSortIcon("createdAt")}
//                   </div>
//                 </th>
//               )}
//               {columns.includes("assignerName") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-48">
//                   Assigned By → To
//                 </th>
//               )}
//               {columns.includes("shopName") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-40">
//                   🏪 Shop Name
//                 </th>
//               )}
//               {columns.includes("location") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
//                   📍 Location
//                 </th>
//               )}
//               {columns.includes("phone") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
//                   📞 Phone
//                 </th>
//               )}
//               {columns.includes("email") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-40">
//                   📧 Email
//                 </th>
//               )}
//               {columns.includes("status") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
//                   Status
//                 </th>
//               )}
//               {columns.includes("notes") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
//                   📝 Notes
//                 </th>
//               )}
//               {columns.includes("amount") && (
//                 <th
//                   className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
//                   onClick={() => requestSort("amount")}
//                 >
//                   <div className="flex items-center justify-end">
//                     <FaRupeeSign className="mr-1" /> Amount {getSortIcon("amount")}
//                   </div>
//                 </th>
//               )}
//               {columns.includes("amountReceived") && (
//                 <th
//                   className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
//                   onClick={() => requestSort("amountReceived")}
//                 >
//                   <div className="flex items-center justify-end">
//                     <FaCheckCircle className="mr-1 text-emerald-600" /> Received {getSortIcon("amountReceived")}
//                   </div>
//                 </th>
//               )}
//               {columns.includes("pendingAmount") && (
//                 <th
//                   className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
//                   onClick={() => requestSort("pendingAmount")}
//                 >
//                   <div className="flex items-center justify-end">
//                     <FaReceipt className="mr-1 text-rose-600" /> Pending {getSortIcon("pendingAmount")}
//                   </div>
//                 </th>
//               )}
//               {columns.includes("attachments") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
//                   📎 Attachments
//                 </th>
//               )}
//               {columns.includes("paymentProofs") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-32">
//                   🧾 Payment Proofs
//                 </th>
//               )}
//             </tr>
//           </thead>

//           <tbody className="bg-white">
//             {paginatedTasks.length === 0 ? (
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
//             ) : (
//               paginatedTasks.map((task, index) => {
//                 const amount = Number(task.amount) || 0;
//                 const received = Number(task.received) || 0;
//                 const pending = amount - received;
//                 const rowNumber = (currentPage - 1) * tasksPerPage + index + 1;
//                 const hasNotes = (notesMap[task.id]?.length || 0) > 0;

//                 return (
//                   <tr
//                     key={task.id}
//                     className="h-12 hover:bg-blue-50 transition-all duration-150 ease-in-out"
//                   >
//                     {columns.includes("rowNumber") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center text-gray-700 font-medium">
//                         {rowNumber}
//                       </td>
//                     )}
//                     {columns.includes("title") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left font-medium text-gray-900">
//                         {task.title}
//                       </td>
//                     )}
//                     {columns.includes("createdAt") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-600">
//                         {task.createdAt ? format(new Date(task.createdAt), "dd MMM, HH:mm") : "—"}
//                       </td>
//                     )}
//                     {columns.includes("assignerName") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
//                         <span className="font-semibold text-gray-800">{task.assignerName || "—"}</span>{" "}
//                         <span className="text-blue-500">→</span>{" "}
//                         <span className="text-blue-600 font-medium">
//                           {Array.isArray(task.assignees) && task.assignees.length > 0
//                             ? task.assignees.map((a) => a?.name || a?.email || "—").filter(Boolean).join(", ")
//                             : task.assigneeEmail || "—"}
//                         </span>
//                       </td>
//                     )}
//                     {columns.includes("shopName") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-700">
//                         {task.customFields?.shopName || "—"}
//                       </td>
//                     )}
//                     {columns.includes("location") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                         {task.customFields?.location ? (
//                           <a
//                             href={String(task.customFields?.location || "")}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
//                           >
//                             <FaMapMarkerAlt className="text-blue-500" /> View
//                           </a>
//                         ) : (
//                           <span className="text-gray-400">—</span>
//                         )}
//                       </td>
//                     )}
//                     {columns.includes("phone") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
//                         {task.customFields?.phone || "—"}
//                       </td>
//                     )}
//                     {columns.includes("email") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
//                         {task.customFields?.email || "—"}
//                       </td>
//                     )}
//                     {columns.includes("status") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                         <span
//                           className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                             task.status === "done" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
//                           }`}
//                         >
//                           {task.status || "Pending"}
//                         </span>
//                       </td>
//                     )}
//                     {columns.includes("notes") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                         <button
//                           onClick={() => {
//                             setSelectedTaskIdForNotes(task.id);
//                             setIsNoteModalOpen(true);
//                           }}
//                           className={`flex items-center gap-1 transition-colors duration-200 ${
//                             hasNotes
//                               ? "text-blue-600 hover:text-blue-800"
//                               : "text-gray-400 hover:text-gray-600"
//                           }`}
//                           title={hasNotes ? "View/Edit Notes" : "Add Note"}
//                         >
//                           📝
//                           {hasNotes && (
//                             <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
//                               {notesMap[task.id].length}
//                             </span>
//                           )}
//                         </button>
//                       </td>
//                     )}
//                     {columns.includes("amount") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right text-gray-900">
//                         {editMode ? (
//                           <div className="relative flex items-center justify-end">
//                             <input
//                               type="number"
//                               className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right text-sm"
//                               value={editedValues[`${task.id}-amount`] ?? Number(task.amount)}
//                               onChange={(e) => handleInputChange(task.id, "amount", Number(e.target.value))}
//                               onBlur={() => handleBlur(task.id, "amount")}
//                             />
//                             {isSaving === `${task.id}-amount` && (
//                               <FaSpinner className="absolute right-2 text-blue-500 animate-spin" />
//                             )}
//                           </div>
//                         ) : (
//                           formatCurrency(amount)
//                         )}
//                       </td>
//                     )}
//                     {columns.includes("amountReceived") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right text-gray-900">
//                         {editMode ? (
//                           <div className="relative flex items-center justify-end">
//                             <input
//                               type="number"
//                               className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right text-sm"
//                               value={editedValues[`${task.id}-received`] ?? Number(task.received)}
//                               onChange={(e) => handleInputChange(task.id, "received", Number(e.target.value))}
//                               onBlur={() => handleBlur(task.id, "received")}
//                             />
//                             {isSaving === `${task.id}-received` && (
//                               <FaSpinner className="absolute right-2 text-blue-500 animate-spin" />
//                             )}
//                           </div>
//                         ) : (
//                           formatCurrency(received)
//                         )}
//                       </td>
//                     )}
//                     {columns.includes("pendingAmount") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right text-gray-900 font-bold">
//                         {formatCurrency(pending)}
//                       </td>
//                     )}
//                     {columns.includes("attachments") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                         {task.attachments && task.attachments.length > 0 ? (
//                           <button
//                             onClick={() => {
//                               // Normalize attachments to ensure { url: string, name?: string } format
//                               const normalizedAttachments: AttachmentType[] = (task.attachments || []).map((item) =>
//                                 typeof item === "string" ? { url: item } : item
//                               );
//                               setSelectedAttachments(normalizedAttachments);
//                               setAttachmentModalOpen(true);
//                             }}
//                             className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
//                           >
//                             📎 View ({task.attachments.length})
//                           </button>
//                         ) : (
//                           <span className="text-gray-400">—</span>
//                         )}
//                       </td>
//                     )}
//                     {columns.includes("paymentProofs") && (
//                       <td className="border border-gray-200 px-3 py-2 text-center">
//                         {Array.isArray(task.paymentProofs) && task.paymentProofs.length > 0 ? (
//                           <button
//                             onClick={() => {
//                               const proofUrls = task.paymentProofs
//                                 .map(p => typeof p === 'string' ? p : p.url)
//                                 .filter((url): url is string => typeof url === 'string');
//                               setSelectedPaymentProofs(proofUrls);
//                               setShowPaymentProofsModal(true);
//                             }}
//                             title="View Payment Proofs"
//                             className="text-blue-600 hover:text-blue-800 underline"
//                           >
//                             🧾 {task.paymentProofs.length}
//                           </button>
//                         ) : (
//                           <span className="text-gray-400">—</span>
//                         )}
//                       </td>
//                     )}
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>

//       {totalPages > 1 && (
//         <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50">
//           <button
//             onClick={() => handlePageChange(currentPage - 1)}
//             disabled={currentPage === 1}
//             className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             Previous
//           </button>
//           <div className="flex gap-1">
//             {pageNumbers[0] > 1 && (
//                 <>
//                     <button
//                         onClick={() => handlePageChange(1)}
//                         className={`px-3 py-1 text-sm rounded-lg ${
//                             currentPage === 1 ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
//                         }`}
//                     >
//                         1
//                     </button>
//                     {pageNumbers[0] > 2 && <span className="px-3 py-1 text-sm text-gray-500">...</span>}
//                 </>
//             )}
//             {pageNumbers.map((page) => (
//               <button
//                 key={page}
//                 onClick={() => handlePageChange(page)}
//                 className={`px-3 py-1 text-sm rounded-lg ${
//                   currentPage === page ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
//                 }`}
//               >
//                 {page}
//               </button>
//             ))}
//             {pageNumbers[pageNumbers.length - 1] < totalPages && (
//                 <>
//                     {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="px-3 py-1 text-sm text-gray-500">...</span>}
//                     <button
//                         onClick={() => handlePageChange(totalPages)}
//                         className={`px-3 py-1 text-sm rounded-lg ${
//                             currentPage === totalPages ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
//                         }`}
//                     >
//                         {totalPages}
//                     </button>
//                 </>
//             )}
//           </div>
//           <button
//             onClick={() => handlePageChange(currentPage + 1)}
//             disabled={currentPage === totalPages}
//             className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             Next
//           </button>
//         </div>
//       )}

//       {selectedTaskIdForNotes && (
//         <NotesModal
//           isOpen={isNoteModalOpen}
//           onClose={() => setIsNoteModalOpen(false)}
//           taskId={selectedTaskIdForNotes}
//           initialNotes={notesMap[selectedTaskIdForNotes] || []}
//           onSave={(updatedNotes) => {
//             setNotesMap((prev) => ({
//               ...prev,
//               [selectedTaskIdForNotes]: updatedNotes,
//             }));
//           }}
//         />
//       )}

//       {/* General Attachment Modal (using Radix Dialog) */}
//       {attachmentModalOpen && (
//         <Dialog.Root open={attachmentModalOpen} onOpenChange={setAttachmentModalOpen}>
//           <Dialog.Portal>
//             <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[100]" />
//             <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl z-[101] max-w-2xl w-full max-h-[80vh] overflow-y-auto">
//               <Dialog.Title className="text-lg font-semibold mb-4">Attachments</Dialog.Title>
//               <div className="grid gap-4 grid-cols-2">
//                 {selectedAttachments.map((file, idx) => {
//                   const fileUrl = file?.url || "";
//                   const isPdf = fileUrl.toLowerCase().endsWith(".pdf");

//                   return (
//                     <a
//                       key={idx}
//                       href={fileUrl}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="block border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition"
//                     >
//                       {isPdf ? (
//                         <div className="flex items-center gap-2">
//                           📄 <span className="text-sm truncate">{file.name || `Attachment ${idx + 1}`}</span>
//                         </div>
//                       ) : (
//                         <img
//                           src={fileUrl}
//                           alt={file.name || `Attachment ${idx + 1}`}
//                           className="w-full h-32 object-contain rounded"
//                         />
//                       )}
//                     </a>
//                   );
//                 })}
//               </div>
//               <div className="mt-4 text-right">
//                 <button
//                   onClick={() => setAttachmentModalOpen(false)}
//                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
//                 >
//                   Close
//                 </button>
//               </div>
//             </Dialog.Content>
//           </Dialog.Portal>
//         </Dialog.Root>
//       )}

//       {/* PaymentProofsModal (custom) */}
//       {showPaymentProofsModal && selectedPaymentProofs.length > 0 && (
//         <PaymentProofsModal
//           urls={selectedPaymentProofs}
//           onClose={() => setShowPaymentProofsModal(false)}
//         />
//       )}
//     </div>
//   );
// }





































































































































// // components/TaskTableView.tsx
// "use client";

// import React, { useState, useEffect, useMemo } from "react";
// import { Task } from "../../types/task";
// import { Note } from "../../../types/note";
// import { columns } from "./columns"; // your other columns if needed
// import { DataTable } from "../components/ui/data-table";
// import HighlightColorDropdown from "../components/HighlightColorDropdown";

// import { useUser, UserResource } from "@clerk/nextjs";

// import { format, isToday, subDays, startOfMonth } from "date-fns";
// import * as Dialog from "@radix-ui/react-dialog"; // CORRECTED: Namespace import for Radix UI Dialog
// import {
//   FaDownload,
//   FaSearch,
//   FaEye,
//   FaEyeSlash,
//   FaMapMarkerAlt,
//   FaEdit,
//   FaTimesCircle,
//   FaSpinner,
//   FaRupeeSign,
//   FaCheckCircle,
//   FaReceipt,
//   FaArrowUp,
//   FaArrowDown,
//   FaTimes,
// } from "react-icons/fa";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
// import toast from "react-hot-toast";
// import NotesModal from "../components/NotesModal";
// import Image from "next/image";

// // Define AttachmentType within this file or import if it's in a shared types file

// interface TaskTableViewProps {
//   data: Task[];
// }

// type AttachmentType = {
//   url: string;
//   name?: string;
// };

// // PaymentProofsModal.tsx (This component is embedded directly within TaskTableView)
// function PaymentProofsModal({
//   urls,
//   onClose,
// }: {
//   urls: string[];
//   onClose: () => void;
// }) {
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);

//   return (
//     <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
//       <div className="bg-white max-w-3xl w-full p-4 rounded shadow-lg relative">
//         <button
//           onClick={() => {
//             if (previewUrl) {
//               setPreviewUrl(null);
//             } else {
//               onClose();
//             }
//           }}
//           className="absolute top-3 right-3 text-gray-600 hover:text-red-500"
//           title={previewUrl ? "Back to list" : "Close modal"}
//         >
//           <FaTimes size={20} />
//         </button>

//         <h2 className="text-xl font-bold mb-4">Payment Proofs</h2>

//         {previewUrl ? (
//           <div className="overflow-auto max-h-[80vh]">
//             {previewUrl.toLowerCase().endsWith(".pdf") ? (
//               <iframe
//                 src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`}
//                 className="w-full h-[70vh] border rounded"
//                 title="PDF Preview"
//               />
//             ) : (
//               <Image
//                 src={previewUrl}
//                 alt="Proof Preview"
//                 width={800}
//                 height={600}
//                 className="max-w-full max-h-[70vh] object-contain mx-auto"
//                 unoptimized
//               />
//             )}
//           </div>
//         ) : (
//           <div className="space-y-4 max-h-[70vh] overflow-y-auto px-2">
//             {urls.filter(url => typeof url === "string").map((url, i) => {
//               const label = url.toLowerCase().endsWith(".pdf") ? "📄 PDF Proof" : "🖼️ Image Proof";
//               return (
//                 <div key={i} className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded shadow-sm">
//                   <span className="text-sm text-gray-700">{label}</span>
//                   <div className="flex gap-3">
//                     <button
//                       onClick={() => setPreviewUrl(url)}
//                       className="text-purple-700 underline hover:text-purple-900 text-sm"
//                     >
//                       👁️ Preview
//                     </button>
//                     <a
//                       href={url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-green-600 underline hover:text-green-800 text-sm"
//                     >
//                       ⬇️ Download
//                     </a>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// interface Props {
//   tasks: Task[];
//   user: UserResource;
//   onTasksUpdate?: (updatedTasks: Task[]) => void;
// }

// const ALL_COLUMNS = [
//   "rowNumber",
//    "highlightColor",
//   "title",
//   "status",
//   "shopName",
//   "email",
//   "phone",
//   "assignerName",
//   "assignee",
//   "createdAt",
//   "location",
//   "notes",
//   "amount",
//   "amountReceived",
//   "pendingAmount",
//   "attachments",
//   "paymentProofs",
// ];

// export default function TaskTableView({ tasks, user, onTasksUpdate }: Props) {
//   const [editMode, setEditMode] = useState(false);
//   const [editedValues, setEditedValues] = useState<{ [key: string]: number }>({});
//   const [localTasks, setLocalTasks] = useState<Task[]>(tasks || []);
//   const [isSaving, setIsSaving] = useState<string | null>(null);

//   const [query, setQuery] = useState("");
//   const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
//   const [columns, setColumns] = useState<string[]>(ALL_COLUMNS);
//   const [statusFilter, setStatusFilter] = useState<string | null>(null);
//   const [sourceFilter, setSourceFilter] = useState<string | null>(null);
//   const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
//   const [dateFilter, setDateFilter] = useState<string | null>(null);

//   const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
//   const [selectedTaskIdForNotes, setSelectedTaskIdForNotes] = useState<string | null>(null);
//   const [notesMap, setNotesMap] = useState<{ [taskId: string]: Note[] }>({});

//   const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
//   const [selectedAttachments, setSelectedAttachments] = useState<AttachmentType[]>([]); // This state expects AttachmentType[]

//   const [showPaymentProofsModal, setShowPaymentProofsModal] = useState(false);
//   const [selectedPaymentProofs, setSelectedPaymentProofs] = useState<string[]>([]);

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
//       filteredTasks = filteredTasks.filter((t) => t.assignees?.some(a => (a.name || a.email) === assigneeFilter));
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
//           aValue = (Number(a.amount) || 0) - (Number(a.received) || 0);
//           bValue = (Number(b.amount) || 0) - (Number(b.received) || 0);
//         } else if (sortConfig.key === 'amount') {
//             aValue = Number(a.amount) || 0;
//             bValue = Number(b.amount) || 0;
//         } else if (sortConfig.key === 'amountReceived') {
//             aValue = Number(a.received) || 0;
//             bValue = Number(b.received) || 0;
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
//       "Amount": Number(task.amount) || 0,
//       "Amount Received": Number(task.received) || 0,
//       "Pending Amount": (Number(task.amount) || 0) - (Number(task.received) || 0),
//       "Notes": (notesMap[task.id] || []).map((note) => note.content).join(" | "),
//       "Attachments": task.attachments?.map(a => typeof a === 'string' ? a : a.url).join(" | ") || "", // Normalized for export
//       "Payment Proofs": task.paymentProofs?.map(p => typeof p === 'string' ? p : p.url).filter(Boolean).join(" | ") || "",
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
//     field: "amount" | "received",
//     value: number
//   ) => {
//     const key = `${taskId}-${field}`;
//     setEditedValues((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleBlur = async (taskId: string, field: "amount" | "received") => {
//     const key = `${taskId}-${field}`;
//     const value = editedValues[key];

//     const originalTask = localTasks.find(t => t.id === taskId);
//     const originalValue = field === 'amount' ? (Number(originalTask?.amount) || 0) : (Number(originalTask?.received) || 0);

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
//           setEditedValues((prev) => {
//             const newState = { ...prev };
//             delete newState[key];
//             return newState;
//           });
//         }
//       } catch (err: unknown) {
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

//   const formatCurrency = (amount: number | string | undefined): string => {
//     if (typeof amount === 'string') {
//         const num = parseFloat(amount);
//         if (!isNaN(num)) return `₹${num.toLocaleString("en-IN")}`;
//     } else if (typeof amount === 'number') {
//         return `₹${amount.toLocaleString("en-IN")}`;
//     }
//     return "—";
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

//   const pageNumbers = useMemo(() => {
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
//     <div className="bg-white rounded-xl shadow-lg border border-gray-100 mt-6 overflow-hidden">
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-gray-100 bg-gray-50">
//         <div className="flex flex-wrap gap-3 items-center">
//           <div className="relative w-full sm:w-auto">
//             <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
//             <input
//               type="text"
//               placeholder="Search by shop, email, phone..."
//               className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm transition duration-200 ease-in-out w-full"
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//             />
//           </div>
//           <select
//             className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8 bg-white transition duration-200 ease-in-out"
//             value={statusFilter ?? ""}
//             onChange={(e) => setStatusFilter(e.target.value || null)}
//           >
//             <option value="">All Status</option>
//             <option value="todo">To Do</option>
//             <option value="done">Done</option>
//           </select>
//           <select
//             className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8 bg-white transition duration-200 ease-in-out"
//             value={sourceFilter ?? ""}
//             onChange={(e) => setSourceFilter(e.target.value || null)}
//           >
//             <option value="">All Sources</option>
//             <option value="zomato">Zomato</option>
//             <option value="swiggy">Swiggy</option>
//             <option value="license">License</option>
//           </select>
//           <select
//             className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8 bg-white transition duration-200 ease-in-out"
//             value={assigneeFilter ?? ""}
//             onChange={(e) => setAssigneeFilter(e.target.value || null)}
//           >
//             <option value="">All Assignees</option>
//             {[...new Set(localTasks.map((t) => t.assignees?.map(a => a.name || a.email)).flat().filter(Boolean))].map((name) => (
//               <option key={name} value={name}>
//                 {name}
//               </option>
//             ))}
//           </select>
//           <select
//             className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8 bg-white transition duration-200 ease-in-out"
//             value={dateFilter ?? ""}
//             onChange={(e) => setDateFilter(e.target.value || null)}
//           >
//             <option value="">All Dates</option>
//             <option value="today">Today</option>
//             <option value="yesterday">Yesterday</option>
//             <option value="last_7_days">Last 7 Days</option>
//             <option value="this_month">This Month</option>
//             <option value="last_month">Last Month</option>
//             <option value="this_year">This Year</option>
//           </select>

//           <div className="flex items-center gap-2">
//             <label htmlFor="tasksPerPageSelect" className="text-sm text-gray-600">Tasks per page:</label>
//             <select
//               id="tasksPerPageSelect"
//               value={tasksPerPage}
//               onChange={handleTasksPerPageChange}
//               className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-8 bg-white transition duration-200 ease-in-out"
//             >
//               <option value={5}>5</option>
//               <option value={10}>10</option>
//               <option value={15}>15</option>
//               <option value={20}>20</option>
//               <option value={50}>50</option>
//               <option value={100}>100</option>
//             </select>
//           </div>

//         </div>

//         <div className="flex flex-wrap gap-2">
//           <button
//             className="inline-flex items-center bg-green-600 text-white font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ease-in-out"
//             onClick={exportCSV}
//           >
//             <FaDownload className="inline mr-2 -ml-1" /> Export CSV
//           </button>
//           <button
//             className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out
//             ${editMode ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500" : "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500"}`}
//             onClick={() => setEditMode((prev) => !prev)}
//           >
//             {editMode ? <><FaTimesCircle className="mr-2" /> Exit Edit Mode</> : <><FaEdit className="mr-2" /> Enter Edit Mode</>}
//           </button>
//         </div>
//       </div>

//       <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
//         <span className="text-gray-700 text-sm font-medium mr-2">Show/Hide Columns:</span>
//         {ALL_COLUMNS.map((col) => (
//           <button
//             key={col}
//             onClick={() =>
//               setColumns((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]))
//             }
//             className={`inline-flex items-center px-3 py-1.5 border rounded-full text-xs font-medium transition-all duration-200 ease-in-out
//               ${
//                 columns.includes(col)
//                   ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                   : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
//               }`}
//           >
//             {columns.includes(col) ? <FaEye className="mr-1" /> : <FaEyeSlash className="mr-1" />}{" "}
//             {col.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
//           </button>
//         ))}
//       </div>

//       <div className="overflow-x-auto">
//         <table className="min-w-full table-fixed border-collapse border border-gray-200 text-sm shadow-md rounded-md overflow-hidden">
//           <thead className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0 z-10">
//             <tr>
//               {columns.includes("rowNumber") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-12">
//                   S. No.
//                 </th>
//               )}
//               {columns.includes("title") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
//                   Title
//                 </th>
//               )}
//               {columns.includes("createdAt") && (
//                 <th
//                   className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-36 cursor-pointer"
//                   onClick={() => requestSort("createdAt")}
//                 >
//                   <div className="flex items-center">
//                     📅 Created {getSortIcon("createdAt")}
//                   </div>
//                 </th>
//               )}
//               {columns.includes("assignerName") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-48">
//                   Assigned By → To
//                 </th>
//               )}
//               {columns.includes("shopName") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-40">
//                   🏪 Shop Name
//                 </th>
//               )}
//               {columns.includes("location") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
//                   📍 Location
//                 </th>
//               )}
//               {columns.includes("phone") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
//                   📞 Phone
//                 </th>
//               )}
//               {columns.includes("email") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-40">
//                   📧 Email
//                 </th>
//               )}
//               {columns.includes("status") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
//                   Status
//                 </th>
//               )}
//               {columns.includes("notes") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
//                   📝 Notes
//                 </th>
//               )}
//               {columns.includes("amount") && (
//                 <th
//                   className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
//                   onClick={() => requestSort("amount")}
//                 >
//                   <div className="flex items-center justify-end">
//                     <FaRupeeSign className="mr-1" /> Amount {getSortIcon("amount")}
//                   </div>
//                 </th>
//               )}
//               {columns.includes("amountReceived") && (
//                 <th
//                   className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
//                   onClick={() => requestSort("amountReceived")}
//                 >
//                   <div className="flex items-center justify-end">
//                     <FaCheckCircle className="mr-1 text-emerald-600" /> Received {getSortIcon("amountReceived")}
//                   </div>
//                 </th>
//               )}
//               {columns.includes("pendingAmount") && (
//                 <th
//                   className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
//                   onClick={() => requestSort("pendingAmount")}
//                 >
//                   <div className="flex items-center justify-end">
//                     <FaReceipt className="mr-1 text-rose-600" /> Pending {getSortIcon("pendingAmount")}
//                   </div>
//                 </th>
//               )}
//               {columns.includes("attachments") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
//                   📎 Attachments
//                 </th>
//               )}
//               {columns.includes("paymentProofs") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-32">
//                   🧾 Payment Proofs
//                 </th>
//               )}
//             </tr>
//           </thead>

//           <tbody className="bg-white">
//             {paginatedTasks.length === 0 ? (
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
//             ) : (
//               paginatedTasks.map((task, index) => {
//                 const amount = Number(task.amount) || 0;
//                 const received = Number(task.received) || 0;
//                 const pending = amount - received;
//                 const rowNumber = (currentPage - 1) * tasksPerPage + index + 1;
//                 const hasNotes = (notesMap[task.id]?.length || 0) > 0;

//                 return (
//                   <tr
//                     key={task.id}
//                      style={{
//                       backgroundColor: task.highlightColor || "transparent",
//                     }}
//                     className="h-12 hover:bg-blue-50 transition-all duration-150 ease-in-out"
//                   >
//                     {columns.includes("rowNumber") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center text-gray-700 font-medium">
//                         {rowNumber}
//                       </td>
//                     )}

//                       {columns.includes("highlightColor") && (
//                       <td className="p-2 border border-gray-200">
//                         <HighlightColorDropdown
//                           taskId={task.id}
//                           value={task.highlightColor}
//                           onChange={(newColor) => {
//                             const updated = localTasks.map((t) =>
//                               t.id === task.id ? { ...t, highlightColor: newColor } : t
//                             );
//                             setLocalTasks(updated);
//                             onTasksUpdate?.(updated);
//                           }}
//                         />
//                       </td>
//                     )}
//                     {columns.includes("title") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left font-medium text-gray-900">
//                         {task.title}
//                       </td>
//                     )}
//                     {columns.includes("createdAt") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-600">
//                         {task.createdAt ? format(new Date(task.createdAt), "dd MMM, HH:mm") : "—"}
//                       </td>
//                     )}
//                     {columns.includes("assignerName") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
//                         <span className="font-semibold text-gray-800">{task.assignerName || "—"}</span>{" "}
//                         <span className="text-blue-500">→</span>{" "}
//                         <span className="text-blue-600 font-medium">
//                           {Array.isArray(task.assignees) && task.assignees.length > 0
//                             ? task.assignees.map((a) => a?.name || a?.email || "—").filter(Boolean).join(", ")
//                             : task.assigneeEmail || "—"}
//                         </span>
//                       </td>
//                     )}
//                     {columns.includes("shopName") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-700">
//                         {task.customFields?.shopName || "—"}
//                       </td>
//                     )}
//                     {columns.includes("location") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                         {task.customFields?.location ? (
//                           <a
//                             href={String(task.customFields?.location || "")}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
//                           >
//                             <FaMapMarkerAlt className="text-blue-500" /> View
//                           </a>
//                         ) : (
//                           <span className="text-gray-400">—</span>
//                         )}
//                       </td>
//                     )}
//                     {columns.includes("phone") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
//                         {task.customFields?.phone || "—"}
//                       </td>
//                     )}
//                     {columns.includes("email") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
//                         {task.customFields?.email || "—"}
//                       </td>
//                     )}
//                     {columns.includes("status") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                         <span
//                           className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                             task.status === "done" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
//                           }`}
//                         >
//                           {task.status || "Pending"}
//                         </span>
//                       </td>
//                     )}
//                     {columns.includes("notes") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                         <button
//                           onClick={() => {
//                             setSelectedTaskIdForNotes(task.id);
//                             setIsNoteModalOpen(true);
//                           }}
//                           className={`flex items-center gap-1 transition-colors duration-200 ${
//                             hasNotes
//                               ? "text-blue-600 hover:text-blue-800"
//                               : "text-gray-400 hover:text-gray-600"
//                           }`}
//                           title={hasNotes ? "View/Edit Notes" : "Add Note"}
//                         >
//                           📝
//                           {hasNotes && (
//                             <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
//                               {notesMap[task.id].length}
//                             </span>
//                           )}
//                         </button>
//                       </td>
//                     )}
//                     {columns.includes("amount") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right text-gray-900">
//                         {editMode ? (
//                           <div className="relative flex items-center justify-end">
//                             <input
//                               type="number"
//                               className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right text-sm"
//                               value={editedValues[`${task.id}-amount`] ?? Number(task.amount)}
//                               onChange={(e) => handleInputChange(task.id, "amount", Number(e.target.value))}
//                               onBlur={() => handleBlur(task.id, "amount")}
//                             />
//                             {isSaving === `${task.id}-amount` && (
//                               <FaSpinner className="absolute right-2 text-blue-500 animate-spin" />
//                             )}
//                           </div>
//                         ) : (
//                           formatCurrency(amount)
//                         )}
//                       </td>
//                     )}
//                     {columns.includes("amountReceived") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right text-gray-900">
//                         {editMode ? (
//                           <div className="relative flex items-center justify-end">
//                             <input
//                               type="number"
//                               className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right text-sm"
//                               value={editedValues[`${task.id}-received`] ?? Number(task.received)}
//                               onChange={(e) => handleInputChange(task.id, "received", Number(e.target.value))}
//                               onBlur={() => handleBlur(task.id, "received")}
//                             />
//                             {isSaving === `${task.id}-received` && (
//                               <FaSpinner className="absolute right-2 text-blue-500 animate-spin" />
//                             )}
//                           </div>
//                         ) : (
//                           formatCurrency(received)
//                         )}
//                       </td>
//                     )}
//                     {columns.includes("pendingAmount") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right text-gray-900 font-bold">
//                         {formatCurrency(pending)}
//                       </td>
//                     )}
//                     {columns.includes("attachments") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                         {task.attachments && task.attachments.length > 0 ? (
//                           <button
//                             onClick={() => {
//                               // Normalize attachments to ensure { url: string, name?: string } format
//                               const normalizedAttachments: AttachmentType[] = (task.attachments || []).map((item) =>
//                                 typeof item === "string" ? { url: item } : item
//                               );
//                               setSelectedAttachments(normalizedAttachments);
//                               setAttachmentModalOpen(true);
//                             }}
//                             className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
//                           >
//                             📎 View ({task.attachments.length})
//                           </button>
//                         ) : (
//                           <span className="text-gray-400">—</span>
//                         )}
//                       </td>
//                     )}
//                     {columns.includes("paymentProofs") && (
//                       <td className="border border-gray-200 px-3 py-2 text-center">
//                         {Array.isArray(task.paymentProofs) && task.paymentProofs.length > 0 ? (
//                           <button
//                             onClick={() => {
//                               const proofUrls = task.paymentProofs
//                                 .map(p => typeof p === 'string' ? p : p.url)
//                                 .filter((url): url is string => typeof url === 'string');
//                               setSelectedPaymentProofs(proofUrls);
//                               setShowPaymentProofsModal(true);
//                             }}
//                             title="View Payment Proofs"
//                             className="text-blue-600 hover:text-blue-800 underline"
//                           >
//                             🧾 {task.paymentProofs.length}
//                           </button>
//                         ) : (
//                           <span className="text-gray-400">—</span>
//                         )}
//                       </td>
//                     )}
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>

//       {totalPages > 1 && (
//         <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50">
//           <button
//             onClick={() => handlePageChange(currentPage - 1)}
//             disabled={currentPage === 1}
//             className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             Previous
//           </button>
//           <div className="flex gap-1">
//             {pageNumbers[0] > 1 && (
//                 <>
//                     <button
//                         onClick={() => handlePageChange(1)}
//                         className={`px-3 py-1 text-sm rounded-lg ${
//                             currentPage === 1 ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
//                         }`}
//                     >
//                         1
//                     </button>
//                     {pageNumbers[0] > 2 && <span className="px-3 py-1 text-sm text-gray-500">...</span>}
//                 </>
//             )}
//             {pageNumbers.map((page) => (
//               <button
//                 key={page}
//                 onClick={() => handlePageChange(page)}
//                 className={`px-3 py-1 text-sm rounded-lg ${
//                   currentPage === page ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
//                 }`}
//               >
//                 {page}
//               </button>
//             ))}
//             {pageNumbers[pageNumbers.length - 1] < totalPages && (
//                 <>
//                     {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="px-3 py-1 text-sm text-gray-500">...</span>}
//                     <button
//                         onClick={() => handlePageChange(totalPages)}
//                         className={`px-3 py-1 text-sm rounded-lg ${
//                             currentPage === totalPages ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
//                         }`}
//                     >
//                         {totalPages}
//                     </button>
//                 </>
//             )}
//           </div>
//           <button
//             onClick={() => handlePageChange(currentPage + 1)}
//             disabled={currentPage === totalPages}
//             className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             Next
//           </button>
//         </div>
//       )}

//       {selectedTaskIdForNotes && (
//         <NotesModal
//           isOpen={isNoteModalOpen}
//           onClose={() => setIsNoteModalOpen(false)}
//           taskId={selectedTaskIdForNotes}
//           initialNotes={notesMap[selectedTaskIdForNotes] || []}
//           onSave={(updatedNotes) => {
//             setNotesMap((prev) => ({
//               ...prev,
//               [selectedTaskIdForNotes]: updatedNotes,
//             }));
//           }}
//         />
//       )}

//       {/* General Attachment Modal (using Radix Dialog) */}
//       {attachmentModalOpen && (
//         <Dialog.Root open={attachmentModalOpen} onOpenChange={setAttachmentModalOpen}>
//           <Dialog.Portal>
//             <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[100]" />
//             <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl z-[101] max-w-2xl w-full max-h-[80vh] overflow-y-auto">
//               <Dialog.Title className="text-lg font-semibold mb-4">Attachments</Dialog.Title>
//               <div className="grid gap-4 grid-cols-2">
//                 {selectedAttachments.map((file, idx) => {
//                   const fileUrl = file?.url || "";
//                   const isPdf = fileUrl.toLowerCase().endsWith(".pdf");

//                   return (
//                     <a
//                       key={idx}
//                       href={fileUrl}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="block border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition"
//                     >
//                       {isPdf ? (
//                         <div className="flex items-center gap-2">
//                           📄 <span className="text-sm truncate">{file.name || `Attachment ${idx + 1}`}</span>
//                         </div>
//                       ) : (
//                         <img
//                           src={fileUrl}
//                           alt={file.name || `Attachment ${idx + 1}`}
//                           className="w-full h-32 object-contain rounded"
//                         />
//                       )}
//                     </a>
//                   );
//                 })}
//               </div>
//               <div className="mt-4 text-right">
//                 <button
//                   onClick={() => setAttachmentModalOpen(false)}
//                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
//                 >
//                   Close
//                 </button>
//               </div>
//             </Dialog.Content>
//           </Dialog.Portal>
//         </Dialog.Root>
//       )}

//       {/* PaymentProofsModal (custom) */}
//       {showPaymentProofsModal && selectedPaymentProofs.length > 0 && (
//         <PaymentProofsModal
//           urls={selectedPaymentProofs}
//           onClose={() => setShowPaymentProofsModal(false)}
//         />
//       )}
//     </div>
//   );
// }







































































// // components/TaskTableView.tsx
// "use client";

// import React, { useState, useEffect, useMemo } from "react";
// import { Task } from "../../types/task";
// import { Note } from "../../../types/note";
// import { columns } from "./columns"; // your other columns if needed
// import { DataTable } from "../components/ui/data-table";
// import HighlightColorDropdown from "../components/HighlightColorDropdown";
// import { TaskFilters } from "./TaskFilters"; 

// import { useUser, UserResource } from "@clerk/nextjs";

// import { format, isToday, subDays, startOfMonth } from "date-fns";
// import * as Dialog from "@radix-ui/react-dialog"; // CORRECTED: Namespace import for Radix UI Dialog
// import {
//   FaDownload,
//   FaSearch,
//   FaEye,
//   FaEyeSlash,
//   FaMapMarkerAlt,
//   FaEdit,
//   FaTimesCircle,
//   FaSpinner,
//   FaRupeeSign,
//   FaCheckCircle,
//   FaReceipt,
//   FaArrowUp,
//   FaArrowDown,
//   FaTimes,
// } from "react-icons/fa";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
// import toast from "react-hot-toast";
// import NotesModal from "../components/NotesModal";
// import Image from "next/image";

// // Define AttachmentType within this file or import if it's in a shared types file

// interface TaskTableViewProps {
//   data: Task[];
// }

// type AttachmentType = {
//   url: string;
//   name?: string;
// };

// // PaymentProofsModal.tsx (This component is embedded directly within TaskTableView)
// function PaymentProofsModal({
//   urls,
//   onClose,
// }: {
//   urls: string[];
//   onClose: () => void;
// }) {
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);

//   return (
//     <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
//       <div className="bg-white max-w-3xl w-full p-4 rounded shadow-lg relative">
//         <button
//           onClick={() => {
//             if (previewUrl) {
//               setPreviewUrl(null);
//             } else {
//               onClose();
//             }
//           }}
//           className="absolute top-3 right-3 text-gray-600 hover:text-red-500"
//           title={previewUrl ? "Back to list" : "Close modal"}
//         >
//           <FaTimes size={20} />
//         </button>

//         <h2 className="text-xl font-bold mb-4">Payment Proofs</h2>

//         {previewUrl ? (
//           <div className="overflow-auto max-h-[80vh]">
//             {previewUrl.toLowerCase().endsWith(".pdf") ? (
//               <iframe
//                 src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`}
//                 className="w-full h-[70vh] border rounded"
//                 title="PDF Preview"
//               />
//             ) : (
//               <Image
//                 src={previewUrl}
//                 alt="Proof Preview"
//                 width={800}
//                 height={600}
//                 className="max-w-full max-h-[70vh] object-contain mx-auto"
//                 unoptimized
//               />
//             )}
//           </div>
//         ) : (
//           <div className="space-y-4 max-h-[70vh] overflow-y-auto px-2">
//             {urls.filter(url => typeof url === "string").map((url, i) => {
//               const label = url.toLowerCase().endsWith(".pdf") ? "📄 PDF Proof" : "🖼️ Image Proof";
//               return (
//                 <div key={i} className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded shadow-sm">
//                   <span className="text-sm text-gray-700">{label}</span>
//                   <div className="flex gap-3">
//                     <button
//                       onClick={() => setPreviewUrl(url)}
//                       className="text-purple-700 underline hover:text-purple-900 text-sm"
//                     >
//                       👁️ Preview
//                     </button>
//                     <a
//                       href={url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-green-600 underline hover:text-green-800 text-sm"
//                     >
//                       ⬇️ Download
//                     </a>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// interface Props {
//   tasks: Task[];
//   user: UserResource;
//   onTasksUpdate?: (updatedTasks: Task[]) => void;
// }

// const ALL_COLUMNS = [
//   "rowNumber",
//    "highlightColor",
//   "title",
//   "status",
//   "shopName",
//   "email",
//   "phone",
//   "assignerName",
//   "assignee",
//   "createdAt",
//   "location",
//   "notes",
//   "amount",
//   "amountReceived",
//   "pendingAmount",
//   "attachments",
//   "paymentProofs",
// ];

// export default function TaskTableView({ tasks, user, onTasksUpdate }: Props) {
//   const [editMode, setEditMode] = useState(false);
//   const [editedValues, setEditedValues] = useState<{ [key: string]: number }>({});
//   const [localTasks, setLocalTasks] = useState<Task[]>(tasks || []);
//   const [isSaving, setIsSaving] = useState<string | null>(null);

//   const [query, setQuery] = useState("");
//   const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
//   const [columns, setColumns] = useState<string[]>(ALL_COLUMNS);
//   const [statusFilter, setStatusFilter] = useState<string | null>(null);
//   const [sourceFilter, setSourceFilter] = useState<string | null>(null);
//   const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
//   const [dateFilter, setDateFilter] = useState<string | null>(null);

//   const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
//   const [selectedTaskIdForNotes, setSelectedTaskIdForNotes] = useState<string | null>(null);
//   const [notesMap, setNotesMap] = useState<{ [taskId: string]: Note[] }>({});

//   const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
//   const [selectedAttachments, setSelectedAttachments] = useState<AttachmentType[]>([]); // This state expects AttachmentType[]

//   const [showPaymentProofsModal, setShowPaymentProofsModal] = useState(false);
//   const [selectedPaymentProofs, setSelectedPaymentProofs] = useState<string[]>([]);

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
//       filteredTasks = filteredTasks.filter((t) => t.assignees?.some(a => (a.name || a.email) === assigneeFilter));
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
//           aValue = (Number(a.amount) || 0) - (Number(a.received) || 0);
//           bValue = (Number(b.amount) || 0) - (Number(b.received) || 0);
//         } else if (sortConfig.key === 'amount') {
//             aValue = Number(a.amount) || 0;
//             bValue = Number(b.amount) || 0;
//         } else if (sortConfig.key === 'amountReceived') {
//             aValue = Number(a.received) || 0;
//             bValue = Number(b.received) || 0;
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
//       "Amount": Number(task.amount) || 0,
//       "Amount Received": Number(task.received) || 0,
//       "Pending Amount": (Number(task.amount) || 0) - (Number(task.received) || 0),
//       "Notes": (notesMap[task.id] || []).map((note) => note.content).join(" | "),
//       "Attachments": task.attachments?.map(a => typeof a === 'string' ? a : a.url).join(" | ") || "", // Normalized for export
//       "Payment Proofs": task.paymentProofs?.map(p => typeof p === 'string' ? p : p.url).filter(Boolean).join(" | ") || "",
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
//     field: "amount" | "received",
//     value: number
//   ) => {
//     const key = `${taskId}-${field}`;
//     setEditedValues((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleBlur = async (taskId: string, field: "amount" | "received") => {
//     const key = `${taskId}-${field}`;
//     const value = editedValues[key];

//     const originalTask = localTasks.find(t => t.id === taskId);
//     const originalValue = field === 'amount' ? (Number(originalTask?.amount) || 0) : (Number(originalTask?.received) || 0);

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
//           setEditedValues((prev) => {
//             const newState = { ...prev };
//             delete newState[key];
//             return newState;
//           });
//         }
//       } catch (err: unknown) {
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

//   const formatCurrency = (amount: number | string | undefined): string => {
//     if (typeof amount === 'string') {
//         const num = parseFloat(amount);
//         if (!isNaN(num)) return `₹${num.toLocaleString("en-IN")}`;
//     } else if (typeof amount === 'number') {
//         return `₹${amount.toLocaleString("en-IN")}`;
//     }
//     return "—";
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

//   const pageNumbers = useMemo(() => {
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
//   <div className="bg-white rounded-xl shadow-lg border border-gray-100 mt-6 overflow-hidden">
//     {/* This div will contain the filter input */}
//     <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
//       <div className="relative flex-grow mr-4">
//         {/* Assuming you have a FilterInput component or want to implement one directly */}
//         {/* You'll need to manage 'searchTerm' state and 'handleSearchChange' function in your parent component */}
//         <input
//           type="text"
//           placeholder="Filter tasks by title, shop name, or assignee..."
//           className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
//           // Assuming 'searchTerm' and 'handleSearchChange' are props passed down or defined in the parent
//           // value={searchTerm}
//           // onChange={handleSearchChange}
//         />
//         <svg
//           className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
//           fill="none"
//           stroke="currentColor"
//           viewBox="0 0 24 24"
//           xmlns="http://www.w3.org/2000/svg"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth="2"
//             d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//           ></path>
//         </svg>
//       </div>

//       <div className="flex flex-wrap gap-2">
//         <button
//           className="inline-flex items-center bg-green-600 text-white font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ease-in-out"
//           onClick={exportCSV}
//         >
//           <FaDownload className="inline mr-2 -ml-1" /> Export CSV
//         </button>
//         <button
//           className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out
//             ${editMode ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500" : "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500"}`}
//           onClick={() => setEditMode((prev) => !prev)}
//         >
//           {editMode ? <><FaTimesCircle className="mr-2" /> Exit Edit Mode</> : <><FaEdit className="mr-2" /> Enter Edit Mode</>}
//         </button>
//       </div>
//     </div>

//     <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
//       <span className="text-gray-700 text-sm font-medium mr-2">Show/Hide Columns:</span>
//       {ALL_COLUMNS.map((col) => (
//         <button
//           key={col}
//           onClick={() =>
//             setColumns((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]))
//           }
//           className={`inline-flex items-center px-3 py-1.5 border rounded-full text-xs font-medium transition-all duration-200 ease-in-out
//             ${
//               columns.includes(col)
//                 ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                 : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
//             }`}
//         >
//           {columns.includes(col) ? <FaEye className="mr-1" /> : <FaEyeSlash className="mr-1" />}{" "}
//           {col.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
//         </button>
//       ))}
//     </div>

//     <div className="overflow-x-auto">
//       <table className="min-w-full table-fixed border-collapse border border-gray-200 text-sm shadow-md rounded-md overflow-hidden">
//         <thead className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0 z-10">
//           <tr>
//             {columns.includes("rowNumber") && (
//               <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-12">
//                 S. No.
//               </th>
//             )}
//           {columns.includes("highlightColor") && (

//   <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-24">
//  Highlight

//  </th>
//  )}
//             {columns.includes("title") && (
//               <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
//                 Title
//               </th>
//             )}
//             {columns.includes("createdAt") && (
//               <th
//                 className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-36 cursor-pointer"
//                 onClick={() => requestSort("createdAt")}
//               >
//                 <div className="flex items-center">
//                   📅 Created {getSortIcon("createdAt")}
//                 </div>
//               </th>
//             )}
//             {columns.includes("assignerName") && (
//               <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-48">
//                 Assigned By → To
//               </th>
//             )}
//             {columns.includes("shopName") && (
//               <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-40">
//                 🏪 Shop Name
//               </th>
//             )}
//             {columns.includes("location") && (
//               <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
//                 📍 Location
//               </th>
//             )}
//             {columns.includes("phone") && (
//               <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
//                 📞 Phone
//               </th>
//             )}
//             {columns.includes("email") && (
//               <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-40">
//                 📧 Email
//               </th>
//             )}
//             {columns.includes("status") && (
//               <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
//                 Status
//               </th>
//             )}
//             {columns.includes("notes") && (
//               <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
//                 📝 Notes
//               </th>
//             )}
//             {columns.includes("amount") && (
//               <th
//                 className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
//                 onClick={() => requestSort("amount")}
//               >
//                 <div className="flex items-center justify-end">
//                   <FaRupeeSign className="mr-1" /> Amount {getSortIcon("amount")}
//                 </div>
//               </th>
//             )}
//             {columns.includes("amountReceived") && (
//               <th
//                 className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
//                 onClick={() => requestSort("amountReceived")}
//               >
//                 <div className="flex items-center justify-end">
//                   <FaCheckCircle className="mr-1 text-emerald-600" /> Received {getSortIcon("amountReceived")}
//                 </div>
//               </th>
//             )}
//             {columns.includes("pendingAmount") && (
//               <th
//                 className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
//                 onClick={() => requestSort("pendingAmount")}
//               >
//                 <div className="flex items-center justify-end">
//                   <FaReceipt className="mr-1 text-rose-600" /> Pending {getSortIcon("pendingAmount")}
//                 </div>
//               </th>
//             )}
//             {columns.includes("attachments") && (
//               <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
//                 📎 Attachments
//               </th>
//             )}
//             {columns.includes("paymentProofs") && (
//               <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-32">
//                 🧾 Payment Proofs
//               </th>
//             )}
//           </tr>
//         </thead>

//         <tbody className="bg-white">
//           {paginatedTasks.length === 0 ? (
//             <tr>
//               <td colSpan={columns.length} className="text-center px-4 py-8 text-gray-500 text-base">
//                 <div className="flex flex-col items-center justify-center h-full">
//                   <svg
//                     className="w-12 h-12 text-gray-400 mb-3"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="1.5"
//                       d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
//                     ></path>
//                   </svg>
//                   <p className="text-lg font-medium">No tasks found</p>
//                   <p className="text-sm text-gray-500">
//                     Adjust your filters or add new tasks to see them here.
//                   </p>
//                 </div>
//               </td>
//             </tr>
//           ) : (
//             paginatedTasks.map((task, index) => {
//               const amount = Number(task.amount) || 0;
//               const received = Number(task.received) || 0;
//               const pending = amount - received;
//               const rowNumber = (currentPage - 1) * tasksPerPage + index + 1;
//               const hasNotes = (notesMap[task.id]?.length || 0) > 0;

//               return (
//                 <tr
//                   key={task.id}
//                   style={{
//                     backgroundColor: task.highlightColor || "transparent",
//                   }}
//                   className="h-12 hover:bg-blue-50 transition-all duration-150 ease-in-out"
//                 >
//                   {columns.includes("rowNumber") && (
//                     <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center text-gray-700 font-medium">
//                       {rowNumber}
//                     </td>
//                   )}

//                   {columns.includes("highlightColor") && (
//                     <td className="p-2 border border-gray-200">
//                       <HighlightColorDropdown
//                         taskId={task.id}
//                         value={task.highlightColor}
//                         onChange={(newColor) => {
//                           const updated = localTasks.map((t) =>
//                             t.id === task.id ? { ...t, highlightColor: newColor } : t
//                           );
//                           setLocalTasks(updated);
//                           onTasksUpdate?.(updated);
//                         }}
//                       />
//                     </td>
//                   )}
//                   {columns.includes("title") && (
//                     <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left font-medium text-gray-900">
//                       {task.title}
//                     </td>
//                   )}
//                   {columns.includes("createdAt") && (
//                     <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-600">
//                       {task.createdAt ? format(new Date(task.createdAt), "dd MMM, HH:mm") : "—"}
//                     </td>
//                   )}
//                   {columns.includes("assignerName") && (
//                     <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
//                       <span className="font-semibold text-gray-800">{task.assignerName || "—"}</span>{" "}
//                       <span className="text-blue-500">→</span>{" "}
//                       <span className="text-blue-600 font-medium">
//                         {Array.isArray(task.assignees) && task.assignees.length > 0
//                           ? task.assignees.map((a) => a?.name || a?.email || "—").filter(Boolean).join(", ")
//                           : task.assigneeEmail || "—"}
//                       </span>
//                     </td>
//                   )}
//                   {columns.includes("shopName") && (
//                     <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-700">
//                       {task.customFields?.shopName || "—"}
//                     </td>
//                   )}
//                   {columns.includes("location") && (
//                     <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                       {task.customFields?.location ? (
//                         <a
//                           href={String(task.customFields?.location || "")}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
//                         >
//                           <FaMapMarkerAlt className="text-blue-500" /> View
//                         </a>
//                       ) : (
//                         <span className="text-gray-400">—</span>
//                       )}
//                     </td>
//                   )}
//                   {columns.includes("phone") && (
//                     <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
//                       {task.customFields?.phone || "—"}
//                     </td>
//                   )}
//                   {columns.includes("email") && (
//                     <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
//                       {task.customFields?.email || "—"}
//                     </td>
//                   )}
//                   {columns.includes("status") && (
//                     <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                       <span
//                         className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                           task.status === "done" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
//                         }`}
//                       >
//                         {task.status || "Pending"}
//                       </span>
//                     </td>
//                   )}
//                   {columns.includes("notes") && (
//                     <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                       <button
//                         onClick={() => {
//                           setSelectedTaskIdForNotes(task.id);
//                           setIsNoteModalOpen(true);
//                         }}
//                         className={`flex items-center gap-1 transition-colors duration-200 ${
//                           hasNotes
//                             ? "text-blue-600 hover:text-blue-800"
//                             : "text-gray-400 hover:text-gray-600"
//                         }`}
//                         title={hasNotes ? "View/Edit Notes" : "Add Note"}
//                       >
//                         📝
//                         {hasNotes && (
//                           <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
//                             {notesMap[task.id].length}
//                           </span>
//                         )}
//                       </button>
//                     </td>
//                   )}
//                   {columns.includes("amount") && (
//                     <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right text-gray-900">
//                       {editMode ? (
//                         <div className="relative flex items-center justify-end">
//                           <input
//                             type="number"
//                             className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right text-sm"
//                             value={editedValues[`${task.id}-amount`] ?? Number(task.amount)}
//                             onChange={(e) => handleInputChange(task.id, "amount", Number(e.target.value))}
//                             onBlur={() => handleBlur(task.id, "amount")}
//                           />
//                           {isSaving === `${task.id}-amount` && (
//                             <FaSpinner className="absolute right-2 text-blue-500 animate-spin" />
//                           )}
//                         </div>
//                       ) : (
//                         formatCurrency(amount)
//                       )}
//                     </td>
//                   )}
//                   {columns.includes("amountReceived") && (
//                     <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right text-gray-900">
//                       {editMode ? (
//                         <div className="relative flex items-center justify-end">
//                           <input
//                             type="number"
//                             className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right text-sm"
//                             value={editedValues[`${task.id}-received`] ?? Number(task.received)}
//                             onChange={(e) => handleInputChange(task.id, "received", Number(e.target.value))}
//                             onBlur={() => handleBlur(task.id, "received")}
//                           />
//                           {isSaving === `${task.id}-received` && (
//                             <FaSpinner className="absolute right-2 text-blue-500 animate-spin" />
//                           )}
//                         </div>
//                       ) : (
//                         formatCurrency(received)
//                       )}
//                     </td>
//                   )}
//                   {columns.includes("pendingAmount") && (
//                     <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right text-gray-900 font-bold">
//                       {formatCurrency(pending)}
//                     </td>
//                   )}
//                   {columns.includes("attachments") && (
//                     <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                       {task.attachments && task.attachments.length > 0 ? (
//                         <button
//                           onClick={() => {
//                             // Normalize attachments to ensure { url: string, name?: string } format
//                             const normalizedAttachments: AttachmentType[] = (task.attachments || []).map((item) =>
//                               typeof item === "string" ? { url: item } : item
//                             );
//                             setSelectedAttachments(normalizedAttachments);
//                             setAttachmentModalOpen(true);
//                           }}
//                           className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
//                         >
//                           📎 View ({task.attachments.length})
//                         </button>
//                       ) : (
//                         <span className="text-gray-400">—</span>
//                       )}
//                     </td>
//                   )}
//                   {columns.includes("paymentProofs") && (
//                     <td className="border border-gray-200 px-3 py-2 text-center">
//                       {Array.isArray(task.paymentProofs) && task.paymentProofs.length > 0 ? (
//                         <button
//                           onClick={() => {
//                             const proofUrls = task.paymentProofs
//                               .map(p => typeof p === 'string' ? p : p.url)
//                               .filter((url): url is string => typeof url === 'string');
//                             setSelectedPaymentProofs(proofUrls);
//                             setShowPaymentProofsModal(true);
//                           }}
//                           title="View Payment Proofs"
//                           className="text-blue-600 hover:text-blue-800 underline"
//                         >
//                           🧾 {task.paymentProofs.length}
//                         </button>
//                       ) : (
//                         <span className="text-gray-400">—</span>
//                       )}
//                     </td>
//                   )}
//                 </tr>
//               );
//             })
//           )}
//         </tbody>
//       </table>
//     </div>

//     {totalPages > 1 && (
//       <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50">
//         <button
//           onClick={() => handlePageChange(currentPage - 1)}
//           disabled={currentPage === 1}
//           className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           Previous
//         </button>
//         <div className="flex gap-1">
//           {pageNumbers[0] > 1 && (
//               <>
//                 <button
//                     onClick={() => handlePageChange(1)}
//                     className={`px-3 py-1 text-sm rounded-lg ${
//                       currentPage === 1 ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
//                     }`}
//                 >
//                     1
//                 </button>
//                 {pageNumbers[0] > 2 && <span className="px-3 py-1 text-sm text-gray-500">...</span>}
//               </>
//           )}
//           {pageNumbers.map((page) => (
//             <button
//               key={page}
//               onClick={() => handlePageChange(page)}
//               className={`px-3 py-1 text-sm rounded-lg ${
//                 currentPage === page ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
//               }`}
//             >
//               {page}
//             </button>
//           ))}
//           {pageNumbers[pageNumbers.length - 1] < totalPages && (
//               <>
//                 {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="px-3 py-1 text-sm text-gray-500">...</span>}
//                 <button
//                     onClick={() => handlePageChange(totalPages)}
//                     className={`px-3 py-1 text-sm rounded-lg ${
//                       currentPage === totalPages ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
//                     }`}
//                 >
//                     {totalPages}
//                 </button>
//               </>
//           )}
//         </div>
//         <button
//           onClick={() => handlePageChange(currentPage + 1)}
//           disabled={currentPage === totalPages}
//           className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           Next
//         </button>
//       </div>
//     )}

//     {selectedTaskIdForNotes && (
//       <NotesModal
//         isOpen={isNoteModalOpen}
//         onClose={() => setIsNoteModalOpen(false)}
//         taskId={selectedTaskIdForNotes}
//         initialNotes={notesMap[selectedTaskIdForNotes] || []}
//         onSave={(updatedNotes) => {
//           setNotesMap((prev) => ({
//             ...prev,
//             [selectedTaskIdForNotes]: updatedNotes,
//           }));
//         }}
//       />
//     )}

//     {/* General Attachment Modal (using Radix Dialog) */}
//     {attachmentModalOpen && (
//       <Dialog.Root open={attachmentModalOpen} onOpenChange={setAttachmentModalOpen}>
//         <Dialog.Portal>
//           <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[100]" />
//           <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl z-[101] max-w-2xl w-full max-h-[80vh] overflow-y-auto">
//             <Dialog.Title className="text-lg font-semibold mb-4">Attachments</Dialog.Title>
//             <div className="grid gap-4 grid-cols-2">
//               {selectedAttachments.map((file, idx) => {
//                 const fileUrl = file?.url || "";
//                 const isPdf = fileUrl.toLowerCase().endsWith(".pdf");

//                 return (
//                   <a
//                     key={idx}
//                     href={fileUrl}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="block border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition"
//                   >
//                     {isPdf ? (
//                       <div className="flex items-center gap-2">
//                         📄 <span className="text-sm truncate">{file.name || `Attachment ${idx + 1}`}</span>
//                       </div>
//                     ) : (
//                       <img
//                         src={fileUrl}
//                         alt={file.name || `Attachment ${idx + 1}`}
//                         className="w-full h-32 object-contain rounded"
//                       />
//                     )}
//                   </a>
//                 );
//               })}
//             </div>
//             <div className="mt-4 text-right">
//               <button
//                 onClick={() => setAttachmentModalOpen(false)}
//                 className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
//               >
//                 Close
//               </button>
//             </div>
//           </Dialog.Content>
//         </Dialog.Portal>
//       </Dialog.Root>
//     )}

//     {/* PaymentProofsModal (custom) */}
//     {showPaymentProofsModal && selectedPaymentProofs.length > 0 && (
//       <PaymentProofsModal
//         urls={selectedPaymentProofs}
//         onClose={() => setShowPaymentProofsModal(false)}
//       />
//     )}
//   </div>
// );































// components/TaskTableView.tsx
// "use client";

// import React, { useState, useEffect, useMemo, useCallback } from "react";
// import { Task } from "../../types/task";
// import { Note } from "../../../types/note";
// // import { columns } from "./columns"; // your other columns if needed - if you use this, ensure it's compatible
// import HighlightColorDropdown from "../components/HighlightColorDropdown"; // Corrected import based on your instructions
// import { TaskFilters } from "./TaskFilters"; 
// // Import the new TaskFilters component

// import { useUser, UserResource } from "@clerk/nextjs";

// import { format } from "date-fns";
// import * as Dialog from "@radix-ui/react-dialog";
// import {
//   FaDownload,
//   FaSearch,
//   FaEye,
//   FaEyeSlash,
//   FaMapMarkerAlt,
//   FaEdit,
//   FaTimesCircle,
//   FaSpinner,
//   FaRupeeSign,
//   FaCheckCircle,
//   FaReceipt,
//   FaArrowUp,
//   FaArrowDown,
//   FaTimes,
// } from "react-icons/fa";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
// import toast from "react-hot-toast";
// import NotesModal from "../components/NotesModal";
// import Image from "next/image";

// // Define AttachmentType within this file or import if it's in a shared types file
// type AttachmentType = {
//   url: string;
//   name?: string;
// };

// // PaymentProofsModal.tsx (This component is embedded directly within TaskTableView)
// function PaymentProofsModal({
//   urls,
//   onClose,
// }: {
//   urls: string[];
//   onClose: () => void;
// }) {
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);

//   return (
//     <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
//       <div className="bg-white max-w-3xl w-full p-4 rounded shadow-lg relative">
//         <button
//           onClick={() => {
//             if (previewUrl) {
//               setPreviewUrl(null);
//             } else {
//               onClose();
//             }
//           }}
//           className="absolute top-3 right-3 text-gray-600 hover:text-red-500"
//           title={previewUrl ? "Back to list" : "Close modal"}
//         >
//           <FaTimes size={20} />
//         </button>

//         <h2 className="text-xl font-bold mb-4">Payment Proofs</h2>

//         {previewUrl ? (
//           <div className="overflow-auto max-h-[80vh]">
//             {previewUrl.toLowerCase().endsWith(".pdf") ? (
//               <iframe
//                 src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`}
//                 className="w-full h-[70vh] border rounded"
//                 title="PDF Preview"
//               />
//             ) : (
//               <Image
//                 src={previewUrl}
//                 alt="Proof Preview"
//                 width={800}
//                 height={600}
//                 className="max-w-full max-h-[70vh] object-contain mx-auto"
//                 unoptimized
//               />
//             )}
//           </div>
//         ) : (
//           <div className="space-y-4 max-h-[70vh] overflow-y-auto px-2">
//             {urls.filter(url => typeof url === "string").map((url, i) => {
//               const label = url.toLowerCase().endsWith(".pdf") ? "📄 PDF Proof" : "🖼️ Image Proof";
//               return (
//                 <div key={i} className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded shadow-sm">
//                   <span className="text-sm text-gray-700">{label}</span>
//                   <div className="flex gap-3">
//                     <button
//                       onClick={() => setPreviewUrl(url)}
//                       className="text-purple-700 underline hover:text-purple-900 text-sm"
//                     >
//                       👁️ Preview
//                     </button>
//                     <a
//                       href={url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-green-600 underline hover:text-green-800 text-sm"
//                     >
//                       ⬇️ Download
//                     </a>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// interface Props {
//   tasks: Task[];
//   user: UserResource;
//   onTasksUpdate?: (updatedTasks: Task[]) => void;
// }

// export default function TaskTableView({ tasks, user, onTasksUpdate }: Props) {
//   const [editMode, setEditMode] = useState(false);
//   const [editedValues, setEditedValues] = useState<{ [key: string]: number }>({});
//   const [localTasks, setLocalTasks] = useState<Task[]>(tasks || []);
//   const [isSaving, setIsSaving] = useState<string | null>(null);

//   // States moved to TaskFilters, now received as props or managed internally by TaskFilters
//   const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
//   const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

//   const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
//   const [selectedTaskIdForNotes, setSelectedTaskIdForNotes] = useState<string | null>(null);
//   const [notesMap, setNotesMap] = useState<{ [taskId: string]: Note[] }>({});

//   const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
//   const [selectedAttachments, setSelectedAttachments] = useState<AttachmentType[]>([]);

//   const [showPaymentProofsModal, setShowPaymentProofsModal] = useState(false);
//   const [selectedPaymentProofs, setSelectedPaymentProofs] = useState<string[]>([]);

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
//         throw new Error(errorData.error || "Failed to refetch tasks");
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
//       toast.error(`Refetch error: ${err.message || "An unknown error occurred."}`);
//     }
//   };

//   const totalPages = Math.ceil(filteredTasks.length / tasksPerPage); // Use filteredTasks here
//   const paginatedTasks = useMemo(() => {
//     const startIndex = (currentPage - 1) * tasksPerPage;
//     const endIndex = startIndex + tasksPerPage;
//     return filteredTasks.slice(startIndex, endIndex); // Use filteredTasks here
//   }, [filteredTasks, currentPage, tasksPerPage]);

//   const handleTasksPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setTasksPerPage(Number(e.target.value));
//     setCurrentPage(1);
//   };

//   const handlePageChange = (pageNumber: number) => {
//     setCurrentPage(pageNumber);
//   };

//   const handleFilteredTasksChange = useCallback((newFilteredTasks: Task[]) => {
//     setFilteredTasks(newFilteredTasks);
//     setCurrentPage(1); // Reset page when filters change
//   }, []);

//   const handleColumnVisibilityChange = useCallback((newColumns: string[]) => {
//     setVisibleColumns(newColumns);
//   }, []);

//   const handleInputChange = (
//     taskId: string,
//     field: "amount" | "received",
//     value: number
//   ) => {
//     const key = `${taskId}-${field}`;
//     setEditedValues((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleBlur = async (taskId: string, field: "amount" | "received") => {
//     const key = `${taskId}-${field}`;
//     const value = editedValues[key];

//     const originalTask = localTasks.find((t) => t.id === taskId);
//     const originalValue =
//       field === "amount" ? Number(originalTask?.amount) || 0 : Number(originalTask?.received) || 0;

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
//           setEditedValues((prev) => {
//             const newState = { ...prev };
//             delete newState[key];
//             return newState;
//           });
//         }
//       } catch (err: unknown) {
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

//   const formatCurrency = (amount: number | string | undefined): string => {
//     if (typeof amount === "string") {
//       const num = parseFloat(amount);
//       if (!isNaN(num)) return `₹${num.toLocaleString("en-IN")}`;
//     } else if (typeof amount === "number") {
//       return `₹${amount.toLocaleString("en-IN")}`;
//     }
//     return "—";
//   };














//   const pageNumbers = useMemo(() => {
//     const pages = [];
//     const maxPagesToShow = 5;
//     let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
//     let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

//     if (endPage - startPage + 1 < maxPagesToShow) {
//       startPage = Math.max(1, endPage - maxPagesToShow + 1);
//     }
//     if (startPage === 1 && endPage < totalPages) {
//       endPage = Math.min(totalPages, maxPagesToShow);
//     }

//     for (let i = startPage; i <= endPage; i++) {
//       pages.push(i);
//     }
//     return pages;
//   }, [totalPages, currentPage]);

//   return (
//     <div className="bg-white rounded-xl shadow-lg border border-gray-100 mt-6 overflow-hidden">
//       <TaskFilters
//         initialTasks={localTasks}
//         notesMap={notesMap}
//         onFilteredTasksChange={handleFilteredTasksChange}
//         onColumnVisibilityChange={handleColumnVisibilityChange}
//         editMode={editMode}
//         setEditMode={setEditMode}
//       />

//       <div className="overflow-x-auto">
//         <table className="min-w-full table-fixed border-collapse border border-gray-200 text-sm shadow-md rounded-md overflow-hidden">
//           <thead className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0 z-10">
//             <tr>
//               {visibleColumns.includes("rowNumber") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-12">
//                   S. No.
//                 </th>
//               )}
//               {visibleColumns.includes("highlightColor") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-24">
//                   Highlight
//                 </th>
//               )}
//               {visibleColumns.includes("title") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
//                   Title
//                 </th>
//               )}
//               {visibleColumns.includes("createdAt") && (
//                 <th
//                   className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-36 cursor-pointer"
//                   // Sorting logic is now in TaskFilters. We remove onClick from here
//                 >
//                   <div className="flex items-center">
//                     📅 Created {/* getSortIcon("createdAt") */}
//                   </div>
//                 </th>
//               )}
//               {visibleColumns.includes("assignerName") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-48">
//                   Assigned By → To
//                 </th>
//               )}
//               {visibleColumns.includes("shopName") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-40">
//                   🏪 Shop Name
//                 </th>
//               )}
//               {visibleColumns.includes("location") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
//                   📍 Location
//                 </th>
//               )}
//               {visibleColumns.includes("phone") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
//                   📞 Phone
//                 </th>
//               )}
//               {visibleColumns.includes("email") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-40">
//                   📧 Email
//                 </th>
//               )}
//               {visibleColumns.includes("status") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
//                   Status
//                 </th>
//               )}
//               {visibleColumns.includes("notes") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
//                   📝 Notes
//                 </th>
//               )}
//               {visibleColumns.includes("amount") && (
//                 <th
//                   className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
//                   // Sorting logic is now in TaskFilters. We remove onClick from here
//                 >
//                   <div className="flex items-center justify-end">
//                     <FaRupeeSign className="mr-1" /> Amount {/* getSortIcon("amount") */}
//                   </div>
//                 </th>
//               )}
//               {visibleColumns.includes("amountReceived") && (
//                 <th
//                   className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
//                   // Sorting logic is now in TaskFilters. We remove onClick from here
//                 >
//                   <div className="flex items-center justify-end">
//                     <FaCheckCircle className="mr-1 text-emerald-600" /> Received{" "}
//                     {/* getSortIcon("amountReceived") */}
//                   </div>
//                 </th>
//               )}
//               {visibleColumns.includes("pendingAmount") && (
//                 <th
//                   className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
//                   // Sorting logic is now in TaskFilters. We remove onClick from here
//                 >
//                   <div className="flex items-center justify-end">
//                     <FaReceipt className="mr-1 text-rose-600" /> Pending{" "}
//                     {/* getSortIcon("pendingAmount") */}
//                   </div>
//                 </th>
//               )}
//               {visibleColumns.includes("attachments") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
//                   📎 Attachments
//                 </th>
//               )}
//               {visibleColumns.includes("paymentProofs") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-32">
//                   🧾 Payment Proofs
//                 </th>
//               )}
//             </tr>
//           </thead>

//           <tbody className="bg-white">
//             {paginatedTasks.length === 0 ? (
//               <tr>
//                 <td colSpan={visibleColumns.length} className="text-center px-4 py-8 text-gray-500 text-base">
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
//             ) : (
//               paginatedTasks.map((task, index) => {
//                 const amount = Number(task.amount) || 0;
//                 const received = Number(task.received) || 0;
//                 const pending = amount - received;
//                 const rowNumber = (currentPage - 1) * tasksPerPage + index + 1;
//                 const hasNotes = (notesMap[task.id]?.length || 0) > 0;

//                 return (
//                   <tr
//                     key={task.id}
//                     style={{
//                       backgroundColor: task.highlightColor || "transparent",
//                     }}
//                     className="h-12 hover:bg-blue-50 transition-all duration-150 ease-in-out"
//                   >
//                     {visibleColumns.includes("rowNumber") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center text-gray-700 font-medium">
//                         {rowNumber}
//                       </td>
//                     )}

//                     {visibleColumns.includes("highlightColor") && (
//                       <td className="p-2 border border-gray-200">
//                         <HighlightColorDropdown // Corrected component name here
//                           taskId={task.id}
//                           value={task.highlightColor}
//                           onChange={async (newColor) => {
//                             try {
//                               await fetch(`/api/tasks/${task.id}`, {
//                                 method: "PATCH",
//                                 headers: { "Content-Type": "application/json" },
//                                 body: JSON.stringify({ highlightColor: newColor }),
//                               });

//                               setLocalTasks((prev) => // Updated to setLocalTasks
//                                 prev.map((t) =>
//                                   t.id === task.id ? { ...t, highlightColor: newColor } : t
//                                 )
//                               );
//                               // Potentially re-filter tasks if highlight color affects filters
//                               handleFilteredTasksChange(
//                                 localTasks.map((t) =>
//                                   t.id === task.id ? { ...t, highlightColor: newColor } : t
//                                 )
//                               );
//                             } catch (error) {
//                               console.error("Error updating highlight color:", error);
//                               toast.error("Failed to update highlight color.");
//                             }
//                           }}
//                         />
//                       </td>
//                     )}
//                     {visibleColumns.includes("title") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left font-medium text-gray-900">
//                         {task.title}
//                       </td>
//                     )}
//                     {visibleColumns.includes("createdAt") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-600">
//                         {task.createdAt ? format(new Date(task.createdAt), "dd MMM, HH:mm") : "—"}
//                       </td>
//                     )}
//                     {visibleColumns.includes("assignerName") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
//                         <span className="font-semibold text-gray-800">{task.assignerName || "—"}</span>{" "}
//                         <span className="text-blue-500">→</span>{" "}
//                         <span className="text-blue-600 font-medium">
//                           {Array.isArray(task.assignees) && task.assignees.length > 0
//                             ? task.assignees.map((a) => a?.name || a?.email || "—").filter(Boolean).join(", ")
//                             : task.assigneeEmail || "—"}
//                         </span>
//                       </td>
//                     )}
//                     {visibleColumns.includes("shopName") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-700">
//                         {task.customFields?.shopName || "—"}
//                       </td>
//                     )}
//                     {visibleColumns.includes("location") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                         {task.customFields?.location ? (
//                           <a
//                             href={String(task.customFields?.location || "")}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
//                           >
//                             <FaMapMarkerAlt className="text-blue-500" /> View
//                           </a>
//                         ) : (
//                           <span className="text-gray-400">—</span>
//                         )}
//                       </td>
//                     )}
//                     {visibleColumns.includes("phone") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
//                         {task.customFields?.phone || "—"}
//                       </td>
//                     )}
//                     {visibleColumns.includes("email") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
//                         {task.customFields?.email || "—"}
//                       </td>
//                     )}
//                     {visibleColumns.includes("status") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                         <span
//                           className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                             task.status === "Completed"
//                               ? "bg-green-100 text-green-800"
//                               : task.status === "Pending"
//                               ? "bg-yellow-100 text-yellow-800"
//                               : "bg-gray-100 text-gray-800"
//                           }`}
//                         >
//                           {task.status}
//                         </span>
//                       </td>
//                     )}
//                     {visibleColumns.includes("notes") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                         <button
//                           onClick={() => {
//                             setSelectedTaskIdForNotes(task.id);
//                             setIsNoteModalOpen(true);
//                           }}
//                           className={`text-blue-600 hover:underline text-sm flex items-center gap-1 ${
//                             hasNotes ? "font-semibold" : "text-gray-500"
//                           }`}
//                         >
//                           <span className="text-xs">📝</span> {hasNotes ? `View Notes (${notesMap[task.id].length})` : "Add Note"}
//                         </button>
//                       </td>
//                     )}




//                     {visibleColumns.includes("amount") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right">
//                         {editMode ? (
//                           <div className="relative">
//                             <input
//                               type="number"
//                               value={
//                                 editedValues[`${task.id}-amount`] !== undefined
//                                   ? editedValues[`${task.id}-amount`]
//                                   : amount
//                               }
//                               onChange={(e) => handleInputChange(task.id, "amount", parseFloat(e.target.value))}
//                               onBlur={(e) => handleBlur(task.id, "amount")}
//                               className="w-full p-1 border border-gray-300 rounded-md text-right text-gray-900 focus:ring-blue-500 focus:border-blue-500 text-sm"
//                             />
//                             {isSaving === `${task.id}-amount` && (
//                               <FaSpinner className="absolute right-2 top-1/2 transform -translate-y-1/2 animate-spin text-blue-500" />
//                             )}
//                           </div>
//                         ) : (
//                           <span className="text-gray-800 font-medium">{formatCurrency(amount)}</span>
//                         )}
//                       </td>
//                     )}
//                     {visibleColumns.includes("amountReceived") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right">
//                         {editMode ? (
//                           <div className="relative">
//                             <input
//                               type="number"
//                               value={
//                                 editedValues[`${task.id}-received`] !== undefined
//                                   ? editedValues[`${task.id}-received`]
//                                   : received
//                               }
//                               onChange={(e) => handleInputChange(task.id, "received", parseFloat(e.target.value))}
//                               onBlur={(e) => handleBlur(task.id, "received")}
//                               className="w-full p-1 border border-gray-300 rounded-md text-right text-gray-900 focus:ring-blue-500 focus:border-blue-500 text-sm"
//                             />
//                             {isSaving === `${task.id}-received` && (
//                               <FaSpinner className="absolute right-2 top-1/2 transform -translate-y-1/2 animate-spin text-blue-500" />
//                             )}
//                           </div>
//                         ) : (
//                           <span className="text-emerald-700 font-medium">{formatCurrency(received)}</span>
//                         )}
//                       </td>
//                     )}
//                     {visibleColumns.includes("pendingAmount") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right">
//                         <span className="text-rose-700 font-medium">{formatCurrency(pending)}</span>
//                       </td>
//                     )}
//                     {visibleColumns.includes("attachments") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                         {task.attachments && task.attachments.length > 0 ? (
//                           <button
//                             onClick={() => {
//                               setSelectedAttachments(
//                                 task.attachments?.map((att: string | AttachmentType) =>
//                                   typeof att === "string" ? { url: att } : att
//                                 ) || []
//                               );
//                               setAttachmentModalOpen(true);
//                             }}
//                             className="text-blue-600 hover:underline text-sm"
//                           >
//                             View {task.attachments.length} Attachment(s)
//                           </button>
//                         ) : (
//                           <span className="text-gray-400">—</span>
//                         )}
//                       </td>
//                     )}
//                     {visibleColumns.includes("paymentProofs") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center">
//                         {task.paymentProofs && task.paymentProofs.length > 0 ? (
//                           <button
//                             onClick={() => {
//                               setSelectedPaymentProofs(
//                                 task.paymentProofs?.map((proof: string | AttachmentType) =>
//                                   typeof proof === "string" ? proof : proof.url
//                                 ) || []
//                               );
//                               setShowPaymentProofsModal(true);
//                             }}
//                             className="text-purple-600 hover:underline text-sm"
//                           >
//                             View {task.paymentProofs.length} Proof(s)
//                           </button>
//                         ) : (
//                           <span className="text-gray-400">—</span>
//                         )}
//                       </td>
//                     )}
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Pagination */}
//       <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
//         <div className="flex items-center gap-2 text-sm text-gray-700">
//           Rows per page:
//           <select
//             value={tasksPerPage}
//             onChange={handleTasksPerPageChange}
//             className="p-1 border border-gray-300 rounded-md"
//           >
//             <option value={10}>10</option>
//             <option value={20}>20</option>
//             <option value={50}>50</option>
//             <option value={100}>100</option>
//           </select>
//         </div>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => handlePageChange(1)}
//             disabled={currentPage === 1}
//             className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
//           >
//             First
//           </button>
//           <button
//             onClick={() => handlePageChange(currentPage - 1)}
//             disabled={currentPage === 1}
//             className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
//           >
//             Previous
//           </button>
//           {pageNumbers.map((page) => (
//             <button
//               key={page}
//               onClick={() => handlePageChange(page)}
//               className={`px-3 py-1 rounded-md text-sm ${
//                 currentPage === page
//                   ? "bg-blue-600 text-white"
//                   : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
//               }`}
//             >
//               {page}
//             </button>
//           ))}
//           <button
//             onClick={() => handlePageChange(currentPage + 1)}
//             disabled={currentPage === totalPages}
//             className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
//           >
//             Next
//           </button>
//           <button
//             onClick={() => handlePageChange(totalPages)}
//             disabled={currentPage === totalPages}
//             className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
//           >
//             Last
//           </button>
//         </div>
//       </div>

//       {isNoteModalOpen && selectedTaskIdForNotes && (
//         <NotesModal
//           taskId={selectedTaskIdForNotes}
//           initialNotes={notesMap[selectedTaskIdForNotes] || []}
//           onClose={() => setIsNoteModalOpen(false)}
//           onSaveSuccess={async (newNotes) => {
//             setNotesMap((prev) => ({
//               ...prev,
//               [selectedTaskIdForNotes]: newNotes,
//             }));
//             await refetchTasks(); // Refresh tasks to ensure data consistency
//           }}
//         />
//       )}

//       {attachmentModalOpen && (
//         <Dialog.Root open={attachmentModalOpen} onOpenChange={setAttachmentModalOpen}>
//           <Dialog.Portal>
//             <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]" />
//             <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full z-[100] max-h-[90vh] overflow-y-auto">
//               <Dialog.Title className="text-xl font-bold mb-4">Attachments</Dialog.Title>
//               <div className="space-y-4">
//                 {selectedAttachments.length > 0 ? (
//                   selectedAttachments.map((attachment, idx) => (
//                     <div
//                       key={idx}
//                       className="flex items-center justify-between bg-gray-100 p-3 rounded-md shadow-sm"
//                     >
//                       <span className="text-gray-700 text-sm font-medium">
//                         {attachment.name || `Attachment ${idx + 1}`}
//                       </span>
//                       <a
//                         href={attachment.url}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="text-blue-600 hover:underline text-sm"
//                       >
//                         View/Download
//                       </a>
//                     </div>
//                   ))
//                 ) : (
//                   <p className="text-gray-500 text-center">No attachments available.</p>
//                 )}
//               </div>
//               <Dialog.Close asChild>
//                 <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
//                   <FaTimes size={20} />
//                 </button>
//               </Dialog.Close>
//             </Dialog.Content>
//           </Dialog.Portal>
//         </Dialog.Root>
//       )}

//       {showPaymentProofsModal && (
//         <PaymentProofsModal
//           urls={selectedPaymentProofs}
//           onClose={() => setShowPaymentProofsModal(false)}
//         />
//       )}
//     </div>
//   );
// }















// // components/TaskTableView.tsx
// "use client";

// import React, { useState, useEffect, useMemo, useCallback } from "react";
// import { Task } from "../../types/task";
// import { Note } from "../../../types/note";
// // import { columns } from "./columns"; // your other columns if needed - if you use this, ensure it's compatible
// import HighlightColorDropdown from "../components/HighlightColorDropdown"; // Corrected import based on your instructions

// import { TaskFilters } from "./TaskFilters"; // Import the new TaskFilters component
// // import { EditAmountModal } from "./EditAmountModal";
// import  CopyIcon  from "../components/CopyIcon"; // adjust the path based on your folder structure


// import { useUser, UserResource } from "@clerk/nextjs";

// import { format } from "date-fns";
// import * as Dialog from "@radix-ui/react-dialog";
// import {
//   FaDownload,
//   FaSearch,
//   FaEye,
//   FaEyeSlash,
//   FaMapMarkerAlt,
//   FaEdit,
//   FaTimesCircle,
//   FaSpinner,
//   FaRupeeSign,
//   FaCheckCircle,
//   FaReceipt,
//   FaArrowUp,
//   FaArrowDown,
//   FaTimes,
// } from "react-icons/fa";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
// import toast from "react-hot-toast";
// import NotesModal from "../components/NotesModal";
// import  CopyTaskDetailsIcon  from "../components/CopyTaskDetailsIcon";



// import Image from "next/image";

// // Define AttachmentType within this file or import if it's in a shared types file
// type AttachmentType = {
//   url: string;
//   name?: string;
// };

// // PaymentProofsModal.tsx (This component is embedded directly within TaskTableView)
// function PaymentProofsModal({
//   urls,
//   onClose,
// }: {
//   urls: string[];
//   onClose: () => void;
// }) {
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);

//   return (
//     <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
//       <div className="bg-white max-w-3xl w-full p-4 rounded shadow-lg relative">
//         <button
//           onClick={() => {
//             if (previewUrl) {
//               setPreviewUrl(null);
//             } else {
//               onClose();
//             }
//           }}
//           className="absolute top-3 right-3 text-gray-600 hover:text-red-500"
//           title={previewUrl ? "Back to list" : "Close modal"}
//         >
//           <FaTimes size={20} />
//         </button>

//         <h2 className="text-xl font-bold mb-4">Payment Proofs</h2>

//         {previewUrl ? (
//           <div className="overflow-auto max-h-[80vh]">
//             {previewUrl.toLowerCase().endsWith(".pdf") ? (
//               <iframe
//                 src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`}
//                 className="w-full h-[70vh] border rounded"
//                 title="PDF Preview"
//               />
//             ) : (
//               <Image
//                 src={previewUrl}
//                 alt="Proof Preview"
//                 width={800}
//                 height={600}
//                 className="max-w-full max-h-[70vh] object-contain mx-auto"
//                 unoptimized
//               />
//             )}
//           </div>
//         ) : (
//           <div className="space-y-4 max-h-[70vh] overflow-y-auto px-2">
//             {urls.filter(url => typeof url === "string").map((url, i) => {
//               const label = url.toLowerCase().endsWith(".pdf") ? "📄 PDF Proof" : "🖼️ Image Proof";
//               return (
//                 <div key={i} className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded shadow-sm">
//                   <span className="text-sm text-gray-700">{label}</span>
//                   <div className="flex gap-3">
//                     <button
//                       onClick={() => setPreviewUrl(url)}
//                       className="text-purple-700 underline hover:text-purple-900 text-sm"
//                     >
//                       👁️ Preview
//                     </button>
//                     <a
//                       href={url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-green-600 underline hover:text-green-800 text-sm"
//                     >
//                       ⬇️ Download
//                     </a>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// interface Props {
//   tasks: Task[];
//   user: UserResource;
//   onTasksUpdate?: (updatedTasks: Task[]) => void;
// }

// export default function TaskTableView({ tasks, user, onTasksUpdate }: Props) {
//   const [editMode, setEditMode] = useState(false);
//   const [editedValues, setEditedValues] = useState<{ [key: string]: number }>({});
//   const [localTasks, setLocalTasks] = useState<Task[]>(tasks || []);
//   const [isSaving, setIsSaving] = useState<string | null>(null);

//   // States moved to TaskFilters, now received as props or managed internally by TaskFilters
//   const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
//   const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

//   const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
//   const [selectedTaskIdForNotes, setSelectedTaskIdForNotes] = useState<string | null>(null);
//   const [notesMap, setNotesMap] = useState<{ [taskId: string]: Note[] }>({});

//   const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
//   const [selectedAttachments, setSelectedAttachments] = useState<AttachmentType[]>([]);

//   const [showPaymentProofsModal, setShowPaymentProofsModal] = useState(false);
//   const [selectedPaymentProofs, setSelectedPaymentProofs] = useState<string[]>([]);

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
//         throw new Error(errorData.error || "Failed to refetch tasks");
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
//       toast.error(`Refetch error: ${err.message || "An unknown error occurred."}`);
//     }
//   };

//   const totalPages = Math.ceil(filteredTasks.length / tasksPerPage); // Use filteredTasks here
//   const paginatedTasks = useMemo(() => {
//     const startIndex = (currentPage - 1) * tasksPerPage;
//     const endIndex = startIndex + tasksPerPage;
//     return filteredTasks.slice(startIndex, endIndex); // Use filteredTasks here
//   }, [filteredTasks, currentPage, tasksPerPage]);

//   const handleTasksPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setTasksPerPage(Number(e.target.value));
//     setCurrentPage(1);
//   };

//   const handlePageChange = (pageNumber: number) => {
//     setCurrentPage(pageNumber);
//   };

//   const handleFilteredTasksChange = useCallback((newFilteredTasks: Task[]) => {
//     setFilteredTasks(newFilteredTasks);
//     setCurrentPage(1); // Reset page when filters change
//   }, []);

//   const handleColumnVisibilityChange = useCallback((newColumns: string[]) => {
//     setVisibleColumns(newColumns);
//   }, []);

//   const handleInputChange = (
//     taskId: string,
//     field: "amount" | "received",
//     value: number
//   ) => {
//     const key = `${taskId}-${field}`;
//     setEditedValues((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleBlur = async (taskId: string, field: "amount" | "received") => {
//     const key = `${taskId}-${field}`;
//     const value = editedValues[key];

//     const originalTask = localTasks.find((t) => t.id === taskId);
//     const originalValue =
//       field === "amount" ? Number(originalTask?.amount) || 0 : Number(originalTask?.received) || 0;

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
//           setEditedValues((prev) => {
//             const newState = { ...prev };
//             delete newState[key];
//             return newState;
//           });
//         }
//       } catch (err: unknown) {
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

//   const formatCurrency = (amount: number | string | undefined): string => {
//     if (typeof amount === "string") {
//       const num = parseFloat(amount);
//       if (!isNaN(num)) return `₹${num.toLocaleString("en-IN")}`;
//     } else if (typeof amount === "number") {
//       return `₹${amount.toLocaleString("en-IN")}`;
//     }
//     return "—";
//   };














//   const pageNumbers = useMemo(() => {
//     const pages = [];
//     const maxPagesToShow = 5;
//     let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
//     let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

//     if (endPage - startPage + 1 < maxPagesToShow) {
//       startPage = Math.max(1, endPage - maxPagesToShow + 1);
//     }
//     if (startPage === 1 && endPage < totalPages) {
//       endPage = Math.min(totalPages, maxPagesToShow);
//     }

//     for (let i = startPage; i <= endPage; i++) {
//       pages.push(i);
//     }
//     return pages;
//   }, [totalPages, currentPage]);

//   return (
//     <div className="bg-white rounded-xl shadow-lg border border-gray-100 mt-6 overflow-hidden">
//       <TaskFilters
//         initialTasks={localTasks}
//         notesMap={notesMap}
//         onFilteredTasksChange={handleFilteredTasksChange}
//         onColumnVisibilityChange={handleColumnVisibilityChange}
//         editMode={editMode}
//         setEditMode={setEditMode}
//       />

//       <div className="overflow-x-auto">
//         <table className="min-w-full table-fixed border-collapse border border-gray-200 text-sm shadow-md rounded-md overflow-hidden">
//           <thead className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0 z-10">
//             <tr>
//               {visibleColumns.includes("rowNumber") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-12">
//                   S. No.
//                 </th>
//               )}
//               {visibleColumns.includes("highlightColor") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-24">
//                   Highlight
//                 </th>
//               )}
//                {visibleColumns.includes("copy") && (
//                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-12">
//               📋 Copy
//               </th>
//                 )}
//               {visibleColumns.includes("title") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
//                   Title
//                 </th>
//               )}
//               {visibleColumns.includes("createdAt") && (
//                 <th
//                   className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-36 cursor-pointer"
//                   // Sorting logic is now in TaskFilters. We remove onClick from here
//                 >
//                   <div className="flex items-center">
//                     📅 Created {/* getSortIcon("createdAt") */}
//                   </div>
//                 </th>
//               )}
//               {visibleColumns.includes("assignerName") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-48">
//                   Assigned By → To
//                 </th>
//               )}
//               {visibleColumns.includes("shopName") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-40">
//                   🏪 Shop Name
//                 </th>
//               )}
//               {visibleColumns.includes("location") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
//                   📍 Location
//                 </th>
//               )}
//               {visibleColumns.includes("phone") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
//                   📞 Phone
//                 </th>
//               )}
//               {visibleColumns.includes("email") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-40">
//                   📧 Email
//                 </th>
//               )}
//               {visibleColumns.includes("status") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
//                   Status
//                 </th>
//               )}
//               {visibleColumns.includes("notes") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
//                   📝 Notes
//                 </th>
//               )}
//               {visibleColumns.includes("amount") && (
//                 <th
//                   className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
//                   // Sorting logic is now in TaskFilters. We remove onClick from here
//                 >
//                   <div className="flex items-center justify-end">
//                     <FaRupeeSign className="mr-1" /> Amount {/* getSortIcon("amount") */}
//                   </div>
//                 </th>
//               )}
//               {visibleColumns.includes("amountReceived") && (
//                 <th
//                   className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
//                   // Sorting logic is now in TaskFilters. We remove onClick from here
//                 >
//                   <div className="flex items-center justify-end">
//                     <FaCheckCircle className="mr-1 text-emerald-600" /> Received{" "}
//                     {/* getSortIcon("amountReceived") */}
//                   </div>
//                 </th>
//               )}
//               {visibleColumns.includes("pendingAmount") && (
//                 <th
//                   className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer"
//                   // Sorting logic is now in TaskFilters. We remove onClick from here
//                 >
//                   <div className="flex items-center justify-end">
//                     <FaReceipt className="mr-1 text-rose-600" /> Pending{" "}
//                     {/* getSortIcon("pendingAmount") */}
//                   </div>
//                 </th>
//               )}


//               {visibleColumns.includes("attachments") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
//                   📎 Attachments
//                 </th>
//               )}
//               {visibleColumns.includes("paymentProofs") && (
//                 <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-32">
//                   🧾 Payment Proofs
//                 </th>
//               )}
//             </tr>
//           </thead>


//           {visibleColumns.includes("copy") && (
//   <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center">
//     <CopyTaskDetailsIcon
//       amount={amount}
//       received={received}
//       pending={pending}
//       createdAt={
//         task.createdAt
//           ? format(new Date(task.createdAt), "dd MMM, HH:mm")
//           : "—"
//       }
//     />
//   </td>
// )}


//           <tbody className="bg-white">
//             {paginatedTasks.length === 0 ? (
//               <tr>
//                 <td colSpan={visibleColumns.length} className="text-center px-4 py-8 text-gray-500 text-base">
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
//             ) : (
//               paginatedTasks.map((task, index) => {
//                 const amount = Number(task.amount) || 0;
//                 const received = Number(task.received) || 0;
//                 const pending = amount - received;
//                 const rowNumber = (currentPage - 1) * tasksPerPage + index + 1;
//                 const hasNotes = (notesMap[task.id]?.length || 0) > 0;

//                 return (
//                   <tr
//                     key={task.id}
//                     style={{
//                       backgroundColor: task.highlightColor || "transparent",
//                     }}
//                     className="h-12 hover:bg-blue-50 transition-all duration-150 ease-in-out"
//                   >
//                     {visibleColumns.includes("rowNumber") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center text-gray-700 font-medium">
//                         {rowNumber}
//                       </td>
//                     )}

//                     {visibleColumns.includes("highlightColor") && (
//                       <td className="p-2 border border-gray-200">
//                         <HighlightColorDropdown // Corrected component name here
//                           taskId={task.id}
//                           value={task.highlightColor}
//                           onChange={async (newColor) => {
//                             try {
//                               await fetch(`/api/tasks/${task.id}`, {
//                                 method: "PATCH",
//                                 headers: { "Content-Type": "application/json" },
//                                 body: JSON.stringify({ highlightColor: newColor }),
//                               });

//                               setLocalTasks((prev) => // Updated to setLocalTasks
//                                 prev.map((t) =>
//                                   t.id === task.id ? { ...t, highlightColor: newColor } : t
//                                 )
//                               );
//                               // Potentially re-filter tasks if highlight color affects filters
//                               handleFilteredTasksChange(
//                                 localTasks.map((t) =>
//                                   t.id === task.id ? { ...t, highlightColor: newColor } : t
//                                 )
//                               );
//                             } catch (error) {
//                               console.error("Error updating highlight color:", error);
//                               toast.error("Failed to update highlight color.");
//                             }
//                           }}
//                         />
//                       </td>
//                     )}
//                     {visibleColumns.includes("title") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left font-medium text-gray-900">
//                         {task.title}
//                       </td>
//                     )}
//                     {visibleColumns.includes("createdAt") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-600">
//                         {task.createdAt ? format(new Date(task.createdAt), "dd MMM, HH:mm") : "—"}
//                       </td>
//                     )}
//                     {visibleColumns.includes("assignerName") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
//                         <span className="font-semibold text-gray-800">{task.assignerName || "—"}</span>{" "}
//                         <span className="text-blue-500">→</span>{" "}
//                         <span className="text-blue-600 font-medium">
//                           {Array.isArray(task.assignees) && task.assignees.length > 0
//                             ? task.assignees.map((a) => a?.name || a?.email || "—").filter(Boolean).join(", ")
//                             : task.assigneeEmail || "—"}
//                         </span>
//                       </td>
//                     )}
//                     {visibleColumns.includes("shopName") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-700">
//                         {task.customFields?.shopName || "—"}
//                       </td>
//                     )}
//                     {visibleColumns.includes("location") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                         {task.customFields?.location ? (
//                           <a
//                             href={String(task.customFields?.location || "")}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
//                           >
//                             <FaMapMarkerAlt className="text-blue-500" /> View
//                           </a>
//                         ) : (
//                           <span className="text-gray-400">—</span>
//                         )}
//                       </td>
//                     )}
//                     {visibleColumns.includes("phone") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
//                         {task.customFields?.phone || "—"}
//                       </td>
//                     )}
//                     {visibleColumns.includes("email") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
//                         {task.customFields?.email || "—"}
//                       </td>
//                     )}
//                     {visibleColumns.includes("status") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                         <span
//                           className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                             task.status === "Completed"
//                               ? "bg-green-100 text-green-800"
//                               : task.status === "Pending"
//                               ? "bg-yellow-100 text-yellow-800"
//                               : "bg-gray-100 text-gray-800"
//                           }`}
//                         >
//                           {task.status}
//                         </span>
//                       </td>
//                     )}
//                     {visibleColumns.includes("notes") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                         <button
//                           onClick={() => {
//                             setSelectedTaskIdForNotes(task.id);
//                             setIsNoteModalOpen(true);
//                           }}
//                           className={`text-blue-600 hover:underline text-sm flex items-center gap-1 ${
//                             hasNotes ? "font-semibold" : "text-gray-500"
//                           }`}
//                         >
//                           <span className="text-xs">📝</span> {hasNotes ? `View Notes (${notesMap[task.id].length})` : "Add Note"}
//                         </button>
//                       </td>
//                     )}
//                     {visibleColumns.includes("amount") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right">
//                         {editMode ? (
//                           <div className="relative">
//                             <input
//                               type="number"
//                               value={
//                                 editedValues[`${task.id}-amount`] !== undefined
//                                   ? editedValues[`${task.id}-amount`]
//                                   : amount
//                               }
//                               onChange={(e) => handleInputChange(task.id, "amount", parseFloat(e.target.value))}
//                               onBlur={(e) => handleBlur(task.id, "amount")}
//                               className="w-full p-1 border border-gray-300 rounded-md text-right text-gray-900 focus:ring-blue-500 focus:border-blue-500 text-sm"
//                             />
//                             {isSaving === `${task.id}-amount` && (
//                               <FaSpinner className="absolute right-2 top-1/2 transform -translate-y-1/2 animate-spin text-blue-500" />
//                             )}
//                           </div>
//                         ) : (
//                           <span className="text-gray-800 font-medium">{formatCurrency(amount)}</span>
//                         )}
//                       </td>
//                     )}
//                     {visibleColumns.includes("amountReceived") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right">
//                         {editMode ? (
//                           <div className="relative">
//                             <input
//                               type="number"
//                               value={
//                                 editedValues[`${task.id}-received`] !== undefined
//                                   ? editedValues[`${task.id}-received`]
//                                   : received
//                               }
//                               onChange={(e) => handleInputChange(task.id, "received", parseFloat(e.target.value))}
//                               onBlur={(e) => handleBlur(task.id, "received")}
//                               className="w-full p-1 border border-gray-300 rounded-md text-right text-gray-900 focus:ring-blue-500 focus:border-blue-500 text-sm"
//                             />
//                             {isSaving === `${task.id}-received` && (
//                               <FaSpinner className="absolute right-2 top-1/2 transform -translate-y-1/2 animate-spin text-blue-500" />
//                             )}
//                           </div>
//                         ) : (
//                           <span className="text-emerald-700 font-medium">{formatCurrency(received)}</span>
//                         )}
//                       </td>
//                     )}
































//                     {visibleColumns.includes("pendingAmount") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right">
//                         <span className="text-rose-700 font-medium">{formatCurrency(pending)}</span>
//                       </td>
//                     )}
//                     {visibleColumns.includes("attachments") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
//                         {task.attachments && task.attachments.length > 0 ? (
//                           <button
//                             onClick={() => {
//                               setSelectedAttachments(
//                                 task.attachments?.map((att: string | AttachmentType) =>
//                                   typeof att === "string" ? { url: att } : att
//                                 ) || []
//                               );
//                               setAttachmentModalOpen(true);
//                             }}
//                             className="text-blue-600 hover:underline text-sm"
//                           >
//                             View {task.attachments.length} Attachment(s)
//                           </button>
//                         ) : (
//                           <span className="text-gray-400">—</span>
//                         )}
//                       </td>
//                     )}
//                     {visibleColumns.includes("paymentProofs") && (
//                       <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center">
//                         {task.paymentProofs && task.paymentProofs.length > 0 ? (
//                           <button
//                             onClick={() => {
//                               setSelectedPaymentProofs(
//                                 task.paymentProofs?.map((proof: string | AttachmentType) =>
//                                   typeof proof === "string" ? proof : proof.url
//                                 ) || []
//                               );
//                               setShowPaymentProofsModal(true);
//                             }}
//                             className="text-purple-600 hover:underline text-sm"
//                           >
//                             View {task.paymentProofs.length} Proof(s)
//                           </button>
//                         ) : (
//                           <span className="text-gray-400">—</span>
//                         )}
//                       </td>
//                     )}

//                     {visibleColumns.includes("copy") && (
//   <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center">
//     <button
//       onClick={() => {
//         const createdAt = task.createdAt
//           ? format(new Date(task.createdAt), "dd MMM, yyyy HH:mm")
//           : "N/A";

//         const textToCopy = `
// Task: ${task.title}
// Amount: ₹${amount}
// Received: ₹${received}
// Pending: ₹${pending}
// Date: ${createdAt}
//         `.trim();

//         navigator.clipboard.writeText(textToCopy)
//           .then(() => toast.success("Copied to clipboard!"))
//           .catch(() => toast.error("Failed to copy."));
//       }}
//       className="text-blue-600 hover:text-blue-800"
//       title="Copy Task Details"
//     >
//       📋
//     </button>
//   </td>
// )}

//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Pagination */}
//       <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
//         <div className="flex items-center gap-2 text-sm text-gray-700">
//           Rows per page:
//           <select
//             value={tasksPerPage}
//             onChange={handleTasksPerPageChange}
//             className="p-1 border border-gray-300 rounded-md"
//           >
//             <option value={10}>10</option>
//             <option value={20}>20</option>
//             <option value={50}>50</option>
//             <option value={100}>100</option>
//           </select>
//         </div>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => handlePageChange(1)}
//             disabled={currentPage === 1}
//             className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
//           >
//             First
//           </button>
//           <button
//             onClick={() => handlePageChange(currentPage - 1)}
//             disabled={currentPage === 1}
//             className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
//           >
//             Previous
//           </button>
//           {pageNumbers.map((page) => (
//             <button
//               key={page}
//               onClick={() => handlePageChange(page)}
//               className={`px-3 py-1 rounded-md text-sm ${
//                 currentPage === page
//                   ? "bg-blue-600 text-white"
//                   : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
//               }`}
//             >
//               {page}
//             </button>
//           ))}
//           <button
//             onClick={() => handlePageChange(currentPage + 1)}
//             disabled={currentPage === totalPages}
//             className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
//           >
//             Next
//           </button>
//           <button
//             onClick={() => handlePageChange(totalPages)}
//             disabled={currentPage === totalPages}
//             className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
//           >
//             Last
//           </button>
//         </div>
//       </div>

//       {isNoteModalOpen && selectedTaskIdForNotes && (
//         <NotesModal
//           taskId={selectedTaskIdForNotes}
//           initialNotes={notesMap[selectedTaskIdForNotes] || []}
//           onClose={() => setIsNoteModalOpen(false)}
//           onSaveSuccess={async (newNotes) => {
//             setNotesMap((prev) => ({
//               ...prev,
//               [selectedTaskIdForNotes]: newNotes,
//             }));
//             await refetchTasks(); // Refresh tasks to ensure data consistency
//           }}
//         />
//       )}

//       {attachmentModalOpen && (
//         <Dialog.Root open={attachmentModalOpen} onOpenChange={setAttachmentModalOpen}>
//           <Dialog.Portal>
//             <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]" />
//             <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full z-[100] max-h-[90vh] overflow-y-auto">
//               <Dialog.Title className="text-xl font-bold mb-4">Attachments</Dialog.Title>
//               <div className="space-y-4">
//                 {selectedAttachments.length > 0 ? (
//                   selectedAttachments.map((attachment, idx) => (
//                     <div
//                       key={idx}
//                       className="flex items-center justify-between bg-gray-100 p-3 rounded-md shadow-sm"
//                     >
//                       <span className="text-gray-700 text-sm font-medium">
//                         {attachment.name || `Attachment ${idx + 1}`}
//                       </span>
//                       <a
//                         href={attachment.url}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="text-blue-600 hover:underline text-sm"
//                       >
//                         View/Download
//                       </a>
//                     </div>
//                   ))
//                 ) : (
//                   <p className="text-gray-500 text-center">No attachments available.</p>
//                 )}
//               </div>
//               <Dialog.Close asChild>
//                 <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
//                   <FaTimes size={20} />
//                 </button>
//               </Dialog.Close>
//             </Dialog.Content>
//           </Dialog.Portal>
//         </Dialog.Root>
//       )}


//    {/* {tasks.map((task) => (
//   <tr key={task.id}>
//     <td>{task.title}</td>
//     <td>{task.amount}</td>
//     <td>{task.received}</td>
//     <td>{task.pending}</td>
//     <td>
//       <CopyIcon
//         amount={task.amount}
//         received={task.received}
//         pending={task.pending}
//         updatedAt={task.updatedAt}
//       />
//     </td>
//   </tr>
// ))} */}


//       {showPaymentProofsModal && (
//         <PaymentProofsModal
//           urls={selectedPaymentProofs}
//           onClose={() => setShowPaymentProofsModal(false)}
//         />
//       )}




//     </div>
//   );
// }


// //corect avobe


// src/app/msteam/components/TaskTableView.tsx

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Task } from "../../types/task";
import { Note } from "../../../types/note";
import HighlightColorDropdown from "../components/HighlightColorDropdown";

import { TaskFilters } from "./TaskFilters";
import { useUser } from "@clerk/nextjs";

import { format } from "date-fns";
import * as Dialog from "@radix-ui/react-dialog";
import {
  FaMapMarkerAlt,
  FaSpinner,
  FaRupeeSign,
  FaCheckCircle,
  FaReceipt,
  FaTimes,
} from "react-icons/fa";
import toast from "react-hot-toast";
import NotesModal from "../components/NotesModal";
// ✅ Correct import path for the Copy icon component
import CopyTaskDetailsIcon from "../components/CopyTaskDetailsIcon";

import Image from "next/image";

// Define AttachmentType within this file or import if it's in a shared types file
type AttachmentType = {
  url: string;
  name?: string;
};

// PaymentProofsModal.tsx (This component is embedded directly within TaskTableView)
function PaymentProofsModal({
  urls,
  onClose,
  taskId,
  role,
  onDeleteSuccess,
}: {
  urls: string[];
  onClose: () => void;
  taskId: string;
  role: string;
  onDeleteSuccess: (url: string) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-white max-w-3xl w-full p-4 rounded shadow-lg relative">
        <button
          onClick={() => {
            if (previewUrl) {
              setPreviewUrl(null);
            } else {
              onClose();
            }
          }}
          className="absolute top-3 right-3 text-gray-600 hover:text-red-500"
          title={previewUrl ? "Back to list" : "Close modal"}
        >
          <FaTimes size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4">Payment Proofs</h2>

        {previewUrl ? (
          <div className="overflow-auto max-h-[80vh]">
            {previewUrl.toLowerCase().endsWith(".pdf") ? (
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(
                  previewUrl
                )}&embedded=true`}
                className="w-full h-[70vh] border rounded"
                title="PDF Preview"
              />
            ) : (
              <Image
                src={previewUrl}
                alt="Proof Preview"
                width={800}
                height={600}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
                unoptimized
              />
            )}
          </div>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto px-2">
            {urls
              .filter((url) => typeof url === "string")
              .map((url, i) => {
                const label = url.toLowerCase().endsWith(".pdf")
                  ? "📄 PDF Proof"
                  : "🖼️ Image Proof";
                return (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded shadow-sm"
                  >
                    <span className="text-sm text-gray-700">{label}</span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setPreviewUrl(url)}
                        className="text-purple-700 underline hover:text-purple-900 text-sm"
                      >
                        👁️ Preview
                      </button>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 underline hover:text-green-800 text-sm"
                      >
                        ⬇️ Download
                      </a>
                      {role === "master" && (
                        <button
                          onClick={async () => {
                            if (!confirm("Are you sure you want to delete this payment proof?")) return;
                            try {
                              const res = await fetch(`/api/tasks/${taskId}/payments`, {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ url }),
                              });
                              if (res.ok) {
                                toast.success("Proof deleted successfully");
                                onDeleteSuccess(url);
                              } else {
                                const data = await res.json();
                                toast.error(data.error || "Failed to delete proof");
                              }
                            } catch (err) {
                              toast.error("An error occurred while deleting proof");
                            }
                          }}
                          className="text-red-600 underline hover:text-red-800 text-sm"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  tasks: Task[];
  user: any; // UserResource from Clerk
  onTasksUpdate?: (updatedTasks: Task[]) => void;
  // Pagination & Filter Props
  currentPage: number;
  onPageChange: (page: number) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  totalItems: number;
  totalPages: number;
  query: string;
  onQueryChange: (query: string) => void;
  status: string | null;
  onStatusChange: (status: string | null) => void;
}

export default function TaskTableView({
  tasks,
  user,
  onTasksUpdate,
  currentPage,
  onPageChange,
  limit,
  onLimitChange,
  totalItems,
  totalPages,
  query,
  onQueryChange,
  status,
  onStatusChange
}: Props) {
  const [editMode, setEditMode] = useState(false);
  const [editedValues, setEditedValues] = useState<{ [key: string]: number }>(
    {}
  );
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks || []);

  // Use a separate state for filtered tasks to avoid re-filtering on every render
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks || []);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; email: string }[]>([]);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const res = await fetch("/api/team-members");
        if (res.ok) {
          const data = await res.json();
          setTeamMembers(data);
        }
      } catch (err) {
        console.error("Failed to fetch team members:", err);
      }
    };
    fetchTeamMembers();
  }, []);

  // ✅ The `copy` column is now initialized as a visible column
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "rowNumber",
    "highlightColor",
    "title",
    "createdAt",
    "assignerName",
    "shopName",
    "location",
    "phone",
    "email",
    "status",
    "notes",
    "amount",
    "amountReceived",
    "pendingAmount",
    "copy",
    "attachments",
    "paymentProofs",
  ]);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedTaskIdForNotes, setSelectedTaskIdForNotes] = useState<
    string | null
  >(null);
  const [notesMap, setNotesMap] = useState<{ [taskId: string]: Note[] }>({});

  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<
    AttachmentType[]
  >([]);

  const [showPaymentProofsModal, setShowPaymentProofsModal] = useState(false);
  const [selectedPaymentProofs, setSelectedPaymentProofs] = useState<string[]>(
    []
  );
  const [selectedTaskIdForProofs, setSelectedTaskIdForProofs] = useState<string | null>(null);

  // Pagination states are now from props

  const { user: clerkUser } = useUser();
  const currentUserId = clerkUser?.id;

  const role = (user.publicMetadata?.role as string) || "";

  useEffect(() => {
    setLocalTasks(tasks || []);
    setFilteredTasks(tasks || []); // Also update filteredTasks when tasks prop changes

    // Initialize notes map
    const initialNotes = (tasks || []).reduce(
      (acc, task) => {
        if (Array.isArray(task.notes)) {
          acc[task.id] = task.notes;
        } else {
          acc[task.id] = [];
        }
        return acc;
      },
      {} as { [taskId: string]: Note[] }
    );
    setNotesMap(initialNotes);
  }, [tasks]);

  const refetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to refetch tasks");
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
      toast.error(`Refetch error: ${err.message || "An unknown error occurred."}`);
    }
  };

  // This memoization is now less critical as filteredTasks is managed by state
  const paginatedTasks = useMemo(() => {
    return filteredTasks;
  }, [filteredTasks]);

  const handleTasksPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    onLimitChange(Number(e.target.value));
    onPageChange(1);
  };

  const handlePageChange = (pageNumber: number) => {
    onPageChange(pageNumber);
  };

  const handleFilteredTasksChange = useCallback((newFilteredTasks: Task[]) => {
    setFilteredTasks(newFilteredTasks);
  }, []);

  const handleColumnVisibilityChange = useCallback((newColumns: string[]) => {
    setVisibleColumns(newColumns);
  }, []);

  const handleInputChange = (
    taskId: string,
    field: "amount" | "received",
    value: number
  ) => {
    const key = `${taskId}-${field}`;
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleDeletePaymentProofSuccess = useCallback((deletedUrl: string) => {
    if (!selectedTaskIdForProofs) return;

    setLocalTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === selectedTaskIdForProofs
          ? {
            ...task,
            paymentProofs: (task.paymentProofs || []).filter(
              (proof: any) =>
                (typeof proof === "string" ? proof : proof.url) !== deletedUrl
            ),
          }
          : task
      )
    );

    setFilteredTasks((prevFilteredTasks) =>
      prevFilteredTasks.map((task) =>
        task.id === selectedTaskIdForProofs
          ? {
            ...task,
            paymentProofs: (task.paymentProofs || []).filter(
              (proof: any) =>
                (typeof proof === "string" ? proof : proof.url) !== deletedUrl
            ),
          }
          : task
      )
    );

    setSelectedPaymentProofs((prevProofs) =>
      prevProofs.filter((url) => url !== deletedUrl)
    );

    // If all proofs are deleted, close the modal
    if (selectedPaymentProofs.length <= 1) {
      setShowPaymentProofsModal(false);
      setSelectedTaskIdForProofs(null);
    }
  }, [selectedTaskIdForProofs, selectedPaymentProofs]);


  // const handleBlur = async (taskId: string, field: "amount" | "received") => {
  //   const key = `${taskId}-${field}`;
  //   const value = editedValues[key];

  //   const originalTask = localTasks.find((t) => t.id === taskId);
  //   const originalValue =
  //     field === "amount"
  //       ? Number(originalTask?.amount) || 0
  //       : Number(originalTask?.received) || 0;

  //   if (typeof value === "number" && !isNaN(value) && value !== originalValue) {
  //     setIsSaving(key);
  //     try {
  //       const res = await fetch("/api/tasks/update", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ taskId, field, value }),
  //       });

  //       if (!res.ok) {
  //         const contentType = res.headers.get("content-type");
  //         const errorText = await res.text();

  //         let errorMessage = "Failed to update task.";
  //         if (contentType && contentType.includes("application/json")) {
  //           try {
  //             const errorJson = JSON.parse(errorText);
  //             errorMessage = errorJson.error || errorMessage;
  //           } catch (jsonErr) {
  //             console.error("Failed to parse error JSON:", jsonErr, errorText);
  //             errorMessage = "Server returned malformed error. Contact support.";
  //           }
  //         } else {
  //           errorMessage = `Server error: ${res.status} ${res.statusText}. Please try again.`;
  //           console.error("Server returned non-JSON error:", errorText);
  //         }

  //         toast.error(errorMessage);
  //         setEditedValues((prev) => ({ ...prev, [key]: originalValue }));
  //       } else {
  //         toast.success("Task updated successfully!");
  //         await refetchTasks();
  //         setEditedValues((prev) => {
  //           const newState = { ...prev };
  //           delete newState[key];
  //           return newState;
  //         });
  //       }
  //     } catch (err: unknown) {
  //       console.error("❌ Network or unexpected error:", err);
  //       toast.error(
  //         err.message || "An unexpected error occurred while updating the task."
  //       );
  //       setEditedValues((prev) => ({ ...prev, [key]: originalValue }));
  //     } finally {
  //       setIsSaving(null);
  //     }
  //   } else {
  //     setEditedValues((prev) => {
  //       const newState = { ...prev };
  //       delete newState[key];
  //       return newState;
  //     });
  //   }
  // };






  const handleBlur = async (
    taskId: string,
    field: "amount" | "received"
  ) => {
    // Only allow admin to update amount or received
    if ((field === "amount" || field === "received") && role !== "master") {
      toast.error("Only admins can edit this field.");
      // Remove edited value since it’s not allowed
      setEditedValues((prev) => {
        const newState = { ...prev };
        delete newState[`${taskId}-${field}`];
        return newState;
      });
      return;
    }

    const key = `${taskId}-${field}`;
    const value = editedValues[key];

    const originalTask = localTasks.find((t) => t.id === taskId);
    const originalValue =
      field === "amount"
        ? Number(originalTask?.amount) || 0
        : Number(originalTask?.received) || 0;

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
          // Optimistic update: Update local state immediately
          setLocalTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === taskId ? { ...task, [field]: value } : task
            )
          );
          setFilteredTasks((prevFilteredTasks) =>
            prevFilteredTasks.map((task) =>
              task.id === taskId ? { ...task, [field]: value } : task
            )
          );
          // No full refetch needed, but if onTasksUpdate is provided, call it with the updated localTasks
          onTasksUpdate?.(localTasks.map((task) =>
            task.id === taskId ? { ...task, [field]: value } : task
          ));

          setEditedValues((prev) => {
            const newState = { ...prev };
            delete newState[key];
            return newState;
          });
        }
      } catch (err: any) {
        console.error("❌ Network or unexpected error:", err);
        toast.error(
          err.message || "An unexpected error occurred while updating the task."
        );
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

  const handleDirectUpdate = async (taskId: string, field: string, value: any, updates?: any) => {
    setIsSaving(`${taskId}-${field}`);
    try {
      const res = await fetch("/api/tasks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, field, value, updates }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to update field");
      } else {
        toast.success(updates ? "Multiple fields updated!" : `${field} updated!`);
        await refetchTasks();
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Network error");
    } finally {
      setIsSaving(null);
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

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    if (startPage === 1 && endPage < totalPages) {
      endPage = Math.min(totalPages, maxPagesToShow);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 mt-6 overflow-hidden">
      <TaskFilters
        initialTasks={localTasks}
        notesMap={notesMap}
        onFilteredTasksChange={handleFilteredTasksChange}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        editMode={editMode}
        setEditMode={setEditMode}
        // Controlled Props
        query={query}
        onQueryChange={onQueryChange}
        status={status}
        onStatusChange={onStatusChange}
      />

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed border-collapse border border-gray-200 text-sm shadow-md rounded-md overflow-hidden">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0 z-10">
            <tr>
              {visibleColumns.includes("rowNumber") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-12">
                  S. No.
                </th>
              )}
              {visibleColumns.includes("highlightColor") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-24">
                  Highlight
                </th>
              )}
              {visibleColumns.includes("title") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
                  Title
                </th>
              )}
              {visibleColumns.includes("createdAt") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-36 cursor-pointer">
                  <div className="flex items-center">📅 Created</div>
                </th>
              )}
              {visibleColumns.includes("assignerName") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-48">
                  Assigned By → To
                </th>
              )}
              {visibleColumns.includes("shopName") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-40">
                  🏪 Shop Name
                </th>
              )}
              {visibleColumns.includes("location") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
                  📍 Location
                </th>
              )}
              {visibleColumns.includes("phone") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
                  📞 Phone
                </th>
              )}
              {visibleColumns.includes("email") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-40">
                  📧 Email
                </th>
              )}
              {visibleColumns.includes("status") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
                  Status
                </th>
              )}
              {visibleColumns.includes("notes") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
                  📝 Notes
                </th>
              )}
              {visibleColumns.includes("amount") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer">
                  <div className="flex items-center justify-end">
                    <FaRupeeSign className="mr-1" /> Amount
                  </div>
                </th>
              )}
              {visibleColumns.includes("amountReceived") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer">
                  <div className="flex items-center justify-end">
                    <FaCheckCircle className="mr-1 text-emerald-600" /> Received
                  </div>
                </th>
              )}
              {visibleColumns.includes("pendingAmount") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer">
                  <div className="flex items-center justify-end">
                    <FaReceipt className="mr-1 text-rose-600" /> Pending
                  </div>
                </th>
              )}
              {/* ✅ This is the header for the copy column */}
              {visibleColumns.includes("copy") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-12">
                  📋 Copy
                </th>
              )}
              {visibleColumns.includes("attachments") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
                  📎 Attachments
                </th>
              )}
              {visibleColumns.includes("paymentProofs") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-32">
                  🧾 Payment Proofs
                </th>
              )}
            </tr>
          </thead>

          <tbody className="bg-white">
            {paginatedTasks.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="text-center px-4 py-8 text-gray-500 text-base"
                >
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
            ) : (
              paginatedTasks.map((task, index) => {
                const amount = Number(task.amount) || 0;
                const received = Number(task.received) || 0;
                const pending = amount - received;
                const rowNumber = (currentPage - 1) * limit + index + 1;
                const hasNotes = (notesMap[task.id]?.length || 0) > 0;

                return (
                  <tr
                    key={task.id}
                    style={{
                      backgroundColor: task.highlightColor || "transparent",
                    }}
                    className="h-12 hover:bg-blue-50 transition-all duration-150 ease-in-out"
                  >
                    {visibleColumns.includes("rowNumber") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center text-gray-700 font-medium">
                        {rowNumber}
                      </td>
                    )}
                    {visibleColumns.includes("highlightColor") && (
                      <td className="p-2 border border-gray-200">
                        <HighlightColorDropdown
                          taskId={task.id}
                          value={task.highlightColor}
                          onChange={async (newColor) => {
                            try {
                              await fetch(`/api/tasks/${task.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ highlightColor: newColor }),
                              });

                              setLocalTasks((prev) =>
                                prev.map((t) =>
                                  t.id === task.id
                                    ? { ...t, highlightColor: newColor }
                                    : t
                                )
                              );
                              handleFilteredTasksChange(
                                localTasks.map((t) =>
                                  t.id === task.id
                                    ? { ...t, highlightColor: newColor }
                                    : t
                                )
                              );
                            } catch (error) {
                              console.error(
                                "Error updating highlight color:",
                                error
                              );
                              toast.error("Failed to update highlight color.");
                            }
                          }}
                        />
                      </td>
                    )}
                    {visibleColumns.includes("title") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left font-medium text-gray-900">
                        {task.title}
                      </td>
                    )}
                    {visibleColumns.includes("createdAt") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-600">
                        {task.createdAt
                          ? format(new Date(task.createdAt), "dd MMM, HH:mm")
                          : "—"}
                      </td>
                    )}
                    {visibleColumns.includes("assignerName") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase text-gray-400">By</span>
                            {editMode && (role === "master" || role === "admin" || role === "tl") ? (
                                <select 
                                    className="text-xs font-bold text-gray-800 bg-white border border-gray-200 rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={teamMembers.find(m => m.name === task.assignerName)?.id || ""}
                                    onChange={(e) => {
                                        const member = teamMembers.find(m => m.id === e.target.value);
                                        if (member) {
                                            handleDirectUpdate(task.id, "assigner", null, {
                                                assignerName: member.name,
                                                assignerEmail: member.email
                                            });
                                        }
                                    }}
                                >
                                    <option value="">Select Assigner</option>
                                    {teamMembers.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className="text-xs font-bold text-gray-800 tracking-tight">
                                  {task.assignerName || "—"}
                                </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            {editMode && (role === "master" || role === "admin" || role === "tl") ? (
                                <div className="flex flex-col gap-1 w-full mt-1">
                                    <select 
                                        multiple
                                        className="text-[10px] font-bold text-indigo-900 bg-white border border-indigo-100 rounded-lg p-1 min-h-[80px] w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        value={task.assigneeIds || []}
                                        onChange={(e) => {
                                            const selectedIds = Array.from(e.target.selectedOptions).map(opt => opt.value);
                                            handleDirectUpdate(task.id, "assigneeIds", selectedIds);
                                        }}
                                    >
                                        {teamMembers.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Cmd+Click for Multiple</span>
                                </div>
                            ) : (
                                Array.isArray(task.assignees) && task.assignees.length > 0 ? (
                                  task.assignees.map((a, idx) => (
                                    <div key={idx} className="flex items-center gap-1 bg-indigo-50/50 pr-2 rounded-full border border-indigo-100/50 hover:bg-indigo-100 transition-colors">
                                      {a.imageUrl ? (
                                        <img src={a.imageUrl} className="w-5 h-5 rounded-full border border-white shadow-sm" alt={a.name || ""} />
                                      ) : (
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[8px] font-black uppercase border border-white">
                                          {(a.name || "U")[0]}
                                        </div>
                                      )}
                                      <span className="text-[10px] font-bold text-indigo-900">{a.name || a.email || "—"}</span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-blue-600 font-medium text-xs">
                                    {task.assigneeEmail || "—"}
                                  </span>
                                )
                            )}
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes("shopName") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-700">
                        {task.customFields?.shopName || "—"}
                      </td>
                    )}
                    {visibleColumns.includes("location") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
                        {task.customFields?.location ? (
                          <a
                            href={String(task.customFields?.location || "")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                          >
                            <FaMapMarkerAlt className="text-blue-500" /> View
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes("phone") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
                        {task.customFields?.phone || "—"}
                      </td>
                    )}
                    {visibleColumns.includes("email") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
                        {task.customFields?.email || "—"}
                      </td>
                    )}
                    {visibleColumns.includes("status") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${task.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : task.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {task.status}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes("notes") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
                        <button
                          onClick={() => {
                            setSelectedTaskIdForNotes(task.id);
                            setIsNoteModalOpen(true);
                          }}
                          className={`text-blue-600 hover:underline text-sm flex items-center gap-1 ${hasNotes ? "font-semibold" : "text-gray-500"
                            }`}
                        >
                          <span className="text-xs">📝</span>{" "}
                          {hasNotes
                            ? `View Notes (${notesMap[task.id].length})`
                            : "Add Note"}
                        </button>
                      </td>
                    )}
                    {visibleColumns.includes("amount") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right">
                        {editMode ? (
                          <div className="relative">
                            <input
                              type="number"
                              value={
                                editedValues[`${task.id}-amount`] !== undefined
                                  ? (isNaN(editedValues[`${task.id}-amount`]) ? "" : editedValues[`${task.id}-amount`])
                                  : (isNaN(amount) ? "" : amount)
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  task.id,
                                  "amount",
                                  parseFloat(e.target.value)
                                )
                              }
                              onBlur={(e) => handleBlur(task.id, "amount")}
                              className="w-full p-1 border border-gray-300 rounded-md text-right text-gray-900 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                            {isSaving === `${task.id}-amount` && (
                              <FaSpinner className="absolute right-2 top-1/2 transform -translate-y-1/2 animate-spin text-blue-500" />
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-800 font-medium">
                            {formatCurrency(amount)}
                          </span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes("amountReceived") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right">
                        {editMode ? (
                          <div className="relative">
                            <input
                              type="number"
                              value={
                                editedValues[`${task.id}-received`] !==
                                  undefined
                                  ? (isNaN(editedValues[`${task.id}-received`]) ? "" : editedValues[`${task.id}-received`])
                                  : (isNaN(received) ? "" : received)
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  task.id,
                                  "received",
                                  parseFloat(e.target.value)
                                )
                              }
                              onBlur={(e) => handleBlur(task.id, "received")}
                              className="w-full p-1 border border-gray-300 rounded-md text-right text-gray-900 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                            {isSaving === `${task.id}-received` && (
                              <FaSpinner className="absolute right-2 top-1/2 transform -translate-y-1/2 animate-spin text-blue-500" />
                            )}
                          </div>
                        ) : (
                          <span className="text-emerald-700 font-medium">
                            {formatCurrency(received)}
                          </span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes("pendingAmount") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right">
                        <span className="text-rose-700 font-medium">
                          {formatCurrency(pending)}
                        </span>
                      </td>
                    )}
                    {/* ✅ This is the cell for the copy icon */}
                    {visibleColumns.includes("copy") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center">
                        <CopyTaskDetailsIcon
                          amount={amount}
                          received={received}
                          pending={pending}
                          updatedAt={task.updatedAt || new Date().toISOString()}
                        />
                      </td>
                    )}
                    {visibleColumns.includes("attachments") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
                        {task.attachments && task.attachments.length > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedAttachments(
                                task.attachments?.map(
                                  (att: string | AttachmentType) =>
                                    typeof att === "string"
                                      ? { url: att }
                                      : att
                                ) || []
                              );
                              setAttachmentModalOpen(true);
                            }}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View {task.attachments.length} Attachment(s)
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes("paymentProofs") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center">
                        {task.paymentProofs && task.paymentProofs.length > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedPaymentProofs(
                                task.paymentProofs?.map(
                                  (proof: string | AttachmentType) =>
                                    typeof proof === "string"
                                      ? proof
                                      : proof.url
                                ) || []
                              );
                              setSelectedTaskIdForProofs(task.id);
                              setShowPaymentProofsModal(true);
                            }}
                            className="text-purple-600 hover:underline text-sm"
                          >
                            View {task.paymentProofs.length} Proof(s)
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          Rows per page:
          <select
            value={limit}
            onChange={handleTasksPerPageChange}
            className="p-1 border border-gray-300 rounded-md"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Previous
          </button>
          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded-md text-sm ${currentPage === page
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Last
          </button>
        </div>
      </div>

      {isNoteModalOpen && selectedTaskIdForNotes && (
        <NotesModal
          taskId={selectedTaskIdForNotes}
          initialNotes={notesMap[selectedTaskIdForNotes] || []}
          onClose={(updatedNotes) => {
            if (updatedNotes) {
              setNotesMap((prev) => ({
                ...prev,
                [selectedTaskIdForNotes]: updatedNotes,
              }));
            }
            setIsNoteModalOpen(false);
            setSelectedTaskIdForNotes(null);
          }}
        />
      )}

      {attachmentModalOpen && (
        <Dialog.Root
          open={attachmentModalOpen}
          onOpenChange={setAttachmentModalOpen}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full z-[100] max-h-[90vh] overflow-y-auto">
              <Dialog.Title className="text-xl font-bold mb-4">
                Attachments
              </Dialog.Title>
              <div className="space-y-4">
                {selectedAttachments.length > 0 ? (
                  selectedAttachments.map((attachment, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-100 p-3 rounded-md shadow-sm"
                    >
                      <span className="text-gray-700 text-sm font-medium">
                        {attachment.name || `Attachment ${idx + 1}`}
                      </span>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View/Download
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center">
                    No attachments available.
                  </p>
                )}
              </div>
              <Dialog.Close asChild>
                <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
                  <FaTimes size={20} />
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {showPaymentProofsModal && selectedTaskIdForProofs && (
        <PaymentProofsModal
          urls={selectedPaymentProofs}
          taskId={selectedTaskIdForProofs}
          role={role}
          onDeleteSuccess={handleDeletePaymentProofSuccess}
          onClose={() => {
            setShowPaymentProofsModal(false);
            setSelectedTaskIdForProofs(null);
          }}
        />
      )}
    </div>
  );
}