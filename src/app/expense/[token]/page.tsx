"use client";

import React, { useState } from "react";
import { Package, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function PublicExpensePage({ params }: { params: Promise<{ token: string }> }) {
  const [expenseForm, setExpenseForm] = useState({ title: "", amount: "", date: new Date().toISOString().split("T")[0], remarks: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Unwrapping params Promise (Next.js 15 requires unwrapping async params if we used them in effect, but here we can just use React.use(params) or unwrap in submit)
  // For simplicity, we unwrap the token directly on submit
  const { token } = React.use(params);

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Submitting expense...");
    try {
      const res = await fetch("/api/public-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...expenseForm, token })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add expense");
      
      toast.success("Expense added successfully!", { id: toastId });
      setIsSuccess(true);
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2rem] w-full max-w-md shadow-lg p-8 text-center animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-emerald-500 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Expense Submitted!</h2>
          <p className="text-slate-500 mb-8">Your expense has been successfully recorded.</p>
          <button 
            onClick={() => {
              setExpenseForm({ title: "", amount: "", date: new Date().toISOString().split("T")[0], remarks: "" });
              setIsSuccess(false);
            }}
            className="w-full py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
          >
            Submit Another Expense
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
            <Package size={20} />
          </div>
          <div>
            <h1 className="font-black text-slate-800 text-xl tracking-tight">Add Expense</h1>
            <p className="text-xs font-medium text-slate-500">Record a new manual expense</p>
          </div>
        </div>
        
        <form onSubmit={handleExpenseSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Expense Title</label>
            <input 
              required 
              type="text" 
              placeholder="e.g. Employee Salary" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all font-medium text-slate-800" 
              value={expenseForm.title} 
              onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amount (₹)</label>
              <input 
                required 
                type="number" 
                placeholder="0" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all font-black text-slate-800" 
                value={expenseForm.amount} 
                onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date</label>
              <input 
                required 
                type="date" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all font-medium text-slate-800" 
                value={expenseForm.date} 
                onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Remarks / Employee Name</label>
            <input 
              type="text" 
              placeholder="e.g. Paid to Rahul" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all font-medium text-slate-800" 
              value={expenseForm.remarks} 
              onChange={e => setExpenseForm({...expenseForm, remarks: e.target.value})} 
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? "Submitting..." : "Save Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
