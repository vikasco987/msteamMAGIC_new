"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Users, TrendingUp, AlertCircle, Loader2, BarChart3, Search, Download, FileText, X } from "lucide-react";

interface POSUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  posNotes?: string;
  createdAt: string;
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

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchData = async (filterDate?: string, pageNum = 1, search = "") => {
    setLoading(true);
    setError("");
    try {
      let url = `/api/pos-signups?page=${pageNum}`;
      if (filterDate) url += `&date=${filterDate}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch signups data");
      
      const data = await res.json();
      setMetrics(data.metrics);
      setUsers(data.users);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchData(date, page, debouncedSearch);
  }, [page, debouncedSearch]);

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

  const handleExport = async () => {
    try {
      let url = `/api/pos-signups?export=true`;
      if (date) url += `&date=${date}`;
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      const exportUsers = data.users || [];
      
      const csvHeader = "Name,Phone,Email,Role,Status,Notes,Joined At\n";
      const csvRows = exportUsers.map((u: any) => {
        const name = `"${(u.name || "").replace(/"/g, '""')}"`;
        const phone = `"${u.phone || ""}"`;
        const email = `"${u.email || ""}"`;
        const role = `"${u.role || "USER"}"`;
        const status = u.isVerified ? "Verified" : "Unverified";
        const notes = `"${(u.posNotes || "").replace(/"/g, '""')}"`;
        const joined = `"${u.createdAt ? format(new Date(u.createdAt), "PPp") : ""}"`;
        return [name, phone, email, role, status, notes, joined].join(",");
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">POS Sign-ups Monitor</h1>
          <p className="text-sm text-slate-500">Live sign-up tracking from Billgsoftware POS database</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 shadow-sm"
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
          <div className="flex items-center gap-2 ml-auto">
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
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Notes</th>
                <th className="px-6 py-3">Joined At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No sign-ups found.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{u.name || "N/A"}</td>
                  <td className="px-6 py-4 text-slate-800 font-medium">{u.phone || "—"}</td>
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
                          className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait"
                        >
                          {verifyingId === u.id ? "..." : "Verify Now"}
                        </button>
                      </div>
                    )}
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
                  <td className="px-6 py-4 text-slate-500">
                    {u.createdAt ? format(new Date(u.createdAt), "PPp") : "Unknown"}
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
