"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { 
  ArrowLeft, Search, Calendar, User, Zap, Copy, FileText, 
  RefreshCcw, Filter, Download
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import Link from "next/link";
import { motion } from "framer-motion";

const API_BASE_URL = "/api/cashfree";

const PaymentHistoryPage = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/get-all-links`);
      if (res.data.success) setHistory(res.data.links);
    } catch (err) {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncStatus = async (orderId: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/check-status?order_id=${orderId}`);
      if (res.data.success) {
        toast.success(`Status updated to ${res.data.status}`);
        fetchHistory();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Sync failed");
    }
  };

  const filteredHistory = history.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.email.toLowerCase().includes(search.toLowerCase()) ||
    item.phone.includes(search) ||
    item.orderId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 lg:p-10">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link href="/payment-portal" className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-indigo-600 transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Transaction Ledger</h1>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Full payment history & sync manager</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={fetchHistory} className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-indigo-600 transition-all">
              <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by name, email or order ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-[400px] pl-12 pr-6 py-3.5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Stats Summary (Optional/Quick View) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[
             { label: 'Total Links', value: history.length, color: 'indigo' },
             { label: 'Paid', value: history.filter(h => h.status === 'paid').length, color: 'emerald' },
             { label: 'Pending', value: history.filter(h => h.status === 'pending').length, color: 'amber' },
             { label: 'Failed/Expired', value: history.filter(h => h.status === 'failed' || h.status === 'expired').length, color: 'rose' }
           ].map((stat, idx) => (
             <div key={idx} className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{stat.label}</p>
               <h3 className={`text-2xl font-black text-${stat.color}-600`}>{stat.value}</h3>
             </div>
           ))}
        </div>

        {/* Main Table */}
        <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl shadow-indigo-500/5 border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Generation Info</th>
                  <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Customer Details</th>
                  <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Purpose / Service</th>
                  <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Payment Breakup</th>
                  <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Live Status</th>
                  <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((link) => (
                    <motion.tr 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={link.id} 
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group"
                    >
                      <td className="px-8 py-8">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 dark:text-white text-sm">{format(new Date(link.createdAt), "dd MMM yyyy")}</span>
                          <span className="text-xs text-slate-400 font-bold">{format(new Date(link.createdAt), "hh:mm a")}</span>
                          <div className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-full w-fit">
                            <User size={10} className="text-indigo-600" />
                            <span className="text-[10px] text-indigo-600 font-black uppercase tracking-wider">{link.createdBy || "Admin"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-slate-900 dark:text-white text-base group-hover:text-indigo-600 transition-colors">{link.name}</span>
                          <span className="text-xs text-slate-400 font-medium">{link.email}</span>
                          <span className="text-xs text-slate-400 font-medium">{link.phone}</span>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <span className="inline-block text-[10px] font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl uppercase tracking-widest">{link.purpose}</span>
                      </td>
                      <td className="px-8 py-8">
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-slate-900 dark:text-white text-lg">₹{link.amount}</span>
                          {link.totalAmount > link.amount && (
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight line-through">Total: ₹{link.totalAmount}</span>
                                <span className="text-[10px] text-amber-500 font-black uppercase tracking-tight">Due: ₹{link.totalAmount - link.amount}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] shadow-sm border w-fit flex items-center gap-2 ${
                          link.status === "paid" ? "bg-emerald-100/50 text-emerald-600 border-emerald-200" : 
                          link.status === "pending" ? "bg-amber-100/50 text-amber-600 border-amber-200" : 
                          "bg-rose-100/50 text-rose-600 border-rose-200"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${link.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {link.status}
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <div className="flex items-center gap-3">
                          {link.status === "pending" && (
                            <button 
                              onClick={() => handleSyncStatus(link.orderId)}
                              className="p-3.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800"
                              title="Sync Status"
                            >
                              <Zap size={18} />
                            </button>
                          )}
                          {link.paymentLink && (
                            <button 
                              onClick={() => { 
                                navigator.clipboard.writeText(link.paymentLink); 
                                toast.success("Link copied!");
                              }}
                              className="p-3.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-2xl transition-all shadow-sm border border-slate-100 dark:border-slate-700"
                              title="Copy Payment Link"
                            >
                              <Copy size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-40 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <FileText size={64} />
                        <p className="font-black text-sm uppercase tracking-[0.3em]">No records found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PaymentHistoryPage;
"
