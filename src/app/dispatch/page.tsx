"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";

export default function DispatchDashboard() {
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All Shipments");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // State for the Task Details Modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const TABS = [
    "Ready To Ship",
    "Ready For Pickup",
    "In Transit",
    "RTO In-Transit",
    "Delivered",
    "All Shipments"
  ];

  const fetchDispatches = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dispatch?status=" + (activeTab === "All Shipments" ? "" : activeTab));
      const data = await res.json();
      setDispatches(data.dispatches || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatches();
  }, [activeTab]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      await fetch(`/api/dispatch/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingStatus: newStatus })
      });
      fetchDispatches();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 hidden md:flex">
        <div>
          <h3 className="text-xs font-black text-slate-400 mb-4 tracking-widest">SHIPMENT STATES</h3>
          <div className="flex flex-col gap-1">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-slate-800">{activeTab}</h1>
          <a href="/inventory" className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-colors">
            Manage Inventory
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Order ID & AWB</th>
                  <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Manifested Date</th>
                  <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Customer Details</th>
                  <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">Loading shipments...</td>
                  </tr>
                ) : dispatches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">No shipments found in this state.</td>
                  </tr>
                ) : (
                  dispatches.map((log) => (
                    <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                            📦
                          </div>
                          <div>
                            <p 
                              className="text-sm font-bold text-indigo-600 hover:underline cursor-pointer"
                              onClick={() => setSelectedLog(log)}
                            >
                              {log.task.title || "Order"}
                            </p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5 tracking-wide">
                              AWB: {log.awbNumber}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <p className="text-sm font-medium text-slate-700">
                          {log.dispatchDate ? format(new Date(log.dispatchDate), "dd MMM, yyyy") : "N/A"}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {log.dispatchDate ? format(new Date(log.dispatchDate), "hh:mm a") : ""}
                        </p>
                      </td>
                      <td className="p-4 align-top max-w-[200px]">
                        <div className="flex gap-2">
                          <div className="w-0.5 bg-slate-200 mt-2 mb-2 rounded" />
                          <div>
                            <p className="text-xs font-bold text-slate-700 truncate" title={log.task.customerName || log.task.shopName || "Unknown"}>
                              {log.task.customerName || log.task.shopName || "Unknown"}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2" title={log.task.customFields?.fullAddress || log.task.location || "No Address"}>
                              {log.task.customFields?.fullAddress || log.task.location || "No Address"}
                            </p>
                            <p className="text-[10px] font-medium text-slate-500 mt-1">
                              📞 {log.task.customFields?.phone || log.task.phone || "No Phone"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          log.trackingStatus === "Delivered" ? "bg-emerald-100 text-emerald-700" :
                          log.trackingStatus === "In Transit" ? "bg-amber-100 text-amber-700" :
                          log.trackingStatus === "RTO In-Transit" ? "bg-rose-100 text-rose-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {log.trackingStatus}
                        </span>
                      </td>
                      <td className="p-4 align-top text-right">
                        <div className="flex flex-col gap-2 items-end">
                          <select 
                            className="text-xs font-bold border border-slate-200 rounded p-1 focus:ring-indigo-500 outline-none cursor-pointer bg-white"
                            value={log.trackingStatus}
                            onChange={(e) => updateStatus(log.id, e.target.value)}
                            disabled={updatingId === log.id}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Ready To Ship">Ready To Ship</option>
                            <option value="Ready For Pickup">Ready For Pickup</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Delivered">Delivered</option>
                            <option value="RTO In-Transit">RTO In-Transit</option>
                          </select>
                          
                          <a 
                            href={`https://www.google.com/search?q=track+awb+${log.awbNumber}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            Track Online ↗
                          </a>
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

      {/* Task Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-black text-slate-800">{selectedLog.task.title || "Order Details"}</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Task ID: {selectedLog.task.id}
                </p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-white rounded-b-2xl">
              {/* Tracking History */}
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Status History</h3>
              <div className="mb-8 border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-3 text-[10px] font-black uppercase text-slate-500 tracking-widest">Status</th>
                      <th className="p-3 text-[10px] font-black uppercase text-slate-500 tracking-widest">Updated By</th>
                      <th className="p-3 text-[10px] font-black uppercase text-slate-500 tracking-widest">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLog.history && selectedLog.history.length > 0 ? (
                      selectedLog.history.map((h: any, i: number) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="p-3">
                            <span className="text-xs font-bold text-slate-700">{h.status}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-xs font-medium text-slate-600">{h.changedBy || "System"}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-xs text-slate-500">
                              {h.changedAt ? format(new Date(h.changedAt), "dd MMM, hh:mm a") : "N/A"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-xs font-bold text-slate-400">
                          No history found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Assignment Info */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Created By</p>
                  <p className="text-sm font-bold text-slate-800">{selectedLog.task.createdByName || selectedLog.task.assignerName || "Unknown"}</p>
                  {selectedLog.task.createdByEmail && <p className="text-xs text-slate-500 mt-0.5">{selectedLog.task.createdByEmail}</p>}
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Assigned To</p>
                  <p className="text-sm font-bold text-slate-800">{selectedLog.task.assigneeName || "Unassigned"}</p>
                  {selectedLog.task.assigneeEmail && <p className="text-xs text-slate-500 mt-0.5">{selectedLog.task.assigneeEmail}</p>}
                </div>
              </div>

              {/* Customer Details */}
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Customer & Delivery Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div>
                  <p className="text-xs font-bold text-slate-500">Customer Name</p>
                  <p className="text-sm font-medium text-slate-800">{selectedLog.task.customerName || selectedLog.task.customFields?.customerName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Shop / Outlet</p>
                  <p className="text-sm font-medium text-slate-800">{selectedLog.task.shopName || selectedLog.task.customFields?.shopName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Phone</p>
                  <p className="text-sm font-medium text-slate-800">{selectedLog.task.phone || selectedLog.task.customFields?.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-800">{selectedLog.task.email || selectedLog.task.customFields?.email || "N/A"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-bold text-slate-500">Full Address</p>
                  <p className="text-sm font-medium text-slate-800">{selectedLog.task.customFields?.fullAddress || selectedLog.task.location || "N/A"}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {[selectedLog.task.customFields?.city, selectedLog.task.customFields?.state, selectedLog.task.customFields?.pincode].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>

              {/* Package Details */}
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Package & Billing</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedLog.task.customFields?.softwareDuration && (
                  <div>
                    <p className="text-xs font-bold text-slate-500">Software Duration</p>
                    <p className="text-sm font-medium text-slate-800">{selectedLog.task.customFields.softwareDuration}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-slate-500">Package Amount</p>
                  <p className="text-sm font-medium text-slate-800">{selectedLog.task.packageAmount || selectedLog.task.customFields?.packageAmount ? `₹${selectedLog.task.packageAmount || selectedLog.task.customFields?.packageAmount}` : "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Cost Price</p>
                  <p className="text-sm font-medium text-slate-800">{selectedLog.task.customFields?.costPrice ? `₹${selectedLog.task.customFields.costPrice}` : "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Delivery Charge</p>
                  <p className="text-sm font-medium text-slate-800">{selectedLog.task.customFields?.deliveryCharge ? `₹${selectedLog.task.customFields.deliveryCharge}` : "N/A"}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
              <a 
                href={`/team-board?task=${selectedLog.task.id}`} 
                className="text-xs font-bold bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition-colors"
              >
                View Full Task ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
