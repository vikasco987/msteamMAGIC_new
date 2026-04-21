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
  Copy,
  Download,
  FileText
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  invoiceUrl?: string | null;
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
  const [businessSettings, setBusinessSettings] = useState<any>(null);

  useEffect(() => {
    fetchPayments(selectedDate);
    fetchBusinessSettings();
  }, [selectedDate]);

  const fetchBusinessSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings/business");
      const data = await res.json();
      if (data && !data.error) setBusinessSettings(data);
    } catch (err) {
      console.error("Failed to fetch business settings", err);
    }
  };

  const handleDownloadInvoice = async (p: PaymentEntry & { invoiceUrl?: string | null }) => {
    if (!businessSettings) {
      toast.error("Please setup Business Settings first!");
      return;
    }

    // If already uploaded, we can just share it or download it again
    if (p.invoiceUrl) {
      const copyLink = () => {
        navigator.clipboard.writeText(p.invoiceUrl!);
        toast.success("Invoice link copied to clipboard!");
      };
      
      toast((t) => (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Invoice already uploaded!</p>
          <div className="flex gap-2">
            <button 
              onClick={() => { window.open(p.invoiceUrl!, '_blank'); toast.dismiss(t.id); }}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase"
            >
              Open Link
            </button>
            <button 
              onClick={() => { copyLink(); toast.dismiss(t.id); }}
              className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase"
            >
              Copy Link
            </button>
          </div>
        </div>
      ), { duration: 5000 });
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const blueColor = [59, 130, 246]; // A professional blue
    
    // ... (rest of the PDF generation logic is same, but we will use the blob at the end) ...
    // [I will use the same code but keep it concise for the diff]
    
    // 1. TOP HEADER
    if (businessSettings.logo) {
      try { doc.addImage(businessSettings.logo, 'PNG', 10, 10, 35, 20); } catch (e) {}
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(businessSettings.name || "Magic Scale Restaurant Consultant", 50, 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const addressLines = doc.splitTextToSize(businessSettings.address || "", 80);
    doc.text(addressLines, 50, 22);

    // Right Header
    doc.text(`Name : Akash Verma`, pageWidth - 60, 15);
    doc.text(`Phone : ${businessSettings.phone || ""}`, pageWidth - 60, 20);
    doc.text(`Email : ${businessSettings.email || ""}`, pageWidth - 60, 25);
    doc.text(`Website : ${businessSettings.website || ""}`, pageWidth - 60, 30);

    // TAX BAR
    doc.setDrawColor(59, 130, 246);
    doc.rect(10, 40, pageWidth - 20, 10);
    doc.setFontSize(14);
    doc.setTextColor(59, 130, 246);
    doc.text("TAX INVOICE", pageWidth / 2, 47, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // DETAILS
    doc.rect(10, 50, pageWidth - 20, 45);
    doc.line(pageWidth / 2 - 20, 50, pageWidth / 2 - 20, 95);
    doc.text("M/S: " + (p.shopName || p.customerName || "-"), 12, 60);
    doc.text("Address: " + (p.address || "-"), 12, 65, { maxWidth: 60 });
    doc.text("Invoice No: " + p.taskId.substring(0, 8), pageWidth / 2 - 15, 60);
    doc.text("Date: " + new Date().toLocaleDateString(), pageWidth / 2 - 15, 65);

    // TABLE
    autoTable(doc, {
      startY: 95,
      head: [['Sr.', 'Service Description', 'Qty', 'Rate', 'Taxable', 'IGST %', 'Total']],
      body: [['1', p.taskTitle, '1.00', p.received.toString(), p.received.toString(), '18.00', (p.received * 1.18).toFixed(2)]],
      headStyles: { fillColor: [240, 248, 255], textColor: [0, 0, 0] },
      theme: 'grid'
    });

    let finalY = (doc as any).lastAutoTable.finalY;

    // FOOTER
    doc.rect(10, finalY, pageWidth - 20, 40);
    doc.text("BANK DETAILS:", 12, finalY + 10);
    doc.text(`A/C: ${businessSettings.accountNumber || "-"}`, 12, finalY + 15);
    doc.text(`IFSC: ${businessSettings.ifscCode || "-"}`, 12, finalY + 20);

    // DOWNLOAD
    const fileName = `Invoice_${p.shopName || p.taskId}.pdf`;
    doc.save(fileName);

    // UPLOAD TO CLOUDINARY IF NOT ALREADY UPLOADED
    if (!p.invoiceUrl) {
      const pdfBlob = doc.output('blob');
      const formData = new FormData();
      formData.append('file', pdfBlob, fileName);

      toast.promise(
        (async () => {
          // 1. Upload to Cloudinary
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          const { url } = await uploadRes.json();
          
          if (!url) throw new Error("Upload failed");

          // 2. Save URL to Database
          await fetch('/api/payments/update-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId: p.paymentId, invoiceUrl: url }),
          });

          // 3. Update local state
          setPayments(prev => prev.map(item => 
            item.paymentId === p.paymentId ? { ...item, invoiceUrl: url } : item
          ));

          return url;
        })(),
        {
          loading: 'Uploading invoice to Cloudinary...',
          success: (url) => {
             return (
               <div className="flex flex-col gap-1">
                 <p>Invoice shared successfully!</p>
                 <button 
                   onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copied!"); }}
                   className="text-[10px] font-bold text-blue-600 underline"
                 >
                   Copy Share Link
                 </button>
               </div>
             );
          },
          error: 'Failed to upload/share invoice.',
        }
      );
    }
  };
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
                          <div className="flex flex-col gap-2">
                            {p.fileUrl ? (
                              <button
                                onClick={() => setPreviewImage(p.fileUrl)}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              >
                                View Proof <ExternalLink size={12} />
                              </button>
                            ) : (
                              <span className="text-slate-200 text-[9px] font-black uppercase tracking-widest italic text-center">No Attachment</span>
                            )}
                            
                            <div className="flex gap-1 w-full">
                              <button
                                onClick={() => handleDownloadInvoice(p)}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                              >
                                Invoice <FileText size={12} />
                              </button>
                              
                              {p.invoiceUrl && (
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(p.invoiceUrl!);
                                    toast.success("Link copied!");
                                  }}
                                  className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                                  title="Copy Share Link"
                                >
                                  <Copy size={14} />
                                </button>
                              )}
                            </div>
                          </div>
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
