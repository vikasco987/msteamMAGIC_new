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
  ChevronLeft
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
    logo: ""
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
          logo: data.logo || ""
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
      <div className="max-w-4xl mx-auto">
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
                <p className="text-slate-400 font-medium mt-1">Configure your corporate identity for invoices and reports</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-10">
            {/* Identity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className={labelClass}>🏢 Registered Business Name</label>
                <div className="relative group">
                  <input
                    className={inputClass}
                    placeholder="Enter Business Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Building2 size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                </div>
              </div>

              <div>
                <label className={labelClass}>🆔 GSTIN / Registration Number</label>
                <div className="relative group">
                  <input
                    className={inputClass}
                    placeholder="Enter GSTIN"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  />
                  <ShieldCheck size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                </div>
              </div>

              <div>
                <label className={labelClass}>📞 Business Phone</label>
                <div className="relative group">
                  <input
                    className={inputClass}
                    placeholder="Enter Contact Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  <Phone size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                </div>
              </div>

              <div>
                <label className={labelClass}>📧 Business Email</label>
                <div className="relative group">
                  <input
                    className={inputClass}
                    type="email"
                    placeholder="Enter Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <Mail size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                </div>
              </div>

              <div>
                <label className={labelClass}>🌐 Website URL</label>
                <div className="relative group">
                  <input
                    className={inputClass}
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                  <Globe size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>📍 Office Address</label>
                <div className="relative group">
                  <textarea
                    className={`${inputClass} h-32 resize-none pt-4`}
                    placeholder="Enter Full Business Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                  <MapPin size={18} className="absolute right-5 top-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>🖼️ Logo URL</label>
                <div className="relative group">
                  <input
                    className={inputClass}
                    placeholder="Paste Cloudinary/Image URL"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  />
                  <ImageIcon size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                {formData.logo && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center">
                    <img src={formData.logo} alt="Logo Preview" className="h-16 object-contain grayscale hover:grayscale-0 transition-all duration-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-10 flex justify-end items-center gap-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                Your data is stored securely
              </p>
              <button
                type="submit"
                disabled={saving}
                className="bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-200 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-3"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                {saving ? "Deploying Details..." : "Commit Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
