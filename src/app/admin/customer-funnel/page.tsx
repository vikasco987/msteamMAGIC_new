"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  Receipt, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight, 
  ArrowLeft, 
  IndianRupee, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  BarChart3, 
  ShoppingBag,
  ExternalLink,
  Crown,
  CreditCard,
  Building,
  ChevronLeft,
  FileSpreadsheet,
  Download,
  Share2,
  Copy,
  Check,
  X,
  MessageSquare,
  FileText,
  Filter,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// Helper function to format date into DD/MM/YYYY (e.g. 11/11/2026)
function formatDateNumeric(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "N/A";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "N/A";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

interface CustomerSummary {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  swiggyBusinessId: string | null;
  zomatoBusinessId: string | null;
  gstNumber: string | null;
  address: string | null;
  isPremium: boolean;
  trialStartedAt: string | null;
  premiumEndDate: string | null;
  isFrozen: boolean;
  showPremiumPopup?: boolean;
  subscriptionPrice: number | null;
  subscriptionPendingAmount?: number | null;
  createdAt: string;
}

export default function CustomerFunnelPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "EXPIRED" | "PENDING" | "PAID">("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, pages: 1 });
  const [showExportModal, setShowExportModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate Excel download / share link for customer table
  const getExportUrl = () => {
    let url = `/api/admin/customer-funnel/export?status=${statusFilter}`;
    if (searchQuery) url += `&query=${encodeURIComponent(searchQuery)}`;
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
    const dateRangeLabel = startDate || endDate ? `\n*Date Range:* ${startDate || "Beginning"} to ${endDate || "Today"}` : "";
    const text = encodeURIComponent(
      `📊 *Customer Funnel Excel Report*\n*Status Filter:* ${statusFilter}${dateRangeLabel}\n*Records:* ${customers.length} Customers\n\n👉 *Download Customer Funnel Excel Here:*\n${fullUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleNativeShare = async () => {
    const fullUrl = getFullShareableUrl();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Customer Funnel Excel Report",
          text: `Download Customer Funnel Excel Report (${statusFilter} - ${customers.length} records):`,
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
    toast.success("Downloading Customer Funnel Excel file...");
  };

  // Search or fetch customers with pagination, status filter & date range filter
  const fetchCustomers = async (
    query = searchQuery, 
    page = currentPage, 
    status = statusFilter, 
    sDate = startDate, 
    eDate = endDate
  ) => {
    setLoading(true);
    try {
      let url = `/api/admin/customer-funnel?query=${encodeURIComponent(query)}&page=${page}&limit=50&status=${status}`;
      if (sDate) url += `&startDate=${encodeURIComponent(sDate)}`;
      if (eDate) url += `&endDate=${encodeURIComponent(eDate)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomers(data.customers || []);
        if (data.pagination) {
          setPagination(data.pagination);
          setCurrentPage(data.pagination.page);
        }
      } else {
        toast.error(data.error || "Failed to load customers");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const applyDateFilter = () => {
    setCurrentPage(1);
    fetchCustomers(searchQuery, 1, statusFilter, startDate, endDate);
  };

  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    fetchCustomers(searchQuery, 1, statusFilter, "", "");
  };

  useEffect(() => {
    fetchCustomers(searchQuery, 1, statusFilter, startDate, endDate);
  }, [statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchCustomers(searchQuery, 1, statusFilter, startDate, endDate);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-3 sm:p-5 md:p-8 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* TOP NAVIGATION & HEADER */}
        <div className="flex flex-col gap-4 pb-5 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-xs sm:text-sm font-bold shadow-sm transition-all"
            >
              <ArrowLeft size={16} /> Back
            </button>
            
            <div className="flex items-center gap-2">
              <Link 
                href="/admin/customer-tickets" 
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all"
              >
                Customer Tickets
              </Link>
              <Link 
                href="/admin/pos-signups" 
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-sm transition-all"
              >
                POS Sign-ups
              </Link>
              <button
                onClick={() => setShowExportModal(true)}
                disabled={loading || customers.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Export Customer Funnel Data to Excel"
              >
                <FileSpreadsheet size={14} /> Export Excel
              </button>
              <button
                onClick={() => fetchCustomers(searchQuery)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-[11px] uppercase tracking-widest mb-1.5">
              <Users size={14} /> Manage Platform • Customer Funnel
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Customer Funnel
            </h1>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Search any customer by Mobile Number or Email to inspect subscription status, active validity, daily/weekly/monthly bill volumes, and average order values.
            </p>
          </div>
        </div>

        {/* SEARCH BAR & STATUS FILTER CONTROLS */}
        <div className="space-y-3">
          {/* Top Filter Bar (Above Search Bar) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800">
              <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Filter size={15} />
              </span>
              <span>Filter By Subscription:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Responsive Custom Dropdown Selector */}
              <div className="relative inline-block w-full sm:w-auto" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full sm:w-60 flex items-center justify-between gap-2 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none cursor-pointer transition-all shadow-sm"
                >
                  <span className="truncate">
                    {statusFilter === "ALL" && "🌐 All Customers (No Filter)"}
                    {statusFilter === "ACTIVE" && "👑 Active Premium Plan"}
                    {statusFilter === "EXPIRED" && "⏳ Expired / Trial Plans"}
                    {statusFilter === "PENDING" && "⚠️ Pending Amount (Due)"}
                    {statusFilter === "PAID" && "✓ Paid Amount (Subscribed)"}
                  </span>
                  <ChevronDown 
                    size={15} 
                    className={`text-slate-400 shrink-0 transition-transform duration-200 ${isDropdownOpen ? "rotate-180 text-indigo-600" : ""}`} 
                  />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-full sm:w-64 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/10 z-50 overflow-hidden p-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("ALL");
                          setCurrentPage(1);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-colors ${
                          statusFilter === "ALL" 
                            ? "bg-indigo-50 text-indigo-600" 
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>🌐</span>
                          <span>All Customers (No Filter)</span>
                        </span>
                        {statusFilter === "ALL" && <Check size={14} className="text-indigo-600 shrink-0" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("ACTIVE");
                          setCurrentPage(1);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-colors ${
                          statusFilter === "ACTIVE" 
                            ? "bg-emerald-50 text-emerald-700" 
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>👑</span>
                          <span>Active Premium Plan</span>
                        </span>
                        {statusFilter === "ACTIVE" && <Check size={14} className="text-emerald-600 shrink-0" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("EXPIRED");
                          setCurrentPage(1);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-colors ${
                          statusFilter === "EXPIRED" 
                            ? "bg-rose-50 text-rose-700" 
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>⏳</span>
                          <span>Expired / Trial Plans</span>
                        </span>
                        {statusFilter === "EXPIRED" && <Check size={14} className="text-rose-600 shrink-0" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("PENDING");
                          setCurrentPage(1);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-colors ${
                          statusFilter === "PENDING" 
                            ? "bg-amber-50 text-amber-700" 
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>⚠️</span>
                          <span>Pending Amount (Due)</span>
                        </span>
                        {statusFilter === "PENDING" && <Check size={14} className="text-amber-600 shrink-0" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("PAID");
                          setCurrentPage(1);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-colors ${
                          statusFilter === "PAID" 
                            ? "bg-blue-50 text-blue-700" 
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>✓</span>
                          <span>Paid Amount (Subscribed)</span>
                        </span>
                        {statusFilter === "PAID" && <Check size={14} className="text-blue-600 shrink-0" />}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* CALENDAR DATE RANGE PICKER */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 bg-slate-50 p-1.5 sm:p-2 rounded-xl border border-slate-200 w-full sm:w-auto">
                <div className="hidden md:flex items-center gap-1 text-slate-500 text-xs font-bold pl-1">
                  <Calendar size={13} className="text-indigo-600" />
                  <span>Date:</span>
                </div>
                <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full sm:w-32 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-[11px] sm:text-xs font-semibold outline-none focus:border-indigo-500 transition-all shadow-2xs"
                    title="Start Date"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full sm:w-32 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-[11px] sm:text-xs font-semibold outline-none focus:border-indigo-500 transition-all shadow-2xs"
                    title="End Date"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyDateFilter}
                  disabled={(!startDate && !endDate) || loading}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] sm:text-xs shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                >
                  Apply
                </button>
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={clearDateFilter}
                    className="px-2 py-1.5 bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg font-bold text-[11px] sm:text-xs transition-colors shrink-0"
                    title="Clear Date Filter"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Quick Reset All Filters Button */}
              {(statusFilter !== "ALL" || startDate || endDate) && (
                <button
                  onClick={() => {
                    setStatusFilter("ALL");
                    setStartDate("");
                    setEndDate("");
                    setCurrentPage(1);
                    setIsDropdownOpen(false);
                    fetchCustomers(searchQuery, 1, "ALL", "", "");
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all inline-flex items-center gap-1 shrink-0"
                  title="Reset All Filters"
                >
                  <X size={13} /> Reset
                </button>
              )}
            </div>
          </div>

          {/* Search Bar Input */}
          <div className="relative flex items-center">
            <Search className="absolute left-4 sm:left-5 text-slate-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Mobile Number, Email, Name or Business..."
              className="w-full pl-11 sm:pl-14 pr-12 py-3 sm:py-3.5 bg-white text-slate-900 placeholder-slate-400 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-xs sm:text-sm font-medium shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 sm:right-4 text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between px-2 text-[11px] sm:text-xs text-slate-500 font-medium gap-2">
            <span className="flex items-center gap-1.5 flex-wrap">
              <span>
                Showing {customers.length} {
                  statusFilter === "ACTIVE" ? "Active" :
                  statusFilter === "EXPIRED" ? "Expired" :
                  statusFilter === "PENDING" ? "Pending Amount" :
                  statusFilter === "PAID" ? "Paid" : ""
                } customer records
              </span>
              {(startDate || endDate) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                  <Calendar size={11} /> {startDate ? formatDateNumeric(startDate) : "Beginning"} - {endDate ? formatDateNumeric(endDate) : "Today"}
                </span>
              )}
            </span>
            {searchQuery && <span>Search: &ldquo;{searchQuery}&rdquo;</span>}
          </div>
        </div>

        {/* CUSTOMERS LIST / TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 sm:p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="animate-spin text-indigo-600" size={28} />
              <p className="text-xs uppercase tracking-widest font-bold text-slate-500">Querying Customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-12 sm:p-16 text-center space-y-2">
              <Users size={40} className="mx-auto text-slate-300" />
              <h3 className="text-base sm:text-lg font-bold text-slate-800">No Customers Found</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                No customer matching &ldquo;{searchQuery}&rdquo; exists. Try searching with a different mobile number or email address.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 text-[10px] sm:text-[11px] uppercase tracking-wider font-bold">
                    <th className="py-3.5 px-4 sm:px-6">Customer Name</th>
                    <th className="py-3.5 px-4 sm:px-6">Business Name</th>
                    <th className="py-3.5 px-4 sm:px-6">Mobile Number</th>
                    <th className="py-3.5 px-4 sm:px-6">Email Address</th>
                    <th className="py-3.5 px-4 sm:px-6">Swiggy ID</th>
                    <th className="py-3.5 px-4 sm:px-6">Zomato ID</th>
                    <th className="py-3.5 px-4 sm:px-6">GST Number</th>
                    <th className="py-3.5 px-4 sm:px-6">Business Address</th>
                    <th className="py-3.5 px-4 sm:px-6">Subscription Status</th>
                    <th className="py-3.5 px-4 sm:px-6">Startup Date</th>
                    <th className="py-3.5 px-4 sm:px-6">End Date</th>
                    <th className="py-3.5 px-4 sm:px-6">Subscription Price</th>
                    <th className="py-3.5 px-4 sm:px-6">Subscription Pending Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => {
                    const now = new Date();
                    const hasValidFutureEnd = c.premiumEndDate ? new Date(c.premiumEndDate) >= now : false;
                    const isSubActive = c.isPremium && hasValidFutureEnd && !c.isFrozen && !c.showPremiumPopup;
                    return (
                      <tr 
                        key={c.id} 
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        {/* Customer Name */}
                        <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                          <Link 
                            href={`/admin/customer-funnel/${c.id}`}
                            className="hover:text-indigo-600 hover:underline flex items-center gap-1.5"
                          >
                            {c.name}
                            <ExternalLink size={12} className="text-slate-400" />
                          </Link>
                        </td>

                        {/* Business Name */}
                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-800">
                          <Link 
                            href={`/admin/customer-funnel/${c.id}`}
                            className="hover:text-indigo-600 hover:underline"
                          >
                            {c.businessName}
                          </Link>
                        </td>

                        {/* Mobile Number */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                            <Phone size={12} className="text-emerald-600 shrink-0" />
                            {c.phone || "N/A"}
                          </span>
                        </td>

                        {/* Email Address */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                            <Mail size={12} className="text-indigo-600 shrink-0" />
                            {c.email || "N/A"}
                          </span>
                        </td>

                        {/* Swiggy ID */}
                        <td className="py-3.5 px-4 sm:px-6">
                          {c.swiggyBusinessId ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200 font-mono">
                              <span className="w-3.5 h-3.5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[9px]">S</span>
                              {c.swiggyBusinessId}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Not Added</span>
                          )}
                        </td>

                        {/* Zomato ID */}
                        <td className="py-3.5 px-4 sm:px-6">
                          {c.zomatoBusinessId ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 font-mono">
                              <span className="w-3.5 h-3.5 rounded-full bg-red-600 text-white flex items-center justify-center text-[9px]">Z</span>
                              {c.zomatoBusinessId}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Not Added</span>
                          )}
                        </td>

                        {/* GST Number */}
                        <td className="py-3.5 px-4 sm:px-6">
                          {c.gstNumber ? (
                            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {c.gstNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Not Registered</span>
                          )}
                        </td>

                        {/* Address */}
                        <td className="py-3.5 px-4 sm:px-6 max-w-xs truncate text-slate-600 text-xs" title={c.address || "No address specified"}>
                          {c.address || <span className="text-slate-400 italic">No address specified</span>}
                        </td>

                        {/* Subscription Status */}
                        <td className="py-3.5 px-4 sm:px-6">
                          {c.isFrozen ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertCircle size={11} /> Frozen
                            </span>
                          ) : isSubActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Crown size={11} /> Active Premium
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock size={11} /> Expired / Trial
                            </span>
                          )}
                        </td>

                        {/* Startup Date */}
                        <td className="py-3.5 px-4 sm:px-6 text-slate-600 text-xs font-mono font-medium">
                          {c.trialStartedAt 
                            ? formatDateNumeric(c.trialStartedAt)
                            : "N/A"}
                        </td>

                        {/* End Date */}
                        <td className="py-3.5 px-4 sm:px-6 text-xs font-semibold text-slate-800 font-mono">
                          {c.premiumEndDate 
                            ? formatDateNumeric(c.premiumEndDate)
                            : "No Active Plan"}
                        </td>

                        {/* Subscription Price */}
                        <td className="py-3.5 px-4 sm:px-6">
                          {c.subscriptionPrice !== null && c.subscriptionPrice > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                              <IndianRupee size={12} className="stroke-[2.5]" />
                              {c.subscriptionPrice.toLocaleString("en-IN")}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Free / Trial</span>
                          )}
                        </td>

                        {/* Subscription Pending Amount */}
                        <td className="py-3.5 px-4 sm:px-6">
                          {c.subscriptionPendingAmount !== null && c.subscriptionPendingAmount !== undefined && c.subscriptionPendingAmount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-rose-600 border border-amber-300 font-mono">
                              <IndianRupee size={12} className="stroke-[2.5]" />
                              {c.subscriptionPendingAmount.toLocaleString("en-IN")}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px] font-mono">₹0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}
          {pagination.pages > 1 && (
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 font-medium">
                Page <span className="font-bold text-slate-800">{pagination.page}</span> of{" "}
                <span className="font-bold text-slate-800">{pagination.pages}</span> • Total{" "}
                <span className="font-bold text-slate-800">{pagination.total}</span> customers
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1 || loading}
                  onClick={() => {
                    const newPage = Math.max(currentPage - 1, 1);
                    setCurrentPage(newPage);
                    fetchCustomers(searchQuery, newPage);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold shadow-sm transition-all"
                >
                  <ArrowLeft size={14} /> Previous
                </button>
                <button
                  disabled={currentPage >= pagination.pages || loading}
                  onClick={() => {
                    const newPage = Math.min(currentPage + 1, pagination.pages);
                    setCurrentPage(newPage);
                    fetchCustomers(searchQuery, newPage);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold shadow-sm transition-all"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* EXPORT EXCEL & SHARE MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-[94vw] sm:max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-3.5 sm:p-5 md:p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                  <FileSpreadsheet size={18} className="text-white sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base md:text-lg font-black tracking-tight truncate">Export Customer Funnel</h3>
                  <p className="text-emerald-100 text-[11px] sm:text-xs truncate mt-0.5">
                    {statusFilter === "ACTIVE" ? "Active Customers" : statusFilter === "EXPIRED" ? "Expired Customers" : "All Customers"} ({customers.length} records)
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

            {/* Modal Body */}
            <div className="p-3.5 sm:p-5 md:p-6 space-y-3.5 sm:space-y-4 md:space-y-5 overflow-y-auto w-full">
              <div className="p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl space-y-1 text-xs">
                <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-500 tracking-wider">Export Scope:</div>
                <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 font-semibold text-slate-800 text-[11px] sm:text-xs">
                  <span className="truncate">
                    Status Filter: <b>{statusFilter === "ACTIVE" ? "Active" : statusFilter === "EXPIRED" ? "Expired" : "All Customers"}</b>
                  </span>
                  <span className="text-indigo-600 font-bold shrink-0">
                    {customers.length} Records
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 leading-snug">
                  Excel sheet contains complete customer data: <b>Name, Business, Mobile, Email, Swiggy ID, Zomato ID, GST Number, Business Address & Subscription Status/Dates</b>.
                </p>
              </div>

              {/* Primary Action Buttons */}
              <div className="space-y-2">
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Download or Share:
                </div>

                {/* Direct Download */}
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

              {/* Shareable Link Box */}
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
                <p className="text-[10px] sm:text-[11px] text-slate-400 leading-snug">
                  Anyone opening this link will automatically download this Customer Funnel Excel file.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
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
  );
}
