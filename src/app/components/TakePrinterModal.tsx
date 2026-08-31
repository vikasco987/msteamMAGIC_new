"use client";

import React, { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import toast from "react-hot-toast";

interface TakePrinterModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function TakePrinterModal({ onClose, onSuccess }: TakePrinterModalProps) {
  const [printers, setPrinters] = useState<any[]>([]);
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [taskId, setTaskId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAvailablePrinters();
  }, []);

  const fetchAvailablePrinters = async () => {
    try {
      setLoadingPrinters(true);
      const res = await fetch("/api/inventory/serial-numbers?itemName=Printer");
      const data = await res.json();
      if (data.serialNumbers) {
        // Only show printers that are available or not already assigned (based on your logic)
        setPrinters(data.serialNumbers.filter((s: any) => s.status === "Available" || s.status === "Returned"));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPrinters(false);
    }
  };

  const filteredPrinters = printers.filter(p => 
    p.number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrinter || !taskId) {
      toast.error("Please select a printer and enter a Task ID");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/printer-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          printerNo: selectedPrinter,
          taskId: taskId,
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Printer assigned successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Failed to assign printer");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-black text-slate-800">🖨️ Take Printer</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Printer Selection with Search */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Printer Number</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Search printer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-t-lg text-sm font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="border border-t-0 border-slate-200 rounded-b-lg max-h-40 overflow-y-auto bg-slate-50 p-1">
              {loadingPrinters ? (
                <p className="text-xs text-center p-3 text-slate-400">Loading...</p>
              ) : filteredPrinters.length === 0 ? (
                <p className="text-xs text-center p-3 text-slate-400">No printers found</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredPrinters.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPrinter(p.number)}
                      className={`text-left px-3 py-2 text-xs font-mono rounded ${selectedPrinter === p.number ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-200 text-slate-700'}`}
                    >
                      {p.number}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedPrinter && (
              <p className="mt-2 text-xs font-bold text-indigo-600 flex items-center gap-1">
                ✓ Selected: <span className="bg-indigo-100 px-2 py-0.5 rounded font-mono">{selectedPrinter}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Task ID Reference</label>
            <input
              required
              type="text"
              placeholder="e.g. TASK-1234"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="mt-2 bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Auto-Logged Information</span>
            <p className="text-xs text-indigo-800 font-medium">Your name will be automatically recorded as the assignee.</p>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-500 font-bold text-sm hover:text-slate-700">Cancel</button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Take Printer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
