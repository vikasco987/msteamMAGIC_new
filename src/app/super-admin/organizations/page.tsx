"use client";

import React, { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { 
    Building2, 
    ArrowRightCircle, 
    Search, 
    RefreshCw, 
    ShieldCheck, 
    Zap, 
    Users, 
    ChevronRight,
    Loader2,
    CheckCircle2,
    Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface OrganizationInfo {
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
    membersCount: number;
    isJoined: boolean;
}

export default function OrganizationNavigator() {
    const { user, isLoaded } = useUser();
    const clerk = useClerk();
    const [organizations, setOrganizations] = useState<OrganizationInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchOrgs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/super-admin/organizations");
            const data = await res.json();
            if (data.organizations) setOrganizations(data.organizations);
            else if (data.error) toast.error(data.error);
        } catch (err) {
            toast.error("Failed to fetch organizations from Clerk");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded && user) {
            fetchOrgs();
        }
    }, [isLoaded, user]);

    const handleLoginToOrg = async (orgId: string, isAlreadyJoined: boolean) => {
        setProcessingId(orgId);
        try {
            // 🚀 Force membership if not joined yet
            if (!isAlreadyJoined) {
                const res = await fetch("/api/super-admin/organizations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ organizationId: orgId })
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to auto-join organization");
                }
                toast.success("Identity injected into organization context.");
            }

            // 🛡️ Perform the Clerk switch
            // Clerk.setActive will update the local session and trigger a page refresh
            toast.loading("Re-routing session context...", { id: "switch-org" });
            
            await clerk.setActive({ 
                organization: orgId,
                beforeEmit: () => {
                    // Pre-emit action if needed
                }
            });

            toast.success("Organization session established.", { id: "switch-org" });
            
            // Redirect to home dashboard of that organization context
            // Wait for Clerk to finish the state update
            setTimeout(() => {
                window.location.href = "/";
            }, 500);

        } catch (error: any) {
            toast.error(error.message || "An error occurred during re-routing", { id: "switch-org" });
            console.error("Org Login Error:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredOrgs = organizations.filter(o => 
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const userRole = (user?.publicMetadata?.role as string || "").toUpperCase();

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 gap-6 text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(79,70,229,0.15),transparent_50%)]" />
                <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/20"
                >
                    <Zap className="text-white fill-white" size={32} />
                </motion.div>
                <div className="text-center space-y-2 relative z-10">
                    <h2 className="text-2xl font-black tracking-tight">Accessing Neural Interface...</h2>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em]">Decrypting Organization Protocols</p>
                </div>
            </div>
        );
    }

    // 🛡️ SECURITY GUARD: Only MASTER allowed
    if (userRole !== "MASTER") {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[#0a0f1c]" />
                <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-rose-600/5 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="relative z-10 max-w-lg">
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-24 h-24 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-3xl shadow-rose-500/10"
                    >
                        <Lock size={40} />
                    </motion.div>
                    <h1 className="text-5xl font-black text-white tracking-tighter mb-4">ACCESS <span className="text-rose-500">RESTRICTED</span></h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-12">Neural Console is restricted to MASTER protocol only.</p>
                    
                    <button 
                        onClick={() => window.location.href = "/"}
                        className="px-12 py-5 bg-white text-slate-950 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl active:scale-95"
                    >
                        Return to Safe Sector
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 gap-6 text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(79,70,229,0.15),transparent_50%)]" />
                <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/20"
                >
                    <Zap className="text-white fill-white" size={32} />
                </motion.div>
                <div className="text-center space-y-2 relative z-10">
                    <h2 className="text-2xl font-black tracking-tight">Syncing Grid...</h2>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em]">Connecting to Clerk Backend</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-8 lg:p-12 relative overflow-hidden font-sans antialiased selection:bg-indigo-500 selection:text-white">
            {/* Background Architecture */}
            <div className="absolute inset-0 bg-[#0a0f1c] pointer-events-none" />
            <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="max-w-6xl mx-auto relative z-10">
                
                {/* Header System */}
                <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-16">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-[24px] shadow-2xl shadow-indigo-500/20 flex items-center justify-center rotate-3 scale-110">
                            <Building2 size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter">Organization <span className="text-indigo-400">Console</span></h1>
                                <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full">Super Admin</span>
                            </div>
                            <p className="text-slate-500 font-bold mt-2 text-sm uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={14} className="text-emerald-500" /> Administrative Identity Engine
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group w-full lg:w-96">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Locate Organization..."
                                className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-[22px] text-white font-bold placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={fetchOrgs}
                            className="p-4 bg-white/5 border border-white/10 text-white rounded-[22px] hover:bg-white/10 transition-all group"
                        >
                            <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                        </button>
                    </div>
                </header>

                {/* Grid Console */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {filteredOrgs.map((org, index) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={org.id}
                                className="group relative bg-white/5 border border-white/10 rounded-[32px] p-8 hover:bg-white/[0.08] hover:border-indigo-500/30 transition-all overflow-hidden"
                            >
                                {/* Active Indicator Glow */}
                                {org.isJoined && (
                                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none" />
                                )}

                                <div className="flex items-start justify-between mb-8">
                                    <div className="relative">
                                        {org.imageUrl ? (
                                            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[22px]">
                                                <img 
                                                    src={org.imageUrl} 
                                                    alt={org.name} 
                                                    className="w-14 h-14 rounded-[18px] object-cover ring-2 ring-slate-900 shadow-xl"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 bg-slate-800 text-slate-400 rounded-[22px] flex items-center justify-center text-2xl font-black border border-white/10">
                                                {org.name[0]}
                                            </div>
                                        )}
                                        {org.isJoined && (
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-[#121c32] rounded-full flex items-center justify-center shadow-lg">
                                                <CheckCircle2 size={10} className="text-white" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <span className="px-3 py-1 bg-white/5 border border-white/10 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5">
                                            <Users size={10} /> {org.membersCount} Members
                                        </span>
                                        {org.slug && (
                                            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-lg">
                                                id: {org.slug}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1 mb-8">
                                    <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors leading-tight truncate">
                                        {org.name}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Organization ID: {org.id.slice(0, 16)}...
                                    </p>
                                </div>

                                {/* Security Clearance Display */}
                                <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 mb-8 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${org.isJoined ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                            <ShieldCheck size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em]">Security Status</p>
                                            <p className={`text-xs font-black ${org.isJoined ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {org.isJoined ? 'AUTHORIZED' : 'ACCESS PENDING'}
                                            </p>
                                        </div>
                                    </div>
                                    {!org.isJoined && <Lock size={14} className="text-slate-700" />}
                                </div>

                                {/* Execution Action */}
                                <button
                                    onClick={() => handleLoginToOrg(org.id, org.isJoined)}
                                    disabled={processingId !== null}
                                    className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3
                                        ${org.isJoined 
                                            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95' 
                                            : 'bg-white/10 text-white hover:bg-indigo-600 shadow-md active:scale-95'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {processingId === org.id ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" /> Tunneling...
                                        </>
                                    ) : (
                                        <>
                                            {org.isJoined ? 'Initiate Link' : 'Bypass & Enter'} <ArrowRightCircle size={16} className="text-indigo-300" />
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredOrgs.length === 0 && !loading && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="text-center py-40 bg-white/5 border-4 border-dashed border-white/10 rounded-[48px]"
                    >
                        <div className="w-24 h-24 bg-slate-900 text-slate-700 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5">
                            <Building2 size={48} />
                        </div>
                        <h2 className="text-2xl font-black text-white">Grid Signal Lost</h2>
                        <p className="text-slate-500 font-bold max-w-sm mx-auto mt-2">No organizations detected within current decryption parameters. Refine your search.</p>
                        <button 
                            onClick={() => setSearchTerm("")}
                            className="mt-10 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20"
                        >
                            Reset Universal Search
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Matrix Decorative Layer */}
            <div className="fixed bottom-0 right-0 p-12 pointer-events-none opacity-20 hidden lg:block">
                <div className="flex flex-col items-end">
                    <div className="flex gap-2">
                        {[...Array(4)].map((_, i) => <div key={i} className="w-2 h-2 bg-indigo-500 rounded-full" />)}
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mt-2">Core OS Access Protocol: 0x8891</p>
                </div>
            </div>
        </div>
    );
}
