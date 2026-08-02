"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { 
  FaUserTie, FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaEdit, 
  FaSearch, FaSyncAlt, FaBuilding, FaPhoneAlt, FaUniversity, FaFileInvoiceDollar,
  FaCalendarAlt, FaPlus, FaTimes, FaShieldAlt
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface PayrollRecord {
  userId: string;
  clerkId: string;
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  joiningDate: string;
  baseSalary: number;
  bankAccount: string;
  ifscCode: string;
  bankName: string;
  panNumber: string;
  
  incentives: number;
  allowances: number;
  otherExpenses: number;
  totalPaidAmount: number;
  salaryStatus: "PAID" | "UNPAID";
  salaryExpenseId: string | null;
  paidDate: string | null;
  paymentMode: string | null;
  referenceNo: string | null;
  expensesList: any[];
}

export default function PayrollDashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [search, setSearch] = useState("");

  // Edit Profile Modal
  const [editingProfile, setEditingProfile] = useState<PayrollRecord | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    department: "Sales",
    baseSalary: "",
    bankName: "",
    bankAccount: "",
    ifscCode: "",
    panNumber: ""
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Mark Paid Modal
  const [markingPaidRecord, setMarkingPaidRecord] = useState<PayrollRecord | null>(null);
  const [payForm, setPayForm] = useState({
    amount: "",
    paymentMode: "Bank Transfer",
    referenceNo: "",
    remarks: ""
  });
  const [submittingPay, setSubmittingPay] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/payroll", {
        params: { month: selectedMonth }
      });
      setSummary(res.data.summary);
      setPayroll(res.data.payroll || []);
    } catch (err: any) {
      toast.error("Failed to fetch payroll data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const handleOpenEditProfile = (rec: PayrollRecord) => {
    setEditingProfile(rec);
    setProfileForm({
      name: rec.name || "",
      phone: rec.phone || "",
      department: rec.department || "Sales",
      baseSalary: String(rec.baseSalary || 0),
      bankName: rec.bankName || "",
      bankAccount: rec.bankAccount || "",
      ifscCode: rec.ifscCode || "",
      panNumber: rec.panNumber || ""
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    setSavingProfile(true);
    try {
      await axios.post("/api/payroll", {
        email: editingProfile.email,
        name: profileForm.name,
        phone: profileForm.phone,
        department: profileForm.department,
        baseSalary: parseFloat(profileForm.baseSalary || "0"),
        bankName: profileForm.bankName,
        bankAccount: profileForm.bankAccount,
        ifscCode: profileForm.ifscCode,
        panNumber: profileForm.panNumber
      });

      toast.success("Employee profile updated!");
      setEditingProfile(null);
      fetchData();
    } catch (err: any) {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleOpenMarkPaid = (rec: PayrollRecord) => {
    setMarkingPaidRecord(rec);
    setPayForm({
      amount: String(rec.baseSalary || 0),
      paymentMode: "Bank Transfer",
      referenceNo: "",
      remarks: `Salary payment for ${selectedMonth}`
    });
  };

  const handleMarkPaidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markingPaidRecord) return;

    setSubmittingPay(true);
    try {
      await axios.put("/api/payroll", {
        action: "MARK_PAID",
        email: markingPaidRecord.email,
        name: markingPaidRecord.name,
        month: selectedMonth,
        amount: parseFloat(payForm.amount || "0"),
        paymentMode: payForm.paymentMode,
        referenceNo: payForm.referenceNo,
        remarks: payForm.remarks
      });

      toast.success(`Salary marked as PAID for ${markingPaidRecord.name}!`);
      setMarkingPaidRecord(null);
      fetchData();
    } catch (err: any) {
      toast.error("Failed to update salary status");
    } finally {
      setSubmittingPay(false);
    }
  };

  const handleMarkUnpaid = async (rec: PayrollRecord) => {
    if (!confirm(`Mark salary as UNPAID for ${rec.name}? This will remove the salary expense entry.`)) return;

    try {
      await axios.put("/api/payroll", {
        action: "MARK_UNPAID",
        email: rec.email,
        month: selectedMonth
      });

      toast.success("Salary status set to UNPAID");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  const filteredPayroll = payroll.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
      <Toaster position="top-right" />

      {/* Header Section */}
      <div className="max-w-[1600px] mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-tr from-indigo-600 to-indigo-700 rounded-2xl shadow-lg shadow-indigo-200 text-white">
              <FaUserTie size={28} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
                Employee <span className="text-indigo-600">Payroll & Salary</span>
              </h1>
              <p className="text-slate-500 font-bold mt-1 text-sm">
                Employee Directory, Base Salary Setup, Monthly Disbursal & Status Tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">MONTH:</span>
              <input
                type="month"
                className="bg-transparent border-none text-xs font-black text-slate-700 focus:ring-0 cursor-pointer"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>

            <button 
              onClick={fetchData}
              className="p-3.5 bg-white text-slate-400 rounded-2xl shadow-sm border border-slate-200 hover:text-indigo-600 hover:shadow-md transition-all"
              title="Refresh Data"
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL EMPLOYEES</span>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">👤</div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900">{summary?.totalEmployees || 0}</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">Active assigners & team members</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MONTHLY BASE SALARY POOL</span>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">💼</div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900">₹{(summary?.totalBaseSalaryPool || 0).toLocaleString()}</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">Total committed monthly base salary</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SALARY STATUS</span>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">📊</div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black">
                🟢 {summary?.paidCount || 0} Paid
              </span>
              <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-black">
                🔴 {summary?.unpaidCount || 0} Unpaid
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 mt-2">Status for {selectedMonth}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL DISBURSED</span>
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold">💸</div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-rose-600">₹{(summary?.totalPaidSalaryPool || 0).toLocaleString()}</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">Includes salary, bonuses & allowances</p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="max-w-[1600px] mx-auto bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* Search Bar */}
        <div className="p-6 md:p-8 border-b border-slate-100 bg-white">
          <div className="relative w-full md:w-[450px]">
            <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 text-sm" />
            <input
              type="text"
              placeholder="Search employee by name, email, or department..."
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500 transition-all text-xs font-bold text-slate-700"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="pl-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Salary</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Incentives & Allowances</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Disbursed Total</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Salary Status</th>
                <th className="pr-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-bold text-sm">Fetching Payroll Data...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredPayroll.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <p className="text-slate-400 font-bold text-lg">No employees found</p>
                  </td>
                </tr>
              ) : (
                filteredPayroll.map((rec) => {
                  const isPaid = rec.salaryStatus === "PAID";
                  return (
                    <tr key={rec.userId} className="hover:bg-indigo-50/20 transition-all group">
                      <td className="pl-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                            {rec.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                                {rec.name}
                              </h4>
                              <button
                                onClick={() => handleOpenEditProfile(rec)}
                                className="text-slate-300 hover:text-indigo-600 transition-colors p-1"
                                title="Edit Profile & Base Salary"
                              >
                                <FaEdit size={12} />
                              </button>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400">{rec.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-5">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-black">
                          {rec.department}
                        </span>
                      </td>

                      <td className="px-4 py-5">
                        <span className="text-sm font-black text-slate-800">₹{rec.baseSalary.toLocaleString()}</span>
                      </td>

                      <td className="px-4 py-5">
                        <div className="flex flex-col text-xs font-bold text-slate-600">
                          <span>Inc: <strong className="text-emerald-600">₹{rec.incentives}</strong></span>
                          <span>Allow: <strong className="text-indigo-600">₹{rec.allowances}</strong></span>
                        </div>
                      </td>

                      <td className="px-4 py-5">
                        <span className="text-sm font-black text-indigo-600">₹{rec.totalPaidAmount.toLocaleString()}</span>
                      </td>

                      <td className="px-4 py-5">
                        <div className="flex flex-col">
                          <span className={`w-max px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isPaid ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {isPaid ? "🟢 PAID" : "🔴 UNPAID"}
                          </span>
                          {isPaid && rec.paidDate && (
                            <span className="text-[9px] font-bold text-slate-400 mt-1">
                              {format(new Date(rec.paidDate), "dd MMM yyyy")} ({rec.paymentMode || "Bank"})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="pr-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isPaid ? (
                            <button
                              onClick={() => handleOpenMarkPaid(rec)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-100 flex items-center gap-1.5"
                            >
                              <FaCheckCircle size={12} />
                              Mark Paid
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkUnpaid(rec)}
                              className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                              title="Revert to Unpaid"
                            >
                              <FaTimesCircle size={12} />
                              Unpaid
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEditProfile(rec)}
                            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl text-xs font-black transition-all"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editingProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingProfile(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 overflow-hidden z-10"
            >
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black">
                    <FaEdit size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Edit Employee Profile</h3>
                    <p className="text-xs font-bold text-slate-400">{editingProfile.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingProfile(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <FaTimes size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employee Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Base Salary (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 25000"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                      value={profileForm.baseSalary}
                      onChange={(e) => setProfileForm({ ...profileForm, baseSalary: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Department</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                      value={profileForm.department}
                      onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Number</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">PAN Number</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 uppercase"
                      value={profileForm.panNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, panNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">🏦 Bank Details</span>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Bank Name"
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700"
                      value={profileForm.bankName}
                      onChange={(e) => setProfileForm({ ...profileForm, bankName: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="IFSC Code"
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 uppercase"
                      value={profileForm.ifscCode}
                      onChange={(e) => setProfileForm({ ...profileForm, ifscCode: e.target.value })}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Account Number"
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 font-mono"
                    value={profileForm.bankAccount}
                    onChange={(e) => setProfileForm({ ...profileForm, bankAccount: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 mt-2"
                >
                  {savingProfile ? "Saving Profile..." : "Save Profile"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mark Salary Paid Modal */}
      <AnimatePresence>
        {markingPaidRecord && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMarkingPaidRecord(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 overflow-hidden z-10"
            >
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black">
                    <FaCheckCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Mark Salary Paid</h3>
                    <p className="text-xs font-bold text-slate-400">{markingPaidRecord.name} ({selectedMonth})</p>
                  </div>
                </div>
                <button
                  onClick={() => setMarkingPaidRecord(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <FaTimes size={16} />
                </button>
              </div>

              <form onSubmit={handleMarkPaidSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Disbursed Amount (₹)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                    value={payForm.amount}
                    onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Mode</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                    value={payForm.paymentMode}
                    onChange={(e) => setPayForm({ ...payForm, paymentMode: e.target.value })}
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">UTR / Transaction Ref No.</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR12345678"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 font-mono"
                    value={payForm.referenceNo}
                    onChange={(e) => setPayForm({ ...payForm, referenceNo: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Remarks</label>
                  <textarea
                    placeholder="Payment notes..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                    rows={2}
                    value={payForm.remarks}
                    onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingPay}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 mt-2"
                >
                  {submittingPay ? "Processing..." : "Confirm Salary Disbursal"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
