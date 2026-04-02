"use client";

import React, { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import {
    FaHistory,
    FaExchangeAlt,
    FaStickyNote,
    FaCheckCircle,
    FaCreditCard,
    FaEdit
} from "react-icons/fa";

interface Activity {
    id: string;
    type: string;
    content: string;
    author: string;
    createdAt: string;
}

export default function TaskActivityFeed({ taskId }: { taskId: string }) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchActivities = async () => {
        try {
            const res = await fetch(`/api/tasks/${taskId}/activities`);
            if (res.ok) {
                const data = await res.json();
                setActivities(data.activities || []);
            }
        } catch (error) {
            console.error("Failed to fetch activities:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
        // Poll for updates every 10 seconds for "pseudo-realtime" 
        // until we implement Pusher
        const interval = setInterval(fetchActivities, 10000);
        return () => clearInterval(interval);
    }, [taskId]);

    const getIcon = (type: string) => {
        switch (type) {
            case "STATUS_CHANGE": return <FaExchangeAlt className="text-blue-500" />;
            case "NOTE_ADDED": return <FaStickyNote className="text-yellow-500" />;
            case "SUBTASK_TOGGLED": return <FaCheckCircle className="text-green-500" />;
            case "PAYMENT_ADDED": return <FaCreditCard className="text-purple-500" />;
            case "TASK_CREATED": return <FaEdit className="text-orange-500" />;
            default: return <FaEdit className="text-gray-500" />;
        }
    };

    if (loading) return <div className="p-4 text-center text-sm text-gray-400">Loading activity...</div>;

    return (
        <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
                <FaHistory className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Activity Feed</h3>
            </div>

            <div className="relative space-y-4 before:absolute before:inset-0 before:ml-3 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {activities.length === 0 ? (
                    <p className="text-xs text-gray-400 italic ml-8">No recent activity</p>
                ) : (
                    activities.map((activity) => (
                        <div key={activity.id} className="relative flex items-start gap-4 ml-1">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-white ring-4 ring-white shadow-sm z-10 mt-1">
                                {getIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-gray-800">
                                    <span className="font-bold">{activity.author}</span> {activity.content}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1">
                                    {format(parseISO(activity.createdAt), "dd MMM, hh:mm a")}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
