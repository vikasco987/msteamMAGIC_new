"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Search,
  FileSpreadsheet,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Receipt
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";

interface PaymentEntry {
  paymentId: string;
  taskId: string;
  taskTitle: string;
  assignerName: string;
  received: number;
  updatedAt: string;
  phone?: string | null;
  shopName?: string | null;
  address?: string | null;
  customerName?: string | null;
  gstin?: string | null;
}

export default function SalesRegisterPage() {
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [businessSettings, setBusinessSettings] = useState<any>(null);

  const today = new Date().toISOString().split("T")[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  
  const [fromDate, setFromDate] = useState(firstDayOfMonth);
  const [toDate, setToDate] = useState(today);

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await fetch("/api/business-settings");
      const data = await res.json();
      setBusinessSettings(data);
    };
    fetchSettings();
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payments/today?fromDate=${fromDate}&toDate=${toDate}`);
      const data = await res.json();
      setPayments(Array.isArray(data.paymentsToday) ? data.paymentsToday : []);
    } catch (err) {
      toast.error("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  const downloadSalesReport = () => {
    if (payments.length === 0) {
      toast.error("No data to export!");
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(businessSettings?.name || "Magic Scale", 15, 15);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const addr = doc.splitTextToSize(businessSettings?.address || "Rajokari, New Delhi", 70);
    doc.text(addr, 15, 20);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Sales Register", pageWidth / 2, 35, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`, pageWidth / 2, 42, { align: 'center' });

    const tableHead = [
      ["Vch Type", "Invoice No", "Date", "Company Name", "Contact", "Phone", "GST NO", "State", "Taxable Value", "Grand Total"]
    ];

    const tableBody = payments.map(p => {
        const taxable = p.received / 1.18;
        const datePart = new Date(p.updatedAt).toISOString().split('T')[0].replace(/-/g, '');
        const numericHash = Math.abs(p.paymentId.split('').reduce((a, b: any) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)).toString().substring(0, 4);
        const invNo = `MS/${datePart}/${numericHash}`;
        
        let state = "Delhi";
        if (p.address?.toLowerCase().includes("haryana")) state = "Haryana";
        if (p.address?.toLowerCase().includes("up") || p.address?.toLowerCase().includes("uttar pradesh")) state = "Uttar Pradesh";
        if (p.address?.toLowerCase().includes("maharashtra")) state = "Maharashtra";

        return [
            "Sales",
            invNo,
            new Date(p.updatedAt).toLocaleDateString(),
            p.shopName || "-",
            p.customerName || p.assignerName || "-",
            p.phone || "-",
            p.gstin || "-",
            state,
            taxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            p.received.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        ];
    });

    autoTable(doc, {
      startY: 50,
      head: tableHead,
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [51, 51, 51], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, textColor: [40, 40, 40] },
      columnStyles: {
        8: { halign: 'right' },
        9: { halign: 'right' }
      },
      margin: { left: 10, right: 10 }
    });

    const finalY = (doc as any).lastAutoTable.cursor.y + 10;
    const totalGrand = payments.reduce((sum, p) => sum + p.received, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Sales: Rs. ${totalGrand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 15, finalY, { align: 'right' });

    doc.save(`Sales_Register_${fromDate}_to_${toDate}.pdf`);
    toast.success("Sales Register Generated!");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Navbar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/payments-today" className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Sales Register</h1>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Reports</span>
                <ChevronRight size={10} />
                <span className="text-blue-600">Financial Year 2024-25</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={downloadSalesReport}
            disabled={loading || payments.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
          >
            <FileSpreadsheet size={16} /> Download PDF
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8 space-y-6">
        {/* Filters */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="date" 
                  value={fromDate} 
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="date" 
                  value={toDate} 
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                />
              </div>
            </div>
          </div>
          <button 
            onClick={fetchReportData}
            className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 min-w-[140px]"
          >
            Apply Filter
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <TrendingUp size={20} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sales (Tax Inclusive)</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">₹{payments.reduce((sum, p) => sum + p.received, 0).toLocaleString()}</h2>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Receipt size={20} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Taxable Value</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">₹{Math.round(payments.reduce((sum, p) => sum + (p.received / 1.18), 0)).toLocaleString()}</h2>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                        <Calendar size={20} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Transactions</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{payments.length}</h2>
            </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Details</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Company</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">State</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Taxable</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating Report...</span>
                      </div>
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-widest italic">
                      No data found for selected range
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const taxable = p.received / 1.18;
                    return (
                      <tr key={p.paymentId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{p.taskTitle}</span>
                            <span className="text-[10px] font-bold text-slate-400 mt-1">{new Date(p.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-xs font-bold text-slate-600">{p.shopName || "-"}</span>
                        </td>
                        <td className="px-8 py-6">
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                                {p.address?.toLowerCase().includes("haryana") ? "Haryana" : p.address?.toLowerCase().includes("up") ? "UP" : "Delhi"}
                            </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="text-xs font-bold text-slate-500">₹{taxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="text-sm font-black text-slate-900">₹{p.received.toLocaleString()}</span>
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
    </div>
  );
}
