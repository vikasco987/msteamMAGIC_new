"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  MessageSquare, 
  Loader2,
  ShieldCheck,
  Layers,
  Ticket
} from "lucide-react";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";

export default function AdminCustomerTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, closed: 0 });
  const [mounted, setMounted] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Selected Ticket for Drawer
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  // Resolution Form State
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [adminRemarkInput, setAdminRemarkInput] = useState("");

  // Fullscreen Preview Modal State for Attachments
  const [previewMediaModal, setPreviewMediaModal] = useState<{
    url: string;
    type: "image" | "video";
    name?: string;
  } | null>(null);

  const categories = [
    "All",
    "Dashboard & Analytics",
    "Billing & POS Operations",
    "Menu & Product Management",
    "Hardware & Printers",
    "Payments & UPI Settlements",
    "Inventory & Stock Control",
    "Business Profile & Settings",
    "Staff & Access Permissions",
    "Subscription & Renewal"
  ];

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory !== "All") params.append("category", filterCategory);
      if (filterStatus !== "All") params.append("status", filterStatus);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/admin/customer-tickets?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        toast.error(data.error || "Failed to load customer tickets");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error while fetching tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchTickets();
  }, [filterCategory, filterStatus]);

  const handleUpdateTicket = async (statusToSet: "Open" | "In Progress" | "Closed") => {
    if (!selectedTicket) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch("/api/admin/customer-tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.ticketId || selectedTicket.id,
          status: statusToSet,
          adminRemark: adminRemarkInput.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Ticket ${selectedTicket.id} updated to ${statusToSet}!`);
        // Update local state
        const updatedTicket = {
          ...selectedTicket,
          status: statusToSet,
          adminRemark: adminRemarkInput.trim(),
          resolvedAt: statusToSet === "Closed" ? new Date().toISOString() : selectedTicket.resolvedAt
        };
        setSelectedTicket(updatedTicket);

        setTickets(prev =>
          prev.map(t => (t.id === updatedTicket.id ? updatedTicket : t))
        );

        // Update stats
        fetchTickets();
      } else {
        toast.error(data.error || "Failed to update ticket status");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to update ticket");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Open Drawer and prefill remark input
  const openTicketDrawer = (ticket: any) => {
    setSelectedTicket(ticket);
    setAdminRemarkInput(ticket.adminRemark || "");
  };

  const filteredTickets = tickets.filter(t => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      (t.id || "").toLowerCase().includes(s) ||
      (t.client || "").toLowerCase().includes(s) ||
      (t.category || "").toLowerCase().includes(s) ||
      (t.subCategory || "").toLowerCase().includes(s) ||
      (t.remarks || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-3 sm:p-6 lg:p-8 space-y-6 max-w-full overflow-x-hidden box-border">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/pos-signups"
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
            title="Back to POS Sign-ups"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span>Customer Tickets</span>
              <span className="text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Admin Console
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Live customer support requests, resolution funnel & remarks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTickets}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Tickets</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {stats.total}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Open Tickets</span>
            <AlertCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.open}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-blue-200/60 dark:border-blue-800/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">In Progress</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {stats.inProgress}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Resolved / Closed</span>
            <CheckCircle2 className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-600 dark:text-slate-400 mt-1">
            {stats.closed}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Filters Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-950/20">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticket ID, email, issue..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Showing {filteredTickets.length} tickets
          </span>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-950/40 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-4 sm:px-6">Ticket ID</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Admin Remark</th>
                <th className="py-3 px-4 sm:px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    Loading tickets...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No tickets found matching filters.
                  </td>
                </tr>
              ) : (
                filteredTickets.map(t => {
                  const st = (t.status || "Open").toLowerCase();
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => openTicketDrawer(t)}
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <span className="font-black text-slate-900 dark:text-white block">
                          {t.id}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {t.createdAt}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[180px]">
                          {t.client}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block">
                          {t.category}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">
                          {t.subCategory}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {st === "closed" || st === "resolved" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-black border border-slate-200 dark:border-slate-700 uppercase">
                            CLOSED
                          </span>
                        ) : st === "in progress" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[11px] font-black border border-blue-200/60 dark:border-blue-800/40 uppercase">
                            IN PROGRESS
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[11px] font-black border border-emerald-200/60 dark:border-emerald-800/40 uppercase">
                            OPEN
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs text-slate-500 dark:text-slate-400 italic block truncate max-w-[220px]">
                          {t.adminRemark ? `"${t.adminRemark}"` : "— No remark yet —"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openTicketDrawer(t)}
                          className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Manage / Resolve
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Action Drawer for Ticket Resolution */}
      {mounted && selectedTicket && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-[100vw] sm:max-w-lg md:max-w-xl h-full bg-slate-50 dark:bg-slate-950 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col relative animate-in slide-in-from-right duration-300"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Ticket Resolution Console
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 no-scrollbar">
              {/* Card 1: Ticket Overview */}
              <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {selectedTicket.id}
                    </h3>
                    <p className="text-xs text-slate-400">Created: {selectedTicket.createdAt}</p>
                  </div>
                  <div>
                    {selectedTicket.status === "Closed" ? (
                      <span className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-xs border border-slate-200 uppercase">
                        CLOSED
                      </span>
                    ) : selectedTicket.status === "In Progress" ? (
                      <span className="px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-black text-xs border border-blue-200 uppercase">
                        IN PROGRESS
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-black text-xs border border-emerald-200 uppercase">
                        OPEN
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm space-y-2">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400 font-black text-[11px] uppercase">Client:</span>
                    <span className="font-bold text-slate-800 dark:text-white break-all text-right">
                      {selectedTicket.client}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400 font-black text-[11px] uppercase">Category:</span>
                    <span className="font-bold text-slate-800 dark:text-white text-right">
                      {selectedTicket.category}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400 font-black text-[11px] uppercase">Sub-Category:</span>
                    <span className="font-bold text-slate-800 dark:text-white text-right">
                      {selectedTicket.subCategory}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Customer Query (Remarks) */}
              <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Customer Query / Remarks
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap break-words">
                  {selectedTicket.remarks || "No remarks provided."}
                </p>
              </div>

              {/* Card 3: Attachments if any */}
              {selectedTicket.mediaUrl && (
                <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Customer Attachment Proof
                  </h4>
                  <div
                    onClick={() => setPreviewMediaModal({
                      url: selectedTicket.mediaUrl,
                      type: selectedTicket.mediaType || "image",
                      name: selectedTicket.mediaName
                    })}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer group hover:border-indigo-500 transition-all"
                  >
                    {selectedTicket.mediaType === "video" ? (
                      <video src={selectedTicket.mediaUrl} controls className="w-full max-h-56 rounded-lg bg-black" />
                    ) : (
                      <img src={selectedTicket.mediaUrl} alt="Attached Proof" className="w-full max-h-56 rounded-lg object-contain bg-slate-100 dark:bg-slate-900" />
                    )}
                    <span className="block text-center text-[11px] text-indigo-600 font-bold mt-2">
                      Click to Zoom Fullscreen ↗
                    </span>
                  </div>
                </div>
              )}

              {/* Card 4: ADMIN RESOLUTION & REMARK ACTION (LIVE TWO-WAY SYNC) */}
              <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-indigo-200/70 dark:border-indigo-900/40 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">
                    Company / Admin Resolution Reply
                  </h4>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500">
                    Resolution Remark for Customer (Visible to user in their sidebar)
                  </label>
                  <textarea
                    rows={3}
                    value={adminRemarkInput}
                    onChange={e => setAdminRemarkInput(e.target.value)}
                    placeholder="Enter resolution notes, feedback, or solution provided to customer..."
                    className="w-full p-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                  />
                </div>

                {/* Status Action Buttons */}
                <div className="pt-2 space-y-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                    Change Status & Send Reply
                  </span>

                  {/* Top Action Buttons (Mark In Progress & Resolve & Close) */}
                  {selectedTicket.status !== "Closed" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Mark In Progress Button */}
                      <button
                        type="button"
                        disabled={updatingStatus || selectedTicket.status === "In Progress"}
                        onClick={() => handleUpdateTicket("In Progress")}
                        className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-bold shadow-xs transition-all ${
                          selectedTicket.status === "In Progress"
                            ? "bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60"
                            : "border-blue-500 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 cursor-pointer active:scale-95"
                        } disabled:opacity-60`}
                      >
                        {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                        <span>
                          {selectedTicket.status === "In Progress" ? "In Progress (Active)" : "Mark In Progress"}
                        </span>
                      </button>

                      {/* Resolve & Close Button */}
                      <button
                        type="button"
                        disabled={updatingStatus}
                        onClick={() => handleUpdateTicket("Closed")}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>Resolve & Close Ticket</span>
                      </button>
                    </div>
                  ) : (
                    /* When Ticket is Closed/Resolved: Top buttons are replaced by Reopen Ticket */
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          This ticket is resolved & closed.
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={updatingStatus}
                        onClick={() => handleUpdateTicket("Open")}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        <span>Reopen Ticket</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Fullscreen Attachment Viewer Modal */}
      {mounted && previewMediaModal && createPortal(
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewMediaModal(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[92vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-950/80 border-b border-slate-800 text-white">
              <span className="text-xs sm:text-sm font-bold truncate">
                {previewMediaModal.name || "Customer Attachment"}
              </span>
              <button
                type="button"
                onClick={() => setPreviewMediaModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center bg-black/40 min-h-[250px] max-h-[calc(92vh-60px)]">
              {previewMediaModal.type === "video" ? (
                <video src={previewMediaModal.url} controls autoPlay className="max-h-[80vh] w-auto max-w-full rounded-lg" />
              ) : (
                <img src={previewMediaModal.url} alt="Proof" className="max-h-[80vh] w-auto max-w-full object-contain rounded-lg" />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
