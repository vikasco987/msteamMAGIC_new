"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCircle2, MessageSquare, CreditCard, CheckSquare, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface Notification {
    id: string;
    type: string;
    content: string;
    taskId: string | null;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationBell({ isCollapsed }: { isCollapsed: boolean }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markAsRead = async (id?: string) => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                body: JSON.stringify(id ? { id } : { all: true }),
            });
            fetchNotifications();
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (open && unreadCount > 0) {
            setUnreadCount(0); // clear the badge instantly (WhatsApp style)
            fetch("/api/notifications", {
                method: "PATCH",
                body: JSON.stringify({ all: true }),
            }).catch((err) => console.error("Auto mark read failed:", err));
            // We intentionally DO NOT fetchNotifications() here so that the currently
            // unread items remain visually highlighted for this viewing session!
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "MENTION": return <MessageSquare size={16} className="text-blue-400" />;
            case "TASK_COMPLETED": return <CheckSquare size={16} className="text-green-400" />;
            case "PAYMENT_ADDED": return <CreditCard size={16} className="text-yellow-400" />;
            case "COLLECTION_REMINDER":
            case "COLLECTION_REMINDER_MORNING":
            case "COLLECTION_REMINDER_EVENING":
            case "COLLECTION_FOLLOWUP": return <Bell size={16} className="text-red-400 animate-pulse" />;
            case "COLLECTION_IGNORE_WARNING": return <Bell size={16} className="text-orange-400" />;
            case "CRM_FOLLOWUP": return <Bell size={16} className="text-rose-500 animate-bounce" />;
            default: return <Bell size={16} />;
        }
    };

    return (
        <DropdownMenu.Root onOpenChange={handleOpenChange}>
            <DropdownMenu.Trigger asChild>
                <button
                    className="flex items-center gap-3 px-4 py-2 rounded-md transition-all font-medium text-gray-300 hover:text-purple-300 hover:bg-white/5 w-full text-left outline-none"
                    aria-label="View notifications"
                >
                    <div className="relative">
                        <Bell size={22} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#1e1b4b]">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </div>
                    {!isCollapsed && <span>Notifications</span>}
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    side="right"
                    align="start"
                    sideOffset={12}
                    className="z-[9999] w-80 bg-[#1e1b4b] border border-violet-800 rounded-xl shadow-2xl overflow-hidden text-white"
                >
                    <div className="p-3 border-b border-violet-800 flex justify-between items-center bg-white/5">
                        <h3 className="font-bold text-sm">Team Alerts</h3>
                        {/* Auto-read is active, so explicit 'Mark all read' button is removed for cleaner UI */}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto focus:outline-none">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                No new alerts
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <DropdownMenu.Item
                                    key={n.id}
                                    onSelect={(e) => {
                                        // Just standard menu dismiss behavior
                                    }}
                                    className={`p-3 border-b border-white/5 hover:bg-white/10 transition-colors cursor-pointer outline-none ${!n.isRead ? 'bg-purple-500/10 border-l-2 border-l-purple-500' : ''}`}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1">{getIcon(n.type)}</div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-200 leading-relaxed">
                                                {n.content}
                                            </p>
                                            <p className="text-[10px] text-gray-500 mt-1">
                                                {new Date(n.createdAt).toLocaleString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    day: 'numeric',
                                                    month: 'short'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </DropdownMenu.Item>
                            ))
                        )}
                    </div>
                    <div className="p-2 border-t border-violet-800 bg-white/5 text-center">
                        <a
                            href="/dashboard/notifications"
                            className="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                            View All Alerts <ArrowRight size={10} />
                        </a>
                    </div>
                    <DropdownMenu.Arrow className="fill-violet-800" />
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
