// // components/TaskFilters.tsx
// "use client";

// import React, { useState, useMemo, useEffect, useRef } from "react";
// import { Task } from "../../types/task";
// import { Note } from "../../../types/note";
// import {
//   FaSearch,
//   FaDownload,
//   FaEye,
//   FaEyeSlash,
//   FaArrowUp,
//   FaArrowDown,
//   FaEdit,
//   FaTimesCircle,
//   FaCaretDown,
//   FaCaretUp,
// } from "react-icons/fa";
// import { format, isToday, subDays, startOfMonth } from "date-fns";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
// import toast from "react-hot-toast";

// interface TaskFiltersProps {
//   initialTasks: Task[];
//   notesMap: { [taskId: string]: Note[] };
//   onFilteredTasksChange: (filteredTasks: Task[]) => void;
//   onColumnVisibilityChange: (columns: string[]) => void;
//   editMode: boolean;
//   setEditMode: (mode: boolean) => void;
// }

// const ALL_COLUMNS = [
//   "rowNumber",
//   "highlightColor",
//   "title", // This will now effectively act as the 'category' for filtering
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
//   "received", // The correct field name for amount received
//   "pendingAmount",
//   "attachments",
//   "paymentProofs",
// ];

// // FIX: Updated `value` fields to be plain text (no emojis)
// // Labels still retain emojis for display
// const TASK_CATEGORIES = [
//   { label: "🍽️ Zomato Onboarding", value: "Zomato Onboarding" },
//   { label: "🍔 Swiggy Onboarding", value: "Swiggy Onboarding" },
//   { label: "🍽️🍔 Zomato + Swiggy Combo", value: "Zomato + Swiggy Combo" },
//   { label: "🧾 Food License", value: "Food License" },
//   { label: "📸 Photo Upload", value: "Photo Upload" },
//   { label: "📂 Account Handling", value: "Account Handling" },
//   { label: "🛠️ Other", value: "Other" },
// ];

// // Helper function to strip emojis from a string
// function stripEmojis(str: string): string {
//   // Using Unicode property escapes for comprehensive emoji stripping
//   // \p{Emoji_Presentation}: matches emojis that are typically presented with emoji style
//   // \p{Extended_Pictographic}: matches all pictographic characters, including emojis
//   // 'u' flag for Unicode support in regex
//   return str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "").trim();
// }


// export const TaskFilters = ({
//   initialTasks,
//   notesMap,
//   onFilteredTasksChange,
//   onColumnVisibilityChange,
//   editMode,
//   setEditMode,
// }: TaskFiltersProps) => {
//   const [query, setQuery] = useState("");
//   const [statusFilter, setStatusFilter] = useState<string | null>(null);
//   const [dateFilter, setDateFilter] = useState<string | null>(null);
//   const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
//   const [columns, setColumns] = useState<string[]>(ALL_COLUMNS);

//   const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
//   const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

//   const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
//   const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);

//   // New state and ref for assigner filter
//   const [selectedAssigners, setSelectedAssigners] = useState<string[]>([]);
//   const [isAssignerDropdownOpen, setIsAssignerDropdownOpen] = useState(false);

//   // State for the new filters
//   const [nonZeroSalesOnly, setNonZeroSalesOnly] = useState(false);
//   const [pendingFilter, setPendingFilter] = useState<"all" | "pending" | "paid">("all");

//   const categoryDropdownRef = useRef<HTMLDivElement>(null);
//   const assigneeDropdownRef = useRef<HTMLDivElement>(null);
//   const assignerDropdownRef = useRef<HTMLDivElement>(null); // New ref for assigner dropdown

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         categoryDropdownRef.current &&
//         !categoryDropdownRef.current.contains(event.target as Node)
//       ) {
//         setIsCategoryDropdownOpen(false);
//       }
//       if (
//         assigneeDropdownRef.current &&
//         !assigneeDropdownRef.current.contains(event.target as Node)
//       ) {
//         setIsAssigneeDropdownOpen(false);
//       }
//       // New logic for assigner dropdown
//       if (
//         assignerDropdownRef.current &&
//         !assignerDropdownRef.current.contains(event.target as Node)
//       ) {
//         setIsAssignerDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   useEffect(() => {
//     onColumnVisibilityChange(columns);
//   }, [columns, onColumnVisibilityChange]);

//   const filteredTasks = useMemo(() => {
//     let currentFilteredTasks = [...initialTasks];
//     const now = new Date();

//     if (query) {
//       const lower = query.toLowerCase();
//       currentFilteredTasks = currentFilteredTasks.filter((t) =>
//         [
//           t.customFields?.shopName,
//           t.customFields?.email,
//           t.customFields?.phone,
//           t.assignee?.name,
//           t.title, // Keep title for general search
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
//       currentFilteredTasks = currentFilteredTasks.filter((t) => t.status === statusFilter);
//     }

//     // New filter for assigners
//     if (selectedAssigners.length > 0) {
//       currentFilteredTasks = currentFilteredTasks.filter((t) =>
//         selectedAssigners.includes(t.assignerName || t.createdByName || "")
//       );
//     }

//     if (selectedAssignees.length > 0) {
//       currentFilteredTasks = currentFilteredTasks.filter((t) =>
//         t.assignees?.some(
//           (a) => (a.name || a.email) && selectedAssignees.includes(a.name || a.email)
//         )
//       );
//     }

//     // FIX: Filter by stripping emojis from task.title before comparison
//     if (selectedCategories.length > 0) {
//       currentFilteredTasks = currentFilteredTasks.filter(
//         (t) => t.title && selectedCategories.includes(stripEmojis(t.title))
//       );
//     }

//     if (dateFilter) {
//       currentFilteredTasks = currentFilteredTasks.filter((t) => {
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

//     // Filter for non-zero sales only
//     if (nonZeroSalesOnly) {
//       currentFilteredTasks = currentFilteredTasks.filter((t) => (t.amount || 0) > 0);
//     }

//     // Corrected logic for pending payments filter
//     if (pendingFilter === "pending") {
//       currentFilteredTasks = currentFilteredTasks.filter((t) => {
//         // Corrected to use t.received
//         const pending = (Number(t.amount) || 0) - (Number(t.received) || 0);
//         // Only include if there's a pending amount
//         return pending > 0;
//       });
//     } else if (pendingFilter === "paid") {
//       currentFilteredTasks = currentFilteredTasks.filter((t) => {
//         // Corrected to use t.received
//         const pending = (Number(t.amount) || 0) - (Number(t.received) || 0);
//         // Fully paid means: sale exists (amount > 0) AND no pending amount
//         return pending === 0 && (Number(t.amount) || 0) > 0;
//       });
//     }

//     if (sortConfig) {
//       currentFilteredTasks.sort((a, b) => {
//         let aValue: any;
//         let bValue: any;

//         if (sortConfig.key === "pendingAmount") {
//           // Corrected to use t.received
//           aValue = (Number(a.amount) || 0) - (Number(a.received) || 0);
//           bValue = (Number(b.amount) || 0) - (Number(b.received) || 0);
//         } else if (sortConfig.key === "amount") {
//           aValue = Number(a.amount) || 0;
//           bValue = Number(b.amount) || 0;
//         } else if (sortConfig.key === "received") {
//           aValue = Number(a.received) || 0;
//           bValue = Number(b.received) || 0;
//         } else if (sortConfig.key === "createdAt") {
//           aValue = new Date(a.createdAt || 0).getTime();
//           bValue = new Date(b.createdAt || 0).getTime();
//         } else {
//           aValue = (a as any)[sortConfig.key];
//           bValue = (b as any)[sortConfig.key];
//         }

//         if (aValue === undefined && bValue === undefined) return 0;
//         if (aValue === undefined) return sortConfig.direction === "asc" ? 1 : -1;
//         if (bValue === undefined) return sortConfig.direction === "asc" ? -1 : 1;

//         if (typeof aValue === "number" && typeof bValue === "number") {
//           return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
//         }
//         return sortConfig.direction === "asc"
//           ? String(aValue).localeCompare(String(bValue))
//           : String(bValue).localeCompare(String(aValue));
//       });
//     }

//     return currentFilteredTasks;
//   }, [
//     initialTasks,
//     query,
//     sortConfig,
//     statusFilter,
//     selectedAssigners, // New dependency
//     selectedAssignees,
//     selectedCategories, // Now correctly compares against `task.title` after emoji stripping
//     dateFilter,
//     notesMap,
//     nonZeroSalesOnly,
//     pendingFilter,
//   ]);

//   useEffect(() => {
//     onFilteredTasksChange(filteredTasks);
//   }, [filteredTasks, onFilteredTasksChange]);

//   const exportCSV = () => {
//     const exportData = filteredTasks.map((task, index) => ({
//       "S. No.": index + 1,
//       Title: task.title, // This is the task's actual title/category
//       Status: task.status,
//       "Shop Name": task.customFields?.shopName,
//       Phone: task.customFields?.phone,
//       Email: task.customFields?.email,
//       Category: task.title, // Export 'title' as 'Category' column
//       Assignee:
//         task.assignees?.map((a) => a?.name || a?.email).filter(Boolean).join(", ") ||
//         task.assignee?.name,
//       Assigner: task.assignerName,
//       "Created At": task.createdAt
//         ? format(new Date(task.createdAt), "dd MMM yyyy, HH:mm")
//         : "",
//       Location: task.customFields?.location,
//       Notes: (notesMap[task.id] || []).map((note) => note.content).join(" | "),
//       Attachments:
//         task.attachments?.map((a) => (typeof a === "string" ? a : a.url)).join(" | ") || "",
//       "Payment Proofs":
//         task.paymentProofs?.map((p) => (typeof p === "string" ? p : p.url)).filter(Boolean).join(" | ") || "",
//     }));

//     const ws = XLSX.utils.json_to_sheet(exportData);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Tasks");
//     const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
//     const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
//     saveAs(blob, `Tasks_Report_${Date.now()}.xlsx`);
//     toast.success("CSV exported successfully!");
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
//     return sortConfig.direction === "asc" ? (
//       <FaArrowUp className="ml-1 text-xs" />
//     ) : (
//       <FaArrowDown className="ml-1 text-xs" />
//     );
//   };

//   const statusOptions = Array.from(new Set(initialTasks.map((t) => t.status).filter(Boolean))) as string[];
//   const uniqueAssigneeNames = useMemo(() => {
//     const names = new Set<string>();
//     initialTasks.forEach(task => {
//       task.assignees?.forEach(assignee => {
//         if (assignee.name || assignee.email) {
//           names.add(assignee.name || assignee.email);
//         }
//       });
//     });
//     return Array.from(names);
//   }, [initialTasks]);

//   // New memoized list of unique assigners
//   const uniqueAssignerNames = useMemo(() => {
//     const names = new Set<string>();
//     initialTasks.forEach(task => {
//       if (task.assignerName) names.add(task.assignerName);
//       else if (task.createdByName) names.add(task.createdByName);
//     });
//     return Array.from(names);
//   }, [initialTasks]);


//   const getCategoryDropdownDisplayText = () => {
//     if (selectedCategories.length === 0) {
//       return "All Categories";
//     } else if (selectedCategories.length === TASK_CATEGORIES.length) {
//       return "All Categories Selected";
//     } else if (selectedCategories.length === 1) {
//       // Find the label that matches the selected category value (which is now plain text)
//       return TASK_CATEGORIES.find(cat => cat.value === selectedCategories[0])?.label || "1 Category Selected";
//     } else {
//       return `${selectedCategories.length} Categories Selected`;
//     }
//   };

//   const getAssigneeDropdownDisplayText = () => {
//     if (selectedAssignees.length === 0) {
//       return "All Assignees";
//     } else if (selectedAssignees.length === uniqueAssigneeNames.length) {
//       return "All Assignees Selected";
//     } else if (selectedAssignees.length === 1) {
//       return selectedAssignees[0];
//     } else {
//       return `${selectedAssignees.length} Assignees Selected`;
//     }
//   };

//   // New function for assigner dropdown display text
//   const getAssignerDropdownDisplayText = () => {
//     if (selectedAssigners.length === 0) {
//       return "All Assigners";
//     } else if (selectedAssigners.length === uniqueAssignerNames.length) {
//       return "All Assigners Selected";
//     } else if (selectedAssigners.length === 1) {
//       return selectedAssigners[0];
//     } else {
//       return `${selectedAssigners.length} Assigners Selected`;
//     }
//   };


//   return (
//     <>
//       <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
//         <div className="relative flex-grow mr-4">
//           <input
//             type="text"
//             placeholder="Filter tasks by title, shop name, or assignee..."
//             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//           />
//           <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//         </div>

//         <div className="flex flex-wrap gap-2">
//           {/* Non-zero Sales Filter */}
//           <label className="flex items-center gap-2 text-sm text-gray-700">
//             <input
//               type="checkbox"
//               className="accent-blue-600"
//               checked={nonZeroSalesOnly}
//               onChange={(e) => setNonZeroSalesOnly(e.target.checked)}
//             />
//             Non-zero Sales Only
//           </label>

//           {/* Pending Filter */}
//           <select
//             value={pendingFilter}
//             onChange={(e) => setPendingFilter(e.target.value as "all" | "pending" | "paid")}
//             className="p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
//           >
//             <option value="all">All Payments</option>
//             <option value="pending">Pending Payments</option>
//             <option value="paid">Fully Paid</option>
//           </select>
//           <button
//             className="inline-flex items-center bg-green-600 text-white font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ease-in-out"
//             onClick={exportCSV}
//           >
//             <FaDownload className="inline mr-2 -ml-1" /> Export CSV
//           </button>
//           <button
//             className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out
//             ${
//               editMode
//                 ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
//                 : "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500"
//             }`}
//             onClick={() => setEditMode((prev) => !prev)}
//           >
//             {editMode ? (
//               <>
//                 <FaTimesCircle className="mr-2" /> Exit Edit Mode
//               </>
//             ) : (
//               <>
//                 <FaEdit className="mr-2" /> Enter Edit Mode
//               </>
//             )}
//           </button>
//         </div>
//       </div>

//       <div className="flex flex-wrap gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50">
//         {/* Status Filter */}
//         <select
//           value={statusFilter || ""}
//           onChange={(e) => setStatusFilter(e.target.value || null)}
//           className="p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
//         >
//           <option value="">All Statuses</option>
//           {statusOptions.map(status => (
//             <option key={status} value={status}>{status}</option>
//           ))}
//         </select>

//         {/* Custom Assigner Filter Dropdown with Checkboxes */}
//         <div className="relative" ref={assignerDropdownRef}>
//           <button
//             type="button"
//             className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between min-w-[150px]"
//             onClick={() => setIsAssignerDropdownOpen(prev => !prev)}
//           >
//             <span>{getAssignerDropdownDisplayText()}</span>
//             {isAssignerDropdownOpen ? <FaCaretUp className="ml-2" /> : <FaCaretDown className="ml-2" />}
//           </button>
//           {isAssignerDropdownOpen && (
//             <div className="absolute z-20 mt-1 w-56 max-h-60 overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
//               <div className="py-1">
//                 {uniqueAssignerNames.map((assigner) => (
//                   <label
//                     key={assigner}
//                     className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
//                   >
//                     <input
//                       type="checkbox"
//                       className="accent-blue-600"
//                       checked={selectedAssigners.includes(assigner)}
//                       onChange={(e) => {
//                         const isChecked = e.target.checked;
//                         setSelectedAssigners(prev =>
//                           isChecked ? [...prev, assigner] : prev.filter(v => v !== assigner)
//                         );
//                       }}
//                     />
//                     {assigner}
//                   </label>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>


//         {/* Custom Assignee Filter Dropdown with Checkboxes */}
//         <div className="relative" ref={assigneeDropdownRef}>
//           <button
//             type="button"
//             className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between min-w-[150px]"
//             onClick={() => setIsAssigneeDropdownOpen((prev) => !prev)}
//           >
//             <span>{getAssigneeDropdownDisplayText()}</span>
//             {isAssigneeDropdownOpen ? <FaCaretUp className="ml-2" /> : <FaCaretDown className="ml-2" />}
//           </button>
//           {isAssigneeDropdownOpen && (
//             <div className="absolute z-20 mt-1 w-56 max-h-60 overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
//               <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
//                 {uniqueAssigneeNames.map((assignee) => (
//                   <label
//                     key={assignee}
//                     className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
//                     role="menuitem"
//                   >
//                     <input
//                       type="checkbox"
//                       className="accent-blue-600"
//                       checked={selectedAssignees.includes(assignee)}
//                       onChange={(e) => {
//                         const isChecked = e.target.checked;
//                         setSelectedAssignees((prev) =>
//                           isChecked ? [...prev, assignee] : prev.filter((v) => v !== assignee)
//                         );
//                       }}
//                     />
//                     {assignee}
//                   </label>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Date Filter */}
//         <select
//           value={dateFilter || ""}
//           onChange={(e) => setDateFilter(e.target.value || null)}
//           className="p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
//         >
//           <option value="">All Dates</option>
//           <option value="today">Today</option>
//           <option value="yesterday">Yesterday</option>
//           <option value="last_7_days">Last 7 Days</option>
//           <option value="this_month">This Month</option>
//           <option value="last_month">Last Month</option>
//           <option value="this_year">This Year</option>
//         </select>

//         {/* Custom Category Filter Dropdown with Checkboxes */}
//         <div className="relative" ref={categoryDropdownRef}>
//           <button
//             type="button"
//             className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between min-w-[150px]"
//             onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
//           >
//             <span>{getCategoryDropdownDisplayText()}</span>
//             {isCategoryDropdownOpen ? <FaCaretUp className="ml-2" /> : <FaCaretDown className="ml-2" />}
//           </button>
//           {isCategoryDropdownOpen && (
//             <div className="absolute z-20 mt-1 w-56 max-h-60 overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
//               <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
//                 {TASK_CATEGORIES.map((cat) => (
//                   <label
//                     key={cat.value}
//                     className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
//                     role="menuitem"
//                   >
//                     <input
//                       type="checkbox"
//                       className="accent-blue-600"
//                       checked={selectedCategories.includes(cat.value)}
//                       onChange={(e) => {
//                         const isChecked = e.target.checked;
//                         setSelectedCategories((prev) =>
//                           isChecked ? [...prev, cat.value] : prev.filter((v) => v !== cat.value)
//                         );
//                       }}
//                     />
//                     {cat.label}
//                   </label>
//                 ))}
//               </div>
//             </div>
//           )}
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
//             ${
//               columns.includes(col)
//                 ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                 : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
//             }`}
//           >
//             {columns.includes(col) ? <FaEye className="mr-1" /> : <FaEyeSlash className="mr-1" />}{" "}
//             {col.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
//           </button>
//         ))}
//       </div>
//     </>
//   );
// };














































// // components/TaskFilters.tsx
// "use client";

// import React, { useState, useMemo, useEffect, useRef } from "react";
// import { Task } from "../../types/task";
// import { Note } from "../../../types/note";
// import {
//   FaSearch,
//   FaDownload,
//   FaEye,
//   FaEyeSlash,
//   FaArrowUp,
//   FaArrowDown,
//   FaEdit,
//   FaTimesCircle,
//   FaCaretDown,
//   FaCaretUp,
// } from "react-icons/fa";
// import { format, isToday, subDays, startOfMonth } from "date-fns";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
// import toast from "react-hot-toast";

// interface TaskFiltersProps {
//   initialTasks: Task[];
//   notesMap: { [taskId: string]: Note[] };
//   onFilteredTasksChange: (filteredTasks: Task[]) => void;
//   onColumnVisibilityChange: (columns: string[]) => void;
//   editMode: boolean;
//   setEditMode: (mode: boolean) => void;
// }

// const ALL_COLUMNS = [
//   "rowNumber",
//   "highlightColor",
//   "title", // This will now effectively act as the 'category' for filtering
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

// // FIX: Updated `value` fields to be plain text (no emojis)
// // Labels still retain emojis for display
// const TASK_CATEGORIES = [
//   { label: "🍽️ Zomato Onboarding", value: "Zomato Onboarding" },
//   { label: "🍔 Swiggy Onboarding", value: "Swiggy Onboarding" },
//   { label: "🍽️🍔 Zomato + Swiggy Combo", value: "Zomato + Swiggy Combo" },
//   { label: "🧾 Food License", value: "Food License" },
//   { label: "📸 Photo Upload", value: "Photo Upload" },
//   { label: "📂 Account Handling", value: "Account Handling" },
//   { label: "🛠️ Other", value: "Other" },
// ];

// // Helper function to strip emojis from a string
// function stripEmojis(str: string): string {
//   // Using Unicode property escapes for comprehensive emoji stripping
//   // \p{Emoji_Presentation}: matches emojis that are typically presented with emoji style
//   // \p{Extended_Pictographic}: matches all pictographic characters, including emojis
//   // 'u' flag for Unicode support in regex
//   return str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "").trim();
// }


// export const TaskFilters = ({
//   initialTasks,
//   notesMap,
//   onFilteredTasksChange,
//   onColumnVisibilityChange,
//   editMode,
//   setEditMode,
// }: TaskFiltersProps) => {
//   const [query, setQuery] = useState("");
//   const [statusFilter, setStatusFilter] = useState<string | null>(null);
//   const [dateFilter, setDateFilter] = useState<string | null>(null);
//   const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
//   const [columns, setColumns] = useState<string[]>(ALL_COLUMNS);

//   const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
//   const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
//   const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
//   const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);

//   const categoryDropdownRef = useRef<HTMLDivElement>(null);
//   const assigneeDropdownRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         categoryDropdownRef.current &&
//         !categoryDropdownRef.current.contains(event.target as Node)
//       ) {
//         setIsCategoryDropdownOpen(false);
//       }
//       if (
//         assigneeDropdownRef.current &&
//         !assigneeDropdownRef.current.contains(event.target as Node)
//       ) {
//         setIsAssigneeDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   useEffect(() => {
//     onColumnVisibilityChange(columns);
//   }, [columns, onColumnVisibilityChange]);

//   const filteredTasks = useMemo(() => {
//     let currentFilteredTasks = [...initialTasks];
//     const now = new Date();

//     if (query) {
//       const lower = query.toLowerCase();
//       currentFilteredTasks = currentFilteredTasks.filter((t) =>
//         [
//           t.customFields?.shopName,
//           t.customFields?.email,
//           t.customFields?.phone,
//           t.assignee?.name,
//           t.title, // Keep title for general search
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
//       currentFilteredTasks = currentFilteredTasks.filter((t) => t.status === statusFilter);
//     }

//     if (selectedAssignees.length > 0) {
//       currentFilteredTasks = currentFilteredTasks.filter((t) =>
//         t.assignees?.some(
//           (a) => (a.name || a.email) && selectedAssignees.includes(a.name || a.email)
//         )
//       );
//     }

//     // FIX: Filter by stripping emojis from task.title before comparison
//     if (selectedCategories.length > 0) {
//       currentFilteredTasks = currentFilteredTasks.filter(
//         (t) => t.title && selectedCategories.includes(stripEmojis(t.title))
//       );
//     }

//     if (dateFilter) {
//       currentFilteredTasks = currentFilteredTasks.filter((t) => {
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
//       currentFilteredTasks.sort((a, b) => {
//         let aValue: any;
//         let bValue: any;

//         if (sortConfig.key === "pendingAmount") {
//           aValue = (Number(a.amount) || 0) - (Number(a.received) || 0);
//           bValue = (Number(b.amount) || 0) - (Number(b.received) || 0);
//         } else if (sortConfig.key === "amount") {
//           aValue = Number(a.amount) || 0;
//           bValue = Number(b.amount) || 0;
//         } else if (sortConfig.key === "amountReceived") {
//           aValue = Number(a.received) || 0;
//           bValue = Number(b.received) || 0;
//         } else if (sortConfig.key === "createdAt") {
//           aValue = new Date(a.createdAt || 0).getTime();
//           bValue = new Date(b.createdAt || 0).getTime();
//         } else {
//           aValue = (a as any)[sortConfig.key];
//           bValue = (b as any)[sortConfig.key];
//         }

//         if (aValue === undefined && bValue === undefined) return 0;
//         if (aValue === undefined) return sortConfig.direction === "asc" ? 1 : -1;
//         if (bValue === undefined) return sortConfig.direction === "asc" ? -1 : 1;

//         if (typeof aValue === "number" && typeof bValue === "number") {
//           return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
//         }
//         return sortConfig.direction === "asc"
//           ? String(aValue).localeCompare(String(bValue))
//           : String(bValue).localeCompare(String(aValue));
//       });
//     }

//     return currentFilteredTasks;
//   }, [
//     initialTasks,
//     query,
//     sortConfig,
//     statusFilter,
//     selectedAssignees,
//     selectedCategories, // Now correctly compares against `task.title` after emoji stripping
//     dateFilter,
//     notesMap,
//   ]);

//   useEffect(() => {
//     onFilteredTasksChange(filteredTasks);
//   }, [filteredTasks, onFilteredTasksChange]);

//   const exportCSV = () => {
//     const exportData = filteredTasks.map((task, index) => ({
//       "S. No.": index + 1,
//       Title: task.title, // This is the task's actual title/category
//       Status: task.status,
//       "Shop Name": task.customFields?.shopName,
//       Phone: task.customFields?.phone,
//       Email: task.customFields?.email,
//       Category: task.title, // Export 'title' as 'Category' column
//       Assignee:
//         task.assignees?.map((a) => a?.name || a?.email).filter(Boolean).join(", ") ||
//         task.assignee?.name,
//       Assigner: task.assignerName,
//       "Created At": task.createdAt
//         ? format(new Date(task.createdAt), "dd MMM yyyy, HH:mm")
//         : "",
//       Location: task.customFields?.location,
//       Notes: (notesMap[task.id] || []).map((note) => note.content).join(" | "),
//       Attachments:
//         task.attachments?.map((a) => (typeof a === "string" ? a : a.url)).join(" | ") || "",
//       "Payment Proofs":
//         task.paymentProofs?.map((p) => (typeof p === "string" ? p : p.url)).filter(Boolean).join(" | ") || "",
//     }));

//     const ws = XLSX.utils.json_to_sheet(exportData);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Tasks");
//     const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
//     const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
//     saveAs(blob, `Tasks_Report_${Date.now()}.xlsx`);
//     toast.success("CSV exported successfully!");
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
//     return sortConfig.direction === "asc" ? (
//       <FaArrowUp className="ml-1 text-xs" />
//     ) : (
//       <FaArrowDown className="ml-1 text-xs" />
//     );
//   };

//   const statusOptions = Array.from(new Set(initialTasks.map((t) => t.status).filter(Boolean))) as string[];
//   const uniqueAssigneeNames = useMemo(() => {
//     const names = new Set<string>();
//     initialTasks.forEach(task => {
//       task.assignees?.forEach(assignee => {
//         if (assignee.name || assignee.email) {
//           names.add(assignee.name || assignee.email);
//         }
//       });
//     });
//     return Array.from(names);
//   }, [initialTasks]);

//   const getCategoryDropdownDisplayText = () => {
//     if (selectedCategories.length === 0) {
//       return "All Categories";
//     } else if (selectedCategories.length === TASK_CATEGORIES.length) {
//       return "All Categories Selected";
//     } else if (selectedCategories.length === 1) {
//       // Find the label that matches the selected category value (which is now plain text)
//       return TASK_CATEGORIES.find(cat => cat.value === selectedCategories[0])?.label || "1 Category Selected";
//     } else {
//       return `${selectedCategories.length} Categories Selected`;
//     }
//   };

//   const getAssigneeDropdownDisplayText = () => {
//     if (selectedAssignees.length === 0) {
//       return "All Assignees";
//     } else if (selectedAssignees.length === uniqueAssigneeNames.length) {
//       return "All Assignees Selected";
//     } else if (selectedAssignees.length === 1) {
//       return selectedAssignees[0];
//     } else {
//       return `${selectedAssignees.length} Assignees Selected`;
//     }
//   };


//   return (
//     <>
//       <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
//         <div className="relative flex-grow mr-4">
//           <input
//             type="text"
//             placeholder="Filter tasks by title, shop name, or assignee..."
//             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//           />
//           <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
//             ${
//               editMode
//                 ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
//                 : "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500"
//             }`}
//             onClick={() => setEditMode((prev) => !prev)}
//           >
//             {editMode ? (
//               <>
//                 <FaTimesCircle className="mr-2" /> Exit Edit Mode
//               </>
//             ) : (
//               <>
//                 <FaEdit className="mr-2" /> Enter Edit Mode
//               </>
//             )}
//           </button>
//         </div>
//       </div>

//       <div className="flex flex-wrap gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50">
//         {/* Status Filter */}
//         <select
//           value={statusFilter || ""}
//           onChange={(e) => setStatusFilter(e.target.value || null)}
//           className="p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
//         >
//           <option value="">All Statuses</option>
//           {statusOptions.map(status => (
//             <option key={status} value={status}>{status}</option>
//           ))}
//         </select>

//         {/* Custom Assignee Filter Dropdown with Checkboxes */}
//         <div className="relative" ref={assigneeDropdownRef}>
//           <button
//             type="button"
//             className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between min-w-[150px]"
//             onClick={() => setIsAssigneeDropdownOpen((prev) => !prev)}
//           >
//             <span>{getAssigneeDropdownDisplayText()}</span>
//             {isAssigneeDropdownOpen ? <FaCaretUp className="ml-2" /> : <FaCaretDown className="ml-2" />}
//           </button>
//           {isAssigneeDropdownOpen && (
//             <div className="absolute z-20 mt-1 w-56 max-h-60 overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
//               <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
//                 {uniqueAssigneeNames.map((assignee) => (
//                   <label
//                     key={assignee}
//                     className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
//                     role="menuitem"
//                   >
//                     <input
//                       type="checkbox"
//                       className="accent-blue-600"
//                       checked={selectedAssignees.includes(assignee)}
//                       onChange={(e) => {
//                         const isChecked = e.target.checked;
//                         setSelectedAssignees((prev) =>
//                           isChecked ? [...prev, assignee] : prev.filter((v) => v !== assignee)
//                         );
//                       }}
//                     />
//                     {assignee}
//                   </label>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Date Filter */}
//         <select
//           value={dateFilter || ""}
//           onChange={(e) => setDateFilter(e.target.value || null)}
//           className="p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
//         >
//           <option value="">All Dates</option>
//           <option value="today">Today</option>
//           <option value="yesterday">Yesterday</option>
//           <option value="last_7_days">Last 7 Days</option>
//           <option value="this_month">This Month</option>
//           <option value="last_month">Last Month</option>
//           <option value="this_year">This Year</option>
//         </select>

//         {/* Custom Category Filter Dropdown with Checkboxes */}
//         <div className="relative" ref={categoryDropdownRef}>
//           <button
//             type="button"
//             className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between min-w-[150px]"
//             onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
//           >
//             <span>{getCategoryDropdownDisplayText()}</span>
//             {isCategoryDropdownOpen ? <FaCaretUp className="ml-2" /> : <FaCaretDown className="ml-2" />}
//           </button>
//           {isCategoryDropdownOpen && (
//             <div className="absolute z-20 mt-1 w-56 max-h-60 overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
//               <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
//                 {TASK_CATEGORIES.map((cat) => (
//                   <label
//                     key={cat.value}
//                     className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
//                     role="menuitem"
//                   >
//                     <input
//                       type="checkbox"
//                       className="accent-blue-600"
//                       checked={selectedCategories.includes(cat.value)}
//                       onChange={(e) => {
//                         const isChecked = e.target.checked;
//                         setSelectedCategories((prev) =>
//                           isChecked ? [...prev, cat.value] : prev.filter((v) => v !== cat.value)
//                         );
//                       }}
//                     />
//                     {cat.label}
//                   </label>
//                 ))}
//               </div>
//             </div>
//           )}
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
//             ${
//               columns.includes(col)
//                 ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                 : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
//             }`}
//           >
//             {columns.includes(col) ? <FaEye className="mr-1" /> : <FaEyeSlash className="mr-1" />}{" "}
//             {col.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
//           </button>
//         ))}
//       </div>
//     </>
//   );
// };






















// components/TaskFilters.tsx
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
import { format, isToday, subDays, startOfMonth } from "date-fns";
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
}: TaskFiltersProps) => {
  // Local states for other filters
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [columns, setColumns] = useState<string[]>(ALL_COLUMNS);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);

  // New state and ref for assigner filter
  const [selectedAssigners, setSelectedAssigners] = useState<string[]>([]);
  const [isAssignerDropdownOpen, setIsAssignerDropdownOpen] = useState(false);

  // State for the new filters
  const [salesFilter, setSalesFilter] = useState<"all" | "withSales" | "noSales">("all");
  const [pendingSalesFilter, setPendingSalesFilter] = useState<"all" | "withPendingSales" | "fullyPaidSales" | "zeroAmountAndPaid">("all");

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
    let currentFilteredTasks = [...initialTasks];
    const now = new Date();

    if (query) {
      const lower = query.toLowerCase();
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
    if (status) {
      currentFilteredTasks = currentFilteredTasks.filter((t) => t.status === status);
    }

    // New filter for assigners
    if (selectedAssigners.length > 0) {
      currentFilteredTasks = currentFilteredTasks.filter((t) =>
        selectedAssigners.includes(t.assignerName || t.createdByName || "")
      );
    }

    if (selectedAssignees.length > 0) {
      currentFilteredTasks = currentFilteredTasks.filter((t) =>
        t.assignees?.some(
          (a) => (a.name || a.email) && selectedAssignees.includes(a.name || a.email || '')
        ) || (t.assigneeName && selectedAssignees.includes(t.assigneeName))
      );
    }

    // FIX: Filter by stripping emojis from task.title before comparison
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

    // Apply sales filter
    if (salesFilter === "withSales") {
      currentFilteredTasks = currentFilteredTasks.filter((t) => (t.amount || 0) > 0);
    } else if (salesFilter === "noSales") {
      currentFilteredTasks = currentFilteredTasks.filter((t) => (t.amount || 0) === 0);
    }

    // Apply pending sales filter
    if (pendingSalesFilter === "withPendingSales") {
      currentFilteredTasks = currentFilteredTasks.filter((t) => {
        const pending = (Number(t.amount) || 0) - (Number(t.received) || 0);
        return pending > 0;
      });
    } else if (pendingSalesFilter === "fullyPaidSales") {
      currentFilteredTasks = currentFilteredTasks.filter((t) => {
        const pending = (Number(t.amount) || 0) - (Number(t.received) || 0);
        return pending === 0 && (Number(t.amount) || 0) > 0;
      });
    } else if (pendingSalesFilter === "zeroAmountAndPaid") {
      currentFilteredTasks = currentFilteredTasks.filter((t) => {
        const amount = Number(t.amount) || 0;
        const received = Number(t.received) || 0;
        return amount === 0 && received === 0;
      });
    }


    if (sortConfig) {
      currentFilteredTasks.sort((a, b) => {
        let aValue: any;
        let bValue: any;

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
        } else {
          aValue = (a as any)[sortConfig.key];
          bValue = (b as any)[sortConfig.key];
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
    query,
    sortConfig,
    status,
    selectedAssigners, // New dependency
    selectedAssignees,
    selectedCategories, // Now correctly compares against `task.title` after emoji stripping
    dateFilter,
    notesMap,
    salesFilter, // Add salesFilter to dependencies
    pendingSalesFilter, // Add pendingSalesFilter to dependencies
  ]);

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

  const statusOptions = Array.from(new Set(initialTasks.map((t) => t.status).filter(Boolean))) as string[];
  const uniqueAssigneeNames = useMemo(() => {
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
  }, [initialTasks]);

  // New memoized list of unique assigners
  const uniqueAssignerNames = useMemo(() => {
    const names = new Set<string>();
    initialTasks.forEach(task => {
      if (task.assignerName) names.add(task.assignerName);
      else if (task.createdByName) names.add(task.createdByName);
    });
    return Array.from(names);
  }, [initialTasks]);


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
            placeholder="Search tasks..."
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
            onChange={(e) => setSalesFilter(e.target.value as "all" | "withSales" | "noSales")}
            className="p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Sales</option>
            <option value="withSales">With Sales</option>
            <option value="noSales">No Sales</option>
          </select>

          {/* Pending Sales Filter Dropdown */}
          <select
            value={pendingSalesFilter}
            onChange={(e) => setPendingSalesFilter(e.target.value as "all" | "withPendingSales" | "fullyPaidSales" | "zeroAmountAndPaid")}
            className="p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Pending Sales</option>
            <option value="withPendingSales">With Pending Sales</option>
            <option value="fullyPaidSales">Fully Paid Sales</option>
            <option value="zeroAmountAndPaid">Zero Amount & Paid</option>
          </select>


          <button
            className="flex-1 md:flex-none inline-flex items-center justify-center bg-green-600 text-white font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ease-in-out text-sm"
            onClick={exportCSV}
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
                        setSelectedAssigners(prev =>
                          isChecked ? [...prev, assigner] : prev.filter(v => v !== assigner)
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
                        setSelectedAssignees((prev) =>
                          isChecked ? [...prev, assignee] : prev.filter((v) => v !== assignee)
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
