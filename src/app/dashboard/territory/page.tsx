"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { 
  Search, MapPin, Building2, Download, Copy, Users, Activity, 
  Map, Target, ShieldCheck, XCircle, CheckCircle2, FileText, Lock
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function TerritoryDashboard() {
  const { user: currentUser, isLoaded } = useUser();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const currentUserRole = String(currentUser?.publicMetadata?.role || 'user').toLowerCase();
  
  // Allow ADMIN, MASTER, SELLER
  const hasAccess = ["admin", "master", "seller"].includes(currentUserRole);

  useEffect(() => {
    if (isLoaded && hasAccess) {
      fetchCustomers();
    } else if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded, currentUserRole]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.customers || []);
      } else {
        toast.error(data.error || "Failed to load customers");
      }
    } catch (error) {
      toast.error("Error loading territory data");
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const query = searchQuery.toLowerCase();
    
    return customers.filter(c => {
      const matchBasic = 
        (c.restaurantName && c.restaurantName.toLowerCase().includes(query)) ||
        (c.ownerName && c.ownerName.toLowerCase().includes(query)) ||
        (c.phone && c.phone.toLowerCase().includes(query)) ||
        (c.state && c.state.toLowerCase().includes(query)) ||
        (c.city && c.city.toLowerCase().includes(query)) ||
        (c.area && c.area.toLowerCase().includes(query)) ||
        (c.pincode && c.pincode.toLowerCase().includes(query));
      
      const matchServices = c.services.some((s: any) => 
        (s.title && s.title.toLowerCase().includes(query)) ||
        (s.type && s.type.toLowerCase().includes(query))
      );

      return matchBasic || matchServices;
    });
  }, [customers, searchQuery]);

  // Derived Statistics
  const stats = useMemo(() => {
    const active = filteredCustomers.filter(c => c.status === "Active").length;
    const states = new Set(filteredCustomers.map(c => c.state).filter(Boolean));
    const cities = new Set(filteredCustomers.map(c => c.city).filter(Boolean));
    
    let zomatoCount = 0;
    let swiggyCount = 0;
    let metaAdsCount = 0;
    let billingCount = 0;
    
    filteredCustomers.forEach(c => {
      const srvStrings = c.services.map((s: any) => (s.title + " " + s.type).toLowerCase());
      if (srvStrings.some((s: string) => s.includes("zomato"))) zomatoCount++;
      if (srvStrings.some((s: string) => s.includes("swiggy"))) swiggyCount++;
      if (srvStrings.some((s: string) => s.includes("meta") || s.includes("ads") || s.includes("facebook"))) metaAdsCount++;
      if (srvStrings.some((s: string) => s.includes("bill") || s.includes("software") || s.includes("pos"))) billingCount++;
    });

    return {
      total: filteredCustomers.length,
      active,
      inactive: filteredCustomers.length - active,
      states: states.size,
      cities: cities.size,
      zomato: zomatoCount,
      swiggy: swiggyCount,
      metaAds: metaAdsCount,
      billing: billingCount
    };
  }, [filteredCustomers]);

  const handleExportCSV = () => {
    const headers = ["Restaurant Name", "Owner", "Phone", "Email", "State", "City", "Area", "PIN Code", "Services", "Status"];
    const rows = filteredCustomers.map(c => [
      `"${c.restaurantName || ''}"`,
      `"${c.ownerName || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.email || ''}"`,
      `"${c.state || ''}"`,
      `"${c.city || ''}"`,
      `"${c.area || ''}"`,
      `"${c.pincode || ''}"`,
      `"${c.services.map((s: any) => s.title).join(', ')}"`,
      `"${c.status || ''}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Territory_Export_${format(new Date(), 'dd_MMM_yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyPhones = () => {
    const phones = filteredCustomers.map(c => c.phone).filter(Boolean).join("\n");
    navigator.clipboard.writeText(phones);
    toast.success(`${filteredCustomers.length} phone numbers copied!`);
  };

  // Helper for Badges
  const getServiceBadge = (serviceStr: string) => {
    const s = serviceStr.toLowerCase();
    if (s.includes("zomato")) return <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-100 px-2 py-0.5 rounded-md border border-red-200">🔴 Zomato</span>;
    if (s.includes("swiggy")) return <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-100 px-2 py-0.5 rounded-md border border-orange-200">🟠 Swiggy</span>;
    if (s.includes("meta") || s.includes("ads") || s.includes("facebook")) return <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">🟣 Meta Ads</span>;
    if (s.includes("bill") || s.includes("pos") || s.includes("software")) return <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200">🔵 Billing</span>;
    if (s.includes("fssai")) return <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-100 px-2 py-0.5 rounded-md border border-green-200">🟢 FSSAI</span>;
    
    // Default badge
    return <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">⚪ {serviceStr.substring(0, 15)}{serviceStr.length > 15 ? '...' : ''}</span>;
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-red-100">
          <Lock size={40} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-2">ACCESS REJECTED</h1>
        <p className="text-slate-500 max-w-md font-bold">This area is reserved for authorized team members.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-10 max-w-[1400px]">
      
      {/* Detail Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-[32px] shadow-2xl flex flex-col md:flex-row"
            >
              {/* Left Column: Info */}
              <div className="w-full md:w-1/3 bg-slate-50 p-8 border-r border-slate-200">
                <div className="flex items-center gap-3 text-indigo-600 mb-6">
                  <Building2 size={24} />
                  <h2 className="text-xl font-black uppercase tracking-wide">Client Details</h2>
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-1">{selectedCustomer.restaurantName}</h3>
                <p className="text-sm font-bold text-slate-500 mb-6">{selectedCustomer.ownerName}</p>

                <div className="space-y-4 mb-8">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
                    <p className="font-bold text-slate-800">{selectedCustomer.phone}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</label>
                    <p className="font-bold text-slate-800">{[selectedCustomer.area, selectedCustomer.city, selectedCustomer.state].filter(Boolean).join(", ")}</p>
                    {selectedCustomer.pincode && <p className="text-xs text-slate-500 font-medium">PIN: {selectedCustomer.pincode}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Manager(s)</label>
                    <p className="font-bold text-slate-800">{selectedCustomer.accountManagers || "Unassigned"}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Since</label>
                    <p className="font-bold text-slate-800">{format(new Date(selectedCustomer.createdAt), 'dd MMM yyyy')}</p>
                  </div>
                </div>

                <button onClick={() => setSelectedCustomer(null)} className="w-full py-3 rounded-xl bg-slate-200 text-slate-700 text-sm font-black hover:bg-slate-300 transition-all">
                  Close
                </button>
              </div>

              {/* Right Column: Timeline */}
              <div className="w-full md:w-2/3 p-8">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Activity size={20} className="text-indigo-500" /> Service Timeline
                </h3>

                <div className="relative border-l-2 border-slate-100 ml-3 pl-6 space-y-8">
                  {selectedCustomer.services
                    .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((srv: any, idx: number) => (
                    <div key={srv.id} className="relative">
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-white bg-indigo-500 shadow-sm" />
                      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">
                              {format(new Date(srv.createdAt), 'dd MMM yyyy')}
                            </span>
                            <h4 className="font-bold text-slate-900">{srv.title}</h4>
                          </div>
                          {getServiceBadge(srv.title || srv.type)}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                            srv.status === 'done' ? 'bg-emerald-100 text-emerald-700' : 
                            srv.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 
                            'bg-slate-100 text-slate-700'
                          }`}>
                            Status: {srv.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {selectedCustomer.services.length === 0 && (
                    <p className="text-sm text-slate-500 font-medium">No service history found.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 text-indigo-600 mb-2">
            <MapPin size={28} className="drop-shadow-sm" />
            <span className="text-sm font-black uppercase tracking-[0.3em] opacity-80">Territory Control</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
            Client <span className="text-indigo-600">Locator</span>
          </h1>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={handleCopyPhones} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm">
            <Copy size={16} /> Copy Phones
          </button>
          <button onClick={handleExportCSV} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 text-sm">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Executive Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</span>
          <span className="text-2xl font-black text-slate-800">{stats.total}</span>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Active</span>
          <span className="text-2xl font-black text-emerald-700">{stats.active}</span>
        </div>
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Inactive</span>
          <span className="text-2xl font-black text-rose-700">{stats.inactive}</span>
        </div>
        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">States</span>
          <span className="text-2xl font-black text-indigo-700">{stats.states}</span>
        </div>
        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Cities</span>
          <span className="text-2xl font-black text-indigo-700">{stats.cities}</span>
        </div>
        
        {/* Services Breakdown */}
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Zomato</span>
          <span className="text-2xl font-black text-red-700">{stats.zomato}</span>
        </div>
        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Swiggy</span>
          <span className="text-2xl font-black text-orange-700">{stats.swiggy}</span>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Billing</span>
          <span className="text-2xl font-black text-blue-700">{stats.billing}</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by State, City, PIN, Name, Phone, or Service (e.g. 'Delhi Zomato', '110058')..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
        />
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">Restaurant</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">Location</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 w-[250px]">Services</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 text-center">Status</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{c.restaurantName}</span>
                      <span className="text-xs font-medium text-slate-500">{c.ownerName}</span>
                      <span className="text-xs font-bold text-slate-400 mt-1">{c.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">{c.city || c.area || '-'}</span>
                      <span className="text-xs font-medium text-slate-500">{c.state || '-'} {c.pincode ? `(${c.pincode})` : ''}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {/* Show up to 3 badges, then +X more */}
                      {c.services.slice(0, 3).map((s: any) => (
                        <React.Fragment key={s.id}>
                          {getServiceBadge(s.title || s.type)}
                        </React.Fragment>
                      ))}
                      {c.services.length > 3 && (
                        <span className="inline-flex items-center text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          +{c.services.length - 3} MORE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {c.status === 'Active' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-md">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                        <Lock size={10} /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedCustomer(c)}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-black uppercase rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                    <Map size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="font-bold text-lg">No clients found in this territory.</p>
                    <p className="text-sm">Try adjusting your search criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
