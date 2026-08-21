"use client";

import { useEffect, useState } from "react";
import { 
  DollarSign, 
  CheckCircle, 
  Clock, 
  ShoppingCart, 
  Loader2, 
  History, 
  Calendar, 
  TrendingUp,
  Search,
  ChevronDown,
  Download,
  Settings,
  X,
  Eye,
  EyeOff
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { useUser } from "@clerk/nextjs";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

interface Stats {
  totalRevenue: number;
  totalReceived: number;
  pendingRevenue: number;
  totalSales: number;
  totalExpense: number;
}

export default function SellerStats({ 
  selectedAssignerId, 
  onAssignerChange 
}: { 
  selectedAssignerId?: string; 
  onAssignerChange?: (id: string) => void; 
} = {}) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [month, setMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showCards, setShowCards] = useState<boolean>(false);
  const [showWithGST, setShowWithGST] = useState(true);
  const [showWithExpense, setShowWithExpense] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);

  const { user, isLoaded } = useUser();
  const roleFromMetadata = user?.publicMetadata?.role as string;
  const userRole = String(isLoaded ? (roleFromMetadata || 'user') : 'user').toLowerCase().trim();
  const isMaster = userRole === 'master';

  const [assignees, setAssignees] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingIncentive, setIsDownloadingIncentive] = useState(false);
  
  // Incentive settings
  const [showIncentiveSettings, setShowIncentiveSettings] = useState(false);
  const [incentiveConfig, setIncentiveConfig] = useState({
    t1r: 5000,
    t1i: 500,
    t2r: 4000,
    t2i: 300,
  });

  useEffect(() => {
    if (isMaster) {
      fetch("/api/assignees")
        .then((res) => res.json())
        .then((data) => {
          if (data.assignees) setAssignees(data.assignees);
        })
        .catch((err) => console.error("Failed to fetch assignees", err));
    }
  }, [isMaster]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      setStats(null);

      try {
        let url = `/api/seller/stats?month=${month}`;
        if (selectedAssignerId) {
          url += `&assignerId=${selectedAssignerId}`;
        }
        const statsRes = await fetch(url);
        if (!statsRes.ok) throw new Error("Failed to fetch summary stats");
        const statsData = await statsRes.json();
        setStats(statsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [month, selectedAssignerId]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      let url = `/api/seller/sales-history?month=${month}`;
      if (selectedAssignerId) {
        url += `&assignerId=${selectedAssignerId}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setHistoryData(data.history || []);
      setShowHistory(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const staggerContainerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  return (
    <div className="p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header and Month Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            Dashboard Overview
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            {isMaster && (
              <div className="relative">
                <div 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 bg-white rounded-xl shadow-sm p-2 px-3 cursor-pointer hover:shadow-md border border-gray-100 min-w-[200px]"
                >
                  <span className="text-gray-600 font-medium whitespace-nowrap">Assigner:</span>
                  <span className="font-bold text-gray-800 truncate flex-1">
                    {selectedAssignerId ? assignees.find(a => a.id === selectedAssignerId)?.name || 'Unknown' : 'All/Self'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
                
                {isDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    <div className="p-2 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
                      <Search className="w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search assigner..." 
                        className="bg-transparent border-none outline-none text-sm w-full font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                      <div 
                        onClick={() => { if(onAssignerChange) onAssignerChange(""); setIsDropdownOpen(false); setSearchQuery(""); }}
                        className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${!selectedAssignerId ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                      >
                        All / Self
                      </div>
                      {assignees
                        .filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(assigner => (
                          <div 
                            key={assigner.id}
                            onClick={() => { if(onAssignerChange) onAssignerChange(assigner.id); setIsDropdownOpen(false); setSearchQuery(""); }}
                            className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors flex items-center gap-2 ${selectedAssignerId === assigner.id ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                          >
                            {assigner.imageUrl && <img src={assigner.imageUrl} alt="" className="w-5 h-5 rounded-full" />}
                            <span className="truncate">{assigner.name}</span>
                          </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm p-2 hover:shadow-md border border-gray-100">
              <label htmlFor="month-selector" className="text-gray-600 font-medium">
                Month:
              </label>
              <input
                id="month-selector"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="bg-transparent border-none outline-none text-gray-800 font-bold"
              />
            </div>

            <button
              onClick={() => setShowCards(!showCards)}
              className="flex items-center gap-2 bg-white rounded-xl shadow-sm p-2 px-3 hover:shadow-md border border-gray-100 transition-colors text-gray-600"
              title={showCards ? "Hide Sales Matrix" : "Unhide Sales Matrix"}
            >
              {showCards ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              <span className="text-sm font-medium hidden sm:inline">{showCards ? "Hide" : "Unhide"}</span>
            </button>

            {/* Toggles - Only visible to Master */}
            {isMaster && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm p-1 border border-gray-100">
                  <span className="text-xs font-bold text-gray-500 pl-2 pr-1">GST:</span>
                  <button
                    onClick={() => setShowWithGST(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border ${showWithGST ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-500 hover:bg-gray-50 border-transparent'}`}
                  >
                    With
                  </button>
                  <button
                    onClick={() => setShowWithGST(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border ${!showWithGST ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-500 hover:bg-gray-50 border-transparent'}`}
                  >
                    Without
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm p-1 border border-gray-100">
                  <span className="text-xs font-bold text-gray-500 pl-2 pr-1">Expenses:</span>
                  <button
                    onClick={() => setShowWithExpense(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border ${showWithExpense ? 'bg-purple-50 text-purple-600 border-purple-200' : 'text-gray-500 hover:bg-gray-50 border-transparent'}`}
                  >
                    Show
                  </button>
                  <button
                    onClick={() => setShowWithExpense(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border ${!showWithExpense ? 'bg-purple-50 text-purple-600 border-purple-200' : 'text-gray-500 hover:bg-gray-50 border-transparent'}`}
                  >
                    Hide
                  </button>
                </div>
              </div>
            )}

            {isMaster && (
              <button
                disabled={isDownloadingPdf}
                onClick={async () => {
                  setIsDownloadingPdf(true);
                  try {
                    // @ts-ignore
                    if (!window.html2pdf) {
                      await new Promise((resolve, reject) => {
                        const script = document.createElement("script");
                        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
                        script.onload = resolve;
                        script.onerror = reject;
                        document.body.appendChild(script);
                      });
                    }
                    
                    const element = document.getElementById("pdf-content");
                    if (!element) throw new Error("Content not found");

                    // Temporarily remove overflow to prevent truncation and hanging
                    const originalStyles: {el: HTMLElement, overflow: string, height: string}[] = [];
                    element.querySelectorAll('.overflow-x-auto, .overflow-y-auto, .h-screen, .flex-1, .max-h-screen').forEach((node) => {
                      const el = node as HTMLElement;
                      originalStyles.push({ el, overflow: el.style.overflow, height: el.style.height });
                      el.style.setProperty('overflow', 'visible', 'important');
                      el.style.setProperty('height', 'auto', 'important');
                      el.style.setProperty('max-height', 'none', 'important');
                    });

                    const opt = {
                      margin: 0.5,
                      filename: `My_Growth_Report_${month}${selectedAssignerId ? '_' + selectedAssignerId : ''}.pdf`,
                      image: { type: 'jpeg', quality: 0.98 },
                      html2canvas: { scale: 1.5, useCORS: true, logging: false },
                      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
                    };
                    
                    // @ts-ignore
                    await window.html2pdf().set(opt).from(element).save();

                    // Restore styles
                    originalStyles.forEach(({el, overflow, height}) => {
                      el.style.overflow = overflow;
                      el.style.height = height;
                      el.style.maxHeight = '';
                    });
                  } catch (error: any) {
                    console.error("PDF generation failed:", error);
                    alert("Failed to generate PDF: " + (error.message || String(error)));
                  } finally {
                    setIsDownloadingPdf(false);
                  }
                }}
                className={`flex items-center gap-2 ${isDownloadingPdf ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md cursor-pointer'} text-white rounded-xl shadow-sm p-2 px-4 transition-colors border ${isDownloadingPdf ? 'border-gray-400' : 'border-blue-600'} font-bold`}
              >
                {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span className="text-sm">{isDownloadingPdf ? "Generating..." : "Download PDF"}</span>
              </button>
            )}

            {isMaster && (
              <div className="flex items-center gap-1 relative">
                <button
                  disabled={isDownloadingIncentive}
                  onClick={async () => {
                    setIsDownloadingIncentive(true);
                    try {
                      let url = `/api/seller/incentive-report?month=${month}&t1r=${incentiveConfig.t1r}&t1i=${incentiveConfig.t1i}&t2r=${incentiveConfig.t2r}&t2i=${incentiveConfig.t2i}`;
                      if (selectedAssignerId) url += `&assignerId=${selectedAssignerId}`;
                      
                      const res = await fetch(url);
                      if (!res.ok) throw new Error("Failed to download incentive report");
                      
                      const blob = await res.blob();
                      const link = document.createElement("a");
                      link.href = window.URL.createObjectURL(blob);
                      link.download = `Incentive_Report_${month}${selectedAssignerId ? '_' + selectedAssignerId : ''}.xlsx`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (error: any) {
                      console.error("Incentive report failed:", error);
                      alert("Failed to download incentive report.");
                    } finally {
                      setIsDownloadingIncentive(false);
                    }
                  }}
                  className={`flex items-center gap-2 ${isDownloadingIncentive ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-md cursor-pointer'} text-white rounded-l-xl shadow-sm p-2 px-4 transition-colors border-y border-l ${isDownloadingIncentive ? 'border-gray-400' : 'border-emerald-600'} font-bold`}
                >
                  {isDownloadingIncentive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span className="text-sm">{isDownloadingIncentive ? "Generating..." : "Incentive Report"}</span>
                </button>
                <button
                  onClick={() => setShowIncentiveSettings(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-r-xl shadow-sm p-2 transition-colors border-y border-r border-emerald-700 h-[38px] flex items-center justify-center"
                  title="Configure Incentive Logic"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Loading and Error states */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-blue-600 py-6"
            >
              <Loader2 className="inline-block animate-spin text-3xl" />
              <p className="mt-2 text-base">Loading your data...</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              key="error-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg shadow-sm"
            >
              <h3 className="font-bold text-base mb-1">Error</h3>
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        <AnimatePresence>
          {stats && showCards && (
            <motion.div
              key="stats-cards"
              variants={staggerContainerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {(() => {
                const adjustedRevenue = showWithGST ? stats.totalRevenue : stats.totalRevenue / 1.18;
                const adjustedReceived = showWithGST ? stats.totalReceived : stats.totalReceived / 1.18;
                const pendingRevenue = adjustedRevenue - adjustedReceived;
                const netProfit = adjustedRevenue - (stats.totalExpense || 0);

                return (
                  <>
                    <StatCard
                      title="Total Revenue"
                      value={formatCurrency(adjustedRevenue)}
                      icon={<DollarSign />}
                      color="from-green-400 to-green-600"
                      variant={cardVariants}
                    />
                    <StatCard
                      title="Received"
                      value={formatCurrency(adjustedReceived)}
                      icon={<CheckCircle />}
                      color="from-blue-400 to-blue-600"
                      variant={cardVariants}
                    />
                    <StatCard
                      title="Pending"
                      value={formatCurrency(pendingRevenue)}
                      icon={<Clock />}
                      color="from-yellow-400 to-yellow-600"
                      variant={cardVariants}
                    />
                    <StatCard
                      title="Total Sales"
                      value={stats.totalSales.toLocaleString()}
                      icon={<ShoppingCart />}
                      color="from-purple-400 to-purple-600"
                      variant={cardVariants}
                      onAction={fetchHistory}
                      actionLabel="View History"
                      actionLoading={historyLoading}
                    />
                    {showWithExpense && (
                      <StatCard
                        title="Total Expense"
                        value={formatCurrency(stats.totalExpense || 0)}
                        icon={<DollarSign />}
                        color="from-red-400 to-red-600"
                        variant={cardVariants}
                      />
                    )}
                    {showWithExpense && (
                      <StatCard
                        title="Net Profit"
                        value={formatCurrency(netProfit)}
                        icon={<TrendingUp />}
                        color="from-emerald-400 to-emerald-600"
                        variant={cardVariants}
                      />
                    )}
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- 🚀 SALES HISTORY MODAL --- */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setShowHistory(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 30, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-700 text-white flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                       <History className="w-5 h-5" /> My Growth History
                    </h3>
                    <p className="text-xs text-purple-100 mt-1 opacity-80 uppercase tracking-widest font-black">
                      {format(new Date(month + "-01T00:00:00"), "MMMM yyyy")} Breakdown
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <Loader2 className="w-5 h-5 rotate-45" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {historyData.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                      <Loader2 className="inline-block animate-spin text-3xl mb-2" />
                      <p>No sales history for this month.</p>
                    </div>
                  ) : (
                    historyData.map((day: any) => (
                      <div key={day.date} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-px flex-1 bg-gray-100"></div>
                          <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> {format(new Date(day.date), "EEE, d MMMM")}
                          </span>
                          <div className="h-px flex-1 bg-gray-100"></div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {day.tasks.map((task: any) => (
                            <div key={task.id} className="bg-gray-50/50 border border-gray-100 hover:border-purple-200 p-4 rounded-2xl transition-all group flex justify-between items-center">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm">
                                    {task.shopName.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-800 text-sm">{task.shopName}</h4>
                                    <p className="text-[10px] text-gray-500 font-medium">Added at {task.time}</p>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <p className="text-sm font-black text-gray-900 line-clamp-1">₹{task.amount.toLocaleString()}</p>
                                  <p className="text-[9px] font-bold text-green-500 uppercase tracking-wider">
                                    {task.received >= task.amount ? 'Paid' : `Rec: ₹${task.received}`}
                                  </p>
                               </div>
                            </div>
                          ))}
                        </div>

                        {/* Day Footer / Summary */}
                        <div className="flex justify-between items-center px-2 py-1">
                           <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                             <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> +{day.count} New Sale
                           </div>
                           <div className="text-xs font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                              Day Total: ₹{day.revenue.toLocaleString()}
                           </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-gray-50 border-t flex justify-end">
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    Close Log
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Incentive Settings Modal */}
        <AnimatePresence>
          {showIncentiveSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
              >
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-500" /> Incentive Configuration
                  </h3>
                  <button onClick={() => setShowIncentiveSettings(false)} className="text-gray-400 hover:text-gray-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="col-span-2 text-sm font-bold text-blue-800">Tier 1 Target</div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Min Revenue (₹)</label>
                      <input 
                        type="number" 
                        value={incentiveConfig.t1r} 
                        onChange={(e) => setIncentiveConfig({...incentiveConfig, t1r: Number(e.target.value)})}
                        className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Incentive (₹)</label>
                      <input 
                        type="number" 
                        value={incentiveConfig.t1i} 
                        onChange={(e) => setIncentiveConfig({...incentiveConfig, t1i: Number(e.target.value)})}
                        className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <div className="col-span-2 text-sm font-bold text-orange-800">Tier 2 Target</div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Min Revenue (₹)</label>
                      <input 
                        type="number" 
                        value={incentiveConfig.t2r} 
                        onChange={(e) => setIncentiveConfig({...incentiveConfig, t2r: Number(e.target.value)})}
                        className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Incentive (₹)</label>
                      <input 
                        type="number" 
                        value={incentiveConfig.t2i} 
                        onChange={(e) => setIncentiveConfig({...incentiveConfig, t2i: Number(e.target.value)})}
                        className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none text-sm font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-end">
                  <button 
                    onClick={() => setShowIncentiveSettings(false)}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    Done & Save
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const StatCard = ({
  title,
  value,
  icon,
  color,
  variant,
  onAction,
  actionLabel,
  actionLoading,
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
  variant: any;
  onAction?: () => void;
  actionLabel?: string;
  actionLoading?: boolean;
}) => (
  <motion.div
    variants={variant}
    className="relative p-6 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
  >
    <div
      className={`absolute -top-4 -right-4 p-4 rounded-full text-white text-3xl opacity-20 bg-gradient-to-br ${color} group-hover:scale-110 transition-transform`}
    >
      {icon}
    </div>
    <div className="flex items-center gap-4 mb-2">
      <div
        className={`text-4xl p-2 rounded-xl text-white bg-gradient-to-br ${color} shadow-md`}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-700 leading-none">{title}</h3>
        {onAction && (
          <button 
            onClick={(e) => { e.stopPropagation(); onAction(); }}
            disabled={actionLoading}
            className="text-[10px] text-blue-500 hover:text-blue-700 font-black uppercase tracking-widest mt-1 flex items-center gap-1"
          >
            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <History className="w-3.5 h-3.5" />}
            {actionLabel}
          </button>
        )}
      </div>
    </div>
    <p className="text-3xl font-black text-gray-900 mt-3 tracking-tight">{value}</p>
    
    {/* Decorative line */}
    <div className={`h-1 w-8 rounded-full mt-2 bg-gradient-to-r ${color}`}></div>
  </motion.div>
);