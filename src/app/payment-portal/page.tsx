"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Link as LinkIcon, Copy, Check, Send, Loader2, IndianRupee, 
  User, Mail, Phone, FileText, Search, CreditCard, ArrowRight,
  ChevronDown, AlertCircle, Calculator, Wallet, Zap, Clock, UserCheck,
  ShieldCheck, Sparkles, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_SERVICES } from "@/constants/services";
import { toast } from "react-hot-toast";

const API_BASE_URL = "/api/cashfree";

const PaymentPortal = () => {
  const [mode, setMode] = useState("new");
  const [paymentType, setPaymentType] = useState("full");
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

  useEffect(() => {
    const service = ALL_SERVICES.find(s => s.name === formData.purpose);
    if (service) {
      setFormData(prev => ({ 
        ...prev, 
        totalServicePrice: service.price.toString(),
        amount: paymentType === "full" ? service.price.toString() : prev.amount
      }));
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
    if (mode === "history") fetchHistory();
  }, [mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "totalServicePrice") {
        setFormData(prev => ({ 
            ...prev, 
            totalServicePrice: value,
            amount: paymentType === "full" ? value : prev.amount 
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
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
    setLoading(true);
    setGeneratedLink(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/create-link`, {
        ...formData,
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
        toast.success(`Status updated to ${res.data.status}`);
        fetchHistory(); // Refresh list
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Sync failed");
    }
  };

  const remainingBalance = Math.max(0, (parseFloat(formData.totalServicePrice) || 0) - (parseFloat(formData.amount) || 0));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header section with glassmorphism */}
        <div className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                  <Wallet size={24} />
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Payment Portal</h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-md">
                Generate instant payment links, manage pending collections and track transaction history with ease.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => { setMode("new"); setUserFound(false); setGeneratedLink(null); }}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${mode === "new" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
              >
                New Link
              </button>
              <button
                onClick={() => { setMode("pending"); setGeneratedLink(null); }}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${mode === "pending" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
              >
                Pending
              </button>
              <button
                onClick={() => { setMode("history"); setGeneratedLink(null); }}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${mode === "history" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
              >
                History
              </button>
            </div>
          </div>
        </div>

        {/* Header section with glassmorphism */}

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form and Search */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Search for Pending */}
            {mode === "pending" && !userFound && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl flex gap-4 items-center"
              >
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Search size={20} />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lookup Client</label>
                  <input
                    type="text" placeholder="Mobile or Email Address..."
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none outline-none font-bold text-slate-900 dark:text-white placeholder:text-slate-300"
                  />
                </div>
                <button
                  onClick={handleSearch} disabled={searching}
                  className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  {searching ? <Loader2 size={16} className="animate-spin" /> : "Verify"}
                </button>
              </motion.div>
            )}

            {/* Main Form */}
            {(mode === "new" || userFound) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-8"
              >
                {userFound && mode === "pending" && (
                  <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl text-white flex items-center justify-between shadow-xl">
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 flex items-center gap-1.5"><ShieldCheck size={12}/> Profile Verified</div>
                      <h4 className="text-xl font-black">{formData.name}</h4>
                      <p className="text-xs text-white/80 font-bold">{formData.phone} • {formData.email}</p>
                    </div>
                    <button onClick={() => { setUserFound(false); setSearchQuery(""); }} className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
                      <ArrowRight size={20} className="rotate-180" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  
                  {/* Service Selection */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase text-slate-900 dark:text-slate-100 ml-1 flex items-center gap-2 tracking-widest">
                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" /> 1. Select Service Type
                    </label>
                    <div className="relative group">
                      <select
                        name="purpose" value={formData.purpose} onChange={handleChange} required
                        className="w-full pl-5 pr-12 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none appearance-none font-bold text-sm border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-500 transition-all shadow-inner"
                      >
                        <option value="">Choose a service...</option>
                        {ALL_SERVICES.map(s => (
                          <option key={s.id} value={s.name} className="dark:bg-slate-900">
                            {s.category} - {s.name} (₹{s.price})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    </div>
                  </div>

                  {/* Pricing Configuration */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border-2 border-slate-100 dark:border-slate-800 space-y-8 shadow-inner">
                    
                    {/* Valuation */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Valuation</label>
                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">Manual Override</span>
                      </div>
                      <div className="relative group">
                        <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input
                          type="number" name="totalServicePrice" value={formData.totalServicePrice} onChange={handleChange} required
                          className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 outline-none font-black text-3xl text-slate-900 dark:text-white transition-all shadow-lg shadow-slate-200/20 dark:shadow-none"
                        />
                      </div>
                    </div>

                    {/* Type Toggle */}
                    {mode === "new" && (
                      <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-200/50 dark:bg-slate-900/50 rounded-[1.25rem]">
                        <button
                          type="button" onClick={() => setPaymentType("full")}
                          className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${paymentType === "full" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-md scale-[1.02]" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                        >
                          Full Settlement
                        </button>
                        <button
                          type="button" onClick={() => setPaymentType("partial")}
                          className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${paymentType === "partial" ? "bg-white dark:bg-slate-700 text-amber-600 shadow-md scale-[1.02]" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                        >
                          Installment Plan
                        </button>
                      </div>
                    )}

                    {/* Billed Amount */}
                    <div className="space-y-3 relative">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Amount to Bill Now</label>
                        {paymentType === "partial" && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="text-right bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-2xl border border-amber-100 dark:border-amber-800"
                          >
                            <span className="text-[9px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest block">Balance Due Later</span>
                            <div className="text-xl font-black text-amber-600 dark:text-amber-500 flex items-center justify-end">
                              <IndianRupee size={18} className="mr-1" /> {remainingBalance}
                            </div>
                          </motion.div>
                        )}
                      </div>
                      <div className="relative group">
                        <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-400 group-focus-within:text-emerald-500 transition-colors" size={24} />
                        <input
                          type="number" name="amount" value={formData.amount} onChange={handleChange} readOnly={paymentType === "full"}
                          className={`w-full pl-14 pr-6 py-6 rounded-3xl font-black text-4xl border-2 transition-all ${paymentType === "full" ? "bg-slate-100/50 dark:bg-slate-900/50 border-transparent text-slate-400" : "bg-white dark:bg-slate-900 border-emerald-500/20 focus:border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-xl shadow-emerald-500/5"}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Client Details */}
                  {mode === "new" && (
                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase text-slate-900 dark:text-slate-100 ml-1 flex items-center gap-2 tracking-widest">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" /> 2. Customer Credentials
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-500 transition-all shadow-inner" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="9876543210" required className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-500 transition-all shadow-inner" />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="customer@example.com" required className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-500 transition-all shadow-inner" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit" disabled={loading}
                    className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-3xl text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-400/20 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 overflow-hidden relative"
                  >
                    {loading ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <>
                        <CreditCard size={20} /> 
                        <span>Generate Payment URL</span>
                        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </div>

          {/* Right Column: Link Result and Stats */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Link Generation Result */}
            <AnimatePresence mode="wait">
              {generatedLink ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[3rem] p-8 text-white space-y-8 shadow-2xl shadow-emerald-500/40 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Check size={120} />
                  </div>
                  
                  <div className="flex flex-col items-center text-center gap-4 relative z-10">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-2xl rounded-[2rem] flex items-center justify-center border border-white/30 shadow-2xl">
                      <Check size={40} className="text-white" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-3xl font-black tracking-tight leading-none">Link Ready!</h4>
                      <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.3em] mt-3">Total Amount: ₹{formData.amount}</p>
                    </div>
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div className="bg-black/20 backdrop-blur-md p-5 rounded-[1.5rem] border border-white/10">
                      <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-2">Sharable Payment URL</p>
                      <p className="font-mono text-xs break-all line-clamp-2 opacity-90 select-all">{generatedLink}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => { 
                          navigator.clipboard.writeText(generatedLink); 
                          setCopied(true); 
                          setTimeout(() => setCopied(false), 2000);
                          toast.success("Copied to clipboard");
                        }} 
                        className="flex items-center justify-center gap-2 py-4 bg-white text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-50 transition-colors"
                      > 
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? "Copied!" : "Copy URL"} 
                      </button>
                      <button 
                        onClick={() => {
                          const waMessage = `Hi ${formData.name},\n\nPlease find the payment link for *${formData.purpose}* below:\n\n💰 *Amount:* ₹${formData.amount}\n\n🔗 *Payment Link:* ${generatedLink}\n\nThank you for choosing MagicScale!\n\nRegards,\nMagicScale Team\nwww.magicscale.in`;
                          window.open(`https://wa.me/${formData.phone.startsWith('91') ? formData.phone : '91' + formData.phone}?text=${encodeURIComponent(waMessage)}`, '_blank');
                        }} 
                        className="flex items-center justify-center gap-2 py-4 bg-black/20 hover:bg-black/30 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/10"
                      > 
                        <Send size={16} /> WhatsApp 
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => setGeneratedLink(null)} 
                      className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-center text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Create Another Link
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <Sparkles size={32} />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-black text-slate-900 dark:text-white">Ready for Generation</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Fill in the client and service details to generate a professional payment request link.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Stats / Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100 dark:shadow-none space-y-4">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Zap size={20} />
                </div>
                <div className="space-y-1">
                  <h6 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Instant Settlement</h6>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Payments are settled directly to the primary account within minutes of successful transaction.</p>
                </div>
              </div>
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100 dark:shadow-none space-y-4">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div className="space-y-1">
                  <h6 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Secure Protocol</h6>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">All links are encrypted and use Cashfree's enterprise-grade security for fraud prevention.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History Section (Full Width) */}
        {mode === "history" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tighter">
                <Clock size={20} className="text-indigo-600" /> Transaction Logs
              </h3>
              <button onClick={fetchHistory} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <Zap size={16} className={fetchingHistory ? "animate-spin" : ""} />
              </button>
            </div>

            {fetchingHistory ? (
              <div className="py-32 flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing with Cashfree...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Customer Details</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Service Item</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Collection</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Live Status</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {history.length > 0 ? (
                      history.map((link) => (
                        <tr key={link._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 transition-colors">{link.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold tracking-tight">{link.email} • {link.phone}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">{link.plan}</span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 dark:text-white text-sm">₹{link.amount}</span>
                              {link.totalAmount > link.amount && (
                                <span className="text-[9px] text-amber-500 font-black uppercase">Balance: ₹{link.totalAmount - link.amount}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] shadow-sm ${link.status === "paid" ? "bg-emerald-100 text-emerald-600 border border-emerald-200" : "bg-amber-100 text-amber-600 border border-amber-200"}`}>
                              {link.status}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              {link.status === "pending" && (
                                <button 
                                  onClick={() => handleSyncStatus(link.orderId)}
                                  className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800"
                                  title="Sync Status"
                                >
                                  <Zap size={16} />
                                </button>
                              )}
                              {link.paymentLink && (
                                <button 
                                  onClick={() => { 
                                    navigator.clipboard.writeText(link.paymentLink); 
                                    toast.success("Link copied!");
                                  }}
                                  className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-700"
                                  title="Copy Payment Link"
                                >
                                  <Copy size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-32 text-center">
                          <div className="flex flex-col items-center gap-3 opacity-30">
                            <FileText size={48} />
                            <p className="font-black text-xs uppercase tracking-widest">No transaction history found</p>
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
    </div>
  );
};

export default PaymentPortal;
