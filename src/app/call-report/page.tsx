"use client";

import React, { useEffect, useState } from "react";
import { format, subDays, addDays } from "date-fns";
import { PieChart, PhoneCall, Calendar, Activity, ChevronRight, Hash, CheckCircle2, XCircle, Database, Download, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

type UserReport = {
    userId: string;
    name: string;
    email: string;
    callCount: number;
    connectedCount: number;
    notConnectedCount: number;
    rawRemarks?: number; // 🛡️ NEW METRIC
};

type ReportData = {
    reports: any[]; // 🛡️ FULL DATA SOURCE
    followUpReport: UserReport[];
    newCallReport: UserReport[];
    combinedReport: UserReport[];
    totalOperators: number;
};

export default function CallReportPage() {
    const [date, setDate] = useState<Date>(new Date());
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [matrixLoading, setMatrixLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"NEW" | "FOLLOWUP" | "COMBINED">("COMBINED");
    const [matrixData, setMatrixData] = useState<any[]>([]);

    const fetchReport = async (targetDate: Date) => {
        setLoading(true);
        try {
            const dateStr = format(targetDate, "yyyy-MM-dd");
            const res = await fetch(`/api/call-report?date=${dateStr}`);
            const json = await res.json();
            if (res.ok) {
                setData(json);
            } else {
                toast.error("Failed to fetch report");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const fetchMatrix = async (targetDate: Date) => {
        setMatrixLoading(true);
        try {
            const dateStr = format(targetDate, "yyyy-MM-dd");
            const res = await fetch(`/api/call-report/matrix?start=${dateStr}&end=${dateStr}&range=CUSTOM`);
            const json = await res.json();
            if (res.ok) setMatrixData(json.report);
        } catch (error) { toast.error("Failed to fetch User Matrix"); }
        finally { setMatrixLoading(false); }
    };

    const downloadCSV = () => {
        if (!matrixData || matrixData.length === 0) return;
        
        const headers = [
            "Staff Identity", "Untouched Leads", "Pending F/U", "Today Created", "Total Reachout", 
            "Total Connected", "New Reachout", "New Connected", "F/U Calls", "F/U Connected", 
            "Today ONB", "Today Sales", "To-Do Tasks", "In Progress", "Paid Work Done", "Payment Pending"
        ];

        const rows = matrixData.map(u => [
            u.name, u.untouched, u.pending, u.created, u.reachout, 
            u.connected, u.newReachout, u.newConnected, u.followupCalls, u.followupConnected, 
            u.onboarding, u.sales, u.todo, u.progress, u.paymentDone, u.paymentPending
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Analytical_Matrix_${format(date, "yyyy-MM-dd")}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Analytical Report Extracted!");
    };

    useEffect(() => {
        fetchReport(date);
        fetchMatrix(date);
    }, [date]);

    const currentReport = activeTab === "NEW" ? data?.newCallReport :
        activeTab === "FOLLOWUP" ? data?.followUpReport :
            data?.combinedReport;

    const totalLeads = currentReport?.reduce((acc, curr) => acc + curr.callCount, 0) || 0;
    const totalConnected = currentReport?.reduce((acc, curr) => acc + curr.connectedCount, 0) || 0;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 animate-in slide-in-from-bottom-8 duration-500 pb-20">
            {/* Page Title & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Engagement Hub</h1>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest text-[10px]">Tiered Reporting System</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center self-stretch md:self-auto">
                    {/* Tier Selector */}
                    <div className="flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab("COMBINED")}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "COMBINED" ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Total Activity
                        </button>
                        <button
                            onClick={() => setActiveTab("NEW")}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "NEW" ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            New Calls
                        </button>
                        <button
                            onClick={() => setActiveTab("FOLLOWUP")}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "FOLLOWUP" ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Follow-ups
                        </button>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 shadow-inner">
                        <button onClick={() => setDate(subDays(date, 1))} className="p-2 hover:bg-white rounded-xl transition-all font-black text-slate-400 hover:text-slate-700 hover:shadow-sm">
                            ←
                        </button>
                        <div className="flex items-center gap-2 px-4 py-1">
                            <Calendar size={14} className="text-indigo-500" />
                            <span className="text-sm font-black text-slate-700 tracking-widest uppercase">{format(date, "MMM dd, yyyy")}</span>
                        </div>
                        <button onClick={() => setDate(addDays(date, 1))} className="p-2 hover:bg-white rounded-xl transition-all font-black text-slate-400 hover:text-slate-700 hover:shadow-sm">
                            →
                        </button>
                    </div>
                </div>
            </div>

            {/* Header Stats Summary */}
            <div className={`p-8 rounded-[40px] shadow-2xl flex flex-col md:flex-row justify-between items-center text-white gap-8 overflow-hidden relative transition-all duration-500 ${activeTab === "NEW" ? 'bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-emerald-200' :
                    activeTab === "FOLLOWUP" ? 'bg-gradient-to-br from-amber-500 to-amber-700 shadow-amber-200' :
                        'bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-indigo-200'
                }`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                <div className="relative z-10">
                    <h2 className="text-4xl font-black tracking-tighter mb-1">
                        {activeTab === "NEW" ? "New Acquisition Report" :
                            activeTab === "FOLLOWUP" ? "Secondary Follow-ups" :
                                "Global Team Performance"}
                    </h2>
                    <p className="text-white/80 font-bold uppercase tracking-widest text-[10px]">
                         Aggregated stats from all client touchpoints
                    </p>
                </div>
                <div className="flex gap-10 relative z-10 shrink-0">
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">Impacted Leads</p>
                        <p className="text-4xl font-black tracking-tighter">{totalLeads}</p>
                    </div>
                    <div className="w-px h-12 bg-white/20 self-center" />
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">Total Remarks</p>
                        <p className="text-4xl font-black tracking-tighter">
                            {data?.reports?.reduce((acc, curr) => acc + curr.stats.rawRemarks, 0) || 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* Loading / Data View */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white p-8 rounded-[40px] animate-pulse h-[280px]" />
                    ))}
                </div>
            ) : !currentReport || currentReport.length === 0 ? (
                <div className="bg-white rounded-[40px] p-20 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100 border-dashed">
                    <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-300 mb-6 shadow-inner">
                        <PhoneCall size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-700">No Activity Detected</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentReport.map((user, idx) => {
                        // Find the raw remark count from the base report source
                        const identity = data?.reports?.find(r => r.userId === user.userId);
                        const remarkVolume = identity?.stats?.rawRemarks || 0;

                        return (
                        <div
                            key={user.userId}
                            onClick={() => window.location.href = `/call-report/details?userId=${user.userId}&date=${format(date, "yyyy-MM-dd")}&type=${activeTab}&name=${encodeURIComponent(user.name)}`}
                            className={`bg-white rounded-[40px] p-8 border cursor-pointer ${idx === 0 ? 'border-2 border-indigo-500 shadow-2xl shadow-indigo-100' : 'border-slate-100 shadow-sm'} relative group hover:-translate-y-2 transition-all duration-500 overflow-hidden`}
                        >
                            {idx === 0 && (
                                <div className="absolute -top-4 -right-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full shadow-lg border-4 border-white rotate-12">
                                    Leader
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-8">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner border transition-all group-hover:rotate-6 ${idx === 0 ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-50 text-slate-400 border-slate-100'
                                    }`}>
                                    {user.name.charAt(0) || "?"}
                                </div>
                                <div className="text-right">
                                    <div className="text-[24px] font-black text-slate-800 tracking-tighter leading-none">{user.callCount}</div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                        {activeTab === "NEW" ? "New Calls Logged" :
                                            activeTab === "FOLLOWUP" ? "Follow-ups Logged" :
                                                "Total Leads Logged"}
                                    </div>
                                </div>
                            </div>

                            <h3 className="font-black text-slate-800 text-lg truncate mb-1 pr-4">{user.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <MessageSquare size={10} className="text-indigo-500" />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{remarkVolume} Total Remarks</span>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col gap-4">
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                                            <span className="text-emerald-600">
                                                Connected Leads
                                            </span>
                                            <span className="text-slate-900">{user.connectedCount}</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000"
                                                style={{ width: `${(user.connectedCount / user.callCount) * 100 || 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                                            <span className="text-indigo-500 font-black">Velocity Score</span>
                                            <span className="text-indigo-600">{(remarkVolume / user.callCount).toFixed(1)}x</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${Math.min((remarkVolume / (user.callCount * 2)) * 100, 100) || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <div className={`flex-1 h-8 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest border transition-all ${idx === 0 ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                                        }`}>
                                        <CheckCircle2 size={12} />
                                        Efficiency: {Math.round((user.connectedCount / user.callCount) * 100) || 0}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    );})}
                </div>
            )
            }

            {/* 🗺️ UNIVERSAL ANALYTICAL MATRIX (Gateway to dedicated page) */}
            <div className="mt-20 p-12 bg-white rounded-[48px] border border-slate-100 shadow-2xl shadow-indigo-100/50 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-[100px] -mr-32 -mt-32 transition-all group-hover:scale-150 duration-700" />
                
                <div className="flex items-center gap-8 relative z-10">
                    <div className="w-20 h-20 bg-slate-900 rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-slate-200 border-4 border-white transition-transform group-hover:scale-110">
                        <Activity size={36} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tighter leading-none mb-3">Grand Analysis Matrix</h3>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                             Full-screen Audit • Historical Sharding • Zero-Activity Filter
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 relative z-10 w-full md:w-auto">
                    <button 
                        onClick={() => window.location.href = '/call-report/matrix'}
                        className="w-full md:w-auto px-10 py-5 bg-indigo-600 text-white rounded-[24px] text-[12px] font-black uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:-translate-y-2 transition-all flex items-center justify-center gap-3 active:scale-95 hover:shadow-[0_30px_70px_rgba(79,70,229,0.4)]"
                    >
                         Enter Grand Matrix <ChevronRight size={18} />
                    </button>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Optimized Administrative Layer Active</p>
                </div>
            </div>
        </div>
    );
}
