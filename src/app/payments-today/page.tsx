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

    // Share link if already uploaded
    if (p.invoiceUrl) {
      toast((t) => (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Invoice already uploaded!</p>
          <div className="flex gap-2">
            <button onClick={() => { window.open(p.invoiceUrl!, '_blank'); toast.dismiss(t.id); }} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase">Open Link</button>
            <button onClick={() => { navigator.clipboard.writeText(p.invoiceUrl!); toast.success("Link copied!"); toast.dismiss(t.id); }} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase">Copy Link</button>
            <button 
              onClick={() => { 
                toast.dismiss(t.id);
                // Trigger generation by temporarily clearing URL in local call
                const cleanP = { ...p, invoiceUrl: null };
                handleDownloadInvoice(cleanP as any);
              }} 
              className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase"
            >
              Regenerate
            </button>
          </div>
        </div>
      ), { duration: 6000 });
      // Don't return here, let them regenerate if they clicked the button or if we want to allow it
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const blueColor = [59, 130, 246];
    
    // Clean text helper
    const cleanText = (str: string) => (str || "").replace(/[^\x20-\x7E]/g, '');
    const safeTitle = cleanText(p.taskTitle || "Service");

    // 1. TOP HEADER
    if (businessSettings.logo) {
      try { doc.addImage(businessSettings.logo, 'PNG', 10, 10, 32, 18); } catch (e) {}
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text("Magic Scale Restaurant", 48, 15);
    doc.text("Consultant", 48, 23);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    const addr = doc.splitTextToSize(businessSettings.address || "3rd floor, 599 Opp. near grand westend greens Rajokari, New Delhi - 110038", 70);
    doc.text(addr, 48, 29);

    const rightInfoX = pageWidth - 65;
    const colonX = pageWidth - 52;
    const valueX = pageWidth - 48;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Name", rightInfoX, 15);
    doc.text("Phone", rightInfoX, 20);
    doc.text("Email", rightInfoX, 25);
    doc.text("Website", rightInfoX, 30);
    doc.text(":", colonX, 15);
    doc.text(":", colonX, 20);
    doc.text(":", colonX, 25);
    doc.text(":", colonX, 30);
    doc.setFont("helvetica", "normal");
    doc.text("Akash Verma", valueX, 15);
    doc.text(businessSettings.phone || "8826073117", valueX, 20);
    doc.text(businessSettings.email || "Support@magicscale.in", valueX, 25);
    doc.text("https://magicscale.in/", valueX, 30);

    // 2. TAX INVOICE BAR
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.4);
    doc.rect(10, 40, pageWidth - 20, 10);
    doc.line(pageWidth / 3 + 5, 40, pageWidth / 3 + 5, 50);
    doc.line((pageWidth * 2) / 3 - 5, 40, (pageWidth * 2) / 3 - 5, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`GSTIN : ${businessSettings.gstin || "07CCJPV6752R1ZF"}`, 12, 46.5);
    doc.setFontSize(16);
    doc.setTextColor(59, 130, 246);
    doc.text("TAX INVOICE", pageWidth / 2, 47, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("ORIGINAL FOR RECIPIENT", pageWidth - 12, 46.5, { align: 'right' });

    // 3. DETAILS BOX
    doc.setDrawColor(59, 130, 246);
    doc.rect(10, 50, pageWidth - 20, 50);
    doc.line(pageWidth / 2 - 15, 50, pageWidth / 2 - 15, 100);
    doc.setFillColor(240, 248, 255);
    doc.rect(10.2, 50.2, (pageWidth / 2 - 15) - 10.2, 6, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Customer Detail", (pageWidth / 2 - 15) / 2 + 5, 54.5, { align: 'center' });

    doc.setFontSize(8);
    let cY = 62;
    const row = (l: string, v: string, y: number) => {
        doc.setFont("helvetica", "bold");
        doc.text(l, 12, y);
        doc.setFont("helvetica", "normal");
        const vLines = doc.splitTextToSize(cleanText(v || "-"), 55);
        doc.text(vLines, 35, y);
        return y + (vLines.length * 4);
    };
    cY = row("M/S", p.shopName || p.customerName || "-", cY);
    cY = row("Address", p.address || "-", cY);
    cY = row("Phone", p.phone || "-", cY);
    cY = row("GSTIN", "-", cY);
    cY = row("PAN", "-", cY);
    cY = row("Place of Supply", "Delhi (07)", cY);

    let rY = 60;
    const info = (l: string, v: string, y: number) => {
        doc.setFont("helvetica", "normal");
        doc.text(l, pageWidth / 2 - 10, y);
        doc.setFont("helvetica", "bold");
        doc.text(v, pageWidth - 15, y, { align: 'right' });
        return y + 8;
    };
    rY = info("Invoice No.", p.taskId.substring(0, 8).toUpperCase(), rY);
    rY = info("Invoice Date", new Date(p.updatedAt).toLocaleDateString(), rY);
    rY = info("Due Date", new Date(new Date(p.updatedAt).getTime() + 7*24*60*60*1000).toLocaleDateString(), rY);

    // 4. TAX CALCULATION LOGIC (Based on State)
    const bizAddress = (businessSettings.address || "").toLowerCase();
    const custAddress = (p.address || "").toLowerCase();
    
    // Simple state detection
    const isSameState = (bizAddress.includes("delhi") && custAddress.includes("delhi")) || 
                        (bizAddress.includes("haryana") && custAddress.includes("haryana")) ||
                        (bizAddress.includes("up") && custAddress.includes("up"));

    const taxable = p.received;
    let cgst = 0, sgst = 0, igst = 0;
    
    if (isSameState) {
        cgst = taxable * 0.09;
        sgst = taxable * 0.09;
    } else {
        igst = taxable * 0.18;
    }
    const totalTax = cgst + sgst + igst;
    const totalAmount = taxable + totalTax;

    const tableHead = isSameState 
        ? [[{ content: 'Sr.', rowSpan: 2 }, { content: 'Name of Product / Service', rowSpan: 2 }, { content: 'HSN/SAC', rowSpan: 2 }, { content: 'Qty', rowSpan: 2 }, { content: 'Rate', rowSpan: 2 }, { content: 'Taxable Value', rowSpan: 2 }, { content: 'CGST', colSpan: 2 }, { content: 'SGST', colSpan: 2 }, { content: 'Total', rowSpan: 2 }], ['%', 'Amt', '%', 'Amt']]
        : [[{ content: 'Sr.', rowSpan: 2 }, { content: 'Name of Product / Service', rowSpan: 2 }, { content: 'HSN/SAC', rowSpan: 2 }, { content: 'Qty', rowSpan: 2 }, { content: 'Rate', rowSpan: 2 }, { content: 'Taxable Value', rowSpan: 2 }, { content: 'IGST', colSpan: 2 }, { content: 'Total', rowSpan: 2 }], ['%', 'Amount']];

    const tableBody = isSameState
        ? [['1', safeTitle, '9983', '1.00', taxable.toLocaleString(), taxable.toLocaleString(), '9.00', cgst.toFixed(2), '9.00', sgst.toFixed(2), totalAmount.toLocaleString()]]
        : [['1', safeTitle, '9983', '1.00', taxable.toLocaleString(), taxable.toLocaleString(), '18.00', igst.toFixed(2), totalAmount.toLocaleString()]];

    const tableFoot = isSameState
        ? [['', 'Total', '', '1.00', '', taxable.toLocaleString(), '', cgst.toFixed(2), '', sgst.toFixed(2), totalAmount.toLocaleString()]]
        : [['', 'Total', '', '1.00', '', taxable.toLocaleString(), '', igst.toFixed(2), totalAmount.toLocaleString()]];

    autoTable(doc, {
      startY: 100,
      head: tableHead as any,
      body: tableBody as any,
      foot: tableFoot as any,
      styles: { fontSize: 7, cellPadding: 2, lineColor: [59, 130, 246], lineWidth: 0.1, textColor: [0,0,0], font: 'helvetica' },
      headStyles: { fillColor: [240, 248, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineWidth: 0.1, lineColor: [59, 130, 246] },
      footStyles: { fillColor: [240, 248, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
      columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 45 } },
      theme: 'grid'
    });

    let fY = (doc as any).lastAutoTable.finalY;

    // 5. SUMMARY & FOOTER (Refined to match Image 3)
    doc.setDrawColor(59, 130, 246);
    doc.rect(10, fY, pageWidth - 20, 35);
    doc.line(pageWidth / 2 + 15, fY, pageWidth / 2 + 15, fY + 35); // Divider
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Total in words", (pageWidth / 2 + 15) / 2 + 5, fY + 5.5, { align: 'center' });
    doc.line(10, fY + 8, pageWidth / 2 + 15, fY + 8);
    
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    const words = doc.splitTextToSize(cleanText(totalAmount.toLocaleString() + " Rupees Only").toUpperCase(), 50);
    doc.text(words, (pageWidth / 2 + 15) / 2 + 5, fY + 18, { align: 'center' });

    // Summary Right Side
    const sX = pageWidth / 2 + 17;
    const vX = pageWidth - 12;
    const sRow = (l: string, v: string, y: number, b = false) => {
        doc.setFont("helvetica", b ? "bold" : "normal");
        doc.text(l, sX, y);
        doc.text(v, vX, y, { align: 'right' });
        doc.line(pageWidth / 2 + 15, y + 2.5, pageWidth - 10, y + 2.5);
    };
    sRow("Taxable Amount", taxable.toLocaleString(), fY + 6);
    if (isSameState) {
        sRow("Add : CGST (9%)", cgst.toFixed(2), fY + 13);
        sRow("Add : SGST (9%)", sgst.toFixed(2), fY + 20);
    } else {
        sRow("Add : IGST (18%)", igst.toFixed(2), fY + 13);
        sRow("", "", fY + 20); // Empty row to keep space
    }
    sRow("Total Tax", totalTax.toFixed(2), fY + 27);
    doc.setFontSize(10);
    sRow("Total Amount After Tax", `Rs. ${totalAmount.toLocaleString()}`, fY + 34, true);

    // E&OE Label
    fY += 35;
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.text("(E & O.E.)", pageWidth - 12, fY + 4.5, { align: 'right' });
    doc.line(pageWidth / 2 + 15, fY + 6, pageWidth - 10, fY + 6);

    // Bank Details & Signatory
    doc.rect(10, fY + 6, pageWidth - 20, 50);
    doc.line(pageWidth / 2 + 15, fY + 6, pageWidth / 2 + 15, fY + 56);
    
    doc.setFont("helvetica", "bold");
    doc.text("Bank Details", (pageWidth / 2 + 15) / 2 + 5, fY + 10.5, { align: 'center' });
    doc.line(10, fY + 13, pageWidth / 2 + 15, fY + 13);
    
    doc.setFontSize(8);
    const bRow = (l: string, v: string, y: number) => {
        doc.setFont("helvetica", "bold");
        doc.text(l, 12, y);
        doc.setFont("helvetica", "normal");
        doc.text(v, 40, y);
    };
    bRow("Bank Name", businessSettings.bankName || "Yes Bank", fY + 19);
    bRow("Acc. Name", businessSettings.accountName || "Magic Scale", fY + 26);
    bRow("Acc. Number", businessSettings.accountNumber || "102561900002640", fY + 33);
    bRow("IFSC", businessSettings.ifscCode || "YESB0001025", fY + 40);

    // Signatory Area
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("Certified that the particulars given above are true and correct.", (pageWidth / 2 + 15) + (pageWidth - (pageWidth / 2 + 15)) / 2, fY + 10.5, { align: 'center' });
    doc.text("For " + (businessSettings.name || "Magic Scale"), (pageWidth / 2 + 15) + (pageWidth - (pageWidth / 2 + 15)) / 2, fY + 16, { align: 'center' });
    
    if (businessSettings.signatureUrl) {
      try { doc.addImage(businessSettings.signatureUrl, 'PNG', pageWidth - 55, fY + 22, 35, 18); } catch (e) {}
    }
    
    doc.line(pageWidth / 2 + 25, fY + 48, pageWidth - 20, fY + 48);
    doc.text("Authorised Signatory", (pageWidth / 2 + 15) + (pageWidth - (pageWidth / 2 + 15)) / 2, fY + 52, { align: 'center' });

    // Terms
    fY += 56;
    doc.rect(10, fY, pageWidth - 20, 25);
    doc.setFont("helvetica", "bold");
    doc.text("Terms and Conditions", (pageWidth - 20) / 2 + 10, fY + 4.5, { align: 'center' });
    doc.line(10, fY + 6, pageWidth - 10, fY + 6);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    const t = doc.splitTextToSize(businessSettings.terms || "1. Payment is non-refundable.\n2. Balance on completion.", 180);
    doc.text(t, 12, fY + 11);

    const fileName = `Invoice_${p.shopName || p.taskId}.pdf`;
    doc.save(fileName);

    // UPLOAD (Always upload if regenerating or first time)
    const pdfBlob = doc.output('blob');
    const formData = new FormData();
    formData.append('file', pdfBlob, fileName);
    toast.promise(
      (async () => {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const { url } = await res.json();
        if (!url) throw new Error("Fail");
        await fetch('/api/payments/update-invoice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId: p.paymentId, invoiceUrl: url }) });
        setPayments(prev => prev.map(item => item.paymentId === p.paymentId ? { ...item, invoiceUrl: url } : item));
        return url;
      })(),
      { loading: 'Sharing...', success: 'Invoice Updated!', error: 'Sync fail.' }
    );
  };

    const fileName = `Invoice_${p.shopName || p.taskId}.pdf`;
    doc.save(fileName);

    // UPLOAD
    if (!p.invoiceUrl) {
      const pdfBlob = doc.output('blob');
      const formData = new FormData();
      formData.append('file', pdfBlob, fileName);
      toast.promise(
        (async () => {
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          const { url } = await res.json();
          if (!url) throw new Error("Fail");
          await fetch('/api/payments/update-invoice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId: p.paymentId, invoiceUrl: url }) });
          setPayments(prev => prev.map(item => item.paymentId === p.paymentId ? { ...item, invoiceUrl: url } : item));
          return url;
        })(),
        { loading: 'Uploading...', success: 'Shared!', error: 'Upload fail.' }
      );
    }
  };
  
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
