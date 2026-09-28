"use client";

import React, { useState, useEffect } from "react";
import { Plus, Link as LinkIcon, Trash2, Printer, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import TakePrinterModal from "./TakePrinterModal";

interface TaskPrinterManagementProps {
  taskId: string;
}

export default function TaskPrinterManagement({ taskId }: TaskPrinterManagementProps) {
  const [printers, setPrinters] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchPrintersAndRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tasks/${taskId}/printers`);
      if (res.ok) {
        const data = await res.json();
        setPrinters(data.printers || []);
        setRecords(data.records || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrintersAndRecords();
  }, [taskId]);

  const removePrinter = async (serialNumberId: string) => {
    if (!confirm("Are you sure you want to remove this printer? It will be marked as Cancelled in records.")) return;
    
    try {
      const res = await fetch(`/api/tasks/${taskId}/printers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serialNumberId })
      });
      if (res.ok) {
        toast.success("Printer removed");
        fetchPrintersAndRecords();
      } else {
        toast.error("Failed to remove printer");
      }
    } catch (e) {
      toast.error("An error occurred");
    }
  };

  const copyFormLink = () => {
    const link = `${window.location.origin}/printer-form/${taskId}`;
    navigator.clipboard.writeText(link);
    toast.success("Form link copied to clipboard!");
  };

  const openForm = () => {
    window.open(`/printer-form/${taskId}`, "_blank");
  };

  if (loading) return <div className="p-4 text-center text-sm text-slate-500">Loading printers...</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-6">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Printer size={18} className="text-indigo-600" />
          Printer Management
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
                  // Find if there's an active record for this printer
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

      {showAddModal && (
        <TakePrinterModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchPrintersAndRecords();
          }}
          prefilledTaskId={taskId} // We need to update TakePrinterModal to accept this
        />
      )}
    </div>
  );
}
