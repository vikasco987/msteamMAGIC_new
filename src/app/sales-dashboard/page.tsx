"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { 
  IndianRupee, 
  TrendingUp, 
  CheckCircle, 
  ShoppingBag, 
  Percent, 
  Lock,
  Eye,
  EyeOff
} from "lucide-react";

import RevenueByAssigneeChart from "../components/charts/RevenueByAssigneeChart";
import MonthReportTable from "../components/tables/MonthReportTable";
import WeekReportTable from "../components/tables/WeekReportTable";
import DayReportTable from "../components/tables/DayReportTable";
import GoalProgress from "../components/charts/GoalProgress";
import AllReportsSection from "../components/tables/AllReportsSection";
import CumulativeChartSwitcher from "../components/charts/CumulativeChartSwitcher";

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

/* ---------------- Types ---------------- */
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

  // Hydration Fix: Ensure component is mounted on client
  const [hasMounted, setHasMounted] = useState(false);

  const [stats, setStats] = useState<SalesStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyChartData[]>([]);
  const [assigneeData, setAssigneeData] = useState<AssigneeChartData[]>([]);
  const [dayData, setDayData] = useState<ReportEntry[]>([]);
  const [weekData, setWeekData] = useState<ReportEntry[]>([]);
  const [monthTableData, setMonthTableData] = useState<ReportEntry[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [showGoalProgress, setShowGoalProgress] = useState(false);
  const [showCards, setShowCards] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  /* ---------- Role Guard ---------- */
  useEffect(() => {
    if (!user || !hasMounted) return;
    if (!["admin", "master"].includes(user.publicMetadata?.role as string)) {
      router.push("/unauthorized");
    }
  }, [user, router, hasMounted]);

  /* ---------- Data Load ---------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, monthlyRes, assigneeRes, dayRes, weekRes, monthRes] = await Promise.all([
          fetch("/api/stats/user-performance/overview"),
          fetch("/api/stats/user-performance/monthly"),
          fetch("/api/stats/user-performance/by-assignee"),
          fetch("/api/stats/user-performance/day-report?page=1&limit=1000"),
          fetch("/api/stats/user-performance/week-report?page=1&limit=1000"),
          fetch("/api/stats/user-performance/mom-table")
        ]);

        const statsJson = await statsRes.json();
        const monthlyJson = await monthlyRes.json();
        const assigneeJson = await assigneeRes.json();
        const dayJson = await dayRes.json();
        const weekJson = await weekRes.json();
        const monthJson = await monthRes.json();

        setStats(statsJson);
        setMonthlyData(Object.entries(monthlyJson).map(([month, revenue]) => ({
          month,
          revenue: Number(revenue) || 0,
        })));
        setAssigneeData(Object.entries(assigneeJson).map(([assignee, revenue]) => ({
          assignee,
          revenue: Number(revenue) || 0,
        })));
        setDayData(dayJson.data || []);
        setWeekData(weekJson.data || []);
        setMonthTableData(monthJson.data || []);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      }
    };

    fetchData();
  }, []);

  if (!hasMounted) return null; // Prevent hydration flash

  const pendingPercentage = stats?.totalRevenue && stats.totalRevenue > 0
    ? ((stats.pendingAmount / stats.totalRevenue) * 100).toFixed(1)
    : "0.0";

  /* ---------------- Render Logic ---------------- */

  if (!user) return <div className="p-10 text-center">Checking Permissions...</div>;

  return (                                                                                                                                                                                                                                                                                                                                    
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Sales Dashboard 🔐</h1>
          <button
            onClick={() => setShowCards(!showCards)}
            className="flex items-center gap-2 bg-white rounded-xl shadow-sm p-1.5 px-3 hover:shadow-md border border-gray-100 transition-colors text-gray-600"
            title={showCards ? "Hide Sales Matrix" : "Unhide Sales Matrix"}
          >
            {showCards ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-xs font-bold">{showCards ? "Hide" : "Unhide"}</span>
          </button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/department-sales"
            className="text-sm font-black text-white bg-indigo-900 hover:bg-indigo-800 rounded-lg px-5 py-2.5 shadow-md flex items-center gap-2 transition-all uppercase tracking-wider border border-indigo-700"
          >
            <TrendingUp size={16} />
            Department Sales
          </Link>
          <button
            onClick={() => router.push("/payments-today")}
            className="px-4 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            View Today Payments
          </button>
          <Link
            href="/goals"
            className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2.5 shadow-sm"
          >
            Set Goals
          </Link>
        </div>
      </div>

      {!stats ? (
        <div className="text-center py-20 text-gray-500">Loading sales analytics...</div>
      ) : (
        <>
          {showCards && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard title="Total Revenue" value={stats.totalRevenue} icon={<IndianRupee size={20}/>} color="from-purple-500 to-indigo-500" />
              <StatCard title="Received" value={stats.amountReceived} icon={<CheckCircle size={20}/>} color="from-green-400 to-emerald-500" />
              <StatCard title="Pending" value={stats.pendingAmount} icon={<TrendingUp size={20}/>} color="from-red-400 to-rose-500" />
              <StatCard title="Pending %" value={`${pendingPercentage}%`} icon={<Percent size={20}/>} color="from-pink-500 to-red-600" isCurrency={false} />
              <StatCard title="Total Sales" value={stats.totalSales} icon={<ShoppingBag size={20}/>} color="from-yellow-400 to-amber-500" isCurrency={false} />
            </div>
          )}

          <div className="flex space-x-2 border-b mt-8 overflow-x-auto pb-1 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === tab.key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {activeTab === "all" && <AllReportsSection />}
            {activeTab === "day" && <DayReportTable data={dayData} />}
            {activeTab === "week" && <WeekReportTable data={weekData} />}
            {activeTab === "month" && <MonthReportTable data={monthTableData} />}
            {activeTab === "assigner" && (
              <div className="space-y-8">
                <DayReportByAssignerTable />
                <WeekReportByAssignerTable />
                <CategorySalesTable />
              </div>
            )}
            {activeTab === "charts" && (
              <div className="space-y-6">
                {!showGoalProgress ? (
                  <>
                    <div className="flex justify-end">
                      <button onClick={() => setShowGoalProgress(true)} className="px-4 py-2 text-white bg-indigo-600 rounded-lg shadow">
                        View Goal Progress
                      </button>
                    </div>
                    <div className="rounded-xl bg-white shadow-sm p-6 border border-gray-200">
                      <h2 className="text-lg font-semibold mb-4 text-gray-700">Monthly Revenue Trend</h2>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyData}>
                          <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                          <YAxis stroke="#9ca3af" fontSize={12} />
                          <Tooltip />
                          <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <CumulativeChartSwitcher dayData={dayData} weekData={weekData} monthData={monthTableData} />
                    <RevenueByAssigneeChart data={assigneeData} />
                  </>
                ) : (
                  <div className="space-y-4">
                    <button onClick={() => setShowGoalProgress(false)} className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50">
                      ← Back to Charts
                    </button>
                    <GoalProgress />
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color, isCurrency = true }: any) {
  return (
    <div className={`bg-gradient-to-r ${color} p-5 rounded-xl shadow-md text-white`}>
      <div className="flex items-center justify-between opacity-90">
        <h3 className="text-xs font-bold uppercase tracking-widest">{title}</h3>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-extrabold">
        {isCurrency && typeof value === "number" ? `₹${value.toLocaleString()}` : value}
      </p>
    </div>
  );
}