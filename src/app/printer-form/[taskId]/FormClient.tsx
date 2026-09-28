"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function FormClient({ taskId, printers, assignees }: { 
  taskId: string;
  printers: { id: string; number: string; name: string }[];
  assignees: { id: string; name: string }[];
}) {
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [takenBy, setTakenBy] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrinter || !takenBy) {
      toast.error("Please fill required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/printer-form/${taskId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serialNumberId: selectedPrinter, takenBy, remarks })
      });

      if (res.ok) {
        toast.success("Form submitted successfully!");
        setSubmitted(true);
      } else {
        const data = await res.json();
        toast.error(data.error || "Submission failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8 animate-fade-in-up">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          ✓
        </div>
        <h2 className="text-xl font-bold text-slate-800">Printer Handover Confirmed!</h2>
        <p className="text-slate-500 mt-2">The record has been saved successfully.</p>
        <button 
          onClick={() => window.close()}
          className="mt-6 px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded hover:bg-slate-200"
        >
          Close Window
        </button>
      </div>
    );
  }

  if (printers.length === 0) {
    return (
      <div className="text-center py-8 text-rose-500 font-medium">
        No printers are currently assigned to this task.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Printer <span className="text-rose-500">*</span></label>
        <select 
          required
          value={selectedPrinter}
          onChange={(e) => setSelectedPrinter(e.target.value)}
          className="w-full p-3 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
        >
          <option value="">-- Choose Printer --</option>
          {printers.map(p => (
            <option key={p.id} value={p.id}>{p.name} (S/N: {p.number})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Who took this printer? <span className="text-rose-500">*</span></label>
        <select 
          required
          value={takenBy}
          onChange={(e) => setTakenBy(e.target.value)}
          className="w-full p-3 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
        >
          <option value="">-- Choose Person --</option>
          {assignees.map(a => (
            <option key={a.id} value={a.name}>{a.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date & Time</label>
        <div className="w-full p-3 border border-slate-100 bg-slate-50 rounded-lg text-sm font-medium text-slate-600">
          {format(new Date(), "dd MMM yyyy, hh:mm a")} (Auto-recorded)
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Remarks (Optional)</label>
        <textarea
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Any physical damage, missing cables, etc."
          className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
        ></textarea>
      </div>

      <button 
        type="submit"
        disabled={isSubmitting}
        className="mt-4 w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? "Submitting..." : "Submit Record"}
      </button>
    </form>
  );
}
