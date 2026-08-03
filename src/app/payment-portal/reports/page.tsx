"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  BarChart3, Calendar, CalendarDays, CalendarRange, ArrowLeft, RefreshCcw, 
  Search, ExternalLink, Copy, Check, ShieldCheck, Clock, IndianRupee, 
  TrendingUp, Users, Loader2, ChevronRight, X, Smartphone, Zap
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

const API_BASE_URL = "/api/cashfree";

const PaymentReportsPage = () => {
  const [activeTab, setActiveTab] = useState<"day" | "week" | "month">("day");
  const [reports, setReports] = useState<any>({ dayOnDay: [], weekOnWeek: [], monthOnMonth: [] });
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/get-reports`);
      if (res.data.success) {
        setReports(res.data.reports);
      }
    } catch (err: any) {
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    toast.success("Link copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSyncStatus = async (orderId: string, groupKey: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/check-status?order_id=${orderId}`);
      if (res.data.success) {
        toast.success(`Synced Status: ${res.data.status}`);
        // Locally update status in selectedGroup links
        if (selectedGroup && selectedGroup.key === groupKey) {
          const updatedLinks = selectedGroup.links.map((lnk: any) => 
            lnk.orderId === orderId ? { ...lnk, status: res.data.status } : lnk
          );
          
          // Re-calculate paidCount and totalCollected for selected group
          const paidCount = updatedLinks.filter((lnk: any) => lnk.status?.toLowerCase() === "paid").length;
          const totalCollected = updatedLinks
            .filter((lnk: any) => lnk.status?.toLowerCase() === "paid")
            .reduce((acc: number, curr: any) => acc + curr.amount, 0);

          setSelectedGroup({
            ...selectedGroup,
            paidCount,
            totalCollected,
            links: updatedLinks
          });
        }
        // Refresh all reports
        const repRes = await axios.get(`${API_BASE_URL}/get-reports`);
        if (repRes.data.success) {
          setReports(repRes.data.reports);
        }
      }
    } catch (err) {
      console.error("Status Sync failed:", err);
    }
  };

  const getActiveData = () => {
    if (activeTab === "day") return reports.dayOnDay || [];
    if (activeTab === "week") return reports.weekOnWeek || [];
    return reports.monthOnMonth || [];
  };

  const activeData = getActiveData();

  // Overall Statistics from Reports
  const getOverallStats = () => {
    const list = reports.dayOnDay || [];
    const totalBilled = list.reduce((acc: number, curr: any) => acc + curr.totalBilled, 0);
    const totalCollected = list.reduce((acc: number, curr: any) => acc + curr.totalCollected, 0);
    const totalLinks = list.reduce((acc: number, curr: any) => acc + curr.totalLinks, 0);
    const paidCount = list.reduce((acc: number, curr: any) => acc + curr.paidCount, 0);
    const successRate = totalLinks > 0 ? Math.round((paidCount / totalLinks) * 100) : 0;

    return { totalBilled, totalCollected, totalLinks, successRate };
  };

  const overallStats = getOverallStats();

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] selection:bg-indigo-500 selection:text-white pb-24">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none opacity-30 dark:opacity-20 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/20 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-12 relative z-10">
        
        {/* Navigation back and header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
          <div className="space-y-4">
            <Link 
              href="/payment-portal"
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-indigo-600 transition-colors group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Portal
            </Link>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                  <BarChart3 size={24} />
                </div>
              </div>
              <div>
                <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">Payment Reports</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Drilldown statistics grouped by Day, Week, and Month</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Tab switchers */}
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-[1.75rem] border border-slate-200 dark:border-slate-800 flex gap-1 shadow-xl">
              {[
                { id: "day", label: "Day-on-Day", icon: Calendar },
                { id: "week", label: "Week-on-Week", icon: CalendarDays },
                { id: "month", label: "Month-on-Month", icon: CalendarRange }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all relative overflow-hidden flex items-center gap-2 ${
                    activeTab === tab.id ? 'text-white' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.div layoutId="activeTabPill" className="absolute inset-0 bg-indigo-600 shadow-lg shadow-indigo-500/20" />
                  )}
                  <tab.icon size={12} className="relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={fetchReports}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-all shadow-xl active:scale-90"
            >
              <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Total Billed Value", value: `₹${overallStats.totalBilled.toLocaleString()}`, icon: IndianRupee, color: "indigo" },
            { label: "Amount Collected", value: `₹${overallStats.totalCollected.toLocaleString()}`, icon: TrendingUp, color: "emerald" },
            { label: "Total Generated Links", value: overallStats.totalLinks, icon: Clock, color: "indigo" },
            { label: "Collection Rate", value: `${overallStats.successRate}%`, icon: ShieldCheck, color: "emerald" }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 p-4 text-${stat.color}-500/5 group-hover:scale-110 transition-transform`}>
                <stat.icon size={90} />
              </div>
              <div className="relative z-10 space-y-4">
                <div className={`w-10 h-10 bg-${stat.color}-50 dark:bg-${stat.color}-900/30 text-${stat.color}-600 rounded-xl flex items-center justify-center`}>
                  <stat.icon size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{stat.label}</p>
                  <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">{stat.value}</h4>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Report List view */}
        <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-3">
              <CalendarRange size={20} className="text-indigo-600" /> Aggregated Performance Details
            </h3>
          </div>

          {loading ? (
            <div className="py-56 flex flex-col items-center gap-6">
              <Loader2 className="animate-spin text-indigo-500" size={48} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse">Assembling report nodes...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                    <th className="px-10 py-6">Period</th>
                    <th className="px-8 py-6 text-center">Links Generated</th>
                    <th className="px-8 py-6 text-center">Paid Counts</th>
                    <th className="px-8 py-6 text-center">Pending Counts</th>
                    <th className="px-8 py-6 text-right">Total Billed</th>
                    <th className="px-8 py-6 text-right">Total Collected</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeData.length > 0 ? (
                    activeData.map((row: any, idx: number) => (
                      <motion.tr
                        key={row.key}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                        onClick={() => setSelectedGroup(row)}
                      >
                        <td className="px-10 py-7 font-black text-slate-900 dark:text-white text-base">
                          {row.label}
                        </td>
                        <td className="px-8 py-7 text-center font-black text-slate-900 dark:text-white text-base">
                          {row.totalLinks}
                        </td>
                        <td className="px-8 py-7 text-center">
                          <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl font-black text-[10px]">
                            {row.paidCount} Paid
                          </span>
                        </td>
                        <td className="px-8 py-7 text-center">
                          <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 rounded-xl font-black text-[10px]">
                            {row.pendingCount} Pending
                          </span>
                        </td>
                        <td className="px-8 py-7 text-right font-black text-slate-500 dark:text-slate-400 text-base">
                          ₹{row.totalBilled.toLocaleString()}
                        </td>
                        <td className="px-8 py-7 text-right font-black text-emerald-600 dark:text-emerald-400 text-lg">
                          ₹{row.totalCollected.toLocaleString()}
                        </td>
                        <td className="px-10 py-7 text-right">
                          <div className="flex items-center justify-end text-slate-400 hover:text-indigo-600 transition-colors">
                            <span className="text-[10px] font-black uppercase tracking-wider mr-1 group-hover:translate-x-[-4px] transition-transform">Drilldown</span>
                            <ChevronRight size={16} />
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-44 text-center">
                        <p className="text-slate-300 font-black uppercase tracking-[0.5em]">No report data gathered</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Drilldown Slide-out Drawer Detail View */}
      <AnimatePresence>
        {selectedGroup && (
          <>
            {/* Backdrop Blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGroup(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
            />

            {/* Slide-out Drawer Container */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[700px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-8 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">REPORT DRILLDOWN</span>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">{selectedGroup.label}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Aggregate Summary Block in Drawer */}
                <div className="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800">
                  <div className="text-center space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">LINKS</span>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{selectedGroup.totalLinks}</p>
                  </div>
                  <div className="text-center space-y-1 border-x border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">BILLED</span>
                    <p className="text-2xl font-black text-slate-950 dark:text-white">₹{selectedGroup.totalBilled.toLocaleString()}</p>
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider block">COLLECTED</span>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{selectedGroup.totalCollected.toLocaleString()}</p>
                  </div>
                </div>

                {/* Link list */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Link Ledger Logs</h4>
                  
                  <div className="space-y-4">
                    {selectedGroup.links && selectedGroup.links.length > 0 ? (
                      selectedGroup.links.map((link: any) => (
                        <div 
                          key={link.id}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-3">
                              <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{link.createdBy || "Admin"}</span>
                                <h5 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{link.name}</h5>
                              </div>
                              
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-400 text-xs font-medium">
                                <span className="flex items-center gap-1"><Smartphone size={12} /> {link.phone}</span>
                                <span>Purpose: <strong>{link.purpose}</strong></span>
                              </div>

                              <div className="flex items-center gap-4 pt-1">
                                <span className="text-base font-black text-slate-950 dark:text-white">Collected: ₹{link.amount}</span>
                                {link.totalAmount > link.amount && (
                                  <span className="text-xs font-bold text-amber-500 uppercase">Due: ₹{link.totalAmount - link.amount}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-3 shrink-0">
                              <span className={`px-3 py-1 text-[9px] font-black rounded-lg uppercase tracking-wider ${
                                link.status?.toLowerCase() === "paid" ? "bg-emerald-100/50 text-emerald-600" :
                                link.status?.toLowerCase() === "pending" ? "bg-amber-100/50 text-amber-600" :
                                "bg-rose-100/50 text-rose-600"
                              }`}>
                                {link.status}
                              </span>

                              <div className="flex items-center gap-1.5 mt-2">
                                {link.status?.toLowerCase() === "pending" && (
                                  <button
                                    onClick={() => handleSyncStatus(link.orderId, selectedGroup.key)}
                                    className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-xl hover:bg-indigo-650 hover:text-white transition-all shadow-sm border border-indigo-100 dark:border-indigo-900/50"
                                    title="Sync Status"
                                  >
                                    <Zap size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleCopy(link.paymentLink, link.id)}
                                  className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-650 rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-800"
                                  title="Copy secure link"
                                >
                                  {copiedId === link.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                </button>
                                <Link
                                  href={link.paymentLink}
                                  target="_blank"
                                  className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-600 rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-800"
                                >
                                  <ExternalLink size={14} />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-xs font-bold text-slate-400 py-10">No detailed logs found</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentReportsPage;
