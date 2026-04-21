"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  MapPin, 
  Globe, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Save, 
  Image as ImageIcon,
  Loader2,
  ChevronLeft,
  Banknote,
  FileText,
  CreditCard
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function BusinessSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    gstin: "",
    phone: "",
    email: "",
    website: "",
    logo: "",
    bankName: "",
    bankBranch: "",
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    terms: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings/business");
      const data = await res.json();
      if (data && !data.error) {
        setFormData({
          name: data.name || "",
          address: data.address || "",
          gstin: data.gstin || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          logo: data.logo || "",
          bankName: data.bankName || "",
          bankBranch: data.bankBranch || "",
          accountName: data.accountName || "",
          accountNumber: data.accountNumber || "",
          ifscCode: data.ifscCode || "",
          terms: data.terms || ""
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success("Business details saved successfully!");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white text-sm font-medium text-slate-700 placeholder:text-slate-400";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest mb-8 transition-colors group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
          {/* Header */}
          <div className="px-10 py-12 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50/50">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200 ring-8 ring-indigo-50">
                <Building2 size={36} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Business Setup</h1>
                <p className="text-slate-400 font-medium mt-1">Configure your corporate and banking identity for invoices</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-12">
            
            {/* 🏢 Section 1: Core Identity */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <Building2 size={18} className="text-indigo-500" />
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Business Identity</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className={labelClass}>🏢 Registered Business Name</label>
                  <input
                    className={inputClass}
                    placeholder="Enter Business Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>🆔 GSTIN / Registration Number</label>
                  <input
                    className={inputClass}
                    placeholder="Enter GSTIN"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelClass}>📞 Business Phone</label>
                  <input
                    className={inputClass}
                    placeholder="Enter Contact Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelClass}>📧 Business Email</label>
                  <input
                    className={inputClass}
                    type="email"
                    placeholder="Enter Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelClass}>🌐 Website URL</label>
                  <input
                    className={inputClass}
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>📍 Office Address</label>
                  <textarea
                    className={`${inputClass} h-32 resize-none pt-4`}
                    placeholder="Enter Full Business Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>🖼️ Logo URL</label>
                  <input
                    className={inputClass}
                    placeholder="Paste Cloudinary/Image URL"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  />
                  {formData.logo && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center">
                      <img src={formData.logo} alt="Logo Preview" className="h-16 object-contain" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 🏦 Section 2: Banking Details */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <Banknote size={18} className="text-emerald-500" />
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Banking Details</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-emerald-50/20 p-8 rounded-[2.5rem] border border-emerald-100/50">
                <div>
                  <label className={labelClass}>🏦 Bank Name</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. Yes Bank"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelClass}>📍 Branch Name</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. Rajokari Branch"
                    value={formData.bankBranch}
                    onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>👤 Account Holder Name</label>
                  <input
                    className={inputClass}
                    placeholder="Name as per Bank Records"
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelClass}>🔢 Account Number</label>
                  <input
                    className={inputClass}
                    placeholder="Enter Account Number"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelClass}>🏛️ IFSC Code</label>
                  <input
                    className={inputClass}
                    placeholder="Enter 11-digit IFSC"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* 📄 Section 3: Terms & Conditions */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <FileText size={18} className="text-amber-500" />
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Terms & Conditions</h2>
              </div>
              
              <div>
                <label className={labelClass}>📝 Invoice Terms</label>
                <textarea
                  className={`${inputClass} h-48 resize-none pt-4 font-mono text-xs leading-relaxed`}
                  placeholder="Enter your standard terms and conditions here..."
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                />
                <p className="mt-3 text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-1">
                  These will appear at the bottom of every generated invoice.
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-10 flex justify-end items-center gap-6 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                Secure Corporate Vault
              </p>
              <button
                type="submit"
                disabled={saving}
                className="bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-200 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-3"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {saving ? "Deploying Details..." : "Commit Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
