"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Sector
} from "recharts";
import {
  Activity, Users, ClipboardList, CheckCircle2, Timer, TrendingUp,
  ArrowUpRight, ArrowDownRight, Zap, Target, Award, Bell
} from "lucide-react";
import { motion } from "framer-motion";

type Row = {
  assignee: string;
  todo: number;
  inprogress: number;
  done: number;
  total: number;
};

type StatsResponse = {
  success: boolean;
  totals?: {
    todo: number;
    inprogress: number;
    done: number;
  };
  data?: Row[];
};

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];

export default function TaskStatsDashboard() {
  const [totals, setTotals] = useState({ todo: 0, inprogress: 0, done: 0 });
  const [rows, setRows] = useState<Row[]>([]);
  const [crmStats, setCrmStats] = useState({ today: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await axios.get<StatsResponse>("/api/tasks/stats");
        if (res.data.success) {
          setTotals(res.data.totals || { todo: 0, inprogress: 0, done: 0 });
          setRows(res.data.data || []);
        }

        const crmRes = await axios.get("/api/crm/stats");
        if (crmRes.data.success) {
          setCrmStats({
            today: crmRes.data.today || 0,
            overdue: crmRes.data.overdue || 0
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const totalTasks = totals.todo + totals.inprogress + totals.done;
  const completionRate = totalTasks > 0 ? Math.round((totals.done / totalTasks) * 100) : 0;

  const chartData = [
    { name: "Todo", value: totals.todo, color: "#6366f1" },
    { name: "In Progress", value: totals.inprogress, color: "#f59e0b" },
    { name: "Completed", value: totals.done, color: "#10b981" },
  ];

  if (loading) return (
    <div className="flex h-[80vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Syncing Engine...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-10 space-y-10">

      {/* --- HERO SECTION --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1 w-8 bg-indigo-600 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Enterprise Overview</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">System <span className="text-indigo-600">Performance</span></h1>
          <p className="text-slate-500 mt-2 font-semibold">Real-time task distribution and assignee performance matrix.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-[22px] shadow-sm border border-slate-100">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 shadow-sm" />
            ))}
          </div>
          <div className="pr-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Reach</p>
            <p className="text-sm font-bold text-slate-900 mt-1">128+ Online</p>
          </div>
        </div>
      </div>

      {/* --- QUICK STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* TOTAL TASKS */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 transition-opacity group-hover:opacity-20">
            <ClipboardList size={80} className="text-indigo-600" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <ClipboardList size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total Pipeline</span>
          </div>
          <p className="text-5xl font-black text-slate-900 mb-2">{totalTasks}</p>
          <div className="flex items-center gap-1.5 text-emerald-500">
            <ArrowUpRight size={14} />
            <span className="text-xs font-bold">+12% from last week</span>
          </div>
        </motion.div>

        {/* COMPLETION RATE */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 transition-opacity group-hover:opacity-20">
            <Award size={80} className="text-emerald-600" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Efficiency Index</span>
          </div>
          <p className="text-5xl font-black text-slate-900 mb-2">{completionRate}%</p>
          <div className="flex items-center gap-1.5 text-emerald-500">
            <TrendingUp size={14} />
            <span className="text-xs font-bold">Peak performance reached</span>
          </div>
        </motion.div>

        {/* IN PROGRESS */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 transition-opacity group-hover:opacity-20">
            <Timer size={80} className="text-amber-500" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Timer size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Active Velocity</span>
          </div>
          <p className="text-5xl font-black text-slate-900 mb-2">{totals.inprogress}</p>
          <div className="flex items-center gap-1.5 text-amber-500">
            <Activity size={14} />
            <span className="text-xs font-bold">Standard rotation</span>
          </div>
        </motion.div>

        {/* TODO */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 transition-opacity group-hover:opacity-20">
            <Zap size={80} className="text-indigo-400" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl">
              <Target size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Backlog Load</span>
          </div>
          <p className="text-5xl font-black text-slate-900 mb-2">{totals.todo}</p>
          <div className="flex items-center gap-1.5 text-slate-400">
            <ArrowDownRight size={14} />
            <span className="text-xs font-bold">Requires attention</span>
          </div>
        </motion.div>

        {/* CRM FOLLOW-UPS */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 transition-opacity group-hover:opacity-20">
            <Bell size={80} className="text-rose-500" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <Bell size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">CRM Follow-ups</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-5xl font-black text-slate-900">{crmStats.today}</p>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Today</span>
          </div>
          <div className={`flex items-center gap-1.5 ${crmStats.overdue > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`}>
            <Activity size={14} />
            <span className="text-xs font-bold">{crmStats.overdue} Overdue items</span>
          </div>
        </motion.div>

      </div>

      {/* --- VISUAL DATA SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* BAR CHART PERFORMANCE */}
        <div className="lg:col-span-8 bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200/30 border border-slate-50">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900 leading-none">Assignee Velocity</h3>
              <p className="text-sm font-bold text-slate-400 mt-2">Workload distribution per staff member.</p>
            </div>
            <div className="flex bg-slate-50 p-1.5 rounded-2xl">
              <button className="px-4 py-2 bg-white text-indigo-600 rounded-xl font-bold text-xs shadow-sm">Monthly</button>
              <button className="px-4 py-2 text-slate-400 font-bold text-xs">Weekly</button>
            </div>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="assignee"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 'black', fontSize: '13px' }}
                />
                <Bar dataKey="inprogress" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={24} />
                <Bar dataKey="todo" stackId="a" fill="#cbd5e1" radius={[0, 0, 0, 0]} barSize={24} />
                <Bar dataKey="done" stackId="a" fill="#10b981" radius={[12, 12, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE CHART DISTRIBUTION */}
        <div className="lg:col-span-4 bg-[#0f172a] p-10 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[120px] rounded-full" />
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-white leading-none">Status Mix</h3>
            <p className="text-sm font-bold text-indigo-300/60 mt-2">Global distribution spread.</p>

            <div className="h-[300px] mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              {chartData.map(item => (
                <div key={item.name} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-white/40">{item.name}</span>
                    <span className="text-lg font-black text-white leading-none mt-1">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* --- ELITE PERFORMANCE TABLE --- */}
      <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200/20 border border-slate-50 overflow-hidden">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-2xl font-black text-slate-900 leading-none">Performance Matrix</h3>
            <p className="text-sm font-bold text-slate-400 mt-2">Granular tracking of team output.</p>
          </div>
          <button className="px-6 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-200">
            Export Analysis
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4">Assignee</th>
                <th className="py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4 text-center">Todo</th>
                <th className="py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4 text-center">In Progress</th>
                <th className="py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4 text-center">Completed</th>
                <th className="py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4 text-center">Efficiency</th>
                <th className="py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4 text-right">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((r, idx) => {
                const eff = r.total > 0 ? Math.round((r.done / r.total) * 100) : 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 font-black text-xs flex items-center justify-center rounded-xl uppercase">
                          {r.assignee.substring(0, 2)}
                        </div>
                        <span className="font-bold text-slate-900">{r.assignee}</span>
                      </div>
                    </td>
                    <td className="py-6 px-4 text-center">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black">{r.todo}</span>
                    </td>
                    <td className="py-6 px-4 text-center">
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-black">{r.inprogress}</span>
                    </td>
                    <td className="py-6 px-4 text-center">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black">{r.done}</span>
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex flex-col items-center gap-1.5 w-32 mx-auto">
                        <div className="w-full h-1.5 bg-slate-100 rounded-full">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${eff}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">{eff}% SUCCESS</span>
                      </div>
                    </td>
                    <td className="py-6 px-4 text-right">
                      <span className="text-lg font-black text-slate-900 tracking-tight">{r.total}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
