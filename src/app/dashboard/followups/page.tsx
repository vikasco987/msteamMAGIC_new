"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
    Calendar, Clock, User, Phone, FileText, Search, Filter,
    ChevronRight, ExternalLink, AlertCircle, CheckCircle2,
    ArrowRight, Bell, CalendarDays, Inbox, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { format, isToday, isPast, isFuture, startOfDay } from "date-fns";
import FormRemarkModal from "@/app/components/FormRemarkModal";

interface Remark {
    id: string;
    remark: string;
    nextFollowUpDate?: string;
    followUpStatus?: string;
    authorName: string;
    createdAt: string;
}

interface ResponseData {
    id: string;
    formId: string;
    form: {
        id: string;
        title: string;
        fields: any[];
    };
    remarks: Remark[];
    values: any[];
    submittedAt: string;
}

export default function FollowUpBoard() {
    const [data, setData] = useState<ResponseData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"today" | "overdue" | "upcoming" | "closed">("today");
    const [userRole, setUserRole] = useState("GUEST");

    // NEW ADVANCED FILTERS
    const [filterForm, setFilterForm] = useState("all");
    const [filterAuthor, setFilterAuthor] = useState("all");
    const [filterInteractionStatus, setFilterInteractionStatus] = useState("all");

    const [openModal, setOpenModal] = useState<{ formId: string; responseId: string } | null>(null);

    const fetchData = async () => {
        // 1. FAST CACHE LOAD
        const cached = localStorage.getItem("matrix_followup_cache");
        if (cached) {
            try {
                const json = JSON.parse(cached);
                setData(json.data || []);
                setUserRole(json.userRole || "GUEST");
                setLoading(false); // Show UI instantly
            } catch (e) { console.error("Cache error", e); }
        }

        if (!navigator.onLine) return; // Skip API if definitely offline

        try {
            const res = await axios.get("/api/crm/followups");
            if (res.data.success) {
                setData(res.data.data);
                setUserRole(res.data.userRole);
                localStorage.setItem("matrix_followup_cache", JSON.stringify(res.data));
            }
        } catch (error) {
            if (!navigator.onLine || String(error).includes('Network')) {
                // If we failed due to network, just keep the cache
                // No toast error if we already have cache
                if (!cached) toast.error("Offline: No data saved locally.");
            } else {
                toast.error("Failed to sync Command Center");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFollowUp = async (responseId: string) => {
        const isConfirmed = window.confirm("Are you sure you want to remove this lead from the Follow-up board? This will clear the next follow-up date for this lead.");
        if (!isConfirmed) return;

        try {
            const res = await axios.delete(`/api/crm/followups?responseId=${responseId}`);
            if (res.data.success) {
                toast.success("Lead removed from follow-up board");
                fetchData();
            }
        } catch (error) {
            toast.error("Failed to remove lead from board");
            console.error(error);
        }
    };

    useEffect(() => {
        fetchData();

        // Listen for online status to auto-sync
        const handleOnline = () => {
            toast.success("Connection restored! Syncing Command Center...");
            fetchData();
        };
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, []);

    const getFieldValue = (res: ResponseData, labelPart: string) => {
        const field = res.form.fields.find(f =>
            f.label.toLowerCase().includes(labelPart.toLowerCase())
        );
        if (!field) return "-";
        const val = res.values.find(v => v.fieldId === field.id);
        return val?.value || "-";
    };

    const forms = useMemo(() => [...new Set(data.map(d => d.form.title))].sort(), [data]);
    const authors = useMemo(() => {
        const set = new Set<string>();
        data.forEach(d => d.remarks.forEach(r => { if (r.authorName) set.add(r.authorName) }));
        return [...set].sort();
    }, [data]);

    const interactionStatuses = useMemo(() => {
        const set = new Set<string>();
        // Master list seed
        ["CALL AGAIN", "CALL DONE", "RNR", "MEETING", "INTERESTED", "ONBOARDED", "CLOSED", "FOLLOW UP", "SCHEDULED", "PAYMENT PENDING", "BUSY", "CONNECTED", "REJECTED"].forEach(s => set.add(s));
        // Real data seed
        data.forEach(d => d.remarks.forEach(r => { if (r.followUpStatus) set.add(r.followUpStatus) }));
        return [...set].sort();
    }, [data]);

    const filteredData = useMemo(() => {
        const now = startOfDay(new Date());

        return data.filter(res => {
            const latest = res.remarks[0];
            if (!latest) return false;

            // 1. Search Filter
            const name = getFieldValue(res, "name");
            const phone = getFieldValue(res, "phone");
            const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
                phone.includes(search) ||
                res.form.title.toLowerCase().includes(search.toLowerCase());

            if (!matchesSearch) return false;

            // 2. Advanced Filters
            if (filterForm !== "all" && res.form.title !== filterForm) return false;
            if (filterAuthor !== "all" && latest.authorName !== filterAuthor) return false;
            
            // 🔥 NORMALIZE STATUS FILTER (TRIM & CASE)
            if (filterInteractionStatus !== "all") {
                const s1 = (latest.followUpStatus || "Scheduled").trim().toUpperCase();
                const s2 = filterInteractionStatus.trim().toUpperCase();
                if (s1 !== s2) return false;
            }

            // 3. Tab Filtering
            if (latest.followUpStatus === "Closed" || latest.followUpStatus === "ONBOARDED") {
                return activeTab === "closed";
            }

            if (!latest.nextFollowUpDate) return false;

            const nextDate = startOfDay(new Date(latest.nextFollowUpDate));

            if (activeTab === "today") return isToday(nextDate);
            if (activeTab === "overdue") return isPast(nextDate) && !isToday(nextDate);
            if (activeTab === "upcoming") return isFuture(nextDate);

            return false;
        });
    }, [data, activeTab, search, filterForm, filterAuthor, filterInteractionStatus]);

    const stats = useMemo(() => {
        const now = startOfDay(new Date());
        const counts = { today: 0, overdue: 0, upcoming: 0, closed: 0 };

        data.forEach(res => {
            const latest = res.remarks[0];
            if (!latest) return;

            if (latest.followUpStatus === "Closed") {
                counts.closed++;
                return;
            }

            if (!latest.nextFollowUpDate) {
                return;
            }

            const nextDate = startOfDay(new Date(latest.nextFollowUpDate));
            if (isToday(nextDate)) counts.today++;
            else if (isPast(nextDate)) counts.overdue++;
            else if (isFuture(nextDate)) counts.upcoming++;
        });

        return counts;
    }, [data]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-1 w-8 bg-indigo-600 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Central Intelligence</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Follow-up <span className="text-indigo-600">Command Center</span></h1>
                        <p className="text-slate-500 mt-2 font-semibold italic">Unified tracking layer for cross-form lead recovery.</p>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input
                                type="text"
                                placeholder="Search Name, Phone, Form..."
                                className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={fetchData}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400"
                        >
                            <Clock size={18} />
                        </button>
                    </div>
                </div>

                {/* ADVANCED FILTER BAR */}
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Origin Form</label>
                        <select
                            value={filterForm}
                            onChange={e => setFilterForm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                            <option value="all">All Forms</option>
                            {forms.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Handled By</label>
                        <select
                            value={filterAuthor}
                            onChange={e => setFilterAuthor(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                            <option value="all">Everyone</option>
                            {authors.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Interaction Status</label>
                        <select
                            value={filterInteractionStatus}
                            onChange={e => setFilterInteractionStatus(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                            <option value="all">All Statuses</option>
                            {interactionStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end justify-between px-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Matching Results</span>
                            <span className="text-2xl font-black text-indigo-600">{filteredData.length}</span>
                        </div>
                        {(filterForm !== "all" || filterAuthor !== "all" || filterInteractionStatus !== "all" || search) && (
                            <button
                                onClick={() => { setFilterForm("all"); setFilterAuthor("all"); setFilterInteractionStatus("all"); setSearch(""); }}
                                className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Metric Cards & Tabs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { id: "today", label: "Today", icon: CalendarDays, count: stats.today, color: "indigo" },
                        { id: "overdue", label: "Overdue", icon: AlertCircle, count: stats.overdue, color: "rose" },
                        { id: "upcoming", label: "Upcoming", icon: Bell, count: stats.upcoming, color: "amber" },
                        { id: "closed", label: "Closed", icon: CheckCircle2, count: stats.closed, color: "emerald" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`p-6 rounded-[32px] border-2 transition-all flex flex-col gap-3 text-left relative overflow-hidden group ${activeTab === tab.id
                                ? `bg-white border-${tab.color}-500 shadow-xl shadow-${tab.color}-500/10`
                                : `bg-white border-transparent hover:border-slate-200 shadow-sm`
                                }`}
                        >
                            <div className={`p-3 rounded-2xl w-fit ${activeTab === tab.id ? `bg-${tab.color}-500 text-white` : `bg-slate-100 text-slate-400 group-hover:bg-${tab.color}-50 group-hover:text-${tab.color}-500`
                                }`}>
                                <tab.icon size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{tab.label}</p>
                                <p className={`text-3xl font-black ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-600'}`}>
                                    {tab.count}
                                </p>
                            </div>
                            {activeTab === tab.id && (
                                <motion.div layoutId="tab-glow" className={`absolute bottom-0 left-0 right-0 h-1 bg-${tab.color}-500`} />
                            )}
                        </button>
                    ))}
                </div>

                {/* Main Table Content */}
                <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Scanning Grid...</p>
                        </div>
                    ) : (filteredData.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-center opacity-50">
                            <Inbox size={64} className="text-slate-200 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700">Protocol Clear</h3>
                            <p className="text-sm text-slate-400 max-w-xs mx-auto mt-2">No leads found in the {activeTab} sector. Everything is current.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr className="border-b border-slate-100">
                                        <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Target Lead</th>
                                        <th className="py-6 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Origin Form</th>
                                        <th className="py-6 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Interaction History</th>
                                        <th className="py-6 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Schedule</th>
                                        <th className="py-6 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredData.map((res) => {
                                        const latest = res.remarks[0];
                                        const name = getFieldValue(res, "name");
                                        const phone = getFieldValue(res, "phone");
                                        const isOverdue = activeTab === "overdue";

                                        return (
                                            <tr key={res.id} className={`group hover:bg-slate-50 transition-all ${isOverdue ? 'bg-rose-50/20 shadow-[inset_4px_0_0_#e11d48]' : ''}`}>
                                                <td className="py-6 px-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all ${isOverdue ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white'
                                                            }`}>
                                                            {name[0]?.toUpperCase() || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{name}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Phone size={10} className="text-slate-400" />
                                                                <span className="text-[11px] font-bold text-slate-500">{phone}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-6">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                        <FileText size={12} /> {res.form.title}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-6 max-w-xs">
                                                    <p className="text-sm text-slate-700 font-medium line-clamp-2 italic">"{latest.remark}"</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">By {latest.authorName} • {format(new Date(latest.createdAt), "MMM d")}</p>
                                                </td>
                                                <td className="py-6 px-6">
                                                    {latest.nextFollowUpDate ? (
                                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border w-fit ${isOverdue ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                                                            }`}>
                                                            <Calendar size={14} />
                                                            <span className="text-xs font-black uppercase tracking-widest">
                                                                {format(new Date(latest.nextFollowUpDate), "MMM dd, yyyy")}
                                                            </span>
                                                        </div>
                                                    ) : <span className="text-slate-300">-</span>}
                                                </td>
                                                <td className="py-6 px-6">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${latest.followUpStatus === 'Closed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        latest.followUpStatus === 'Missed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                            'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                        }`}>
                                                        {latest.followUpStatus || 'Scheduled'}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-8 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setOpenModal({ formId: res.formId, responseId: res.id })}
                                                            className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all"
                                                            title="Update Follow-up"
                                                        >
                                                            <ArrowRight size={18} />
                                                        </button>
                                                        <a
                                                            href={`/crm/forms/${res.formId}/responses`}
                                                            target="_blank"
                                                            className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-all"
                                                            title="View in Matrix"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </a>
                                                        <button
                                                            onClick={() => handleRemoveFollowUp(res.id)}
                                                            className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all border border-rose-100"
                                                            title="Exclude from Board"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal Integration */}
            {openModal && (
                <FormRemarkModal
                    formId={openModal.formId}
                    responseId={openModal.responseId}
                    userRole={userRole}
                    onClose={() => setOpenModal(null)}
                    onSave={() => {
                        fetchData();
                    }}
                />
            )}

            {/* Hidden Tailwind Colors used in dynamic classes */}
            <div className="hidden border-indigo-500 border-rose-500 border-amber-500 border-emerald-500 bg-indigo-500 bg-rose-500 bg-amber-500 bg-emerald-500 text-indigo-500 text-rose-500 text-amber-500 text-emerald-500 group-hover:bg-indigo-50 group-hover:bg-rose-50 group-hover:bg-amber-50 group-hover:bg-emerald-50 group-hover:text-indigo-500 group-hover:text-rose-500 group-hover:text-amber-500 group-hover:text-emerald-500 shadow-indigo-500/10 shadow-rose-500/10 shadow-amber-500/10 shadow-emerald-500/10"></div>
        </div>
    );
}
