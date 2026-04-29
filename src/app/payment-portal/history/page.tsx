"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { 
  ArrowLeft, Search, Calendar, User, Zap, Copy, FileText, 
  RefreshCcw, Filter, Download, ExternalLink, IndianRupee, Clock,
  Smartphone, Mail, ChevronRight, LayoutGrid, ShieldCheck
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";

const API_BASE_URL = "/api/cashfree";

const PaymentHistoryPage = () => {
  const { isLoaded, user: currentUser } = useUser();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [syncingAll, setSyncingAll] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  // Auto-sync first 10 pending links on load
  useEffect(() => {
    if (history.length > 0) {
      const pendingLinks = history.filter(h => h.status?.toLowerCase() === "pending").slice(0, 10);
      pendingLinks.forEach(link => handleSyncStatus(link.orderId));
    }
  }, [history.length]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/get-all-links`);
      if (res.data.success) {
        setHistory(res.data.links);
      }
    } catch (err: any) {
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncStatus = async (orderId: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/check-status?order_id=${orderId}`);
      if (res.data.success) {
        setHistory(prev => prev.map(item => 
          item.orderId === orderId ? { ...item, status: res.data.status } : item
        ));
      }
    } catch (err) {
      console.error("Sync error:", err);
    }
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.email?.toLowerCase().includes(search.toLowerCase()) ||
      item.phone?.includes(search) ||
      item.orderId?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || item.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesCreator = creatorFilter === "all" || item.createdBy === creatorFilter;

    return matchesSearch && matchesStatus && matchesCreator;
  });

  const uniqueCreators = Array.from(new Set(history.map(h => h.createdBy).filter(Boolean)));

  const stats = {
    total: history.length,
    paid: history.filter(h => h.status?.toLowerCase() === "paid").length,
    pending: history.filter(h => h.status?.toLowerCase() === "pending").length,
    totalAmount: history.reduce((acc, curr) => acc + (curr.status?.toLowerCase() === 'paid' ? curr.amount : 0), 0)
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] selection:bg-indigo-500 selection:text-white">
      {/* Mesh Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/20 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-12 pb-24 relative z-10">
        
        {/* Top Navigation */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
          <div className="space-y-4">
            <Link 
              href="/payment-portal"
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-indigo-600 transition-colors group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Terminal
            </Link>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                  <LayoutGrid size={24} />
                </div>
              </div>
              <div>
                <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">Transaction Ledger</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Enterprise financial tracking & real-time synchronization</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group">
              <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-14 pr-10 py-5 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none font-bold text-sm focus:border-indigo-500 appearance-none shadow-xl cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid Only</option>
                <option value="pending">Pending Only</option>
                <option value="failed">Failed Only</option>
              </select>
            </div>

            <div className="relative group">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <select 
                value={creatorFilter}
                onChange={(e) => setCreatorFilter(e.target.value)}
                className="pl-14 pr-10 py-5 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none font-bold text-sm focus:border-indigo-500 appearance-none shadow-xl cursor-pointer"
              >
                <option value="all">All Creators</option>
                {uniqueCreators.map((creator: any) => (
                  <option key={creator} value={creator}>{creator}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search ledger..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-14 pr-8 py-5 w-full lg:w-[300px] rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none font-bold text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-xl"
              />
            </div>
            <button 
              onClick={fetchHistory}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-all shadow-xl active:scale-90"
            >
              <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            <button className="px-8 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
              <Download size={18} /> Export Sheet
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Revenue Generated', value: `₹${stats.totalAmount.toLocaleString()}`, icon: IndianRupee, color: 'emerald' },
            { label: 'Total Links', value: stats.total, icon: FileText, color: 'indigo' },
            { label: 'Paid Orders', value: stats.paid, icon: ShieldCheck, color: 'indigo' },
            { label: 'Pending Sync', value: stats.pending, icon: Clock, color: 'amber' }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 p-4 text-${stat.color}-500/10 group-hover:scale-110 transition-transform`}>
                <stat.icon size={100} />
              </div>
              <div className="relative z-10 space-y-4">
                <div className={`w-12 h-12 bg-${stat.color}-50 dark:bg-${stat.color}-900/30 text-${stat.color}-600 rounded-2xl flex items-center justify-center shadow-sm`}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{stat.label}</p>
                  <h4 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</h4>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Data Table */}
        <div className="bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          {loading ? (
            <div className="py-60 flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-indigo-100 dark:border-indigo-900 rounded-full" />
                <div className="w-24 h-24 border-t-4 border-indigo-600 rounded-full absolute top-0 animate-spin" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse">Loading Ledger...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
                    <th className="px-12 py-8 text-left">Generation Node</th>
                    <th className="px-8 py-8 text-left">Client Profile</th>
                    <th className="px-8 py-8 text-left">Billing Service</th>
                    <th className="px-8 py-8 text-left">Financials</th>
                    <th className="px-8 py-8 text-left">Real-time Status</th>
                    <th className="px-12 py-8 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <AnimatePresence>
                    {filteredHistory.map((link, idx) => (
                      <motion.tr 
                        key={link.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group"
                      >
                        <td className="px-12 py-10">
                          <div className="flex flex-col gap-2">
                            <span className="font-black text-slate-900 dark:text-white text-sm">{format(new Date(link.createdAt), "dd MMM, yyyy")}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{format(new Date(link.createdAt), "hh:mm a")}</span>
                            <div className="flex items-center gap-2 mt-3 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg w-fit border border-indigo-100 dark:border-indigo-800/50">
                              <User size={12} className="text-indigo-600" />
                              <span className="text-[9px] text-indigo-600 font-black uppercase tracking-widest">{link.createdBy || "Admin"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-10">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-black text-slate-900 dark:text-white text-base group-hover:text-indigo-600 transition-colors">{link.name}</span>
                            <div className="flex items-center gap-2 text-slate-400">
                              <Smartphone size={12} />
                              <span className="text-[10px] font-bold tracking-tight">{link.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                              <Mail size={12} />
                              <span className="text-[10px] font-bold tracking-tight">{link.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-10">
                          <span className="inline-block text-[10px] font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-5 py-2.5 rounded-2xl uppercase tracking-widest leading-relaxed border border-slate-200/50 dark:border-slate-700/50">
                            {link.purpose}
                          </span>
                        </td>
                        <td className="px-8 py-10">
                          <div className="flex flex-col gap-1">
                            <span className="font-black text-slate-900 dark:text-white text-2xl tracking-tighter">₹{link.amount.toLocaleString()}</span>
                            {link.totalAmount > link.amount && (
                              <div className="flex flex-col mt-2">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter line-through opacity-40">Total: ₹{link.totalAmount.toLocaleString()}</span>
                                <span className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em] mt-0.5">Due: ₹{(link.totalAmount - link.amount).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-10">
                          <div className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.25em] shadow-sm border w-fit flex items-center gap-3 ${
                            link.status?.toLowerCase() === "paid" ? "bg-emerald-100/50 text-emerald-600 border-emerald-200/50" : 
                            link.status?.toLowerCase() === "pending" ? "bg-amber-100/50 text-amber-600 border-amber-200/50" : 
                            "bg-rose-100/50 text-rose-600 border-rose-200/50"
                          }`}>
                            <div className={`w-2 h-2 rounded-full shadow-[0_0_12px] ${link.status?.toLowerCase() === 'paid' ? 'bg-emerald-500 shadow-emerald-500 animate-pulse' : 'bg-amber-500 shadow-amber-500'}`} />
                            {link.status}
                          </div>
                        </td>
                        <td className="px-12 py-10 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {link.status?.toLowerCase() === "pending" && (
                              <button 
                                onClick={() => handleSyncStatus(link.orderId)}
                                className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-[1.25rem] hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 dark:border-indigo-800 group/btn"
                                title="Sync Order Status"
                              >
                                <Zap size={18} className="group-hover/btn:rotate-12 transition-transform" />
                              </button>
                            )}
                            <button 
                              onClick={() => { 
                                navigator.clipboard.writeText(link.paymentLink); 
                                toast.success("Secure Link Copied!");
                              }}
                              className="p-4 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-[1.25rem] transition-all shadow-sm border border-slate-100 dark:border-slate-700 active:scale-90"
                              title="Copy Payment Link"
                            >
                              <Copy size={18} />
                            </button>
                            <Link 
                              href={link.paymentLink}
                              target="_blank"
                              className="p-4 bg-white dark:bg-slate-800 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-[1.25rem] transition-all shadow-sm border border-slate-100 dark:border-slate-700 active:scale-90"
                            >
                              <ExternalLink size={18} />
                            </Link>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-60 text-center">
                        <div className="flex flex-col items-center gap-6 opacity-10">
                          <LayoutGrid size={120} />
                          <p className="font-black text-lg uppercase tracking-[1em]">Ledger Empty</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PaymentHistoryPage;
