"use client";

import React, { useState, useEffect } from "react";
import { FaTimes, FaCheck, FaPencilAlt, FaShippingFast, FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";

interface UpdateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    awbNumber?: string;
    trackingStatus?: string;
    taskId?: string;
    task?: any;
    pickupContact?: string;
    pickupAddress?: string;
    pickupPincode?: string;
    returnContact?: string;
    returnAddress?: string;
    returnPincode?: string;
    customerPhone?: string;
    customerAddress?: string;
    customerPincode?: string;
    customerCity?: string;
    customerState?: string;
    paymentMode?: "COD" | "Prepaid";
    orderAmount?: number | string;
    codAmount?: number | string;
  } | null;
  onSuccess?: () => void;
}

export default function UpdateOrderModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: UpdateOrderModalProps) {
  // Field values
  const [returnContact, setReturnContact] = useState("");
  const [returnAddress, setReturnAddress] = useState("");
  const [returnPincode, setReturnPincode] = useState("");

  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPincode, setCustomerPincode] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerState, setCustomerState] = useState("");

  const [paymentMode, setPaymentMode] = useState<"COD" | "Prepaid">("COD");
  const [orderAmount, setOrderAmount] = useState<number | string>(3500);
  const [codAmount, setCodAmount] = useState<number | string>(3500);

  // Editing state toggles for each field
  const [editingField, setEditingField] = useState<
    "returnContact" | "returnAddress" | "customerPhone" | "customerAddress" | "codAmount" | null
  >(null);

  // Temp draft states while editing
  const [draftReturnContact, setDraftReturnContact] = useState("");
  const [draftReturnAddress, setDraftReturnAddress] = useState("");
  const [draftReturnPincode, setDraftReturnPincode] = useState("");

  const [draftCustomerPhone, setDraftCustomerPhone] = useState("");
  const [draftCustomerAddress, setDraftCustomerAddress] = useState("");
  const [draftCustomerPincode, setDraftCustomerPincode] = useState("");

  const [draftCodAmount, setDraftCodAmount] = useState<string | number>("");

  const [saving, setSaving] = useState(false);

  // Initialize values when order changes
  useEffect(() => {
    if (!order) return;

    const cf = order.task?.customFields || {};
    const task = order.task || {};

    const initialReturnContact =
      order.returnContact || cf.returnContact || "9289507882";
    const initialReturnAddress =
      order.returnAddress ||
      cf.returnAddress ||
      "3rd floor PLOT IN MUSTATIL. NO 14, KILLA NO 12/2, 19/1, 20/ FIRST FLOOR VILL. SAMALKA NEW DELHI, 110037";
    const initialReturnPincode =
      order.returnPincode || cf.returnPincode || "110037";

    const initialCustomerPhone =
      order.customerPhone || task.phone || cf.phone || "99XXXXXX34";
    const initialCustomerAddress =
      order.customerAddress ||
      cf.fullAddress ||
      task.location ||
      cf.location ||
      "";
    const initialCustomerPincode =
      order.customerPincode || cf.pincode || "";
    const initialCustomerCity = order.customerCity || cf.city || "";
    const initialCustomerState = order.customerState || cf.state || "";

    const rawMode = (order.paymentMode || cf.paymentMode || "COD").toUpperCase();
    const initialMode = rawMode === "PREPAID" ? "Prepaid" : "COD";

    const initialOrderAmount =
      order.orderAmount ?? cf.packageAmount ?? cf.orderAmount ?? task.packageAmount ?? 3500;
    const initialCodAmount =
      order.codAmount ?? cf.codAmount ?? initialOrderAmount;

    setReturnContact(initialReturnContact);
    setReturnAddress(initialReturnAddress);
    setReturnPincode(initialReturnPincode);

    setCustomerPhone(initialCustomerPhone);
    setCustomerAddress(initialCustomerAddress);
    setCustomerPincode(initialCustomerPincode);
    setCustomerCity(initialCustomerCity);
    setCustomerState(initialCustomerState);

    setPaymentMode(initialMode);
    setOrderAmount(initialOrderAmount);
    setCodAmount(initialCodAmount);

    setEditingField(null);
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const awb = order.awbNumber || order.task?.customFields?.awbNumber || "N/A";
  const currentStatus =
    order.trackingStatus ||
    order.task?.customFields?.dispatchStatus ||
    order.task?.status ||
    "In Manifest";

  // Static Pickup Details
  const pickupContact =
    order.pickupContact || "92XXXXXX82";
  const pickupAddress =
    order.pickupAddress ||
    "3rd floor PLOT IN MUSTATIL. NO 14, KILLA NO 12/2, 19/1, 20/ FIRST FLOOR VILL. SAMALKA NEW DELHI, 110037";
  const pickupPincode = order.pickupPincode || "110037";

  // Helper to commit edits to backend
  const commitFieldUpdate = async (fieldUpdated: string, payloadUpdates: any) => {
    try {
      setSaving(true);
      const res = await fetch("/api/dispatch/shadowfax/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          awb,
          taskId: order.taskId || order.task?.id,
          customerContact: payloadUpdates.customerPhone ?? customerPhone,
          customerAddress: payloadUpdates.customerAddress ?? customerAddress,
          customerPincode: payloadUpdates.customerPincode ?? customerPincode,
          customerCity,
          customerState,
          returnContact: payloadUpdates.returnContact ?? returnContact,
          returnAddress: payloadUpdates.returnAddress ?? returnAddress,
          returnPincode: payloadUpdates.returnPincode ?? returnPincode,
          paymentMode: payloadUpdates.paymentMode ?? paymentMode,
          orderAmount: payloadUpdates.orderAmount ?? orderAmount,
          codAmount: payloadUpdates.codAmount ?? codAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update order");
      }

      toast.success(`${fieldUpdated} updated successfully!`);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to update field");
    } finally {
      setSaving(false);
    }
  };

  // Toggle Payment Mode
  const handleTogglePaymentMode = async (newMode: "COD" | "Prepaid") => {
    setPaymentMode(newMode);
    await commitFieldUpdate("Payment Mode", {
      paymentMode: newMode,
      codAmount: newMode === "Prepaid" ? 0 : codAmount,
    });
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Update Order</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors text-base"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-slate-800 bg-[#f8fafc]/40">
          {/* Order AWB Banner */}
          <div className="bg-[#f0f7ff] border border-[#d9ebff] rounded-xl p-4">
            <p className="text-sm font-semibold text-slate-700">
              Order AWB:{" "}
              <span className="text-[#059669] font-bold tracking-wide">{awb}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Current Status:{" "}
              <span className="font-semibold text-slate-700">{currentStatus}</span>
            </p>
          </div>

          {/* Pickup Details Card */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#10b981] text-base">🏪</span>
              <h3 className="text-sm font-bold text-slate-800">Pickup Details</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400 font-medium">Pickup Contact</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{pickupContact}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Pickup Address</p>
                <p className="text-xs font-normal text-slate-700 mt-0.5 uppercase leading-relaxed">
                  {pickupAddress}
                </p>
                <p className="text-xs text-slate-500 mt-1">Customer Pincode: {pickupPincode}</p>
              </div>
            </div>
          </div>

          {/* Return Details Card */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#10b981] text-base">🏪</span>
              <h3 className="text-sm font-bold text-slate-800">Return Details</h3>
            </div>

            <div className="space-y-4">
              {/* Return Contact */}
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 font-medium">Return Contact</p>
                  {editingField !== "returnContact" && (
                    <button
                      type="button"
                      onClick={() => {
                        setDraftReturnContact(returnContact);
                        setEditingField("returnContact");
                      }}
                      className="text-[#0284c7] hover:text-[#0369a1] text-xs transition-colors p-1"
                    >
                      <FaPencilAlt />
                    </button>
                  )}
                </div>

                {editingField === "returnContact" ? (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={draftReturnContact}
                      onChange={(e) => setDraftReturnContact(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
                      placeholder="Enter 10-digit phone number"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={async () => {
                          const val = draftReturnContact.trim();
                          setReturnContact(val);
                          setEditingField(null);
                          await commitFieldUpdate("Return Contact", { returnContact: val });
                        }}
                        className="w-6 h-6 rounded-full bg-[#10b981] hover:bg-[#059669] text-white flex items-center justify-center text-xs shadow-sm"
                      >
                        <FaCheck />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingField(null)}
                        className="w-6 h-6 rounded-full bg-slate-400 hover:bg-slate-500 text-white flex items-center justify-center text-xs shadow-sm"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{returnContact}</p>
                )}
              </div>

              {/* Return Address */}
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 font-medium">Return Address</p>
                  {editingField !== "returnAddress" && (
                    <button
                      type="button"
                      onClick={() => {
                        setDraftReturnAddress(returnAddress);
                        setDraftReturnPincode(returnPincode);
                        setEditingField("returnAddress");
                      }}
                      className="text-[#0284c7] hover:text-[#0369a1] text-xs transition-colors p-1"
                    >
                      <FaPencilAlt />
                    </button>
                  )}
                </div>

                {editingField === "returnAddress" ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      rows={3}
                      value={draftReturnAddress}
                      onChange={(e) => setDraftReturnAddress(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
                      placeholder="Enter complete address"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={draftReturnPincode}
                      onChange={(e) => setDraftReturnPincode(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
                      placeholder="Pincode (e.g. 110037)"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={async () => {
                          const valAddr = draftReturnAddress.trim();
                          const valPin = draftReturnPincode.trim();
                          setReturnAddress(valAddr);
                          setReturnPincode(valPin);
                          setEditingField(null);
                          await commitFieldUpdate("Return Address", {
                            returnAddress: valAddr,
                            returnPincode: valPin,
                          });
                        }}
                        className="w-6 h-6 rounded-full bg-[#10b981] hover:bg-[#059669] text-white flex items-center justify-center text-xs shadow-sm"
                      >
                        <FaCheck />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingField(null)}
                        className="w-6 h-6 rounded-full bg-slate-400 hover:bg-slate-500 text-white flex items-center justify-center text-xs shadow-sm"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-normal text-slate-700 mt-0.5 uppercase leading-relaxed">
                      {returnAddress}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Customer Pincode: {returnPincode}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Details & Payment Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Details */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-red-500 text-sm">👤</span>
                  <h3 className="text-sm font-bold text-slate-800">Customer Details</h3>
                </div>

                {/* Phone */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 font-medium">Phone Number</p>
                    {editingField !== "customerPhone" && (
                      <button
                        type="button"
                        onClick={() => {
                          setDraftCustomerPhone(customerPhone);
                          setEditingField("customerPhone");
                        }}
                        className="text-[#0284c7] hover:text-[#0369a1] text-xs transition-colors p-1"
                      >
                        <FaPencilAlt />
                      </button>
                    )}
                  </div>

                  {editingField === "customerPhone" ? (
                    <div className="mt-2 space-y-2">
                      <input
                        type="text"
                        value={draftCustomerPhone}
                        onChange={(e) => setDraftCustomerPhone(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
                        placeholder="Customer 10-digit phone"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={async () => {
                            const val = draftCustomerPhone.trim();
                            setCustomerPhone(val);
                            setEditingField(null);
                            await commitFieldUpdate("Customer Phone", { customerPhone: val });
                          }}
                          className="w-6 h-6 rounded-full bg-[#10b981] hover:bg-[#059669] text-white flex items-center justify-center text-xs shadow-sm"
                        >
                          <FaCheck />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingField(null)}
                          className="w-6 h-6 rounded-full bg-slate-400 hover:bg-slate-500 text-white flex items-center justify-center text-xs shadow-sm"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-slate-700 mt-0.5">{customerPhone}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 font-medium">Customer Address</p>
                    {editingField !== "customerAddress" && (
                      <button
                        type="button"
                        onClick={() => {
                          setDraftCustomerAddress(customerAddress);
                          setDraftCustomerPincode(customerPincode);
                          setEditingField("customerAddress");
                        }}
                        className="text-[#0284c7] hover:text-[#0369a1] text-xs transition-colors p-1"
                      >
                        <FaPencilAlt />
                      </button>
                    )}
                  </div>

                  {editingField === "customerAddress" ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        rows={3}
                        value={draftCustomerAddress}
                        onChange={(e) => setDraftCustomerAddress(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
                        placeholder="Enter full address"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={draftCustomerPincode}
                        onChange={(e) => setDraftCustomerPincode(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
                        placeholder="Pincode (e.g. 416612)"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={async () => {
                            const valAddr = draftCustomerAddress.trim();
                            const valPin = draftCustomerPincode.trim();
                            setCustomerAddress(valAddr);
                            setCustomerPincode(valPin);
                            setEditingField(null);
                            await commitFieldUpdate("Customer Address", {
                              customerAddress: valAddr,
                              customerPincode: valPin,
                            });
                          }}
                          className="w-6 h-6 rounded-full bg-[#10b981] hover:bg-[#059669] text-white flex items-center justify-center text-xs shadow-sm"
                        >
                          <FaCheck />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingField(null)}
                          className="w-6 h-6 rounded-full bg-slate-400 hover:bg-slate-500 text-white flex items-center justify-center text-xs shadow-sm"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-normal text-slate-700 mt-0.5 leading-relaxed">
                        {customerAddress || "No address provided"}
                      </p>
                      {customerPincode && (
                        <p className="text-xs text-slate-500 mt-1">
                          Customer Pincode: {customerPincode}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-indigo-600 text-sm">💳</span>
                  <h3 className="text-sm font-bold text-slate-800">Payment Details</h3>
                </div>

                {/* Mode toggle */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Payment Mode</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{paymentMode}</p>
                  </div>
                  {/* Switch Toggle */}
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => handleTogglePaymentMode("COD")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        paymentMode === "COD"
                          ? "bg-white text-slate-800 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      COD
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePaymentMode("Prepaid")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        paymentMode === "Prepaid"
                          ? "bg-white text-slate-800 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Prepaid
                    </button>
                  </div>
                </div>

                {/* Order Amount */}
                <div className="mb-4">
                  <p className="text-xs text-slate-400 font-medium">Order Amount</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">₹ {orderAmount}</p>
                </div>

                {/* COD Amount */}
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 font-medium">COD Amount</p>
                    {paymentMode === "COD" && editingField !== "codAmount" && (
                      <button
                        type="button"
                        onClick={() => {
                          setDraftCodAmount(codAmount);
                          setEditingField("codAmount");
                        }}
                        className="text-[#0284c7] hover:text-[#0369a1] text-xs transition-colors p-1"
                      >
                        <FaPencilAlt />
                      </button>
                    )}
                  </div>

                  {editingField === "codAmount" && paymentMode === "COD" ? (
                    <div className="mt-2 space-y-2">
                      <input
                        type="number"
                        value={draftCodAmount}
                        onChange={(e) => setDraftCodAmount(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
                        placeholder="Enter COD amount"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={async () => {
                            const val = Number(draftCodAmount) || 0;
                            setCodAmount(val);
                            setEditingField(null);
                            await commitFieldUpdate("COD Amount", { codAmount: val });
                          }}
                          className="w-6 h-6 rounded-full bg-[#10b981] hover:bg-[#059669] text-white flex items-center justify-center text-xs shadow-sm"
                        >
                          <FaCheck />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingField(null)}
                          className="w-6 h-6 rounded-full bg-slate-400 hover:bg-slate-500 text-white flex items-center justify-center text-xs shadow-sm"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">
                      ₹ {paymentMode === "COD" ? codAmount : 0}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info banner */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Click any ✏️ edit icon to modify courier details in real-time.</span>
          {saving && (
            <span className="flex items-center gap-1.5 text-indigo-600 font-medium">
              <FaSpinner className="animate-spin text-xs" /> Saving...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
