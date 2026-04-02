"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

interface PaymentEntry {
  amount: number;
  method?: string;
  date?: string;
  referenceId?: string;
  note?: string;
}

interface Props {
  taskId: string;
}

const PaymentHistorySection: React.FC<Props> = ({ taskId }) => {
  const [paymentHistory, setPaymentHistory] = useState<PaymentEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        const res = await axios.get(`/api/tasks/${taskId}`);
        const history = res.data?.paymentHistory || [];
        setPaymentHistory(history);
      } catch (err) {
        console.error("Failed to fetch payment history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, [taskId]);

  if (loading) return <div>Loading payment history...</div>;
  if (paymentHistory.length === 0) return <div>No payment history found.</div>;

  return (
    <div className="space-y-4 mt-6">
      <h2 className="text-xl font-semibold">🧾 Payment History</h2>
      {paymentHistory.map((entry, index) => (
        <div
          key={index}
          className="rounded-lg border p-4 bg-white shadow-md dark:bg-gray-900"
        >
          <p><strong>Amount:</strong> ₹{entry.amount}</p>
          {entry.method && <p><strong>Method:</strong> {entry.method}</p>}
          {entry.date && (
            <p>
              <strong>Date:</strong>{" "}
              {new Date(entry.date).toLocaleString()}
            </p>
          )}
          {entry.referenceId && <p><strong>Reference ID:</strong> {entry.referenceId}</p>}
          {entry.note && <p><strong>Note:</strong> {entry.note}</p>}
        </div>
      ))}
    </div>
  );
};

export default PaymentHistorySection;
