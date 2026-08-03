"use client";

import React, { useEffect, useState } from "react";
import { 
  User, Phone, Building2, CreditCard, ShieldCheck, FileText, 
  MapPin, AlertCircle, Save, CheckCircle2, Loader2, Sparkles, HeartPulse, QrCode
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function EmployeeMyDetailsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    department: "Sales",
    designation: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    accountHolderName: "",
    bankName: "",
    bankAccount: "",
    ifscCode: "",
    upiId: "",
    panNumber: "",
    aadhaarNumber: ""
  });

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await fetch("/api/user/profile");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load details");

        setUserEmail(data.user?.email || "");
        setUserImageUrl(data.user?.imageUrl || null);

        if (data.user?.profile) {
          const p = data.user.profile;
          setFormData({
            name: p.name || data.user.fullName || "",
            phone: p.phone || "",
            department: p.department || "Sales",
            designation: p.designation || "",
            address: p.address || "",
            emergencyContactName: p.emergencyContactName || "",
            emergencyContactPhone: p.emergencyContactPhone || "",
            accountHolderName: p.accountHolderName || p.name || "",
            bankName: p.bankName || "",
            bankAccount: p.bankAccount || "",
            ifscCode: p.ifscCode || "",
            upiId: p.upiId || "",
            panNumber: p.panNumber || "",
            aadhaarNumber: p.aadhaarNumber || ""
          });
        } else if (data.user?.fullName) {
          setFormData(prev => ({ ...prev, name: data.user.fullName }));
        }
      } catch (err: any) {
        console.error("Error loading employee details:", err);
        toast.error("Failed to load employee profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading("Saving your details...");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save details");

      toast.success("Important details updated successfully!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to save details", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  // Calculate profile completion percentage
  const filledFieldsCount = Object.values(formData).filter(v => v && String(v).trim().length > 0).length;
  const totalFields = Object.keys(formData).length;
  const completionPercentage = Math.round((filledFieldsCount / totalFields) * 100);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <Loader2 className="animate-spin text-indigo-500" size={44} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <Toaster position="top-right" />

      {/* Header Banner */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-purple-900/40 border border-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="relative">
                {userImageUrl ? (
                  <img src={userImageUrl} alt="Profile" className="w-20 h-20 rounded-2xl ring-4 ring-indigo-500/30 object-cover shadow-xl" />
                ) : (
                  <div className="w-20 h-20 bg-indigo-600/30 text-indigo-400 rounded-2xl flex items-center justify-center text-2xl font-black ring-4 ring-indigo-500/30">
                    {formData.name?.charAt(0) || "E"}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-lg text-[10px] font-black uppercase">
                  ACTIVE
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {formData.name || "Employee Profile"}
                  </h1>
                  <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <Sparkles size={14} /> My Details
                  </span>
                </div>
                <p className="text-slate-400 text-sm font-medium mt-1">{userEmail}</p>
              </div>
            </div>

            {/* Profile Completion Card */}
            <div className="w-full md:w-64 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs font-black mb-2">
                <span className="text-slate-400 uppercase tracking-wider">Completion</span>
                <span className="text-indigo-400">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500 rounded-full" 
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-semibold">
                {completionPercentage === 100 ? "🎉 All details completed!" : "Fill bank & KYC details for instant payouts."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-8">
        
        {/* Section 1: Personal & Work Info */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-800">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl">
              <User size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">1. Personal & Work Information</h3>
              <p className="text-xs text-slate-400 font-medium">Your primary contact and work details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Department</label>
              <input
                type="text"
                placeholder="e.g. Sales / Marketing / Tech"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Designation / Role</label>
              <input
                type="text"
                placeholder="e.g. Senior Business Development Executive"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Current Address</label>
              <textarea
                rows={2}
                placeholder="Enter complete residential address..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Emergency Contact */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-800">
            <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl">
              <HeartPulse size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">2. Emergency Contact Information</h3>
              <p className="text-xs text-slate-400 font-medium">Contact in case of health or emergency events</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Emergency Contact Name</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Sharma (Father / Spouse)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-bold"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Emergency Contact Phone</label>
              <input
                type="tel"
                placeholder="e.g. +91 9811223344"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-bold"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Bank & Salary Payout Details */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-800">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl">
              <CreditCard size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">3. Bank & Salary Payout Details</h3>
              <p className="text-xs text-slate-400 font-medium">Used for monthly salary, incentives, and expense reimbursements</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Account Holder Name</label>
              <input
                type="text"
                placeholder="Name as per bank account"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold"
                value={formData.accountHolderName}
                onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Bank Name</label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank / ICICI Bank"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Account Number</label>
              <input
                type="text"
                placeholder="e.g. 5010023456789"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold"
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">IFSC Code</label>
              <input
                type="text"
                placeholder="e.g. HDFC0001234"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold uppercase"
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">UPI ID (Optional for fast payouts)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. rahul@okaxis / 9876543210@paytm"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold"
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Government KYC Identification */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-800">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">4. Government KYC Identification</h3>
              <p className="text-xs text-slate-400 font-medium">Compliance and tax reporting details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">PAN Card Number</label>
              <input
                type="text"
                placeholder="e.g. ABCDE1234F"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-bold uppercase"
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Aadhaar Card Number</label>
              <input
                type="text"
                placeholder="e.g. 1234 5678 9012"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-bold"
                value={formData.aadhaarNumber}
                onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Submit Button Bar */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Saving Details...
              </>
            ) : (
              <>
                <Save size={18} />
                Save My Details
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
