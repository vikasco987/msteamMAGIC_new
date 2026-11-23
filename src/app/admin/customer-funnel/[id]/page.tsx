"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { 
  Users, 
  Phone, 
  Mail, 
  Receipt, 
  TrendingUp, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  IndianRupee, 
  RefreshCw, 
  Sparkles, 
  Crown, 
  CreditCard, 
  Building, 
  ShoppingBag, 
  AlertCircle, 
  BarChart3, 
  CheckCircle2, 
  ChevronRight, 
  ShieldCheck, 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  X, 
  MessageSquare 
} from "lucide-react";
import toast from "react-hot-toast";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

interface CustomerDetail {
  user: any;
  profile: any;
  subscriptionOrders: any[];
  stats: {
    totalBills: number;
    totalRevenue: number;
    avgTicketValue: number;
    today: { bills: number; revenue: number };
    week: { bills: number; revenue: number };
    month: { bills: number; revenue: number };
    filteredRange?: { bills: number; revenue: number; avgTicketValue: number } | null;
  };
  trends: { date: string; billCount: number; revenue: number }[];
  recentBills: any[];
  billPagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function CustomerFunnelDetailPage() {
  const params = useParams();
  const customerId = (params?.id as string) || "";
  const router = useRouter();

  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [billPage, setBillPage] = useState(1);
  const [billLoading, setBillLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Generate Excel download / share link
  const getExportUrl = () => {
    let url = `/api/admin/customer-funnel/export?userId=${encodeURIComponent(customerId)}`;
    if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
    if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
    return url;
  };

  const getFullShareableUrl = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${getExportUrl()}`;
  };

  const handleCopyLink = () => {
    const fullUrl = getFullShareableUrl();
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    toast.success("Excel Download Link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const fullUrl = getFullShareableUrl();
    const customerTitle = data?.profile?.businessName || data?.user?.name || "Customer";
    const text = encodeURIComponent(
      `📊 *Customer Funnel Excel Report*\n*Business:* ${customerTitle}\n*Date Range:* ${startDate || "Beginning"} to ${endDate || "Today"}\n\n👉 *Download Excel Sheet Here:*\n${fullUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleNativeShare = async () => {
    const fullUrl = getFullShareableUrl();
    const customerTitle = data?.profile?.businessName || data?.user?.name || "Customer";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${customerTitle} - Customer Funnel Report`,
          text: `Download the Customer Funnel Excel Report for ${customerTitle}:`,
          url: fullUrl,
        });
        toast.success("Shared successfully!");
      } catch (err: any) {
        if (err.name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDirectDownload = () => {
    const url = getExportUrl();
    window.open(url, "_blank");
    toast.success("Downloading Excel file...");
  };

  const fetchDetail = async (page = billPage, sDate = startDate, eDate = endDate) => {
    if (!customerId) return;
    if (page === 1 && !data) {
      setLoading(true);
    } else {
      setBillLoading(true);
    }

    try {
      let url = `/api/admin/customer-funnel?userId=${encodeURIComponent(customerId)}&billPage=${page}&billLimit=20`;
      if (sDate) url += `&startDate=${encodeURIComponent(sDate)}`;
      if (eDate) url += `&endDate=${encodeURIComponent(eDate)}`;

      const res = await fetch(url);
      const result = await res.json();
      if (res.ok && result.success) {
        setData(result);
        if (result.billPagination) {
          setBillPage(result.billPagination.page);
        }
      } else {
        toast.error(result.error || "Customer details not found");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load customer details");
    } finally {
      setLoading(false);
      setBillLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchDetail(1, "", "");
    }
  }, [customerId]);

  const applyDateFilter = () => {
    setBillPage(1);
    fetchDetail(1, startDate, endDate);
  };

  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    setBillPage(1);
    fetchDetail(1, "", "");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-2.5 sm:p-5 md:p-8 lg:p-10 font-sans w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 w-full">
        
        {/* TOP NAVIGATION & HEADER */}
        <div className="flex flex-col gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <button
              onClick={() => router.push("/admin/customer-funnel")}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-xs sm:text-sm font-bold shadow-sm transition-all"
            >
              <ArrowLeft size={16} /> Back to Customer List
            </button>
            
            <div className="flex items-center gap-2">
              <Link
                href="/admin/pos-signups"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-sm transition-all"
              >
                POS Sign-ups
              </Link>
              <button
                onClick={() => setShowExportModal(true)}
                disabled={loading || !data}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Export Customer Funnel Data to Excel"
              >
                <FileSpreadsheet size={14} /> Export Excel
              </button>
              <button
                onClick={() => fetchDetail(billPage)}
                className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] sm:text-[11px] uppercase tracking-widest mb-1 sm:mb-1.5">
              <Users size={13} /> Manage Platform • Customer Funnel Report
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight break-words">
              {data?.profile?.businessName || data?.user?.name || "Customer Detailed Funnel"}
            </h1>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Complete customer lifecycle analytics including startup date, subscription plan validity, daily/weekly/monthly billing volume, and average order value.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-10 sm:p-16 flex flex-col items-center justify-center gap-3 text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <RefreshCw className="animate-spin text-indigo-600" size={30} />
            <p className="text-xs uppercase tracking-widest font-bold text-slate-500">Loading Customer Funnel Data...</p>
          </div>
        ) : !data ? (
          <div className="p-10 sm:p-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <AlertCircle size={36} className="mx-auto text-amber-500" />
            <h3 className="text-base sm:text-lg font-bold text-slate-800">Customer Not Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              The requested customer record does not exist or has been removed.
            </p>
            <button
              onClick={() => router.push("/admin/customer-funnel")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 md:space-y-8 w-full">
            
            {/* BUSINESS & CUSTOMER PROFILE CARD */}
            <div className="p-4 sm:p-6 md:p-8 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm space-y-4 w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="min-w-0 max-w-full">
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 truncate">
                    {data.profile?.businessName || data.user.name || "Business"}
                  </h2>
                  <div className="text-xs sm:text-sm text-slate-500 font-medium mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span>Owner: <b className="text-slate-900">{data.user.name}</b></span>
                    <span>•</span>
                    <span>Since: <b className="text-slate-800">{new Date(data.user.createdAt).toLocaleDateString()}</b></span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {data.profile?.isPremium ? (
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm">
                      <Crown size={14} /> Subscription Active
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-300 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm">
                      <AlertCircle size={14} /> Inactive / Expired
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 pt-3 sm:pt-4 border-t border-slate-100 text-xs sm:text-sm">
                {/* 1. Customer Name */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 min-w-0">
                  <Users size={15} className="text-blue-600 shrink-0" />
                  <div className="min-w-0 truncate">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Customer / Contact Person</span>
                    <span className="font-bold text-slate-900 truncate block">
                      {data.profile?.contactPersonName || data.user.name || "N/A"}
                    </span>
                  </div>
                </div>

                {/* 2. Phone */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 min-w-0">
                  <Phone size={15} className="text-emerald-600 shrink-0" />
                  <div className="min-w-0 truncate">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Phone</span>
                    <span className="font-bold text-slate-900 truncate block">{data.user.phone || data.profile?.contactPersonPhone || "N/A"}</span>
                  </div>
                </div>

                {/* 3. Email */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 min-w-0">
                  <Mail size={15} className="text-indigo-600 shrink-0" />
                  <div className="min-w-0 truncate">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Email</span>
                    <span className="font-bold text-slate-900 truncate block">{data.user.email || "N/A"}</span>
                  </div>
                </div>

                {/* 4. Customer / Clerk ID */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 min-w-0">
                  <Clock size={15} className="text-sky-600 shrink-0" />
                  <div className="min-w-0 truncate">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Customer / Clerk ID</span>
                    <span className="font-mono text-[11px] font-semibold text-slate-700 truncate block">{data.user.clerkId || data.user.id}</span>
                  </div>
                </div>

                {/* 5. Swiggy Business ID */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-orange-50/60 border border-orange-100 min-w-0">
                  <div className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                    S
                  </div>
                  <div className="min-w-0 truncate">
                    <span className="text-orange-600 block text-[10px] uppercase font-bold tracking-wider">Swiggy Business ID</span>
                    <span className={`font-bold truncate block ${data.profile?.swiggyBusinessId ? "text-slate-900 font-mono text-[11px]" : "text-slate-400 font-normal italic"}`}>
                      {data.profile?.swiggyBusinessId || "Not Added"}
                    </span>
                  </div>
                </div>

                {/* 6. Zomato Business ID */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50/60 border border-red-100 min-w-0">
                  <div className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                    Z
                  </div>
                  <div className="min-w-0 truncate">
                    <span className="text-red-600 block text-[10px] uppercase font-bold tracking-wider">Zomato Business ID</span>
                    <span className={`font-bold truncate block ${data.profile?.zomatoBusinessId ? "text-slate-900 font-mono text-[11px]" : "text-slate-400 font-normal italic"}`}>
                      {data.profile?.zomatoBusinessId || "Not Added"}
                    </span>
                  </div>
                </div>

                {/* 7. GST Number */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 min-w-0">
                  <FileText size={15} className="text-teal-600 shrink-0" />
                  <div className="min-w-0 truncate">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">GST Number</span>
                    <span className={`font-bold truncate block ${data.profile?.gstNumber ? "text-slate-900 font-mono text-[11px]" : "text-slate-400 font-normal italic"}`}>
                      {data.profile?.gstNumber || "Not Registered"}
                    </span>
                  </div>
                </div>

                {/* 8. Address */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 min-w-0 sm:col-span-2">
                  <Building size={15} className="text-amber-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Address</span>
                    <span className="font-medium text-slate-800 line-clamp-1 block">
                      {data.profile?.businessAddress ? `${data.profile.businessAddress}${data.profile.district ? `, ${data.profile.district}` : ""}${data.profile.state ? `, ${data.profile.state}` : ""}${data.profile.pinCode ? ` - ${data.profile.pinCode}` : ""}` : "No address specified"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SUBSCRIPTION TIMELINE BOX */}
            <div className="p-4 sm:p-6 md:p-8 bg-indigo-50/50 border border-indigo-100 rounded-2xl sm:rounded-3xl shadow-sm space-y-4 w-full">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                  <CreditCard size={16} /> Subscription & Validity Lifecycle
                </h3>
                {data.profile?.trialStartedAt && (
                  <span className="text-[11px] sm:text-xs text-slate-500 font-semibold">
                    Started On: {new Date(data.profile.trialStartedAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
                <div className="p-3.5 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Startup / Purchase Date</div>
                  <div className="text-base sm:text-xl font-black text-slate-900 mt-1">
                    {data.profile?.trialStartedAt 
                      ? new Date(data.profile.trialStartedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : "N/A"}
                  </div>
                </div>

                <div className="p-3.5 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Valid Till / Expiry Date</div>
                  <div className="text-base sm:text-xl font-black text-emerald-600 mt-1">
                    {data.profile?.premiumEndDate 
                      ? new Date(data.profile.premiumEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : "No Active Plan"}
                  </div>
                </div>

                <div className="p-3.5 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Account Subscription Status</div>
                  <div className="text-base sm:text-xl font-black mt-1">
                    {data.profile?.isFrozen ? (
                      <span className="text-rose-600">Frozen</span>
                    ) : data.profile?.isPremium ? (
                      <span className="text-emerald-600">Active Premium</span>
                    ) : (
                      <span className="text-amber-600">Trial / Expired</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment History */}
              {data.subscriptionOrders && data.subscriptionOrders.length > 0 && (
                <div className="mt-3 pt-3 sm:mt-4 sm:pt-4 border-t border-indigo-100">
                  <div className="text-xs font-bold text-slate-700 mb-2">Subscription Payment Transactions:</div>
                  <div className="space-y-2">
                    {data.subscriptionOrders.map((ord: any) => (
                      <div key={ord.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 bg-white rounded-xl text-xs border border-slate-200 shadow-sm gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">₹{ord.amount}</span>
                          <span className="text-slate-500 font-mono text-[11px]">Ref: #{ord.merchantOrderId}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-emerald-700 font-bold uppercase text-[10px] px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200">{ord.paymentStatus}</span>
                          <span className="text-slate-500 text-[11px]">{new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* BILLING VOLUME METRICS */}
            <div className="space-y-3 sm:space-y-4 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Receipt size={16} /> Billing Volumes & Average Order Value (AOV)
                </h3>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200 shadow-sm text-xs w-full sm:w-auto">
                  <div className="hidden sm:flex items-center gap-1.5 text-slate-500 font-semibold px-1">
                    <Calendar size={14} className="text-indigo-600" />
                    <span>Filter:</span>
                  </div>

                  <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full sm:w-auto px-2 py-1.5 sm:px-2.5 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11px] sm:text-xs font-medium outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      title="Start Date"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full sm:w-auto px-2 py-1.5 sm:px-2.5 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11px] sm:text-xs font-medium outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      title="End Date"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                    <button
                      onClick={applyDateFilter}
                      disabled={(!startDate && !endDate) || billLoading}
                      className="flex-1 sm:flex-none text-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {billLoading ? "Filtering..." : "Apply"}
                    </button>

                    {(startDate || endDate) && (
                      <button
                        onClick={clearDateFilter}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold text-xs transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {data.stats.filteredRange && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-indigo-900 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-indigo-600 shrink-0" />
                    <span>
                      Filtered: <b>{startDate ? new Date(startDate).toLocaleDateString() : "Beginning"}</b> to <b>{endDate ? new Date(endDate).toLocaleDateString() : "Today"}</b>
                    </span>
                  </div>
                  <span className="font-bold text-indigo-700 text-right">
                    {data.stats.filteredRange.bills} Bills • ₹{data.stats.filteredRange.revenue.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full">
                <div className={`p-4 sm:p-5 rounded-2xl shadow-sm space-y-1 transition-all min-w-0 overflow-hidden ${
                  data.stats.filteredRange 
                    ? "bg-indigo-50/60 border-2 border-indigo-300 ring-2 ring-indigo-100" 
                    : "bg-white border border-slate-200"
                }`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 truncate">
                      {data.stats.filteredRange ? "Filtered Date Bills" : "Today (Day)"}
                    </span>
                    {data.stats.filteredRange && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-600 text-white shrink-0">Active</span>
                    )}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                    {data.stats.filteredRange ? data.stats.filteredRange.bills : data.stats.today.bills}{" "}
                    <span className="text-xs font-normal text-slate-500">bills</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-emerald-600 truncate">
                    ₹{(data.stats.filteredRange ? data.stats.filteredRange.revenue : data.stats.today.revenue).toLocaleString()}
                  </div>
                </div>

                <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1 min-w-0 overflow-hidden">
                  <span className="text-[10px] font-black uppercase tracking-widest text-sky-600 truncate block">Last 7 Days (Weekly)</span>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">{data.stats.week.bills} <span className="text-xs font-normal text-slate-500">bills</span></div>
                  <div className="text-xs sm:text-sm font-bold text-emerald-600 truncate">₹{data.stats.week.revenue.toLocaleString()}</div>
                </div>

                <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1 min-w-0 overflow-hidden">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 truncate block">Last 30 Days (Monthly)</span>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">{data.stats.month.bills} <span className="text-xs font-normal text-slate-500">bills</span></div>
                  <div className="text-xs sm:text-sm font-bold text-emerald-600 truncate">₹{data.stats.month.revenue.toLocaleString()}</div>
                </div>

                <div className={`p-4 sm:p-5 rounded-2xl shadow-sm space-y-1 transition-all min-w-0 overflow-hidden ${
                  data.stats.filteredRange 
                    ? "bg-rose-50/50 border-2 border-rose-300 ring-2 ring-rose-100" 
                    : "bg-white border border-slate-200"
                }`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 truncate">
                      {data.stats.filteredRange ? "Filtered Avg Bill" : "Average Bill Value"}
                    </span>
                    {data.stats.filteredRange && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-600 text-white shrink-0">Active</span>
                    )}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                    ₹{(data.stats.filteredRange ? data.stats.filteredRange.avgTicketValue : data.stats.avgTicketValue).toLocaleString()}
                  </div>
                  <div className="text-xs font-medium text-slate-500 truncate">
                    {data.stats.filteredRange 
                      ? `${data.stats.filteredRange.bills} bills in range` 
                      : `Lifetime: ${data.stats.totalBills} bills`}
                  </div>
                </div>
              </div>
            </div>

            {/* 14-DAY BILL GENERATION GRAPH */}
            {data.trends && data.trends.length > 0 && (
              <div className="p-5 sm:p-6 md:p-8 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">14-Day Billing Activity Trend</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Bills generated per day</p>
                  </div>
                </div>
                <div className="h-56 sm:h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trends}>
                      <defs>
                        <linearGradient id="detailBillGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          borderRadius: '10px', 
                          border: '1px solid #e2e8f0', 
                          color: '#0f172a',
                          fontSize: '11px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }} 
                      />
                      <Area type="monotone" dataKey="billCount" name="Bills Generated" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#detailBillGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* RECENT / FILTERED BILLS TABLE */}
            <div className="p-5 sm:p-6 md:p-8 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <ShoppingBag size={16} /> 
                  {data.stats.filteredRange ? "Filtered Generated Bills" : "Recent Generated Bills"}
                </h4>
                {data.stats.filteredRange && (
                  <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg font-bold">
                    Showing bills for selected date range
                  </span>
                )}
              </div>
              {data.recentBills && data.recentBills.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 text-[10px] sm:text-[11px] uppercase tracking-wider font-bold">
                        <th className="py-2.5 px-4">Bill No</th>
                        <th className="py-2.5 px-4">Customer Name</th>
                        <th className="py-2.5 px-4">Payment Mode</th>
                        <th className="py-2.5 px-4 text-right">Amount</th>
                        <th className="py-2.5 px-4 text-right">Generated Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.recentBills.map((b: any) => (
                        <tr key={b.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-bold text-slate-900 font-mono">#{b.billNumber}</td>
                          <td className="py-3 px-4 text-slate-600">{b.customerName || "Walk-in Guest"}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase border border-slate-200">{b.paymentMode}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600">₹{b.total}</td>
                          <td className="py-3 px-4 text-right text-slate-500 text-xs">{new Date(b.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs font-medium">No recent bills found.</div>
              )}

              {/* BILLS PAGINATION */}
              {data.billPagination && data.billPagination.pages > 1 && (
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 font-medium">
                    Showing Page <span className="font-bold text-slate-800">{data.billPagination.page}</span> of{" "}
                    <span className="font-bold text-slate-800">{data.billPagination.pages}</span> • Total{" "}
                    <span className="font-bold text-slate-800">{data.billPagination.total}</span> bills
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={billPage <= 1 || billLoading}
                      onClick={() => {
                        const newPage = Math.max(billPage - 1, 1);
                        fetchDetail(newPage);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold shadow-sm transition-all"
                    >
                      <ArrowLeft size={14} /> Previous
                    </button>
                    <button
                      disabled={billPage >= (data.billPagination?.pages || 1) || billLoading}
                      onClick={() => {
                        const totalPages = data.billPagination?.pages || 1;
                        const newPage = Math.min(billPage + 1, totalPages);
                        fetchDetail(newPage);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold shadow-sm transition-all"
                    >
                      {billLoading ? "Loading..." : "Next"} <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* EXPORT EXCEL & SHARE MODAL */}
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-[94vw] sm:max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-3.5 sm:p-5 md:p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                    <FileSpreadsheet size={18} className="text-white sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base md:text-lg font-black tracking-tight truncate">Export & Share Excel</h3>
                    <p className="text-emerald-100 text-[11px] sm:text-xs truncate mt-0.5">
                      {data?.profile?.businessName || data?.user?.name || "Customer"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white shrink-0 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-3.5 sm:p-5 md:p-6 space-y-3.5 sm:space-y-4 md:space-y-5 overflow-y-auto w-full">
                <div className="p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl space-y-1 text-xs">
                  <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-500 tracking-wider">Export Scope:</div>
                  <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 font-semibold text-slate-800 text-[11px] sm:text-xs">
                    <span className="truncate">
                      Range: <b>{startDate || "Beginning"}</b> to <b>{endDate || "Today"}</b>
                    </span>
                    <span className="text-indigo-600 font-bold shrink-0">
                      {data?.stats?.filteredRange ? `${data.stats.filteredRange.bills} Bills` : `${data?.stats?.totalBills || 0} Bills`}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 leading-snug">
                    Excel contains customer bills report with items, amounts and payment modes.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Download or Share:
                  </div>

                  <button
                    onClick={handleDirectDownload}
                    className="w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md sm:shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.99]"
                  >
                    <Download size={15} className="sm:w-4 sm:h-4" /> Download Excel (.xlsx)
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                    <button
                      onClick={handleShareWhatsApp}
                      className="w-full py-2 sm:py-2.5 px-3 rounded-xl sm:rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-[11px] sm:text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                    >
                      <MessageSquare size={14} className="text-emerald-600 shrink-0" /> Share via WhatsApp
                    </button>

                    <button
                      onClick={handleNativeShare}
                      className="w-full py-2 sm:py-2.5 px-3 rounded-xl sm:rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold text-[11px] sm:text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                    >
                      <Share2 size={14} className="text-indigo-600 shrink-0" /> Share via Apps
                    </button>
                  </div>
                </div>

                <div className="pt-2.5 sm:pt-3 border-t border-slate-100 space-y-1.5 sm:space-y-2">
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>Direct Download Link:</span>
                    {copiedLink && (
                      <span className="text-emerald-600 font-bold flex items-center gap-1 text-[10px] sm:text-[11px]">
                        <Check size={12} /> Copied!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-slate-50 border border-slate-200 rounded-xl min-w-0">
                    <input
                      type="text"
                      readOnly
                      value={getFullShareableUrl()}
                      className="bg-transparent text-[10px] sm:text-[11px] font-mono text-slate-600 flex-1 outline-none truncate min-w-0 px-1"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] sm:text-xs font-bold shrink-0 shadow-sm transition-all"
                    >
                      {copiedLink ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

              </div>

              <div className="p-2.5 sm:p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
