"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  BarChart3, Calendar, User, Search, IndianRupee, ArrowLeft, 
  RefreshCcw, Filter, Download, ChevronRight, TrendingUp,
  Clock, ShieldCheck, LayoutGrid, Users, CalendarDays, Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format, isToday, isThisMonth, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";

const API_BASE_URL = "/api/cashfree";

const PaymentAnalyticsPage = () => {
  const { isLoaded, user: currentUser } = useUser();
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [timeFilter, setTimeFilter] = useState("overall"); // today, month, overall, custom
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (isLoaded && currentUser) {
      const userRole = String(currentUser.publicMetadata?.role || "user").toLowerCase();
      
      // Check for dynamic permission
      fetch(`/api/admin/sidebar/per-role?role=${userRole}`)
        .then(res => res.json())
        .then(data => {
          if (data.sidebarItems && data.sidebarItems.includes('Payment Analytics')) {
            setHasPermission(true);
            fetchData();
          } else {
            setHasPermission(false);
            setLoading(false);
          }
        })
        .catch(err => {
          console.error("Permission check error:", err);
          setHasPermission(false);
          setLoading(false);
        });
    }
  }, [isLoaded, currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/analytics`);
      if (res.data.success) {
        setLinks(res.data.links);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error("Only MASTER can access analytics");
      } else {
        toast.error("Failed to load analytics data");
      }
    } finally {
      setLoading(false);
    }
  };

  // Filtering Logic
  const getFilteredLinks = () => {
    return links.filter(link => {
      const date = new Date(link.createdAt);
      if (timeFilter === "today") return isToday(date);
      if (timeFilter === "month") return isThisMonth(date);
      if (timeFilter === "custom" && startDate && endDate) {
        return isWithinInterval(date, {
          start: startOfDay(new Date(startDate)),
          end: endOfDay(new Date(endDate))
        });
      }
      return true;
    });
  };

  const filteredLinks = getFilteredLinks();

  // Group by User
  const userStats = filteredLinks.reduce((acc: any, link: any) => {
    const creator = link.createdBy || "Unknown Admin";
    if (!acc[creator]) {
      acc[creator] = { 
        name: creator, 
        totalLinks: 0, 
        paid: 0, 
        pending: 0, 
        totalAmount: 0,
        collectedAmount: 0 
      };
    }
    acc[creator].totalLinks += 1;
    acc[creator].totalAmount += link.totalAmount;
    if (link.status?.toLowerCase() === "paid") {
      acc[creator].paid += 1;
      acc[creator].collectedAmount += link.amount;
    } else {
      acc[creator].pending += 1;
    }
    return acc;
  }, {});

  const userStatsArray = Object.values(userStats);

  const overallStats = {
    totalRevenue: filteredLinks.reduce((acc, curr) => acc + (curr.status?.toLowerCase() === 'paid' ? curr.amount : 0), 0),
    totalLinks: filteredLinks.length,
    successRate: filteredLinks.length > 0 ? Math.round((filteredLinks.filter(h => h.status?.toLowerCase() === "paid").length / filteredLinks.length) * 100) : 0
  };

  if (!isLoaded || hasPermission === null) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
       <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Verifying Permissions...</p>
       </div>
    </div>
  );

  if (hasPermission === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/30 rounded-[2rem] flex items-center justify-center text-rose-600 mb-6 shadow-xl">
          <ShieldCheck size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Access Restricted</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md font-medium text-sm">
          You do not have permission to view Payment Analytics. Please contact your administrator to grant access via Access Control settings.
        </p>
        <Link 
          href="/payment-portal"
          className="mt-8 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
        >
          Back to Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] selection:bg-indigo-500 selection:text-white">
      {/* Background Mesh */}
      <div className="fixed inset-0 pointer-events-none opacity-30 dark:opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/20 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-12 pb-24 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
          <div className="space-y-4">
            <Link 
              href="/payment-portal"
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-indigo-600 transition-colors group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Portal
            </Link>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                  <BarChart3 size={24} />
                </div>
              </div>
              <div>
                <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">User Analytics</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Performance monitoring & collection reporting</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Time Filter Pill */}
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-[1.75rem] border border-slate-200 dark:border-slate-800 flex gap-1 shadow-xl">
              {['today', 'month', 'overall', 'custom'].map((f) => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all relative overflow-hidden ${
                    timeFilter === f ? 'text-white' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {timeFilter === f && (
                    <motion.div layoutId="tab" className="absolute inset-0 bg-indigo-600 shadow-lg" />
                  )}
                  <span className="relative z-10">{f}</span>
                </button>
              ))}
            </div>
            
            {timeFilter === 'custom' && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-[1.75rem] border border-slate-200 dark:border-slate-800 shadow-xl animate-in slide-in-from-right-4 duration-300">
                <input 
                  type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent px-4 py-2 text-[10px] font-black uppercase outline-none text-slate-600 dark:text-slate-300"
                />
                <span className="text-slate-300">/</span>
                <input 
                  type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent px-4 py-2 text-[10px] font-black uppercase outline-none text-slate-600 dark:text-slate-300"
                />
              </div>
            )}

            <button 
              onClick={fetchData}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-all shadow-xl active:scale-90"
            >
              <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Global Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <IndianRupee size={80} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-xl">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Total Collection</p>
                <h2 className="text-3xl font-black tracking-tighter">₹{overallStats.totalRevenue.toLocaleString()}</h2>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 p-4 text-indigo-500/5 group-hover:scale-110 transition-transform">
              <LayoutGrid size={80} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Links Generated</p>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{overallStats.totalLinks}</h2>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 text-emerald-500/5 group-hover:scale-110 transition-transform">
              <ShieldCheck size={80} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center">
                <Users size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Success Velocity</p>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{overallStats.successRate}%</h2>
              </div>
            </div>
          </motion.div>
        </div>

        {/* User Breakdown Table */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-3">
              <Users size={20} className="text-indigo-600" /> Staff Performance
            </h3>
            <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Download Report</button>
          </div>

          {loading ? (
            <div className="py-40 flex flex-col items-center gap-6">
              <Loader2 className="animate-spin text-indigo-500" size={48} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse">Analyzing Nodes...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                    <th className="px-8 py-5 text-left">Team Member</th>
                    <th className="px-6 py-5 text-center">Links</th>
                    <th className="px-6 py-5 text-center">Paid</th>
                    <th className="px-6 py-5 text-center">Pending</th>
                    <th className="px-6 py-5 text-center">Velocity</th>
                    <th className="px-8 py-5 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {userStatsArray.length > 0 ? (
                    userStatsArray.map((stat: any, idx) => (
                      <motion.tr 
                        key={idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm">
                              {stat.name[0]}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 dark:text-white text-base group-hover:text-indigo-600 transition-colors">{stat.name}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Manager</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center font-black text-slate-900 dark:text-white text-base">{stat.totalLinks}</td>
                        <td className="px-6 py-6 text-center">
                          <span className="px-3 py-1 bg-emerald-100/50 text-emerald-600 rounded-lg font-black text-[9px]">{stat.paid}</span>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <span className="px-3 py-1 bg-amber-100/50 text-amber-600 rounded-lg font-black text-[9px]">{stat.pending}</span>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-600" 
                                style={{ width: `${Math.round((stat.paid / stat.totalLinks) * 100)}%` }} 
                              />
                            </div>
                            <span className="text-[9px] font-black text-slate-400">{Math.round((stat.paid / stat.totalLinks) * 100)}%</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <p className="font-black text-slate-900 dark:text-white text-xl tracking-tighter">₹{stat.collectedAmount.toLocaleString()}</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Target: ₹{stat.totalAmount.toLocaleString()}</p>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-60 text-center">
                        <p className="text-slate-300 font-black uppercase tracking-[0.5em]">No Data For This Range</p>
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

export default PaymentAnalyticsPage;
