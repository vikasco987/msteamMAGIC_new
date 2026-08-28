//         </AnimatePresence>

//         {/* Data Table with animation */}
//         <AnimatePresence>
//           {!loading && !error && data.length > 0 && (
//             <motion.div
//               key="data-table"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.2, duration: 0.5 }}
//               className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg"
//             >
//               <table className="min-w-full text-sm">
//                 <thead className="bg-gray-100 text-gray-700">
//                   <tr>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                       #
//                     </th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                       Shop
//                     </th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//   Mobile
// </th>

//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                       First Task Date
//                     </th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                       Revenue
//                     </th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                       Received
//                     </th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                       Pending
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {filteredData.map((row, index) => (
//                     <tr
//                       key={index}
//                       className={`${
//                         index % 2 === 0 ? "bg-white" : "bg-gray-50"
//                       } hover:bg-blue-50 transition-colors`}
//                     >
//                       <td className="px-6 py-4 font-medium text-gray-700">
//                         {row.taskNumber}
//                       </td>
//                       <td className="px-6 py-4 font-medium text-gray-900">
//                         {row.shopName}
//                       </td>
//                       <td className="px-6 py-4 text-gray-700">
//   {row.mobileNumber || "-"}
// </td>
//                       <td className="px-6 py-4 text-gray-500">
//                         {formatDate(row.firstCreatedAt)}
//                       </td>
//                       <td className="px-6 py-4 text-gray-900">
//                         ₹{row.totalRevenue.toLocaleString()}
//                       </td>
//                       <td className="px-6 py-4">
//                         <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
//                           ₹{row.totalReceived.toLocaleString()}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4">
//                         <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
//                           ₹{row.pending.toLocaleString()}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>

//               {filteredData.length === 0 && data.length > 0 && (
//                 <div className="text-center text-gray-500 py-4 bg-white">
//                   <p>No results found for your search.</p>
//                 </div>
//               )}
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     </div>
//   );
// }











// "use client";

// import { useEffect, useState } from "react";
// import { format } from "date-fns";
// import { Search, Loader2 } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";

// // Typescript interfaces for data
// interface ReportEntry {
//   taskNumber: number;
//   shopName: string;
//   mobileNumber?: string;
//   firstCreatedAt: string;
//   totalRevenue: number;
//   totalReceived: number;
//   pending: number;
// }

// // helper: returns current month in YYYY-MM format
// const getCurrentMonth = (): string => {
//   return format(new Date(), "yyyy-MM");
// };

// export default function ShopReport({ month }: { month?: string }) {
//   // State management
//   const [data, setData] = useState<ReportEntry[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [search, setSearch] = useState("");

//   // Fetch data from API on component mount or month change
//   useEffect(() => {
//     const fetchReport = async () => {
//       setLoading(true);
//       setError(null);
//       setData([]);

//       try {
//         const safeMonth =
//           month && /^\d{4}-\d{2}$/.test(month) ? month : getCurrentMonth();
//         const res = await fetch(`/api/seller/day-report?month=${safeMonth}`);

//         if (!res.ok) {
//           const errText = await res.text();
//           throw new Error(
//             `Failed to fetch shop report. Status: ${res.status} ${res.statusText}. Message: ${errText}`
//           );
//         }

//         const report: ReportEntry[] = await res.json();
//         if (!Array.isArray(report)) {
//           throw new Error("Invalid data format received from server");
//         }

//         setData(report);
//       } catch (err: any) {
//         console.error("Error fetching shop report:", err);
//         setError(
//           err.message || "Unknown error occurred while fetching report"
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReport();
//   }, [month]);

//   // ✅ Filter: only show tasks with pending > 0 and match search
//   const filteredData = data
//     .filter((item) => item.pending > 0)
//     .filter((item) =>
//       Object.values(item)
//         .join(" ")
//         .toLowerCase()
//         .includes(search.toLowerCase())
//     );

//   // Format date for display
//   const formatDate = (isoDate: string) => {
//     return format(new Date(isoDate), "EEE, d LLL yyyy");
//   };

//   return (
//     <div className="p-8 bg-gray-50 min-h-screen">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
//           <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
//             <span className="text-4xl text-blue-600">📊</span> Shop Report (Pending Payments Only)
//           </h2>

//           {/* Search input with icon */}
//           <div className="relative w-full max-w-sm">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
//             <input
//               type="text"
//               placeholder="Search by shop, revenue, or status..."
//               className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-white shadow-sm
//                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//           </div>
//         </div>

//         {/* Conditional rendering for states with animation */}
//         <AnimatePresence mode="wait">
//           {loading && (
//             <motion.div
//               key="loading-state"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="text-center text-blue-600 py-10"
//             >
//               <Loader2 className="inline-block animate-spin text-4xl" />
//               <p className="mt-2 text-lg">Loading report...</p>
//             </motion.div>
//           )}

//           {error && (
//             <motion.div
//               key="error-state"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow-sm"
//             >
//               <h3 className="font-bold text-lg mb-2">Error</h3>
//               <p>{error}</p>
//             </motion.div>
//           )}

//           {!loading && !error && filteredData.length === 0 && (
//             <motion.div
//               key="empty-state"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="text-center text-gray-500 py-10"
//             >
//               <p className="text-lg">No pending payment tasks found.</p>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Data Table with animation */}
//         <AnimatePresence>
//           {!loading && !error && filteredData.length > 0 && (
//             <motion.div
//               key="data-table"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.2, duration: 0.5 }}
//               className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg"
//             >
//               <table className="min-w-full text-sm">
//                 <thead className="bg-gray-100 text-gray-700">
//                   <tr>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">#</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Shop</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Mobile</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">First Task Date</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Revenue</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Received</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Pending</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {filteredData.map((row, index) => (
//                     <tr
//                       key={index}
//                       className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
//                     >
//                       <td className="px-6 py-4 font-medium text-gray-700">{row.taskNumber}</td>
//                       <td className="px-6 py-4 font-medium text-gray-900">{row.shopName}</td>
//                       <td className="px-6 py-4 text-gray-700">{row.mobileNumber || "-"}</td>
//                       <td className="px-6 py-4 text-gray-500">{formatDate(row.firstCreatedAt)}</td>
//                       <td className="px-6 py-4 text-gray-900">₹{row.totalRevenue.toLocaleString()}</td>
//                       <td className="px-6 py-4">
//                         <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
//                           ₹{row.totalReceived.toLocaleString()}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4">
//                         <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
//                           ₹{row.pending.toLocaleString()}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     </div>
//   );
// }








// "use client";

// import { useEffect, useState } from "react";
// import { format, subMonths } from "date-fns";
// import { Search, Loader2 } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";

// // Typescript interfaces for data
// interface ReportEntry {
//   taskNumber: number;
//   shopName: string;
//   mobileNumber?: string;
//   firstCreatedAt: string;
//   totalRevenue: number;
//   totalReceived: number;
//   pending: number;
// }

// // helper: returns current month in YYYY-MM format
// const getCurrentMonth = (): string => {
//   return format(new Date(), "yyyy-MM");
// };

// // helper: generate last 12 months
// const getMonthOptions = () => {
//   return Array.from({ length: 12 }, (_, i) =>
//     format(subMonths(new Date(), i), "yyyy-MM")
//   );
// };

// export default function ShopReport() {
//   // State management
//   const [data, setData] = useState<ReportEntry[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [search, setSearch] = useState("");
//   const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

//   // Fetch data from API on component mount or month change
//   useEffect(() => {
//     const fetchReport = async () => {
//       setLoading(true);
//       setError(null);
//       setData([]);

//       try {
//         const res = await fetch(`/api/seller/day-report?month=${selectedMonth}`);

//         if (!res.ok) {
//           const errText = await res.text();
//           throw new Error(
//             `Failed to fetch shop report. Status: ${res.status} ${res.statusText}. Message: ${errText}`
//           );
//         }

//         const report: ReportEntry[] = await res.json();
//         if (!Array.isArray(report)) {
//           throw new Error("Invalid data format received from server");
//         }

//         setData(report);
//       } catch (err: any) {
//         console.error("Error fetching shop report:", err);
//         setError(
//           err.message || "Unknown error occurred while fetching report"
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReport();
//   }, [selectedMonth]);

//   // Filter data based on search input
//   const filteredData = data.filter((item) =>
//     Object.values(item)
//       .join(" ")
//       .toLowerCase()
//       .includes(search.toLowerCase())
//   );

//   // Format date for display
//   const formatDate = (isoDate: string) => {
//     return format(new Date(isoDate), "EEE, d LLL yyyy");
//   };

//   return (
//     <div className="p-8 bg-gray-50 min-h-screen">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
//           <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
//             <span className="text-4xl text-blue-600">📊</span> Shop Report
//           </h2>

//           <div className="flex flex-col md:flex-row gap-3 items-center">
//             {/* Month Filter */}
//             <select
//               value={selectedMonth}
//               onChange={(e) => setSelectedMonth(e.target.value)}
//               className="px-3 py-2 border border-gray-300 rounded-xl bg-white shadow-sm
//                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
//             >
//               {getMonthOptions().map((month) => (
//                 <option key={month} value={month}>
//                   {month}
//                 </option>
//               ))}
//             </select>

//             {/* Search input with icon */}
//             <div className="relative w-full max-w-sm">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
//               <input
//                 type="text"
//                 placeholder="Search by shop, revenue, or status..."
//                 className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-white shadow-sm
//                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//               />
//             </div>
//           </div>
//         </div>

//         {/* Existing loading, error, table code stays the same */}
//         {/* ... */}
//       </div>
//     </div>
//   );
// }













// "use client";

// import { useEffect, useState } from "react";
// import { format, subMonths } from "date-fns";
// import { Search } from "lucide-react";

// // Typescript interfaces for data
// interface ReportEntry {
//   taskNumber: number;
//   shopName: string;
//   mobileNumber?: string;
//   firstCreatedAt: string;
//   totalRevenue: number;
//   totalReceived: number;
//   pending: number;
// }

// // helper: returns current month in YYYY-MM format
// const getCurrentMonth = (): string => {
//   return format(new Date(), "yyyy-MM");
// };

// // helper: generate last 12 months (value + label)
// const getMonthOptions = () => {
//   return Array.from({ length: 12 }, (_, i) => {
//     const date = subMonths(new Date(), i);
//     return {
//       value: format(date, "yyyy-MM"), // backend query param
//       label: format(date, "MMMM, yyyy"), // pretty display (e.g. September, 2025)
//     };
//   });
// };

// export default function ShopReport() {
//   // State management
//   const [data, setData] = useState<ReportEntry[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [search, setSearch] = useState("");
//   const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

//   // Fetch data from API on component mount or month change
//   useEffect(() => {
//     const fetchReport = async () => {
//       setLoading(true);
//       setError(null);
//       setData([]);

//       try {
//         const res = await fetch(`/api/seller/day-report?month=${selectedMonth}`);

//         if (!res.ok) {
//           const errText = await res.text();
//           throw new Error(
//             `Failed to fetch shop report. Status: ${res.status} ${res.statusText}. Message: ${errText}`
//           );
//         }

//         const report: ReportEntry[] = await res.json();
//         if (!Array.isArray(report)) {
//           throw new Error("Invalid data format received from server");
//         }

//         setData(report);
//       } catch (err: any) {
//         console.error("Error fetching shop report:", err);
//         setError(
//           err.message || "Unknown error occurred while fetching report"
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReport();
//   }, [selectedMonth]);

//   // Filter data based on search input
//   const filteredData = data.filter((item) =>
//     Object.values(item)
//       .join(" ")
//       .toLowerCase()
//       .includes(search.toLowerCase())
//   );

//   // Format date for display
//   const formatDate = (isoDate: string) => {
//     return format(new Date(isoDate), "EEE, d LLL yyyy");
//   };

//   return (
//     <div className="p-8 bg-gray-50 min-h-screen">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
//           <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
//             <span className="text-4xl text-blue-600">📊</span>
//             Shop Report –{" "}
//             {format(new Date(selectedMonth + "-01"), "MMMM, yyyy")}
//           </h2>

//           <div className="flex flex-col md:flex-row gap-3 items-center">
//             {/* Month Filter */}
//             <select
//               value={selectedMonth}
//               onChange={(e) => setSelectedMonth(e.target.value)}
//               className="px-3 py-2 border border-gray-300 rounded-xl bg-white shadow-sm
//                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
//             >
//               {getMonthOptions().map((month) => (
//                 <option key={month.value} value={month.value}>
//                   {month.label}
//                 </option>
//               ))}
//             </select>

//             {/* Search input with icon */}
//             <div className="relative w-full max-w-sm">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
//               <input
//                 type="text"
//                 placeholder="Search by shop, revenue, or status..."
//                 className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-white shadow-sm
//                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//               />
//             </div>
//           </div>
//         </div>

//         {/* Table */}
//         <div className="bg-white shadow rounded-xl overflow-hidden">
//           {loading ? (
//             <p className="p-4 text-gray-500">Loading report...</p>
//           ) : error ? (
//             <p className="p-4 text-red-600">{error}</p>
//           ) : filteredData.length === 0 ? (
//             <p className="p-4 text-gray-500">No data available.</p>
//           ) : (
//             <table className="w-full border-collapse">
//               <thead className="bg-gray-100 text-left">
//                 <tr>
//                   <th className="p-3">#</th>
//                   <th className="p-3">Shop</th>
//                   <th className="p-3">Mobile</th>
//                   <th className="p-3">Created</th>
//                   <th className="p-3">Revenue</th>
//                   <th className="p-3">Received</th>
//                   <th className="p-3">Pending</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredData.map((row, idx) => (
//                   <tr key={idx} className="border-b hover:bg-gray-50">
//                     <td className="p-3">{row.taskNumber}</td>
//                     <td className="p-3">{row.shopName}</td>
//                     <td className="p-3">{row.mobileNumber || "-"}</td>
//                     <td className="p-3">{formatDate(row.firstCreatedAt)}</td>
//                     <td className="p-3 font-semibold text-blue-600">
//                       ₹{row.totalRevenue.toLocaleString()}
//                     </td>
//                     <td className="p-3 font-semibold text-green-600">
//                       ₹{row.totalReceived.toLocaleString()}
//                     </td>
//                     <td className="p-3 font-semibold text-red-600">
//                       ₹{row.pending.toLocaleString()}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }














// "use client";

// import { useEffect, useState } from "react";
// import { format, subMonths } from "date-fns";
// import { Search, Loader2, ArrowUp, ArrowDown } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";

// interface ReportEntry {
//   taskNumber: number;
//   shopName: string;
//   mobileNumber?: string;
//   firstCreatedAt: string;
//   totalRevenue: number;
//   totalReceived: number;
//   pending: number;
// }

// const getCurrentMonth = (): string => format(new Date(), "yyyy-MM");

// const getMonthOptions = () => {
//   return ["all", ...Array.from({ length: 12 }, (_, i) => format(subMonths(new Date(), i), "yyyy-MM"))];
// };

// export default function ShopReport() {
//   const [data, setData] = useState<ReportEntry[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [search, setSearch] = useState("");

//   const [selectedMonth, setSelectedMonth] = useState("all");
//   const [pendingFilter, setPendingFilter] = useState<"all" | "pending" | "paid">("all");
//   const [sortPendingDesc, setSortPendingDesc] = useState<boolean>(true);

//   useEffect(() => {
//     const fetchReport = async () => {
//       setLoading(true);
//       setError(null);
//       setData([]);
//       try {
//         const monthQuery = selectedMonth !== "all" ? `?month=${selectedMonth}` : "";
//         const res = await fetch(`/api/seller/day-report${monthQuery}`);
//         if (!res.ok) {
//           const errText = await res.text();
//           throw new Error(`Failed to fetch report. ${res.status} ${res.statusText}. ${errText}`);
//         }
//         const report: ReportEntry[] = await res.json();
//         setData(Array.isArray(report) ? report : []);
//       } catch (err: any) {
//         console.error(err);
//         setError(err.message || "Unknown error occurred");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReport();
//   }, [selectedMonth]);

//   let filteredData = data.filter((item) =>
//     Object.values(item).join(" ").toLowerCase().includes(search.toLowerCase())
//   );

//   if (pendingFilter === "pending") filteredData = filteredData.filter((item) => item.pending > 0);
//   if (pendingFilter === "paid") filteredData = filteredData.filter((item) => item.pending === 0);

//   filteredData = filteredData.sort((a, b) =>
//     sortPendingDesc ? b.pending - a.pending : a.pending - b.pending
//   );

//   const formatDate = (isoDate: string) => format(new Date(isoDate), "EEE, d LLL yyyy");

//   return (
//     <div className="p-8 bg-gray-50 min-h-screen">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
//           <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
//             <span className="text-4xl text-blue-600">📊</span> Shop Report
//           </h2>

//           {/* Filters */}
//           <div className="flex flex-col md:flex-row gap-3 items-center w-full md:w-auto">
//             <select
//               value={selectedMonth}
//               onChange={(e) => setSelectedMonth(e.target.value)}
//               className="px-3 py-2 border border-gray-300 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
//             >
//               {getMonthOptions().map((month) => {
//                 const label =
//                   month === "all" ? "All Months" : format(new Date(month + "-01"), "LLLL, yyyy");
//                 return (
//                   <option key={month} value={month}>
//                     {label}
//                   </option>
//                 );
//               })}
//             </select>

//             <select
//               value={pendingFilter}
//               onChange={(e) => setPendingFilter(e.target.value as any)}
//               className="px-3 py-2 border border-gray-300 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
//             >
//               <option value="all">All Tasks</option>
//               <option value="pending">Pending Only</option>
//               <option value="paid">Paid Only</option>
//             </select>

//             <button
//               onClick={() => setSortPendingDesc(!sortPendingDesc)}
//               className="px-3 py-2 border border-gray-300 rounded-xl bg-white shadow-sm flex items-center gap-1 hover:bg-gray-100 transition"
//             >
//               Sort Pending {sortPendingDesc ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
//             </button>

//             <div className="relative w-full max-w-sm">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
//               <input
//                 type="text"
//                 placeholder="Search by shop, revenue, or status..."
//                 className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//               />
//             </div>
//           </div>
//         </div>

//         {/* Loading / Error / Empty */}
//         <AnimatePresence mode="wait">
//           {loading && (
//             <motion.div
//               key="loading"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="text-center text-blue-600 py-10"
//             >
//               <Loader2 className="inline-block animate-spin text-4xl" />
//               <p className="mt-2 text-lg">Loading report...</p>
//             </motion.div>
//           )}
//           {error && (
//             <motion.div
//               key="error"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow-sm"
//             >
//               <h3 className="font-bold text-lg mb-2">Error</h3>
//               <p>{error}</p>
//             </motion.div>
//           )}
//           {!loading && !error && filteredData.length === 0 && (
//             <motion.div
//               key="empty"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="text-center text-gray-500 py-10"
//             >
//               <p className="text-lg">No tasks found for these filters.</p>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Data Table */}
//         <AnimatePresence>
//           {!loading && !error && filteredData.length > 0 && (
//             <motion.div
//               key="table"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.2, duration: 0.5 }}
//               className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg"
//             >
//               <table className="min-w-full text-sm">
//                 <thead className="bg-gray-100 text-gray-700">
//                   <tr>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">#</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Shop</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Mobile</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">First Task Date</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Revenue</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Received</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Pending</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Pending %</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {filteredData.map((row, idx) => {
//                     const receivedPercent = row.totalRevenue > 0 ? (row.totalReceived / row.totalRevenue) * 100 : 0;
//                     const pendingPercent = 100 - receivedPercent;

//                     return (
//                       <tr
//                         key={idx}
//                         className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
//                       >
//                         <td className="px-6 py-4 font-medium text-gray-700">{row.taskNumber}</td>
//                         <td className="px-6 py-4 font-medium text-gray-900">{row.shopName}</td>
//                         <td className="px-6 py-4 text-gray-700">{row.mobileNumber || "-"}</td>
//                         <td className="px-6 py-4 text-gray-500">{formatDate(row.firstCreatedAt)}</td>
//                         <td className="px-6 py-4 text-gray-900">₹{row.totalRevenue.toLocaleString()}</td>
//                         <td className="px-6 py-4">
//                           <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
//                             ₹{row.totalReceived.toLocaleString()}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4">
//                           <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
//                             ₹{row.pending.toLocaleString()}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 w-32">
//                           <div className="w-full h-4 rounded-full bg-gray-200 overflow-hidden">
//                             <div
//                               className="h-4 bg-green-500"
//                               style={{ width: `${receivedPercent}%` }}
//                             ></div>
//                             <div
//                               className="h-4 bg-red-500 absolute left-0 top-0"
//                               style={{ width: `${pendingPercent}%` }}
//                             ></div>
//                           </div>
//                           <div className="text-xs text-gray-700 mt-1 text-center">{pendingPercent.toFixed(2)}%</div>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     </div>
//   );
// }













// "use client";

// import { useEffect, useState } from "react";
// import { format, subMonths } from "date-fns";
// import { Search, Loader2, ArrowUp, ArrowDown } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";

// interface ReportEntry {
//   taskNumber: number;
//   shopName: string;
//   mobileNumber?: string;
//   firstCreatedAt: string;
//   totalRevenue: number;
//   totalReceived: number;
//   pending: number;
// }

// const getCurrentMonth = (): string => format(new Date(), "yyyy-MM");

// const getMonthOptions = () => {
//   return ["all", ...Array.from({ length: 12 }, (_, i) => format(subMonths(new Date(), i), "yyyy-MM"))];
// };

// export default function ShopReport() {
//   const [data, setData] = useState<ReportEntry[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [search, setSearch] = useState("");

//   const [selectedMonth, setSelectedMonth] = useState("all");
//   const [pendingFilter, setPendingFilter] = useState<"all" | "pending" | "paid">("all");
//   const [sortPendingDesc, setSortPendingDesc] = useState<boolean>(true);

//   useEffect(() => {
//     const fetchReport = async () => {
//       setLoading(true);
//       setError(null);
//       setData([]);
//       try {
//         const monthQuery = selectedMonth !== "all" ? `?month=${selectedMonth}` : "";
//         const res = await fetch(`/api/seller/day-report${monthQuery}`);
//         if (!res.ok) {
//           const errText = await res.text();
//           throw new Error(`Failed to fetch report. ${res.status} ${res.statusText}. ${errText}`);
//         }
//         const report: ReportEntry[] = await res.json();
//         setData(Array.isArray(report) ? report : []);
//       } catch (err: any) {
//         console.error(err);
//         setError(err.message || "Unknown error occurred");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReport();
//   }, [selectedMonth]);

//   let filteredData = data.filter((item) =>
//     Object.values(item).join(" ").toLowerCase().includes(search.toLowerCase())
//   );

//   if (pendingFilter === "pending") filteredData = filteredData.filter((item) => item.pending > 0);
//   if (pendingFilter === "paid") filteredData = filteredData.filter((item) => item.pending === 0);

//   filteredData = filteredData.sort((a, b) =>
//     sortPendingDesc ? b.pending - a.pending : a.pending - b.pending
//   );

//   const formatDate = (isoDate: string) => format(new Date(isoDate), "EEE, d LLL yyyy");

//   return (
//     <div className="p-8 bg-gray-50 min-h-screen">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
//           <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
//             <span className="text-4xl text-blue-600">📊</span> Shop Report
//           </h2>

//           {/* Filters */}
//           <div className="flex flex-col md:flex-row gap-3 items-center w-full md:w-auto bg-white p-3 rounded-2xl shadow-md border border-gray-200">
//             {/* Month Select */}
//             <div className="relative">
//               <select
//                 value={selectedMonth}
//                 onChange={(e) => setSelectedMonth(e.target.value)}
//                 className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700 font-medium"
//               >
//                 {getMonthOptions().map((month) => {
//                   const label =
//                     month === "all" ? "All Months" : format(new Date(month + "-01"), "LLLL, yyyy");
//                   return (
//                     <option key={month} value={month}>
//                       {label}
//                     </option>
//                   );
//                 })}
//               </select>
//               <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
//                 ▼
//               </span>
//             </div>

//             {/* Pending Filter */}
//             <div className="relative">
//               <select
//                 value={pendingFilter}
//                 onChange={(e) => setPendingFilter(e.target.value as any)}
//                 className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700 font-medium"
//               >
//                 <option value="all">All Tasks</option>
//                 <option value="pending">Pending Only</option>
//                 <option value="paid">Paid Only</option>
//               </select>
//               <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
//                 ▼
//               </span>
//             </div>

//             {/* Sort Button */}
//             <button
//               onClick={() => setSortPendingDesc(!sortPendingDesc)}
//               className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2"
//             >
//               Sort Pending {sortPendingDesc ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
//             </button>

//             {/* Search Input */}
//             <div className="relative w-full max-w-sm">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
//               <input
//                 type="text"
//                 placeholder="Search shop, revenue, or status..."
//                 className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700"
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//               />
//             </div>
//           </div>
//         </div>

//         {/* Loading / Error / Empty */}
//         <AnimatePresence mode="wait">
//           {loading && (
//             <motion.div
//               key="loading"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="text-center text-blue-600 py-10"
//             >
//               <Loader2 className="inline-block animate-spin text-4xl" />
//               <p className="mt-2 text-lg">Loading report...</p>
//             </motion.div>
//           )}
//           {error && (
//             <motion.div
//               key="error"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow-sm"
//             >
//               <h3 className="font-bold text-lg mb-2">Error</h3>
//               <p>{error}</p>
//             </motion.div>
//           )}
//           {!loading && !error && filteredData.length === 0 && (
//             <motion.div
//               key="empty"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="text-center text-gray-500 py-10"
//             >
//               <p className="text-lg">No tasks found for these filters.</p>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Data Table */}
//         <AnimatePresence>
//           {!loading && !error && filteredData.length > 0 && (
//             <motion.div
//               key="table"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.2, duration: 0.5 }}
//               className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg"
//             >
//               <table className="min-w-full text-sm">
//                 <thead className="bg-gray-100 text-gray-700">
//                   <tr>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">#</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Shop</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Mobile</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">First Task Date</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Revenue</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Received</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Pending</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Pending %</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {filteredData.map((row, idx) => {
//                     const receivedPercent = row.totalRevenue > 0 ? (row.totalReceived / row.totalRevenue) * 100 : 0;
//                     const pendingPercent = 100 - receivedPercent;

//                     return (
//                       <tr
//                         key={idx}
//                         className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
//                       >
//                         <td className="px-6 py-4 font-medium text-gray-700">{row.taskNumber}</td>
//                         <td className="px-6 py-4 font-medium text-gray-900">{row.shopName}</td>
//                         <td className="px-6 py-4 text-gray-700">{row.mobileNumber || "-"}</td>
//                         <td className="px-6 py-4 text-gray-500">{formatDate(row.firstCreatedAt)}</td>
//                         <td className="px-6 py-4 text-gray-900">₹{row.totalRevenue.toLocaleString()}</td>
//                         <td className="px-6 py-4">
//                           <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
//                             ₹{row.totalReceived.toLocaleString()}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4">
//                           <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
//                             ₹{row.pending.toLocaleString()}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 w-32">
//                           <div className="w-full h-4 rounded-full bg-gray-200 overflow-hidden relative">
//                             <div
//                               className="h-4 bg-green-500 absolute left-0 top-0"
//                               style={{ width: `${receivedPercent}%` }}
//                             ></div>
//                             <div
//                               className="h-4 bg-red-500 absolute right-0 top-0"
//                               style={{ width: `${pendingPercent}%` }}
//                             ></div>
//                           </div>
//                           <div className="text-xs text-gray-700 mt-1 text-center">{pendingPercent.toFixed(2)}%</div>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     </div>
//   );
// }









// "use client";

// import { useEffect, useState } from "react";
// import { format, subMonths } from "date-fns";
// import { Search, Loader2, ArrowUp, ArrowDown } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";

// interface ReportEntry {
//   taskNumber: number;
//   shopName: string;
//   mobileNumber?: string;
//   firstCreatedAt: string;
//   totalRevenue: number;
//   totalReceived: number;
//   pending: number;
// }

// const getMonthOptions = () => {
//   return Array.from({ length: 12 }, (_, i) => format(subMonths(new Date(), i), "yyyy-MM"));
// };

// export default function ShopReport() {
//   const [data, setData] = useState<ReportEntry[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [search, setSearch] = useState("");

//   const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
//   const [pendingFilter, setPendingFilter] = useState<"all" | "pending" | "paid">("all");
//   const [sortPendingDesc, setSortPendingDesc] = useState<boolean>(true);

//   useEffect(() => {
//     const fetchReport = async () => {
//       setLoading(true);
//       setError(null);
//       setData([]);
//       try {
//         const res = await fetch(`/api/seller/day-report?month=${selectedMonth}`);
//         if (!res.ok) {
//           const errText = await res.text();
//           throw new Error(`Failed to fetch report. ${res.status} ${res.statusText}. ${errText}`);
//         }
//         const report: ReportEntry[] = await res.json();
//         setData(Array.isArray(report) ? report : []);
//       } catch (err: any) {
//         console.error(err);
//         setError(err.message || "Unknown error occurred");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReport();
//   }, [selectedMonth]);

//   let filteredData = data.filter((item) =>
//     Object.values(item).join(" ").toLowerCase().includes(search.toLowerCase())
//   );

//   if (pendingFilter === "pending") filteredData = filteredData.filter((item) => item.pending > 0);
//   if (pendingFilter === "paid") filteredData = filteredData.filter((item) => item.pending === 0);

//   filteredData = filteredData.sort((a, b) =>
//     sortPendingDesc ? b.pending - a.pending : a.pending - b.pending
//   );

//   const formatDate = (isoDate: string) => format(new Date(isoDate), "EEE, d LLL yyyy");

//   // 📊 Calculate top summary
//   const totalRevenue = data.reduce((sum, r) => sum + r.totalRevenue, 0);
//   const totalReceived = data.reduce((sum, r) => sum + r.totalReceived, 0);
//   const totalPending = totalRevenue - totalReceived;
//   const receivedPercent = totalRevenue > 0 ? (totalReceived / totalRevenue) * 100 : 0;
//   const pendingPercent = 100 - receivedPercent;

//   return (
//     <div className="p-8 bg-gray-50 min-h-screen">
//       <div className="max-w-7xl mx-auto">
//         {/* Top Summary Line */}
//         {totalRevenue > 0 && (
//           <div className="mb-6">
//             <div className="w-full h-5 rounded-full bg-gray-200 overflow-hidden relative shadow-inner">
//               <div
//                 className="h-5 bg-green-500 absolute left-0 top-0"
//                 style={{ width: `${receivedPercent}%` }}
//               ></div>
//               <div
//                 className="h-5 bg-red-500 absolute right-0 top-0"
//                 style={{ width: `${pendingPercent}%` }}
//               ></div>
//             </div>
//             <div className="flex justify-between text-sm font-medium mt-2 text-gray-700">
//               <span>✅ Received: ₹{totalReceived.toLocaleString()} ({receivedPercent.toFixed(1)}%)</span>
//               <span>⏳ Pending: ₹{totalPending.toLocaleString()} ({pendingPercent.toFixed(1)}%)</span>
//             </div>
//           </div>
//         )}

//         {/* Header */}
//         <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
//           <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
//             <span className="text-4xl text-blue-600">📊</span> Shop Report
//           </h2>

//           {/* Filters */}
//           <div className="flex flex-col md:flex-row gap-3 items-center w-full md:w-auto bg-white p-3 rounded-2xl shadow-md border border-gray-200">
//             {/* Month Select */}
//             <div className="relative">
//               <select
//                 value={selectedMonth}
//                 onChange={(e) => setSelectedMonth(e.target.value)}
//                 className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700 font-medium"
//               >
//                 {getMonthOptions().map((month) => {
//                   const label = format(new Date(month + "-01"), "LLLL, yyyy");
//                   return (
//                     <option key={month} value={month}>
//                       {label}
//                     </option>
//                   );
//                 })}
//               </select>
//               <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
//                 ▼
//               </span>
//             </div>

//             {/* Pending Filter */}
//             <div className="relative">
//               <select
//                 value={pendingFilter}
//                 onChange={(e) => setPendingFilter(e.target.value as any)}
//                 className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700 font-medium"
//               >
//                 <option value="all">All Tasks</option>
//                 <option value="pending">Pending Only</option>
//                 <option value="paid">Paid Only</option>
//               </select>
//               <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
//                 ▼
//               </span>
//             </div>

//             {/* Sort Button */}
//             <button
//               onClick={() => setSortPendingDesc(!sortPendingDesc)}
//               className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2"
//             >
//               Sort Pending {sortPendingDesc ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
//             </button>

//             {/* Search Input */}
//             <div className="relative w-full max-w-sm">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
//               <input
//                 type="text"
//                 placeholder="Search shop, revenue, or status..."
//                 className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700"
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//               />
//             </div>
//           </div>
//         </div>

//         {/* Loading / Error / Empty */}
//         <AnimatePresence mode="wait">
//           {loading && (
//             <motion.div
//               key="loading"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="text-center text-blue-600 py-10"
//             >
//               <Loader2 className="inline-block animate-spin text-4xl" />
//               <p className="mt-2 text-lg">Loading report...</p>
//             </motion.div>
//           )}
//           {error && (
//             <motion.div
//               key="error"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow-sm"
//             >
//               <h3 className="font-bold text-lg mb-2">Error</h3>
//               <p>{error}</p>
//             </motion.div>
//           )}
//           {!loading && !error && filteredData.length === 0 && (
//             <motion.div
//               key="empty"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="text-center text-gray-500 py-10"
//             >
//               <p className="text-lg">No tasks found for these filters.</p>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Data Table */}
//         <AnimatePresence>
//           {!loading && !error && filteredData.length > 0 && (
//             <motion.div
//               key="table"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.2, duration: 0.5 }}
//               className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg"
//             >
//               <table className="min-w-full text-sm">
//                 <thead className="bg-gray-100 text-gray-700">
//                   <tr>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">#</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Shop</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Mobile</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">First Task Date</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Revenue</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Received</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Pending</th>
//                     <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Pending %</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {filteredData.map((row, idx) => {
//                     const receivedPercent = row.totalRevenue > 0 ? (row.totalReceived / row.totalRevenue) * 100 : 0;
//                     const pendingPercent = 100 - receivedPercent;

//                     return (
//                       <tr
//                         key={idx}
//                         className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
//                       >
//                         <td className="px-6 py-4 font-medium text-gray-700">{row.taskNumber}</td>
//                         <td className="px-6 py-4 font-medium text-gray-900">{row.shopName}</td>
//                         <td className="px-6 py-4 text-gray-700">{row.mobileNumber || "-"}</td>
//                         <td className="px-6 py-4 text-gray-500">{formatDate(row.firstCreatedAt)}</td>
//                         <td className="px-6 py-4 text-gray-900">₹{row.totalRevenue.toLocaleString()}</td>
//                         <td className="px-6 py-4">
//                           <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
//                             ₹{row.totalReceived.toLocaleString()}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4">
//                           <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
//                             ₹{row.pending.toLocaleString()}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 w-32">
//                           <div className="w-full h-4 rounded-full bg-gray-200 overflow-hidden relative">
//                             <div
//                               className="h-4 bg-green-500 absolute left-0 top-0"
//                               style={{ width: `${receivedPercent}%` }}
//                             ></div>
//                             <div
//                               className="h-4 bg-red-500 absolute right-0 top-0"
//                               style={{ width: `${pendingPercent}%` }}
//                             ></div>
//                           </div>
//                           <div className="text-xs text-gray-700 mt-1 text-center">{pendingPercent.toFixed(2)}%</div>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     </div>
//   );
// }






















// "use client";

// import { useEffect, useState } from "react";
// import { format, subMonths } from "date-fns";
// import { Search, Loader2, ArrowUp, ArrowDown } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";

// interface ReportEntry {
//   taskNumber: number;
//   shopName: string;
//   mobileNumber?: string;
//   firstCreatedAt: string;
//   totalRevenue: number;
//   totalReceived: number;
//   pending: number;
// }

// const getMonthOptions = () => {
//   return Array.from({ length: 12 }, (_, i) =>
//     format(subMonths(new Date(), i), "yyyy-MM")
//   );
// };

// export default function ShopReport() {
//   const [data, setData] = useState<ReportEntry[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [search, setSearch] = useState("");

//   const [selectedMonth, setSelectedMonth] = useState(
//     format(new Date(), "yyyy-MM")
//   );
//   const [pendingFilter, setPendingFilter] = useState<
//     "all" | "pending" | "paid"
//   >("all");
//   const [sortPendingDesc, setSortPendingDesc] = useState<boolean>(true);

//   useEffect(() => {
//     const fetchReport = async () => {
//       setLoading(true);
//       setError(null);
//       setData([]);
//       try {
//         const res = await fetch(`/api/seller/day-report?month=${selectedMonth}`);
//         if (!res.ok) {
//           const errText = await res.text();
//           throw new Error(
//             `Failed to fetch report. ${res.status} ${res.statusText}. ${errText}`
//           );
//         }
//         const report: ReportEntry[] = await res.json();
//         setData(Array.isArray(report) ? report : []);
//       } catch (err: any) {
//         console.error(err);
//         setError(err.message || "Unknown error occurred");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReport();
//   }, [selectedMonth]);

//   let filteredData = data.filter((item) =>
//     Object.values(item).join(" ").toLowerCase().includes(search.toLowerCase())
//   );

//   if (pendingFilter === "pending")
//     filteredData = filteredData.filter((item) => item.pending > 0);
//   if (pendingFilter === "paid")
//     filteredData = filteredData.filter((item) => item.pending === 0);

//   filteredData = filteredData.sort((a, b) =>
//     sortPendingDesc ? b.pending - a.pending : a.pending - b.pending
//   );

//   const formatDate = (isoDate: string) =>
//     format(new Date(isoDate), "EEE, d LLL yyyy");

//   // 📊 Top summary calculation
//   const totalRevenue = data.reduce((sum, r) => sum + r.totalRevenue, 0);
//   const totalReceived = data.reduce((sum, r) => sum + r.totalReceived, 0);
//   const totalPending = totalRevenue - totalReceived;

//   const receivedPercent =
//     totalRevenue > 0 ? (totalReceived / totalRevenue) * 100 : 0;
//   const pendingPercent =
//     totalRevenue > 0 ? 100 - receivedPercent : 0;

//   return (
//     <div className="bg-gray-50 min-h-screen flex flex-col">
//       {/* 🔝 Global Top Summary Bar */}
//       {totalRevenue > 0 && (
//         <div className="fixed top-0 left-0 w-full bg-white z-50 shadow-md">
//           <div className="w-full h-6 bg-gray-200 overflow-hidden flex">
//             {receivedPercent > 0 && (
//               <div
//                 className="h-6 bg-green-500"
//                 style={{ width: `${receivedPercent}%` }}
//               ></div>
//             )}
//             {pendingPercent > 0 && (
//               <div
//                 className="h-6 bg-red-500"
//                 style={{ width: `${pendingPercent}%` }}
//               ></div>
//             )}
//           </div>
//           <div className="flex justify-between text-sm font-medium px-6 py-2 text-gray-700">
//             <span>
//               ✅ Received: ₹{totalReceived.toLocaleString()} (
//               {receivedPercent.toFixed(1)}%)
//             </span>
//             <span>
//               ⏳ Pending: ₹{totalPending.toLocaleString()} (
//               {pendingPercent.toFixed(1)}%)
//             </span>
//           </div>
//         </div>
//       )}

//       {/* Page Content (with padding to avoid overlap) */}
//       <div className="pt-24 p-8 flex-1">
//         <div className="max-w-7xl mx-auto">
//           {/* Header */}
//           <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
//             <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
//               <span className="text-4xl text-blue-600">📊</span> Shop Report
//             </h2>

//             {/* Filters */}
//             <div className="flex flex-col md:flex-row gap-3 items-center w-full md:w-auto bg-white p-3 rounded-2xl shadow-md border border-gray-200">
//               {/* Month Select */}
//               <div className="relative">
//                 <select
//                   value={selectedMonth}
//                   onChange={(e) => setSelectedMonth(e.target.value)}
//                   className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700 font-medium"
//                 >
//                   {getMonthOptions().map((month) => {
//                     const label = format(new Date(month + "-01"), "LLLL, yyyy");
//                     return (
//                       <option key={month} value={month}>
//                         {label}
//                       </option>
//                     );
//                   })}
//                 </select>
//                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
//                   ▼
//                 </span>
//               </div>

//               {/* Pending Filter */}
//               <div className="relative">
//                 <select
//                   value={pendingFilter}
//                   onChange={(e) => setPendingFilter(e.target.value as any)}
//                   className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700 font-medium"
//                 >
//                   <option value="all">All Tasks</option>
//                   <option value="pending">Pending Only</option>
//                   <option value="paid">Paid Only</option>
//                 </select>
//                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
//                   ▼
//                 </span>
//               </div>

//               {/* Sort Button */}
//               <button
//                 onClick={() => setSortPendingDesc(!sortPendingDesc)}
//                 className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2"
//               >
//                 Sort Pending{" "}
//                 {sortPendingDesc ? (
//                   <ArrowDown size={16} />
//                 ) : (
//                   <ArrowUp size={16} />
//                 )}
//               </button>

//               {/* Search Input */}
//               <div className="relative w-full max-w-sm">
//                 <Search
//                   className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
//                   size={18}
//                 />
//                 <input
//                   type="text"
//                   placeholder="Search shop, revenue, or status..."
//                   className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700"
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Loading / Error / Empty */}
//           <AnimatePresence mode="wait">
//             {loading && (
//               <motion.div
//                 key="loading"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 className="text-center text-blue-600 py-10"
//               >
//                 <Loader2 className="inline-block animate-spin text-4xl" />
//                 <p className="mt-2 text-lg">Loading report...</p>
//               </motion.div>
//             )}
//             {error && (
//               <motion.div
//                 key="error"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow-sm"
//               >
//                 <h3 className="font-bold text-lg mb-2">Error</h3>
//                 <p>{error}</p>
//               </motion.div>
//             )}
//             {!loading && !error && filteredData.length === 0 && (
//               <motion.div
//                 key="empty"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 className="text-center text-gray-500 py-10"
//               >
//                 <p className="text-lg">No tasks found for these filters.</p>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Data Table */}
//           <AnimatePresence>
//             {!loading && !error && filteredData.length > 0 && (
//               <motion.div
//                 key="table"
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.2, duration: 0.5 }}
//                 className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg"
//               >
//                 <table className="min-w-full text-sm">
//                   <thead className="bg-gray-100 text-gray-700">
//                     <tr>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                         #
//                       </th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                         Shop
//                       </th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                         Mobile
//                       </th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                         First Task Date
//                       </th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                         Revenue
//                       </th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                         Received
//                       </th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                         Pending
//                       </th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                         Pending %
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {filteredData.map((row, idx) => {
//                       const receivedPercent =
//                         row.totalRevenue > 0
//                           ? (row.totalReceived / row.totalRevenue) * 100
//                           : 0;
//                       const pendingPercent =
//                         row.totalRevenue > 0 ? 100 - receivedPercent : 0;

//                       return (
//                         <tr
//                           key={idx}
//                           className={`${
//                             idx % 2 === 0 ? "bg-white" : "bg-gray-50"
//                           } hover:bg-blue-50 transition-colors`}
//                         >
//                           <td className="px-6 py-4 font-medium text-gray-700">
//                             {row.taskNumber}
//                           </td>
//                           <td className="px-6 py-4 font-medium text-gray-900">
//                             {row.shopName}
//                           </td>
//                           <td className="px-6 py-4 text-gray-700">
//                             {row.mobileNumber || "-"}
//                           </td>
//                           <td className="px-6 py-4 text-gray-500">
//                             {formatDate(row.firstCreatedAt)}
//                           </td>
//                           <td className="px-6 py-4 text-gray-900">
//                             ₹{row.totalRevenue.toLocaleString()}
//                           </td>
//                           <td className="px-6 py-4">
//                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
//                               ₹{row.totalReceived.toLocaleString()}
//                             </span>
//                           </td>
//                           <td className="px-6 py-4">
//                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
//                               ₹{row.pending.toLocaleString()}
//                             </span>
//                           </td>
//                           <td className="px-6 py-4 w-32">
//                             <div className="w-full h-4 rounded-full bg-gray-200 overflow-hidden flex">
//                               {receivedPercent > 0 && (
//                                 <div
//                                   className="h-4 bg-green-500"
//                                   style={{ width: `${receivedPercent}%` }}
//                                 ></div>
//                               )}
//                               {pendingPercent > 0 && (
//                                 <div
//                                   className="h-4 bg-red-500"
//                                   style={{ width: `${pendingPercent}%` }}
//                                 ></div>
//                               )}
//                             </div>
//                             <div className="text-xs text-gray-700 mt-1 text-center">
//                               {pendingPercent.toFixed(2)}%
//                             </div>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>
//       </div>
//     </div>
//   );
// }









// "use client";

// import { useEffect, useState } from "react";
// import { format, subMonths } from "date-fns";
// import { Search, Loader2, ArrowUp, ArrowDown } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";

// interface ReportEntry {
//   taskNumber: number;
//   shopName: string;
//   mobileNumber?: string;
//   firstCreatedAt: string;
//   totalRevenue: number;
//   totalReceived: number;
//   pending: number;
// }

// const getMonthOptions = () => {
//   return Array.from({ length: 12 }, (_, i) =>
//     format(subMonths(new Date(), i), "yyyy-MM")
//   );
// };

// export default function ShopReport() {
//   const [data, setData] = useState<ReportEntry[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [search, setSearch] = useState("");

//   const [selectedMonth, setSelectedMonth] = useState(
//     format(new Date(), "yyyy-MM")
//   );
//   const [pendingFilter, setPendingFilter] = useState<
//     "all" | "pending" | "paid"
//   >("all");
//   const [sortPendingDesc, setSortPendingDesc] = useState<boolean>(true);

//   useEffect(() => {
//     const fetchReport = async () => {
//       setLoading(true);
//       setError(null);
//       setData([]);
//       try {
//         const res = await fetch(`/api/seller/day-report?month=${selectedMonth}`);
//         if (!res.ok) {
//           const errText = await res.text();
//           throw new Error(
//             `Failed to fetch report. ${res.status} ${res.statusText}. ${errText}`
//           );
//         }
//         const report: ReportEntry[] = await res.json();
//         setData(Array.isArray(report) ? report : []);
//       } catch (err: any) {
//         console.error(err);
//         setError(err.message || "Unknown error occurred");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReport();
//   }, [selectedMonth]);

//   let filteredData = data.filter((item) =>
//     Object.values(item).join(" ").toLowerCase().includes(search.toLowerCase())
//   );

//   if (pendingFilter === "pending")
//     filteredData = filteredData.filter((item) => item.pending > 0);
//   if (pendingFilter === "paid")
//     filteredData = filteredData.filter((item) => item.pending === 0);

//   filteredData = filteredData.sort((a, b) =>
//     sortPendingDesc ? b.pending - a.pending : a.pending - b.pending
//   );

//   const formatDate = (isoDate: string) =>
//     format(new Date(isoDate), "EEE, d LLL yyyy");

//   // 📊 Top summary calculation
//   const totalRevenue = data.reduce((sum, r) => sum + r.totalRevenue, 0);
//   const totalReceived = data.reduce((sum, r) => sum + r.totalReceived, 0);
//   const totalPending = totalRevenue - totalReceived;

//   const receivedPercent =
//     totalRevenue > 0 ? (totalReceived / totalRevenue) * 100 : 0;
//   const pendingPercent =
//     totalRevenue > 0 ? 100 - receivedPercent : 0;

//   return (
//     <div className="bg-gray-50 min-h-screen flex flex-col">
//       {/* 🔝 Global Top Pending Line */}
//       {totalRevenue > 0 && (
//         <div className="fixed top-0 left-0 w-full bg-white z-50 shadow-md">
//           <div className="relative w-full h-3 bg-gray-200 overflow-hidden">
//             {pendingPercent > 0 && (
//               <motion.div
//                 initial={{ width: 0 }}
//                 animate={{ width: `${pendingPercent}%` }}
//                 transition={{ duration: 1 }}
//                 className="h-3 bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-end pr-1 text-[10px] font-bold text-white"
//               >
//                 {pendingPercent.toFixed(1)}%
//               </motion.div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Page Content (with padding to avoid overlap) */}
//       <div className="pt-12 p-8 flex-1">
//         <div className="max-w-7xl mx-auto">
//           {/* Header */}
//           <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
//             <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
//               <span className="text-4xl text-blue-600">📊</span> Shop Report
//             </h2>

//             {/* Filters */}
//             <div className="flex flex-col md:flex-row gap-3 items-center w-full md:w-auto bg-white p-3 rounded-2xl shadow-md border border-gray-200">
//               {/* Month Select */}
//               <div className="relative">
//                 <select
//                   value={selectedMonth}
//                   onChange={(e) => setSelectedMonth(e.target.value)}
//                   className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700 font-medium"
//                 >
//                   {getMonthOptions().map((month) => {
//                     const label = format(new Date(month + "-01"), "LLLL, yyyy");
//                     return (
//                       <option key={month} value={month}>
//                         {label}
//                       </option>
//                     );
//                   })}
//                 </select>
//                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
//                   ▼
//                 </span>
//               </div>

//               {/* Pending Filter */}
//               <div className="relative">
//                 <select
//                   value={pendingFilter}
//                   onChange={(e) => setPendingFilter(e.target.value as any)}
//                   className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700 font-medium"
//                 >
//                   <option value="all">All Tasks</option>
//                   <option value="pending">Pending Only</option>
//                   <option value="paid">Paid Only</option>
//                 </select>
//                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
//                   ▼
//                 </span>
//               </div>

//               {/* Sort Button */}
//               <button
//                 onClick={() => setSortPendingDesc(!sortPendingDesc)}
//                 className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2"
//               >
//                 Sort Pending{" "}
//                 {sortPendingDesc ? (
//                   <ArrowDown size={16} />
//                 ) : (
//                   <ArrowUp size={16} />
//                 )}
//               </button>

//               {/* Search Input */}
//               <div className="relative w-full max-w-sm">
//                 <Search
//                   className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
//                   size={18}
//                 />
//                 <input
//                   type="text"
//                   placeholder="Search shop, revenue, or status..."
//                   className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700"
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Loading / Error / Empty */}
//           <AnimatePresence mode="wait">
//             {loading && (
//               <motion.div
//                 key="loading"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 className="text-center text-blue-600 py-10"
//               >
//                 <Loader2 className="inline-block animate-spin text-4xl" />
//                 <p className="mt-2 text-lg">Loading report...</p>
//               </motion.div>
//             )}
//             {error && (
//               <motion.div
//                 key="error"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow-sm"
//               >
//                 <h3 className="font-bold text-lg mb-2">Error</h3>
//                 <p>{error}</p>
//               </motion.div>
//             )}
//             {!loading && !error && filteredData.length === 0 && (
//               <motion.div
//                 key="empty"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 className="text-center text-gray-500 py-10"
//               >
//                 <p className="text-lg">No tasks found for these filters.</p>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Data Table */}
//           <AnimatePresence>
//             {!loading && !error && filteredData.length > 0 && (
//               <motion.div
//                 key="table"
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.2, duration: 0.5 }}
//                 className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg"
//               >
//                 <table className="min-w-full text-sm">
//                   <thead className="bg-gray-100 text-gray-700">
//                     <tr>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                         #
//                       </th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                         Shop
//                       </th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                         Mobile
//                       </th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                         First Task Date
//                       </th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                         Revenue
//                       </th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                         Received
//                       </th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                         Pending
//                       </th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">
//                         Pending %
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {filteredData.map((row, idx) => {
//                       const receivedPercent =
//                         row.totalRevenue > 0
//                           ? (row.totalReceived / row.totalRevenue) * 100
//                           : 0;
//                       const pendingPercent =
//                         row.totalRevenue > 0 ? 100 - receivedPercent : 0;

//                       return (
//                         <tr
//                           key={idx}
//                           className={`${
//                             idx % 2 === 0 ? "bg-white" : "bg-gray-50"
//                           } hover:bg-blue-50 transition-colors`}
//                         >
//                           <td className="px-6 py-4 font-medium text-gray-700">
//                             {row.taskNumber}
//                           </td>
//                           <td className="px-6 py-4 font-medium text-gray-900">
//                             {row.shopName}
//                           </td>
//                           <td className="px-6 py-4 text-gray-700">
//                             {row.mobileNumber || "-"}
//                           </td>
//                           <td className="px-6 py-4 text-gray-500">
//                             {formatDate(row.firstCreatedAt)}
//                           </td>
//                           <td className="px-6 py-4 text-gray-900">
//                             ₹{row.totalRevenue.toLocaleString()}
//                           </td>
//                           <td className="px-6 py-4">
//                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
//                               ₹{row.totalReceived.toLocaleString()}
//                             </span>
//                           </td>
//                           <td className="px-6 py-4">
//                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
//                               ₹{row.pending.toLocaleString()}
//                             </span>
//                           </td>
//                           <td className="px-6 py-4 w-32">
//                             <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden flex">
//                               {pendingPercent > 0 && (
//                                 <div
//                                   className="h-3 bg-gradient-to-r from-red-500 to-orange-500"
//                                   style={{ width: `${pendingPercent}%` }}
//                                 ></div>
//                               )}
//                             </div>
//                             <div className="text-xs text-gray-700 mt-1 text-center">
//                               {pendingPercent.toFixed(2)}%
//                             </div>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>
//       </div>
//     </div>
//   );
// }

// "use client";

// import { useEffect, useState } from "react";
// import { format, subMonths } from "date-fns";
// import { Search, Loader2, ArrowUp, ArrowDown } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";

// interface ReportEntry {
//   taskNumber: number;
//   shopName?: string;
//   mobileNumber?: string;
//   firstCreatedAt: string;
//   totalRevenue: number;
//   totalReceived: number;
//   pending: number;
//   taskId?: string; // ✅ Added taskId for fallback
// }

// const getMonthOptions = () => {
//   return Array.from({ length: 12 }, (_, i) =>
//     format(subMonths(new Date(), i), "yyyy-MM")
//   );
// };

// export default function ShopReport() {
//   const [data, setData] = useState<ReportEntry[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [search, setSearch] = useState("");

//   const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
//   const [pendingFilter, setPendingFilter] = useState<"all" | "pending" | "paid">("all");
//   const [sortPendingDesc, setSortPendingDesc] = useState<boolean>(true);

//   useEffect(() => {
//     const fetchReport = async () => {
//       setLoading(true);
//       setError(null);
//       setData([]);
//       try {
//         const res = await fetch(`/api/seller/day-report?month=${selectedMonth}`);
//         if (!res.ok) {
//           const errText = await res.text();
//           throw new Error(`Failed to fetch report. ${res.status} ${res.statusText}. ${errText}`);
//         }
//         const report: ReportEntry[] = await res.json();

//         // ✅ Fallback: Use MongoDB taskId if shopName missing
//         const formatted = report.map((r) => ({
//           ...r,
//           shopName: r.shopName?.trim() || `Shop ${r.taskId?.slice(-6) || r.taskNumber}`,
//         }));

//         setData(Array.isArray(formatted) ? formatted : []);
//       } catch (err: any) {
//         console.error(err);
//         setError(err.message || "Unknown error occurred");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReport();
//   }, [selectedMonth]);

//   let filteredData = data.filter((item) =>
//     Object.values(item).join(" ").toLowerCase().includes(search.toLowerCase())
//   );

//   if (pendingFilter === "pending")
//     filteredData = filteredData.filter((item) => item.pending > 0);
//   if (pendingFilter === "paid")
//     filteredData = filteredData.filter((item) => item.pending === 0);

//   filteredData = filteredData.sort((a, b) =>
//     sortPendingDesc ? b.pending - a.pending : a.pending - b.pending
//   );

//   const formatDate = (isoDate: string) => format(new Date(isoDate), "EEE, d LLL yyyy");

//   const totalRevenue = data.reduce((sum, r) => sum + r.totalRevenue, 0);
//   const totalReceived = data.reduce((sum, r) => sum + r.totalReceived, 0);
//   const pendingPercent = totalRevenue > 0 ? ((totalRevenue - totalReceived) / totalRevenue) * 100 : 0;

//   return (
//     <div className="bg-gray-50 min-h-screen flex flex-col">
//       {/* Global Top Pending Line */}
//       {totalRevenue > 0 && (
//         <div className="fixed top-0 left-0 w-full bg-white z-50 shadow-md">
//           <div className="relative w-full h-3 bg-gray-200 overflow-hidden">
//             {pendingPercent > 0 && (
//               <motion.div
//                 initial={{ width: 0 }}
//                 animate={{ width: `${pendingPercent}%` }}
//                 transition={{ duration: 1 }}
//                 className="h-3 bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-end pr-1 text-[10px] font-bold text-white"
//               >
//                 {pendingPercent.toFixed(1)}%
//               </motion.div>
//             )}
//           </div>
//         </div>
//       )}

//       <div className="pt-12 p-8 flex-1">
//         <div className="max-w-7xl mx-auto">
//           {/* Header */}
//           <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
//             <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
//               <span className="text-4xl text-blue-600">📊</span> Shop Report
//             </h2>

//             {/* Filters */}
//             <div className="flex flex-col md:flex-row gap-3 items-center w-full md:w-auto bg-white p-3 rounded-2xl shadow-md border border-gray-200">
//               {/* Month Select */}
//               <div className="relative">
//                 <select
//                   value={selectedMonth}
//                   onChange={(e) => setSelectedMonth(e.target.value)}
//                   className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700 font-medium"
//                 >
//                   {getMonthOptions().map((month) => {
//                     const label = format(new Date(month + "-01"), "LLLL, yyyy");
//                     return <option key={month} value={month}>{label}</option>;
//                   })}
//                 </select>
//                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
//               </div>

//               {/* Pending Filter */}
//               <div className="relative">
//                 <select
//                   value={pendingFilter}
//                   onChange={(e) => setPendingFilter(e.target.value as any)}
//                   className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700 font-medium"
//                 >
//                   <option value="all">All Tasks</option>
//                   <option value="pending">Pending Only</option>
//                   <option value="paid">Paid Only</option>
//                 </select>
//                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
//               </div>

//               {/* Sort Button */}
//               <button
//                 onClick={() => setSortPendingDesc(!sortPendingDesc)}
//                 className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2"
//               >
//                 Sort Pending {sortPendingDesc ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
//               </button>

//               {/* Search Input */}
//               <div className="relative w-full max-w-sm">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
//                 <input
//                   type="text"
//                   placeholder="Search shop, revenue, or status..."
//                   className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700"
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Loading / Error / Empty */}
//           <AnimatePresence mode="wait">
//             {loading && (
//               <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-blue-600 py-10">
//                 <Loader2 className="inline-block animate-spin text-4xl" />
//                 <p className="mt-2 text-lg">Loading report...</p>
//               </motion.div>
//             )}
//             {error && (
//               <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow-sm">
//                 <h3 className="font-bold text-lg mb-2">Error</h3>
//                 <p>{error}</p>
//               </motion.div>
//             )}
//             {!loading && !error && filteredData.length === 0 && (
//               <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-gray-500 py-10">
//                 <p className="text-lg">No tasks found for these filters.</p>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Data Table */}
//           <AnimatePresence>
//             {!loading && !error && filteredData.length > 0 && (
//               <motion.div key="table" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg">
//                 <table className="min-w-full text-sm">
//                   <thead className="bg-gray-100 text-gray-700">
//                     <tr>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">#</th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Shop</th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Mobile</th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">First Task Date</th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Revenue</th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Received</th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Pending</th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Pending %</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {filteredData.map((row, idx) => {
//                       const receivedPercent = row.totalRevenue > 0 ? (row.totalReceived / row.totalRevenue) * 100 : 0;
//                       const pendingPercent = row.totalRevenue > 0 ? 100 - receivedPercent : 0;

//                       return (
//                         <tr key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}>
//                           <td className="px-6 py-4 font-medium text-gray-700">{row.taskNumber}</td>
//                           <td className="px-6 py-4 font-medium text-gray-900">{row.shopName}</td>
//                           <td className="px-6 py-4 text-gray-700">{row.mobileNumber || "-"}</td>
//                           <td className="px-6 py-4 text-gray-500">{formatDate(row.firstCreatedAt)}</td>
//                           <td className="px-6 py-4 text-gray-900">₹{row.totalRevenue.toLocaleString()}</td>
//                           <td className="px-6 py-4">
//                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
//                               ₹{row.totalReceived.toLocaleString()}
//                             </span>
//                           </td>
//                           <td className="px-6 py-4">
//                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
//                               ₹{row.pending.toLocaleString()}
//                             </span>
//                           </td>
//                           <td className="px-6 py-4 w-32">
//                             <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden flex">
//                               {pendingPercent > 0 && (
//                                 <div className="h-3 bg-gradient-to-r from-red-500 to-orange-500" style={{ width: `${pendingPercent}%` }}></div>
//                               )}
//                             </div>
//                             <div className="text-xs text-gray-700 mt-1 text-center">{pendingPercent.toFixed(2)}%</div>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>
//       </div>
//     </div>
//   );
// }




// "use client";

// import { useEffect, useState } from "react";
// import { format, subMonths } from "date-fns";
// import { Search, Loader2, ArrowUp, ArrowDown } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";

// interface ReportEntry {
//   taskNumber: number;
//   taskId?: string; // ✅ store task _id
//   shopName: string;
//   mobileNumber?: string;
//   firstCreatedAt: string;
//   totalRevenue: number;
//   totalReceived: number;
//   pending: number;
// }

// const getMonthOptions = () => {
//   return Array.from({ length: 12 }, (_, i) =>
//     format(subMonths(new Date(), i), "yyyy-MM")
//   );
// };

// export default function ShopReport() {
//   const [data, setData] = useState<ReportEntry[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [search, setSearch] = useState("");

//   const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
//   const [pendingFilter, setPendingFilter] = useState<"all" | "pending" | "paid">("all");
//   const [sortPendingDesc, setSortPendingDesc] = useState<boolean>(true);

//   useEffect(() => {
//     const fetchReport = async () => {
//       setLoading(true);
//       setError(null);
//       setData([]);
//       try {
//         const res = await fetch(`/api/seller/day-report?month=${selectedMonth}`);
//         if (!res.ok) {
//           const errText = await res.text();
//           throw new Error(`Failed to fetch report. ${res.status} ${res.statusText}. ${errText}`);
//         }
//         const report: ReportEntry[] = await res.json();

//         const formatted = report.map((r) => ({
//           ...r,
//           // ✅ show fallback shop name and store taskId for tracing
//           shopName: r.shopName?.trim() || `Shop ${r.taskId?.slice(-6)}`,
//         }));

//         setData(Array.isArray(formatted) ? formatted : []);
//       } catch (err: any) {
//         console.error(err);
//         setError(err.message || "Unknown error occurred");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReport();
//   }, [selectedMonth]);

//   let filteredData = data.filter((item) =>
//     Object.values(item).join(" ").toLowerCase().includes(search.toLowerCase())
//   );

//   if (pendingFilter === "pending")
//     filteredData = filteredData.filter((item) => item.pending > 0);
//   if (pendingFilter === "paid")
//     filteredData = filteredData.filter((item) => item.pending === 0);

//   filteredData = filteredData.sort((a, b) =>
//     sortPendingDesc ? b.pending - a.pending : a.pending - b.pending
//   );

//   const formatDate = (isoDate: string) => format(new Date(isoDate), "EEE, d LLL yyyy");

//   const totalRevenue = data.reduce((sum, r) => sum + r.totalRevenue, 0);
//   const totalReceived = data.reduce((sum, r) => sum + r.totalReceived, 0);
//   const pendingPercent = totalRevenue > 0 ? ((totalRevenue - totalReceived) / totalRevenue) * 100 : 0;

//   return (
//     <div className="bg-gray-50 min-h-screen flex flex-col">
//       {totalRevenue > 0 && (
//         <div className="fixed top-0 left-0 w-full bg-white z-50 shadow-md">
//           <div className="relative w-full h-3 bg-gray-200 overflow-hidden">
//             {pendingPercent > 0 && (
//               <motion.div
//                 initial={{ width: 0 }}
//                 animate={{ width: `${pendingPercent}%` }}
//                 transition={{ duration: 1 }}
//                 className="h-3 bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-end pr-1 text-[10px] font-bold text-white"
//               >
//                 {pendingPercent.toFixed(1)}%
//               </motion.div>
//             )}
//           </div>
//         </div>
//       )}

//       <div className="pt-12 p-8 flex-1">
//         <div className="max-w-7xl mx-auto">
//           {/* Header + Filters */}
//           <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
//             <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
//               <span className="text-4xl text-blue-600">📊</span> Shop Report
//             </h2>

//             <div className="flex flex-col md:flex-row gap-3 items-center w-full md:w-auto bg-white p-3 rounded-2xl shadow-md border border-gray-200">
//               {/* Month Select */}
//               <div className="relative">
//                 <select
//                   value={selectedMonth}
//                   onChange={(e) => setSelectedMonth(e.target.value)}
//                   className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700 font-medium"
//                 >
//                   {getMonthOptions().map((month) => {
//                     const label = format(new Date(month + "-01"), "LLLL, yyyy");
//                     return <option key={month} value={month}>{label}</option>;
//                   })}
//                 </select>
//                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
//               </div>

//               {/* Pending Filter */}
//               <div className="relative">
//                 <select
//                   value={pendingFilter}
//                   onChange={(e) => setPendingFilter(e.target.value as any)}
//                   className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700 font-medium"
//                 >
//                   <option value="all">All Tasks</option>
//                   <option value="pending">Pending Only</option>
//                   <option value="paid">Paid Only</option>
//                 </select>
//                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
//               </div>

//               {/* Sort Button */}
//               <button
//                 onClick={() => setSortPendingDesc(!sortPendingDesc)}
//                 className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2"
//               >
//                 Sort Pending {sortPendingDesc ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
//               </button>

//               {/* Search Input */}
//               <div className="relative w-full max-w-sm">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
//                 <input
//                   type="text"
//                   placeholder="Search shop, revenue, or status..."
//                   className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700"
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Loading / Error / Empty */}
//           <AnimatePresence mode="wait">
//             {loading && (
//               <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-blue-600 py-10">
//                 <Loader2 className="inline-block animate-spin text-4xl" />
//                 <p className="mt-2 text-lg">Loading report...</p>
//               </motion.div>
//             )}
//             {error && (
//               <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow-sm">
//                 <h3 className="font-bold text-lg mb-2">Error</h3>
//                 <p>{error}</p>
//               </motion.div>
//             )}
//             {!loading && !error && filteredData.length === 0 && (
//               <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-gray-500 py-10">
//                 <p className="text-lg">No tasks found for these filters.</p>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Data Table */}
//           <AnimatePresence>
//             {!loading && !error && filteredData.length > 0 && (
//               <motion.div key="table" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg">
//                 <table className="min-w-full text-sm">
//                   <thead className="bg-gray-100 text-gray-700">
//                     <tr>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">#</th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Shop / TaskId</th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Mobile</th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">First Task Date</th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Revenue</th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Received</th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Pending</th>
//                       <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Pending %</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {filteredData.map((row, idx) => {
//                       const receivedPercent = row.totalRevenue > 0 ? (row.totalReceived / row.totalRevenue) * 100 : 0;
//                       const pendingPercent = row.totalRevenue > 0 ? 100 - receivedPercent : 0;

//                       return (
//                         <tr key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}>
//                           <td className="px-6 py-4 font-medium text-gray-700">{row.taskNumber}</td>
//                           <td className="px-6 py-4 font-medium text-gray-900">
//                             {row.shopName} {row.taskId ? `(${row.taskId.slice(-6)})` : ""}
//                           </td>
//                           <td className="px-6 py-4 text-gray-700">{row.mobileNumber || "-"}</td>
//                           <td className="px-6 py-4 text-gray-500">{formatDate(row.firstCreatedAt)}</td>
//                           <td className="px-6 py-4 text-gray-900">₹{row.totalRevenue.toLocaleString()}</td>
//                           <td className="px-6 py-4">
//                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
//                               ₹{row.totalReceived.toLocaleString()}
//                             </span>
//                           </td>
//                           <td className="px-6 py-4">
//                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
//                               ₹{row.pending.toLocaleString()}
//                             </span>
//                           </td>
//                           <td className="px-6 py-4 w-32">
//                             <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden flex">
//                               {pendingPercent > 0 && (
//                                 <div className="h-3 bg-gradient-to-r from-red-500 to-orange-500" style={{ width: `${pendingPercent}%` }}></div>
//                               )}
//                             </div>
//                             <div className="text-xs text-gray-700 mt-1 text-center">{pendingPercent.toFixed(2)}%</div>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>
//       </div>
//     </div>
//   );
// }




"use client";

import { useEffect, useState } from "react";
import { format, subMonths } from "date-fns";
import { Search, Loader2, ArrowUp, ArrowDown, Eye, EyeOff, Download, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import TaskDetailsPanel from "./TaskDetailsPanel";

interface ReportEntry {
  taskNumber: number;
  taskId?: string; // ✅ store full MongoDB _id
  shopName: string;
  mobileNumber?: string;
  firstCreatedAt: string;
  totalRevenue: number;
  totalReceived: number;
  pending: number;
}

const getMonthOptions = () => {
  return Array.from({ length: 12 }, (_, i) =>
    format(subMonths(new Date(), i), "yyyy-MM")
  );
};

export default function ShopReport({ assignerId }: { assignerId?: string } = {}) {
  const [data, setData] = useState<ReportEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [pendingFilter, setPendingFilter] = useState<"all" | "pending" | "paid">("all");
  const [sortPendingDesc, setSortPendingDesc] = useState<boolean>(true);
  const [showTaskId, setShowTaskId] = useState(false); // ✅ toggle for TaskId column
  const [activeDropdownRow, setActiveDropdownRow] = useState<string | null>(null);
  const [viewedTaskId, setViewedTaskId] = useState<string | null>(null);
  const [showZeroRevenue, setShowZeroRevenue] = useState(false); // ✅ toggle for 0 revenue
  const [isExporting, setIsExporting] = useState(false);

  const { user, isLoaded } = useUser();
  const roleFromMetadata = user?.publicMetadata?.role as string;
  const userRole = String(isLoaded ? (roleFromMetadata || 'user') : 'user').toLowerCase().trim();
  const isMaster = userRole === 'master';

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      setData([]);
      try {
        let url = `/api/seller/day-report?month=${selectedMonth}`;
        if (assignerId) {
          url += `&assignerId=${assignerId}`;
        }
        const res = await fetch(url);
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Failed to fetch report. ${res.status} ${res.statusText}. ${errText}`);
        }
        const report: ReportEntry[] = await res.json();

        const formatted = report.map((r) => ({
          ...r,
          shopName: r.shopName?.trim() || "Unknown", // ✅ keep shop name clean
        }));

        setData(Array.isArray(formatted) ? formatted : []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [selectedMonth, assignerId]);

  let filteredData = data.filter((item) =>
    Object.values(item).join(" ").toLowerCase().includes(search.toLowerCase())
  );

  if (!showZeroRevenue) {
    filteredData = filteredData.filter((item) => item.totalRevenue > 0);
  }

  if (pendingFilter === "pending")
    filteredData = filteredData.filter((item) => item.pending > 0);
  if (pendingFilter === "paid")
    filteredData = filteredData.filter((item) => item.pending === 0);

  filteredData = filteredData.sort((a, b) =>
    sortPendingDesc ? b.pending - a.pending : a.pending - b.pending
  );

  const formatDate = (isoDate: string) => format(new Date(isoDate), "EEE, d LLL yyyy");

  const totalRevenue = data.reduce((sum, r) => sum + r.totalRevenue, 0);
  const totalReceived = data.reduce((sum, r) => sum + r.totalReceived, 0);
  const pendingPercent = totalRevenue > 0 ? ((totalRevenue - totalReceived) / totalRevenue) * 100 : 0;

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {totalRevenue > 0 && (
        <div className="fixed top-0 left-0 w-full bg-white z-50 shadow-md">
          <div className="relative w-full h-3 bg-gray-200 overflow-hidden">
            {pendingPercent > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pendingPercent}%` }}
                transition={{ duration: 1 }}
                className="h-3 bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-end pr-1 text-[10px] font-bold text-white"
              >
                {pendingPercent.toFixed(1)}%
              </motion.div>
            )}
          </div>
        </div>
      )}

      <div className="pt-12 p-8 flex-1">
        <div className="max-w-7xl mx-auto">
          {/* Header + Filters */}
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
            <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="text-4xl text-blue-600">📊</span> Shop Report
            </h2>

            <div className="flex flex-col md:flex-row gap-3 items-center w-full md:w-auto bg-white p-3 rounded-2xl shadow-md border border-gray-200">
              {/* Month Select */}
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700 font-medium"
                >
                  {getMonthOptions().map((month) => {
                    const label = format(new Date(month + "-01"), "LLLL, yyyy");
                    return <option key={month} value={month}>{label}</option>;
                  })}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
              </div>

              {/* Pending Filter */}
              <div className="relative">
                <select
                  value={pendingFilter}
                  onChange={(e) => setPendingFilter(e.target.value as any)}
                  className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700 font-medium"
                >
                  <option value="all">All Tasks</option>
                  <option value="pending">Pending Only</option>
                  <option value="paid">Paid Only</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
              </div>

              {/* Sort Button */}
              <button
                onClick={() => setSortPendingDesc(!sortPendingDesc)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2"
              >
                Sort Pending {sortPendingDesc ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
              </button>

              {/* Task ID Toggle */}
              <button
                onClick={() => setShowTaskId(!showTaskId)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow hover:from-purple-600 hover:to-purple-700 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                {showTaskId ? <EyeOff size={16} /> : <Eye size={16} />} Task ID
              </button>

              {/* Zero Revenue Toggle */}
              <button
                onClick={() => setShowZeroRevenue(!showZeroRevenue)}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl shadow hover:from-teal-600 hover:to-teal-700 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                {showZeroRevenue ? <EyeOff size={16} /> : <Eye size={16} />} {showZeroRevenue ? "Hide 0 Revenue" : "Show All"}
              </button>

              {/* Export Excel (Master Only) */}
              {isMaster && (
                <button
                  disabled={isExporting}
                  onClick={async () => {
                    setIsExporting(true);
                    try {
                      const xlsx = await import("xlsx");
                      const formattedReport = filteredData.map((row) => ({
                        "Shop Name": row.shopName,
                        "Task ID": row.taskId || "-",
                        "Mobile": row.mobileNumber || "-",
                        "First Task Date": formatDate(row.firstCreatedAt),
                        "Total Revenue": row.totalRevenue,
                        "Total Received": row.totalReceived,
                        "Pending": row.pending
                      }));

                      const wb = xlsx.utils.book_new();
                      const ws = xlsx.utils.json_to_sheet(formattedReport);
                      xlsx.utils.book_append_sheet(wb, ws, "Shop Report");
                      xlsx.writeFile(wb, `Filtered_Shop_Report_${selectedMonth}.xlsx`);
                    } catch (err) {
                      console.error("Export failed", err);
                      alert("Failed to export Excel.");
                    } finally {
                      setIsExporting(false);
                    }
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2"
                >
                  {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Export Excel
                </button>
              )}

              {/* Search Input */}
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search shop, revenue, or status..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <AnimatePresence>
            {!loading && !error && filteredData.length > 0 && (
              <motion.div key="table" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">#</th>
                      <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Shop Name</th>
                      {showTaskId && (
                        <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Task ID</th>
                      )}
                      <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Mobile</th>
                      <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">First Task Date</th>
                      <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Received</th>
                      <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Pending</th>
                      <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Pending %</th>
                      <th className="px-6 py-3 text-center font-semibold uppercase tracking-wider w-16">Options</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.map((row, idx) => {
                      const receivedPercent = row.totalRevenue > 0 ? (row.totalReceived / row.totalRevenue) * 100 : 0;
                      const pendingPercent = row.totalRevenue > 0 ? 100 - receivedPercent : 0;

                      return (
                        <tr key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}>
                          <td className="px-6 py-4 font-medium text-gray-700">{row.taskNumber}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{row.shopName}</td>
                          {showTaskId && (
                            <td className="px-6 py-4 text-xs text-gray-600">{row.taskId}</td>
                          )}
                          <td className="px-6 py-4 text-gray-700">{row.mobileNumber || "-"}</td>
                          <td className="px-6 py-4 text-gray-500">{formatDate(row.firstCreatedAt)}</td>
                          <td className="px-6 py-4 text-gray-900">₹{row.totalRevenue.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              ₹{row.totalReceived.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              ₹{row.pending.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 w-32">
                            <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden flex">
                              {pendingPercent > 0 && (
                                <div className="h-3 bg-gradient-to-r from-red-500 to-orange-500" style={{ width: `${pendingPercent}%` }}></div>
                              )}
                            </div>
                            <div className="text-xs text-gray-700 mt-1 text-center">{pendingPercent.toFixed(2)}%</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="relative inline-block text-left">
                              <button
                                onClick={() => setActiveDropdownRow(activeDropdownRow === row.taskId ? null : (row.taskId || null))}
                                className="p-1 rounded-full hover:bg-gray-200 transition-colors focus:outline-none"
                                aria-label="Options"
                              >
                                <MoreVertical className="w-5 h-5 text-gray-600" />
                              </button>
                              {activeDropdownRow === row.taskId && row.taskId && (
                                <div className="origin-top-right absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        if (row.taskId) setViewedTaskId(row.taskId);
                                        setActiveDropdownRow(null);
                                      }}
                                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    >
                                      View Details
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {viewedTaskId && (
        <TaskDetailsPanel
          taskId={viewedTaskId}
          onClose={() => setViewedTaskId(null)}
        />
      )}
    </div>
  );
}
