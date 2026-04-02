
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Bell, CheckCircle2, AlertTriangle, Clock,
    Filter, Search, Trash2, CheckCircle,
    Calendar, Inbox, ExternalLink, ArrowRight,
    MessageSquare, CheckSquare, CreditCard, User, IndianRupee, Sparkles, Stars
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isPast, isFuture } from "date-fns";
import toast from "react-hot-toast";

interface Notification {
    id: string;
    type: string;
    title: string;
    content: string;
    responseId?: string;
    formId?: string;
    taskId?: string;
    isRead: boolean;
    isSystem: boolean;
    scheduledAt: string;
    createdAt: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "unread" | "scheduled" | "team" | "payments" | "crm">("all");
    const [search, setSearch] = useState("");

    const fetchNotifications = async () => {
        try {
            // Add cache busting timestamp to ensure we get fresh data
            const res = await fetch(`/api/notifications?all=true&_=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                console.log(`HUB DEBUG: Found ${data.notifications?.length || 0} alerts`);
                // Ensure we have a valid array
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            toast.error("Failed to sync alerts.");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchNotifications();

        // Auto-refresh hub data on production to stay in-sync with Bell
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markRead = async (id: string) => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                body: JSON.stringify({ id }),
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (e) { }
    };

    const markAllRead = async () => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                body: JSON.stringify({ all: true }),
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success("Inbox cleared!");
        } catch (e) { }
    };

    const filtered = useMemo(() => {
        if (!notifications) return [];
        let list = [...notifications];

        // Filter by Tab
        if (filter === "unread") {
            list = list.filter(n => !n.isRead);
        } else if (filter === "scheduled") {
            list = list.filter(n => isFuture(new Date(n.scheduledAt || n.createdAt)));
        } else if (filter === "payments") {
            list = list.filter(n => ["PAYMENT_ADDED", "COLLECTION_REMINDER", "COLLECTION_FOLLOWUP"].includes(n.type));
        } else if (filter === "team") {
            list = list.filter(n => ["MENTION", "TASK_COMPLETED", "SUBTASK_TOGGLED"].includes(n.type));
        } else if (filter === "crm") {
            list = list.filter(n => n.type === "CRM_FOLLOWUP");
        }
        // If filter is 'all', we don't apply any type/read filter

        // Filter by Search
        if (search) {
            list = list.filter(n =>
                (n.title?.toLowerCase() || "").includes(search.toLowerCase()) ||
                (n.content?.toLowerCase() || "").includes(search.toLowerCase())
            );
        }

        return list;
    }, [notifications, filter, search]);

    const stats = useMemo(() => ({
        unread: notifications.filter(n => !n.isRead).length,
        scheduled: notifications.filter(n => isFuture(new Date(n.scheduledAt || n.createdAt))).length,
        team: notifications.filter(n => ["MENTION", "TASK_COMPLETED", "SUBTASK_TOGGLED"].includes(n.type)).length,
        payments: notifications.filter(n => ["PAYMENT_ADDED", "COLLECTION_REMINDER", "COLLECTION_FOLLOWUP"].includes(n.type)).length,
        crm: notifications.filter(n => n.type === "CRM_FOLLOWUP").length
    }), [notifications]);

    const getIcon = (type: string, title: string) => {
        const baseClass = "w-6 h-6";
        switch (type) {
            case "MENTION": return { icon: <MessageSquare className={baseClass} />, color: "bg-blue-500", shadow: "shadow-blue-200" };
            case "TASK_COMPLETED": return { icon: <CheckSquare className={baseClass} />, color: "bg-emerald-500", shadow: "shadow-emerald-200" };
            case "PAYMENT_ADDED": return { icon: <CreditCard className={baseClass} />, color: "bg-amber-500", shadow: "shadow-amber-200" };
            case "COLLECTION_REMINDER":
            case "COLLECTION_FOLLOWUP": return { icon: <IndianRupee className={baseClass} />, color: "bg-rose-500", shadow: "shadow-rose-200" };
            case "CRM_FOLLOWUP":
                if (title?.includes("CRITICAL")) return { icon: <AlertTriangle className={baseClass} />, color: "bg-rose-600", shadow: "shadow-rose-200" };
                return { icon: <ArrowRight className={baseClass} />, color: "bg-indigo-600", shadow: "shadow-indigo-200" };
            default: return { icon: <Bell className={baseClass} />, color: "bg-slate-500", shadow: "shadow-slate-200" };
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header Area */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-1 w-6 bg-indigo-600 rounded-full" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Sync Intelligence</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                Notification <span className="text-indigo-600">Hub</span>
                                {stats.unread > 0 && (
                                    <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                                        {stats.unread} NEW
                                    </span>
                                )}
                            </h1>
                            <p className="text-slate-500 mt-1 text-sm font-bold italic">Central command for automated crm alerts and reminders.</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={markAllRead}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Mark All Read
                            </button>
                        </div>
                    </div>

                    {/* Navigation Pills */}
                    <div className="flex flex-wrap items-center mt-10 gap-2">
                        {[
                            { id: "all", label: "History", icon: Bell },
                            { id: "unread", label: "Unread", icon: Clock, count: stats.unread },
                            { id: "scheduled", label: "Upcoming", icon: Calendar, count: stats.scheduled },
                            { id: "team", label: "Team & Tasks", icon: CheckSquare, count: stats.team },
                            { id: "payments", label: "Payments", icon: CreditCard, count: stats.payments },
                            { id: "crm", label: "CRM & Leads", icon: User, count: stats.crm },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setFilter(tab.id as any)}
                                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border-2 ${filter === tab.id
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200"
                                    : "bg-white text-slate-400 border-white hover:border-slate-100 hover:bg-slate-50"
                                    }`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${filter === tab.id ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}

                        <div className="flex-1 min-w-[200px] ml-auto">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search logs..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-[11px] font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none shadow-inner"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-5xl mx-auto px-6 mt-10">

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center opacity-50">
                        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Scanning Archive...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-32 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                        <Inbox size={64} className="mx-auto text-slate-100 mb-6" />
                        <h3 className="text-xl font-black text-slate-900">Archive Neutral</h3>
                        <p className="text-sm text-slate-400 mt-2 font-medium italic">No alerts found in this sector.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {filtered.map((notif, idx) => {
                                const isFutureNotif = isFuture(new Date(notif.scheduledAt || notif.createdAt));
                                const config = getIcon(notif.type, notif.title || "");

                                return (
                                    <motion.div
                                        key={notif.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => markRead(notif.id)}
                                        className={`p-6 rounded-[32px] border-2 transition-all cursor-pointer relative group ${notif.isRead
                                            ? "bg-white/50 border-white text-slate-400 grayscale-[0.5]"
                                            : isFutureNotif
                                                ? "bg-amber-50/30 border-amber-100 shadow-[inset_4px_0_0_#f59e0b]"
                                                : "bg-white border-white hover:border-indigo-100 shadow-sm hover:shadow-xl hover:-translate-y-1"
                                            }`}
                                    >
                                        <div className="flex gap-6 items-start">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 shrink-0 ${notif.isRead ? "bg-slate-100 text-slate-400 shadow-none" : `${config.color} text-white ${config.shadow}`
                                                }`}>
                                                {config.icon}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className={`text-sm font-black tracking-tight ${notif.isRead ? "text-slate-500" : "text-slate-900"}`}>
                                                            {notif.title || "Notification"}
                                                        </h4>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${notif.isSystem ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400"
                                                                }`}>
                                                                {notif.isSystem ? "Automation Engine" : "Direct Message"}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400 capitalize">
                                                                {format(new Date(notif.createdAt), "MMM dd, HH:mm")}
                                                            </span>
                                                            {notif.type.includes("PAYMENT") && (
                                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">
                                                                    Priority Alert
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isFutureNotif && !notif.isRead && (
                                                        <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full flex items-center gap-2">
                                                            <Clock size={12} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">PENDING</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className={`text-sm leading-relaxed font-medium ${notif.isRead ? "text-slate-400 italic" : "text-slate-600"}`}>
                                                    {notif.content}
                                                </p>

                                                {!notif.isRead && (
                                                    <div className="mt-4 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {notif.responseId && (
                                                            <a
                                                                href={notif.formId ? `/crm/forms/${notif.formId}/responses` : "#"}
                                                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                                                            >
                                                                Open CRM Lead <ExternalLink size={12} />
                                                            </a>
                                                        )}
                                                        {notif.taskId && (
                                                            <a
                                                                href="/team-board"
                                                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-all"
                                                            >
                                                                Open Team Task <ExternalLink size={12} />
                                                            </a>
                                                        )}
                                                        <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 px-3 py-1.5 hover:bg-slate-50 rounded-lg transition-all ml-auto">
                                                            Archive
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {!notif.isRead && !isFutureNotif && (
                                            <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
