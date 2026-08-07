"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { 
  FaDollarSign, FaWallet, FaClock, FaSearch, FaSyncAlt, FaFileExcel, 
  FaUser, FaChevronRight, FaPlus, FaTrash, FaCheck, FaTimes, FaExternalLinkAlt,
  FaChartLine, FaExclamationTriangle, FaArrowUp, FaArrowDown, FaBuilding, FaFilter,
  FaEdit, FaUserTie, FaCheckCircle
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface TaskItem {
  id: string;
  title: string;
  status: string;
  customerName: string;
  createdAt: string;
  revenue: number;
  received: number;
  deliveryCharge: number;
  costPrice: number;
  directExpense: number;
  taskProfit: number;
}

interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  status?: string;
  paymentMode?: string;
  referenceNo?: string;
  remarks?: string;
}

interface AssignerProfitability {
  name: string;
  email: string;
  totalSales: number;
  totalRevenue: number;
  amountReceived: number;
  pendingAmount: number;
  taskDeliveryExpense: number;
  taskCostPriceExpense: number;
  totalTaskDirectExpense: number;
  grossTaskProfit: number;
  grossCashProfit: number;
  employeeManualExpenses: number;
  netProfit: number;
  netCashProfit: number;
  profitMargin: number;
  status: "PROFITABLE" | "LOSS_MAKING" | "BREAK_EVEN";
  tasks: TaskItem[];
  expensesList: ExpenseItem[];
}

export default function AssignerProfitabilityPage() {
  const [summary, setSummary] = useState<any>(null);
  const [assigners, setAssigners] = useState<AssignerProfitability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"netProfit" | "totalRevenue" | "profitMargin" | "totalSales">("netProfit");

  // Drawer / Modal states
  const [selectedAssigner, setSelectedAssigner] = useState<AssignerProfitability | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<"tasks" | "expenses" | "addExpense">("tasks");

  // New Expense Form
  const [newExpense, setNewExpense] = useState({
    title: "",
    category: "Salary",
    amount: "",
    remarks: "",
    date: format(new Date(), "yyyy-MM-dd")
  });
  const [submittingExpense, setSubmittingExpense] = useState(false);

  // Edit Expense State & Form
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [editExpenseForm, setEditExpenseForm] = useState({
    title: "",
    category: "Salary",
    amount: "",
    date: "",
    status: "Paid",
    paymentMode: "Bank Transfer",
    referenceNo: "",
    remarks: ""
  });
  const [savingEditExpense, setSavingEditExpense] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/stats/user-performance/profitability", {
        params: { month: selectedMonth }
      });
      setSummary(res.data.summary);
      setAssigners(res.data.assigners || []);
    } catch (err: any) {
      toast.error("Failed to fetch profitability data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssigner || !newExpense.title || !newExpense.amount) {
      toast.error("Please fill title and amount");
      return;
    }

    setSubmittingExpense(true);
    try {
      await axios.post("/api/employee-expenses", {
        assignerEmail: selectedAssigner.email,
        assignerName: selectedAssigner.name,
        title: newExpense.title,
        category: newExpense.category === "Other" && newExpense.customCategory ? newExpense.customCategory : newExpense.category,
        amount: parseFloat(newExpense.amount),
        date: newExpense.date,
        remarks: newExpense.remarks
      });

      toast.success("Employee expense added!");
      setNewExpense({
        title: "",
        category: "Salary",
        customCategory: "",
        amount: "",
        remarks: "",
        date: format(new Date(), "yyyy-MM-dd")
      });
      
      // Refresh data
      await fetchData();
      
      // Re-select updated assigner
      const updatedRes = await axios.get("/api/stats/user-performance/profitability", {
        params: { month: selectedMonth }
      });
      const updatedItem = updatedRes.data.assigners.find((a: any) => a.email === selectedAssigner.email);
      if (updatedItem) setSelectedAssigner(updatedItem);
      
      setActiveDrawerTab("expenses");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add expense");
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleOpenEditExpense = (exp: ExpenseItem) => {
    setEditingExpense(exp);
    setEditExpenseForm({
      title: exp.title || "",
      category: exp.category || "Salary",
      amount: String(exp.amount || 0),
      date: exp.date ? format(new Date(exp.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      status: exp.status || "Paid",
      paymentMode: exp.paymentMode || "Bank Transfer",
      referenceNo: exp.referenceNo || "",
      remarks: exp.remarks || ""
    });
  };

  const handleSaveEditExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    setSavingEditExpense(true);
    try {
      await axios.put("/api/employee-expenses", {
        id: editingExpense.id,
        title: editExpenseForm.title,
        category: editExpenseForm.category,
        amount: parseFloat(editExpenseForm.amount),
        date: editExpenseForm.date,
        status: editExpenseForm.status,
        paymentMode: editExpenseForm.paymentMode,
        referenceNo: editExpenseForm.referenceNo,
        remarks: editExpenseForm.remarks
      });

      toast.success("Expense updated!");
      setEditingExpense(null);
      await fetchData();

      if (selectedAssigner) {
        const updatedRes = await axios.get("/api/stats/user-performance/profitability", {
          params: { month: selectedMonth }
        });
        const updatedItem = updatedRes.data.assigners.find((a: any) => a.email === selectedAssigner.email);
        if (updatedItem) setSelectedAssigner(updatedItem);
      }
    } catch (err: any) {
      toast.error("Failed to update expense");
    } finally {
      setSavingEditExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      await axios.delete(`/api/employee-expenses?id=${expenseId}`);
      toast.success("Expense deleted");
      fetchData();
      if (selectedAssigner) {
        setSelectedAssigner(prev => prev ? {
          ...prev,
          expensesList: prev.expensesList.filter(e => e.id !== expenseId),
          employeeManualExpenses: prev.employeeManualExpenses - (prev.expensesList.find(e => e.id === expenseId)?.amount || 0)
        } : null);
      }
    } catch (err: any) {
      toast.error("Failed to delete expense");
    }
  };

  // Filtering & Sorting
  const filteredAssigners = assigners
    .filter(a => 
      a.name.toLowerCase().includes(search.toLowerCase()) || 
      a.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "netProfit") return b.netProfit - a.netProfit;
      if (sortBy === "totalRevenue") return b.totalRevenue - a.totalRevenue;
      if (sortBy === "profitMargin") return b.profitMargin - a.profitMargin;
      if (sortBy === "totalSales") return b.totalSales - a.totalSales;
      return 0;
    });

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
      <Toaster position="top-right" />

      {/* Header Banner */}
      <div className="max-w-[1600px] mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-tr from-indigo-600 to-indigo-700 rounded-2xl shadow-lg shadow-indigo-200 text-white">
              <FaChartLine size={28} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
                Assigner <span className="text-indigo-600">Profitability</span>
              </h1>
              <p className="text-slate-500 font-bold mt-1 text-sm">
                Employee-level Profit & Loss, Direct Costs, and Salary Overheads
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/dashboard/payroll"
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl shadow-md shadow-indigo-100 transition-all flex items-center gap-2"
            >
              <FaUserTie size={14} />
              Payroll & Salary Dashboard
            </a>

            {/* Month Filter */}
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

      {/* Summary KPI Cards */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL REVENUE</span>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">₹</div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900">₹{(summary?.totalRevenue || 0).toLocaleString()}</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">
              Collected: <span className="text-emerald-600 font-extrabold">₹{(summary?.totalReceived || 0).toLocaleString()}</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL EXPENSES</span>
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold">💸</div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-rose-600">₹{(summary?.grandTotalExpenses || 0).toLocaleString()}</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">
              Task Direct: <span className="text-slate-700">₹{(summary?.totalDirectTaskExpenses || 0).toLocaleString()}</span> | Employee: <span className="text-slate-700">₹{(summary?.totalEmployeeExpenses || 0).toLocaleString()}</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NET ASSIGNER PROFIT</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              (summary?.grandNetProfit || 0) >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            }`}>
              {(summary?.grandNetProfit || 0) >= 0 ? <FaArrowUp /> : <FaArrowDown />}
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-3xl font-black ${(summary?.grandNetProfit || 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              ₹{(summary?.grandNetProfit || 0).toLocaleString()}
            </h3>
            <p className="text-xs font-bold text-slate-400 mt-1">
              Net Cash Profit: <span className="font-extrabold text-slate-800">₹{(summary?.grandNetCashProfit || 0).toLocaleString()}</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EMPLOYEE HEALTH</span>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">🏆</div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                🟢 {summary?.profitableCount || 0} Profitable
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 bg-rose-100 text-rose-800 rounded-full">
                🔴 {summary?.lossMakingCount || 0} Loss
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 mt-2">
              Total Active Employees: {summary?.totalAssigners || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="max-w-[1600px] mx-auto bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* Search & Sorting Toolbar */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-white">
          <div className="relative w-full md:w-[400px]">
            <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 text-sm" />
            <input
              type="text"
              placeholder="Search assigner by name or email..."
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500 transition-all text-xs font-bold text-slate-700"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">SORT BY:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-slate-50 border-none ring-1 ring-slate-100 text-xs font-black text-slate-700 px-4 py-3 rounded-2xl focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="netProfit">Highest Net Profit</option>
              <option value="totalRevenue">Highest Revenue</option>
              <option value="profitMargin">Profit Margin %</option>
              <option value="totalSales">Sales Count</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="pl-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigner / Employee</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sales Count</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Direct Task Cost</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Expense</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Profit / Loss</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Margin %</th>
                <th className="pr-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-bold text-sm">Computing Employee Profitability...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredAssigners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <p className="text-slate-400 font-bold text-lg">No assigner data found for this period</p>
                  </td>
                </tr>
              ) : (
                filteredAssigners.map((item, idx) => {
                  const isProfitable = item.netProfit >= 0;
                  return (
                    <tr key={idx} className="hover:bg-indigo-50/20 transition-all group">
                      <td className="pl-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                              {item.name}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400">{item.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-5 text-center">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-black">
                          {item.totalSales} tasks
                        </span>
                      </td>

                      <td className="px-4 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800">₹{item.totalRevenue.toLocaleString()}</span>
                          <span className="text-[9px] font-bold text-emerald-600">Rec: ₹{item.amountReceived.toLocaleString()}</span>
                        </div>
                      </td>

                      <td className="px-4 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-700">₹{item.totalTaskDirectExpense.toLocaleString()}</span>
                          <span className="text-[9px] font-bold text-slate-400">Deliv: ₹{item.taskDeliveryExpense} | Mat: ₹{item.taskCostPriceExpense}</span>
                        </div>
                      </td>

                      <td className="px-4 py-5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-rose-600">₹{item.employeeManualExpenses.toLocaleString()}</span>
                          <button
                            onClick={() => {
                              setSelectedAssigner(item);
                              setActiveDrawerTab("addExpense");
                            }}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all"
                            title="Add Employee Expense / Salary"
                          >
                            <FaPlus size={10} />
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-5">
                        <div className="flex flex-col">
                          <span className={`text-base font-black ${isProfitable ? "text-emerald-600" : "text-rose-600"}`}>
                            {isProfitable ? "+" : ""}₹{item.netProfit.toLocaleString()}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">Cash: ₹{item.netCashProfit.toLocaleString()}</span>
                        </div>
                      </td>

                      <td className="px-4 py-5">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          isProfitable ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {item.profitMargin.toFixed(1)}%
                        </span>
                      </td>

                      <td className="pr-8 py-5 text-right">
                        <button
                          onClick={() => {
                            setSelectedAssigner(item);
                            setActiveDrawerTab("tasks");
                          }}
                          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 ml-auto"
                        >
                          Breakdown
                          <FaChevronRight size={10} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out Assigner Detail Drawer */}
      <AnimatePresence>
        {selectedAssigner && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAssigner(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col z-10"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 bg-indigo-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center font-black text-lg">
                    {selectedAssigner.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-black">{selectedAssigner.name}</h2>
                    <p className="text-xs text-indigo-100 font-bold">{selectedAssigner.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAssigner(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                >
                  <FaTimes size={16} />
                </button>
              </div>

              {/* Drawer KPI Mini Bar */}
              <div className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">REVENUE</span>
                  <p className="text-base font-black text-slate-800">₹{selectedAssigner.totalRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TOTAL EXPENSES</span>
                  <p className="text-base font-black text-rose-600">₹{(selectedAssigner.totalTaskDirectExpense + selectedAssigner.employeeManualExpenses).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NET PROFIT</span>
                  <p className={`text-base font-black ${selectedAssigner.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    ₹{selectedAssigner.netProfit.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Drawer Tabs Header */}
              <div className="flex border-b border-slate-100 bg-white px-6">
                <button
                  onClick={() => setActiveDrawerTab("tasks")}
                  className={`py-4 px-4 text-xs font-black border-b-2 transition-all ${
                    activeDrawerTab === "tasks" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Tasks ({selectedAssigner.tasks.length})
                </button>
                <button
                  onClick={() => setActiveDrawerTab("expenses")}
                  className={`py-4 px-4 text-xs font-black border-b-2 transition-all ${
                    activeDrawerTab === "expenses" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Employee Expenses ({selectedAssigner.expensesList.length})
                </button>
                <button
                  onClick={() => setActiveDrawerTab("addExpense")}
                  className={`py-4 px-4 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 ${
                    activeDrawerTab === "addExpense" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <FaPlus size={10} /> Add Expense
                </button>
              </div>

              {/* Drawer Content Body */}
              <div className="p-6 flex-1 overflow-y-auto">
                {activeDrawerTab === "tasks" && (
                  <div className="space-y-3">
                    {selectedAssigner.tasks.length === 0 ? (
                      <p className="text-slate-400 text-xs font-bold text-center py-8">No tasks found for this period</p>
                    ) : (
                      selectedAssigner.tasks.map((t, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="text-xs font-black text-slate-800">{t.title}</h5>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Cust: {t.customerName}</p>
                            </div>
                            <span className="text-xs font-black text-slate-800">₹{t.revenue.toLocaleString()}</span>
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold text-slate-500">
                            <span>Delivery: ₹{t.deliveryCharge} | Cost: ₹{t.costPrice}</span>
                            <span className={t.taskProfit >= 0 ? "text-emerald-600 font-extrabold" : "text-rose-600 font-extrabold"}>
                              Task Profit: ₹{t.taskProfit.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeDrawerTab === "expenses" && (
                  <div className="space-y-3">
                    {selectedAssigner.expensesList.length === 0 ? (
                      <p className="text-slate-400 text-xs font-bold text-center py-8">No manual employee expenses added yet</p>
                    ) : (
                      selectedAssigner.expensesList.map((exp) => (
                        <div key={exp.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black rounded-md uppercase">
                                {exp.category}
                              </span>
                              <h5 className="text-xs font-black text-slate-800">{exp.title}</h5>
                              {exp.status && (
                                <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase ${
                                  exp.status === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                }`}>
                                  {exp.status}
                                </span>
                              )}
                            </div>
                            {exp.remarks && <p className="text-[10px] font-bold text-slate-400 mt-1">{exp.remarks}</p>}
                            <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                              {format(new Date(exp.date), "dd MMM yyyy")} {exp.paymentMode ? `via ${exp.paymentMode}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-rose-600 mr-2">₹{exp.amount.toLocaleString()}</span>
                            <button
                              onClick={() => handleOpenEditExpense(exp)}
                              className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 bg-white rounded-lg border border-slate-200"
                              title="Edit expense"
                            >
                              <FaEdit size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 bg-white rounded-lg border border-slate-200"
                              title="Delete expense"
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeDrawerTab === "addExpense" && (
                  <form onSubmit={handleAddExpenseSubmit} className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-sm font-black text-slate-800 mb-2">Add Manual Expense for {selectedAssigner.name}</h4>
                    
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expense Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Monthly Salary, Travel Allowance"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700"
                        value={newExpense.title}
                        onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</label>
                        <select
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700"
                          value={newExpense.category}
                          onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                        >
                          <option value="Salary">Salary</option>
                          <option value="Incentive">Incentive / Commission</option>
                          <option value="Travel">Travel & Field Allowance</option>
                          <option value="Phone">Phone & Internet</option>
                          <option value="Bonus">Bonus</option>
                          <option value="Other">Other Overhead</option>
                        </select>
                      </div>

                      {newExpense.category === 'Other' && (
                        <div className="col-span-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Custom Category Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Office Supplies"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                            value={newExpense.customCategory || ''}
                            onChange={(e) => setNewExpense({ ...newExpense, customCategory: e.target.value })}
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount (₹)</label>
                        <input
                          type="number"
                          placeholder="e.g. 15000"
                          required
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Remarks (Optional)</label>
                      <textarea
                        placeholder="Additional details..."
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700"
                        rows={2}
                        value={newExpense.remarks}
                        onChange={(e) => setNewExpense({ ...newExpense, remarks: e.target.value })}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingExpense}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                    >
                      {submittingExpense ? "Saving Expense..." : "Save Expense"}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Expense Modal */}
      <AnimatePresence>
        {editingExpense && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingExpense(null)}
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
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black">
                    <FaEdit size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Edit Employee Expense</h3>
                    <p className="text-xs font-bold text-slate-400">{editingExpense.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingExpense(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <FaTimes size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveEditExpense} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expense Title</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                    value={editExpenseForm.title}
                    onChange={(e) => setEditExpenseForm({ ...editExpenseForm, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                      value={editExpenseForm.category}
                      onChange={(e) => setEditExpenseForm({ ...editExpenseForm, category: e.target.value })}
                    >
                      <option value="Salary">Salary</option>
                      <option value="Incentive">Incentive / Commission</option>
                      <option value="Travel">Travel & Field Allowance</option>
                      <option value="Phone">Phone & Internet</option>
                      <option value="Bonus">Bonus</option>
                      <option value="Other">Other Overhead</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                      value={editExpenseForm.amount}
                      onChange={(e) => setEditExpenseForm({ ...editExpenseForm, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</label>
                    <input
                      type="date"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                      value={editExpenseForm.date}
                      onChange={(e) => setEditExpenseForm({ ...editExpenseForm, date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                      value={editExpenseForm.status}
                      onChange={(e) => setEditExpenseForm({ ...editExpenseForm, status: e.target.value })}
                    >
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Unpaid</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Mode</label>
                    <input
                      type="text"
                      placeholder="e.g. Bank Transfer, UPI"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                      value={editExpenseForm.paymentMode}
                      onChange={(e) => setEditExpenseForm({ ...editExpenseForm, paymentMode: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ref / UTR No.</label>
                    <input
                      type="text"
                      placeholder="e.g. UTR12345"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 font-mono"
                      value={editExpenseForm.referenceNo}
                      onChange={(e) => setEditExpenseForm({ ...editExpenseForm, referenceNo: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Remarks</label>
                  <textarea
                    placeholder="Expense details..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                    rows={2}
                    value={editExpenseForm.remarks}
                    onChange={(e) => setEditExpenseForm({ ...editExpenseForm, remarks: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingEditExpense}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 mt-2"
                >
                  {savingEditExpense ? "Updating Expense..." : "Update Expense"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
