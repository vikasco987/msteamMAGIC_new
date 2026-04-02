"use client";

import React, { useEffect, useState, useMemo } from "react";
import { format, parseISO, addDays, subDays } from "date-fns";
import {
    Download, TrendingUp, Zap, Target, Award, User, Layers, Calendar, ExternalLink, Sun, Moon, UserPlus, PhoneCall, PhoneForwarded, Clock, AlertTriangle, FilePlus, Briefcase, RefreshCw, Activity
} from "lucide-react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import Pusher from "pusher-js";

type MatrixUser = {
    userId: string;
    name: string;
    email: string;
    untouched: number;
    pending: number;
    submissionsFilled: number;
    created: number;
    reachout: number;
    connected: number;
    newReachout: number;
    newConnected: number;
    followupCalls: number;
    followupConnected: number;
    todayOnb: number;
    sales: number;
    totalSales: number;
    todo: number;
    progress: number;
    paymentPending: number;
    receivedAmount: number;
    revenueGap: number;
};

export default function GrandMatrixPage() {
    const [date, setDate] = useState(new Date());
    const [matrixData, setMatrixData] = useState<MatrixUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"MASTER" | "DEEP_DIVE">("MASTER");
    const [auditData, setAuditData] = useState<any[]>([]);
    const [theme, setTheme] = useState<"DARK" | "LIGHT">("DARK");
    const [monthlyGoals, setMonthlyGoals] = useState<any>(null);

    const fetchMatrix = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const range = viewMode === "DEEP_DIVE" ? "WEEK" : "TODAY";
            const res = await fetch(`/api/call-report/matrix?start=${format(date, 'yyyy-MM-dd')}&end=${format(date, 'yyyy-MM-dd')}&range=${range}`);
            const json = await res.json();
            if (res.ok) {
                if (viewMode === "MASTER") {
                    setMatrixData(json.report);
                    setMonthlyGoals(json.goals);
                } else setAuditData(json.report);
            }
        } finally { if (!silent) setLoading(false); }
    };

    // ⚡ ENTERPRISE REAL-TIME SYNC HUB (STABILIZED)
    useEffect(() => {
        fetchMatrix();

        const CHANNEL_NAME = "operational-matrix";
        const EVENT_NAME = "matrix_update";

        // 🟠 MODE A: SaaS CLOUD RELAY (PUSHER)
        const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
        const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';

        let pusherChannel: any = null;
        let pusherInstance: any = null;

        if (pusherKey) {
            console.log(`Cloud Shard: Initializing [${CHANNEL_NAME}] Hub... ☁️`);
            pusherInstance = new Pusher(pusherKey, { cluster: pusherCluster });
            pusherChannel = pusherInstance.subscribe(CHANNEL_NAME);

            pusherChannel.bind(EVENT_NAME, (data: any) => {
                console.log("🔥 DATA MILA:", data); // Ground Truth Signal
                fetchMatrix(true);
            });
        }

        // 🟢 MODE B: LOCAL CLUSTER (SOCKET.IO)
        const socket = io({
            path: "/api/socket",
            addTrailingSlash: false,
            reconnectionAttempts: 8,
            reconnectionDelay: 1000
        });

        socket.on(EVENT_NAME, () => {
            console.log(`Local Pulse Received: [${EVENT_NAME}] Sync Operational! 🛰️`);
            fetchMatrix(true);
        });

        const handleFocus = () => fetchMatrix(true);
        window.addEventListener("focus", handleFocus);

        return () => {
            if (pusherInstance) {
                pusherChannel?.unbind_all();
                pusherInstance.disconnect();
            }
            socket.off(EVENT_NAME);
            socket.disconnect();
            window.removeEventListener("focus", handleFocus);
        };
    }, [date, viewMode]);

    const stats = useMemo(() => {
        if (!matrixData.length) return null;
        const totalReach = matrixData.reduce((acc, u) => acc + u.reachout, 0);
        const totalConn = matrixData.reduce((acc, u) => acc + u.connected, 0);
        const efficiency = Math.round((totalConn / (totalReach || 1)) * 100) || 0;
        return {
            reachout: totalReach, connected: totalConn,
            newReach: matrixData.reduce((acc, u) => acc + u.newReachout, 0),
            followups: matrixData.reduce((acc, u) => acc + u.followupCalls, 0),
            todayOnb: matrixData.reduce((acc, u) => acc + u.todayOnb, 0),
            todaySales: matrixData.reduce((acc, u) => acc + u.sales, 0),
            untouched: matrixData.reduce((acc, u) => acc + u.untouched, 0),
            pending: matrixData.reduce((acc, u) => acc + u.pending, 0),
            forms: matrixData.reduce((acc, u) => acc + u.submissionsFilled, 0),
            todo: matrixData.reduce((acc, u) => acc + u.todo, 0),
            progress: matrixData.reduce((acc, u) => acc + u.progress, 0),
            revenueGap: matrixData.reduce((acc, u) => acc + u.revenueGap, 0),
            operators: matrixData.length, efficiency
        };
    }, [matrixData]);

    const isDark = theme === "DARK";

    return (
        <div className={`min-h-screen transition-all duration-700 ${isDark ? 'bg-[#0a0c10] text-slate-300' : 'bg-slate-50 text-slate-700'} font-sans`}>
            {/* Header (Cyber-Audit Aesthetic) */}
            <div className={`border-b transition-all sticky top-0 z-40 ${isDark ? 'bg-[#12141a]/80 border-white/5 shadow-2xl shadow-black/80' : 'bg-white/90 border-slate-200 shadow-sm'} backdrop-blur-3xl`}>
                <div className="max-w-full mx-auto px-8 py-6 flex flex-col lg:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 bg-indigo-600 rounded-[20px] flex items-center justify-center shadow-2xl rotate-3`}><Layers className="text-white" size={28} /></div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h1 className={`text-2xl font-black tracking-tighter uppercase italic ${isDark ? 'text-white' : 'text-slate-900'}`}>Operational Matrix</h1>
                                <div className="p-1 px-2 mb-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-1.5 shadow-inner">
                                    <Zap className="text-emerald-500 animate-pulse" size={10} /><span className="text-[8px] font-black tracking-[0.1em] text-emerald-500 uppercase">Live Pulse Hub</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5"><span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Enterprise SaaS Engine • Shard Fidelity Active</span></div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <div className={`flex items-center p-1 rounded-2xl border transition-all ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200 shadow-inner'}`}>
                            <button onClick={() => setTheme("LIGHT")} className={`p-2 rounded-xl transition-all ${!isDark ? 'bg-white text-amber-500 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><Sun size={18} /></button>
                            <button onClick={() => setTheme("DARK")} className={`p-2 rounded-xl transition-all ${isDark ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}><Moon size={18} /></button>
                        </div>
                        <div className={`flex items-center p-1.5 rounded-2xl border transition-all ${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <button onClick={() => setDate(subDays(date, 1))} className={`p-2.5 rounded-xl transition-all ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}>←</button>
                            <div className={`px-6 py-2 border-x transition-all ${isDark ? 'border-white/5 text-white' : 'border-slate-100 text-slate-700'} text-xs font-black uppercase tracking-widest text-center min-w-[150px]`}>{format(date, "MMM dd, yyyy")}</div>
                            <button onClick={() => setDate(addDays(date, 1))} className={`p-2.5 rounded-xl transition-all ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}>→</button>
                        </div>
                        <div className={`flex items-center p-1.5 rounded-2xl border transition-all ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <button onClick={() => setViewMode("MASTER")} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "MASTER" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : isDark ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-900"}`}>Master Hub</button>
                            <button onClick={() => setViewMode("DEEP_DIVE")} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "DEEP_DIVE" ? "bg-rose-600 text-white shadow-lg shadow-rose-500/20" : isDark ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-900"}`}>Deep Audit</button>
                        </div>
                        <button onClick={() => fetchMatrix()} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-2 ${isDark ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-slate-900 text-white shadow-slate-900/10'}`}>
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Force Sync
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-full mx-auto p-4 md:p-8">
                {/* Dashboard Shards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 mb-2 animate-in fade-in slide-in-from-top-6 duration-700">
                    {[
                        { label: "Reachout", val: stats?.reachout, icon: Target, color: "emerald" },
                        { label: "Connections", val: stats?.connected, icon: PhoneCall, color: "emerald", highlight: true },
                        { label: "New Leads", val: stats?.newReach, icon: UserPlus, color: "sky" },
                        { label: "Follow Ups", val: stats?.followups, icon: PhoneForwarded, color: "amber" },
                        { label: "Today ONB", val: stats?.todayOnb, icon: Zap, color: "teal", highlight: true },
                        { label: "Today Sales", val: stats?.todaySales, icon: Award, color: "indigo", highlight: true },
                        { label: "Untouched", val: stats?.untouched, icon: AlertTriangle, color: "rose" },
                        { label: "Pend F/U", val: stats?.pending, icon: Clock, color: "rose" },
                        { label: "Forms Created", val: stats?.forms, icon: FilePlus, color: "blue" },
                        { label: "To-Do Task", val: stats?.todo, icon: Briefcase, color: "orange" },
                        { label: "Progress Task", val: stats?.progress, icon: Activity, color: "orange" },
                        { label: "Revenue GAP", val: "₹" + (stats?.revenueGap || 0).toLocaleString(), icon: AlertTriangle, color: "rose", highlight: true },
                        { label: "Operators", val: stats?.operators, icon: User, color: "slate" },
                        { label: "Efficiency", val: stats?.efficiency + "%", icon: TrendingUp, color: "indigo" },
                        { label: "Daily Input", val: (stats?.reachout || 0) + (stats?.untouched || 0), icon: Layers, color: "slate" },
                        { label: "Engagement", val: Math.round(((stats?.connected || 0) / (stats?.operators || 1))) + "/Op", icon: Zap, color: "emerald" },
                        { label: "Phase Stats", val: "L-IV", icon: Activity, color: "rose" }
                    ].map((card, i) => (
                        <div key={i} className={`border p-5 rounded-[28px] relative overflow-hidden group transition-all duration-300 shadow-sm hover:shadow-2xl hover:-translate-y-1 ${isDark ? 'bg-white/[0.03] border-white/5 hover:border-white/10' : 'bg-white border-slate-100 hover:border-indigo-200'}`}>
                            <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity"><card.icon size={60} /></div>
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] mb-1.5 opacity-50">{card.label}</p>
                            <h3 className={`text-2xl font-black tracking-tighter tabular-nums ${isDark ? 'text-white' : 'text-slate-900'} ${card.highlight ? 'text-indigo-500 font-black' : ''}`}>{card.val ?? 0}</h3>
                        </div>
                    ))}
                </div>

                {/* Table Data Matrix */}
                <div className={`border rounded-[48px] shadow-2xl relative overflow-hidden min-h-[600px] transition-all duration-700 ${isDark ? 'bg-white/[0.02] border-white/5 shadow-black/80' : 'bg-white border-slate-100 shadow-slate-200'}`}>
                    {loading && (
                        <div className={`absolute inset-0 z-30 backdrop-blur-md flex items-center justify-center ${isDark ? 'bg-[#0a0c10]/60' : 'bg-white/60'}`}>
                            <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin border-indigo-500`} />
                        </div>
                    )}
                    <div className="overflow-x-auto relative mt-8">
                        <table className="w-full border-collapse min-w-[3200px]">
                            {/* MASTER Table Structure */}
                            {viewMode === "MASTER" ? (
                                <>
                                    <thead>
                                        <tr className={`text-center ${isDark ? 'bg-white/5' : 'bg-slate-50/50'}`}>
                                            <th className={`px-6 py-8 text-left text-[11px] font-black uppercase tracking-[0.2em] border-b ${isDark ? 'text-slate-500 border-white/5' : 'text-slate-400 border-slate-100'} w-16`}>No.</th>
                                            <th className={`px-8 py-8 text-left text-[11px] font-black uppercase tracking-[0.2em] border-b sticky left-0 z-20 ${isDark ? 'text-slate-500 border-white/5 bg-[#12141a]' : 'text-slate-400 border-slate-100 bg-white shadow-xl shadow-slate-200/10'}`}>Staff Member</th>
                                            <th className={`px-4 py-8 text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] border-b ${isDark ? 'border-white/5 bg-rose-500/5' : 'border-rose-100 bg-rose-50'}`}>Untouched LEAD</th>
                                            <th className={`px-4 py-8 text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] border-b ${isDark ? 'border-white/5 bg-rose-500/5' : 'border-rose-100 bg-rose-50'}`}>Followups Pending</th>
                                            <th className={`px-4 py-8 text-[10px] font-black text-sky-500 uppercase tracking-[0.2em] border-b ${isDark ? 'border-white/5 bg-sky-500/5' : 'border-sky-100 bg-sky-50'}`}>Today Form Created</th>
                                            <th className={`px-4 py-8 text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] border-b ${isDark ? 'border-white/5 bg-emerald-500/5' : 'border-emerald-100 bg-emerald-50'}`}>Total Call Reachout</th>
                                            <th className={`px-4 py-8 text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] border-b ${isDark ? 'border-white/5 bg-emerald-500/5' : 'border-emerald-100 bg-emerald-50'}`}>Total Call Connected</th>
                                            <th className={`px-4 py-8 text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] border-b ${isDark ? 'border-white/5 bg-emerald-500/5' : 'border-emerald-100 bg-emerald-50'}`}>New Call Reachout</th>
                                            <th className={`px-4 py-8 text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] border-b ${isDark ? 'border-white/5 bg-emerald-500/5' : 'border-emerald-100 bg-emerald-50'}`}>New Call Connected</th>
                                            <th className={`px-4 py-8 text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] border-b ${isDark ? 'border-white/5 bg-amber-500/5' : 'border-amber-100 bg-amber-50'}`}>Followups Calls</th>
                                            <th className={`px-4 py-8 text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] border-b ${isDark ? 'border-white/5 bg-amber-500/5' : 'border-amber-100 bg-amber-50'}`}>Followups Call Conn.</th>
                                            <th className={`px-4 py-8 text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] border-b ${isDark ? 'border-white/5 bg-teal-500/5' : 'border-teal-100 bg-teal-50 shadow-xl'}`}>Today ONB</th>
                                            <th className={`px-4 py-8 text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] border-b ${isDark ? 'border-white/5 bg-teal-500/5' : 'border-teal-100 bg-teal-50'}`}>Today Sales</th>
                                            <th className={`px-4 py-8 text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] border-b ${isDark ? 'border-white/5 bg-emerald-500/5' : 'border-emerald-100 bg-emerald-50'}`}>MTD Total Sales (Amt)</th>
                                            <th className={`px-4 py-8 text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] border-b ${isDark ? 'border-white/5 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-100'}`}>MTD Total Recv</th>
                                            <th className={`px-4 py-8 text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] border-b ${isDark ? 'border-white/5 bg-rose-500/5' : 'border-rose-100 bg-rose-50'}`}>MTD Payment Pend</th>
                                            <th className={`px-4 py-8 text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] border-b ${isDark ? 'border-white/5 bg-rose-600/10 shadow-inner' : 'border-rose-200 bg-rose-100'}`}>True Revenue Gap</th>
                                            <th className={`px-4 py-8 text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] border-b ${isDark ? 'border-white/5 bg-orange-500/5' : 'border-orange-100 bg-orange-50'}`}>To-Do</th>
                                            <th className={`px-4 py-8 text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] border-b ${isDark ? 'border-white/5 bg-orange-500/5' : 'border-orange-100 bg-orange-50 shadow-inner'}`}>Progress</th>
                                            <th className={`px-6 py-8 text-right text-[10px] font-black uppercase tracking-[0.2em] border-b pr-12 ${isDark ? 'text-slate-500 border-white/5' : 'text-slate-400 border-slate-100'}`}>View</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y transition-all ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                                        {matrixData.map((user, idx) => (
                                            <tr key={user.userId} className={`group transition-all ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'}`}>
                                                <td className={`px-6 py-6 text-xs font-black tabular-nums transition-all ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>{idx + 1}</td>
                                                <td className={`px-8 py-6 sticky left-0 z-10 font-bold text-xs border-r transition-all ${isDark ? 'bg-[#0c0e14] group-hover:bg-[#15171d] text-white border-white/5' : 'bg-white group-hover:bg-slate-50 text-slate-800 border-slate-100'}`}>{user.name}</td>
                                                <td className="px-4 py-6 text-center text-rose-500 font-bold tabular-nums">{user.untouched}</td>
                                                <td className="px-4 py-6 text-center text-rose-400 opacity-60 font-medium tabular-nums">{user.pending}</td>
                                                <td className="px-4 py-6 text-center text-sky-500 font-bold tabular-nums">{user.submissionsFilled}</td>
                                                <td className={`px-4 py-6 text-center font-black tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.reachout}</td>
                                                <td className="px-4 py-6 text-center text-emerald-500 font-bold tabular-nums">{user.connected}</td>
                                                <td className={`px-4 py-6 text-center opacity-60 tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user.newReachout}</td>
                                                <td className="px-4 py-6 text-center text-emerald-600 font-bold tabular-nums">{user.newConnected}</td>
                                                <td className={`px-4 py-6 text-center opacity-60 tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user.followupCalls}</td>
                                                <td className="px-4 py-6 text-center text-amber-500 font-bold tabular-nums">{user.followupConnected}</td>
                                                <td className="px-4 py-6 text-center text-teal-400 font-black tabular-nums transition-all group-hover:bg-teal-500/5">{user.todayOnb}</td>
                                                <td className="px-4 py-6 text-center text-teal-600 font-black tabular-nums">{user.sales}</td>
                                                <td className={`px-4 py-6 text-center font-bold tabular-nums ${isDark ? 'text-white/40' : 'text-slate-400'}`}>₹{user.totalSales.toLocaleString()}</td>
                                                <td className={`px-4 py-6 text-center font-black tabular-nums bg-emerald-500/5 ${isDark ? 'text-emerald-500' : 'text-emerald-700'}`}>₹{user.receivedAmount.toLocaleString()}</td>
                                                <td className="px-4 py-6 text-center text-rose-500 font-bold tabular-nums">₹{user.paymentPending.toLocaleString()}</td>
                                                <td className={`px-4 py-6 text-center font-black tabular-nums ${isDark ? 'bg-rose-500/10 text-rose-500' : 'bg-rose-50 text-rose-600'}`}>₹{user.revenueGap.toLocaleString()}</td>
                                                <td className="px-4 py-6 text-center text-orange-500 font-bold tabular-nums bg-orange-500/5">{user.todo}</td>
                                                <td className="px-4 py-6 text-center text-orange-600 font-bold tabular-nums bg-orange-500/5">{user.progress}</td>
                                                <td className="px-6 py-6 text-right pr-12">
                                                    <button onClick={() => window.open(`/call-report/details?userId=${user.userId}&date=${format(date, 'yyyy-MM-dd')}&name=${encodeURIComponent(user.name)}&type=ALL`, '_blank')} className={`p-3 rounded-2xl transition-all shadow-xl active:scale-95 group-hover:translate-x-1 ${isDark ? 'bg-white/5 hover:bg-indigo-600 text-slate-500 hover:text-white border border-white/5' : 'bg-slate-50 border border-slate-100 hover:bg-slate-900 text-slate-400 hover:text-white'}`}>
                                                        <ExternalLink size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            ) : (
                                <>
                                    <thead>
                                        <tr className={isDark ? 'bg-white/5' : 'bg-slate-50'}>
                                            <th className={`px-8 py-8 text-left text-[11px] font-black uppercase tracking-[0.2em] border-b w-16 sticky left-0 z-30 ${isDark ? 'text-slate-500 border-white/5 bg-[#12141a]' : 'text-slate-400 border-slate-100 bg-white shadow-xl'}`}>No.</th>
                                            <th className={`px-8 py-8 text-left text-[11px] font-black uppercase tracking-[0.2em] border-b sticky left-0 z-30 min-w-[200px] ${isDark ? 'text-slate-500 border-white/5 bg-[#12141a]' : 'text-slate-400 border-slate-100 bg-white shadow-xl'}`}>Staff Member</th>
                                            {auditData[0]?.stats.map((s: any) => (
                                                <th key={s.date} className={`px-6 py-8 text-center border-b transition-all ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-white'}`}>
                                                    <div className={`text-[10px] font-black uppercase mb-1 ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>{format(parseISO(s.date), "EEE")}</div>
                                                    <div className={`text-[10px] font-black uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>{format(parseISO(s.date), "MMM dd")}</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                                        {auditData.map((user, idx) => (
                                            <tr key={user.userId} className={`group ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'}`}>
                                                <td className={`px-8 py-10 text-xs font-black sticky left-0 z-20 ${isDark ? 'text-slate-600 bg-[#0c0e14]' : 'text-slate-300 bg-white'}`}>{idx + 1}</td>
                                                <td className={`px-8 py-10 sticky left-0 z-20 font-black text-sm border-r ${isDark ? 'bg-[#0c0e14] text-white border-white/10' : 'bg-white text-slate-800 border-slate-100'}`}>{user.name}</td>
                                                {user.stats.map((day: any) => (
                                                    <td key={day.date} className={`px-6 py-10 text-center min-w-[150px] border-r ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                                                        <div className="flex flex-col gap-2">
                                                            <div className={`flex justify-between items-end border-b pb-2 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                                                                <span className={`text-[9px] font-black uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Total Input</span>
                                                                <span className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{day.total}</span>
                                                            </div>
                                                            <div className="flex justify-between items-end">
                                                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest italic">Backlog</span>
                                                                <span className={`text-lg font-black ${day.untouched > 0 ? "text-rose-500" : isDark ? "text-emerald-500/30" : "text-emerald-500/10"}`}>{day.untouched}</span>
                                                            </div>
                                                            <div className={`h-1.5 rounded-full overflow-hidden mt-1 shadow-inner ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                                                <div className={`h-full transition-all duration-1000 ${day.total > 0 && day.untouched === 0 ? 'bg-emerald-500' : 'bg-indigo-600'} shadow-[0_0_15px_rgba(79,70,229,0.5)]`} style={{ width: `${day.total > 0 ? ((day.total - day.untouched) / day.total) * 100 : 0}%` }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
