"use client";

import React, { useState } from "react";
import { FaTimes, FaSave, FaCalendarAlt, FaPhoneAlt, FaComments } from "react-icons/fa";
import toast from "react-hot-toast";

interface Props {
    taskId: string;
    onClose: () => void;
    onSave?: () => void;
}

export default function PaymentRemarkModal({ taskId, onClose, onSave }: Props) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        remark: "",
        nextFollowUpDate: "",
        contactMethod: "call",
        contactOutcome: "negotiated",
        pendingReason: "",
        priorityLevel: "medium"
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.remark) return toast.error("Please enter a remark.");

        setLoading(true);
        try {
            const res = await fetch(`/api/tasks/${taskId}/payment-remarks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                toast.success("Remark added!");
                if (onSave) onSave();
                onClose();
            } else {
                toast.error("Failed to save remark.");
            }
        } catch (error) {
            toast.error("Error saving remark.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black">Collection Update</h3>
                        <p className="text-indigo-100 text-xs mt-1 font-medium">Record client feedback on pending payment.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <FaTimes size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">What did the client say?</label>
                        <textarea
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300 min-h-[100px]"
                            placeholder="e.g. 'Client promised to pay half by Monday and half by Friday'..."
                            value={form.remark}
                            onChange={(e) => setForm({ ...form, remark: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Collection Outcome</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={form.contactOutcome}
                                onChange={(e) => setForm({ ...form, contactOutcome: e.target.value })}
                            >
                                <option value="negotiated">Negotiated</option>
                                <option value="promised">Promised Date</option>
                                <option value="not_reachable">Not Reachable</option>
                                <option value="refused">Refused Payment</option>
                                <option value="dispute">Invoice Dispute</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Next Follow-up</label>
                            <input
                                type="date"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={form.nextFollowUpDate}
                                onChange={(e) => setForm({ ...form, nextFollowUpDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={loading}
                            type="submit"
                            className="flex-1 py-3 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? "Saving..." : <><FaSave /> Save Update</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
