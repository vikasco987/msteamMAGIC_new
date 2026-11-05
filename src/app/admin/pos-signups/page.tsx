"use client";
import { useUnifiedAuth as useUser } from "@/lib/useUnifiedAuth";

import React, { useState, useEffect } from "react";

import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Users, TrendingUp, AlertCircle, Loader2, BarChart3, Search, Download, FileText, X, MessageCircle, CheckSquare, Crown } from "lucide-react";
import CustomerPremiumDrawer from "./components/CustomerPremiumDrawer";

interface POSUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  posNotes?: string;
  leadStatus?: string;
  isDisabled?: boolean;
  billsCount?: number;
  itemsCount?: number;
  clerkId?: string;
  assignedToId?: string | null;
  assignedToName?: string | null;
  assignedAt?: string | null;
  createdAt: string;
  businessName?: string;
  premium?: {
    status: string;
    isPremium: boolean;
    startDate?: string | null;
    endDate?: string | null;
    daysRemaining?: number | null;
  };
}

interface Metrics {
  total: number;
  today: number;
  last7Days: number;
  last30Days: number;
}

export default function POSSignupsPage() {
  const { user } = useUser();
  const [date, setDate] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [users, setUsers] = useState<POSUser[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedUserForNotes, setSelectedUserForNotes] = useState<POSUser | null>(null);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkVerifying, setBulkVerifying] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const [detailsModal, setDetailsModal] = useState<{ open: boolean; type: "bills" | "items"; user: POSUser | null }>({ open: false, type: "bills", user: null });
  const [premiumDrawer, setPremiumDrawer] = useState<{ open: boolean; user: POSUser | null }>({ open: false, user: null });
  const [detailsData, setDetailsData] = useState<any[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsPage, setDetailsPage] = useState(1);
  const [detailsTotalPages, setDetailsTotalPages] = useState(1);
  const [detailsTotalItems, setDetailsTotalItems] = useState(0);

  // Filter States
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>("");
  const [pipelineFilter, setPipelineFilter] = useState<string>("");
  const [assignedToFilter, setAssignedToFilter] = useState<string>("");

  // Team Members for Assignee Selection
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);

  const fetchDetailsData = async (u: POSUser, type: "bills" | "items", pageNum = 1) => {
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/pos-signups/user-details?userId=${u.id}&clerkId=${u.clerkId || ''}&type=${type}&page=${pageNum}&limit=20`);
      const resData = await res.json();
      if (!resData.success) throw new Error("Failed");
      
      const { data } = resData;
      setDetailsData(type === "bills" ? data.bills : data.items);
      setDetailsPage(data.currentPage || 1);
      setDetailsTotalPages(data.totalPages || 1);
      setDetailsTotalItems(data.total || 0);
    } catch (err) {
      alert("Unable to load data. Please try again.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const openDetailsModal = (u: POSUser, type: "bills" | "items") => {
    setDetailsModal({ open: true, type, user: u });
    setDetailsData([]);
    fetchDetailsData(u, type, 1);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load team members for assignee dropdown
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await fetch("/api/team-members");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setTeamMembers(data);
          }
        }
      } catch (e) {
        console.error("Failed to load team members", e);
      }
    };
    fetchTeam();
  }, []);

  const fetchData = async (filterDate?: string, pageNum = 1, search = "") => {
    setLoading(true);
    setError("");
    try {
      let url = `/api/pos-signups?page=${pageNum}`;
      if (filterDate) url += `&date=${filterDate}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (roleFilter) url += `&role=${encodeURIComponent(roleFilter)}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;
      if (accountStatusFilter) url += `&accountStatus=${encodeURIComponent(accountStatusFilter)}`;
      if (pipelineFilter) url += `&pipeline=${encodeURIComponent(pipelineFilter)}`;
      if (assignedToFilter) url += `&assignedTo=${encodeURIComponent(assignedToFilter)}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch signups data");
      
      const data = await res.json();
      setMetrics(data.metrics);
      setUsers(data.users);
      setSelectedUserIds([]); // Clear selection when data changes
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on page, search, or filter changes
  useEffect(() => {
    fetchData(date, page, debouncedSearch);
  }, [page, debouncedSearch, roleFilter, statusFilter, accountStatusFilter, pipelineFilter, assignedToFilter]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDate(val);
    setPage(1); // Reset to first page when date changes
    fetchData(val, 1, debouncedSearch);
  };

  const handleClearDate = () => {
    setDate("");
    setPage(1);
    fetchData("", 1, debouncedSearch);
  };

  const handleVerify = async (userId: string) => {
    setVerifyingId(userId);
    setError("");
    try {
      const res = await fetch("/api/pos-signups/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify user");
      
      // Update local state to reflect verification instantly
      setUsers(users.map(u => u.id === userId ? { ...u, isVerified: true } : u));
    } catch (err: any) {
      setError(err.message || "An error occurred during verification");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleBulkVerify = async () => {
    if (selectedUserIds.length === 0) return;
    setBulkVerifying(true);
    try {
      const res = await fetch("/api/pos-signups/bulk-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedUserIds }),
      });
      if (!res.ok) throw new Error("Failed to bulk verify");
      
      setUsers(users.map(u => selectedUserIds.includes(u.id) ? { ...u, isVerified: true } : u));
      setSelectedUserIds([]);
    } catch (err) {
      alert("Error in bulk verification");
    } finally {
      setBulkVerifying(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    setStatusUpdatingId(userId);
    try {
      const res = await fetch("/api/pos-signups/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      setUsers(users.map(u => u.id === userId ? { ...u, leadStatus: newStatus } : u));
    } catch (err) {
      alert("Error updating status");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleAssignChange = async (userId: string, assignedToId: string, assignedToName: string) => {
    setAssigningUserId(userId);
    try {
      const res = await fetch("/api/pos-signups/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, assignedToId, assignedToName }),
      });
      if (!res.ok) throw new Error("Failed to update assigned team member");

      setUsers(users.map(u => u.id === userId ? {
        ...u,
        assignedToId: assignedToId || null,
        assignedToName: assignedToName || null,
      } : u));
    } catch (err) {
      alert("Error updating assigned member");
    } finally {
      setAssigningUserId(null);
    }
  };

  const handleExport = async () => {
    try {
      let url = `/api/pos-signups?export=true`;
      if (date) url += `&date=${date}`;
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (roleFilter) url += `&role=${encodeURIComponent(roleFilter)}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;
      if (accountStatusFilter) url += `&accountStatus=${encodeURIComponent(accountStatusFilter)}`;
      if (pipelineFilter) url += `&pipeline=${encodeURIComponent(pipelineFilter)}`;
      if (assignedToFilter) url += `&assignedTo=${encodeURIComponent(assignedToFilter)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      let exportUsers = data.users || [];
      
      // If users are selected, only export those
      if (selectedUserIds.length > 0) {
        exportUsers = exportUsers.filter((u: any) => selectedUserIds.includes(u.id));
      }
      
      const csvHeader = "Name,Phone,Email,Role,Status,Account Status,Assigned To,Pipeline,Bills,Items,Notes,Joined At\n";
      const csvRows = exportUsers.map((u: any) => {
        const name = `"${(u.name || "").replace(/"/g, '""')}"`;
        const phone = `"${u.phone || ""}"`;
        const email = `"${u.email || ""}"`;
        const role = `"${u.role || "USER"}"`;
        const status = u.isVerified ? "Verified" : "Unverified";
        const accStatus = u.isDisabled ? "Deactivated" : "Active";
        const assignedTo = `"${(u.assignedToName || "Unassigned").replace(/"/g, '""')}"`;
        const pipeline = `"${u.leadStatus || "New Lead"}"`;
        const bills = u.billsCount || 0;
        const items = u.itemsCount || 0;
        const notes = `"${(u.posNotes || "").replace(/"/g, '""')}"`;
        const joined = `"${u.createdAt ? format(new Date(u.createdAt), "PPp") : ""}"`;
        return [name, phone, email, role, status, accStatus, assignedTo, pipeline, bills, items, notes, joined].join(",");
      });
      
      const blob = new Blob([csvHeader + csvRows.join("\n")], { type: 'text/csv' });
      const dlUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `pos-signups-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
    } catch (err) {
      alert("Failed to export data");
    }
  };

  const openNotesModal = (u: POSUser) => {
    setSelectedUserForNotes(u);
    setNotesText(u.posNotes || "");
    setNotesModalOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedUserForNotes) return;
    setSavingNotes(true);
    try {
      const res = await fetch("/api/pos-signups/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserForNotes.id, notes: notesText }),
      });
      if (!res.ok) throw new Error("Failed to save notes");
      
      // Update local state
      setUsers(users.map(u => u.id === selectedUserForNotes.id ? { ...u, posNotes: notesText } : u));
      setNotesModalOpen(false);
    } catch (err) {
      alert("Error saving notes");
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 w-full space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">POS Sign-ups Monitor</h1>
          <p className="text-sm text-slate-500">Live sign-up tracking from Billgsoftware POS database</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64 shadow-sm"
            />
          </div>
          <Link 
            href="/admin/pos-signups/monthly-report" 
            className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-purple-100 transition-colors border border-purple-100 shadow-sm"
          >
            <BarChart3 size={16} />
            Monthly Report
          </Link>
          <Link 
            href="/admin/pos-signups/report" 
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors border border-indigo-100 shadow-sm"
          >
            <TrendingUp size={16} />
            Daily Report
          </Link>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors border border-emerald-100 shadow-sm"
          >
            <Download size={16} />
            Export CSV
          </button>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={handleDateChange}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
            {date && (
              <button
                onClick={handleClearDate}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg transition-colors font-medium shadow-sm"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        {/* Role Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="USER">USER</option>
            <option value="SELLER">SELLER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        {/* Verification Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
          >
            <option value="">All Verification</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>

        {/* Account Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account:</span>
          <select
            value={accountStatusFilter}
            onChange={(e) => { setAccountStatusFilter(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
          >
            <option value="">All Account Statuses</option>
            <option value="active">Active</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>

        {/* Pipeline Stage Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pipeline:</span>
          <select
            value={pipelineFilter}
            onChange={(e) => { setPipelineFilter(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
          >
            <option value="">All Pipeline Stages</option>
            <option value="New Lead">New Lead</option>
            <option value="Contacted">Contacted</option>
            <option value="Demo Scheduled">Demo Scheduled</option>
            <option value="Converted">Converted</option>
          </select>
        </div>

        {/* Assigned Member Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned To:</span>
          <select
            value={assignedToFilter}
            onChange={(e) => { setAssignedToFilter(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer max-w-[200px]"
          >
            <option value="">All Assignees</option>
            <option value="unassigned">Unassigned (None)</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filters */}
        {(roleFilter || statusFilter || accountStatusFilter || pipelineFilter || assignedToFilter || date || searchQuery) && (
          <button
            onClick={() => {
              setRoleFilter("");
              setStatusFilter("");
              setAccountStatusFilter("");
              setPipelineFilter("");
              setAssignedToFilter("");
              setDate("");
              setSearchQuery("");
              setPage(1);
            }}
            className="ml-auto text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg transition-colors font-bold border border-rose-200 shadow-xs"
          >
            Reset Filters
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 text-sm border border-red-100">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Signups Today" value={metrics?.today} icon={<Calendar className="text-indigo-500" />} />
        <MetricCard title="Last 7 Days" value={metrics?.last7Days} icon={<TrendingUp className="text-emerald-500" />} />
        <MetricCard title="Last 30 Days" value={metrics?.last30Days} icon={<TrendingUp className="text-blue-500" />} />
        <MetricCard title="Total Users" value={metrics?.total} icon={<Users className="text-purple-500" />} />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
            {date ? `Signups on ${format(new Date(date), "MMM d, yyyy")}` : "Recent Signups"}
          </h2>
          {loading && <Loader2 size={16} className="animate-spin text-slate-400" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 w-10">
                  <input 
                    type="checkbox" 
                    checked={users.length > 0 && selectedUserIds.length === users.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedUserIds(users.map(u => u.id));
                      else setSelectedUserIds([]);
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-3">Joined At</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Account</th>
                <th className="px-6 py-3">Assigned To</th>
                <th className="px-6 py-3">Premium Status</th>
                <th className="px-6 py-3">Bills</th>
                <th className="px-6 py-3">Items</th>
                <th className="px-6 py-3">Pipeline</th>
                <th className="px-6 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-500">
                    No sign-ups found.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className={`hover:bg-slate-50/50 transition-colors ${selectedUserIds.includes(u.id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedUserIds.includes(u.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedUserIds([...selectedUserIds, u.id]);
                        else setSelectedUserIds(selectedUserIds.filter(id => id !== u.id));
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {u.createdAt ? format(new Date(u.createdAt), "PPp") : "Unknown"}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">{u.name || "N/A"}</td>
                  <td className="px-6 py-4 text-slate-800 font-medium">
                    <div className="flex items-center gap-2">
                      {u.phone || "—"}
                      {u.phone && (
                        <a 
                          href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}?text=Hello ${encodeURIComponent(u.name || 'User')}, Welcome to Billgsoftware!`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-full transition-colors flex-shrink-0"
                          title="Message on WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md font-semibold">
                      {u.role || "USER"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.isVerified ? (
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit">
                        Verified
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                          Unverified
                        </span>
                        <button
                          onClick={() => handleVerify(u.id)}
                          disabled={verifyingId === u.id}
                          className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait whitespace-nowrap"
                        >
                          {verifyingId === u.id ? "..." : "Verify Now"}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {u.isDisabled ? (
                      <span className="text-red-600 bg-red-50 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">Deactivated</span>
                    ) : (
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.assignedToName || ""}
                      onChange={(e) => {
                        const selectedName = e.target.value;
                        const member = teamMembers.find(m => m.name === selectedName);
                        handleAssignChange(u.id, member ? member.id : "", selectedName);
                      }}
                      disabled={assigningUserId === u.id}
                      className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500 bg-white hover:bg-slate-50 text-slate-800 disabled:opacity-50 cursor-pointer min-w-[140px] max-w-[180px] shadow-xs"
                    >
                      <option value="">— Unassigned —</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setPremiumDrawer({ open: true, user: u })}
                      className="group flex flex-col items-start gap-1 p-1 rounded-lg hover:bg-slate-100/80 transition-all cursor-pointer text-left"
                      title="Click to view details or activate/renew Premium"
                    >
                      {u.premium?.status === "Active" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 rounded-full text-xs font-black shadow-xs group-hover:border-amber-400">
                          <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>
                            {u.premium.daysRemaining !== null && u.premium.daysRemaining !== undefined
                              ? `${u.premium.daysRemaining}d Left`
                              : "Active"}
                          </span>
                        </span>
                      ) : u.premium?.status === "Expired" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-xs font-extrabold shadow-xs group-hover:border-rose-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-full text-[11px] font-medium group-hover:border-slate-300">
                          Not Activated
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => openDetailsModal(u, "bills")}
                      className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors w-16 text-center"
                    >
                      {u.billsCount || 0}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => openDetailsModal(u, "items")}
                      className="bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors w-16 text-center"
                    >
                      {u.itemsCount || 0}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.leadStatus || "New Lead"}
                      onChange={(e) => handleStatusChange(u.id, e.target.value)}
                      disabled={statusUpdatingId === u.id}
                      className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-50 cursor-pointer min-w-[110px]"
                    >
                      <option value="New Lead">New Lead</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Demo Scheduled">Demo Scheduled</option>
                      <option value="Converted">Converted</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => openNotesModal(u)}
                      className="group flex items-center justify-center p-2 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                      title={u.posNotes || "Add Note"}
                    >
                      <FileText size={18} className={u.posNotes ? "text-indigo-500 fill-indigo-50" : ""} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Page <span className="font-medium text-slate-900">{page}</span> of <span className="font-medium text-slate-900">{totalPages}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedUserIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-6 z-40 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
              {selectedUserIds.length}
            </span>
            <span className="text-sm font-semibold text-slate-300">Selected</span>
          </div>
          <div className="h-6 w-px bg-slate-700" />
          <div className="flex gap-3">
            <button
              onClick={handleBulkVerify}
              disabled={bulkVerifying}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            >
              {bulkVerifying ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16} />}
              Verify Selected
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              <Download size={16} />
              Export Selected
            </button>
            <button
              onClick={() => setSelectedUserIds([])}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
              title="Clear selection"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* CRM Notes Modal */}
      {notesModalOpen && selectedUserForNotes && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-800">
                Notes for {selectedUserForNotes.name || "User"}
              </h2>
              <button 
                onClick={() => setNotesModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Write a follow up note, status, or remark..."
                className="w-full h-32 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
              />
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button 
                onClick={() => setNotesModalOpen(false)}
                className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {savingNotes ? <Loader2 size={16} className="animate-spin" /> : null}
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Customer Premium Drawer */}
      <CustomerPremiumDrawer
        isOpen={premiumDrawer.open}
        onClose={() => setPremiumDrawer({ open: false, user: null })}
        customer={premiumDrawer.user ? {
          id: premiumDrawer.user.id,
          name: premiumDrawer.user.name,
          email: premiumDrawer.user.email,
          phone: premiumDrawer.user.phone,
          clerkId: premiumDrawer.user.clerkId,
          businessName: premiumDrawer.user.businessName
        } : null}
        onPremiumUpdated={(updatedPremium) => {
          if (premiumDrawer.user) {
            setUsers(prev => prev.map(item => item.id === premiumDrawer.user?.id ? {
              ...item,
              premium: updatedPremium
            } : item));
          }
        }}
      />

      {/* Details Drill-down Modal */}
      {detailsModal.open && detailsModal.user && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span className="capitalize">{detailsModal.type}</span> for {detailsModal.user.name}
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md text-xs font-bold">
                  {detailsTotalItems} Total
                </span>
              </h2>
              <button 
                onClick={() => setDetailsModal({ open: false, type: "bills", user: null })}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto flex-1">
              {detailsLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
                  <Loader2 size={32} className="animate-spin text-indigo-500" />
                  <p className="text-sm font-medium">Loading {detailsModal.type}...</p>
                </div>
              ) : detailsData.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  No {detailsModal.type} found for this user.
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 border-b border-slate-100 z-10">
                    {detailsModal.type === "bills" ? (
                      <tr>
                        <th className="px-6 py-3">Bill No</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Customer</th>
                        <th className="px-6 py-3">Payment</th>
                        <th className="px-6 py-3 text-right">Amount</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="px-6 py-3">Item Name</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">Tax Status</th>
                        <th className="px-6 py-3 text-right">Price</th>
                        <th className="px-6 py-3 text-center">Status</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailsModal.type === "bills" ? detailsData.map((b: any) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 font-medium text-slate-800">{b.billNo}</td>
                        <td className="px-6 py-3 text-slate-600">{b.createdAt ? format(new Date(b.createdAt), "PPp") : "—"}</td>
                        <td className="px-6 py-3 font-medium text-slate-800">{b.customerName}</td>
                        <td className="px-6 py-3 text-slate-600">{b.paymentMode}</td>
                        <td className="px-6 py-3 text-right font-black text-slate-800">₹{b.total}</td>
                      </tr>
                    )) : detailsData.map((i: any) => (
                      <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 font-medium text-slate-800">{i.name}</td>
                        <td className="px-6 py-3 text-slate-600">{i.categoryName}</td>
                        <td className="px-6 py-3 text-slate-600">{i.taxStatus}</td>
                        <td className="px-6 py-3 text-right font-black text-slate-800">₹{i.price}</td>
                        <td className="px-6 py-3 text-center">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${i.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                            {i.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            {detailsTotalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <span className="text-sm text-slate-500">
                  Page <span className="font-medium text-slate-900">{detailsPage}</span> of <span className="font-medium text-slate-900">{detailsTotalPages}</span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchDetailsData(detailsModal.user!, detailsModal.type, detailsPage - 1)}
                    disabled={detailsPage === 1 || detailsLoading}
                    className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchDetailsData(detailsModal.user!, detailsModal.type, detailsPage + 1)}
                    disabled={detailsPage >= detailsTotalPages || detailsLoading}
                    className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string; value?: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-slate-800 mt-1">
          {value !== undefined ? value.toLocaleString() : "..."}
        </p>
      </div>
    </div>
  );
}
