"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Users, 
  ChevronLeft, 
  UserCircle,
  Activity,
  Calendar,
  Filter,
  Search,
  X
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import TeamDayReportTable from "../../components/tables/TeamDayReportTable";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface TL {
  clerkId: string;
  name: string;
}

interface Member {
  clerkId: string;
  name: string;
}

function DayReportContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [tlId, setTlId] = useState(searchParams.get("tlId") || "");
  const [memberId, setMemberId] = useState(searchParams.get("memberId") || "");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
  
  const [tls, setTls] = useState<TL[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isPrivileged, setIsPrivileged] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
        const role = String(user.publicMetadata?.role || "").toLowerCase();
        setIsPrivileged(["admin", "master"].includes(role));
        fetchTlList();
    }
  }, [isLoaded, user]);

  useEffect(() => {
    fetchMembers();
    fetchChartData();
  }, [tlId, memberId, startDate, endDate]);

  const fetchTlList = async () => {
    try {
      const res = await fetch("/api/stats/team/performance?getTlList=true");
      if (res.ok) {
        const data = await res.json();
        setTls(data.tls || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMembers = async () => {
    try {
      const url = tlId 
        ? `/api/stats/team/performance?tlId=${tlId}` 
        : "/api/stats/team/performance";
      const res = await fetch(url);
      const data = await res.json();
      if (data.memberPerformance) {
        setMembers(data.memberPerformance.map((m: any) => ({ clerkId: m.clerkId, name: m.name })));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchChartData = async () => {
    try {
      setLoading(true);
      let url = `/api/stats/team/day-report?limit=30`;
      if (memberId) url += `&memberId=${memberId}`;
      else if (tlId) url += `&tlId=${tlId}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      const res = await fetch(url);
      const json = await res.json();
      if (json.data) {
        setChartData([...json.data].reverse());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setTlId("");
    setMemberId("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] p-4 lg:p-8 space-y-8">
      {/* Header & Back Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:scale-110 transition-all text-slate-600 dark:text-slate-400"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Daily Intelligence</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Full Detailed Analysis</p>
          </div>
        </div>

        {/* Filters Top Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {isPrivileged && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <UserCircle size={18} className="text-indigo-500" />
                <select 
                    value={tlId}
                    onChange={(e) => { setTlId(e.target.value); setMemberId(""); }}
                    className="bg-transparent text-sm font-black text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                >
                    <option value="all">All Teams</option>
                    <option value="">My Team</option>
                    {tls.map(tl => (
                        <option key={tl.clerkId} value={tl.clerkId}>{tl.name}</option>
                    ))}
                </select>
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <Users size={18} className="text-purple-500" />
              <select 
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="bg-transparent text-sm font-black text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              >
                  <option value="">Full Team View</option>
                  {members.map(m => (
                      <option key={m.clerkId} value={m.clerkId}>{m.name}</option>
                  ))}
              </select>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <Calendar size={18} className="text-emerald-500" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm font-black text-slate-700 dark:text-slate-300 outline-none"
              />
              <span className="text-slate-400 font-bold px-1">to</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm font-black text-slate-700 dark:text-slate-300 outline-none"
              />
          </div>

          {(tlId || memberId || startDate || endDate) && (
            <button 
               onClick={clearFilters}
               className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center gap-2 group"
            >
               <X size={18} />
               <span className="text-xs font-black uppercase hidden group-hover:block transition-all">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Analytics Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-2xl relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Revenue Velocity</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Timeline Analytics</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
             <Activity size={24} />
          </div>
        </div>

        <div className="h-[350px] w-full">
          {loading ? (
             <div className="h-full w-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
             </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }}
                    tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }}
                    tickFormatter={(val) => `₹${val/1000}k`}
                />
                <Tooltip 
                    content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        return (
                        <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 shadow-2xl">
                            <p className="text-slate-400 text-[10px] font-black uppercase mb-1">{payload[0].payload.date}</p>
                            <p className="text-white font-black text-lg">₹{payload[0].value?.toLocaleString()}</p>
                            <p className="text-indigo-400 text-xs font-bold">{payload[0].payload.totalLeads} Projects</p>
                        </div>
                        );
                    }
                    return null;
                    }}
                />
                <Area 
                    type="monotone" 
                    dataKey="totalRevenue" 
                    stroke="#6366f1" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                />
                </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold">
                No data available for the selected period
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Table */}
      <TeamDayReportTable 
        tlId={tlId} 
        memberId={memberId} 
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}

export default function DayReportPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading intelligence...</div>}>
      <DayReportContent />
    </Suspense>
  );
}
