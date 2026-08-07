"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { 
  Building2, Calendar, Users, DollarSign, Activity, FileText, CheckCircle2, Lock, ChevronLeft, ChevronRight, Calculator, AlertCircle, Unlock, Download, Search, Filter, Briefcase, Eye, ChevronRightSquare, CheckCircle, Info, XCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { format, addMonths, subMonths, isAfter } from "date-fns";
import Link from "next/link";

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
  const [referenceNo, setReferenceNo] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentStatus, setPaymentStatus] = useState("Paid");

  const [unlockEmp, setUnlockEmp] = useState<any>(null);
  const [unlockReason, setUnlockReason] = useState("");

  // New V1.0 states
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [lockFilter, setLockFilter] = useState("All");
  const [employmentStatusFilter, setEmploymentStatusFilter] = useState("Active");
  const [viewingProfile, setViewingProfile] = useState<any>(null);
  const [confirmPaymentPayload, setConfirmPaymentPayload] = useState<any>(null);
  const [showAttendancePopup, setShowAttendancePopup] = useState<any>(null);

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

  const handleProcessSalary = async (e: React.FormEvent, bypassConfirm = false) => {
    e.preventDefault();
    if (!selectedEmp) return;

    if (selectedEmp.baseSalary <= 0) {
      toast.error("Cannot process salary: Base salary is 0 or not configured.");
      return;
    }
    
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

    if (paymentStatus === "Paid" && paymentMode.includes("Bank") && (!selectedEmp.bank?.bankAccount || !selectedEmp.bank?.ifscCode)) {
      toast.error("Cannot pay via Bank Transfer: Bank Details Missing!");
      return;
    }

    if (paymentStatus === "Paid" && !bypassConfirm) {
      setConfirmPaymentPayload(payload);
      return;
    }

    // Call the new Transaction Engine API
    const processPayload = {
      employeeEmail: selectedEmp.email,
      employeeName: selectedEmp.name,
      month: format(currentMonth, 'yyyy-MM'),
      amount: finalAmount,
      paymentMode,
      referenceNo,
      remarks
    };

    try {
      const res = await fetch("/api/admin/payroll/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processPayload)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Payroll transaction successful and locked!");
        setSelectedEmp(null);
        setConfirmPaymentPayload(null);
        fetchPayroll();
      } else {
        toast.error(data.error || "Failed to process salary transaction");
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
      setReferenceNo(exp.referenceNo || "");
      setRemarks(exp.remarks || "");
      setPaymentDate(exp.date ? format(new Date(exp.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
      setPaymentStatus(exp.status || "Paid");
    } else {
      setAdjustment(0);
      setPaymentMode("Bank Transfer");
      setReferenceNo("");
      setRemarks("");
      setPaymentDate(format(new Date(), "yyyy-MM-dd"));
      setPaymentStatus("Paid");
    }
    setConfirmPaymentPayload(null);
  };

  const nextMonth = () => {
    const next = addMonths(currentMonth, 1);
    if (!isAfter(next, new Date())) {
      setCurrentMonth(next);
    }
  };
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const processedCount = payrollData.filter(emp => emp.expenseRecord && emp.status === "Paid").length;
  const processedPercent = summary.employees > 0 ? (processedCount / summary.employees) * 100 : 0;
  
  const paidPercent = summary.payroll > 0 ? (summary.paid / summary.payroll) * 100 : 0;
  const pendingPercent = summary.payroll > 0 ? (summary.pending / summary.payroll) * 100 : 0;

  const filteredData = payrollData.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === "All" || emp.department === departmentFilter;
    const matchesStatus = statusFilter === "All" || emp.status === statusFilter;
    const matchesLock = lockFilter === "All" || (lockFilter === "Locked" ? emp.isLocked : !emp.isLocked);
    
    const empStatus = emp.employmentStatus || "Active";
    const matchesEmployment = employmentStatusFilter === "All" || (
      employmentStatusFilter === "Active" ? (empStatus === "Active" || empStatus === "Notice Period") : empStatus === employmentStatusFilter
    );

    return matchesSearch && matchesDept && matchesStatus && matchesLock && matchesEmployment;
  });

  const uniqueDepartments = Array.from(new Set(payrollData.map(e => e.department).filter(Boolean)));

  const handleExport = (type: 'summary' | 'detailed') => {
    let csv = '';
    
    if (type === 'summary') {
      csv = 'Employee,Department,Bank Name,Account No.,IFSC,Base Salary,Payable Days,Final Salary,Status,Payment Mode\n';
      filteredData.forEach(emp => {
        const acc = emp.bank?.bankAccount ? `"${emp.bank.bankAccount.slice(-4)}"` : 'N/A';
        const final = emp.expenseRecord ? emp.expenseRecord.amount : emp.calculatedSalary;
        csv += `"${emp.name}","${emp.department || ''}","${emp.bank?.bankName || ''}",${acc},"${emp.bank?.ifscCode || ''}",${emp.baseSalary},${emp.payableDays},${final},${emp.status},"${emp.expenseRecord?.paymentMode || 'N/A'}"\n`;
      });
    } else {
      csv = 'Employee ID,Employee Name,Department,Designation,Base Salary,Working Days,Present,Half Day,Paid Leave,Holiday,Weekly Off,Absent,Attendance %,Calculated Salary,Adjustment,Final Salary,Payment Mode,Status,Remarks,Locked\n';
      filteredData.forEach(emp => {
        const bd = emp.attendanceBreakdown || {};
        const adj = emp.expenseRecord?.metadata?.adjustment || 0;
        const final = emp.expenseRecord ? emp.expenseRecord.amount : emp.calculatedSalary;
        csv += `"${emp.employeeId}","${emp.name}","${emp.department || ''}","${emp.designation || ''}",${emp.baseSalary},${emp.totalWorkingDays},${bd.present || 0},${bd.halfDay || 0},${bd.paidLeave || 0},${bd.holiday || 0},${bd.weeklyOff || 0},${bd.absent || 0},${emp.attendancePercent},${emp.calculatedSalary},${adj},${final},"${emp.expenseRecord?.paymentMode || 'N/A'}",${emp.status},"${emp.expenseRecord?.remarks || ''}",${emp.isLocked}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `payroll_${type}_${format(currentMonth, 'MMM_yyyy')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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

              {confirmPaymentPayload ? (
                <div className="p-8 space-y-6">
                  <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center">
                    <h3 className="text-xl font-black text-slate-900 mb-2">Final Confirmation</h3>
                    <p className="text-sm font-bold text-slate-600 mb-6">You are about to mark this salary as PAID. This will lock the record.</p>
                    <div className="flex flex-col gap-3 max-w-sm mx-auto text-left bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      <div className="flex justify-between"><span className="text-xs font-black text-slate-400 uppercase">Employee</span> <span className="font-bold text-slate-800">{confirmPaymentPayload.name}</span></div>
                      <div className="flex justify-between"><span className="text-xs font-black text-slate-400 uppercase">Month</span> <span className="font-bold text-slate-800">{format(currentMonth, 'MMMM yyyy')}</span></div>
                      <div className="flex justify-between"><span className="text-xs font-black text-slate-400 uppercase">Net Salary</span> <span className="font-black text-emerald-600">₹{confirmPaymentPayload.finalAmount}</span></div>
                      <div className="flex justify-between"><span className="text-xs font-black text-slate-400 uppercase">Mode</span> <span className="font-bold text-slate-800">{confirmPaymentPayload.paymentMode}</span></div>
                      {referenceNo && <div className="flex justify-between"><span className="text-xs font-black text-slate-400 uppercase">Ref No</span> <span className="font-bold text-slate-800">{referenceNo}</span></div>}
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setConfirmPaymentPayload(null)} className="flex-1 py-4 rounded-xl bg-slate-100 text-slate-700 text-sm font-black hover:bg-slate-200 transition-all">
                      Back to Edit
                    </button>
                    <button type="button" onClick={(e) => handleProcessSalary(e, true)} className="flex-1 py-4 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-2">
                      <CheckCircle2 size={18} /> Confirm Paid
                    </button>
                  </div>
                </div>
              ) : (
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Reference / UTR Number (Optional)</label>
                    <input 
                      type="text" 
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                      placeholder="e.g. UPI Ref / Cheque No"
                      className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Remarks (Optional)</label>
                      <div className="flex gap-2">
                      {["+ Performance Bonus", "+ Travel Allowance", "- Deduction", "- Advance Recovery"].map(chip => (
                        <button 
                          key={chip} 
                          type="button" 
                          onClick={() => setRemarks(prev => prev ? `${prev}, ${chip}` : chip)}
                          className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[9px] font-bold hover:bg-slate-200 transition-colors"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea 
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Performance Incentive included"
                  />
                </div>
              </div>

                {selectedEmp.baseSalary <= 0 && (
                  <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 flex items-center gap-2">
                    <AlertCircle size={16} /> Cannot process salary: Base salary is not configured for this employee.
                  </div>
                )}
                
                {paymentStatus === "Paid" && paymentMode.includes("Bank") && (!selectedEmp.bank?.bankAccount || !selectedEmp.bank?.ifscCode) && (
                  <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 flex items-center gap-2">
                    <AlertCircle size={16} /> Cannot pay via Bank Transfer: Bank Details Missing! Please select another payment mode.
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setSelectedEmp(null)} className="flex-1 py-4 rounded-xl bg-slate-100 text-slate-700 text-sm font-black hover:bg-slate-200 transition-all">
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={selectedEmp.baseSalary <= 0 || (paymentStatus === "Paid" && paymentMode.includes("Bank") && (!selectedEmp.bank?.bankAccount || !selectedEmp.bank?.ifscCode))}
                    className="flex-1 py-4 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paymentStatus === "Paid" ? "Proceed to Confirm" : `Confirm ${paymentStatus}`}
                  </button>
                </div>

              </form>
              )}
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
          <div className="mt-4">
            <Link href="/admin/employees" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100">
                <Users size={16} />
                Go to Employee Directory
            </Link>
          </div>
        </div>
        
        <div className="flex items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={goToToday} className="px-4 py-2 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-widest text-indigo-600 transition-colors border border-indigo-100 mr-2">
            Today
          </button>
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="px-6 py-2 min-w-[180px] text-center">
            <span className="text-sm font-black uppercase tracking-widest text-slate-800">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
          </div>
          <button onClick={nextMonth} disabled={isAfter(addMonths(currentMonth, 1), new Date())} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employees</p>
          <p className="text-2xl font-black text-slate-800">{summary.employees}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Payroll</p>
          <p className="text-2xl font-black text-indigo-700">₹{summary.payroll}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Paid</p>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-black text-emerald-600">₹{summary.paid}</p>
            <span className="text-xs font-bold text-emerald-400">{paidPercent.toFixed(0)}%</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Pending</p>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-black text-amber-600">₹{summary.pending}</p>
            <span className="text-xs font-bold text-amber-400">{pendingPercent.toFixed(0)}%</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Locked</p>
          <p className="text-2xl font-black text-rose-600">{summary.locked} <span className="text-sm font-medium text-slate-400">/ {summary.employees}</span></p>
        </div>
      </div>

      {/* Payroll Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
        <div className="flex justify-between items-end mb-2">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Payroll Progress</p>
          <p className="text-sm font-bold text-slate-700">{processedCount} of {summary.employees} Employees Processed ({processedPercent.toFixed(0)}%)</p>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out relative"
            style={{ width: `${processedPercent}%` }}
          >
            <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)' }}></div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search employee name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        
        <select 
          value={departmentFilter}
          onChange={e => setDepartmentFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 text-slate-700 min-w-[150px]"
        >
          <option value="All">All Departments</option>
          {uniqueDepartments.map((dept: any) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <select 
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 text-slate-700 min-w-[150px]"
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Processing">Processing</option>
        </select>
        
        <select 
          value={lockFilter}
          onChange={e => setLockFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 text-slate-700 min-w-[150px]"
        >
          <option value="All">All Lock States</option>
          <option value="Locked">Locked</option>
          <option value="Unlocked">Unlocked</option>
        </select>
        
        <div className="relative group">
          <button className="flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all">
            <Download size={16} /> Export
          </button>
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
            <button onClick={() => handleExport('summary')} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 border-b border-slate-100">
              Export Summary (CSV)
            </button>
            <button onClick={() => handleExport('detailed')} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Export Detailed (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">Employee</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">Dept & Role</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">Base Salary</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">Attendance</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">Final Salary</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 text-center">Status</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length > 0 ? filteredData.map((emp) => (
                <tr key={emp.employeeId} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setViewingProfile(emp)}>{emp.name}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{emp.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">{emp.department}</span>
                      <span className="text-xs font-medium text-slate-500">{emp.designation}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-700">₹{emp.baseSalary}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col cursor-pointer group-hover:bg-slate-100 p-2 rounded-xl transition-all w-fit" onClick={() => setShowAttendancePopup(emp)}>
                      <span className="text-sm font-bold text-indigo-600 flex items-center gap-1">
                        {emp.payableDays} / {emp.totalWorkingDays} Days <Info size={14} className="opacity-50" />
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{emp.attendancePercent}% Payable</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-emerald-600 text-lg">
                        ₹{emp.expenseRecord ? emp.expenseRecord.amount : emp.calculatedSalary}
                      </span>
                      {emp.expenseRecord?.metadata?.adjustment ? (
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                          {emp.expenseRecord.metadata.adjustment > 0 ? '+' : ''}{emp.expenseRecord.metadata.adjustment} Adj
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Auto Calc</span>
                      )}
                    </div>
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
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                      <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                        <Calendar size={32} />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mb-2">No Attendance Recorded</h3>
                      <p className="text-sm font-medium text-slate-500">
                        No attendance has been recorded for this month yet. Process salaries after attendance is complete.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Summary */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-2xl font-black mb-1">Payroll Summary</h3>
          <p className="text-slate-400 text-sm font-medium">Review before finalizing the month.</p>
        </div>
        <div className="flex gap-8">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Payroll</p>
            <p className="text-2xl font-black">₹{summary.payroll}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Processed</p>
            <p className="text-2xl font-black text-emerald-400">₹{summary.paid}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Remaining</p>
            <p className="text-2xl font-black text-amber-400">₹{summary.pending}</p>
          </div>
        </div>
      </div>

      {/* Attendance Breakdown Popup */}
      <AnimatePresence>
        {showAttendancePopup && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setShowAttendancePopup(null)}
          >
            <motion.div 
              className="bg-white rounded-[24px] p-6 shadow-2xl w-full max-w-sm border border-slate-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-900">Attendance Breakdown</h3>
                <button onClick={() => setShowAttendancePopup(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <XCircle size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm">
                  <span>Present</span>
                  <span>{showAttendancePopup.attendanceBreakdown?.present || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm">
                  <span>Half Day</span>
                  <span>{showAttendancePopup.attendanceBreakdown?.halfDay || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm">
                  <span>Paid Leave</span>
                  <span>{showAttendancePopup.attendanceBreakdown?.paidLeave || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-amber-50 text-amber-700 rounded-xl font-bold text-sm">
                  <span>Holiday</span>
                  <span>{showAttendancePopup.attendanceBreakdown?.holiday || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm">
                  <span>Weekly Off</span>
                  <span>{showAttendancePopup.attendanceBreakdown?.weeklyOff || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-rose-50 text-rose-700 rounded-xl font-bold text-sm">
                  <span>Absent</span>
                  <span>{showAttendancePopup.attendanceBreakdown?.absent || 0}</span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Payable Days</span>
                <span className="text-lg font-black text-indigo-600">{showAttendancePopup.payableDays}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Employee Profile Drawer */}
      <AnimatePresence>
        {viewingProfile && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 z-[130] backdrop-blur-sm"
              onClick={() => setViewingProfile(null)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl z-[140] border-l border-slate-200 overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <h3 className="text-lg font-black text-slate-900">Employee Profile</h3>
                <button onClick={() => setViewingProfile(null)} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
                  <ChevronRightSquare size={20} />
                </button>
              </div>
              <div className="p-6 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-2xl">
                    {viewingProfile.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{viewingProfile.name}</h2>
                    <p className="text-xs font-bold text-slate-500">{viewingProfile.email}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase tracking-widest">{viewingProfile.department}</span>
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase tracking-widest">{viewingProfile.designation}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Bank Details</h4>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-slate-500">Bank Name</span>
                      <span className="text-xs font-black text-slate-900">{viewingProfile.bank?.bankName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-slate-500">Account No.</span>
                      <span className="text-xs font-black text-slate-900">{viewingProfile.bank?.bankAccount ? `•••• ${viewingProfile.bank.bankAccount.slice(-4)}` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-slate-500">IFSC Code</span>
                      <span className="text-xs font-black text-slate-900">{viewingProfile.bank?.ifscCode || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-slate-500">UPI ID</span>
                      <span className="text-xs font-black text-slate-900">{viewingProfile.bank?.upiId || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Attendance Summary</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-emerald-600">{viewingProfile.payableDays}</span>
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Payable Days</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setShowAttendancePopup(viewingProfile)}>
                      <span className="text-xl font-black text-slate-700">{viewingProfile.attendancePercent}%</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">View Breakdown</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-center">
                  <Link href="/admin/employees" className="text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 uppercase tracking-widest">
                    Edit Profile in Directory <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
