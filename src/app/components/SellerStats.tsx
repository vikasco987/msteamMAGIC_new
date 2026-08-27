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
  
  // Target Settings Modal
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetSellerId, setTargetSellerId] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [isSavingTarget, setIsSavingTarget] = useState(false);  
  // Incentive settings
  const [showIncentiveSettings, setShowIncentiveSettings] = useState(false);
  const [incentiveConfig, setIncentiveConfig] = useState({
    t1r: 5000,
    t1i: 500,
    t2r: 4000,
    t2i: 300,
  });

  const handleSaveTarget = async () => {
    if (!targetSellerId || !targetAmount) return;
    setIsSavingTarget(true);
    try {
      const [y, m] = month.split('-');
      const res = await fetch("/api/seller-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: targetSellerId,
          month: m,
          year: y,
          target: targetAmount
        })
      });
      if (!res.ok) throw new Error("Failed to save target");
      
      setShowTargetModal(false);
      // Let the main effect refetch stats by toggling loading or something, 
      // or we can just fetch and setStats right here to avoid complex state triggers.
      const statsRes = await fetch(`/api/seller/stats?month=${month}${selectedAssignerId ? `&assignerId=${selectedAssignerId}` : ''}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving target");
    } finally {
      setIsSavingTarget(false);
    }
  };

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
            {isMaster && (
              <button
                onClick={() => { setTargetSellerId(selectedAssignerId || assignees[0]?.id || ""); setShowTargetModal(true); }}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all h-[38px]"
                title="Target Settings"
              >
                <Settings size={16} /> Target Settings
              </button>
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

        {/* TARGET VS ACHIEVEMENT CARD */}
        {stats && (stats as any).status && (stats as any).status !== 'NO_TARGET' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span>🎯</span> TARGET VS ACHIEVEMENT
                </h3>
                <div className="mt-2 flex items-baseline gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-400 uppercase">Monthly Target</span>
                    <span className="text-3xl font-black text-gray-900">{formatCurrency((stats as any).target)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-400 uppercase">Achieved</span>
                    <span className="text-3xl font-black text-blue-600">{formatCurrency(stats.totalRevenue)}</span>
                  </div>
                </div>
              </div>

              <div className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider flex items-center gap-2 ${
                (stats as any).status === 'ACHIEVED' ? 'bg-green-100 text-green-700' :
                (stats as any).status === 'ON_TRACK' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {(stats as any).status === 'ACHIEVED' && '🏆 Target Achieved'}
                {(stats as any).status === 'ON_TRACK' && '🟡 On Track'}
                {(stats as any).status === 'BEHIND' && '🔴 Behind Target'}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-gray-600">Progress</span>
                <span className="text-blue-600">
                  {((stats as any).achievementPercentage).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden relative">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    (stats as any).achievementPercentage >= 100 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                    'bg-gradient-to-r from-blue-400 to-blue-500'
                  }`}
                  style={{ width: `${Math.min((stats as any).achievementPercentage, 100)}%` }}
                />
              </div>
              {(stats as any).achievementPercentage > 100 && (
                <div className="text-xs font-bold text-green-600 mt-2 text-right">
                  Extra Sales: {formatCurrency(stats.totalRevenue - (stats as any).target)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Remaining</span>
                <span className="text-lg font-bold text-gray-800">{formatCurrency((stats as any).remaining)}</span>
              </div>
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Days Remaining</span>
                <span className="text-lg font-bold text-gray-800">{(stats as any).daysRemaining} Days</span>
              </div>
              <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-gray-200 pt-3 md:pt-0 md:pl-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                  {(stats as any).daysRemaining === 0 ? 'Required Today' : 'Required Daily'}
                </span>
                <span className="text-lg font-bold text-gray-800">{formatCurrency((stats as any).requiredDaily)}</span>
              </div>
            </div>
          </motion.div>
        )}

        {stats && (stats as any).status === 'NO_TARGET' && isMaster && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6 flex flex-col items-center justify-center text-center space-y-3"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400">
              🎯
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-700">Monthly Target Not Set</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Admin/Master can set a target for this seller to track their sales performance and daily requirements.
              </p>
            </div>
            <button
              onClick={() => { setTargetSellerId(selectedAssignerId || assignees[0]?.id || ""); setShowTargetModal(true); }}
              className="mt-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all"
            >
              Set Target Now
            </button>
          </motion.div>
        )}

        {stats && (stats as any).status === 'ALL_SELLERS' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6 flex flex-col items-center justify-center text-center space-y-3"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400">
              👥
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-700">Select a Seller</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Please select an individual seller from the dropdown above to view their Target Achievement.
              </p>
            </div>
          </motion.div>
        )}

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

        {/* TARGET SETTINGS MODAL */}
        <AnimatePresence>
          {showTargetModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setShowTargetModal(false)}
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Settings size={20} className="text-blue-500" /> Target Settings
                  </h3>
                  <button onClick={() => setShowTargetModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Seller</label>
                    <select 
                      value={targetSellerId} 
                      onChange={(e) => setTargetSellerId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select Seller...</option>
                      {assignees.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Month</label>
                    <input 
                      type="month" 
                      value={month} 
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Change the month filter at the top to set target for a different month.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monthly Target (₹)</label>
                    <input 
                      type="number" 
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-8">
                  <button 
                    onClick={() => setShowTargetModal(false)}
                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveTarget}
                    disabled={!targetSellerId || !targetAmount || isSavingTarget}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingTarget ? <Loader2 size={16} className="animate-spin" /> : null}
                    Save Target
                  </button>
                </div>
              </motion.div>
            </div>
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