import React from "react";
import { X, Clock, PackageCheck, AlertCircle, ArrowRightLeft, Truck } from "lucide-react";

interface SerialHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  serial: any;
}

export default function SerialHistoryModal({ isOpen, onClose, serial }: SerialHistoryModalProps) {
  if (!isOpen || !serial) return null;

  // Prepare the history timeline
  // The timeline should include current status, and all dispatches.
  
  const dispatches = serial.dispatches || [];
  
  // Sort dispatches by date (newest first)
  const sortedDispatches = [...dispatches].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Available":
      case "Returned":
        return <ArrowRightLeft size={16} className="text-emerald-500" />;
      case "Delivered":
        return <PackageCheck size={16} className="text-indigo-500" />;
      case "Shipped":
      case "In Transit":
        return <Truck size={16} className="text-amber-500" />;
      case "Defective":
        return <AlertCircle size={16} className="text-rose-500" />;
      default:
        return <Clock size={16} className="text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
      case "Returned":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Delivered":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "Shipped":
      case "In Transit":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Defective":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Serial Lifecycle History</h2>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold text-sm">
                {serial.number}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getStatusColor(serial.status)}`}>
                Current: {serial.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content - Timeline */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
          <div className="relative pl-4 border-l-2 border-indigo-100 space-y-8">
            
            {/* Current State (if not covered by dispatch) */}
            {(!sortedDispatches.length || serial.status === "Available" || serial.status === "Defective" || serial.status === "Returned") && (
              <div className="relative">
                <div className={`absolute -left-[25px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                  serial.status === "Available" ? "bg-emerald-100" : 
                  serial.status === "Defective" ? "bg-rose-100" : "bg-slate-100"
                }`}>
                  {getStatusIcon(serial.status)}
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm ml-2">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800">Status Manually Updated</h3>
                    <span className="text-xs font-bold text-slate-400">Current</span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">
                    This unit is currently marked as <span className="font-bold">{serial.status}</span>.
                  </p>
                </div>
              </div>
            )}

            {sortedDispatches.map((dispatch: any, idx: number) => (
              <div key={dispatch.id} className="relative">
                <div className="absolute -left-[25px] w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-white shadow-sm">
                  {getStatusIcon(dispatch.trackingStatus || "Shipped")}
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm ml-2">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-slate-800">Assigned to Task</h3>
                      <p className="text-xs text-indigo-600 font-bold mt-0.5 line-clamp-1">{dispatch.task?.title || "Unknown Task"}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-400 shrink-0">
                      {new Date(dispatch.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded">
                      User: {dispatch.task?.createdByName || dispatch.task?.assigneeName || "Unknown"}
                    </span>
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${getStatusColor(dispatch.trackingStatus || "Shipped")}`}>
                      Status: {dispatch.trackingStatus || "Shipped"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="relative">
              <div className="absolute -left-[25px] w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-white shadow-sm">
                <ArrowRightLeft size={16} className="text-emerald-500" />
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm ml-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800">Added to Inventory</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Added by: {serial.createdByName || "Unknown"}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {new Date(serial.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
