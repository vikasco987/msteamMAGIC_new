"use client";

import React, { useEffect, useState } from "react";
import { X, Clock, User, Activity as ActivityIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface Activity {
    id: string;
    type: string;
    content: string;
    author: string;
    createdAt: string;
}

interface Props {
    taskId: string;
    taskTitle: string;
    onClose: () => void;
}

export default function TaskActivityModal({ taskId, taskTitle, onClose }: Props) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const res = await fetch(`/api/tasks/${taskId}/activities`);
                if (res.ok) {
                    const data = await res.json();
                    setActivities(data.activities || []);
                }
            } catch (err) {
                console.error("Fetch activities error:", err);
                toast.error("Failed to load activity logs");
            } finally {
                setLoading(false);
            }
        };
        fetchActivities();
    }, [taskId]);

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <ActivityIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 leading-tight line-clamp-1">{taskTitle}</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Activity Stream</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-slate-50/30">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fetching logs...</p>
                        </div>
                    ) : activities.length > 0 ? (
                        <div className="space-y-6 relative">
                            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200/60" />
                            {activities.map((activity) => (
                                <div key={activity.id} className="relative pl-10">
                                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center shadow-sm z-10">
                                        <Clock size={12} className="text-slate-400" />
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">
                                                {activity.type.replace(/_/g, " ")}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                {format(new Date(activity.createdAt), "dd MMM, HH:mm")}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 leading-relaxed mb-3">
                                            {activity.content}
                                        </p>
                                        <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500">
                                                {activity.author.charAt(0)}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                {activity.author}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                            <div className="p-4 bg-slate-100 rounded-full text-slate-300">
                                <ActivityIcon size={32} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900">No Activity Logged</p>
                                <p className="text-xs font-bold text-slate-400 mt-1">Actions on this task will appear here.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 text-white font-black text-xs rounded-2xl shadow-lg hover:bg-black transition-all uppercase tracking-widest"
                    >
                        Close Logs
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
