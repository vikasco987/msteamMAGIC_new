"use client";

import React, { useEffect, useState } from "react";
import { Printer, Calendar, User, Hash, Filter, ChevronLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function PrinterReportPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigneeFilter, setAssigneeFilter] = useState("All");

  const fetchLogs = async (assignee: string = "All") => {
    try {
      setLoading(true);
      const res = await fetch(`/api/printer-assignment?assignee=${encodeURIComponent(assignee)}`);
      const data = await res.json();
      if (res.ok) {
        setLogs(data.data || []);
      } else {
        toast.error(data.error || "Failed to fetch report");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(assigneeFilter);
  }, [assigneeFilter]);

  // Extract unique assignees for the filter dropdown
  const uniqueAssignees = Array.from(new Set(logs.map(log => log.assigneeName).filter(Boolean)));

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/inventory" className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Printer className="text-indigo-600" size={26} /> Printer Assignment Report
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Track who took which printer and for which task
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <label className="text-sm font-bold text-slate-600">Filter by Assignee:</label>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="ml-2 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="All">All Assignees</option>
                {uniqueAssignees.map(name => (
                  <option key={name as string} value={name as string}>{name}</option>
                ))}
              </select>
            </div>
            <div className="text-sm font-bold text-slate-500 bg-white px-4 py-2 border border-slate-200 rounded-lg">
              Total Assigned: <span className="text-indigo-600 font-black">{logs.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Date & Time</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Task ID</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Printer No.</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Assigned To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 font-bold">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        Loading report...
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 font-bold italic">
                      No printer assignments found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          <div>
                            <p className="text-sm font-bold text-slate-700">
                              {new Date(log.assignedAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs font-semibold text-slate-400">
                              {new Date(log.assignedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-sm font-black font-mono">
                          <Hash size={14} className="text-indigo-400" />
                          {log.taskId}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-sm font-bold font-mono">
                          <Printer size={14} className="text-amber-500" />
                          {log.printerNo}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">{log.assigneeName}</p>
                            <p className="text-xs text-slate-400 font-medium">{log.assigneeEmail}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
