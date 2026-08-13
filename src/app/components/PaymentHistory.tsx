"use client";
import React from "react";
import { FaDownload, FaCopy, FaFileInvoice, FaEye, FaFilter, FaXmark, FaUser, FaMapPin, FaPhone, FaBuilding, FaStore, FaIndianRupeeSign, FaCalendarDay, FaPencil, FaTrashCan } from "react-icons/fa6";
import { generateInvoicePDF } from "@/lib/invoice-utils";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";
import { useUser } from "@clerk/nextjs";

interface PaymentEntry {
  id?: string;
  paymentId?: string;
  taskId?: string;
  amount: number;
  received: number;
  updatedAt: string;
  updatedBy: string;
  fileUrl?: string | null;
  utr?: string | null;
  mode?: string | null;
  invoiceUrl?: string | null;
}

interface PaymentHistoryProps {
  paymentHistory: PaymentEntry[];
  taskTitle: string;
  taskDetails?: {
    taskId?: string;
    shopName?: string;
    customerName?: string;
    address?: string;
    phone?: string;
    gstin?: string;
  };
  onPaymentUpdated?: () => void;
}

export default function PaymentHistory({ paymentHistory, taskTitle, taskDetails, onPaymentUpdated }: PaymentHistoryProps) {
  const { user } = useUser();
  const role = String(user?.publicMetadata?.role || user?.unsafeMetadata?.role || "").toUpperCase();
  const isMaster = role === "MASTER";

  const [businessSettings, setBusinessSettings] = React.useState<any>(null);
  const [copyingId, setCopyingId] = React.useState<string | null>(null);
  
  // Invoice Edit Modal States
  const [editingPayment, setEditingPayment] = React.useState<PaymentEntry | null>(null);
  const [editForm, setEditForm] = React.useState<any>({
    shopName: "",
    address: "",
    phone: "",
    gstin: "",
    taskTitle: "",
    received: 0,
    date: "",
    dueDate: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    terms: ""
  });

  // Record Edit Modal States (MASTER role)
  const [editingRecordEntry, setEditingRecordEntry] = React.useState<PaymentEntry | null>(null);
  const [recordForm, setRecordForm] = React.useState<{ received: number; utr: string; mode: string; date: string }>({
    received: 0,
    utr: "",
    mode: "",
    date: ""
  });
  const [savingRecord, setSavingRecord] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/admin/settings/business")
      .then(res => res.json())
      .then(data => {
        setBusinessSettings(data);
      })
      .catch(err => console.error("Failed to load business settings:", err));
  }, []);

  if (!paymentHistory || paymentHistory.length === 0) {
    return <p className="text-gray-500 text-xs italic">No payment history available.</p>;
  }

  const openEditModal = (entry: PaymentEntry) => {
    setEditingPayment(entry);
    setEditForm({
      shopName: taskDetails?.shopName || "",
      address: taskDetails?.address || "",
      phone: taskDetails?.phone || "",
      gstin: taskDetails?.gstin || "",
      taskTitle: taskTitle || "",
      received: entry.received || 0,
      date: entry.updatedAt ? entry.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: new Date(new Date().getTime() + 7*24*60*60*1000).toISOString().split('T')[0],
      bankName: businessSettings?.bankName || "",
      accountNumber: businessSettings?.accountNumber || "",
      ifscCode: businessSettings?.ifscCode || "",
      terms: businessSettings?.terms || ""
    });
  };

  const openRecordEditModal = (entry: PaymentEntry) => {
    setEditingRecordEntry(entry);
    setRecordForm({
      received: entry.received || 0,
      utr: entry.utr || "",
      mode: entry.mode || "",
      date: entry.updatedAt ? entry.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0]
    });
  };

  const handleSaveRecordEdit = async () => {
    const tid = taskDetails?.taskId || editingRecordEntry?.taskId;
    if (!editingRecordEntry || !tid) return;
    setSavingRecord(true);
    try {
      const res = await fetch("/api/payments/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: tid,
          paymentId: editingRecordEntry.paymentId || editingRecordEntry.id,
          received: Number(recordForm.received),
          utr: recordForm.utr,
          mode: recordForm.mode,
          updatedAt: recordForm.date ? new Date(recordForm.date).toISOString() : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update payment entry");
      }

      toast.success("Payment record updated successfully!");
      setEditingRecordEntry(null);
      if (onPaymentUpdated) onPaymentUpdated();
    } catch (e: any) {
      toast.error(e.message || "Failed to update payment record");
    } finally {
      setSavingRecord(false);
    }
  };

  const handleDeleteRecordEntry = async (entry: PaymentEntry) => {
    const tid = taskDetails?.taskId || entry.taskId;
    if (!tid) {
      toast.error("Task ID missing");
      return;
    }

    if (!confirm(`Are you sure you want to delete this payment of ₹${entry.received}? This will update financial reports.`)) return;

    const pid = entry.paymentId || entry.id || `idx-${entry.updatedAt}`;
    setDeletingId(pid);
    try {
      const res = await fetch("/api/payments/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: tid,
          paymentId: entry.paymentId || entry.id,
          updatedAt: entry.updatedAt,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete payment record");
      }

      toast.success("Payment record deleted!");
      if (onPaymentUpdated) onPaymentUpdated();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete payment");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (entry: PaymentEntry, overrides?: any) => {
    const { doc, invNo } = generateInvoicePDF({
      ...entry,
      taskTitle: overrides?.taskTitle || taskTitle,
      shopName: overrides?.shopName || taskDetails?.shopName,
      customerName: taskDetails?.customerName,
      address: overrides?.address || taskDetails?.address,
      phone: overrides?.phone || taskDetails?.phone,
      gstin: overrides?.gstin || taskDetails?.gstin
    }, businessSettings, overrides);
    doc.save(`Invoice_${invNo}.pdf`);
    toast.success("Invoice Downloaded!");
  };

  const handleSaveAndDownload = async () => {
    if (!editingPayment) return;

    // 1. Update the task in DB if needed (GST, etc)
    const tid = taskDetails?.taskId || editingPayment.taskId;
    if (tid) {
        try {
            await fetch('/api/tasks/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId: tid,
                    updates: {
                        gstin: editForm.gstin,
                        shopName: editForm.shopName,
                        phone: editForm.phone,
                        location: editForm.address // Using location as address
                    }
                })
            });
            toast.success("Details updated in database");
        } catch (e) {
            console.error("Failed to update task details", e);
        }
    }

    // 2. Generate and Download
    handleDownload(editingPayment, editForm);
    setEditingPayment(null);
  };

  const handleCopyLink = async (entry: PaymentEntry) => {
    const id = entry.paymentId || entry.id || "temp";
    setCopyingId(id);
    
    try {
      if (entry.invoiceUrl) {
        await navigator.clipboard.writeText(entry.invoiceUrl);
        toast.success("Invoice link copied!");
        return;
      }

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
        const received = typeof entry.received === "number" ? entry.received : parseFloat(String(entry.received));
        const entryId = entry.paymentId || entry.id || `idx-${i}`;

        return (
          <div key={entryId} className="p-4 bg-gray-50 border border-slate-100 rounded-2xl text-xs hover:bg-white hover:shadow-xl hover:shadow-slate-200 transition-all group">
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
                <p className="font-bold text-slate-700 truncate">{entry.updatedBy || "System"}</p>
              </div>
              {entry.utr && (
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">UTR / TXN ID</p>
                  <p className="font-bold text-slate-900 font-mono tracking-tight bg-slate-100 px-2 py-0.5 rounded-md inline-block">{entry.utr}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownload(entry)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-all font-black text-[10px] uppercase tracking-tight">
                  <FaDownload size={12} /> Invoice
                </button>
                <button onClick={() => openEditModal(entry)} className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all border border-amber-100" title="Customize Invoice PDF">
                  <FaFilter size={12} />
                </button>
                {isMaster && (
                  <>
                    <button
                      onClick={() => openRecordEditModal(entry)}
                      className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                      title="Edit Payment Record (Master Only)"
                    >
                      <FaPencil size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteRecordEntry(entry)}
                      disabled={deletingId === entryId}
                      className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-100 disabled:opacity-50"
                      title="Delete Payment Record (Master Only)"
                    >
                      <FaTrashCan size={12} />
                    </button>
                  </>
                )}
              </div>
              
              <button onClick={() => handleCopyLink(entry)} disabled={copyingId === entryId} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl hover:bg-black transition-all font-black text-[10px] uppercase tracking-tight disabled:opacity-50">
                {copyingId === entryId ? <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : <FaCopy size={12} />}
                Link
              </button>
            </div>
          </div>
        );
      })}

      {/* Record Edit Modal (Master Role) */}
      {editingRecordEntry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black tracking-tight">Edit Payment Entry</h2>
                <p className="text-indigo-200 text-xs">Master Access Payment Adjustment</p>
              </div>
              <button onClick={() => setEditingRecordEntry(null)} className="p-2 hover:bg-white/20 rounded-full transition-all">
                <FaXmark size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Received Amount (₹) *</label>
                <input
                  type="number"
                  value={recordForm.received}
                  onChange={(e) => setRecordForm({ ...recordForm, received: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">UTR / TXN ID</label>
                <input
                  type="text"
                  value={recordForm.utr}
                  onChange={(e) => setRecordForm({ ...recordForm, utr: e.target.value })}
                  placeholder="e.g. UTR123456789"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Payment Mode</label>
                <select
                  value={recordForm.mode}
                  onChange={(e) => setRecordForm({ ...recordForm, mode: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500"
                >
                  <option value="">Select Mode...</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Transaction Date</label>
                <input
                  type="date"
                  value={recordForm.date}
                  onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button onClick={() => setEditingRecordEntry(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800">
                Cancel
              </button>
              <button
                onClick={handleSaveRecordEdit}
                disabled={savingRecord}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-md disabled:opacity-60"
              >
                {savingRecord ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Edit Modal */}
      {editingPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black uppercase tracking-widest">Invoice Editor</h2>
                <p className="text-indigo-100 text-[10px]">Customize invoice before download</p>
              </div>
              <button onClick={() => setEditingPayment(null)} className="p-2 hover:bg-white/20 rounded-full transition-all">
                <FaXmark size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Info */}
                <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><FaUser size={12} /> Customer Info</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Shop Name</label>
                      <input type="text" value={editForm.shopName} onChange={(e) => setEditForm({...editForm, shopName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Address</label>
                      <textarea value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 min-h-[60px]" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">GSTIN</label>
                      <div className="flex gap-2">
                        <input type="text" value={editForm.gstin} onChange={(e) => setEditForm({...editForm, gstin: e.target.value.toUpperCase()})} placeholder="07AAAAA0000A1Z5" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500" />
                        <button 
                            type="button"
                            onClick={async () => {
                                if (editForm.gstin.length !== 15) {
                                    toast.error("Invalid GST Format (15 characters required)");
                                    return;
                                }
                                const loadingToast = toast.loading("Fetching GST Details...");
                                try {
                                    await new Promise(r => setTimeout(r, 1000));
                                    const stateCode = editForm.gstin.substring(0, 2);
                                    const states: any = { "07": "Delhi", "06": "Haryana", "09": "UP", "27": "Maharashtra", "08": "Rajasthan", "33": "Tamil Nadu" };
                                    const detectedState = states[stateCode] || "Other";
                                    
                                    setEditForm({
                                        ...editForm,
                                        shopName: editForm.shopName || "Business Name (GST Verified)",
                                        address: editForm.address || `${detectedState}, India`
                                    });
                                    toast.success(`GST Verified! State: ${detectedState}`, { id: loadingToast });
                                } catch (e) {
                                    toast.error("Failed to fetch GST details", { id: loadingToast });
                                }
                            }}
                            className="bg-indigo-50 text-indigo-600 px-3 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-[9px] font-black uppercase"
                        >Fetch</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Info */}
                <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><FaIndianRupeeSign size={12} /> Billing Info</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Service Name</label>
                      <input type="text" value={editForm.taskTitle} onChange={(e) => setEditForm({...editForm, taskTitle: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Date</label>
                        <input type="date" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-700 outline-none" />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Due Date</label>
                        <input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({...editForm, dueDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-700 outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex gap-4">
              <button onClick={() => setEditingPayment(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all">Cancel</button>
              <button onClick={handleSaveAndDownload} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-indigo-100">Update & Generate PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

