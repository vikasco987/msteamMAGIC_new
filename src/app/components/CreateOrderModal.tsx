"use client";

import React, { useState } from "react";
import { FaTimes, FaShippingFast, FaCheckCircle, FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  onSuccess: (awb: string, courier: string) => void;
}

export default function CreateOrderModal({
  isOpen,
  onClose,
  task,
  onSuccess,
}: CreateOrderModalProps) {
  const cf = task?.customFields || {};

  // Form State initialized from Task details
  const [courier, setCourier] = useState<"shadowfax" | "delhivery">("shadowfax");
  const [customerName, setCustomerName] = useState(
    task?.customerName || cf.customerName || task?.shopName || cf.shopName || "Customer"
  );
  const [phone, setPhone] = useState(
    task?.phone || cf.phone || ""
  );
  const [address, setAddress] = useState(
    cf.fullAddress || task?.location || cf.location || ""
  );
  const [city, setCity] = useState(cf.city || "Darbhanga");
  const [state, setState] = useState(cf.state || "Bihar");
  const [pincode, setPincode] = useState(cf.pincode || "846009");
  
  const [paymentMode, setPaymentMode] = useState<"COD" | "Prepaid">("COD");
  const [orderAmount, setOrderAmount] = useState<number | string>(
    task?.amount || cf.packageAmount || 4500
  );
  const [codAmount, setCodAmount] = useState<number | string>(
    task?.amount || cf.packageAmount || 4500
  );

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error("Customer phone number is required!");
      return;
    }
    if (!address || !pincode) {
      toast.error("Address and Pincode are required!");
      return;
    }

    setLoading(true);
    try {
      const endpoint = courier === "shadowfax" ? "/api/dispatch/shadowfax/create" : "/api/dispatch/create";
      const payload = {
        taskId: task.id,
        customerName,
        phone,
        address,
        city,
        state,
        pincode,
        paymentMode,
        orderAmount: Number(orderAmount) || 0,
        codAmount: paymentMode === "COD" ? Number(codAmount) || 0 : 0,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      const awb = data.awbNumber || data.awb;
      toast.success(`🎉 ${courier === "shadowfax" ? "Shadowfax" : "Delhivery"} Order Created! AWB: ${awb}`);
      onSuccess(awb, courier);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create order");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
              <FaShippingFast size={16} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-wide">Create Shipping Order</h3>
              <p className="text-[11px] text-slate-400">
                Task: <span className="text-indigo-400 font-bold">{task.taskCode || task.title}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleCreateOrder} className="p-6 overflow-y-auto space-y-5 text-left">
          
          {/* Courier Selection */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">
              Select Logistics Partner
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCourier("shadowfax")}
                className={`py-3 px-4 rounded-2xl border-2 flex items-center justify-between font-bold text-sm transition-all cursor-pointer ${
                  courier === "shadowfax"
                    ? "border-emerald-500 bg-emerald-50/60 text-emerald-900 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <span>Shadowfax</span>
                </div>
                {courier === "shadowfax" && <FaCheckCircle className="text-emerald-600" />}
              </button>

              <button
                type="button"
                onClick={() => setCourier("delhivery")}
                className={`py-3 px-4 rounded-2xl border-2 flex items-center justify-between font-bold text-sm transition-all cursor-pointer ${
                  courier === "delhivery"
                    ? "border-indigo-500 bg-indigo-50/60 text-indigo-900 ring-2 ring-indigo-500/20"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🚚</span>
                  <span>Delhivery</span>
                </div>
                {courier === "delhivery" && <FaCheckCircle className="text-indigo-600" />}
              </button>
            </div>
          </div>

          {/* Customer / Consignee Details */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span>👤</span> Consignee / Customer Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Customer / Shop Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Full Delivery Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment & Amount Details */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span>💳</span> Payment & Package Value
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                >
                  <option value="COD">COD (Cash on Delivery)</option>
                  <option value="Prepaid">Prepaid</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Product Value (₹)</label>
                <input
                  type="number"
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(e.target.value)}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              {paymentMode === "COD" && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Collectable COD (₹)</label>
                  <input
                    type="number"
                    value={codAmount}
                    onChange={(e) => setCodAmount(e.target.value)}
                    className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Pickup Warehouse Notice */}
          <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 text-[11px] text-amber-800">
            <span className="font-bold">📍 Pickup Location:</span> Samalka New Delhi (Pincode: 110037) — Kravy Software Development
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 transition-colors text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase tracking-wider text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" /> Placing Order...
                </>
              ) : (
                `Confirm & Place Order (${courier === "shadowfax" ? "Shadowfax" : "Delhivery"})`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
