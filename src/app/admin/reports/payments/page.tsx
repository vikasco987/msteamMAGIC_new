"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { 
  FaDollarSign, FaWallet, FaClock, FaDownload, 
  FaSearch, FaSyncAlt, FaFileExcel, FaMapMarkerAlt,
  FaPhoneAlt, FaUser, FaBuilding, FaChevronRight, FaHistory,
  FaEye, FaCopy, FaCheck, FaTimes, FaExternalLinkAlt
} from "react-icons/fa";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function FinancialReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0
  });
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    search: ""
  });
  
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const params = { ...filters, page, limit: 10 };
      const res = await axios.get("/api/admin/reports/payment-data", { params });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (err: any) {
      toast.error("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, [filters.startDate, filters.endDate]);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') fetchData(1);
  };

  const handleCopy = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadExcel = () => {
    const params = new URLSearchParams(filters as any).toString();
    window.location.href = `/api/admin/reports/gst-payments?${params}`;
  };

  const formatLocation = (url: string) => {
    if (!url) return "N/A";
    if (!url.startsWith("http")) return url;
    
    try {
      const decoded = decodeURIComponent(url);
      const placeMatch = decoded.match(/\/(place|search)\/([^/@?]+)/);
      if (placeMatch && placeMatch[2]) {
        const name = placeMatch[2].replace(/\+/g, " ").trim();
        if (!/^\d+\.\d+,\d+\.\d+$/.test(name)) return name;
      }
      const queryMatch = decoded.match(/[?&](q|query)=([^&]+)/);
      if (queryMatch && queryMatch[2]) {
        const q = queryMatch[2].replace(/\+/g, " ").trim();
        const isCoord = /^-?\d+\.\d+,-?\d+\.\d+$/.test(q) || /^\d+°\d+'[\d.]+"[NS]\s*\d+°\d+'[\d.]+"[EW]$/.test(q);
        if (!isCoord) return q;
        return "Pinned Location (" + q.split(",")[0].slice(0, 5) + "...)";
      }
      return "View on Map";
    } catch (e) {
      return "Map Link";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans">
      {/* Header Section */}
      <div className="max-w-[1600px] mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
              <FaWallet className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tight">Financial <span className="text-indigo-600">Ecosystem</span></h1>
              <p className="text-slate-500 font-bold mt-1">Real-time business activity and payment health tracking</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchData(pagination.currentPage)}
              className="p-4 bg-white text-slate-400 rounded-2xl shadow-sm border border-slate-100 hover:text-indigo-600 hover:shadow-md transition-all"
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-3 bg-[#10b981] hover:bg-[#059669] text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-emerald-100 hover:scale-[1.02] active:scale-[0.98]"
            >
              <FaFileExcel size={20} />
              EXPORT EXCEL
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="max-w-[1600px] mx-auto bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[600px]">
        {/* Search and Filters */}
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/50 backdrop-blur-sm">
          <div className="relative w-full md:w-[450px]">
            <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 text-lg" />
            <input
              type="text"
              placeholder="Search and press Enter..."
              className="w-full pl-16 pr-8 py-5 rounded-3xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-bold text-slate-600 placeholder:text-slate-300"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              onKeyDown={handleSearch}
            />
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-slate-50 px-6 py-4 rounded-3xl ring-1 ring-slate-100">
                <input
                  type="date"
                  className="bg-transparent border-none text-xs font-black text-slate-500 focus:ring-0"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                />
                <span className="text-slate-300 font-bold">TO</span>
                <input
                  type="date"
                  className="bg-transparent border-none text-xs font-black text-slate-500 focus:ring-0"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                />
             </div>
             <div className="bg-slate-50 px-6 py-4 rounded-3xl ring-1 ring-slate-100">
               <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                 {pagination.totalEntries} ENTRIES FOUND
               </span>
             </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto pb-4">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-slate-50/30">
                <th className="pl-10 pr-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Project</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[150px]">Customer</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[130px]">Phone No</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[180px]">Shop Name</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Location</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[150px]">UTR / Ref</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[120px]">Amount</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[120px]">Date</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-indigo-100"></div>
                      <p className="text-slate-400 font-black text-xl tracking-tight">Syncing ecosystem data...</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-32 text-center">
                    <p className="text-slate-300 font-black text-2xl">No data found in this ecosystem</p>
                  </td>
                </tr>
              ) : data.map((item, idx) => (
                <tr key={idx} className="hover:bg-indigo-50/20 transition-all group">
                  <td className="pl-10 pr-4 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center text-sm font-black shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {item.title.charAt(0)}
                      </div>
                      <span className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors whitespace-nowrap">
                        {item.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-6">
                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                      {item.customerName || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-6">
                    <div className="flex items-center gap-2">
                       <FaPhoneAlt className="text-indigo-400 text-[10px]" />
                       <span className="text-xs font-black text-slate-700 whitespace-nowrap">
                         {item.phone || "—"}
                       </span>
                    </div>
                  </td>
                  <td className="px-4 py-6">
                    <span className="text-sm font-black text-slate-700 whitespace-nowrap">
                      {item.shopName || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <FaMapMarkerAlt className="text-rose-400 shrink-0" />
                        <span className="whitespace-nowrap">
                          {formatLocation(item.location)}
                        </span>
                    </div>
                  </td>
                  <td className="px-4 py-6">
                    <span className="text-xs font-black text-indigo-600 font-mono tracking-tight whitespace-nowrap">
                      {item.utr || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-6">
                    <div className="flex flex-col whitespace-nowrap">
                      <span className="text-lg font-black text-slate-800">₹{item.received.toLocaleString()}</span>
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">RECEIVED</span>
                    </div>
                  </td>
                  <td className="px-4 py-6">
                    <div className="flex flex-col whitespace-nowrap">
                      <span className="text-xs font-black text-slate-700">{item.date ? format(new Date(item.date), "dd/MM/yyyy") : "—"}</span>
                      <span className="text-[10px] font-bold text-slate-400">{item.date ? format(new Date(item.date), "HH:mm") : "-"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-6 text-right pr-10">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setSelectedTask(item)}
                        className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        title="Quick View"
                      >
                        <FaEye size={14} />
                      </button>
                      {item.proof && (
                        <a 
                          href={item.proof} 
                          target="_blank"
                          className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          title="View Proof"
                        >
                          <FaExternalLinkAlt size={12} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && pagination.totalPages > 1 && (
          <div className="p-8 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Page {pagination.currentPage} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.currentPage === 1}
                onClick={() => fetchData(pagination.currentPage - 1)}
                className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-black text-slate-600 disabled:opacity-50 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
              >
                PREVIOUS
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (pagination.currentPage > 3 && pagination.totalPages > 5) {
                    pageNum = pagination.currentPage - 3 + i + 1;
                  }
                  if (pageNum > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchData(pageNum)}
                      className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                        pagination.currentPage === pageNum 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                          : 'bg-white text-slate-400 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => fetchData(pagination.currentPage + 1)}
                className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-black text-slate-600 disabled:opacity-50 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
              >
                NEXT
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-indigo-600">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white text-xl">
                    <FaEye />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Task Details</h2>
                    <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest">Ref: {selectedTask.id.slice(-8)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                {[
                  { label: "Project Title", value: selectedTask.title, icon: <FaBuilding /> },
                  { label: "Shop Name", value: selectedTask.shopName, icon: <FaBuilding /> },
                  { label: "Customer Name", value: selectedTask.customerName, icon: <FaUser /> },
                  { label: "UTR / Transaction Ref", value: selectedTask.utr, icon: <FaHistory />, isMono: true },
                  { label: "Phone Number", value: selectedTask.phone, icon: <FaPhoneAlt /> },
                  { label: "Location Link", value: selectedTask.location, icon: <FaMapMarkerAlt />, isLink: true },
                ].map((field, i) => (
                  <div key={i} className="group p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {field.icon}
                        {field.label}
                      </div>
                      <button 
                        onClick={() => handleCopy(field.value, field.label)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                          copiedField === field.label 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-white text-slate-400 hover:text-indigo-600 shadow-sm'
                        }`}
                      >
                        {copiedField === field.label ? <FaCheck /> : <FaCopy />}
                        {copiedField === field.label ? 'COPIED' : 'COPY'}
                      </button>
                    </div>
                    {field.isLink ? (
                      <a href={field.value} target="_blank" className="text-sm font-bold text-indigo-600 hover:underline break-all flex items-center gap-2">
                        {field.value || "N/A"}
                        <FaExternalLinkAlt size={10} />
                      </a>
                    ) : (
                      <p className={`text-sm font-black text-slate-800 ${field.isMono ? 'font-mono' : ''}`}>
                        {field.value || "—"}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AMOUNT RECEIVED</span>
                   <span className="text-2xl font-black text-slate-800">₹{selectedTask.received.toLocaleString()}</span>
                </div>
                {selectedTask.proof && (
                  <a 
                    href={selectedTask.proof}
                    target="_blank"
                    className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    VIEW PROOF
                    <FaExternalLinkAlt size={14} />
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
