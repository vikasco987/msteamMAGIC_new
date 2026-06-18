"use client";

import React, { useEffect, useState } from "react";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Package, Edit2, Check, X } from "lucide-react";
import toast from "react-hot-toast";

type TaskStats = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  revenue: number;
  received: number;
  expense: number;
  profit: number;
  cashProfit: number;
  deliveryCharge: number;
  costPrice: number;
  customerName: string;
  awbNumber: string;
  softwareDuration: string;
};

type Summary = {
  totalRevenue: number;
  totalReceived: number;
  totalExpense: number;
  netProfit: number;
  cashProfit: number;
};

type ReportEntry = {
  dateKey: string;
  totalRevenue: number;
  totalReceived: number;
  totalExpense: number;
  netProfit: number;
  cashProfit: number;
  tasksCount: number;
};

type GeneralExpense = {
  id: string;
  title: string;
  amount: number;
  date: string;
  remarks: string | null;
  createdAt: string;
};

export default function ProfitLossDashboard() {
  const [tasks, setTasks] = useState<TaskStats[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [dayReport, setDayReport] = useState<ReportEntry[]>([]);
  const [weekReport, setWeekReport] = useState<ReportEntry[]>([]);
  const [monthReport, setMonthReport] = useState<ReportEntry[]>([]);
  const [generalExpenses, setGeneralExpenses] = useState<GeneralExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [calcBasis, setCalcBasis] = useState<"total" | "received">("total");
  const [activeTab, setActiveTab] = useState<"all" | "day" | "week" | "month" | "expenses">("all");
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ revenue: 0, received: 0, deliveryCharge: 0, costPrice: 0 });

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ title: "", amount: "", date: new Date().toISOString().split("T")[0], remarks: "" });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/profit-loss?month=${selectedMonth}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to load profit loss data");
        }
        const data = await res.json();
        setTasks(data.tasks || []);
        setSummary(data.summary);
        setDayReport(data.dayReport || []);
        setWeekReport(data.weekReport || []);
        setMonthReport(data.monthReport || []);
        setGeneralExpenses(data.generalExpenses || []);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedMonth]);

  const handleEdit = (task: TaskStats) => {
    setEditingId(task.id);
    setEditValues({
      revenue: task.revenue,
      received: task.received,
      deliveryCharge: task.deliveryCharge,
      costPrice: task.costPrice
    });
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSave = async (taskId: string) => {
    const toastId = toast.loading("Saving changes...");
    try {
      const res = await fetch("/api/profit-loss", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          revenue: editValues.revenue,
          received: editValues.received,
          deliveryCharge: editValues.deliveryCharge,
          costPrice: editValues.costPrice
        })
      });

      if (!res.ok) {
        throw new Error("Failed to update task");
      }

      // Optimistic UI Update
      setTasks(prevTasks => prevTasks.map(t => {
        if (t.id === taskId) {
          const newExp = editValues.deliveryCharge + editValues.costPrice;
          const newProfit = editValues.revenue - newExp;
          const newCashProfit = editValues.received - newExp;
          return {
            ...t,
            revenue: editValues.revenue,
            received: editValues.received,
            deliveryCharge: editValues.deliveryCharge,
            costPrice: editValues.costPrice,
            expense: newExp,
            profit: newProfit,
            cashProfit: newCashProfit
          };
        }
        return t;
      }));

      // Update Summary Optimistically
      setSummary(prev => {
        if (!prev) return prev;
        const oldTask = tasks.find(t => t.id === taskId);
        if (!oldTask) return prev;
        
        const oldExp = oldTask.expense;
        const oldRev = oldTask.revenue;
        const oldRec = oldTask.received;
        const newExp = editValues.deliveryCharge + editValues.costPrice;
        
        const revDiff = editValues.revenue - oldRev;
        const recDiff = editValues.received - oldRec;
        const expDiff = newExp - oldExp;

        return {
          totalRevenue: prev.totalRevenue + revDiff,
          totalReceived: prev.totalReceived + recDiff,
          totalExpense: prev.totalExpense + expDiff,
          netProfit: prev.netProfit + (revDiff - expDiff),
          cashProfit: prev.cashProfit + (recDiff - expDiff)
        };
      });

      setEditingId(null);
      toast.success("Task updated successfully", { id: toastId });
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Adding expense...");
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseForm)
      });
      if (!res.ok) throw new Error("Failed to add expense");
      
      toast.success("Expense added successfully!", { id: toastId });
      setShowExpenseModal(false);
      setExpenseForm({ title: "", amount: "", date: new Date().toISOString().split("T")[0], remarks: "" });
      
      // Reload to recalculate reports and fetch new expenses
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  const handleExpenseDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    const toastId = toast.loading("Deleting expense...");
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete expense");
      toast.success("Expense deleted successfully!", { id: toastId });
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  const activeProfit = summary ? (calcBasis === "total" ? summary.netProfit : summary.cashProfit) : 0;
  const isProfit = activeProfit >= 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">💸 Profit & Loss Dashboard</h1>
          <p className="text-slate-500 font-medium">Track expenses and revenue for Printer and Software tasks.</p>
        </div>
        
        {/* Toggle Switch, Filter & Add Expense Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Time</option>
            {/* Generate last 12 months dynamically */}
            {Array.from({ length: 12 }).map((_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              const val = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
              const label = d.toLocaleDateString('default', { month: 'short', year: 'numeric' });
              return <option key={val} value={val}>{label}</option>;
            })}
          </select>

          <button  
            onClick={() => setShowExpenseModal(true)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-[14px] shadow-sm transition-colors text-sm flex items-center gap-2"
          >
            <Package size={16} />
            Add Manual Expense
          </button>

          <div className="bg-slate-100 p-1.5 rounded-2xl inline-flex relative shadow-inner">
            <button 
              onClick={() => setCalcBasis("total")}
              className={`relative z-10 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${calcBasis === "total" ? "text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Total Amount Basis
            </button>
            <button 
              onClick={() => setCalcBasis("received")}
              className={`relative z-10 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${calcBasis === "received" ? "text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Received Basis
            </button>
            {/* Animated Background Pill */}
            <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm transition-transform duration-300 ease-out ${calcBasis === "total" ? "translate-x-0" : "translate-x-[calc(100%+12px)]"}`} />
          </div>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{calcBasis === "total" ? "Total Revenue" : "Total Received"}</p>
              <h2 className="text-3xl font-black text-slate-800">₹{(calcBasis === "total" ? summary.totalRevenue : summary.totalReceived).toLocaleString()}</h2>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
              <Package size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Expenses</p>
              <h2 className="text-3xl font-black text-slate-800">₹{summary.totalExpense.toLocaleString()}</h2>
            </div>
          </div>

          <div className={`border rounded-[2rem] p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-all ${isProfit ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200' : 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-200'}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isProfit ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200/50' : 'bg-rose-600 text-white shadow-lg shadow-rose-200/50'}`}>
              {isProfit ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isProfit ? 'text-indigo-500' : 'text-rose-500'}`}>Net {isProfit ? 'Profit' : 'Loss'} ({calcBasis === "total" ? "Accrued" : "Cash"})</p>
              <h2 className={`text-3xl font-black ${isProfit ? 'text-indigo-900' : 'text-rose-900'}`}>
                {isProfit ? '+' : '-'}₹{Math.abs(activeProfit).toLocaleString()}
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b mt-8 overflow-x-auto pb-1 mb-6">
        {[
          { label: "All Tasks", key: "all" },
          { label: "Day Report", key: "day" },
          { label: "Week Report", key: "week" },
          { label: "Month Report", key: "month" },
          { label: "Other Expenses", key: "expenses" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 font-bold text-sm border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.key ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "all" && (
      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Task Breakdown</h3>
          <span className="text-xs font-medium text-slate-400">{tasks.length} items found</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Task Info</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">{calcBasis === "total" ? "Revenue" : "Received"}</th>
                <th className="px-6 py-4">Expenses</th>
                <th className="px-6 py-4">Profit/Loss</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    <Package className="mx-auto mb-3 opacity-20" size={40} />
                    No Printer or Software tasks found yet.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 mb-1 line-clamp-1">{task.title}</div>
                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                        {task.awbNumber && <span className="bg-slate-100 text-slate-500 px-1.5 rounded-md">AWB: {task.awbNumber}</span>}
                        {task.softwareDuration && <span className="bg-slate-100 text-slate-500 px-1.5 rounded-md">{task.softwareDuration}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-600">{task.customerName}</td>
                    <td className="px-6 py-4">
                      {task.title.includes("Software") ? (
                        <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">P + Software</span>
                      ) : (
                        <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">Printer Setup</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === task.id ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-slate-400 w-10">Total:</span>
                            <span className="text-slate-500 font-bold">₹</span>
                            <input type="number" className="w-16 bg-white border border-indigo-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={editValues.revenue} onChange={(e) => setEditValues({...editValues, revenue: Number(e.target.value)})} />
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-slate-400 w-10">Recv:</span>
                            <span className="text-slate-500 font-bold">₹</span>
                            <input type="number" className="w-16 bg-white border border-indigo-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={editValues.received} onChange={(e) => setEditValues({...editValues, received: Number(e.target.value)})} />
                          </div>
                        </div>
                      ) : (
                        <span className="font-black text-slate-700">₹{(calcBasis === "total" ? task.revenue : task.received).toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === task.id ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-slate-400 w-8">Cost:</span>
                            <input type="number" className="w-16 bg-white border border-rose-200 rounded-lg px-2 py-1 text-xs focus:outline-none" value={editValues.costPrice} onChange={e => setEditValues({...editValues, costPrice: Number(e.target.value)})} />
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-slate-400 w-8">Del:</span>
                            <input type="number" className="w-16 bg-white border border-rose-200 rounded-lg px-2 py-1 text-xs focus:outline-none" value={editValues.deliveryCharge} onChange={e => setEditValues({...editValues, deliveryCharge: Number(e.target.value)})} />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="font-black text-rose-600">₹{task.expense.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400 mt-1 font-medium whitespace-nowrap">
                            (Cost: ₹{task.costPrice} + Del: ₹{task.deliveryCharge})
                          </div>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === task.id ? (
                        <span className="text-xs text-slate-400 italic">Auto-calculated...</span>
                      ) : (
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-sm ${(calcBasis === "total" ? task.profit : task.cashProfit) >= 0 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
                          {(calcBasis === "total" ? task.profit : task.cashProfit) >= 0 ? '+' : '-'}₹{Math.abs(calcBasis === "total" ? task.profit : task.cashProfit).toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingId === task.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleSave(task.id)} className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 transition-colors">
                            <Check size={14} />
                          </button>
                          <button onClick={handleCancel} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => handleEdit(task)} className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all ml-auto opacity-0 group-hover:opacity-100">
                          <Edit2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeTab === "expenses" && (
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Other Manual Expenses</h3>
            <span className="text-xs font-medium text-slate-400">{generalExpenses.length} items found</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Expense Title</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Remarks / Employee Name</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {generalExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No manual expenses found.
                    </td>
                  </tr>
                ) : (
                  generalExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-800">{exp.title}</td>
                      <td className="px-6 py-4 text-slate-600">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-black text-rose-600">₹{exp.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-500 italic text-xs">{exp.remarks || "-"}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleExpenseDelete(exp.id)} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors ml-auto opacity-0 group-hover:opacity-100">
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab !== "all" && activeTab !== "expenses" && (
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">
              {activeTab === "day" ? "Daily" : activeTab === "week" ? "Weekly" : "Monthly"} Report
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Total Tasks</th>
                  <th className="px-6 py-4">{calcBasis === "total" ? "Total Revenue" : "Total Received"}</th>
                  <th className="px-6 py-4">Total Expenses</th>
                  <th className="px-6 py-4">Profit/Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(activeTab === "day" ? dayReport : activeTab === "week" ? weekReport : monthReport).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No data available for this report.
                    </td>
                  </tr>
                ) : (
                  (activeTab === "day" ? dayReport : activeTab === "week" ? weekReport : monthReport).map((report) => (
                    <tr key={report.dateKey} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{report.dateKey}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{report.tasksCount} tasks</td>
                      <td className="px-6 py-4 font-black text-slate-700">
                        ₹{(calcBasis === "total" ? report.totalRevenue : report.totalReceived).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-black text-rose-600">
                        ₹{report.totalExpense.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-sm ${(calcBasis === "total" ? report.netProfit : report.cashProfit) >= 0 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
                          {(calcBasis === "total" ? report.netProfit : report.cashProfit) >= 0 ? '+' : '-'}₹{Math.abs(calcBasis === "total" ? report.netProfit : report.cashProfit).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Package className="text-rose-500" size={20} />
                Add Manual Expense
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Expense Title</label>
                <input required type="text" placeholder="e.g. Employee Salary" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all font-medium text-slate-800" value={expenseForm.title} onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amount (₹)</label>
                  <input required type="number" placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all font-black text-slate-800" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date</label>
                  <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all font-medium text-slate-800" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Remarks / Employee Name</label>
                <input type="text" placeholder="e.g. Paid to Rahul" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all font-medium text-slate-800" value={expenseForm.remarks} onChange={e => setExpenseForm({...expenseForm, remarks: e.target.value})} />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
