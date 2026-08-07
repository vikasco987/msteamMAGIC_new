"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { 
  Building2, Calendar, Users, DollarSign, Activity, FileText, CheckCircle2, Lock, ChevronLeft, ChevronRight, Calculator, AlertCircle, Unlock
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { format, addMonths, subMonths } from "date-fns";

export default function PayrollDashboard() {
  const { user: currentUser, isLoaded } = useUser();
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ employees: 0, payroll: 0, paid: 0, pending: 0, locked: 0 });
  const [loading, setLoading] = useState(true);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Modal state
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  
  // Form state
  const [adjustment, setAdjustment] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");
  const [remarks, setRemarks] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentStatus, setPaymentStatus] = useState("Paid");

  const [unlockEmp, setUnlockEmp] = useState<any>(null);
  const [unlockReason, setUnlockReason] = useState("");

  const currentUserRole = String(currentUser?.publicMetadata?.role || 'user').toLowerCase();
  const hasAccess = ["admin", "master"].includes(currentUserRole);

  useEffect(() => {
    if (isLoaded && hasAccess) {
      fetchPayroll();
    } else if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded, currentUserRole, currentMonth]);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payroll?date=${currentMonth.toISOString()}`);
      const data = await res.json();
      if (res.ok) {
        setPayrollData(data.payroll || []);
        if (data.summary) setSummary(data.summary);
      } else {
        toast.error(data.error || "Failed to load payroll data");
      }
    } catch (error) {
      toast.error("Error loading payroll data");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    
    const finalAmount = parseFloat(selectedEmp.calculatedSalary) + adjustment;
    
    const payload = {
      email: selectedEmp.email,
      name: selectedEmp.name,
      monthDate: currentMonth.toISOString(),
      baseSalary: selectedEmp.baseSalary,
      totalWorkingDays: selectedEmp.totalWorkingDays,
      payableDays: selectedEmp.payableDays,
      calculatedAmount: parseFloat(selectedEmp.calculatedSalary),
      adjustment,
      finalAmount,
      paymentMode,
      paymentDate,
      remarks,
      status: paymentStatus
    };

    try {
      const res = await fetch("/api/admin/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Salary processed successfully");
        setSelectedEmp(null);
        fetchPayroll();
      } else {
        toast.error(data.error || "Failed to process salary");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockEmp) return;
    if (unlockReason.trim().length < 10) {
      toast.error("Reason must be at least 10 characters long.");
      return;
    }
    
    try {
      const res = await fetch("/api/admin/payroll/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseId: unlockEmp.expenseRecord.id, reason: unlockReason })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Salary unlocked successfully");
        setUnlockEmp(null);
        setUnlockReason("");
        fetchPayroll();
      } else {
        toast.error(data.error || "Failed to unlock");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const openProcessModal = (emp: any) => {
    setSelectedEmp(emp);
    
    // Pre-fill if already processed
    if (emp.expenseRecord) {
      const exp = emp.expenseRecord;
      setAdjustment(exp.metadata?.adjustment || 0);
      setPaymentMode(exp.paymentMode || "Bank Transfer");
      setRemarks(exp.remarks || "");
      setPaymentDate(exp.date ? format(new Date(exp.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
      setPaymentStatus(exp.status || "Paid");
    } else {
      setAdjustment(0);
      setPaymentMode("Bank Transfer");
      setRemarks("");
      setPaymentDate(format(new Date(), "yyyy-MM-dd"));
      setPaymentStatus("Paid");
    }
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-red-100">
          <Lock size={40} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-2">ACCESS REJECTED</h1>
        <p className="text-slate-500 max-w-md font-bold">This area is reserved for authorized team members.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-10 max-w-[1400px]">

      {/* Unlock Modal */}
      <AnimatePresence>
        {unlockEmp && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white border border-slate-200 rounded-[32px] shadow-2xl p-8"
            >
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                  <Unlock size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Are you sure?</h2>
                <p className="text-sm font-medium text-slate-500 mt-2">
                  You are unlocking the finalized salary for <strong>{unlockEmp.name}</strong>.
                  Please provide a reason.
                </p>
              </div>

              <form onSubmit={handleUnlock} className="space-y-4">
                <div>
                  <textarea
                    value={unlockReason}
                    onChange={(e) => setUnlockReason(e.target.value)}
                    rows={3}
                    placeholder="Enter reason (min 10 chars)..."
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-amber-500"
                    required
                    minLength={10}
                  />
                </div>
                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={() => setUnlockEmp(null)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-black hover:bg-slate-200 transition-all">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-sm font-black hover:bg-amber-600 transition-all shadow-md shadow-amber-200">
                    Confirm Unlock
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Process Modal */}
      <AnimatePresence>
        {selectedEmp && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-[32px] shadow-2xl"
            >
              <div className="p-8 border-b border-slate-100 bg-slate-50 rounded-t-[32px] flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {selectedEmp.expenseRecord ? "Edit Salary" : "Process Salary"}
                  </h2>
                  <p className="text-sm font-bold text-slate-500">
                    {selectedEmp.name} • {format(currentMonth, 'MMMM yyyy')}
                  </p>
                </div>
                {selectedEmp.expenseRecord && (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-100 px-3 py-1 rounded-md border border-amber-200">
                    <AlertCircle size={12} /> Already Processed
                  </span>
                )}
              </div>

              <form onSubmit={handleProcessSalary} className="p-8 space-y-6">
                
                {/* Auto Calculation Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                  <div>
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Base Salary</label>
                    <p className="font-black text-slate-800">₹{selectedEmp.baseSalary}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Days</label>
                    <p className="font-black text-slate-800">{selectedEmp.totalWorkingDays}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Payable Days</label>
                    <p className="font-black text-indigo-700">{selectedEmp.payableDays}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Calculated</label>
                    <p className="font-black text-emerald-600">₹{selectedEmp.calculatedSalary}</p>
                  </div>
                </div>

                {/* Adjustments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Adjustments (+/-)</label>
                    <input 
                      type="number" 
                      value={adjustment}
                      onChange={(e) => setAdjustment(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">Use negative for deductions, positive for bonuses.</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-2">Final Payable Amount</label>
                    <div className="w-full px-4 py-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-xl font-black text-emerald-700 flex items-center justify-between">
                      <span>₹</span>
                      <span>{(parseFloat(selectedEmp.calculatedSalary) + adjustment).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Status</label>
                    <select 
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Processing">Processing</option>
                      <option value="Pending">Pending</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Payment Mode</label>
                    <select 
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI">UPI</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Payment Date</label>
                    <input 
                      type="date" 
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Remarks (Optional)</label>
                  <textarea 
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Performance Incentive included"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setSelectedEmp(null)} className="flex-1 py-4 rounded-xl bg-slate-100 text-slate-700 text-sm font-black hover:bg-slate-200 transition-all">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-4 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200">
                    Confirm {paymentStatus}
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 text-indigo-600 mb-2">
            <DollarSign size={28} className="drop-shadow-sm" />
            <span className="text-sm font-black uppercase tracking-[0.3em] opacity-80">Salary & Payroll</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
            Payroll <span className="text-indigo-600">Dashboard</span>
          </h1>
        </div>
        
        <div className="flex items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="px-6 py-2 min-w-[180px] text-center">
            <span className="text-sm font-black uppercase tracking-widest text-slate-800">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employees</p>
          <p className="text-2xl font-black text-slate-800">{summary.employees}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Payroll</p>
          <p className="text-2xl font-black text-indigo-700">₹{summary.payroll}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Paid</p>
          <p className="text-2xl font-black text-emerald-600">₹{summary.paid}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Pending</p>
          <p className="text-2xl font-black text-amber-600">₹{summary.pending}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Locked</p>
          <p className="text-2xl font-black text-rose-600">{summary.locked}</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">Employee</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">Base Salary</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">Attendance</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">Calculated</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">Final Salary</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 text-center">Status</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payrollData.map((emp) => (
                <tr key={emp.employeeId} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{emp.name}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{emp.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-700">₹{emp.baseSalary}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">{emp.payableDays} / {emp.totalWorkingDays} Days</span>
                      <span className="text-xs font-medium text-slate-500">{emp.attendancePercent}% Payable</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-700">₹{emp.calculatedSalary}</span>
                  </td>
                  <td className="px-6 py-4">
                    {emp.expenseRecord ? (
                       <div className="flex flex-col">
                         <span className="font-bold text-emerald-700">₹{emp.expenseRecord.amount}</span>
                         {emp.expenseRecord.metadata?.adjustment ? (
                           <span className="text-[10px] font-black text-slate-400">Adj: ₹{emp.expenseRecord.metadata.adjustment}</span>
                         ) : null}
                       </div>
                    ) : (
                      <span className="text-sm font-medium text-slate-400 italic">Pending Processing</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {emp.isLocked ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          <Lock size={12} /> Locked
                        </span>
                        {emp.expenseRecord?.metadata?.auditLog?.[0] && (
                          <div className="text-[9px] font-medium text-slate-400 mt-1">
                            By {emp.expenseRecord.metadata.auditLog[0].by}<br/>
                            On {format(new Date(emp.expenseRecord.metadata.auditLog[0].date), 'dd MMM yyyy')}
                          </div>
                        )}
                      </div>
                    ) : emp.status === 'Paid' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200">
                        <CheckCircle2 size={12} /> Paid
                      </span>
                    ) : emp.status === 'Processing' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200">
                        <Activity size={12} /> Processing
                      </span>
                    ) : emp.status === 'On Hold' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-100 px-2.5 py-1 rounded-md border border-rose-200">
                        <Lock size={12} /> On Hold
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200">
                        <Calendar size={12} /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {emp.isLocked ? (
                      <button 
                        onClick={() => setUnlockEmp(emp)}
                        className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-500 text-xs font-black uppercase rounded-lg hover:border-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-all shadow-sm flex items-center justify-center gap-1.5 ml-auto"
                      >
                        <Unlock size={14} /> Unlock
                      </button>
                    ) : emp.expenseRecord ? (
                      <button 
                        onClick={() => openProcessModal(emp)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-black uppercase rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                      >
                        Edit
                      </button>
                    ) : (
                      <button 
                        onClick={() => openProcessModal(emp)}
                        className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black uppercase rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      >
                        Process
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {payrollData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                    <Users size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="font-bold text-lg">No employees found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
