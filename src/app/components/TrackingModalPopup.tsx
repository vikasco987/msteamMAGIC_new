"use client";

import React, { useEffect, useState } from "react";
import { FaTimes, FaShippingFast, FaCheckCircle, FaSpinner, FaExternalLinkAlt, FaBoxOpen, FaMapMarkerAlt, FaCalendarAlt, FaPhoneAlt, FaUser } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface TrackingModalPopupProps {
  isOpen: boolean;
  onClose: () => void;
  awbNumber: string;
  initialTask?: any;
}

export default function TrackingModalPopup({
  isOpen,
  onClose,
  awbNumber,
  initialTask,
}: TrackingModalPopupProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trackingData, setTrackingData] = useState<any | null>(null);
  const [taskData, setTaskData] = useState<any | null>(initialTask || null);

  useEffect(() => {
    if (!isOpen || !awbNumber) return;

    let isMounted = true;
    const fetchTracking = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/dispatch/track?awb=${encodeURIComponent(awbNumber.trim())}`);
        const data = await res.json();
        if (!isMounted) return;

        if (!res.ok) {
          setError(data.error || "Failed to load tracking data");
          return;
        }

        if (data.isTaskId) {
          setTaskData({
            customerPhone: data.customerPhone,
            customerEmail: data.customerEmail,
            productTitle: data.productTitle,
            shopName: data.shopName,
            outletName: data.outletName,
          });
        }

        if (data.Error) {
          setError(data.Error);
        } else if (data.ShipmentData && data.ShipmentData.length > 0) {
          setTrackingData(data.ShipmentData[0].Shipment);
        } else {
          setError("No tracking information available for this waybill.");
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load tracking details");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTracking();
    return () => {
      isMounted = false;
    };
  }, [isOpen, awbNumber]);

  if (!isOpen) return null;

  const scans = trackingData?.Scans || [];
  const latestStatus = trackingData?.Status?.Status || "In Transit";
  const instructions = trackingData?.Status?.Instructions || "";
  const courier = trackingData?.Courier || "Courier";

  // Customer info from API vs DB
  const cf = initialTask?.customFields || {};
  const dbPhone = initialTask?.phone || cf.phone || taskData?.customerPhone;
  const dbCustomerName = initialTask?.customerName || cf.customerName || initialTask?.shopName || cf.shopName || taskData?.shopName;
  const dbAddress = cf.fullAddress || initialTask?.location || cf.location || "";
  const dbPincode = cf.pincode || "";
  const dbCity = cf.city || "";
  const dbState = cf.state || "";

  const apiConsignee = trackingData?.Consignee || {};

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <FaShippingFast size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-wide">Track Shipment</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {courier} API
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">AWB: {awbNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/dispatch/track?awb=${encodeURIComponent(awbNumber)}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Open full page"
            >
              <FaExternalLinkAlt size={14} />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <FaTimes size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
              <FaSpinner className="animate-spin text-indigo-600" size={32} />
              <p className="text-sm font-bold">Fetching real-time tracking from {courier} API...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium">
              ❌ {error}
            </div>
          ) : (
            <>
              {/* Status Header Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-indigo-950/20">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      Current Status
                    </span>
                  </div>
                  <h2 className="text-xl font-black mt-1 text-white">{latestStatus}</h2>
                  {instructions && (
                    <p className="text-xs text-slate-300 mt-1 max-w-md">{instructions}</p>
                  )}
                </div>

                <div className="flex flex-col items-end bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
                  <span className="text-[10px] font-bold text-slate-300 uppercase">Payment & Amount</span>
                  <span className="text-sm font-black text-emerald-400 mt-0.5">
                    {trackingData?.OrderType || "COD"} • ₹{trackingData?.CODAmount || trackingData?.ProductValue || 0}
                  </span>
                </div>
              </div>

              {/* Grid: Consignee & Shipment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Consignee / Customer Details */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FaUser className="text-indigo-600" /> Consignee Details
                    </h4>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                      CRM DB + API
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Customer / Shop Name</p>
                      <p className="font-extrabold text-slate-800">
                        {apiConsignee.Name || dbCustomerName || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p>
                      <p className="font-bold text-slate-700 flex items-center gap-1.5">
                        <FaPhoneAlt size={10} className="text-slate-400" />
                        {dbPhone || "—"}
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          TASK DB
                        </span>
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Destination Address</p>
                      <p className="text-slate-600 font-medium leading-relaxed">
                        {apiConsignee.Address || dbAddress || `${dbCity}, ${dbState} ${dbPincode}` || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shipment Info */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FaBoxOpen className="text-emerald-600" /> Shipment Information
                    </h4>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                      {courier} API
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Origin:</span>
                      <span className="font-bold text-slate-800">{trackingData?.Origin || "New Delhi"}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Destination:</span>
                      <span className="font-bold text-slate-800">{trackingData?.Destination || `${dbCity}, ${dbState}`}</span>
                    </div>

                    {trackingData?.ClientOrderId && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Client Order ID:</span>
                        <span className="font-mono font-bold text-indigo-600">{trackingData.ClientOrderId}</span>
                      </div>
                    )}

                    {trackingData?.PickUpDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Dispatched Date:</span>
                        <span className="font-bold text-slate-700">
                          {new Date(trackingData.PickUpDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tracking Timeline */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FaCalendarAlt className="text-indigo-600" /> Tracking Journey ({scans.length} updates)
                </h4>

                <div className="space-y-4 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {scans.length > 0 ? (
                    scans
                      .slice()
                      .reverse()
                      .map((scanItem: any, idx: number) => {
                        const detail = scanItem.ScanDetail || {};
                        const isLatest = idx === 0;

                        return (
                          <div key={idx} className="relative group">
                            {/* Dot */}
                            <span
                              className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow ${
                                isLatest ? "bg-emerald-500 ring-4 ring-emerald-100" : "bg-slate-400"
                              }`}
                            />
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div>
                                <p className={`text-xs ${isLatest ? "font-black text-slate-900" : "font-bold text-slate-700"}`}>
                                  {detail.Scan || "Status Update"}
                                </p>
                                {detail.Instructions && (
                                  <p className="text-[11px] text-slate-500 mt-0.5">{detail.Instructions}</p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[10px] font-bold text-indigo-600 block">
                                  📍 {detail.ScannedLocation || "Hub"}
                                </span>
                                <span className="text-[9px] text-slate-400">
                                  {detail.ScanDateTime ? new Date(detail.ScanDateTime).toLocaleString() : ""}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <p className="text-xs text-slate-400 italic">No tracking updates recorded yet.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
