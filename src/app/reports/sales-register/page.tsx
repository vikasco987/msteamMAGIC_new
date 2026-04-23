"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Search,
  FileSpreadsheet,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Receipt,
  MapPin
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";
import * as XLSX from "xlsx";

const getState = (p: any) => {
    let state = "Delhi";
    const stateCodes: { [key: string]: string } = {
        "07": "Delhi", "06": "Haryana", "09": "Uttar Pradesh", "27": "Maharashtra", "08": "Rajasthan", "33": "Tamil Nadu", "24": "Gujarat"
    };
    if (p.gstin && p.gstin.length >= 2) {
        const code = p.gstin.substring(0, 2);
        if (stateCodes[code]) return stateCodes[code];
    }
    if (p.address) {
        const lowerAddr = p.address.toLowerCase();
        if (lowerAddr.includes("haryana")) return "Haryana";
        if (lowerAddr.includes("up") || lowerAddr.includes("uttar pradesh") || lowerAddr.includes("noida")) return "Uttar Pradesh";
        if (lowerAddr.includes("maharashtra") || lowerAddr.includes("mumbai")) return "Maharashtra";
        if (lowerAddr.includes("gujarat") || lowerAddr.includes("ahmedabad")) return "Gujarat";
        if (lowerAddr.includes("rajasthan") || lowerAddr.includes("jaipur")) return "Rajasthan";
    }
    return state;
};

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
      ["Vch Type", "Invoice No", "Date", "Company Name", "Contact", "Phone", "GST NO", "State", "Billing Address", "Taxable Value", "Grand Total"]
    ];

    const tableBody = payments.map(p => {
        const taxable = p.received / 1.18;
        const datePart = new Date(p.updatedAt).toISOString().split('T')[0].replace(/-/g, '');
        const numericHash = Math.abs(p.paymentId.split('').reduce((a, b: any) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)).toString().substring(0, 4);
        const invNo = `MS/${datePart}/${numericHash}`;
        const state = getState(p);
        
        const roundedTaxable = Math.round(taxable);
        const roundedReceived = Math.round(p.received);

        return [
            "Sales",
            invNo,
            new Date(p.updatedAt).toLocaleDateString(),
            p.shopName || "-",
            p.customerName || p.assignerName || "-",
            p.phone || "-",
            p.gstin || "-",
            state,
            p.address || "-",
            roundedTaxable.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
            roundedReceived.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
        ];
    });

    autoTable(doc, {
      startY: 50,
      head: tableHead,
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [51, 51, 51], textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { fontSize: 6, textColor: [40, 40, 40] },
      columnStyles: {
        8: { cellWidth: 50 }, // Address column width
        9: { halign: 'right' },
        10: { halign: 'right' }
      },
      margin: { left: 8, right: 8 }
    });

    const finalY = (doc as any).lastAutoTable.cursor.y + 10;
    const totalGrand = Math.round(payments.reduce((sum, p) => sum + p.received, 0));
    doc.setFont("helvetica", "bold");
    doc.text(`Total Sales: Rs. ${totalGrand.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, pageWidth - 15, finalY, { align: 'right' });

    doc.save(`Sales_Register_${fromDate}_to_${toDate}.pdf`);
    toast.success("Sales Register Generated!");
  };

  const downloadExcel = () => {
    if (payments.length === 0) {
      toast.error("No data to export!");
      return;
    }

    const exportData = payments.map(p => {
        const taxable = p.received / 1.18;
        const datePart = new Date(p.updatedAt).toISOString().split('T')[0].replace(/-/g, '');
        const numericHash = Math.abs(p.paymentId.split('').reduce((a, b: any) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)).toString().substring(0, 4);
        const invNo = `MS/${datePart}/${numericHash}`;
        
        return {
            "Vch Type": "Sales",
            "Invoice No": invNo,
            "Date": new Date(p.updatedAt).toLocaleDateString(),
            "Company Name": p.shopName || "-",
            "Contact Person": p.customerName || p.assignerName || "-",
            "Phone": p.phone || "-",
            "GST NO": p.gstin || "-",
            "State": getState(p),
            "Billing Address": p.address || "-",
            "Taxable Value": Math.round(taxable),
            "Grand Total": Math.round(p.received)
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Register");
    XLSX.writeFile(workbook, `Sales_Register_${fromDate}_to_${toDate}.xlsx`);
    toast.success("Excel Downloaded!");
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
          
          <div className="flex items-center gap-3">
            <button 
              onClick={downloadExcel}
              disabled={loading || payments.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 disabled:opacity-50"
            >
              <FileSpreadsheet size={16} /> Excel
            </button>
            <button 
              onClick={downloadSalesReport}
              disabled={loading || payments.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
            >
              <Receipt size={16} /> PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[98%] mx-auto px-4 mt-8 space-y-6">
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

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-600 uppercase">Vch Type</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-600 uppercase">Invoice No</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-600 uppercase">Invoice Date</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-600 uppercase">Company Name</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-600 uppercase">Contact Person</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-600 uppercase">Phone No</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-600 uppercase">GST NO</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-600 uppercase">Transaction ID</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-600 uppercase">State</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-600 uppercase">Billing Address</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-600 uppercase text-right">Taxable Value</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-600 uppercase text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating Report...</span>
                      </div>
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-widest italic">
                      No data found for selected range
                    </td>
                  </tr>
                ) : (
                  payments.map((p, idx) => {
                    const taxable = p.received / 1.18;
                    const datePart = new Date(p.updatedAt).toISOString().split('T')[0].replace(/-/g, '');
                    const numericHash = Math.abs(p.paymentId.split('').reduce((a, b: any) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)).toString().substring(0, 4);
                    const invNo = `MS/${datePart}/${numericHash}`;

                    return (
                      <tr key={p.paymentId} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-blue-50/50 transition-colors`}>
                        <td className="px-4 py-5 text-[11px] text-slate-500">Sales</td>
                        <td className="px-4 py-5 text-[11px] font-bold text-teal-600">
                           <Link href={`#`} className="hover:underline">{idx + 1}</Link>
                        </td>
                        <td className="px-4 py-5 text-[11px] text-slate-600">{new Date(p.updatedAt).toLocaleDateString()}</td>
                        <td className="px-4 py-5">
                           <span className="text-[11px] font-bold text-slate-800">{p.shopName || "-"}</span>
                        </td>
                        <td className="px-4 py-5 text-[11px] text-slate-600">{p.customerName || p.assignerName || "-"}</td>
                        <td className="px-4 py-5 text-[11px] text-slate-600">{p.phone || "-"}</td>
                        <td className="px-4 py-5 text-[11px] text-slate-600 font-mono">{p.gstin || "-"}</td>
                        <td className="px-4 py-5 text-[11px] text-slate-400 italic">{(p as any).utr || "-"}</td>
                        <td className="px-4 py-5 text-[11px] text-slate-600">{getState(p)}</td>
                        <td className="px-4 py-5 min-w-[150px]">
                            {p.address?.startsWith('http') ? (
                                <a href={p.address} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-[10px] font-black uppercase flex items-center gap-1">
                                    <MapPin size={12}/> View Location
                                </a>
                            ) : (
                                <p className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-wrap">{p.address || "-"}</p>
                            )}
                        </td>
                        <td className="px-4 py-5 text-right text-[11px] font-medium text-slate-500">
                          {Math.round(taxable).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-5 text-right text-[12px] font-bold text-slate-900">
                          {Math.round(p.received).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {payments.length > 0 && !loading && (
                <tfoot className="bg-slate-900 text-white">
                  <tr>
                    <td colSpan={10} className="px-4 py-4 text-[11px] font-black uppercase tracking-widest text-right">Totals</td>
                    <td className="px-4 py-4 text-right text-[12px] font-bold">
                      ₹{Math.round(payments.reduce((sum, p) => sum + (p.received / 1.18), 0)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-4 text-right text-[12px] font-bold">
                      ₹{Math.round(payments.reduce((sum, p) => sum + p.received, 0)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
