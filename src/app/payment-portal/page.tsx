"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Link as LinkIcon, Copy, Check, Send, Loader2, IndianRupee, 
  User, Mail, Phone, FileText, Search, CreditCard, ArrowRight,
  ChevronDown, AlertCircle, Calculator, Wallet, Zap, Clock, UserCheck,
  ShieldCheck, Sparkles, Settings, ChevronRight, LayoutGrid, Filter,
  ExternalLink, Trash2, Smartphone, BarChart3
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_SERVICES } from "@/constants/services";
import { toast } from "react-hot-toast";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { QRCodeCanvas } from "qrcode.react";

const API_BASE_URL = "/api/cashfree";

const PaymentPortal = () => {
  const { isLoaded, user: currentUser } = useUser();
  const [mode, setMode] = useState("new"); // new, pending, history
  const [paymentType, setPaymentType] = useState("full"); // full, partial
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", amount: "", purpose: "", totalServicePrice: "" 
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userFound, setUserFound] = useState(false);
  const [hasAnalyticsAccess, setHasAnalyticsAccess] = useState(false);

  const userRole = String(currentUser?.publicMetadata?.role || "user").toLowerCase();

  useEffect(() => {
    if (isLoaded && userRole) {
      // Fetch dynamic permissions for this role
      fetch(`/api/admin/sidebar/per-role?role=${userRole}`)
        .then(res => res.json())
        .then(data => {
          if (data.sidebarItems && data.sidebarItems.includes('Payment Analytics')) {
            setHasAnalyticsAccess(true);
          }
        })
        .catch(err => console.error("Permission fetch error:", err));
    }
  }, [isLoaded, userRole]);

  useEffect(() => {
    const service = ALL_SERVICES.find(s => s.name === formData.purpose);
    if (service) {
      const price = service.price;
      setFormData(prev => ({ 
        ...prev, 
        totalServicePrice: price.toString(),
        amount: paymentType === "full" ? price.toString() : (price / 2).toString()
      }));
    } else if (formData.totalServicePrice) {
      // Handle custom amount toggle
      const price = parseFloat(formData.totalServicePrice);
      if (!isNaN(price)) {
        setFormData(prev => ({
          ...prev,
          amount: paymentType === "full" ? price.toString() : (price / 2).toString()
        }));
      }
    }
  }, [formData.purpose, paymentType]);

  const fetchHistory = async () => {
    setFetchingHistory(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/get-all-links`);
      if (res.data.success) setHistory(res.data.links);
    } catch (err: any) { 
      console.error(err); 
      toast.error(err.response?.data?.message || "Failed to fetch history");
    } finally { setFetchingHistory(false); }
  };

  useEffect(() => {
    if (mode === "history") {
      fetchHistory();
    }
  }, [mode]);

  // Auto-sync pending links when history loads
  useEffect(() => {
    if (history.length > 0) {
      const pendingLinks = history.filter(h => h.status?.toLowerCase() === "pending").slice(0, 5);
      if (pendingLinks.length > 0) {
        pendingLinks.forEach(link => handleSyncStatus(link.orderId));
      }
    }
  }, [history.length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "totalServicePrice") {
        setFormData(prev => ({ ...prev, totalServicePrice: value, amount: paymentType === "full" ? value : prev.amount }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return toast.error("Enter mobile or email");
    setSearching(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/user-details?identifier=${searchQuery}`);
      if (res.data.success && res.data.user) {
        setFormData({
          name: res.data.user.name || "", 
          email: res.data.user.email || "", 
          phone: res.data.user.phone || "", 
          amount: res.data.pendingBalance?.toString() || "", 
          purpose: res.data.lastPayment?.plan || "", 
          totalServicePrice: res.data.lastPayment?.totalAmount?.toString() || res.data.lastPayment?.amount?.toString() || ""
        });
        setUserFound(true);
        toast.success("Customer found!");
      } else {
        toast.error("Customer not found.");
      }
    } catch (err: any) { 
        console.error(err); 
        toast.error(err.response?.data?.message || "Search failed");
    } finally { setSearching(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !currentUser) {
      toast.error("User data not loaded. Please wait.");
      return;
    }

    if (formData.phone.replace(/[^0-9]/g, "").length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    setLoading(true);
    setGeneratedLink(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/create-link`, {
        ...formData,
        createdBy: currentUser.fullName || currentUser.username || currentUser.emailAddresses[0]?.emailAddress || "CRM User",
        creatorId: currentUser.id,
        purpose: mode === "pending" ? `Balance: ${formData.purpose}` : (paymentType === "partial" ? `Partial: ${formData.purpose}` : formData.purpose)
      });
      if (res.data.success) {
        setGeneratedLink(res.data.link_url);
        toast.success("Payment link generated!");
      }
    } catch (err: any) { 
      const errorMsg = err.response?.data?.message || err.message || "Failed to generate link.";
      toast.error(`Payment Error: ${errorMsg}`); 
    } finally { setLoading(false); }
  };

  const handleSyncStatus = async (orderId: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/check-status?order_id=${orderId}`);
      if (res.data.success) {
        fetchHistory();
      }
    } catch (err: any) {
      console.error("Sync failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] selection:bg-indigo-500 selection:text-white pb-20">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/20 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 relative z-10">
        
        {/* Modern Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800 group hover:scale-110 transition-transform duration-500">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <IndianRupee size={22} className="group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">Payment Portal</h1>
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Generate & track secure payment links via Cashfree</p>
                {hasAnalyticsAccess && (
                  <>
                    <span className="text-slate-300">•</span>
                    <Link 
                      href="/payment-portal/analytics"
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1.5"
                    >
                      <BarChart3 size={12} /> View User Analytics
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sleek Mode Switcher */}
          <div className="bg-white dark:bg-slate-900 p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 flex gap-1 shadow-xl">
            {['new', 'pending', 'history'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setUserFound(false); setGeneratedLink(null); }}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden ${
                  mode === m ? 'text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                {mode === m && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-lg shadow-indigo-500/20" 
                  />
                )}
                <span className="relative z-10">{m.replace('-', ' ')}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={`grid grid-cols-1 ${generatedLink ? 'lg:grid-cols-12' : 'max-w-5xl mx-auto'} gap-8 items-start`}>
          
          {/* Main Action Column */}
          <div className={`${generatedLink ? 'lg:col-span-7' : 'w-full'} space-y-8`}>
            
            <AnimatePresence mode="wait">
              {/* Search Container */}
              {mode === "pending" && !userFound && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600">
                        <UserCheck size={24} />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Lookup Client</h3>
                    </div>
                    
                    <div className="relative">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input
                        type="text" 
                        placeholder="Enter Mobile or Email Address..."
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-16 pr-8 py-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-lg text-slate-900 dark:text-white transition-all shadow-inner"
                      />
                    </div>

                    <button
                      onClick={handleSearch} 
                      disabled={searching}
                      className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-[0.3em] rounded-3xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                      {searching ? <Loader2 size={20} className="animate-spin" /> : "Verify Customer Details"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Form Container */}
              {(mode === "new" || userFound) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-10"
                >
                  {userFound && mode === "pending" && (
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] text-white flex items-center justify-between shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full" />
                      <div className="relative z-10 space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 flex items-center gap-2">
                          <ShieldCheck size={14} /> Profile Verified
                        </div>
                        <h4 className="text-3xl font-black tracking-tight">{formData.name}</h4>
                        <p className="text-sm text-white/80 font-bold">{formData.phone} • {formData.email}</p>
                      </div>
                      <button 
                        onClick={() => { setUserFound(false); setSearchQuery(""); }} 
                        className="p-4 bg-white/20 rounded-2xl hover:bg-white/30 transition-all active:scale-90"
                      >
                        <ArrowRight size={24} className="rotate-180" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-12">
                    {/* Section 1: Service Details */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 font-black text-xs">1</div>
                        <h5 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[11px]">Select Service Type</h5>
                      </div>
                      
                      <div className="relative">
                        <select
                          name="purpose"
                          value={formData.purpose}
                          onChange={handleChange}
                          required
                          className="w-full px-8 py-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-slate-900 dark:text-white appearance-none transition-all shadow-inner"
                        >
                          <option value="">Choose a service...</option>
                          {ALL_SERVICES.map((s, idx) => (
                            <option key={idx} value={s.name}>{s.name} (₹{s.price})</option>
                          ))}
                          <option value="Custom Service">Custom Service</option>
                        </select>
                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                          <div className="flex justify-between items-center mb-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Valuation</label>
                            <span className="text-[9px] font-black px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 rounded-md">Manual Override</span>
                          </div>
                          <div className="relative">
                            <IndianRupee className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            <input 
                              type="number" name="totalServicePrice" value={formData.totalServicePrice} 
                              onChange={handleChange} placeholder="0.00" required 
                              className="w-full pl-8 bg-transparent outline-none font-black text-2xl text-slate-900 dark:text-white" 
                            />
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Payment Structure</label>
                          <div className="grid grid-cols-2 gap-2 bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-inner">
                            <button
                              type="button" onClick={() => setPaymentType("full")}
                              className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentType === "full" ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400'}`}
                            >
                              Full Settlement
                            </button>
                            <button
                              type="button" onClick={() => setPaymentType("partial")}
                              className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentType === "partial" ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400'}`}
                            >
                              Installment Plan
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-900/30">
                        <label className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] block mb-4">Amount to Bill Now</label>
                        <div className="relative">
                          <IndianRupee className="absolute left-0 top-1/2 -translate-y-1/2 text-emerald-300" size={28} />
                          <input 
                            type="number" name="amount" value={formData.amount} 
                            onChange={handleChange} placeholder="0.00" required 
                            className="w-full pl-10 bg-transparent outline-none font-black text-4xl text-emerald-600 dark:text-emerald-400" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Customer Credentials */}
                    {mode === "new" && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 font-black text-xs">2</div>
                          <h5 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[11px]">Customer Credentials</h5>
                        </div>
                        
                        <div className="relative">
                          <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                          <input 
                            type="text" name="name" value={formData.name} 
                            onChange={handleChange} placeholder="Full Name" required 
                            className="w-full pl-16 pr-8 py-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-slate-900 dark:text-white transition-all shadow-inner" 
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="relative">
                            <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="tel" name="phone" value={formData.phone} 
                              onChange={handleChange} placeholder="9876543210" required 
                              className="w-full pl-16 pr-8 py-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-slate-900 dark:text-white transition-all shadow-inner" 
                            />
                          </div>
                          <div className="relative">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="email" name="email" value={formData.email} 
                              onChange={handleChange} placeholder="customer@example.com" required 
                              className="w-full pl-16 pr-8 py-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-slate-900 dark:text-white transition-all shadow-inner" 
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit" 
                      disabled={loading}
                      className="w-full py-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-[2.5rem] text-sm uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-4 group"
                    >
                      {loading ? (
                        <Loader2 size={24} className="animate-spin" />
                      ) : (
                        <>
                          <CreditCard size={20} className="group-hover:rotate-12 transition-transform" /> 
                          <span>Authorize & Generate Payment URL</span>
                          <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Result Column */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {generatedLink ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="bg-gradient-to-br from-indigo-600 to-violet-800 rounded-[3.5rem] p-12 text-white space-y-10 shadow-[0_35px_60px_-15px_rgba(79,70,229,0.4)] relative overflow-hidden h-fit"
                >
                  <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/10 blur-[80px] rounded-full" />
                  
                  <div className="flex flex-col items-center text-center gap-6 relative z-10">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-2xl rounded-[2.5rem] flex items-center justify-center border border-white/30 shadow-2xl animate-bounce-slow">
                      <Check size={48} className="text-white" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-4xl font-black tracking-tight leading-none">Order Secure!</h4>
                      <div className="text-[10px] font-black bg-white/20 px-4 py-1 rounded-full uppercase tracking-[0.2em] mt-4">Payable: ₹{formData.amount}</div>
                    </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div className="bg-black/20 backdrop-blur-md p-6 rounded-[2rem] border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em]">Secure Checkout Link</p>
                        <Sparkles size={14} className="text-white/40" />
                      </div>
                      <p className="font-mono text-xs break-all line-clamp-2 opacity-90 select-all leading-relaxed">{generatedLink}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <button 
                        onClick={() => { 
                          navigator.clipboard.writeText(generatedLink); 
                          setCopied(true); 
                          setTimeout(() => setCopied(false), 2000);
                          toast.success("Link Secured!");
                        }} 
                        className="flex items-center justify-center gap-3 py-6 bg-white text-indigo-600 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-50 transition-all active:scale-95"
                      > 
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? "Copied!" : "Copy Payment Link"} 
                      </button>
                      
                      <button 
                        onClick={() => {
                          const waMessage = `Hi ${formData.name},\n\nPlease find the secure payment link for *${formData.purpose}* below:\n\n💰 *Amount:* ₹${formData.amount}\n\n🔗 *Payment Link:* ${generatedLink}\n\nThank you for choosing MagicScale!\n\nRegards,\nMagicScale Team`;
                          window.open(`https://wa.me/${formData.phone.startsWith('91') ? formData.phone : '91' + formData.phone}?text=${encodeURIComponent(waMessage)}`, '_blank');
                        }} 
                        className="flex items-center justify-center gap-3 py-6 bg-black/20 hover:bg-black/40 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all border border-white/10 active:scale-95"
                      > 
                        <Smartphone size={18} /> Send to WhatsApp 
                      </button>
                    </div>

                    {/* QR Code Section */}
                    <div className="flex flex-col items-center gap-4 py-6 bg-white/10 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                      <div className="bg-white p-4 rounded-3xl shadow-2xl">
                        <QRCodeCanvas 
                          id="payment-qr"
                          value={generatedLink} 
                          size={160}
                          level="H"
                          includeMargin={false}
                          imageSettings={{
                            src: "/logo.png", // Attempt to use local logo if exists
                            x: undefined,
                            y: undefined,
                            height: 30,
                            width: 30,
                            excavate: true,
                          }}
                        />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Scan to Pay</p>
                        <button 
                          onClick={() => {
                            const canvas = document.getElementById("payment-qr") as HTMLCanvasElement;
                            if (canvas) {
                              const url = canvas.toDataURL("image/png");
                              const link = document.createElement("a");
                              link.download = `QR_${formData.name}_${formData.amount}.png`;
                              link.href = url;
                              link.click();
                              toast.success("QR Code Saved!");
                            }
                          }}
                          className="text-[9px] font-black text-indigo-300 hover:text-white uppercase tracking-widest underline underline-offset-4 transition-colors"
                        >
                          Download QR Image
                        </button>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setGeneratedLink(null)} 
                      className="w-full py-4 text-center text-[10px] font-black uppercase tracking-[0.3em] opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                    >
                      <LayoutGrid size={12} /> New Generation
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {/* Full-Width History Section */}
        {mode === "history" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden"
          >
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Audit Logs</h3>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">Transaction Ledger</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Link 
                  href="/payment-portal/history"
                  className="px-8 py-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 font-black text-[10px] uppercase tracking-[0.25em] rounded-2xl border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-600 hover:text-white hover:shadow-xl hover:shadow-indigo-500/20 transition-all flex items-center gap-3"
                >
                  Pro Analytics <ExternalLink size={14} />
                </Link>
                <button 
                  onClick={fetchHistory} 
                  className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all group"
                >
                  <Zap size={18} className={fetchingHistory ? "animate-spin" : "group-hover:rotate-12"} />
                </button>
              </div>
            </div>

            {fetchingHistory ? (
              <div className="py-40 flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-indigo-100 dark:border-indigo-900 rounded-full" />
                  <div className="w-20 h-20 border-t-4 border-indigo-600 rounded-full absolute top-0 animate-spin" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Syncing with Cashfree Node</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                      <th className="px-10 py-6 text-left">Generation Info</th>
                      <th className="px-8 py-6 text-left">Customer Credentials</th>
                      <th className="px-8 py-6 text-left">Purpose / Service</th>
                      <th className="px-8 py-6 text-left">Payment Breakup</th>
                      <th className="px-8 py-6 text-left">Live Status</th>
                      <th className="px-10 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {history.length > 0 ? (
                      history.map((link, idx) => (
                        <motion.tr 
                          key={link.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                        >
                          <td className="px-10 py-8">
                            <div className="flex flex-col gap-1.5">
                              <span className="font-black text-slate-900 dark:text-white text-xs">{format(new Date(link.createdAt), "dd MMM yyyy")}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{format(new Date(link.createdAt), "hh:mm a")}</span>
                              <div className="flex items-center gap-1.5 mt-2">
                                <div className="w-5 h-5 bg-indigo-50 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600">
                                  <User size={10} />
                                </div>
                                <span className="text-[9px] text-indigo-600 font-black uppercase tracking-widest">BY: {link.createdBy || "Admin"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-8">
                            <div className="flex flex-col gap-1">
                              <span className="font-black text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 transition-colors">{link.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold tracking-tight">{link.email}</span>
                              <span className="text-[10px] text-slate-400 font-bold tracking-tight">{link.phone}</span>
                            </div>
                          </td>
                          <td className="px-8 py-8">
                            <span className="inline-block text-[9px] font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl uppercase tracking-widest leading-relaxed max-w-[200px] border border-slate-200/50 dark:border-slate-700/50">
                              {link.purpose}
                            </span>
                          </td>
                          <td className="px-8 py-8">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 dark:text-white text-lg">₹{link.amount}</span>
                              {link.totalAmount > link.amount && (
                                <div className="flex flex-col mt-1">
                                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter line-through opacity-50">Total: ₹{link.totalAmount}</span>
                                  <span className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Due: ₹{link.totalAmount - link.amount}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-8">
                            <div className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm border w-fit flex items-center gap-2.5 ${
                              link.status?.toLowerCase() === "paid" ? "bg-emerald-100/50 text-emerald-600 border-emerald-200/50" : 
                              link.status?.toLowerCase() === "pending" ? "bg-amber-100/50 text-amber-600 border-amber-200/50" : 
                              "bg-rose-100/50 text-rose-600 border-rose-200/50"
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${link.status?.toLowerCase() === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              {link.status}
                            </div>
                          </td>
                          <td className="px-10 py-8 text-right">
                            <div className="flex items-center justify-end gap-3">
                              {link.status?.toLowerCase() === "pending" && (
                                <button 
                                  onClick={() => handleSyncStatus(link.orderId)}
                                  className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 dark:border-indigo-800"
                                  title="Sync Status"
                                >
                                  <Zap size={16} />
                                </button>
                              )}
                              <button 
                                onClick={() => { 
                                  navigator.clipboard.writeText(link.paymentLink); 
                                  toast.success("Link Copied!");
                                }}
                                className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-2xl transition-all shadow-sm border border-slate-100 dark:border-slate-700"
                                title="Copy Link"
                              >
                                <Copy size={16} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-40 text-center">
                          <div className="flex flex-col items-center gap-4 opacity-10">
                            <LayoutGrid size={80} />
                            <p className="font-black text-xs uppercase tracking-[0.5em]">Ledger Empty</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

      </div>
      
      {/* Global Toast Shadow Fix */}
      <style jsx global>{`
        .animate-bounce-slow {
          animation: bounce 3s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
          50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
        }
      `}</style>
    </div>
  );
};

export default PaymentPortal;
