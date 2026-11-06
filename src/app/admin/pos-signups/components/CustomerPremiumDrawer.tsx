"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  X,
  Crown,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Building,
  User,
  Phone,
  Mail,
  Zap,
  IndianRupee,
  CreditCard,
  Hash,
} from "lucide-react";
import toast from "react-hot-toast";

interface CustomerPremiumDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    clerkId?: string;
    businessName?: string;
  } | null;
  onPremiumUpdated?: (updatedData: any) => void;
}

const PRESET_DURATIONS = [
  { label: "1 Month (30 Days)", days: 30, planName: "30 Days Plan" },
  { label: "3 Months (90 Days)", days: 90, planName: "90 Days Plan" },
  { label: "6 Months (180 Days)", days: 180, planName: "6 Months Plan" },
  { label: "1 Year (365 Days)", days: 365, planName: "1 Year Plan" },
  { label: "2 Years (730 Days)", days: 730, planName: "2 Year Plan" },
];

const PAYMENT_MODES = [
  "UPI / QR Code",
  "Cash",
  "Bank Transfer (IMPS/NEFT)",
  "Razorpay / Payment Gateway",
  "Cheque",
  "Complementary / Waiver",
];

export default function CustomerPremiumDrawer({
  isOpen,
  onClose,
  customer,
  onPremiumUpdated,
}: CustomerPremiumDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);

  // Form states
  const [validityMode, setValidityMode] = useState<"preset" | "exact">("preset");
  const [selectedDays, setSelectedDays] = useState<number>(365);
  const [customDays, setCustomDays] = useState<string>("");
  const [exactDate, setExactDate] = useState<string>("");

  const [amountPaid, setAmountPaid] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<string>("UPI / QR Code");
  const [paymentReference, setPaymentReference] = useState<string>("");

  const [isActivating, setIsActivating] = useState(false);
  const [showActivationForm, setShowActivationForm] = useState(false);

  const fetchPremiumDetails = async () => {
    if (!customer) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/pos-signups/premium?userId=${customer.id}&clerkId=${customer.clerkId || ""}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setDetails(data);
        if (data.premium?.amountPaid !== undefined && data.premium?.amountPaid !== null) {
          setAmountPaid(String(data.premium.amountPaid));
        }
        if (data.premium?.endDate) {
          try {
            const iso = new Date(data.premium.endDate).toISOString().slice(0, 10);
            setExactDate(iso);
          } catch (e) {}
        }
      } else {
        toast.error(data.error || "Failed to load premium details");
      }
    } catch (e: any) {
      console.error("Fetch premium details error:", e);
      toast.error("Failed to fetch subscription information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && customer) {
      setDetails(null);
      setShowActivationForm(false);
      setCustomDays("");
      setSelectedDays(365);
      setExactDate("");
      setAmountPaid("");
      setPaymentReference("");
      fetchPremiumDetails();
    }
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  const handleActivate = async () => {
    let payload: any = {
      userId: customer.id,
      clerkId: customer.clerkId,
      amountPaid: amountPaid ? parseFloat(amountPaid) : null,
      paymentMode,
      paymentReference,
    };

    if (validityMode === "exact") {
      if (!exactDate) {
        toast.error("Please pick an exact Expiry Date");
        return;
      }
      payload.exactEndDate = exactDate;
      payload.planName = `Validity till ${exactDate}`;
    } else {
      const finalDays = customDays ? parseInt(customDays) : selectedDays;
      if (!finalDays || isNaN(finalDays) || finalDays <= 0) {
        toast.error("Please select or enter a valid number of days");
        return;
      }
      payload.durationDays = finalDays;
      const selectedPlan = PRESET_DURATIONS.find((p) => p.days === finalDays);
      payload.planName = selectedPlan?.planName || `${finalDays} Days Manual Plan`;
    }

    setIsActivating(true);
    try {
      const res = await fetch("/api/pos-signups/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to activate premium");
      }

      toast.success(resData.message || "Premium updated successfully!");
      setShowActivationForm(false);
      await fetchPremiumDetails();

      if (onPremiumUpdated) {
        onPremiumUpdated(resData.premium);
      }
    } catch (err: any) {
      console.error("Activation error:", err);
      toast.error(err.message || "Failed to activate premium");
    } finally {
      setIsActivating(false);
    }
  };

  const premiumStatus = details?.premium?.status || "Loading...";
  const isPremiumActive = premiumStatus === "Active";
  const isPremiumExpired = premiumStatus === "Expired";
  const daysLeft = details?.premium?.daysRemaining;
  const currentAmountPaid = details?.premium?.amountPaid;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Kravy Premium Manager</h2>
              <p className="text-xs text-amber-100 font-medium">
                Subscription, Validity & Amount Control
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/25 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer Summary Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                Customer Information
              </span>
              <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                ID: {customer.id.slice(-6)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="font-bold truncate">{customer.name || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="font-semibold truncate">
                  {details?.customer?.businessName || customer.businessName || "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="font-mono">{customer.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate">{customer.email || "—"}</span>
              </div>
            </div>
          </div>

          {/* Current Premium Status Card */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
              <p className="text-xs font-semibold text-slate-500">
                Loading premium details from database...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute right-[-15px] top-[-15px] opacity-10 pointer-events-none">
                  <Crown size={140} />
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Subscription Status
                  </span>
                  {isPremiumActive ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-extrabold">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Active
                    </span>
                  ) : isPremiumExpired ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-xs font-extrabold">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Expired
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-xs font-bold">
                      Not Activated
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    {isPremiumActive && daysLeft !== null ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">{daysLeft}</span>
                        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                          Days Remaining
                        </span>
                      </div>
                    ) : isPremiumExpired ? (
                      <p className="text-sm font-semibold text-rose-300">
                        Subscription expired. Renew below to restore full access.
                      </p>
                    ) : (
                      <p className="text-sm text-slate-300">
                        No active premium package assigned to this outlet.
                      </p>
                    )}
                  </div>

                  {/* Amount Paid Badge */}
                  {currentAmountPaid !== null && currentAmountPaid !== undefined && (
                    <div className="text-right bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                      <span className="text-[10px] text-amber-200 block uppercase font-bold tracking-wider">
                        Amount Paid
                      </span>
                      <span className="text-base font-black text-white flex items-center justify-end">
                        <IndianRupee size={14} className="inline mr-0.5" />
                        {Number(currentAmountPaid).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700/60 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Start Date</span>
                    <span className="font-semibold text-slate-200">
                      {details?.premium?.startDate
                        ? format(new Date(details.premium.startDate), "dd MMM yyyy")
                        : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Expiry Date</span>
                    <span className="font-semibold text-slate-200">
                      {details?.premium?.endDate
                        ? format(new Date(details.premium.endDate), "dd MMM yyyy")
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!showActivationForm ? (
                <div className="pt-2">
                  <button
                    onClick={() => setShowActivationForm(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold rounded-2xl shadow-md transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    {isPremiumActive ? "Update Validity & Amount" : "Activate Premium Plan"}
                  </button>
                </div>
              ) : (
                /* Activation Form Panel */
                <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <h4 className="font-black text-sm text-amber-900">
                        {isPremiumActive ? "Update Subscription & Purchase" : "Select Subscription Plan"}
                      </h4>
                    </div>
                    <button
                      onClick={() => setShowActivationForm(false)}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Mode Tabs: Preset Duration vs Exact Date Picker */}
                  <div className="flex items-center bg-amber-100/70 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setValidityMode("preset")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        validityMode === "preset"
                          ? "bg-white text-amber-900 shadow-xs"
                          : "text-amber-800 hover:text-amber-900"
                      }`}
                    >
                      Preset Plans / Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setValidityMode("exact");
                        if (!exactDate && details?.premium?.endDate) {
                          try {
                            setExactDate(new Date(details.premium.endDate).toISOString().slice(0, 10));
                          } catch (e) {}
                        }
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        validityMode === "exact"
                          ? "bg-white text-amber-900 shadow-xs"
                          : "text-amber-800 hover:text-amber-900"
                      }`}
                    >
                      <Calendar size={13} />
                      Exact Expiry Date
                    </button>
                  </div>

                  {/* Mode 1: Preset Durations */}
                  {validityMode === "preset" ? (
                    <div className="space-y-3">
                      {isPremiumActive && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800">
                          💡 <strong>Smart Extension:</strong> Days will be added on top of the
                          current expiry date.
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-amber-900 uppercase">
                          Select Plan
                        </label>
                        <div className="grid grid-cols-1 gap-1.5">
                          {PRESET_DURATIONS.map((preset) => {
                            const isSelected = selectedDays === preset.days && !customDays;
                            return (
                              <button
                                key={preset.days}
                                type="button"
                                onClick={() => {
                                  setSelectedDays(preset.days);
                                  setCustomDays("");
                                }}
                                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                                  isSelected
                                    ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                                    : "bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50"
                                }`}
                              >
                                <span>{preset.label}</span>
                                <span
                                  className={`text-[11px] font-mono ${
                                    isSelected ? "text-amber-100" : "text-slate-400"
                                  }`}
                                >
                                  +{preset.days} Days
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Days Input */}
                      <div>
                        <label className="text-[11px] font-bold text-amber-900 uppercase block mb-1">
                          Or Custom Days
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 15, 45, 100"
                          value={customDays}
                          onChange={(e) => setCustomDays(e.target.value)}
                          min="1"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Mode 2: Exact Expiry Date Picker */
                    <div className="space-y-2 bg-white p-3.5 rounded-xl border border-amber-200">
                      <label className="text-[11px] font-bold text-amber-900 uppercase flex items-center gap-1.5">
                        <Calendar size={14} className="text-amber-600" />
                        Choose Exact Expiry Date
                      </label>
                      <input
                        type="date"
                        value={exactDate}
                        onChange={(e) => setExactDate(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Outlet ka access directly is chuni gayi date tak valid rahega (jaise Kravy POS New merchant editor mein hota hai).
                      </p>
                    </div>
                  )}

                  {/* Purchase Details: Amount Paid & Payment Mode */}
                  <div className="pt-2 border-t border-amber-200 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <IndianRupee size={15} className="text-amber-700" />
                      <span className="text-xs font-black uppercase text-amber-900">
                        Purchase / Recharge Details
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-amber-900 uppercase block mb-1">
                          Amount Paid (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">
                            ₹
                          </span>
                          <input
                            type="number"
                            placeholder="e.g. 2999"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            min="0"
                            className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-amber-900 uppercase block mb-1">
                          Payment Mode
                        </label>
                        <select
                          value={paymentMode}
                          onChange={(e) => setPaymentMode(e.target.value)}
                          className="w-full px-2.5 py-2 text-xs rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                        >
                          {PAYMENT_MODES.map((mode) => (
                            <option key={mode} value={mode}>
                              {mode}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-amber-900 uppercase block mb-1">
                        UTR / Transaction Reference (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. UPI / Cheque Ref / Invoice #"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Confirm Button */}
                  <button
                    onClick={handleActivate}
                    disabled={isActivating}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isActivating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Updating Database...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" /> Save & Activate Premium
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Activation / Orders History */}
              {details?.history && details.history.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2">
                    Recent Subscription Log
                  </h4>
                  <div className="space-y-2">
                    {details.history.slice(0, 4).map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-800">
                            {item.items?.[0]?.name || "Subscription"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.createdAt ? format(new Date(item.createdAt), "dd MMM yyyy, HH:mm") : "—"}
                            </span>
                            {item.paymentMode && (
                              <span className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                                {item.paymentMode}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {item.amount > 0 && (
                            <span className="text-xs font-black text-slate-900 block font-mono">
                              ₹{item.amount.toLocaleString("en-IN")}
                            </span>
                          )}
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 inline-block mt-0.5">
                            {item.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
