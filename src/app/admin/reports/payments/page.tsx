"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { 
  FaDollarSign, FaWallet, FaClock, FaDownload, 
  FaSearch, FaSyncAlt, FaFileExcel, FaMapMarkerAlt,
  FaPhoneAlt, FaUser, FaBuilding, FaChevronRight, FaHistory
} from "react-icons/fa";
import toast from "react-hot-toast";

export default function FinancialReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalBudget: 0,
    totalReceived: 0,
    totalPending: 0,
    count: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    search: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/reports/payment-data", { params: filters });
      setData(res.data.data);
      setStats(res.data.stats);
    } catch (err: any) {
      toast.error("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters.startDate, filters.endDate]);

  const handleDownloadExcel = () => {
    const params = new URLSearchParams(filters).toString();
    window.location.href = `/api/admin/reports/gst-payments?${params}`;
  };

  const formatLocation = (url: string) => {
    if (!url) return "N/A";
    if (!url.startsWith("http")) return url;
    
    try {
      const decoded = decodeURIComponent(url);
      
      // Pattern 1: /place/Name or /search/Name
      const placeMatch = decoded.match(/\/(place|search)\/([^/@?]+)/);
      if (placeMatch && placeMatch[2]) {
        const name = placeMatch[2].replace(/\+/g, " ").trim();
        // If it looks like a coordinate in the name slot, skip to next pattern
        if (!/^\d+\.\d+,\d+\.\d+$/.test(name)) return name;
      }
      
      // Pattern 2: q=Name or query=Name
      const queryMatch = decoded.match(/[?&](q|query)=([^&]+)/);
      if (queryMatch && queryMatch[2]) {
        const q = queryMatch[2].replace(/\+/g, " ").trim();
        // Check if it's a coordinate (Decimal or DMS)
        const isCoord = /^-?\d+\.\d+,-?\d+\.\d+$/.test(q) || /^\d+°\d+'[\d.]+"[NS]\s*\d+°\d+'[\d.]+"[EW]$/.test(q);
        if (!isCoord) return q;
        return "Pinned Location (" + q.split(",")[0].slice(0, 5) + "...)";
      }

      // Pattern 3: Fallback for any path segment after /maps/
      if (decoded.includes("/maps/")) {
        const parts = decoded.split("/");
        const mapsIndex = parts.indexOf("maps");
        if (mapsIndex !== -1 && parts[mapsIndex + 1]) {
          const segment = parts[mapsIndex + 1];
          if (!segment.startsWith("@") && segment.length > 3 && !segment.includes(",")) {
            return segment.replace(/\+/g, " ").trim();
          }
        }
      }

      // Short links
      if (url.includes("goo.gl") || url.includes("maps.app")) {
        return "Map Link (Short)";
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
              onClick={fetchData}
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
              placeholder="Search by shop, customer, or project..."
              className="w-full pl-16 pr-8 py-5 rounded-3xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-bold text-slate-600 placeholder:text-slate-300"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && fetchData()}
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
               <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">SHOWING {data.length} ENTRIES</span>
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
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[180px]">Shop Name</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Location</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[150px]">UTR / Ref</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[120px]">Collected By</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[120px]">Amount</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[120px]">Date</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-indigo-100"></div>
                      <p className="text-slate-400 font-black text-xl tracking-tight">Syncing ecosystem data...</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-32 text-center">
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
                      <span className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors whitespace-nowrap" title={item.title}>
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
                    <span className="text-sm font-black text-slate-700 whitespace-nowrap">
                      {item.shopName || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <FaMapMarkerAlt className="text-rose-400 shrink-0" />
                        <span className="whitespace-nowrap" title={item.location}>
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
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                      {item.updatedBy || "SYSTEM"}
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
                    <div className="flex items-center justify-end">
                      {item.proof ? (
                        <a 
                          href={item.proof} 
                          target="_blank"
                          className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          title="View Proof"
                        >
                          <FaChevronRight size={12} />
                        </a>
                      ) : (
                        <span className="text-[9px] font-black text-slate-300">NO PROOF</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
