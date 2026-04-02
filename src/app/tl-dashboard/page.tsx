"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, 
  IndianRupee, 
  Target, 
  ArrowUpRight, 
  Trophy,
  Filter,
  Calendar,
  ChevronRight,
  Zap,
  CheckCircle2,
  Clock,
  Briefcase,
  UserCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import TeamDayReportTable from "../components/tables/TeamDayReportTable";
import TeamWeekReportTable from "../components/tables/TeamWeekReportTable";

// --- Types ---

interface MemberPerformance {
  clerkId: string;
  name: string;
  email: string;
  revenue: number;
  received: number;
  sales: number;
  todaySales: number;
  yesterdaySales: number;
  thisWeekSales: number;
  lastWeekSales: number;
  todayRevenue: number;
  yesterdayRevenue: number;
  thisWeekRevenue: number;
  lastWeekRevenue: number;
}

interface TeamStats {
  leaderName: string;
  totalRevenue: number;
  totalReceived: number;
  totalSales: number;
  memberPerformance: MemberPerformance[];
}

interface TL {
  clerkId: string;
  name: string;
  email: string;
}

// --- Components ---

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 relative overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-10 blur-3xl rounded-full -mr-10 -mt-10`} />
    <div className="flex items-center justify-between relative z-10">
      <div className={`p-3 rounded-2xl ${color.replace('bg-', 'bg-opacity-20 text-').replace('text-', '')} bg-opacity-10`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      {trend && (
        <span className="flex items-center text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-tighter">
          <ArrowUpRight size={12} className="mr-0.5" /> {trend}
        </span>
      )}
    </div>
    <div className="relative z-10">
      <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
        {typeof value === 'number' && (title.includes('Revenue') || title.includes('Received') || title.includes('Pending')) ? `₹${value.toLocaleString()}` : value}
      </h3>
    </div>
  </motion.div>
);

export default function TLDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [tlList, setTlList] = useState<TL[]>([]);
  const [selectedTlId, setSelectedTlId] = useState<string>("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [isPrivileged, setIsPrivileged] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      const role = String(user.publicMetadata?.role || "").toLowerCase();
      const privileged = ["admin", "master"].includes(role);
      setIsPrivileged(privileged);

      if (!["tl", ...(["admin", "master"] as string[])].includes(role)) {
        router.push("/unauthorized");
        return;
      }

      if (privileged) {
        setSelectedTlId("all");
        fetchTlList();
        fetchTeamStats("all");
      } else {
        fetchTeamStats();
      }
    }
  }, [isLoaded, user]);

  const fetchTlList = async () => {
    try {
      const res = await fetch("/api/stats/team/performance?getTlList=true");
      if (res.ok) {
        const data = await res.json();
        setTlList(data.tls || []);
      }
    } catch (error) {
      console.error("Error fetching TL list:", error);
    }
  };

  const fetchTeamStats = async (tlId?: string) => {
    try {
      setLoading(true);
      const url = tlId ? `/api/stats/team/performance?tlId=${tlId}` : "/api/stats/team/performance";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch team stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error(error);
      toast.error("Error loading team dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleTlChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tlId = e.target.value;
    setSelectedTlId(tlId);
    setSelectedMemberId(""); // Reset member when TL changes
    fetchTeamStats(tlId);
  };

  const handleMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMemberId(e.target.value);
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b0f19]">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 bg-indigo-600 rounded-2xl shadow-2xl shadow-indigo-600/50 flex items-center justify-center"
        >
          <Zap className="text-white fill-white" size={24} />
        </motion.div>
      </div>
    );
  }

  const performanceData = stats?.memberPerformance.map(m => ({
    name: m.name.split(' ')[0],
    revenue: m.revenue,
    sales: m.sales
  })) || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] p-4 lg:p-8 flex flex-col gap-8 transition-all duration-500">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-1"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/30">
              <Users className="text-white" size={24} />
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Team Sales Commander</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold ml-14">
            Monitoring performance for {stats?.leaderName}&apos;s Squad
          </p>
        </motion.div>

        <div className="flex flex-wrap items-center gap-3 ml-auto lg:ml-0">
          {isPrivileged && tlList.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <UserCircle size={18} className="text-indigo-500" />
                <select 
                    value={selectedTlId}
                    onChange={handleTlChange}
                    className="bg-transparent text-sm font-black text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                >
                    <option value="all">All Teams</option>
                    <option value="">My Own Team</option>
                    {tlList.map(tl => (
                        <option key={tl.clerkId} value={tl.clerkId}>{tl.name}</option>
                    ))}
                </select>
            </div>
          )}

          {stats?.memberPerformance && stats.memberPerformance.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <Users size={18} className="text-purple-500" />
                <select 
                    value={selectedMemberId}
                    onChange={handleMemberChange}
                    className="bg-transparent text-sm font-black text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                >
                    <option value="">Full Team View</option>
                    {stats.memberPerformance.map(member => (
                        <option key={member.clerkId} value={member.clerkId}>{member.name}</option>
                    ))}
                </select>
            </div>
          )}
          
          <div className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black text-slate-700 dark:text-slate-300 shadow-sm">
            <Calendar size={18} className="text-indigo-500" /> 
            <span>Current Month</span>
          </div>

          <button 
            onClick={() => fetchTeamStats(selectedTlId)}
            className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all"
          >
            <Zap size={20} fill="currentColor" />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Team Revenue" 
          value={stats?.totalRevenue || 0} 
          icon={IndianRupee} 
          color="bg-indigo-500 text-indigo-500 shadow-indigo-500/20" 
          trend="+12.5%"
        />
        <StatCard 
          title="Team Received" 
          value={stats?.totalReceived || 0} 
          icon={CheckCircle2} 
          color="bg-emerald-500 text-emerald-500 shadow-emerald-500/20" 
          trend="+8.2%"
        />
        <StatCard 
          title="Team Pending" 
          value={(stats?.totalRevenue || 0) - (stats?.totalReceived || 0)} 
          icon={Clock} 
          color="bg-amber-500 text-amber-500 shadow-amber-500/20" 
        />
        <StatCard 
          title="Total Projects" 
          value={stats?.totalSales || 0} 
          icon={Target} 
          color="bg-purple-500 text-purple-500 shadow-purple-500/20" 
          trend="42 New"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">RevOps Matrix</h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Revenue by Squad Member</p>
            </div>
            <div className="flex gap-2">
               <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                 <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                 <span className="text-[10px] font-black uppercase text-slate-400">Revenue</span>
               </div>
            </div>
          </div>

          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 800 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 800 }} 
                  tickFormatter={(val) => `₹${val/1000}k`}
                />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0f172a] p-4 rounded-2xl shadow-2xl border border-slate-800">
                          <p className="text-white font-black text-xs uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                          <p className="text-indigo-400 font-black text-lg">₹{payload[0].value?.toLocaleString()}</p>
                          <div className="h-px bg-slate-800 my-2" />
                          <p className="text-slate-500 text-[10px] font-bold">Sales: {payload[0].payload.sales}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="revenue" 
                  radius={[12, 12, 12, 12]} 
                  barSize={40}
                >
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#4F46E5' : '#818CF8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Squad Leaderboard */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800/50">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="text-amber-500" size={24} />
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight tracking-tight">Top Performers</h2>
            </div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Efficiency Leaderboard</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {stats?.memberPerformance.map((member, idx) => {
              const recoveryRate = member.revenue > 0 ? (member.received / member.revenue) * 100 : 0;
              return (
                <motion.div 
                  key={idx}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-indigo-500/20 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-default"
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center font-black text-slate-800 dark:text-white text-lg shadow-sm">
                      {member.name.charAt(0)}
                    </div>
                    {idx < 3 && (
                      <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white dark:border-slate-900 shadow-lg ${
                        idx === 0 ? 'bg-amber-400 text-amber-900' : 
                        idx === 1 ? 'bg-slate-300 text-slate-800' : 
                        'bg-amber-600 text-amber-50'
                      }`}>
                        {idx + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">{member.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{member.sales} Sales</span>
                      <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                      <span className="text-[10px] font-bold text-emerald-500">{recoveryRate.toFixed(0)}% Recovered</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-slate-900 dark:text-white">₹{member.revenue.toLocaleString()}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">Revenue</div>
                  </div>
                </motion.div>
              );
            })}

            {(!stats?.memberPerformance || stats.memberPerformance.length === 0) && (
              <div className="h-full flex flex-col items-center justify-center gap-4 py-20 text-center">
                 <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                    <Briefcase className="text-slate-400" size={32} />
                 </div>
                 <p className="text-slate-500 font-bold">No squad data found.<br/>Time to assign some tasks!</p>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-800/80 mt-auto">
             <button className="w-full py-4 bg-indigo-600 text-white rounded-[20px] font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                Team Management <ChevronRight size={18} />
             </button>
          </div>
        </motion.div>
      </div>

      {/* Team Breakdown Table (Visible only on Desktop) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
           <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight tracking-tight">Granular Intelligence</h3>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Detailed Member Performance Matrix</p>
           </div>
           
           <div className="flex gap-2">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-500 cursor-pointer transition-colors">
                 <Filter size={18} />
              </div>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-800">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Member</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Month Projects</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">DoD Sales</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">WoW Sales</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-right">Target Revenue</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-right">Achievement</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-right">Recovery Status</th>
              </tr>
            </thead>
            <tbody>
              {stats?.memberPerformance.map((member, idx) => {
                const recoveryRate = member.revenue > 0 ? (member.received / member.revenue) * 100 : 0;
                return (
                  <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase">
                          {member.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900 dark:text-white">{member.name}</div>
                          <div className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                          <Zap size={10} className="text-amber-500 fill-amber-500" />
                          <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">{member.sales} ACTIVE</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 dark:text-white">{member.todaySales}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Yest: {member.yesterdaySales}</span>
                          </div>
                          {member.todaySales > member.yesterdaySales ? (
                            <TrendingUp size={14} className="text-emerald-500" />
                          ) : member.todaySales < member.yesterdaySales ? (
                            <TrendingDown size={14} className="text-red-500" />
                          ) : (
                            <Minus size={14} className="text-slate-300" />
                          )}
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 dark:text-white">{member.thisWeekSales}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">L.Week: {member.lastWeekSales}</span>
                          </div>
                          {member.thisWeekSales > member.lastWeekSales ? (
                            <TrendingUp size={14} className="text-emerald-500" />
                          ) : member.thisWeekSales < member.lastWeekSales ? (
                            <TrendingDown size={14} className="text-red-500" />
                          ) : (
                            <Minus size={14} className="text-slate-300" />
                          )}
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <span className="text-sm font-black text-slate-900 dark:text-white">₹{member.revenue.toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                           <span className="text-[11px] font-black text-indigo-500 uppercase tracking-tighter">₹{member.received.toLocaleString()}</span>
                           <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${recoveryRate}%` }}
                                className="h-full bg-indigo-500"
                              />
                           </div>
                        </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                         recoveryRate >= 80 ? 'bg-emerald-500/10 text-emerald-500' :
                         recoveryRate >= 40 ? 'bg-amber-500/10 text-amber-500' :
                         'bg-red-500/10 text-red-500'
                       }`}>
                         {recoveryRate >= 80 ? 'Optimal' : recoveryRate >= 40 ? 'Average' : 'Critical'}
                       </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Team Reports Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <TeamDayReportTable tlId={selectedTlId} memberId={selectedMemberId} />
        </motion.div>
        
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.6 }}
        >
          <TeamWeekReportTable tlId={selectedTlId} memberId={selectedMemberId} />
        </motion.div>
      </div>
    </div>
  );
}
