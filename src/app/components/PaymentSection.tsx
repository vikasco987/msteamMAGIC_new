"use client";

import React from "react";
import PaymentHistory from "./PaymentHistory";
import toast from "react-hot-toast";

interface PaymentEntry {
  amount: number;
  received: number;
  updatedAt: string;
  updatedBy: string;
  fileUrl?: string | null;
  utr?: string | null;
}

interface Task {
  id: string;
  name: string;
  shop: string;
  customer: string;
  start: string;
  end: string;
  progress: number;
  assigneeIds?: string[];
  subtasks?: any[];
  notes?: any[];
  attachments?: string[];
  amount?: number;
  received?: number;
  paymentHistory?: PaymentEntry[] | null;
}

interface PaymentSectionProps {
  selectedTask: Task | null;
  user: any;
  amount: string;
  setAmount: (value: string) => void;
  received: string;
  setReceived: (value: string) => void;
  utr: string;
  setUtr: (value: string) => void;
  paymentUploadStatus: string;
  setPaymentUploadStatus: (status: string) => void;
  handlePaymentSubmit: (e: React.FormEvent) => Promise<void>;
  showPaymentHistory: boolean;
  setShowPaymentHistory: (show: boolean) => void;
  handleTogglePaymentHistory?: () => void;
  fileInputRef?: React.RefObject<HTMLInputElement>;
}

export default function PaymentSection({
  selectedTask,
  user,
  amount,
  setAmount,
  received,
  setReceived,
  utr,
  setUtr,
  gstin,
  setGstin,
  paymentUploadStatus,
  setPaymentUploadStatus,
  handlePaymentSubmit,
  showPaymentHistory,
  setShowPaymentHistory,
  handleTogglePaymentHistory,
  fileInputRef
}: any) {
  if (!selectedTask) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm text-gray-500 text-sm">
        No task selected.
      </div>
    );
  }

  const paymentHistoryArray = selectedTask.paymentHistory ?? [];
  const hasPaymentHistory = paymentHistoryArray.length > 0;

  // Rule: amount is locked once set (> 0)
  const isAmountLocked = Boolean(selectedTask.amount && selectedTask.amount > 0);
  const existingGstin = (selectedTask as any).customFields?.gstin || (selectedTask as any).gstin;
  const isGstinLocked = Boolean(existingGstin && existingGstin.trim().length > 0);
  const remainingAmount = (selectedTask.amount || 0) - (selectedTask.received || 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">💰 Payment</h3>
        {hasPaymentHistory && (
          <button
            onClick={handleTogglePaymentHistory || (() => setShowPaymentHistory(!showPaymentHistory))}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            {showPaymentHistory ? "Hide History" : "View History"}
          </button>
        )}
      </div>

      <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
        <div className="flex justify-between items-center text-xs text-blue-700 mb-1">
          <span>Total Budget:</span>
          <span className="font-bold">₹{(selectedTask.amount || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-xs text-green-700 mb-1">
          <span>Paid So Far:</span>
          <span className="font-bold">₹{(selectedTask.received || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-xs text-orange-700 pt-1 border-t border-blue-200">
          <span>Remaining:</span>
          <span className="font-bold">₹{remainingAmount.toLocaleString()}</span>
        </div>
      </div>

      <form onSubmit={handlePaymentSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-xs font-medium text-gray-500 uppercase mb-1">
              {isAmountLocked ? "Total (Locked)" : "Total Amount"}
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              disabled={isAmountLocked}
              placeholder="Total ₹"
              className={`block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500 ${isAmountLocked ? "bg-gray-50 cursor-not-allowed text-gray-400 font-bold" : ""}`}
            />
          </div>
          <div>
            <label htmlFor="received" className="block text-xs font-medium text-gray-500 uppercase mb-1">
              Add Payment
            </label>
            <input
              type="number"
              id="received"
              name="received"
              value={received}
              onChange={(e) => setReceived(e.target.value)}
              step="0.01"
              placeholder="+ Amount ₹"
              className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1">
            <label htmlFor="gstin" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              {isGstinLocked ? "GSTIN (Locked)" : "Customer GSTIN"}
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                id="gstin"
                name="gstin"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="07AAAAA0000A1Z5"
                autoComplete="off"
                disabled={isGstinLocked}
                className={`flex-1 border border-gray-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${isGstinLocked ? "bg-slate-50 cursor-not-allowed text-slate-400 font-bold" : "bg-white text-slate-700 font-bold"}`}
              />
              {!isGstinLocked && (
                <button
                  type="button"
                  onClick={async () => {
                    if (gstin.length !== 15) {
                      toast.error("Invalid GST Format");
                      return;
                    }
                    const loadingToast = toast.loading("Fetching...");
                    await new Promise(r => setTimeout(r, 800));
                    const stateCode = gstin.substring(0, 2);
                    const states: any = { "07": "Delhi", "06": "Haryana", "09": "UP", "27": "Maharashtra", "08": "Rajasthan", "33": "Tamil Nadu" };
                    const detectedState = states[stateCode] || "Other";
                    toast.success(`State: ${detectedState}`, { id: loadingToast });
                  }}
                  className="shrink-0 h-[36px] bg-blue-600 text-white px-3 rounded-xl hover:bg-blue-700 transition-all text-[9px] font-black uppercase shadow-sm"
                >
                  Fetch
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="utr" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              UTR / Transaction No.
            </label>
            <input
              type="text"
              id="utr"
              name="utr"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="Enter UTR or TXN"
              autoComplete="off"
              className="block w-full border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label htmlFor="paymentFile" className="block text-xs font-medium text-gray-500 uppercase mb-1">
            Proof of Payment
          </label>
          <input
            type="file"
            id="paymentFile"
            name="paymentFile"
            ref={fileInputRef}
            accept="image/*,.pdf"
            className="block w-full text-xs text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <button
          type="submit"
          disabled={paymentUploadStatus.includes("Uploading")}
          className="w-full flex items-center justify-center py-2 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {paymentUploadStatus.includes("Uploading") ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            isAmountLocked ? "Add Payment Entry" : "Set Amount & Initial Payment"
          )}
        </button>

        {paymentUploadStatus && (
          <p className={`text-center text-xs font-medium ${paymentUploadStatus.startsWith("❌") ? "text-red-600" : "text-green-600"}`}>
            {paymentUploadStatus}
          </p>
        )}
      </form>

      {showPaymentHistory && hasPaymentHistory && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <PaymentHistory
            paymentHistory={paymentHistoryArray}
            taskTitle={selectedTask.name}
            taskDetails={{
              shopName: (selectedTask as any).customFields?.shopName || selectedTask.shopName || selectedTask.shop,
              customerName: selectedTask.customerName || selectedTask.customer,
              address: [
                (selectedTask as any).customFields?.fullAddress,
                (selectedTask as any).customFields?.city,
                (selectedTask as any).customFields?.state,
                (selectedTask as any).customFields?.pincode
              ].filter(Boolean).join(", ") || selectedTask.address || (selectedTask as any).location,
              phone: (selectedTask as any).customFields?.phone || (selectedTask as any).phone,
              gstin: (selectedTask as any).customFields?.gstin || (selectedTask as any).gstin
            }}
          />
        </div>
      )}
    </div>
  );
}
