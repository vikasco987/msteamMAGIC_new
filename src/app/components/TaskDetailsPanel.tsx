import React, { useState, useEffect } from "react";
import { Task } from "../../types/task";
import { FaTimes, FaSpinner, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaFileAlt, FaMoneyBillWave, FaClock, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { format } from "date-fns";

interface TaskDetailsPanelProps {
  taskId: string | null;
  onClose: () => void;
}

export default function TaskDetailsPanel({ taskId, onClose }: TaskDetailsPanelProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) {
      setTask(null);
      return;
    }

    const fetchTaskDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/tasks/${taskId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch task details");
        }
        const data = await res.json();
        setTask(data);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId]);

  return (
    <div className={`fixed inset-0 z-[100] flex justify-end ${taskId ? "opacity-100 visible" : "opacity-0 invisible"} transition-all duration-300`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 overflow-y-auto ${taskId ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/80 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            Task Details
            {task && (
              <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold tracking-wider ${
                task.status === "completed" ? "bg-green-100 text-green-700" :
                task.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                "bg-gray-200 text-gray-700"
              }`}>
                {task.status.replace("_", " ")}
              </span>
            )}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6 flex-1">
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
              <FaSpinner className="animate-spin text-blue-500" size={32} />
              <p className="text-gray-500">Loading task data...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-48 space-y-4 text-red-500">
              <FaExclamationTriangle size={32} />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && task && (
            <div className="space-y-8">
              {/* Core Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Core Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><FaFileAlt /> Title</div>
                    <div className="font-semibold text-gray-800">{task.title || "—"}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><FaClock /> Created At</div>
                    <div className="font-semibold text-gray-800">{task.createdAt ? format(new Date(task.createdAt), "dd MMM yyyy, HH:mm") : "—"}</div>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Customer & Location</h3>
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><FaUser /></div>
                    <div>
                      <div className="text-xs text-gray-500">Shop Name / Customer</div>
                      <div className="font-semibold text-gray-800">{task.customFields?.shopName || "—"}</div>
                    </div>
                  </div>
                  <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                    <div className="bg-purple-50 p-2 rounded-lg text-purple-600"><FaPhone /></div>
                    <div>
                      <div className="text-xs text-gray-500">Phone Number</div>
                      <div className="font-semibold text-gray-800">{task.customFields?.phone || "—"}</div>
                    </div>
                  </div>
                  <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                    <div className="bg-rose-50 p-2 rounded-lg text-rose-600"><FaEnvelope /></div>
                    <div>
                      <div className="text-xs text-gray-500">Email</div>
                      <div className="font-semibold text-gray-800">{task.customFields?.email || "—"}</div>
                    </div>
                  </div>
                  <div className="p-4 flex items-center gap-3">
                    <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><FaMapMarkerAlt /></div>
                    <div>
                      <div className="text-xs text-gray-500">Location</div>
                      <div className="font-semibold text-gray-800">{task.customFields?.location || "—"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financials */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Financials</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
                    <div className="text-xs text-blue-600 font-medium mb-1">Amount</div>
                    <div className="font-bold text-lg text-blue-900">₹{Number(task.amount || 0).toLocaleString()}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center">
                    <div className="text-xs text-green-600 font-medium mb-1">Received</div>
                    <div className="font-bold text-lg text-green-900">₹{Number(task.received || 0).toLocaleString()}</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-center">
                    <div className="text-xs text-red-600 font-medium mb-1">Pending</div>
                    <div className="font-bold text-lg text-red-900">₹{Math.max(0, Number(task.amount || 0) - Number(task.received || 0)).toLocaleString()}</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-center">
                    <div className="text-xs text-orange-600 font-medium mb-1">Cost Price</div>
                    <div className="font-bold text-lg text-orange-900">₹{Number(task.customFields?.costPrice || task.customFields?.afe || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Transaction Details</h3>
                <div className="bg-gray-50 p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">UTR Number</div>
                    <div className="font-semibold text-gray-800 break-all">{task.customFields?.utrNumber || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Transaction ID</div>
                    <div className="font-semibold text-gray-800 break-all">{task.customFields?.transactionId || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">AWB Number</div>
                    <div className="font-semibold text-gray-800 break-all">{task.customFields?.awbNumber || "—"}</div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
