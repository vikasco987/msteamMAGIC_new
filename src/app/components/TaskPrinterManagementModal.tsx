"use client";

import React, { useState, useEffect } from "react";
import { Plus, Link as LinkIcon, Trash2, Printer, ExternalLink, X, Search } from "lucide-react";
import toast from "react-hot-toast";
import TakePrinterModal from "./TakePrinterModal";

interface TaskPrinterManagementModalProps {
  onClose: () => void;
}

export default function TaskPrinterManagementModal({ onClose }: TaskPrinterManagementModalProps) {
  const [taskIdInput, setTaskIdInput] = useState("");
  const [activeTaskId, setActiveTaskId] = useState("");
  
  const [printers, setPrinters] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchPrintersAndRecords = async (tid: string) => {
    if (!tid) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/tasks/${tid}/printers`);
      if (res.ok) {
        const data = await res.json();
        setPrinters(data.printers || []);
        setRecords(data.records || []);
        setActiveTaskId(tid);
      } else {
        toast.error("Could not fetch printers for this task.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error fetching printers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTaskId) {
      fetchPrintersAndRecords(activeTaskId);
    }
  }, [activeTaskId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskIdInput.trim()) return;
    fetchPrintersAndRecords(taskIdInput.trim());
  };

  const removePrinter = async (serialNumberId: string) => {
    if (!confirm("Are you sure you want to remove this printer? It will be marked as Cancelled in records.")) return;
    
    try {
      const res = await fetch(`/api/tasks/${activeTaskId}/printers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serialNumberId })
      });
      if (res.ok) {
        toast.success("Printer removed");
        fetchPrintersAndRecords(activeTaskId);
      } else {
        toast.error("Failed to remove printer");
      }
    } catch (e) {
      toast.error("An error occurred");
    }
  };

  const copyFormLink = () => {
    const link = `${window.location.origin}/printer-form/${activeTaskId}`;
    navigator.clipboard.writeText(link);
    toast.success("Form link copied to clipboard!");
  };

  const openForm = () => {
    window.open(`/printer-form/${activeTaskId}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col overflow-hidden animate-fade-in-up max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Printer size={20} className="text-indigo-600" />
            Manage Printers for Task
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-8">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Enter Task ID</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="e.g. 66edb11d13f9c..."
                  value={taskIdInput}
                  onChange={(e) => setTaskIdInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                Load Printers
              </button>
            </div>
          </form>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500 animate-pulse">Loading task data...</div>
          ) : activeTaskId ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">
                  Printers for <span className="font-mono text-indigo-600 text-sm ml-1">{activeTaskId}</span>
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={copyFormLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50"
                  >
                    <LinkIcon size={14} /> Share Form
                  </button>
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded hover:bg-indigo-700"
                  >
                    <Plus size={14} /> Add Printer
                  </button>
                </div>
              </div>

              <div className="p-4">
                {printers.length === 0 ? (
                  <div className="text-center p-8 text-slate-400 text-sm">
                    No printers assigned to this task yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="pb-2 font-semibold">Printer No / Serial</th>
                          <th className="pb-2 font-semibold">Model / Type</th>
                          <th className="pb-2 font-semibold">Taken By</th>
                          <th className="pb-2 font-semibold">Status</th>
                          <th className="pb-2 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printers.map((p) => {
                          const activeRecord = records.find(r => r.serialNumberId === p.id && r.status !== "Cancelled");
                          
                          return (
                            <tr key={p.id} className="border-b border-slate-100 last:border-0">
                              <td className="py-3 font-mono text-slate-700">{p.number}</td>
                              <td className="py-3 text-slate-600">{p.inventoryItem?.name || "Printer"}</td>
                              <td className="py-3 text-slate-600">
                                {activeRecord ? (
                                  <span className="font-medium text-indigo-700">{activeRecord.takenBy}</span>
                                ) : (
                                  <span className="text-slate-400 italic">Not taken yet</span>
                                )}
                              </td>
                              <td className="py-3">
                                 {activeRecord ? (
                                   <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">{activeRecord.status}</span>
                                 ) : (
                                   <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">Pending Issue</span>
                                 )}
                              </td>
                              <td className="py-3 text-right">
                                <button 
                                  onClick={() => removePrinter(p.id)}
                                  className="text-rose-500 hover:text-rose-700 p-1"
                                  title="Remove Printer"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                <div className="text-xs text-slate-500">
                  Share the form link with the receiver to log their details.
                </div>
                <button 
                  onClick={openForm}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100"
                >
                  <ExternalLink size={14} /> Open Form
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
              <Printer className="mx-auto text-slate-300 mb-3" size={32} />
              <p className="text-slate-500 font-medium">Enter a Task ID above to view and manage its printers.</p>
            </div>
          )}
        </div>

      </div>

      {showAddModal && (
        <TakePrinterModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            if (activeTaskId) fetchPrintersAndRecords(activeTaskId);
          }}
          prefilledTaskId={activeTaskId}
        />
      )}
    </div>
  );
}
