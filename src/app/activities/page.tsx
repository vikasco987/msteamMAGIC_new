"use client";

import React, { useEffect, useState } from "react";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import {
    FaHistory,
    FaExchangeAlt,
    FaStickyNote,
    FaCheckCircle,
    FaCreditCard,
    FaEdit,
    FaRegClock,
    FaFilter,
    FaChevronLeft,
    FaChevronRight,
    FaChartLine
} from "react-icons/fa";
import Link from "next/link";
import { motion } from "framer-motion";

interface Activity {
    id: string;
    type: string;
    content: string;
    author: string;
    authorId: string;
    taskId: string;
    task?: {
        title: string;
    };
    createdAt: string;
}

interface ActivityStats {
    todayCount: number;
    typeDistribution: { [key: string]: number };
}

export default function ActivityLogPage() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [stats, setStats] = useState<ActivityStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchActivities = async (p = page) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/activities?page=${p}&limit=50`);
            if (res.ok) {
                const data = await res.json();
                setActivities(data.activities || []);
                setStats(data.stats || null);
                setTotalPages(data.totalPages || 1);
            }
        } catch (error) {
            console.error("Failed to fetch activities:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [page]);

    const getIcon = (type: string) => {
        switch (type) {
            case "STATUS_CHANGE": return <div className="p-2 bg-blue-100 rounded-lg"><FaExchangeAlt className="text-blue-600" /></div>;
            case "NOTE_ADDED": return <div className="p-2 bg-yellow-100 rounded-lg"><FaStickyNote className="text-yellow-600" /></div>;
            case "SUBTASK_TOGGLED": return <div className="p-2 bg-green-100 rounded-lg"><FaCheckCircle className="text-green-600" /></div>;
            case "PAYMENT_ADDED": return <div className="p-2 bg-purple-100 rounded-lg"><FaCreditCard className="text-purple-600" /></div>;
            default: return <div className="p-2 bg-gray-100 rounded-lg"><FaEdit className="text-gray-600" /></div>;
        }
    };

    const groupActivitiesByDate = (acts: Activity[]) => {
        const groups: { [key: string]: Activity[] } = {};
        acts.forEach(act => {
            const date = format(parseISO(act.createdAt), "yyyy-MM-dd");
            if (!groups[date]) groups[date] = [];
            groups[date].push(act);
        });
        return groups;
    };

    const getDateLabel = (dateStr: string) => {
        const date = parseISO(dateStr);
        if (isToday(date)) return "Today";
        if (isYesterday(date)) return "Yesterday";
        return format(date, "MMMM dd, yyyy");
    };

    const groupedActivities = groupActivitiesByDate(activities);
    const sortedDates = Object.keys(groupedActivities).sort((a, b) => b.localeCompare(a));

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                            <FaHistory className="text-purple-600" />
                            Deep Activity Analysis
                        </h1>
                        <p className="text-slate-500 mt-2">Comprehensive breakdown of team interactions and task progression.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/activities/report"
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                        >
                            <FaChartLine />
                            View Lifecycle Report
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-200 p-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 hover:bg-slate-50 rounded-lg disabled:opacity-30 transition-colors"
                            >
                                <FaChevronLeft size={14} />
                            </button>
                            <span className="px-4 text-sm font-semibold text-slate-600">Page {page} of {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 hover:bg-slate-50 rounded-lg disabled:opacity-30 transition-colors"
                            >
                                <FaChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Analytical Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-purple-200"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-white/20 rounded-xl"><FaRegClock size={20} /></div>
                            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Activity Today</span>
                        </div>
                        <div className="text-4xl font-black mb-1">{stats?.todayCount || 0}</div>
                        <p className="text-xs opacity-70">New updates logged today</p>
                    </motion.div>

                    <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                Status Changes
                            </div>
                            <div className="text-2xl font-black text-slate-800">{stats?.typeDistribution["STATUS_CHANGE"] || 0}</div>
                        </div>
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                Support Notes
                            </div>
                            <div className="text-2xl font-black text-slate-800">{stats?.typeDistribution["NOTE_ADDED"] || 0}</div>
                        </div>
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-purple-500" />
                                Payments
                            </div>
                            <div className="text-2xl font-black text-slate-800">{stats?.typeDistribution["PAYMENT_ADDED"] || 0}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Activity Timeline */}
                    <div className="lg:col-span-8 space-y-12">
                        {loading && activities.length === 0 ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-2xl" />
                                ))}
                            </div>
                        ) : (
                            sortedDates.map((date) => (
                                <section key={date}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{getDateLabel(date)}</h2>
                                        <div className="h-px flex-1 bg-slate-200" />
                                    </div>

                                    <div className="space-y-4">
                                        {groupedActivities[date].map((activity, idx) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={activity.id}
                                                className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:border-purple-100 transition-all flex items-start gap-4 group"
                                            >
                                                <div className="shrink-0">
                                                    {getIcon(activity.type)}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                                        <span className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                                                            {activity.author}
                                                        </span>
                                                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                                                            <FaRegClock size={10} />
                                                            {format(parseISO(activity.createdAt), "hh:mm a")}
                                                        </span>
                                                    </div>

                                                    <p className="text-sm text-slate-600 leading-relaxed">
                                                        {activity.content}
                                                    </p>

                                                    {activity.task && (
                                                        <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                                                {activity.task.title}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </section>
                            ))
                        )}

                        {activities.length === 0 && !loading && (
                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaHistory className="text-slate-300 text-2xl" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">No activities found</h3>
                                <p className="text-slate-500 text-sm mt-1">Activities will appear here as they happen.</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Analysis Information */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 sticky top-8 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <FaFilter className="text-purple-500" />
                                Understanding Logs
                            </h3>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-1 h-8 bg-blue-500 rounded-full" />
                                    <div>
                                        <div className="text-xs font-bold text-slate-700 uppercase tracking-tighter">Velocity</div>
                                        <p className="text-[11px] text-slate-500">Frequency of status changes indicates project movement.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-1 h-8 bg-yellow-500 rounded-full" />
                                    <div>
                                        <div className="text-xs font-bold text-slate-700 uppercase tracking-tighter">Engagement</div>
                                        <p className="text-[11px] text-slate-500">Notes indicate team collaboration and problem solving.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-1 h-8 bg-purple-500 rounded-full" />
                                    <div>
                                        <div className="text-xs font-bold text-slate-700 uppercase tracking-tighter">Liquidity</div>
                                        <p className="text-[11px] text-slate-500">Payment logs track the financial health of your operations.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <div className="p-4 bg-purple-50 rounded-2xl">
                                    <p className="text-[11px] text-purple-700 leading-relaxed italic">
                                        "A high ratio of notes to status changes usually suggests a complex task needing more communication."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
}
