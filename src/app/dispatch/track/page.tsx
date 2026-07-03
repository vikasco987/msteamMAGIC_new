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
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [productTitle, setProductTitle] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);
  const [outletName, setOutletName] = useState<string | null>(null);
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
        setCustomerEmail(data.customerEmail || null);
        setProductTitle(data.productTitle || null);
        setShopName(data.shopName || null);
        setOutletName(data.outletName || null);
      } else {
        // If tracking by a direct AWB, don't clear previous dispatches unless they differ
        setCustomerPhone(null);
        setCustomerEmail(null);
        setProductTitle(null);
        setShopName(null);
        setOutletName(null);
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

  const getDeliveryAttemptsInfo = () => {
    if (!trackingData || !Array.isArray(trackingData.Scans)) return null;

    const outForDeliveryScans = trackingData.Scans.filter((scanWrap: any) => {
      const scanDetail = scanWrap.ScanDetail?.Scan || "";
      const scanInstructions = scanWrap.ScanDetail?.Instructions || "";
      return scanDetail.toLowerCase().includes("out for delivery") || 
             scanInstructions.toLowerCase().includes("out for delivery");
    });

    const attemptsMade = outForDeliveryScans.length;
    const maxAttempts = 3;
    const remainingAttempts = Math.max(0, maxAttempts - attemptsMade);
    const isLastAttempt = remainingAttempts === 0 && !trackingData.Status?.Status?.toLowerCase().includes("delivered");

    return {
      attemptsMade,
      remainingAttempts,
      isLastAttempt
    };
  };

  const getExpectedDeliveryBadge = () => {
    if (!trackingData?.ExpectedDeliveryDate) return null;
    try {
      const today = new Date();
      const expected = new Date(trackingData.ExpectedDeliveryDate);
      
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const expectedDateOnly = new Date(expected.getFullYear(), expected.getMonth(), expected.getDate());
      const diffTime = expectedDateOnly.getTime() - todayDateOnly.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return (
          <div className="mt-3 bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest px-3 py-1.5 rounded-xl w-fit flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 animate-pulse">
            <span>📦</span> Arriving Today!
          </div>
        );
      } else if (diffDays === 1) {
        return (
          <div className="mt-3 bg-indigo-500 text-white font-black uppercase text-[10px] tracking-widest px-3 py-1.5 rounded-xl w-fit flex items-center gap-1.5 shadow-lg shadow-indigo-500/25">
            <span>🚚</span> Arriving Tomorrow!
          </div>
        );
      } else if (diffDays > 1 && diffDays <= 3) {
        return (
          <div className="mt-3 bg-blue-500 text-white font-black uppercase text-[10px] tracking-widest px-3 py-1.5 rounded-xl w-fit flex items-center gap-1.5 shadow-lg shadow-blue-500/25">
            <span>📅</span> Arriving in {diffDays} days
          </div>
        );
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const getStepIndex = (statusStr: string, instructionsStr: string) => {
    const s = (statusStr || "").toLowerCase();
    const inst = (instructionsStr || "").toLowerCase();
    if (s.includes("delivered") || inst.includes("delivered")) return 5;
    if (s.includes("rto") || s.includes("return") || inst.includes("rto") || inst.includes("return")) return 5;
    if (s.includes("out for delivery") || inst.includes("out for delivery")) return 4;
    if (s.includes("in transit") || s.includes("transit") || s.includes("scanned") || inst.includes("in transit") || inst.includes("transit") || inst.includes("scanned")) return 3;
    if (s.includes("dispatched") || s.includes("manifest") || inst.includes("dispatched") || inst.includes("manifest")) return 2;
    return 1;
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
                {trackingData.ExpectedDeliveryDate && (
                  <p className="text-emerald-400 font-bold text-sm mt-3 flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/25 px-3 py-1.5 rounded-xl w-fit">
                    <span>📅 Expected Delivery: {format(new Date(trackingData.ExpectedDeliveryDate), "dd MMM yyyy")}</span>
                    <span className="inline-block px-1 py-0.2 text-[8px] font-black tracking-widest uppercase bg-emerald-900/60 text-emerald-300 rounded border border-emerald-800">Delhivery API</span>
                  </p>
                )}
                {getExpectedDeliveryBadge()}
              </div>
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 text-right">
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">AWB Number</p>
                <p className="text-xl font-black tracking-wider">{trackingData.AWB}</p>
              </div>
            </div>
          </div>

          {/* Step Progress Tracker */}
          {(() => {
            const currentStatus = trackingData.Status?.Status || "";
            const currentInstructions = trackingData.Status?.Instructions || "";
            const activeStep = getStepIndex(currentStatus, currentInstructions);
            const isRTO = currentStatus.toLowerCase().includes("rto") || currentStatus.toLowerCase().includes("return") || currentInstructions.toLowerCase().includes("rto") || currentInstructions.toLowerCase().includes("return");
            
            const steps = [
              { name: "Ordered", icon: "📝" },
              { name: "Dispatched", icon: "🚚" },
              { name: "In Transit", icon: "✈️" },
              { name: "Out for Delivery", icon: "🛵" },
              { name: isRTO ? "RTO" : "Delivered", icon: isRTO ? "❌" : "✅" }
            ];

            return (
              <div className="bg-slate-50 border-b border-slate-100 p-8 overflow-x-auto">
                <div className="flex items-center justify-between relative min-w-[500px] max-w-xl mx-auto">
                  {/* Background Progress Bar Line */}
                  <div className="absolute left-6 right-6 top-5 h-1 bg-slate-200 rounded-full z-0">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isRTO ? 'bg-rose-500' : 'bg-indigo-600'}`}
                      style={{ width: `${((activeStep - 1) / 4) * 100}%` }}
                    ></div>
                  </div>

                  {/* Step Nodes */}
                  {steps.map((step, idx) => {
                    const stepNum = idx + 1;
                    const isCompleted = stepNum < activeStep;
                    const isActive = stepNum === activeStep;

                    let nodeBg = "bg-slate-100 text-slate-400 border-slate-200";
                    if (isCompleted) {
                      nodeBg = isRTO ? "bg-rose-100 text-rose-600 border-rose-200" : "bg-indigo-100 text-indigo-600 border-indigo-200";
                    } else if (isActive) {
                      nodeBg = isRTO ? "bg-rose-500 text-white border-rose-500 ring-4 ring-rose-100 animate-pulse" : "bg-indigo-500 text-white border-indigo-500 ring-4 ring-indigo-100";
                    }

                    return (
                      <div key={idx} className="flex flex-col items-center z-10 relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-black transition-all duration-300 ${nodeBg}`}>
                          {isCompleted && !isActive ? (isRTO && stepNum === 5 ? "❌" : "✓") : step.icon}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-wider mt-2 bg-white px-2 py-0.5 rounded-full shadow-sm border border-slate-100 ${isActive ? (isRTO ? 'text-rose-600 border-rose-100' : 'text-indigo-600 border-indigo-100') : (isCompleted ? 'text-slate-600' : 'text-slate-400')}`}>
                          {step.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              {/* Details */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span>👤</span> Consignee Details
                </h3>
                <div className="space-y-4">
                  {/* Name from Delhivery */}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-700 text-lg">{trackingData.Consignee?.Name || "N/A"}</p>
                      <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-sky-50 text-sky-600 border border-sky-100/80 rounded">Delhivery</span>
                    </div>
                    {/* Destination/Address from Delhivery */}
                    <p className="text-sm text-slate-500 mt-1">{trackingData.Destination || "N/A"}</p>
                    {trackingData.Consignee?.City && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {trackingData.Consignee.City}, {trackingData.Consignee.State} - {trackingData.Consignee.PinCode}
                      </p>
                    )}
                  </div>

                  {/* ShopName from Task DB */}
                  {(shopName || outletName) && (
                    <div className="pt-2 border-t border-slate-200/50">
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-600 font-extrabold text-sm flex items-center gap-1">
                          🏬 {shopName || outletName}
                        </span>
                        <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100/80 rounded">Task DB</span>
                      </div>
                    </div>
                  )}

                  {/* Contact/Phone/Email from Task DB */}
                  {(customerPhone || customerEmail) && (
                    <div className="pt-3 border-t border-slate-200/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local Database Info</p>
                        <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100/80 rounded">Task DB</span>
                      </div>
                      <div className="space-y-1.5">
                        {customerPhone && (
                          <p className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                            <span>📞</span> {customerPhone}
                          </p>
                        )}
                        {customerEmail && (
                          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                            <span>✉️</span> {customerEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <span>📝</span> Shipment Info
                  </h3>
                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-sky-50 text-sky-600 border border-sky-100/80 rounded">Delhivery</span>
                </div>
                <div className="grid grid-cols-2 gap-y-4">
                  {productTitle && (
                    <div className="col-span-2 border-b border-slate-200/50 pb-2 mb-1 flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product / Item</p>
                        <p className="font-extrabold text-slate-800 text-sm">{productTitle}</p>
                      </div>
                      <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100/80 rounded">Task DB</span>
                    </div>
                  )}
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
                  {(() => {
                    const attemptsInfo = getDeliveryAttemptsInfo();
                    if (!attemptsInfo) return null;
                    return (
                      <div className="col-span-2 border-t border-slate-200/50 pt-4 mt-2">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Attempts</p>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase
                            ${attemptsInfo.isLastAttempt 
                              ? "bg-rose-50 text-rose-600 border border-rose-100 animate-pulse" 
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}>
                            {attemptsInfo.attemptsMade} / 3 Attempts
                          </span>
                        </div>
                        
                        {/* Progress Bar of attempts */}
                        <div className="flex gap-1.5 mt-1.5">
                          {[1, 2, 3].map((num) => {
                            const isAttempted = num <= attemptsInfo.attemptsMade;
                            return (
                              <div 
                                key={num} 
                                className={`h-2 flex-1 rounded-full ${
                                  isAttempted 
                                    ? (attemptsInfo.isLastAttempt ? 'bg-rose-500 animate-pulse' : 'bg-indigo-600') 
                                    : 'bg-slate-200'
                                }`}
                              ></div>
                            );
                          })}
                        </div>

                        {attemptsInfo.isLastAttempt && (
                          <div className="mt-3 bg-rose-50 text-rose-700 p-2.5 rounded-xl border border-rose-100 text-[11px] font-bold leading-normal flex items-start gap-2">
                            <span className="text-sm mt-0.5">⚠️</span>
                            <div>
                              <p className="font-black text-rose-800">Final Delivery Attempt!</p>
                              <p className="font-medium text-rose-600 mt-0.5">3 attempts have been made. Please contact the consignee immediately to prevent RTO return.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
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
