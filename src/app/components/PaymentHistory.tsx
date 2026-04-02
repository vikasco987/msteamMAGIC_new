"use client";

import React from "react";
import { parseISO, format } from "date-fns";

interface PaymentEntry {
  id?: string;
  amount: number;
  received: number;
  updatedAt: string;
  updatedBy: string;
  fileUrl?: string | null;
}

interface PaymentHistoryProps {
  paymentHistory: PaymentEntry[];
  taskTitle: string;
}

export default function PaymentHistory({ paymentHistory }: PaymentHistoryProps) {
  if (!paymentHistory || paymentHistory.length === 0) {
    return <p className="text-gray-500 text-xs italic">No payment history available.</p>;
  }

  return (
    <div className="space-y-3">
      {paymentHistory.slice().reverse().map((entry, i) => {
        const amount = typeof entry.amount === "number" ? entry.amount : parseFloat(String(entry.amount));
        const received = typeof entry.received === "number" ? entry.received : parseFloat(String(entry.received));

        return (
          <div
            key={i}
            className="p-3 bg-white border border-gray-100 rounded-lg text-xs shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-gray-700">₹{isNaN(received) ? '0' : received.toLocaleString()} Received</span>
              <span className="text-[10px] text-gray-400">
                {entry.updatedAt ? format(parseISO(entry.updatedAt), "dd MMM, HH:mm") : "N/A"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-gray-500 mb-2">
              <div>
                <p className="text-[9px] uppercase tracking-wider">Total Goal</p>
                <p className="font-medium text-gray-700">₹{isNaN(amount) ? '0' : amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider">Updated By</p>
                <p className="font-medium text-gray-700 truncate" title={entry.updatedBy}>{entry.updatedBy || "System"}</p>
              </div>
            </div>

            {entry.fileUrl && (
              <a
                href={entry.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Proof
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
