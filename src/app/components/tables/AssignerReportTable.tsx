// // src/app/components/tables/AssignerReportTable.tsx
// "use client";

// import React, { useEffect, useState } from "react";
// import { IndianRupee, Calendar } from "lucide-react";
// import { motion } from "framer-motion";

// // Define the data structure for the assigner report
// type AssignerReport = {
//   name: string;
//   email: string;
//   totalRevenue: number;
//   amountReceived: number;
//   pendingAmount: number;
//   totalSales: number;
// };

// // Define the structure for the month options
// type MonthOption = {
//   value: string; // YYYY-MM format for API
//   label: string; // Mon, YYYY format for display
// };

// /**
//  * A React component that fetches and displays sales data grouped by assigner.
//  * It uses the /api/stats/user-performance/by-assigner endpoint.
//  */
// export default function AssignerReportTable() {
//   const [data, setData] = useState<AssignerReport[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
  
//   // State to manage the selected month for the dropdown
//   const [selectedMonth, setSelectedMonth] = useState<string>('');

//   // Function to generate the last 12 months with both value and label
//   const generateMonths = (): MonthOption[] => {
//     const months = [];
//     const today = new Date();
//     for (let i = 0; i < 12; i++) {
//       const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
//       const year = date.getFullYear();
//       const monthNumber = String(date.getMonth() + 1).padStart(2, '0');
//       const monthLabel = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
//       months.push({
//         value: `${year}-${monthNumber}`,
//         label: monthLabel,
//       });
//     }
//     return months;
//   };
  
//   const availableMonths = generateMonths();
//   const selectedMonthLabel = availableMonths.find(month => month.value === selectedMonth)?.label || 'Loading...';

//   // Set the default selected month to the current month on first render
//   useEffect(() => {
//     if (availableMonths.length > 0 && !selectedMonth) {
//       setSelectedMonth(availableMonths[0].value);
//     }
//   }, [availableMonths, selectedMonth]);

//   useEffect(() => {
//     // Only fetch data if a month is selected
//     if (!selectedMonth) return;
    
//     // Log the API call to help with debugging the backend
//     console.log(`Fetching data for month: ${selectedMonth}`);
//     const apiUrl = `/api/stats/user-performance/by-assigner?month=${selectedMonth}`;
//     console.log(`API URL: ${apiUrl}`);

//     // Fetch data from the API endpoint, passing the selected month
//     const fetchData = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const res = await fetch(apiUrl);
//         if (!res.ok) {
//           throw new Error("Failed to fetch data");
//         }
//         const json = await res.json();
//         setData(json.data || []);
//       } catch (err: any) {
//         console.error("Failed to fetch assigner report:", err);
//         setError(err.message || "An unexpected error occurred.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [selectedMonth]); // Rerun effect when selectedMonth changes

//   return (
//     <div className="bg-white p-6 rounded-lg shadow-2xl border border-gray-100 font-sans text-gray-900 transition-shadow duration-300 hover:shadow-3xl">
//       {/* Header */}
//       <div className="mb-6 border-b pb-4 flex items-center justify-between">
//         <h2 className="text-2xl font-bold flex items-center gap-2">
//           👤 Sales by Assigner
//         </h2>
//         <select
//           value={selectedMonth}
//           onChange={(e) => setSelectedMonth(e.target.value)}
//           className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
//         >
//           {availableMonths.map(month => (
//             <option key={month.value} value={month.value}>{month.label}</option>
//           ))}
//         </select>
//       </div>

//       {loading ? (
//         <p className="text-gray-500 text-center py-10">Loading...</p>
//       ) : error ? (
//         <p className="text-center text-red-500">Error: {error}</p>
//       ) : data.length === 0 ? (
//         <p className="text-gray-500 text-center py-10">
//           No data available for {selectedMonthLabel}.
//         </p>
//       ) : (
//         <div className="overflow-x-auto rounded-lg shadow-lg">
//           <table className="min-w-full text-left text-sm">
//             <thead className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
//               <tr>
//                 <th className="p-4 font-bold tracking-wider">Assigner</th>
//                 <th className="p-4 font-bold tracking-wider">Email</th>
//                 <th className="p-4 font-bold tracking-wider text-right">Sales</th>
//                 <th className="p-4 font-bold tracking-wider text-right">Total Revenue</th>
//                 <th className="p-4 font-bold tracking-wider text-right">Received</th>
//                 <th className="p-4 font-bold tracking-wider text-right">Pending</th>
//               </tr>
//             </thead>
//             <tbody>
//               {data.map((assigner, index) => {
//                 const pending = assigner.totalRevenue - assigner.amountReceived;
//                 const rowBg = index % 2 === 0 ? "bg-white" : "bg-gray-50";
//                 return (
//                   <motion.tr
//                     key={index}
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: index * 0.05 }}
//                     className={`border-b hover:bg-gray-100 transition-colors duration-200 ${rowBg}`}
//                   >
//                     <td className="p-4 font-medium">{assigner.name}</td>
//                     <td className="p-4 text-gray-500">{assigner.email}</td>
//                     <td className="p-4 text-right font-semibold">{assigner.totalSales}</td>
//                     <td className="p-4 text-right font-semibold text-green-700">₹{assigner.totalRevenue.toLocaleString()}</td>
//                     <td className="p-4 text-right font-semibold text-blue-700">₹{assigner.amountReceived.toLocaleString()}</td>
//                     <td className="p-4 text-right">
//                       <span className={`px-3 py-1 text-xs rounded-full font-bold ${
//                         pending === 0
//                           ? "bg-green-100 text-green-700"
//                           : "bg-red-100 text-red-700"
//                       }`}>
//                         ₹{pending.toLocaleString()}
//                       </span>
//                     </td>
//                   </motion.tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }



"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  IndianRupee, 
  Users, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  Search, 
  ArrowUp, 
  ArrowDown,
  Calendar   // FIXED: Calendar is now imported
} from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip } from "react-tooltip";

// 1. Define the base data structure for the assigner report
type AssignerReport = {
  name: string;
  email: string;
  totalRevenue: number;
  amountReceived: number;
  pendingAmount: number; 
  totalSales: number;
};

// 2. Define the calculated data structure (for internal component use)
type CalculatedReport = AssignerReport & {
  pendingPercentage: number;
};

// 3. Define the Sort Configuration type
type SortConfig = {
  // All keys from AssignerReport, plus the calculated key
  key: keyof CalculatedReport | null; 
  direction: "ascending" | "descending";
};

// 4. Define the structure for the month options
type MonthOption = {
  value: string; // YYYY-MM format for API
  label: string; // Mon, YYYY format for display
};

/**
 * A React component that fetches and displays sales data grouped by assigner.
 */
export default function AssignerReportTable() {
  const [data, setData] = useState<AssignerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: "ascending" });

  // --- Utility Functions ---

  const generateMonths = (): MonthOption[] => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const monthNumber = String(date.getMonth() + 1).padStart(2, '0');
      const monthLabel = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      months.push({
        value: `${year}-${monthNumber}`,
        label: monthLabel,
      });
    }
    return months;
  };
  
  const availableMonths = generateMonths();
  const selectedMonthLabel = availableMonths.find(month => month.value === selectedMonth)?.label || 'Current Month';

  // --- Data Fetching and Initialization ---

  // Set the default selected month on first render
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0].value);
    }
  }, [availableMonths, selectedMonth]);

  // Fetch data effect (runs on month change)
  useEffect(() => {
    if (!selectedMonth) return;
    
    const apiUrl = `/api/stats/user-performance/by-assigner?month=${selectedMonth}`;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(apiUrl);
        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }
        const json = await res.json();
        setData(json.data || []);
      } catch (err: any) {
        console.error("Failed to fetch assigner report:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth]); 

  // --- Sorting and Filtering Logic ---

  const processedData = useMemo(() => {
    // 1. Calculate derived values (Pending, Pending Percentage)
    const dataWithCalculations: CalculatedReport[] = data.map(row => {
      const pendingAmount = row.totalRevenue - row.amountReceived;
      return {
        ...row,
        pendingAmount,
        pendingPercentage: row.totalRevenue > 0 ? (pendingAmount / row.totalRevenue) * 100 : 0,
      };
    });

    let filteredAndSortedData = [...dataWithCalculations];

    // 2. Filter data based on search query
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filteredAndSortedData = filteredAndSortedData.filter(row => {
        return (
          row.name.toLowerCase().includes(lowerCaseQuery) ||
          row.email.toLowerCase().includes(lowerCaseQuery) ||
          row.totalRevenue.toLocaleString().includes(lowerCaseQuery) ||
          row.totalSales.toLocaleString().includes(lowerCaseQuery)
        );
      });
    }

    // 3. Sort data
    if (sortConfig.key !== null) {
      filteredAndSortedData.sort((a, b) => {
        const key = sortConfig.key as keyof CalculatedReport;
        const aValue = a[key];
        const bValue = b[key];

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredAndSortedData;
  }, [data, sortConfig, searchQuery]);
  
  // Request sort utility
  const requestSort = (key: keyof CalculatedReport) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };
  
  // Sort icon utility
  const getSortIcon = (key: keyof CalculatedReport) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === "ascending" ? <ArrowUpIcon size={14} /> : <ArrowDownIcon size={14} />;
  };

  // --- Render Component ---

  return (
    <div className="bg-white p-8 rounded-lg shadow-2xl border border-gray-100 font-sans text-gray-900 transition-shadow duration-300 hover:shadow-3xl">
      
      {/* Header */}
      <div className="mb-6 border-b pb-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          👤 Sales by Assigner
        </h2>
        
        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-blue-500" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
          >
            {availableMonths.map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200 mb-6">
        <Search size={20} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or sales amount..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
        />
      </div>

      {/* Conditional Rendering: Loading, Error, Empty, or Table */}
      {loading && selectedMonth ? (
        <p className="text-gray-500 text-center py-10">Loading data for {selectedMonthLabel}...</p>
      ) : error ? (
        <p className="text-center text-red-500 font-bold py-10">Error: {error}</p>
      ) : processedData.length === 0 ? (
        <p className="text-gray-500 text-center py-10 text-lg">
          No matching sales data found for **{selectedMonthLabel}**.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-lg">
          <table className="min-w-full text-left text-sm">
            {/* Table Header with Sorting */}
            <thead className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white sticky top-0 z-10">
              <tr>
                <th className="p-4 font-bold tracking-wider cursor-pointer" data-tooltip-id="name-tip" onClick={() => requestSort("name")}>
                  <span className="flex items-center gap-2">Assigner {getSortIcon("name")}</span>
                </th>
                <th className="p-4 font-bold tracking-wider">Email</th>
                <th className="p-4 font-bold tracking-wider text-right cursor-pointer" data-tooltip-id="sales-tip" onClick={() => requestSort("totalSales")}>
                  <span className="flex items-center justify-end gap-2"><Users size={16} /> Sales {getSortIcon("totalSales")}</span>
                </th>
                <th className="p-4 font-bold tracking-wider text-right cursor-pointer" data-tooltip-id="revenue-tip" onClick={() => requestSort("totalRevenue")}>
                  <span className="flex items-center justify-end gap-2"><IndianRupee size={16} /> Revenue {getSortIcon("totalRevenue")}</span>
                </th>
                <th className="p-4 font-bold tracking-wider text-right cursor-pointer" data-tooltip-id="received-tip" onClick={() => requestSort("amountReceived")}>
                  <span className="flex items-center justify-end gap-2">Received {getSortIcon("amountReceived")}</span>
                </th>
                <th className="p-4 font-bold tracking-wider text-right cursor-pointer" data-tooltip-id="pending-tip" onClick={() => requestSort("pendingAmount")}>
                  <span className="flex items-center justify-end gap-2">Pending {getSortIcon("pendingAmount")}</span>
                </th>
                <th className="p-4 font-bold tracking-wider text-right cursor-pointer" data-tooltip-id="pending-percent-tip" onClick={() => requestSort("pendingPercentage")}>
                  <span className="flex items-center justify-end gap-2">Pending % {getSortIcon("pendingPercentage")}</span>
                </th>
              </tr>
            </thead>
            
            {/* Table Body */}
            <tbody>
              {processedData.map((assigner, index) => {
                const rowBg = index % 2 === 0 ? "bg-white" : "bg-gray-50";
                
                let percentageClassName = '';
                let progressBarColor = 'bg-red-500';
                if (assigner.pendingPercentage === 0) {
                    percentageClassName = 'bg-green-100 text-green-700';
                    progressBarColor = 'bg-green-500';
                } else if (assigner.pendingPercentage <= 10) {
                    percentageClassName = 'bg-yellow-100 text-yellow-700';
                    progressBarColor = 'bg-yellow-500';
                } else {
                    percentageClassName = 'bg-red-100 text-red-700';
                    progressBarColor = 'bg-red-500';
                }

                return (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border-b hover:bg-gray-100 transition-colors duration-200 ${rowBg}`}
                  >
                    <td className="p-4 font-bold text-gray-700">{assigner.name}</td>
                    <td className="p-4 text-gray-500">{assigner.email}</td>
                    <td className="p-4 text-right font-semibold text-gray-600">{assigner.totalSales.toLocaleString()}</td>
                    <td className="p-4 text-right font-bold text-green-700">₹{assigner.totalRevenue.toLocaleString()}</td>
                    
                    {/* Received Column with Progress Bar */}
                    <td className="p-4 text-right font-bold text-blue-700">
                        <span className="flex flex-col items-end gap-1">
                            ₹{assigner.amountReceived.toLocaleString()}
                            {assigner.totalRevenue > 0 && (
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        style={{ width: `${(assigner.amountReceived / assigner.totalRevenue) * 100}%` }}
                                        className="h-full bg-blue-500 transition-all duration-500 ease-out"
                                    ></div>
                                </div>
                            )}
                        </span>
                    </td>

                    {/* Pending Column with Status Pill */}
                    <td className="p-4 text-right">
                      <span className={`px-3 py-1 text-xs rounded-full font-bold inline-block min-w-[70px] text-center ${
                          assigner.pendingAmount === 0
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                        ₹{assigner.pendingAmount.toLocaleString()}
                      </span>
                    </td>
                    
                    {/* Pending % Column with Percentage and Progress Bar */}
                    <td className="p-4 text-right">
                        <span className="flex flex-col items-end gap-1">
                            <span className={`text-sm font-extrabold ${percentageClassName.split(' ')[1]}`}>
                                {assigner.pendingPercentage.toFixed(1)}%
                            </span>
                            {assigner.totalRevenue > 0 && (
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        style={{ width: `${assigner.pendingPercentage}%` }}
                                        className={`h-full ${progressBarColor} transition-all duration-500 ease-out`}
                                    ></div>
                                </div>
                            )}
                        </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Tooltip Definitions */}
      <Tooltip id="name-tip" content="Assigner name. Click to sort alphabetically." />
      <Tooltip id="sales-tip" content="Total number of sales/projects assigned to this user in the selected month." />
      <Tooltip id="revenue-tip" content="Total revenue value of all sales assigned this month." />
      <Tooltip id="received-tip" content="Actual amount received from sales this month." />
      <Tooltip id="pending-tip" content="Remaining unpaid balance (Revenue - Received)." />
      <Tooltip id="pending-percent-tip" content="Percentage of total revenue that remains pending." />
    </div>
  );
}