"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  User,
  Store,
  Phone,
  Trash2,
  ExternalLink,
  Filter,
  IndianRupee,
  Search,
  MapPin,
  Copy
} from "lucide-react";
import toast from "react-hot-toast";

interface PaymentEntry {
  paymentId: string;
  taskId: string;
  taskTitle: string;
  assignerName: string;
  received: number;
  amountUpdated: number;
  updatedAt: string;
  updatedBy: string;
  fileUrl: string | null;
  phone?: string | null;
  shopName?: string | null;
  address?: string | null;
  utr?: string | null;
  customerName?: string | null;
}

interface SummaryByAssigner {
  [assignerName: string]: number;
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  const datePart = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return { date: datePart, time: timePart };
}

export default function PaymentsTodayPage() {
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [summary, setSummary] = useState<SummaryByAssigner>({});
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchPayments = async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payments/today?date=${date}`);
      const data = await res.json();
      setPayments(Array.isArray(data.paymentsToday) ? data.paymentsToday : []);
      setSummary(data.summaryByAssigner || {});
    } catch (err) {
      console.error("Failed to fetch payments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId: string, paymentId: string) => {
    if (!confirm("Are you sure you want to delete this payment record?")) return;
    try {
      const res = await fetch("/api/payments/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, paymentId }),
      });
      if (res.ok) fetchPayments(selectedDate);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Address copied to clipboard!", {
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 'bold'
      },
    });
  };

  useEffect(() => {
    fetchPayments(selectedDate);
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              <span className="bg-blue-600 text-white p-2 rounded-lg">
                <IndianRupee size={24} />
              </span>
              Payments Report
            </h1>
            <p className="text-gray-500 mt-1">Track and manage your daily transactions</p>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
            <Calendar size={18} className="text-gray-400 ml-2" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-gray-700 font-medium cursor-pointer"
            />
            <button
              onClick={() => fetchPayments(selectedDate)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition-all flex items-center gap-2 shadow-md shadow-blue-100 font-bold text-sm"
            >
              <Filter size={16} />
              Filter
            </button>
          </div>
        </div>

        {/* Assigner Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(summary).map(([name, total]) => (
            <div key={name} className="relative overflow-hidden bg-white group p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <User size={64} />
              </div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{name}</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">₹{total.toLocaleString()}</h2>
              <div className="mt-3 flex items-center text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 w-fit px-3 py-1 rounded-full">
                Updated Today
              </div>
            </div>
          ))}
          {Object.keys(summary).length === 0 && !loading && (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border-4 border-dashed border-slate-50">
              <Search className="mx-auto text-slate-100 mb-4" size={60} />
              <p className="text-slate-400 font-black uppercase tracking-[0.2em]">No Data Detected</p>
            </div>
          )}
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Details</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigner</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Info</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proof</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center text-slate-400 font-black uppercase tracking-[0.2em]">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                        <span>Syncing Data...</span>
                      </div>
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-widest italic">
                      Zero records found
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const dt = formatDateTime(p.updatedAt);
                    return (
                      <tr key={p.paymentId} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{p.taskTitle}</span>
                            <div className="flex flex-col gap-0.5 mt-1">
                              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ID: {p.taskId}</span>
                              {p.utr && (
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 w-fit px-2 py-0.5 rounded-md border border-indigo-100">
                                  UTR: {p.utr}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-black shadow-inner">
                              {p.assignerName.charAt(0)}
                            </div>
                            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{p.assignerName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-2">
                            {p.shopName && (
                              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <Store size={14} className="text-slate-300" />
                                {p.shopName}
                              </div>
                            )}
                            {p.phone && (
                              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <Phone size={14} className="text-slate-300" />
                                {p.phone}
                              </div>
                            )}
                            {p.customerName && (
                              <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 w-fit px-2 py-0.5 rounded-md border border-blue-100">
                                <User size={12} /> {p.customerName}
                              </div>
                            )}
                            {p.address && (
                              <div className="flex items-start gap-2 pt-1">
                                {p.address.startsWith("http") ? (
                                  <a 
                                    href={p.address} 
                                    target="_blank" 
                                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                                  >
                                    <MapPin size={10} /> View Location
                                  </a>
                                ) : (
                                  <div className="flex items-start gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100 w-full group/addr relative">
                                    <MapPin size={14} className="text-slate-300 shrink-0 mt-0.5" />
                                    <span className="max-w-[200px] line-clamp-3 text-slate-600 font-bold">{p.address}</span>
                                    <button 
                                      onClick={() => copyToClipboard(p.address || "")}
                                      className="p-1.5 bg-white shadow-sm border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 transition-all shrink-0 hover:shadow-md"
                                      title="Copy Full Address"
                                    >
                                      <Copy size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="inline-flex flex-col items-center justify-center bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 min-w-[100px]">
                            <span className="text-base font-black text-slate-900 leading-tight">₹{p.received.toLocaleString()}</span>
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-500 mt-0.5">COLLECTED</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] leading-relaxed">
                            {dt.date}<br />{dt.time}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {p.fileUrl ? (
                            <button
                              onClick={() => setPreviewImage(p.fileUrl)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            >
                              View Proof <ExternalLink size={12} />
                            </button>
                          ) : (
                            <span className="text-slate-200 text-[9px] font-black uppercase tracking-widest italic pt-2 block">No Attachment</span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <button
                            onClick={() => handleDelete(p.taskId, p.paymentId)}
                            className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                            title="Delete Record"
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 🖼️ Premium Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden relative shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] flex flex-col animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <ExternalLink size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 tracking-tight">Payment Proof Preview</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Transaction Verification</p>
                </div>
              </div>
              
              <button
                onClick={() => setPreviewImage(null)}
                className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center group"
              >
                <Trash2 size={20} className="group-hover:hidden" />
                <span className="hidden group-hover:block font-bold">X</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50/50 flex items-center justify-center">
              {previewImage.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewImage}
                  className="w-full h-[60vh] rounded-[2rem] border-4 border-white shadow-xl"
                  title="PDF Proof"
                />
              ) : (
                <div className="relative w-full h-[60vh] rounded-[2rem] border-4 border-white shadow-xl overflow-hidden bg-white">
                  <img
                    src={previewImage}
                    alt="Payment Proof"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
