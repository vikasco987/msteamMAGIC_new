"use client";

import React, { useState, useEffect, Suspense } from "react";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";

function TrackAWBContent() {
  const searchParams = useSearchParams();
  const queryAwb = searchParams.get("awb") || "";

  const [awb, setAwb] = useState(queryAwb);
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any | null>(null);
  const [previousDispatches, setPreviousDispatches] = useState<any[]>([]);
  const [customerPhone, setCustomerPhone] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  const fetchTracking = async (awbToTrack: string) => {
    if (!awbToTrack.trim()) return;
    try {
      setLoading(true);
      setError("");
      setTrackingData(null);
      
      const res = await fetch(`/api/dispatch/track?awb=${awbToTrack.trim()}`);
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Failed to fetch from server.");
        return;
      }

      let finalData = data;
      if (data.isTaskId) {
        finalData = data.activeTracking;
        setPreviousDispatches(data.previousDispatches || []);
        setCustomerPhone(data.customerPhone || null);
      } else {
        // If tracking by a direct AWB, don't clear previous dispatches unless they differ
        setCustomerPhone(null);
      }
      
      if (finalData.Error) {
        setError(finalData.Error);
      } else if (finalData.ShipmentData && finalData.ShipmentData.length > 0) {
        setTrackingData(finalData.ShipmentData[0].Shipment);
      } else {
        setError("Could not parse shipment data or no data found.");
      }
    } catch (err: any) {
      setError("Failed to fetch tracking data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryAwb && !initialFetchDone) {
      fetchTracking(queryAwb);
      setInitialFetchDone(true);
    }
  }, [queryAwb, initialFetchDone]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(awb);
  };

  return (
    <div className="w-full max-w-3xl">
      <a href="/dispatch" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 mb-6 inline-block">
        ← Back to Dispatch
      </a>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 mb-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
          📦
        </div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Track Shipment</h1>
        <p className="text-slate-500 font-medium mb-8">Enter your AWB number or Task ID to get real-time status updates.</p>
        
        <form onSubmit={handleTrack} className="flex gap-4 max-w-lg mx-auto">
          <input 
            type="text" 
            placeholder="Enter AWB or Task ID" 
            value={awb}
            onChange={(e) => setAwb(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-bold text-slate-700"
            required
          />
          <button 
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? "Tracking..." : "Track"}
          </button>
        </form>
        
        {error && (
          <div className="mt-6 bg-rose-50 text-rose-600 p-4 rounded-xl font-bold border border-rose-100">
            ❌ {error}
          </div>
        )}
      </div>

      {previousDispatches.length > 0 && (
        <div className="bg-slate-100 rounded-3xl p-6 mb-8 border border-slate-200 shadow-sm">
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-3">
            📦 Previous Shipments (RTO / Returned)
          </p>
          <div className="flex flex-wrap gap-3">
            {previousDispatches.map((prev, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAwb(prev.awbNumber);
                  fetchTracking(prev.awbNumber);
                }}
                className="bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-100 transition-all rounded-xl px-4 py-2.5 shadow-sm text-xs font-bold flex items-center gap-2"
              >
                <span>📦</span> AWB: {prev.awbNumber} ({prev.trackingStatus || "RTO"})
              </button>
            ))}
          </div>
        </div>
      )}

      {trackingData && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Header / Current Status */}
          <div className="bg-slate-900 text-white p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Current Status</p>
                <h2 className="text-3xl font-black text-white">{trackingData.Status?.Status || "Unknown"}</h2>
                <p className="text-slate-300 font-medium mt-2 max-w-md">{trackingData.Status?.Instructions || ""}</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 text-right">
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">AWB Number</p>
                <p className="text-xl font-black tracking-wider">{trackingData.AWB}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              {/* Details */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span>👤</span> Consignee Details
                </h3>
                <p className="font-bold text-slate-700 text-lg mb-1">{trackingData.Consignee?.Name || "N/A"}</p>
                <p className="text-sm text-slate-500">{trackingData.Destination || "N/A"}</p>
                {trackingData.Consignee?.City && (
                  <p className="text-xs text-slate-400 mt-1">
                    {trackingData.Consignee.City}, {trackingData.Consignee.State} - {trackingData.Consignee.PinCode}
                  </p>
                )}
                {customerPhone && (
                  <p className="text-sm font-semibold text-slate-600 mt-3 flex items-center gap-1.5 pt-2 border-t border-slate-200/50">
                    <span>📞</span> {customerPhone}
                  </p>
                )}
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span>📝</span> Shipment Info
                </h3>
                <div className="grid grid-cols-2 gap-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Type</p>
                    <p className="font-bold text-slate-700">{trackingData.OrderType || "N/A"}</p>
                  </div>
                  {trackingData.OrderType === "COD" && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">COD Amount</p>
                      <p className="font-bold text-indigo-600">₹{trackingData.CODAmount || 0}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin</p>
                    <p className="font-bold text-slate-700 text-sm">{trackingData.Origin || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pickup Date</p>
                    <p className="font-bold text-slate-700 text-sm">
                      {trackingData.PickUpDate ? format(new Date(trackingData.PickUpDate), "dd MMM, yy") : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Scans Timeline */}
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Tracking History</h3>
            <div className="relative pl-4 border-l-2 border-slate-200 space-y-8">
              {trackingData.Scans && trackingData.Scans.length > 0 ? (
                [...trackingData.Scans].reverse().map((scanWrap: any, index: number) => {
                  const scan = scanWrap.ScanDetail;
                  const isLatest = index === 0;
                  return (
                    <div key={index} className="relative">
                      <div className={`absolute -left-[21px] w-3 h-3 rounded-full mt-1.5 ${isLatest ? 'bg-indigo-600 ring-4 ring-indigo-100' : 'bg-slate-300'}`}></div>
                      <div className={`p-4 rounded-xl border ${isLatest ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100'} shadow-sm`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
                          <h4 className={`font-black text-sm uppercase tracking-wider ${isLatest ? 'text-indigo-700' : 'text-slate-700'}`}>
                            {scan.Scan}
                          </h4>
                          <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                            {scan.ScanDateTime ? format(new Date(scan.ScanDateTime), "dd MMM yyyy, hh:mm a") : "N/A"}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-600 mb-2">{scan.Instructions}</p>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                          <span>📍</span> {scan.ScannedLocation}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm font-bold text-slate-400 italic">No tracking history found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackAWBPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 md:p-12 relative overflow-y-auto">
      <Suspense fallback={<div>Loading Tracking...</div>}>
        <TrackAWBContent />
      </Suspense>
    </div>
  );
}
