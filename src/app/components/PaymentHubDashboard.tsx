"use client";

import React, { useState, useEffect } from "react";
import { X, TrendingUp, Users, IndianRupee, Calendar, Clock, CheckCircle2, BarChart2, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface HubData {
    payments: any[];
    summary: { totalAmount: number; totalReceived: number; totalPending: number; count: number };
    byDay: Record<string, { amount: number; received: number; count: number }>;
    range: string;
    startDate: string;
    endDate: string;
}

interface Props {
    formId: string;
    onClose: () => void;
}

const RANGES = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "custom", label: "Custom Date" }
];

export default function PaymentHubDashboard({ formId, onClose }: Props) {
    const [range, setRange] = useState("today");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [data, setData] = useState<HubData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState("All");

    const fetchHub = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ range });
            if (range === "custom") {
                if (from) params.set("from", from);
                if (to) params.set("to", to);
            }
            const res = await fetch(`/api/crm/forms/${formId}/payments/hub?${params}&_t=${Date.now()}`);
            if (res.ok) {
                setData(await res.json());
            } else {
                toast.error("Failed to load payment data");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (range !== "custom") fetchHub();
    }, [range]);

    const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

    /* computed inline */


    const uniqueUsers = data ? Array.from(new Set(data.payments.map(p => p.response?.submittedByName || "Unknown"))).sort() : [];
    const filteredPayments = data?.payments.filter(p => selectedUser === "All" || (p.response?.submittedByName || "Unknown") === selectedUser) || [];

    const computedSummary = {
        totalAmount: filteredPayments.reduce((s, p) => s + p.amount, 0),
        totalReceived: filteredPayments.reduce((s, p) => s + p.received, 0),
        totalPending: filteredPayments.reduce((s, p) => s + (p.amount - p.received), 0),
        count: filteredPayments.length
    };

    const computedByDay: Record<string, { amount: number; received: number; count: number }> = {};
    filteredPayments.forEach(p => {
        const day = new Date(p.paymentDate).toISOString().split("T")[0];
        if (!computedByDay[day]) computedByDay[day] = { amount: 0, received: 0, count: 0 };
        computedByDay[day].amount += p.amount;
        computedByDay[day].received += p.received;
        computedByDay[day].count++;
    });

    const maxAmount = Math.max(...Object.values(computedByDay).map(d => d.amount), 1);

    return (
        <div 
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[10001] p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-5 pl-6 shrink-0 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2">
                            <BarChart2 size={22} /> Payment Hub
                        </h2>
                        <p className="text-violet-200 text-[11px] mt-1 font-bold uppercase tracking-widest">
                            Sales Analytics · Amount · Received · Pending
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Range Tabs */}
                <div className="px-5 pt-4 pb-0 flex gap-2 flex-wrap shrink-0">
                    {RANGES.map(r => (
                        <button
                            key={r.key}
                            onClick={() => setRange(r.key)}
                            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${range === r.key
                                ? "bg-violet-600 text-white shadow-md"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>


                {/* User Filter */}
                <div className="px-5 pt-3 pb-0 shrink-0">
                    <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 relative hover:bg-slate-200 transition-colors">
                        <Users size={14} className="text-slate-500 absolute left-3 pointer-events-none" />
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none pl-8 pr-8 py-1.5 cursor-pointer appearance-none min-w-[150px]"
                        >
                            <option value="All">All Team Members</option>
                            {uniqueUsers.map(u => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="text-slate-500 absolute right-3 pointer-events-none" />
                    </div>
                </div>

                {/* Custom date picker */}
                {range === "custom" && (
                    <div className="px-5 pt-3 flex gap-3 shrink-0">
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">From</label>
                            <input
                                type="date"
                                value={from}
                                onChange={e => setFrom(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">To</label>
                            <input
                                type="date"
                                value={to}
                                onChange={e => setTo(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={fetchHub}
                                className="px-4 py-2.5 bg-violet-600 text-white text-[11px] font-black rounded-xl hover:bg-violet-700 transition-all uppercase tracking-widest"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-5 space-y-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading analytics...</p>
                        </div>
                    ) : !data ? null : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-100 mb-2">Total Amount</p>
                                    <p className="text-2xl font-black">{fmt(computedSummary.totalAmount)}</p>
                                    <p className="text-[10px] text-blue-200 mt-1">{computedSummary.count} entries</p>
                                </div>
                                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100 mb-2">Received</p>
                                    <p className="text-2xl font-black">{fmt(computedSummary.totalReceived)}</p>
                                    <p className="text-[10px] text-emerald-200 mt-1">
                                        {computedSummary.totalAmount > 0
                                            ? `${Math.round((computedSummary.totalReceived / computedSummary.totalAmount) * 100)}% collected`
                                            : "—"}
                                    </p>
                                </div>
                                <div className={`rounded-2xl p-4 text-white shadow-lg ${computedSummary.totalPending > 0
                                    ? "bg-gradient-to-br from-rose-500 to-rose-600"
                                    : "bg-gradient-to-br from-slate-400 to-slate-500"}`}>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-100 mb-2">Pending</p>
                                    <p className="text-2xl font-black">{fmt(computedSummary.totalPending)}</p>
                                    <p className="text-[10px] text-rose-100 mt-1">
                                        {computedSummary.totalPending > 0 ? "Outstanding balance" : "Fully cleared ✅"}
                                    </p>
                                </div>
                            </div>

                            {/* Bar Chart */}
                            {Object.keys(computedByDay).length > 0 && (
                                <div className="bg-slate-50 rounded-2xl p-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Day-wise Breakdown</p>
                                    <div className="space-y-3">
                                        {Object.entries(computedByDay)
                                            .sort(([a], [b]) => a.localeCompare(b))
                                            .map(([day, d]) => (
                                                <div key={day}>
                                                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                                        <span>{format(new Date(day), "EEE, MMM d")}</span>
                                                        <span>{fmt(d.amount)} · {d.count} entries</span>
                                                    </div>
                                                    <div className="flex gap-1 h-4 rounded-full overflow-hidden bg-slate-200">
                                                        <div
                                                            className="bg-emerald-500 rounded-full transition-all"
                                                            style={{ width: `${(d.received / maxAmount) * 100}%` }}
                                                        />
                                                        <div
                                                            className="bg-rose-300 rounded-full transition-all"
                                                            style={{ width: `${((d.amount - d.received) / maxAmount) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                    <div className="flex gap-4 mt-3">
                                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500 rounded-full" /><span className="text-[10px] font-bold text-slate-500">Received</span></div>
                                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-rose-300 rounded-full" /><span className="text-[10px] font-bold text-slate-500">Pending</span></div>
                                    </div>
                                </div>
                            )}

                            {/* Payments List */}
                            {filteredPayments.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">All Entries</p>
                                    <div className="space-y-2">
                                        {filteredPayments.map((p: any) => {
                                            const pend = p.amount - p.received;
                                            return (
                                                <div key={p.id} className="bg-white border border-slate-100 rounded-2xl p-3 flex justify-between items-center hover:shadow-sm transition-shadow">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${pend > 0 ? "bg-rose-50" : "bg-emerald-50"}`}>
                                                            {pend > 0 ? <Clock size={14} className="text-rose-400" /> : <CheckCircle2 size={14} className="text-emerald-500" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-700">{p.response?.submittedByName || "—"}</p>
                                                            <p className="text-[10px] text-slate-400">
                                                                {format(new Date(p.paymentDate), "MMM d, yyyy")}
                                                                {p.note && ` · ${p.note}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3 text-right">
                                                        <div>
                                                            <p className="text-[9px] font-black text-blue-400 uppercase">Amount</p>
                                                            <p className="text-xs font-black text-slate-700">{fmt(p.amount)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-emerald-400 uppercase">Received</p>
                                                            <p className="text-xs font-black text-emerald-600">{fmt(p.received)}</p>
                                                        </div>
                                                        <div>
                                                            <p className={`text-[9px] font-black uppercase ${pend > 0 ? "text-rose-400" : "text-slate-400"}`}>Pending</p>
                                                            <p className={`text-xs font-black ${pend > 0 ? "text-rose-600" : "text-slate-400"}`}>{fmt(pend)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {filteredPayments.length === 0 && (
                                <div className="text-center py-10 bg-slate-50 rounded-2xl">
                                    <IndianRupee className="mx-auto text-slate-200 mb-3" size={36} />
                                    <p className="text-sm font-bold text-slate-400">No payments in this period</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
