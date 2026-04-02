"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { X, Plus, Trash2, IndianRupee, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

interface FormPayment {
    id: string;
    amount: number;
    received: number;
    note?: string;
    paymentDate: string;
    createdByName?: string;
    createdAt: string;
}

interface Props {
    formId: string;
    responseId: string;
    userRole: string;
    onClose: () => void;
    onSave?: () => void;
}

export default function PaymentHubModal({ formId, responseId, userRole, onClose, onSave }: Props) {
    const [payments, setPayments] = useState<FormPayment[]>([]);
    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [form, setForm] = useState({
        amount: "",
        received: "",
        note: "",
        paymentDate: new Date().toISOString().split("T")[0]
    });

    const canDelete = userRole === "MASTER" || userRole === "ADMIN" || userRole === "PURE_MASTER" || userRole === "TL";

    const fetchPayments = async () => {
        setFetching(true);
        try {
            const res = await fetch(`/api/crm/forms/${formId}/responses/${responseId}/payments?_t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setPayments(data.payments || []);
            }
        } catch {
            toast.error("Failed to load payments");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { fetchPayments(); }, [formId, responseId]);

    const totals = payments.reduce(
        (acc, p) => ({
            amount: acc.amount + p.amount,
            received: acc.received + p.received,
            pending: acc.pending + (p.amount - p.received)
        }),
        { amount: 0, received: 0, pending: 0 }
    );

    const pending = Number(form.amount || 0) - Number(form.received || 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.amount || isNaN(Number(form.amount))) {
            return toast.error("Please enter a valid amount");
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/crm/forms/${formId}/responses/${responseId}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: Number(form.amount),
                    received: Number(form.received || 0),
                    note: form.note,
                    paymentDate: form.paymentDate
                })
            });

            if (res.ok) {
                toast.success("Payment entry added!");
                setForm({ amount: "", received: "", note: "", paymentDate: new Date().toISOString().split("T")[0] });
                setIsAdding(false);
                fetchPayments();
                if (onSave) onSave();
            } else {
                toast.error("Failed to save payment");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (paymentId: string) => {
        if (!confirm("Delete this payment entry?")) return;
        try {
            const res = await fetch(
                `/api/crm/forms/${formId}/responses/${responseId}/payments?paymentId=${paymentId}`,
                { method: "DELETE" }
            );
            if (res.ok) {
                toast.success("Payment deleted");
                fetchPayments();
                if (onSave) onSave();
            }
        } catch {
            toast.error("Error deleting payment");
        }
    };

    const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

    return (
        <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 pl-6 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-black flex items-center gap-2">
                            <IndianRupee size={18} /> Payment Hub
                        </h3>
                        <p className="text-emerald-100 text-[11px] mt-1 font-bold uppercase tracking-widest">
                            Amount · Received · Pending
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3 px-5 pt-4 pb-2 shrink-0">
                    <div className="bg-blue-50 rounded-2xl p-3 text-center">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Amount</p>
                        <p className="text-base font-black text-blue-700">{fmt(totals.amount)}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-3 text-center">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Received</p>
                        <p className="text-base font-black text-emerald-700">{fmt(totals.received)}</p>
                    </div>
                    <div className={`rounded-2xl p-3 text-center ${totals.pending > 0 ? "bg-rose-50" : "bg-slate-50"}`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${totals.pending > 0 ? "text-rose-400" : "text-slate-400"}`}>Pending</p>
                        <p className={`text-base font-black ${totals.pending > 0 ? "text-rose-700" : "text-slate-500"}`}>{fmt(totals.pending)}</p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50 space-y-3">
                    {fetching ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                        </div>
                    ) : (
                        <>
                            {/* Add Form */}
                            {!isAdding ? (
                                <button
                                    onClick={() => {
                                        setForm({
                                            amount: payments.length > 0 ? "0" : "",
                                            received: payments.length > 0 && totals.pending > 0 ? totals.pending.toString() : "",
                                            note: "",
                                            paymentDate: new Date().toISOString().split("T")[0]
                                        });
                                        setIsAdding(true);
                                    }}
                                    className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-emerald-300 text-slate-400 hover:text-emerald-600 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-white"
                                >
                                    <Plus size={14} /> Add Payment Entry
                                </button>
                            ) : (
                                <form onSubmit={handleSubmit} className="bg-white border border-emerald-100 shadow-sm rounded-2xl p-4 space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Payment Entry</p>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                                                {payments.length === 0 ? "Total Bill Amount (₹) *" : "Additional Bill Amount (₹)"}
                                            </label>
                                            <input
                                                autoFocus
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0"
                                                value={form.amount}
                                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Received (₹)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0"
                                                value={form.received}
                                                onChange={(e) => setForm({ ...form, received: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700"
                                            />
                                        </div>
                                    </div>

                                    {/* Pending preview */}
                                    {form.amount && (
                                        <div className={`text-xs font-bold rounded-xl px-3 py-2 ${pending > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                                            {pending > 0 ? "⏳" : "✅"} Pending: {fmt(pending)}
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Payment Date</label>
                                        <input
                                            type="date"
                                            value={form.paymentDate}
                                            onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Note (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Cash payment, UPI, Cheque..."
                                            value={form.note}
                                            onChange={(e) => setForm({ ...form, note: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700"
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                        <button type="button" onClick={() => setIsAdding(false)}
                                            className="flex-1 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
                                            Cancel
                                        </button>
                                        <button disabled={loading} type="submit"
                                            className="flex-[2] py-2.5 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 shadow-md transition-all flex items-center justify-center gap-2">
                                            {loading ? "Saving..." : <><IndianRupee size={12} /> Save Payment</>}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Payments list */}
                            {payments.length === 0 && !isAdding ? (
                                <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 border-dashed">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <IndianRupee className="text-emerald-300" size={22} />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-700">No Payments Yet</h4>
                                    <p className="text-xs text-slate-500 mt-1 mb-4">Add the first payment entry for this response.</p>
                                    <button onClick={() => {
                                        setForm({ amount: "", received: "", note: "", paymentDate: new Date().toISOString().split("T")[0] });
                                        setIsAdding(true);
                                    }}
                                        className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2">
                                        <Plus size={12} /> Add First Payment
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {payments.map(p => {
                                        const pend = p.amount - p.received;
                                        return (
                                            <div key={p.id} className="bg-white border border-slate-100 rounded-2xl p-4 relative group hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-3 items-center">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${pend > 0 ? "bg-rose-50" : "bg-emerald-50"}`}>
                                                            {pend > 0 ? <Clock size={16} className="text-rose-500" /> : <CheckCircle2 size={16} className="text-emerald-500" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-700">{fmt(p.amount)}</p>
                                                            <p className="text-[10px] text-slate-400">
                                                                {format(new Date(p.paymentDate), "MMM d, yyyy")}
                                                                {p.createdByName && ` · ${p.createdByName}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {canDelete && (
                                                        <button onClick={() => handleDelete(p.id)}
                                                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="mt-3 grid grid-cols-3 gap-2">
                                                    <div className="bg-blue-50 rounded-xl px-2 py-1.5 text-center">
                                                        <p className="text-[9px] font-black text-blue-400 uppercase">Amount</p>
                                                        <p className="text-xs font-black text-blue-700">{fmt(p.amount)}</p>
                                                    </div>
                                                    <div className="bg-emerald-50 rounded-xl px-2 py-1.5 text-center">
                                                        <p className="text-[9px] font-black text-emerald-400 uppercase">Received</p>
                                                        <p className="text-xs font-black text-emerald-700">{fmt(p.received)}</p>
                                                    </div>
                                                    <div className={`rounded-xl px-2 py-1.5 text-center ${pend > 0 ? "bg-rose-50" : "bg-slate-50"}`}>
                                                        <p className={`text-[9px] font-black uppercase ${pend > 0 ? "text-rose-400" : "text-slate-400"}`}>Pending</p>
                                                        <p className={`text-xs font-black ${pend > 0 ? "text-rose-700" : "text-slate-500"}`}>{fmt(pend)}</p>
                                                    </div>
                                                </div>

                                                {p.note && (
                                                    <p className="mt-2 text-[11px] text-slate-500 italic bg-slate-50 rounded-lg px-2 py-1">
                                                        {p.note}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
