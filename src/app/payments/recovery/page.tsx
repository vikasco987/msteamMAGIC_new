"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { format, differenceInDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
    Activity, Wallet, AlertTriangle, MessageCircle, Phone, Calendar,
    Search, History, Edit3, X, User, CheckCircle2, Clock, Filter,
    Store, Smartphone, ChevronUp, ChevronDown, Download, ShieldCheck,
    Globe, ChevronLeft, ChevronRight, Info, Zap, ArrowRight, BarChart3,
    Trophy, Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import PaymentRemarkModal from "@/app/components/PaymentRemarkModal";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";

interface PaymentRemark {
    id: string; remark: string; createdAt: string; authorName: string;
    contactOutcome: string; nextFollowUpDate: string | null;
}
interface ActivityLog {
    id: string; type: string; content: string; createdAt: string;
}
interface RecoveryTask {
    id: string; title: string; shopName: string; customerName: string;
    phone: string; location: string; email: string; assigneeName: string;
    assignerName: string; createdByClerkId: string;
    status: string; priority: string | null;
    total: number; received: number; pending: number;
    latestRemark: PaymentRemark | null; allRemarks: PaymentRemark[];
    activities: ActivityLog[]; createdAt: string; dueDate: string | null;
    customFields: any;
}

interface PaginationInfo {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
}

type SortKey = "pending" | "total" | "received" | "createdAt";
type SortDir = "asc" | "desc";

export default function PaymentRecoveryPage() {
    const { user } = useUser();
    const [tasks, setTasks] = useState<RecoveryTask[]>([]);
    const [summary, setSummary] = useState({ totalPending: 0, taskCount: 0 });
    const [role, setRole] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 50, totalPages: 0, totalItems: 0 });

    // --- Filters ---
    const [searchTerm, setSearchTerm] = useState("");
    const [filterAssigner, setFilterAssigner] = useState("all");
    const [filterMember, setFilterMember] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterTaskStatus, setFilterTaskStatus] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");
    const [filterDate, setFilterDate] = useState("all");
    const [filterOutcome, setFilterOutcome] = useState("all");
    const [filterSource, setFilterSource] = useState("all");

    // TL Specific
    const [teamMembers, setTeamMembers] = useState<{ clerkId: string, name: string }[]>([]);

    // Custom Date Filters
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));

    const [sortKey, setSortKey] = useState<SortKey>("createdAt");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const [showHistoryTask, setShowHistoryTask] = useState<RecoveryTask | null>(null);
    const [showEditModal, setShowEditModal] = useState<string | null>(null);

    const isTL = useMemo(() => role.toLowerCase() === "tl", [role]);
    const isAdminOrMaster = role.toLowerCase() === "admin" || role.toLowerCase() === "master";

    const fetchRecoveryData = useCallback(async (pageOverride?: number, limitOverride?: number) => {
        setLoading(true);
        try {
            const page = pageOverride || pagination.page;
            const limit = limitOverride || pagination.limit;

            let finalStart = startDate;
            let finalEnd = endDate;

            if (selectedMonth !== "all") {
                const monthDate = new Date(selectedMonth);
                finalStart = format(startOfMonth(monthDate), "yyyy-MM-dd");
                finalEnd = format(endOfMonth(monthDate), "yyyy-MM-dd");
            }

            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                searchTerm,
                filterAssigner,
                filterMember,
                filterTaskStatus,
                filterPriority,
                filterSource,
                filterOutcome,
                filterDate,
                ...(finalStart && { startDate: finalStart }),
                ...(finalEnd && { endDate: finalEnd })
            });

            const res = await fetch(`/api/payments/recovery?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setTasks(data.tasks || []);
                setSummary(data.summary || { totalPending: 0, taskCount: 0 });
                setRole(data.role || "");
                if (data.pagination) {
                    setPagination(data.pagination);
                }
            }
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error("Failed to load recovery data");
        } finally {
            setLoading(false);
        }
    }, [searchTerm, filterAssigner, filterMember, filterTaskStatus, filterPriority, filterSource, filterOutcome, filterDate, startDate, endDate, selectedMonth, pagination.limit]);

    useEffect(() => {
        const timer = setTimeout(() => fetchRecoveryData(1), 500);
        return () => clearTimeout(timer);
    }, [searchTerm, filterAssigner, filterMember, filterTaskStatus, filterPriority, filterSource, filterOutcome, filterDate, startDate, endDate, selectedMonth, fetchRecoveryData, pagination.limit]);

    // Fetch TL's team
    useEffect(() => {
        if (isTL) {
            fetch("/api/admin/my-team")
                .then(res => res.json())
                .then(data => {
                    if (data.members) setTeamMembers(data.members);
                })
                .catch(() => { });
        }
    }, [isTL]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages && !loading) {
            fetchRecoveryData(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const assigners = useMemo(() => {
        const unique = [...new Set(tasks.map(t => t.assignerName))].filter(Boolean).sort();
        return unique;
    }, [tasks]);

    const outcomes = useMemo(() => ["Negotiated", "Promised", "Refused", "No Response", "Disconnected"].sort(), []);
    const sources = useMemo(() => [...new Set(tasks.map(t => t.customFields?.source).filter(Boolean))].sort(), [tasks]);

    // Generate last 12 months for filter
    const monthOptions = useMemo(() => {
        const options = [];
        for (let i = 0; i < 12; i++) {
            const d = subMonths(new Date(), i);
            options.push({
                label: format(d, "MMMM yyyy"),
                value: format(d, "yyyy-MM")
            });
        }
        return options;
    }, []);

    const getRecoveryStatus = (task: RecoveryTask) => {
        if (!task.latestRemark) return { id: "no_followup", label: "No Follow-up", color: "bg-red-50 text-red-600 border-red-100", icon: <AlertTriangle size={12} /> };
        const days = differenceInDays(new Date(), new Date(task.latestRemark.createdAt));
        if (days > 5) return { id: "danger", label: `${days}d Silence`, color: "bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-200", icon: <X size={12} /> };
        if (days >= 3) return { id: "warning", label: "Needs Update", color: "bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-200", icon: <Clock size={12} /> };
        return { id: "active", label: "Active Chase", color: "bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-200", icon: <CheckCircle2 size={12} /> };
    };

    const filteredTasks = useMemo(() => {
        let list = [...tasks];
        if (filterStatus !== "all") list = list.filter(t => getRecoveryStatus(t).id === filterStatus);
        list.sort((a, b) => {
            let av: number, bv: number;
            if (sortKey === "createdAt") { av = +new Date(a.createdAt); bv = +new Date(b.createdAt); }
            else { av = a[sortKey]; bv = b[sortKey]; }
            return sortDir === "asc" ? av - bv : bv - av;
        });
        return list;
    }, [tasks, filterStatus, sortKey, sortDir]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("desc"); }
    };

    const SortIcon = ({ k }: { k: SortKey }) =>
        sortKey === k
            ? sortDir === "asc" ? <ChevronUp className="inline ml-1 text-indigo-500" size={14} /> : <ChevronDown className="inline ml-1 text-indigo-500" size={14} />
            : <ArrowRight className="inline ml-1 opacity-20 rotate-90" size={14} />;

    const clearFilters = () => {
        setSearchTerm(""); setFilterAssigner("all"); setFilterMember("all");
        setFilterStatus("all"); setFilterTaskStatus("all");
        setFilterPriority("all"); setFilterDate("all"); setFilterOutcome("all");
        setFilterSource("all"); setStartDate(""); setEndDate(""); setSelectedMonth("all");
    };
    const hasFilters = searchTerm || filterAssigner !== "all" || filterMember !== "all" || filterStatus !== "all" ||
        filterTaskStatus !== "all" || filterPriority !== "all" || filterDate !== "all" ||
        filterOutcome !== "all" || filterSource !== "all" || startDate || endDate || selectedMonth !== "all";

    const exportXLSX = () => {
        const rows = filteredTasks.map((t, i) => ({
            "S.No": i + 1,
            "Shop": t.shopName || t.title,
            "Customer": t.customerName || "—",
            "Phone": t.phone || "—",
            "Assigner": t.assignerName,
            "Total": t.total,
            "Pending": t.pending,
            "Last Remark": t.latestRemark?.remark || "None",
            "Outcome": t.latestRemark?.contactOutcome || "—",
            "Follow-up Date": t.latestRemark?.nextFollowUpDate ? format(new Date(t.latestRemark.nextFollowUpDate), "dd MMM yyyy") : "None",
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Recovery");
        const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([buf], { type: "application/octet-stream" }), `Recovery_Export.xlsx`);
    };

    const todayFocusTasks = tasks.filter(t =>
        t.latestRemark?.nextFollowUpDate &&
        new Date(t.latestRemark.nextFollowUpDate).toDateString() === new Date().toDateString()
    ).slice(0, 4);

    return (
        <div className="max-w-[1700px] mx-auto p-4 md:p-10 space-y-10">

            {/* --- PREMIUM HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-1 w-8 bg-indigo-600 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Recovery & Intelligence</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <div className="p-4 bg-indigo-600 rounded-[24px] text-white shadow-2xl shadow-indigo-200">
                            <Wallet size={32} />
                        </div>
                        Recovery <span className="text-indigo-600">Hub</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-4">
                        <p className="text-slate-500 font-semibold">Automated payment chase and collection matrix.</p>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                AI Chasing Active
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={exportXLSX} className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-[22px] hover:bg-emerald-700 shadow-2xl shadow-emerald-100 transition-all">
                        <Download size={16} /> Export Data
                    </button>
                    <div className="relative group">
                        <Search className="absolute left-5 top-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search shops, IDs, phones..."
                            className="bg-white border border-slate-200 rounded-[22px] pl-14 pr-8 py-4.5 text-sm font-bold text-slate-900 outline-none w-[350px] shadow-sm focus:border-indigo-400 transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* --- CORE METRICS --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total Outstanding", value: `₹${summary.totalPending.toLocaleString()}`, sub: `${summary.taskCount} active bills`, icon: Activity, color: "text-slate-900", glow: "indigo" },
                    { label: "High Priority", value: `₹${todayFocusTasks.reduce((s, t) => s + t.pending, 0).toLocaleString()}`, sub: `${todayFocusTasks.length} due today`, icon: Target, color: "text-indigo-600", glow: "indigo", dark: true },
                    { label: "Risk Exposure", value: String(tasks.filter(t => !t.latestRemark || differenceInDays(new Date(), new Date(t.latestRemark.createdAt)) > 5).length), sub: "silent for 5+ days", icon: AlertTriangle, color: "text-rose-600", glow: "rose" },
                    { label: "Recovery Yield", value: `${Math.round((summary.totalPending / (summary.totalPending + 100000)) * 100)}%`, sub: "system efficiency", icon: Trophy, color: "text-emerald-600", glow: "emerald" }
                ].map((c, i) => (
                    <motion.div key={i} whileHover={{ y: -5 }} className={`${c.dark ? 'bg-[#0f172a] text-white' : 'bg-white text-slate-900'} p-8 rounded-[40px] shadow-xl shadow-slate-200/40 border border-slate-50 relative overflow-hidden group`}>
                        <div className={`absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity`}>
                            <c.icon size={80} className={c.color.replace('text-', 'text-')} />
                        </div>
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className={`p-3 ${c.dark ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-500'} rounded-2xl`}>
                                <c.icon size={20} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${c.dark ? 'text-slate-400' : 'text-slate-400'}`}>{c.label}</span>
                        </div>
                        <p className={`text-4xl font-black tracking-tight relative z-10 ${c.color}`}>{c.value}</p>
                        <div className="flex items-center gap-1.5 mt-4 relative z-10">
                            <div className={`w-2 h-2 rounded-full ${c.color.replace('text-', 'bg-')}`} />
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{c.sub}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* --- TARGET DECK --- */}
            <AnimatePresence>
                {todayFocusTasks.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="flex items-center gap-3 px-4">
                            <div className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Focused Chase: Today</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {todayFocusTasks.map(task => (
                                <motion.div whileHover={{ scale: 1.02 }} key={task.id} className="bg-white p-6 rounded-[32px] shadow-2xl shadow-indigo-100/30 border border-slate-100 flex flex-col justify-between h-48 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="text-2xl font-black text-slate-900 tracking-tighter">₹{task.pending.toLocaleString()}</div>
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Smartphone size={14} /></div>
                                        </div>
                                        <div className="font-bold text-slate-600 text-sm line-clamp-1">{task.shopName}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <a href={`tel:${task.phone}`} className="flex-1 bg-slate-900 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-black transition">
                                            <Phone size={12} /> Call
                                        </a>
                                        <a href={`https://wa.me/91${task.phone}`} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition">
                                            <MessageCircle size={12} /> WhatsApp
                                        </a>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- ADVANCED FILTER BAR --- */}
            <div className="bg-white p-8 rounded-[40px] shadow-xl shadow-slate-200/30 border border-slate-50 space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-6 items-end gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Month</label>
                        <select
                            value={selectedMonth}
                            onChange={e => { setSelectedMonth(e.target.value); setStartDate(""); setEndDate(""); }}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-400 transition-all"
                        >
                            <option value="all">All Time</option>
                            {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => { setStartDate(e.target.value); setSelectedMonth("all"); }}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => { setEndDate(e.target.value); setSelectedMonth("all"); }}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>

                    {/* Role-based Visibility: Team Member Filter */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            {isAdminOrMaster ? "Created By" : isTL ? "Team Member" : "Assignments"}
                        </label>
                        {isAdminOrMaster ? (
                            <select
                                value={filterAssigner}
                                onChange={e => setFilterAssigner(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-400 transition-all"
                            >
                                <option value="all">All Assigners</option>
                                {assigners.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        ) : isTL ? (
                            <select
                                value={filterMember}
                                onChange={e => setFilterMember(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-400 transition-all"
                            >
                                <option value="all">My Entire Team</option>
                                <option value={user?.id}>My Own Tasks</option>
                                {teamMembers.map(m => (
                                    <option key={m.clerkId} value={m.clerkId}>{m.name}</option>
                                ))}
                            </select>
                        ) : (
                            <select
                                disabled
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-700 outline-none opacity-50 cursor-not-allowed"
                            >
                                <option value="all">Own Tasks Only</option>
                            </select>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Predictive Health</label>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-400 transition-all">
                            <option value="all">All Records</option>
                            <option value="active">Active Chase</option>
                            <option value="warning">Needs Update</option>
                            <option value="danger">Risk/Ignored</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-6">
                        {hasFilters && (
                            <button onClick={clearFilters} className="px-6 py-4 bg-rose-50 text-rose-600 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-rose-100 hover:bg-rose-100 transition-all">
                                Reset
                            </button>
                        )}
                        <div className="flex-1 space-y-2 min-w-[100px]">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Show Rows</label>
                            <select
                                value={pagination.limit}
                                onChange={e => {
                                    const newLimit = parseInt(e.target.value);
                                    setPagination(p => ({ ...p, limit: newLimit, page: 1 }));
                                    fetchRecoveryData(1, newLimit);
                                }}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-black text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-400 transition-all"
                            >
                                <option value={10}>10 Rows</option>
                                <option value={25}>25 Rows</option>
                                <option value={50}>50 Rows</option>
                                <option value={100}>100 Rows</option>
                            </select>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">MATCHING</p>
                            <p className="text-2xl font-black text-slate-900 leading-none">{pagination.totalItems}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RECOVERY MATRIX TABLE --- */}
            <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/20 border border-slate-50 overflow-hidden relative min-h-[400px]">
                {/* LOADING OVERLAY */}
                <AnimatePresence>
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4"
                        >
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Refreshing Matrix...</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className={`overflow-x-auto transition-all duration-500 ${loading ? 'blur-[4px] opacity-40 grayscale' : 'blur-0 opacity-100 grayscale-0'}`}>
                    <table className="w-full text-left">
                        <thead className="bg-[#fcfdfe] border-b border-slate-100">
                            <tr>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shop & Channel</th>
                                <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group" onClick={() => toggleSort("total")}>
                                    Volume <SortIcon k="total" />
                                </th>
                                <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group" onClick={() => toggleSort("pending")}>
                                    Pending <SortIcon k="pending" />
                                </th>
                                <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Latest Remark</th>
                                <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Followup</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50/70">
                            {filteredTasks.map((task) => {
                                const st = getRecoveryStatus(task);
                                return (
                                    <motion.tr key={task.id} className="group hover:bg-slate-50/50 transition-all">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4 mb-2">
                                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black transition-all group-hover:bg-indigo-600 group-hover:text-white shadow-sm">
                                                    <Store size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 border-b border-transparent group-hover:border-slate-200 transition-all">{task.shopName || task.title}</span>
                                                    <div className="flex items-center gap-3 mt-1 underline decoration-slate-200 underline-offset-4">
                                                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><Smartphone size={10} /> {task.phone}</span>
                                                        {task.customFields?.source && (
                                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{task.customFields.source}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-4 ml-1">
                                                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500 uppercase">
                                                    {task.assignerName?.charAt(0)}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 lowercase">managed by <span className="text-slate-600 font-black">{task.assignerName}</span></span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-8">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-xl font-black text-slate-900 tracking-tight">₹{task.total.toLocaleString()}</p>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(task.createdAt), "dd MMM yyyy")}</span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-8">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-3xl font-black text-rose-600 tracking-tighter">₹{task.pending.toLocaleString()}</p>
                                                <div className={`mt-2 flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest w-fit ${st.color}`}>
                                                    {st.icon} {st.label}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-8 max-w-[280px]">
                                            {task.latestRemark ? (
                                                <div onClick={() => setShowHistoryTask(task)} className="space-y-2 cursor-pointer group/remark p-4 rounded-2xl border border-transparent hover:bg-white hover:border-slate-100 hover:shadow-xl transition-all">
                                                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase inline-block">
                                                        {task.latestRemark.contactOutcome}
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-600 italic line-clamp-2 leading-relaxed">
                                                        "{task.latestRemark.remark}"
                                                    </p>
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                                                        <User size={10} /> {task.latestRemark.authorName} • {format(new Date(task.latestRemark.createdAt), "dd MMM")}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-black text-rose-400 uppercase italic tracking-widest">No Interactions Logged</span>
                                            )}
                                        </td>

                                        <td className="px-6 py-8">
                                            {task.latestRemark?.nextFollowUpDate ? (
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-3 rounded-2xl ${differenceInDays(new Date(task.latestRemark.nextFollowUpDate), new Date()) <= 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        <Calendar size={18} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-900">
                                                            {format(new Date(task.latestRemark.nextFollowUpDate), "dd MMM, yyyy")}
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase mt-1">
                                                            {differenceInDays(new Date(), new Date(task.latestRemark.nextFollowUpDate)) > 0 ? 'Overdue' : 'Scheduled'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-300 uppercase underline decoration-slate-100 underline-offset-4">Pending Commitment</span>
                                            )}
                                        </td>

                                        <td className="px-10 py-8 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button onClick={() => setShowEditModal(task.id)} className="p-4 bg-white border border-slate-100 text-slate-400 rounded-2xl hover:text-indigo-600 hover:border-indigo-400 hover:shadow-lg transition-all">
                                                    <Edit3 size={18} />
                                                </button>
                                                <button onClick={() => setShowHistoryTask(task)} className="p-4 bg-white border border-slate-100 text-slate-400 rounded-2xl hover:text-indigo-600 hover:border-indigo-400 hover:shadow-lg transition-all">
                                                    <History size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* --- SMART PAGINATION --- */}
                {pagination.totalPages > 1 && (
                    <div className="p-10 bg-slate-50/30 flex items-center justify-between">
                        <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-slate-50 transition-all">
                            Previous Page
                        </button>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Block {pagination.page} / {pagination.totalPages}</p>
                        <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-slate-50 transition-all">
                            Next Page
                        </button>
                    </div>
                )}
            </div>

            {/* --- SLIDE-IN HISTORY PANEL --- */}
            <AnimatePresence>
                {showHistoryTask && (
                    <div className="fixed inset-0 z-[1000] flex justify-end">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistoryTask(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-xl bg-white h-screen shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
                            <div className="p-12 bg-indigo-600 text-white relative flex justify-between items-center">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] rounded-full" />
                                <div className="relative z-10">
                                    <h2 className="text-3xl font-black tracking-tight uppercase leading-none">{showHistoryTask.shopName}</h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mt-2">Activity Stream & Logs</p>
                                </div>
                                <button onClick={() => setShowHistoryTask(null)} className="p-4 bg-white/20 hover:bg-white/30 rounded-2xl transition-all relative z-10">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Pending Debt</p>
                                        <p className="text-4xl font-black text-slate-900 tracking-tighter">₹{showHistoryTask.pending.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-emerald-50 p-8 rounded-[40px] border border-emerald-100">
                                        <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-3">Received</p>
                                        <p className="text-4xl font-black text-emerald-700 tracking-tighter">₹{showHistoryTask.received.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="space-y-8 relative">
                                    <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-100" />

                                    {showHistoryTask.allRemarks.map((rm, i) => (
                                        <div key={rm.id} className="relative pl-16">
                                            <div className={`absolute left-0 top-0 w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-white shadow-xl ${i === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                <Clock size={16} />
                                            </div>
                                            <div className={`p-8 rounded-[32px] border transition-all ${i === 0 ? 'bg-indigo-50/50 border-indigo-100 shadow-xl shadow-indigo-100/20' : 'bg-white border-slate-100'}`}>
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">{format(new Date(rm.createdAt), "dd MMM, hh:mm a")}</span>
                                                    <span className="px-3 py-1 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase text-indigo-500">{rm.contactOutcome}</span>
                                                </div>
                                                <p className="text-sm font-black text-slate-800 leading-relaxed italic">"{rm.remark}"</p>
                                                {rm.nextFollowUpDate && (
                                                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Next Commitment:</span>
                                                        <span className="text-[11px] font-black text-slate-900">{format(new Date(rm.nextFollowUpDate), "dd MMM yyyy")}</span>
                                                    </div>
                                                )}
                                                <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold">{rm.authorName?.charAt(0)}</div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logged by {rm.authorName}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-12 border-t border-slate-100 bg-slate-50/50">
                                <button
                                    onClick={() => { setShowEditModal(showHistoryTask.id); setShowHistoryTask(null); }}
                                    className="w-full py-5 bg-slate-900 text-white font-black text-sm rounded-[24px] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                                >
                                    Log New Interaction
                                </button>
                            </div>
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL */}
            {showEditModal && (
                <PaymentRemarkModal
                    taskId={showEditModal}
                    onClose={() => setShowEditModal(null)}
                    onSave={() => { fetchRecoveryData(); setShowEditModal(null); }}
                />
            )}
        </div>
    );
}
