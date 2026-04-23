"use client";
import React from "react";
import { FaDownload, FaCopy, FaFileInvoice, FaEye } from "react-icons/fa";
import { generateInvoicePDF } from "@/lib/invoice-utils";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";

interface PaymentEntry {
  id?: string;
  paymentId?: string;
  amount: number;
  received: number;
  updatedAt: string;
  updatedBy: string;
  fileUrl?: string | null;
  utr?: string | null;
  invoiceUrl?: string | null;
}

interface PaymentHistoryProps {
  paymentHistory: PaymentEntry[];
  taskTitle: string;
  taskDetails?: {
    shopName?: string;
    customerName?: string;
    address?: string;
    phone?: string;
    gstin?: string;
  };
}

export default function PaymentHistory({ paymentHistory, taskTitle, taskDetails }: PaymentHistoryProps) {
  const [businessSettings, setBusinessSettings] = React.useState<any>(null);
  const [copyingId, setCopyingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/admin/settings/business")
      .then(res => res.json())
      .then(data => {
        console.log("Business Settings loaded:", data);
        setBusinessSettings(data);
      })
      .catch(err => console.error("Failed to load business settings:", err));
  }, []);

  if (!paymentHistory || paymentHistory.length === 0) {
    return <p className="text-gray-500 text-xs italic">No payment history available.</p>;
  }

  const handleDownload = (entry: PaymentEntry) => {
    const { doc, invNo } = generateInvoicePDF({
      ...entry,
      taskTitle,
      shopName: taskDetails?.shopName,
      customerName: taskDetails?.customerName,
      address: taskDetails?.address,
      phone: taskDetails?.phone,
      gstin: taskDetails?.gstin
    }, businessSettings);
    doc.save(`Invoice_${invNo}.pdf`);
    toast.success("Invoice Downloaded!");
  };

  const handleCopyLink = async (entry: PaymentEntry) => {
    const id = entry.paymentId || entry.id || "temp";
    setCopyingId(id);
    
    try {
      // If already has invoiceUrl, copy it
      if (entry.invoiceUrl) {
        await navigator.clipboard.writeText(entry.invoiceUrl);
        toast.success("Invoice link copied!");
        return;
      }

      // Otherwise generate and upload now
      const { doc, invNo } = generateInvoicePDF({
        ...entry,
        taskTitle,
        shopName: taskDetails?.shopName,
        customerName: taskDetails?.customerName,
        address: taskDetails?.address,
        phone: taskDetails?.phone,
        gstin: taskDetails?.gstin
      }, businessSettings);
      
      const pdfBlob = doc.output('blob');
      const formData = new FormData();
      formData.append('file', pdfBlob, `Invoice_${invNo}.pdf`);

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const { url } = await uploadRes.json();
      
      if (url) {
        await navigator.clipboard.writeText(url);
        // Silently update the DB if we have a real paymentId
        if (entry.paymentId) {
            await fetch('/api/payments/update-invoice', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ paymentId: entry.paymentId, invoiceUrl: url }) 
            });
        }
        toast.success("Link generated & copied!");
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      toast.error("Failed to copy link");
    } finally {
      setCopyingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Logs</h4>
      {paymentHistory.slice().reverse().map((entry, i) => {
        const amount = typeof entry.amount === "number" ? entry.amount : parseFloat(String(entry.amount));
        const received = typeof entry.received === "number" ? entry.received : parseFloat(String(entry.received));
        const entryId = entry.paymentId || entry.id || `idx-${i}`;

        return (
          <div
            key={entryId}
            className="p-4 bg-gray-50 border border-slate-100 rounded-2xl text-xs hover:bg-white hover:shadow-xl hover:shadow-slate-200 transition-all group"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight block mb-0.5">Transaction Successful</span>
                <span className="font-black text-lg text-slate-900 tracking-tight">₹{isNaN(received) ? '0' : received.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  {entry.updatedAt ? format(parseISO(entry.updatedAt), "dd MMM yyyy") : "N/A"}
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase">
                  {entry.updatedAt ? format(parseISO(entry.updatedAt), "HH:mm") : ""}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Updated By</p>
                <p className="font-bold text-slate-700 truncate" title={entry.updatedBy}>{entry.updatedBy || "System"}</p>
              </div>
              {entry.utr && (
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">UTR / TXN ID</p>
                  <p className="font-bold text-slate-900 font-mono select-all tracking-tight bg-slate-100 px-2 py-0.5 rounded-md inline-block">{entry.utr}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2">
                {entry.fileUrl && (
                  <a
                    href={entry.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-all font-black text-[10px] uppercase tracking-tight"
                  >
                    <FaEye size={12} /> Proof
                  </a>
                )}
                <button
                  onClick={() => handleDownload(entry)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-all font-black text-[10px] uppercase tracking-tight"
                >
                  <FaDownload size={12} /> Invoice
                </button>
              </div>
              
              <button
                onClick={() => handleCopyLink(entry)}
                disabled={copyingId === entryId}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl hover:bg-black transition-all font-black text-[10px] uppercase tracking-tight disabled:opacity-50"
              >
                {copyingId === entryId ? (
                   <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <FaCopy size={12} />
                )}
                Link
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
