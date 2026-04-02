// "use client";

// import React, { useEffect, useState } from "react";
// import Link from "next/link";
// import { useUser } from "@clerk/nextjs";
// import { useRouter } from "next/navigation";
// import { IndianRupee, TrendingUp, CheckCircle, ShoppingBag, Percent } from "lucide-react"; 

// import RevenueByAssigneeChart from "../components/charts/RevenueByAssigneeChart";
// import MonthReportTable from "../components/tables/MonthReportTable";
// import WeekReportTable from "../components/tables/WeekReportTable";
// import DayReportTable from "../components/tables/DayReportTable";
// import GoalProgress from "../components/charts/GoalProgress";
// import AllReportsSection from "../components/tables/AllReportsSection";
// import CumulativeChartSwitcher from "../components/charts/CumulativeChartSwitcher";

// // ⬇️ New imports for combined Assigner sales section
// import DayReportByAssignerTable from "../components/tables/DayReportByAssignerTable";
// import WeekReportByAssignerTable from "../components/tables/AssignerReportTable";
// import CategorySalesTable from "../components/tables/category-sales"; 

// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
// } from "recharts";

// interface SalesStats {
//   totalRevenue: number;
//   amountReceived: number;
//   pendingAmount: number;
//   totalSales: number;
// }

// interface MonthlyChartData {
//   month: string;
//   revenue: number;
// }

// interface AssigneeChartData {
//   assignee: string;
//   revenue: number;
// }

// type ReportEntry = Record<string, any>;

// const tabs = [
//   { label: "All Reports", key: "all" },
//     { label: "By Assigner", key: "assigner" },
//   { label: "Day", key: "day" },
//   { label: "Week", key: "week" },
//   { label: "Month", key: "month" },

//   { label: "Charts", key: "charts" },
// ];

// export default function SalesDashboardPage() {
//   const { user } = useUser();
//   const router = useRouter();

//   const [stats, setStats] = useState<SalesStats | null>(null);
//   const [monthlyData, setMonthlyData] = useState<MonthlyChartData[]>([]);
//   const [assigneeData, setAssigneeData] = useState<AssigneeChartData[]>([]);
//   const [dayData, setDayData] = useState<ReportEntry[]>([]);
//   const [weekData, setWeekData] = useState<ReportEntry[]>([]);
//   const [monthTableData, setMonthTableData] = useState<ReportEntry[]>([]);
//   const [cumulativeData, setCumulativeData] = useState<ReportEntry[]>([]);
//   const [activeTab, setActiveTab] = useState("all");
//   const [showGoalProgress, setShowGoalProgress] = useState(false);
//   const [cumulativeDayData, setCumulativeDayData] = useState<ReportEntry[]>([]);

//   // Calculate pending percentage
//   const pendingPercentage = stats?.totalRevenue && stats.totalRevenue > 0
//     ? ((stats.pendingAmount / stats.totalRevenue) * 100).toFixed(1)
//     : "0.0";


//   useEffect(() => {
//     if (user && !["admin", "master"].includes(user?.publicMetadata?.role as string)) {
//       router.push("/unauthorized");
//     }
//   }, [user, router]);

//   useEffect(() => {
//     fetch("/api/stats/user-performance/overview")
//       .then((res) => res.json())
//       .then(setStats)
//       .catch(() => setStats(null));

//     fetch("/api/stats/user-performance/monthly")
//       .then((res) => res.json())
//       .then((data: Record<string, number>) => {
//         setMonthlyData(Object.entries(data).map(([month, revenue]) => ({
//           month,
//           revenue: typeof revenue === "number" ? revenue : 0,
//         })));
//       })
//       .catch(() => setMonthlyData([]));

//     fetch("/api/stats/user-performance/by-assignee")
//       .then((res) => res.json())
//       .then((res: Record<string, number>) => {
//         setAssigneeData(Object.entries(res).map(([assignee, revenue]) => ({
//           assignee,
//           revenue: typeof revenue === "number" ? revenue : 0,
//         })));
//       })
//       .catch(() => setAssigneeData([]));

//     fetch("/api/stats/user-performance/day-report?page=1&limit=1000")
//       .then((res) => res.json())
//       .then((json: { data: ReportEntry[] }) => {
//         setDayData(json.data || []);
//         setCumulativeDayData(json.data || []);
//       });

//     fetch("/api/stats/user-performance/week-report?page=1&limit=1000")
//       .then((res) => res.json())
//       .then((data: { data: ReportEntry[] }) => {
//         setWeekData(data.data);
//         setCumulativeData(data.data);
//       });

//     fetch("/api/stats/user-performance/mom-table")
//       .then((res) => res.json())
//       .then((res: { data: ReportEntry[] }) => {
//         setMonthTableData(res.data || []);
//       });
//   }, []);

//   useEffect(() => {
//     if (activeTab !== "charts") {
//       setShowGoalProgress(false);
//     }
//   }, [activeTab]);

//   if (!user) return <p className="p-4">Loading user...</p>;
//   if (!stats) return <p className="p-4">Loading dashboard...</p>;

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-bold">Sales Dashboard</h1>
//         <Link
//           href="/goals"
//           className="text-sm font-medium text-blue-600 hover:underline border border-blue-600 rounded px-3 py-1"
//         >
//           Set Goals
//         </Link>
//       </div>

//       {/* 📊 This Month Overview */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-2"> 
//         {/* Total Revenue */}
//         <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-5 rounded-xl shadow-lg text-white">
//           <div className="flex items-center justify-between">
//             <h3>Total Revenue</h3>
//             <IndianRupee />
//           </div>
//           <p className="mt-2 text-2xl font-bold">₹{stats.totalRevenue?.toLocaleString() ?? 0}</p>
//         </div>

//         {/* Received */}
//         <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-5 rounded-xl shadow-lg text-white">
//           <div className="flex items-center justify-between">
//             <h3>Received</h3>
//             <CheckCircle />
//           </div>
//           <p className="mt-2 text-2xl font-bold">₹{stats.amountReceived?.toLocaleString() ?? 0}</p>
//         </div>

//         {/* Pending */}
//         <div className="bg-gradient-to-r from-red-400 to-rose-500 p-5 rounded-xl shadow-lg text-white">
//           <div className="flex items-center justify-between">
//             <h3>Pending</h3>
//             <TrendingUp />
//           </div>
//           <p className="mt-2 text-2xl font-bold">₹{stats.pendingAmount?.toLocaleString() ?? 0}</p>
//         </div>
        
//         {/* UPDATED CARD: Pending Percentage with new color */}
//         <div className="bg-gradient-to-r from-pink-500 to-red-600 p-5 rounded-xl shadow-lg text-white">
//           <div className="flex items-center justify-between">
//             <h3>Pending %</h3>
//             <Percent />
//           </div>
//           <p className="mt-2 text-2xl font-bold">{pendingPercentage}%</p>
//         </div>

//         {/* Sales */}
//         <div className="bg-gradient-to-r from-yellow-400 to-amber-500 p-5 rounded-xl shadow-lg text-white">
//           <div className="flex items-center justify-between">
//             <h3>Sales</h3>
//             <ShoppingBag />
//           </div>
//           <p className="mt-2 text-2xl font-bold">{stats.totalSales ?? 0}</p>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="flex space-x-2 border-b mt-8 overflow-x-auto pb-1">
//         {tabs.map((tab) => (
//           <button
//             key={tab.key}
//             onClick={() => setActiveTab(tab.key)}
//             className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${
//               activeTab === tab.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
//             }`}
//           >
//             {tab.label}
//           </button>
//         ))}
//       </div>

//       {/* Tab Content */}
//       <div>
//         {activeTab === "all" && <AllReportsSection />}
//         {activeTab === "month" && <MonthReportTable data={monthTableData} />}
//         {activeTab === "week" && <WeekReportTable data={weekData} />}
//         {activeTab === "day" && <DayReportTable data={dayData} />}

//         {/* ✅ Combined Day + Week + Category Sales by Assigner */}
//         {activeTab === "assigner" && (
//           <div className="space-y-8">
//             <DayReportByAssignerTable />
//             <WeekReportByAssignerTable />
//             <CategorySalesTable /> {/* 📊 Category-Wise Sales */}
//           </div>
//         )}

//         {activeTab === "charts" && (
//           <>
//             {!showGoalProgress ? (
//               <>
//                 <div className="flex justify-end mb-4">
//                   <button
//                     onClick={() => setShowGoalProgress(true)}
//                     className="px-4 py-2 text-white bg-indigo-600 rounded-md"
//                   >
//                     Show Monthly Goal Progress
//                   </button>
//                 </div>

//                 <div className="rounded-xl bg-white shadow-md p-4 border border-gray-200 mb-6">
//                   <h2>Monthly Revenue</h2>
//                   {monthlyData.length > 0 ? (
//                     <ResponsiveContainer width="100%" height={300}>
//                       <LineChart data={monthlyData}>
//                         <XAxis dataKey="month" />
//                         <YAxis />
//                         <Tooltip />
//                         <Line type="monotone" dataKey="revenue" stroke="#4f46e5" />
//                       </LineChart>
//                     </ResponsiveContainer>
//                   ) : (
//                     <p>No data available</p>
//                   )}
//                 </div>

//                 <CumulativeChartSwitcher
//                   dayData={cumulativeDayData}
//                   weekData={cumulativeData}
//                   monthData={monthTableData}
//                 />

//                 <RevenueByAssigneeChart data={assigneeData} />
//               </>
//             ) : (
//               <GoalProgress />
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// }


























"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { IndianRupee, TrendingUp, CheckCircle, ShoppingBag, Percent, Lock, } from "lucide-react"; 

import RevenueByAssigneeChart from "../components/charts/RevenueByAssigneeChart";
import MonthReportTable from "../components/tables/MonthReportTable";
import WeekReportTable from "../components/tables/WeekReportTable";
import DayReportTable from "../components/tables/DayReportTable";
import GoalProgress from "../components/charts/GoalProgress";
import AllReportsSection from "../components/tables/AllReportsSection";
import CumulativeChartSwitcher from "../components/charts/CumulativeChartSwitcher";

// New imports for combined Assigner sales section
import DayReportByAssignerTable from "../components/tables/DayReportByAssignerTable";
import WeekReportByAssignerTable from "../components/tables/AssignerReportTable";
import CategorySalesTable from "../components/tables/category-sales"; 

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface SalesStats {
  totalRevenue: number;
  amountReceived: number;
  pendingAmount: number;
  totalSales: number;
}

interface MonthlyChartData {
  month: string;
  revenue: number;
}

interface AssigneeChartData {
  assignee: string;
  revenue: number;
}

type ReportEntry = Record<string, any>;

const tabs = [
  { label: "All Reports", key: "all" },
  { label: "By Assigner", key: "assigner" },
  { label: "Day", key: "day" },
  { label: "Week", key: "week" },
  { label: "Month", key: "month" },
  { label: "Charts", key: "charts" },
];

export default function SalesDashboardPage() {
  const { user } = useUser();
  const router = useRouter();

  const [stats, setStats] = useState<SalesStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyChartData[]>([]);
  const [assigneeData, setAssigneeData] = useState<AssigneeChartData[]>([]);
  const [dayData, setDayData] = useState<ReportEntry[]>([]);
  const [weekData, setWeekData] = useState<ReportEntry[]>([]);
  const [monthTableData, setMonthTableData] = useState<ReportEntry[]>([]);
  const [cumulativeData, setCumulativeData] = useState<ReportEntry[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [showGoalProgress, setShowGoalProgress] = useState(false);
  const [cumulativeDayData, setCumulativeDayData] = useState<ReportEntry[]>([]);

  // Calculate pending percentage
  const pendingPercentage = stats?.totalRevenue && stats.totalRevenue > 0
    ? ((stats.pendingAmount / stats.totalRevenue) * 100).toFixed(1)
    : "0.0";

  useEffect(() => {
    const role = String(user?.publicMetadata?.role || "").toLowerCase();
    if (user && !["admin", "master", "tl"].includes(role)) {
      router.push("/unauthorized");
    }
  }, [user, router]);

  useEffect(() => {
    fetch("/api/stats/user-performance/overview")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => setStats(null));

    fetch("/api/stats/user-performance/monthly")
      .then((res) => res.json())
      .then((data: Record<string, number>) => {
        setMonthlyData(Object.entries(data).map(([month, revenue]) => ({
          month,
          revenue: typeof revenue === "number" ? revenue : 0,
        })));
      })
      .catch(() => setMonthlyData([]));

    fetch("/api/stats/user-performance/by-assignee")
      .then((res) => res.json())
      .then((res: Record<string, number>) => {
        setAssigneeData(Object.entries(res).map(([assignee, revenue]) => ({
          assignee,
          revenue: typeof revenue === "number" ? revenue : 0,
        })));
      })
      .catch(() => setAssigneeData([]));

    fetch("/api/stats/user-performance/day-report?page=1&limit=1000")
      .then((res) => res.json())
      .then((json: { data: ReportEntry[] }) => {
        setDayData(json.data || []);
        setCumulativeDayData(json.data || []);
      });

    fetch("/api/stats/user-performance/week-report?page=1&limit=1000")
      .then((res) => res.json())
      .then((data: { data: ReportEntry[] }) => {
        setWeekData(data.data);
        setCumulativeData(data.data);
      });

    fetch("/api/stats/user-performance/mom-table")
      .then((res) => res.json())
      .then((res: { data: ReportEntry[] }) => {
        setMonthTableData(res.data || []);
      });
  }, []);

  useEffect(() => {
    if (activeTab !== "charts") {
      setShowGoalProgress(false);
    }
  }, [activeTab]);

  if (!user) return <p className="p-4">Loading user...</p>;
  if (!stats) return <p className="p-4">Loading dashboard...</p>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sales Dashboard</h1>
        <div className="flex items-center gap-3">
          {/* ✅ Redirect Button Added */}
          <button
            onClick={() => router.push("/payments-today")}
            className="px-4 py-1 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
          >
            View Today Payments
          </button>
          
          <Link
            href="/goals"
            className="text-sm font-medium text-blue-600 hover:underline border border-blue-600 rounded px-3 py-1"
          >
            Set Goals
          </Link>
        </div>
      </div>

      {/* 📊 This Month Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-2"> 
        {/* Total Revenue */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-5 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <h3>Total Revenue</h3>
            <IndianRupee />
          </div>
          <p className="mt-2 text-2xl font-bold">₹{stats.totalRevenue?.toLocaleString() ?? 0}</p>
        </div>

        {/* Received */}
        <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-5 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <h3>Received</h3>
            <CheckCircle />
          </div>
          <p className="mt-2 text-2xl font-bold">₹{stats.amountReceived?.toLocaleString() ?? 0}</p>
        </div>

        {/* Pending */}
        <div className="bg-gradient-to-r from-red-400 to-rose-500 p-5 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <h3>Pending</h3>
            <TrendingUp />
          </div>
          <p className="mt-2 text-2xl font-bold">₹{stats.pendingAmount?.toLocaleString() ?? 0}</p>
        </div>
        
        {/* Pending Percentage */}
        <div className="bg-gradient-to-r from-pink-500 to-red-600 p-5 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <h3>Pending %</h3>
            <Percent />
          </div>
          <p className="mt-2 text-2xl font-bold">{pendingPercentage}%</p>
        </div>

        {/* Sales */}
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 p-5 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <h3>Sales</h3>
            <ShoppingBag />
          </div>
          <p className="mt-2 text-2xl font-bold">{stats.totalSales ?? 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b mt-8 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${
              activeTab === tab.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "all" && <AllReportsSection />}
        {activeTab === "month" && <MonthReportTable data={monthTableData} />}
        {activeTab === "week" && <WeekReportTable data={weekData} />}
        {activeTab === "day" && <DayReportTable data={dayData} />}

        {activeTab === "assigner" && (
          <div className="space-y-8">
            <DayReportByAssignerTable />
            <WeekReportByAssignerTable />
            <CategorySalesTable />
          </div>
        )}

        {activeTab === "charts" && (
          <>
            {!showGoalProgress ? (
              <>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowGoalProgress(true)}
                    className="px-4 py-2 text-white bg-indigo-600 rounded-md"
                  >
                    Show Monthly Goal Progress
                  </button>
                </div>

                <div className="rounded-xl bg-white shadow-md p-4 border border-gray-200 mb-6">
                  <h2>Monthly Revenue</h2>
                  {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyData}>
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#4f46e5" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p>No data available</p>
                  )}
                </div>

                <CumulativeChartSwitcher
                  dayData={cumulativeDayData}
                  weekData={cumulativeData}
                  monthData={monthTableData}
                />

                <RevenueByAssigneeChart data={assigneeData} />
              </>
            ) : (
              <GoalProgress />
            )}
          </>
        )}
      </div>
    </div>
  );
}





// "use client";

// import React, { useEffect, useState } from "react";
// import Link from "next/link";
// import { useUser } from "@clerk/nextjs";
// import { useRouter } from "next/navigation";
// import {
//   IndianRupee,
//   TrendingUp,
//   CheckCircle,
//   ShoppingBag,
//   Percent,
//   Lock,
// } from "lucide-react";

// import RevenueByAssigneeChart from "../components/charts/RevenueByAssigneeChart";
// import MonthReportTable from "../components/tables/MonthReportTable";
// import WeekReportTable from "../components/tables/WeekReportTable";
// import DayReportTable from "../components/tables/DayReportTable";
// import GoalProgress from "../components/charts/GoalProgress";
// import AllReportsSection from "../components/tables/AllReportsSection";
// import CumulativeChartSwitcher from "../components/charts/CumulativeChartSwitcher";

// import DayReportByAssignerTable from "../components/tables/DayReportByAssignerTable";
// import WeekReportByAssignerTable from "../components/tables/AssignerReportTable";
// import CategorySalesTable from "../components/tables/category-sales";

// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
// } from "recharts";

// /* ---------------- Types ---------------- */

// interface SalesStats {
//   totalRevenue: number;
//   amountReceived: number;
//   pendingAmount: number;
//   totalSales: number;
// }

// type ReportEntry = Record<string, any>;

// const tabs = [
//   { label: "All Reports", key: "all" },
//   { label: "By Assigner", key: "assigner" },
//   { label: "Day", key: "day" },
//   { label: "Week", key: "week" },
//   { label: "Month", key: "month" },
//   { label: "Charts", key: "charts" },
// ];

// /* ---------------- Component ---------------- */

// export default function SalesDashboardPage() {
//   const { user } = useUser();
//   const router = useRouter();

//   /* ---------- State ---------- */
//   const [authorized, setAuthorized] = useState(false);
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   const [stats, setStats] = useState<SalesStats | null>(null);
//   const [dayData, setDayData] = useState<ReportEntry[]>([]);
//   const [weekData, setWeekData] = useState<ReportEntry[]>([]);
//   const [monthTableData, setMonthTableData] = useState<ReportEntry[]>([]);
//   const [activeTab, setActiveTab] = useState("all");
//   const [showGoalProgress, setShowGoalProgress] = useState(false);

//   const DASHBOARD_PASSWORD = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD;

//   /* ---------- Role Guard ---------- */
//   useEffect(() => {
//     if (!user) return;

//     if (!["admin", "master"].includes(user.publicMetadata?.role as string)) {
//       router.push("/unauthorized");
//     }
//   }, [user, router]);

//   /* ---------- Data Load (ONLY after auth) ---------- */
//   useEffect(() => {
//     if (!authorized) return;

//     fetch("/api/stats/user-performance/overview")
//       .then((res) => res.json())
//       .then(setStats);

//     fetch("/api/stats/user-performance/day-report?page=1&limit=1000")
//       .then((res) => res.json())
//       .then((json) => setDayData(json.data || []));

//     fetch("/api/stats/user-performance/week-report?page=1&limit=1000")
//       .then((res) => res.json())
//       .then((json) => setWeekData(json.data || []));

//     fetch("/api/stats/user-performance/mom-table")
//       .then((res) => res.json())
//       .then((json) => setMonthTableData(json.data || []));
//   }, [authorized]);

//   /* ---------- Handlers ---------- */
//   const handlePasswordSubmit = () => {
//     if (password === DASHBOARD_PASSWORD) {
//       setAuthorized(true);
//       setError("");
//     } else {
//       setError("Invalid security password");
//     }
//   };

//   const pendingPercentage =
//     stats && stats.totalRevenue > 0
//       ? ((stats.pendingAmount / stats.totalRevenue) * 100).toFixed(1)
//       : "0.0";

//   /* ---------------- Render ---------------- */

//   return (
//     <div className="min-h-screen bg-gray-100">
//       {/* 🔐 PASSWORD SCREEN */}
//       {!authorized && (
//         <div className="min-h-screen flex items-center justify-center">
//           <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm">
//             <div className="flex items-center gap-2 mb-4">
//               <Lock className="text-indigo-600" />
//               <h2 className="text-lg font-semibold">Security Verification</h2>
//             </div>

//             <input
//               type="password"
//               placeholder="Enter dashboard password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full border px-3 py-2 rounded mb-2"
//             />

//             {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

//             <button
//               onClick={handlePasswordSubmit}
//               className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
//             >
//               Verify & Continue
//             </button>
//           </div>
//         </div>
//       )}

//       {/* 📊 DASHBOARD */}
//       {authorized && (
//         <div className="p-6 space-y-6">
//           <h1 className="text-2xl font-bold">Sales Dashboard 🔐</h1>

//           {!stats ? (
//             <p>Loading dashboard...</p>
//           ) : (
//             <>
//               {/* Stats */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
//                 <Stat title="Revenue" value={stats.totalRevenue} icon={<IndianRupee />} />
//                 <Stat title="Received" value={stats.amountReceived} icon={<CheckCircle />} />
//                 <Stat title="Pending" value={stats.pendingAmount} icon={<TrendingUp />} />
//                 <Stat title="Pending %" value={`${pendingPercentage}%`} icon={<Percent />} />
//                 <Stat title="Sales" value={stats.totalSales} icon={<ShoppingBag />} />
//               </div>

//               {/* Tabs */}
//               <div className="flex space-x-2 border-b overflow-x-auto">
//                 {tabs.map((tab) => (
//                   <button
//                     key={tab.key}
//                     onClick={() => setActiveTab(tab.key)}
//                     className={`px-4 py-2 border-b-2 ${
//                       activeTab === tab.key
//                         ? "border-blue-600 text-blue-600"
//                         : "border-transparent text-gray-500"
//                     }`}
//                   >
//                     {tab.label}
//                   </button>
//                 ))}
//               </div>

//               {activeTab === "all" && <AllReportsSection />}
//               {activeTab === "day" && <DayReportTable data={dayData} />}
//               {activeTab === "week" && <WeekReportTable data={weekData} />}
//               {activeTab === "month" && <MonthReportTable data={monthTableData} />}

//               {activeTab === "assigner" && (
//                 <div className="space-y-6">
//                   <DayReportByAssignerTable />
//                   <WeekReportByAssignerTable />
//                   <CategorySalesTable />
//                 </div>
//               )}

//               {activeTab === "charts" && (
//                 <>
//                   {!showGoalProgress ? (
//                     <>
//                       <button
//                         onClick={() => setShowGoalProgress(true)}
//                         className="px-4 py-2 bg-indigo-600 text-white rounded"
//                       >
//                         Show Goal Progress
//                       </button>

//                       <CumulativeChartSwitcher
//                         dayData={dayData}
//                         weekData={weekData}
//                         monthData={monthTableData}
//                       />

//                       <RevenueByAssigneeChart />
//                     </>
//                   ) : (
//                     <GoalProgress />
//                   )}
//                 </>
//               )}
//             </>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// /* ---------------- Small Component ---------------- */

// function Stat({ title, value, icon }: any) {
//   return (
//     <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-5 rounded-xl text-white">
//       <div className="flex justify-between">
//         <h3>{title}</h3>
//         {icon}
//       </div>
//       <p className="mt-2 text-2xl font-bold">
//         {typeof value === "number" ? `₹${value.toLocaleString()}` : value}
//       </p>
//     </div>
//   );
// }















































// "use client";

// import React, { useEffect, useState } from "react";
// import Link from "next/link";
// import { useUser } from "@clerk/nextjs";
// import { useRouter } from "next/navigation";
// import { IndianRupee, TrendingUp, CheckCircle, ShoppingBag, Percent, Lock, } from "lucide-react"; 

// import RevenueByAssigneeChart from "../components/charts/RevenueByAssigneeChart";
// import MonthReportTable from "../components/tables/MonthReportTable";
// import WeekReportTable from "../components/tables/WeekReportTable";
// import DayReportTable from "../components/tables/DayReportTable";
// import GoalProgress from "../components/charts/GoalProgress";
// import AllReportsSection from "../components/tables/AllReportsSection";
// import CumulativeChartSwitcher from "../components/charts/CumulativeChartSwitcher";

// // New imports for combined Assigner sales section
// import DayReportByAssignerTable from "../components/tables/DayReportByAssignerTable";
// import WeekReportByAssignerTable from "../components/tables/AssignerReportTable";
// import CategorySalesTable from "../components/tables/category-sales"; 

// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
// } from "recharts";

// interface SalesStats {
//   totalRevenue: number;
//   amountReceived: number;
//   pendingAmount: number;
//   totalSales: number;
// }

// interface MonthlyChartData {
//   month: string;
//   revenue: number;
// }

// interface AssigneeChartData {
//   assignee: string;
//   revenue: number;
// }

// type ReportEntry = Record<string, any>;

// const tabs = [
//   { label: "All Reports", key: "all" },
//   { label: "By Assigner", key: "assigner" },
//   { label: "Day", key: "day" },
//   { label: "Week", key: "week" },
//   { label: "Month", key: "month" },
//   { label: "Charts", key: "charts" },
// ];

// export default function SalesDashboardPage() {
//   const { user } = useUser();
//   const router = useRouter();

//   const [stats, setStats] = useState<SalesStats | null>(null);
//   const [monthlyData, setMonthlyData] = useState<MonthlyChartData[]>([]);
//   const [assigneeData, setAssigneeData] = useState<AssigneeChartData[]>([]);
//   const [dayData, setDayData] = useState<ReportEntry[]>([]);
//   const [weekData, setWeekData] = useState<ReportEntry[]>([]);
//   const [monthTableData, setMonthTableData] = useState<ReportEntry[]>([]);
//   const [cumulativeData, setCumulativeData] = useState<ReportEntry[]>([]);
//   const [activeTab, setActiveTab] = useState("all");
//   const [showGoalProgress, setShowGoalProgress] = useState(false);
//   const [cumulativeDayData, setCumulativeDayData] = useState<ReportEntry[]>([]);

//   // Calculate pending percentage
//   const pendingPercentage = stats?.totalRevenue && stats.totalRevenue > 0
//     ? ((stats.pendingAmount / stats.totalRevenue) * 100).toFixed(1)
//     : "0.0";

//     const DASHBOARD_PASSWORD = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD;


//   // useEffect(() => {
//   //   if (user && !["admin", "master"].includes(user?.publicMetadata?.role as string)) {
//   //     router.push("/unauthorized");
//   //   }
//   // }, [user, router]);




//    useEffect(() => {
//     if (!user) return;

//     if (!["admin", "master"].includes(user.publicMetadata?.role as string)) {
//       router.push("/unauthorized");
//     }
//   }, [user, router]);


//   useEffect(() => {

//       if (!authorized) return;
//     fetch("/api/stats/user-performance/overview")
//       .then((res) => res.json())
//       .then(setStats)
//       .catch(() => setStats(null));

//     fetch("/api/stats/user-performance/monthly")
//       .then((res) => res.json())
//       .then((data: Record<string, number>) => {
//         setMonthlyData(Object.entries(data).map(([month, revenue]) => ({
//           month,
//           revenue: typeof revenue === "number" ? revenue : 0,
//         })));
//       })
//       .catch(() => setMonthlyData([]));

//     fetch("/api/stats/user-performance/by-assignee")
//       .then((res) => res.json())
//       .then((res: Record<string, number>) => {
//         setAssigneeData(Object.entries(res).map(([assignee, revenue]) => ({
//           assignee,
//           revenue: typeof revenue === "number" ? revenue : 0,
//         })));
//       })
//       .catch(() => setAssigneeData([]));

//     fetch("/api/stats/user-performance/day-report?page=1&limit=1000")
//       .then((res) => res.json())
//       .then((json: { data: ReportEntry[] }) => {
//         setDayData(json.data || []);
//         setCumulativeDayData(json.data || []);
//       });

//     fetch("/api/stats/user-performance/week-report?page=1&limit=1000")
//       .then((res) => res.json())
//       .then((data: { data: ReportEntry[] }) => {
//         setWeekData(data.data);
//         setCumulativeData(data.data);
//       });

//     fetch("/api/stats/user-performance/mom-table")
//       .then((res) => res.json())
//       .then((res: { data: ReportEntry[] }) => {
//         setMonthTableData(res.data || []);
//       });
//   }, []);

//   useEffect(() => {
//     if (activeTab !== "charts") {
//       setShowGoalProgress(false);
//     }
//   }, [activeTab]);

//   if (!user) return <p className="p-4">Loading user...</p>;
//   if (!stats) return <p className="p-4">Loading dashboard...</p>;

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-bold">Sales Dashboard</h1>
//         <div className="flex items-center gap-3">
//           {/* ✅ Redirect Button Added */}
//           <button
//             onClick={() => router.push("/payments-today")}
//             className="px-4 py-1 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
//           >
//             View Today Payments
//           </button>
          
//           <Link
//             href="/goals"
//             className="text-sm font-medium text-blue-600 hover:underline border border-blue-600 rounded px-3 py-1"
//           >
//             Set Goals
//           </Link>
//         </div>
//       </div>

//       {/* 📊 This Month Overview */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-2"> 
//         {/* Total Revenue */}
//         <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-5 rounded-xl shadow-lg text-white">
//           <div className="flex items-center justify-between">
//             <h3>Total Revenue</h3>
//             <IndianRupee />
//           </div>
//           <p className="mt-2 text-2xl font-bold">₹{stats.totalRevenue?.toLocaleString() ?? 0}</p>
//         </div>

//         {/* Received */}
//         <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-5 rounded-xl shadow-lg text-white">
//           <div className="flex items-center justify-between">
//             <h3>Received</h3>
//             <CheckCircle />
//           </div>
//           <p className="mt-2 text-2xl font-bold">₹{stats.amountReceived?.toLocaleString() ?? 0}</p>
//         </div>

//         {/* Pending */}
//         <div className="bg-gradient-to-r from-red-400 to-rose-500 p-5 rounded-xl shadow-lg text-white">
//           <div className="flex items-center justify-between">
//             <h3>Pending</h3>
//             <TrendingUp />
//           </div>
//           <p className="mt-2 text-2xl font-bold">₹{stats.pendingAmount?.toLocaleString() ?? 0}</p>
//         </div>
        
//         {/* Pending Percentage */}
//         <div className="bg-gradient-to-r from-pink-500 to-red-600 p-5 rounded-xl shadow-lg text-white">
//           <div className="flex items-center justify-between">
//             <h3>Pending %</h3>
//             <Percent />
//           </div>
//           <p className="mt-2 text-2xl font-bold">{pendingPercentage}%</p>
//         </div>

//         {/* Sales */}
//         <div className="bg-gradient-to-r from-yellow-400 to-amber-500 p-5 rounded-xl shadow-lg text-white">
//           <div className="flex items-center justify-between">
//             <h3>Sales</h3>
//             <ShoppingBag />
//           </div>
//           <p className="mt-2 text-2xl font-bold">{stats.totalSales ?? 0}</p>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="flex space-x-2 border-b mt-8 overflow-x-auto pb-1">
//         {tabs.map((tab) => (
//           <button
//             key={tab.key}
//             onClick={() => setActiveTab(tab.key)}
//             className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${
//               activeTab === tab.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
//             }`}
//           >
//             {tab.label}
//           </button>
//         ))}
//       </div>

//       {/* Tab Content */}
//       <div>
//         {activeTab === "all" && <AllReportsSection />}
//         {activeTab === "month" && <MonthReportTable data={monthTableData} />}
//         {activeTab === "week" && <WeekReportTable data={weekData} />}
//         {activeTab === "day" && <DayReportTable data={dayData} />}

//         {activeTab === "assigner" && (
//           <div className="space-y-8">
//             <DayReportByAssignerTable />
//             <WeekReportByAssignerTable />
//             <CategorySalesTable />
//           </div>
//         )}

//         {activeTab === "charts" && (
//           <>
//             {!showGoalProgress ? (
//               <>
//                 <div className="flex justify-end mb-4">
//                   <button
//                     onClick={() => setShowGoalProgress(true)}
//                     className="px-4 py-2 text-white bg-indigo-600 rounded-md"
//                   >
//                     Show Monthly Goal Progress
//                   </button>
//                 </div>

//                 <div className="rounded-xl bg-white shadow-md p-4 border border-gray-200 mb-6">
//                   <h2>Monthly Revenue</h2>
//                   {monthlyData.length > 0 ? (
//                     <ResponsiveContainer width="100%" height={300}>
//                       <LineChart data={monthlyData}>
//                         <XAxis dataKey="month" />
//                         <YAxis />
//                         <Tooltip />
//                         <Line type="monotone" dataKey="revenue" stroke="#4f46e5" />
//                       </LineChart>
//                     </ResponsiveContainer>
//                   ) : (
//                     <p>No data available</p>
//                   )}
//                 </div>

//                 <CumulativeChartSwitcher
//                   dayData={cumulativeDayData}
//                   weekData={cumulativeData}
//                   monthData={monthTableData}
//                 />

//                 <RevenueByAssigneeChart data={assigneeData} />
//               </>
//             ) : (
//               <GoalProgress />
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// }







// "use client";

// import React, { useEffect, useState } from "react";
// import Link from "next/link";
// import { useUser } from "@clerk/nextjs";
// import { useRouter } from "next/navigation";
// import { 
//   IndianRupee, 
//   TrendingUp, 
//   CheckCircle, 
//   ShoppingBag, 
//   Percent, 
//   Lock 
// } from "lucide-react";

// import RevenueByAssigneeChart from "../components/charts/RevenueByAssigneeChart";
// import MonthReportTable from "../components/tables/MonthReportTable";
// import WeekReportTable from "../components/tables/WeekReportTable";
// import DayReportTable from "../components/tables/DayReportTable";
// import GoalProgress from "../components/charts/GoalProgress";
// import AllReportsSection from "../components/tables/AllReportsSection";
// import CumulativeChartSwitcher from "../components/charts/CumulativeChartSwitcher";

// import DayReportByAssignerTable from "../components/tables/DayReportByAssignerTable";
// import WeekReportByAssignerTable from "../components/tables/AssignerReportTable";
// import CategorySalesTable from "../components/tables/category-sales";

// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
// } from "recharts";

// /* ---------------- Types ---------------- */

// interface SalesStats {
//   totalRevenue: number;
//   amountReceived: number;
//   pendingAmount: number;
//   totalSales: number;
// }

// interface MonthlyChartData {
//   month: string;
//   revenue: number;
// }

// interface AssigneeChartData {
//   assignee: string;
//   revenue: number;
// }

// type ReportEntry = Record<string, any>;

// const tabs = [
//   { label: "All Reports", key: "all" },
//   { label: "By Assigner", key: "assigner" },
//   { label: "Day", key: "day" },
//   { label: "Week", key: "week" },
//   { label: "Month", key: "month" },
//   { label: "Charts", key: "charts" },
// ];

// /* ---------------- Main Component ---------------- */

// export default function SalesDashboardPage() {
//   const { user } = useUser();
//   const router = useRouter();

//   /* ---------- Authentication State ---------- */
//   const [authorized, setAuthorized] = useState(false);
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   /* ---------- Data State ---------- */
//   const [stats, setStats] = useState<SalesStats | null>(null);
//   const [monthlyData, setMonthlyData] = useState<MonthlyChartData[]>([]);
//   const [assigneeData, setAssigneeData] = useState<AssigneeChartData[]>([]);
//   const [dayData, setDayData] = useState<ReportEntry[]>([]);
//   const [weekData, setWeekData] = useState<ReportEntry[]>([]);
//   const [monthTableData, setMonthTableData] = useState<ReportEntry[]>([]);
//   const [activeTab, setActiveTab] = useState("all");
//   const [showGoalProgress, setShowGoalProgress] = useState(false);

//   const DASHBOARD_PASSWORD = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD;

//   /* ---------- Role Guard ---------- */
//   useEffect(() => {
//     if (!user) return;
//     if (!["admin", "master"].includes(user.publicMetadata?.role as string)) {
//       router.push("/unauthorized");
//     }
//   }, [user, router]);

//   /* ---------- Data Load (Triggered only after Security Auth) ---------- */
//   useEffect(() => {
//     if (!authorized) return;

//     const fetchData = async () => {
//       try {
//         // Overview Stats
//         const statsRes = await fetch("/api/stats/user-performance/overview");
//         const statsJson = await statsRes.json();
//         setStats(statsJson);

//         // Monthly Line Chart
//         const monthlyRes = await fetch("/api/stats/user-performance/monthly");
//         const monthlyJson = await monthlyRes.json();
//         setMonthlyData(Object.entries(monthlyJson).map(([month, revenue]) => ({
//           month,
//           revenue: typeof revenue === "number" ? revenue : 0,
//         })));

//         // Assignee Performance
//         const assigneeRes = await fetch("/api/stats/user-performance/by-assignee");
//         const assigneeJson = await assigneeRes.json();
//         setAssigneeData(Object.entries(assigneeJson).map(([assignee, revenue]) => ({
//           assignee,
//           revenue: typeof revenue === "number" ? revenue : 0,
//         })));

//         // Table Reports
//         const dayRes = await fetch("/api/stats/user-performance/day-report?page=1&limit=1000");
//         const dayJson = await dayRes.json();
//         setDayData(dayJson.data || []);

//         const weekRes = await fetch("/api/stats/user-performance/week-report?page=1&limit=1000");
//         const weekJson = await weekRes.json();
//         setWeekData(weekJson.data || []);

//         const monthRes = await fetch("/api/stats/user-performance/mom-table");
//         const monthJson = await monthRes.json();
//         setMonthTableData(monthJson.data || []);
//       } catch (err) {
//         console.error("Failed to fetch dashboard data", err);
//       }
//     };

//     fetchData();
//   }, [authorized]);

//   /* ---------- Handlers ---------- */
//   const handlePasswordSubmit = () => {
//     if (password === DASHBOARD_PASSWORD) {
//       setAuthorized(true);
//       setError("");
//     } else {
//       setError("Invalid security password");
//     }
//   };

//   const pendingPercentage = stats?.totalRevenue && stats.totalRevenue > 0
//     ? ((stats.pendingAmount / stats.totalRevenue) * 100).toFixed(1)
//     : "0.0";

//   /* ---------------- Render Logic ---------------- */

//   // 1. Clerk Loading State
//   if (!user) return <div className="p-10 text-center">Loading User Profile...</div>;

//   // 2. Security Password Gate
//   if (!authorized) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-100">
//         <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-sm">
//           <div className="flex items-center gap-2 mb-6">
//             <Lock className="text-indigo-600" size={24} />
//             <h2 className="text-xl font-bold">Secure Access</h2>
//           </div>
//           <p className="text-gray-600 text-sm mb-4">Please enter the dashboard security key to view sales data.</p>
//           <input
//             type="password"
//             placeholder="Enter password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
//             className="w-full border border-gray-300 px-4 py-2 rounded-lg mb-2 focus:ring-2 focus:ring-indigo-500 outline-none"
//           />
//           {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
//           <button
//             onClick={handlePasswordSubmit}
//             className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
//           >
//             Unlock Dashboard
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // 3. Main Dashboard UI (Once authorized)
//   return (
//     <div className="min-h-screen bg-gray-50 p-6 space-y-6">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <h1 className="text-2xl font-bold text-gray-800">Sales Dashboard 🔐</h1>
//         <div className="flex items-center gap-3">
//           <button
//             onClick={() => router.push("/payments-today")}
//             className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
//           >
//             View Today Payments
//           </button>
//           <Link
//             href="/goals"
//             className="text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-600 rounded-lg px-4 py-2 transition-colors"
//           >
//             Set Goals
//           </Link>
//         </div>
//       </div>

//       {!stats ? (
//         <div className="text-center py-20 text-gray-500">Loading sales analytics...</div>
//       ) : (
//         <>
//           {/* 📊 Metrics Grid */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
//             <StatCard title="Total Revenue" value={stats.totalRevenue} icon={<IndianRupee size={20}/>} color="from-purple-500 to-indigo-500" />
//             <StatCard title="Received" value={stats.amountReceived} icon={<CheckCircle size={20}/>} color="from-green-400 to-emerald-500" />
//             <StatCard title="Pending" value={stats.pendingAmount} icon={<TrendingUp size={20}/>} color="from-red-400 to-rose-500" />
//             <StatCard title="Pending %" value={`${pendingPercentage}%`} icon={<Percent size={20}/>} color="from-pink-500 to-red-600" isCurrency={false} />
//             <StatCard title="Total Sales" value={stats.totalSales} icon={<ShoppingBag size={20}/>} color="from-yellow-400 to-amber-500" isCurrency={false} />
//           </div>

//           {/* Tabs Navigation */}
//           <div className="flex space-x-2 border-b mt-8 overflow-x-auto pb-1 no-scrollbar">
//             {tabs.map((tab) => (
//               <button
//                 key={tab.key}
//                 onClick={() => setActiveTab(tab.key)}
//                 className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap transition-colors ${
//                   activeTab === tab.key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
//                 }`}
//               >
//                 {tab.label}
//               </button>
//             ))}
//           </div>

//           {/* Tab Content Area */}
//           <div className="mt-4">
//             {activeTab === "all" && <AllReportsSection />}
//             {activeTab === "day" && <DayReportTable data={dayData} />}
//             {activeTab === "week" && <WeekReportTable data={weekData} />}
//             {activeTab === "month" && <MonthReportTable data={monthTableData} />}

//             {activeTab === "assigner" && (
//               <div className="space-y-8">
//                 <DayReportByAssignerTable />
//                 <WeekReportByAssignerTable />
//                 <CategorySalesTable />
//               </div>
//             )}

//             {activeTab === "charts" && (
//               <div className="space-y-6">
//                 {!showGoalProgress ? (
//                   <>
//                     <div className="flex justify-end">
//                       <button
//                         onClick={() => setShowGoalProgress(true)}
//                         className="px-4 py-2 text-white bg-indigo-600 rounded-lg shadow hover:bg-indigo-700 transition-all"
//                       >
//                         View Goal Progress
//                       </button>
//                     </div>

//                     <div className="rounded-xl bg-white shadow-sm p-6 border border-gray-200">
//                       <h2 className="text-lg font-semibold mb-4 text-gray-700">Monthly Revenue Trend</h2>
//                       {monthlyData.length > 0 ? (
//                         <ResponsiveContainer width="100%" height={300}>
//                           <LineChart data={monthlyData}>
//                             <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
//                             <YAxis stroke="#9ca3af" fontSize={12} />
//                             <Tooltip />
//                             <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
//                           </LineChart>
//                         </ResponsiveContainer>
//                       ) : (
//                         <div className="h-[300px] flex items-center justify-center text-gray-400">No chart data available</div>
//                       )}
//                     </div>

//                     <CumulativeChartSwitcher
//                       dayData={dayData}
//                       weekData={weekData}
//                       monthData={monthTableData}
//                     />

//                     <RevenueByAssigneeChart data={assigneeData} />
//                   </>
//                 ) : (
//                   <div className="space-y-4">
//                      <button
//                         onClick={() => setShowGoalProgress(false)}
//                         className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50"
//                       >
//                         ← Back to Charts
//                       </button>
//                     <GoalProgress />
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// /* ---------------- Helper Sub-Component ---------------- */

// function StatCard({ title, value, icon, color, isCurrency = true }: any) {
//   return (
//     <div className={`bg-gradient-to-r ${color} p-5 rounded-xl shadow-md text-white`}>
//       <div className="flex items-center justify-between opacity-90">
//         <h3 className="text-sm font-medium uppercase tracking-wider">{title}</h3>
//         {icon}
//       </div>
//       <p className="mt-2 text-2xl font-bold">
//         {isCurrency && typeof value === "number" ? `₹${value.toLocaleString()}` : value}
//       </p>
//     </div>
//   );
// }








// "use client";

// import React, { useEffect, useState } from "react";
// import Link from "next/link";
// import { useUser } from "@clerk/nextjs";
// import { useRouter } from "next/navigation";
// import { 
//   IndianRupee, 
//   TrendingUp, 
//   CheckCircle, 
//   ShoppingBag, 
//   Percent, 
//   Lock 
// } from "lucide-react";

// import RevenueByAssigneeChart from "../components/charts/RevenueByAssigneeChart";
// import MonthReportTable from "../components/tables/MonthReportTable";
// import WeekReportTable from "../components/tables/WeekReportTable";
// import DayReportTable from "../components/tables/DayReportTable";
// import GoalProgress from "../components/charts/GoalProgress";
// import AllReportsSection from "../components/tables/AllReportsSection";
// import CumulativeChartSwitcher from "../components/charts/CumulativeChartSwitcher";

// import DayReportByAssignerTable from "../components/tables/DayReportByAssignerTable";
// import WeekReportByAssignerTable from "../components/tables/AssignerReportTable";
// import CategorySalesTable from "../components/tables/category-sales";

// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
// } from "recharts";

// /* ---------------- Types ---------------- */
// interface SalesStats {
//   totalRevenue: number;
//   amountReceived: number;
//   pendingAmount: number;
//   totalSales: number;
// }

// interface MonthlyChartData {
//   month: string;
//   revenue: number;
// }

// interface AssigneeChartData {
//   assignee: string;
//   revenue: number;
// }

// type ReportEntry = Record<string, any>;

// const tabs = [
//   { label: "All Reports", key: "all" },
//   { label: "By Assigner", key: "assigner" },
//   { label: "Day", key: "day" },
//   { label: "Week", key: "week" },
//   { label: "Month", key: "month" },
//   { label: "Charts", key: "charts" },
// ];

// export default function SalesDashboardPage() {
//   const { user } = useUser();
//   const router = useRouter();

//   // Hydration Fix: Ensure component is mounted on client
//   const [hasMounted, setHasMounted] = useState(false);
//   const [authorized, setAuthorized] = useState(false);
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   const [stats, setStats] = useState<SalesStats | null>(null);
//   const [monthlyData, setMonthlyData] = useState<MonthlyChartData[]>([]);
//   const [assigneeData, setAssigneeData] = useState<AssigneeChartData[]>([]);
//   const [dayData, setDayData] = useState<ReportEntry[]>([]);
//   const [weekData, setWeekData] = useState<ReportEntry[]>([]);
//   const [monthTableData, setMonthTableData] = useState<ReportEntry[]>([]);
//   const [activeTab, setActiveTab] = useState("all");
//   const [showGoalProgress, setShowGoalProgress] = useState(false);

//   const DASHBOARD_PASSWORD = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD;

//   useEffect(() => {
//     setHasMounted(true);
//   }, []);

//   /* ---------- Role Guard ---------- */
//   useEffect(() => {
//     if (!user || !hasMounted) return;
//     if (!["admin", "master"].includes(user.publicMetadata?.role as string)) {
//       router.push("/unauthorized");
//     }
//   }, [user, router, hasMounted]);

//   /* ---------- Data Load ---------- */
//   useEffect(() => {
//     if (!authorized) return;

//     const fetchData = async () => {
//       try {
//         const [statsRes, monthlyRes, assigneeRes, dayRes, weekRes, monthRes] = await Promise.all([
//           fetch("/api/stats/user-performance/overview"),
//           fetch("/api/stats/user-performance/monthly"),
//           fetch("/api/stats/user-performance/by-assignee"),
//           fetch("/api/stats/user-performance/day-report?page=1&limit=1000"),
//           fetch("/api/stats/user-performance/week-report?page=1&limit=1000"),
//           fetch("/api/stats/user-performance/mom-table")
//         ]);

//         const statsJson = await statsRes.json();
//         const monthlyJson = await monthlyRes.json();
//         const assigneeJson = await assigneeRes.json();
//         const dayJson = await dayRes.json();
//         const weekJson = await weekRes.json();
//         const monthJson = await monthRes.json();

//         setStats(statsJson);
//         setMonthlyData(Object.entries(monthlyJson).map(([month, revenue]) => ({
//           month,
//           revenue: Number(revenue) || 0,
//         })));
//         setAssigneeData(Object.entries(assigneeJson).map(([assignee, revenue]) => ({
//           assignee,
//           revenue: Number(revenue) || 0,
//         })));
//         setDayData(dayJson.data || []);
//         setWeekData(weekJson.data || []);
//         setMonthTableData(monthJson.data || []);
//       } catch (err) {
//         console.error("Dashboard Fetch Error:", err);
//       }
//     };

//     fetchData();
//   }, [authorized]);

//   if (!hasMounted) return null; // Prevent hydration flash

//   const handlePasswordSubmit = () => {
//     if (password === DASHBOARD_PASSWORD) {
//       setAuthorized(true);
//       setError("");
//     } else {
//       setError("Invalid security password");
//     }
//   };

//   const pendingPercentage = stats?.totalRevenue && stats.totalRevenue > 0
//     ? ((stats.pendingAmount / stats.totalRevenue) * 100).toFixed(1)
//     : "0.0";

//   /* ---------------- Render Logic ---------------- */

//   if (!user) return <div className="p-10 text-center">Checking Permissions...</div>;

//   if (!authorized) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-100">
//         <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-sm">
//           <div className="flex items-center gap-2 mb-6">
//             <Lock className="text-indigo-600" size={24} />
//             <h2 className="text-xl font-bold">Secure Access</h2>
//           </div>
//           <input
//             type="password"
//             placeholder="Enter security key"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
//             className="w-full border border-gray-300 px-4 py-2 rounded-lg mb-2 outline-none focus:ring-2 focus:ring-indigo-500"
//           />
//           {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
//           <button
//             onClick={handlePasswordSubmit}
//             className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
//           >
//             Unlock Dashboard 
            
            
            
            
//                                                                                                                                                           M.0
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (                                                                                                                                                                                                                                                                                                                                    
//     <div className="min-h-screen bg-gray-50 p-6 space-y-6">
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <h1 className="text-2xl font-bold text-gray-800">Sales Dashboard 🔐</h1>
//         <div className="flex items-center gap-3">
//           <button
//             onClick={() => router.push("/payments-today")}
//             className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
//           >
//             View Today Payments
//           </button>
//           <Link
//             href="/goals"
//             className="text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-600 rounded-lg px-4 py-2"
//           >
//             Set Goals
//           </Link>
//         </div>
//       </div>

//       {!stats ? (
//         <div className="text-center py-20 text-gray-500">Loading sales analytics...</div>
//       ) : (
//         <>
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
//             <StatCard title="Total Revenue" value={stats.totalRevenue} icon={<IndianRupee size={20}/>} color="from-purple-500 to-indigo-500" />
//             <StatCard title="Received" value={stats.amountReceived} icon={<CheckCircle size={20}/>} color="from-green-400 to-emerald-500" />
//             <StatCard title="Pending" value={stats.pendingAmount} icon={<TrendingUp size={20}/>} color="from-red-400 to-rose-500" />
//             <StatCard title="Pending %" value={`${pendingPercentage}%`} icon={<Percent size={20}/>} color="from-pink-500 to-red-600" isCurrency={false} />
//             <StatCard title="Total Sales" value={stats.totalSales} icon={<ShoppingBag size={20}/>} color="from-yellow-400 to-amber-500" isCurrency={false} />
//           </div>

//           <div className="flex space-x-2 border-b mt-8 overflow-x-auto pb-1 no-scrollbar">
//             {tabs.map((tab) => (
//               <button
//                 key={tab.key}
//                 onClick={() => setActiveTab(tab.key)}
//                 className={`px-4 py-2 font-medium border-b-2 transition-colors ${
//                   activeTab === tab.key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
//                 }`}
//               >
//                 {tab.label}
//               </button>
//             ))}
//           </div>

//           <div className="mt-4">
//             {activeTab === "all" && <AllReportsSection />}
//             {activeTab === "day" && <DayReportTable data={dayData} />}
//             {activeTab === "week" && <WeekReportTable data={weekData} />}
//             {activeTab === "month" && <MonthReportTable data={monthTableData} />}
//             {activeTab === "assigner" && (
//               <div className="space-y-8">
//                 <DayReportByAssignerTable />
//                 <WeekReportByAssignerTable />
//                 <CategorySalesTable />
//               </div>
//             )}
//             {activeTab === "charts" && (
//               <div className="space-y-6">
//                 {!showGoalProgress ? (
//                   <>
//                     <div className="flex justify-end">
//                       <button onClick={() => setShowGoalProgress(true)} className="px-4 py-2 text-white bg-indigo-600 rounded-lg shadow">
//                         View Goal Progress
//                       </button>
//                     </div>
//                     <div className="rounded-xl bg-white shadow-sm p-6 border border-gray-200">
//                       <h2 className="text-lg font-semibold mb-4 text-gray-700">Monthly Revenue Trend</h2>
//                       <ResponsiveContainer width="100%" height={300}>
//                         <LineChart data={monthlyData}>
//                           <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
//                           <YAxis stroke="#9ca3af" fontSize={12} />
//                           <Tooltip />
//                           <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
//                         </LineChart>
//                       </ResponsiveContainer>
//                     </div>
//                     <CumulativeChartSwitcher dayData={dayData} weekData={weekData} monthData={monthTableData} />
//                     <RevenueByAssigneeChart data={assigneeData} />
//                   </>
//                 ) : (
//                   <div className="space-y-4">
//                     <button onClick={() => setShowGoalProgress(false)} className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50">
//                       ← Back to Charts
//                     </button>
//                     <GoalProgress />
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// function StatCard({ title, value, icon, color, isCurrency = true }: any) {
//   return (
//     <div className={`bg-gradient-to-r ${color} p-5 rounded-xl shadow-md text-white`}>
//       <div className="flex items-center justify-between opacity-90">
//         <h3 className="text-xs font-bold uppercase tracking-widest">{title}</h3>
//         {icon}
//       </div>
//       <p className="mt-2 text-2xl font-extrabold">
//         {isCurrency && typeof value === "number" ? `₹${value.toLocaleString()}` : value}
//       </p>
//     </div>
//   );
// }