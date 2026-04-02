"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Rocket, Zap, Database, ShieldCheck, Globe, Cpu, Clock, Terminal } from "lucide-react";

interface Milestone {
    id: string;
    title: string;
    description: string;
    time: string;
    category: "AI" | "CORE" | "SECURITY" | "PERFORMANCE";
    icon: React.ElementType;
}

const MILESTONES: Milestone[] = [
    {
        id: "v3_0",
        title: "Leads ki List Ab Super Fast (v3.0)",
        description: "Lambi se lambi leads ki list ab bina kisis ruka-vat ke bahut tezi se load hogi. Kaam ab pehle se fast hoga.",
        time: "Active: 2h ago",
        category: "CORE",
        icon: Database
    },
    {
        id: "bulk_reassign",
        title: "Ek Saath Sari Leads Baantna (Bulk)",
        description: "Ab aap 10, 50, ya 100 leads ek saath select karke kisi bhi team member ko Seconds mein de sakte hain. Time bachega.",
        time: "Active: 4h ago",
        category: "PERFORMANCE",
        icon: Rocket
    },
    {
        id: "ai_quota",
        title: "Calling Reports Me Bada Sudhaar",
        description: "Ab aap kisi bhi pichli date ka record dekh sakte hain ki kisne kitni calling ki. Reports ab pehle se bahut accurate hain.",
        time: "Active: 6h ago",
        category: "AI",
        icon: Cpu
    },
    {
        id: "filter_sync",
        title: "Smart Filters (Theek Kiya Gaya)",
        description: "Owner aur Assigned filters ab mix nahi honge. Jise lead di gayi hai sirf usi ke paas dikhegi. Confusion khatam.",
        time: "Active: 8h ago",
        category: "CORE",
        icon: Zap
    },
    {
        id: "dom_stabilization",
        title: "System Ki Andruni Safai (Cleanup)",
        description: "System ke peeche ke chote-mote bugs ko saaf kiya gaya hai taaki pura portal smoothly chale bina kisi error ke.",
        time: "Active: 12h ago",
        category: "CORE",
        icon: ShieldCheck
    }
];

export default function ChangelogModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 md:p-10 pointer-events-none">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md pointer-events-auto" 
                    />

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-[0_48px_144px_-24px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden pointer-events-auto border border-white/20"
                    >
                        {/* 🌟 PREMIUM HEADER */}
                        <div className="px-10 py-10 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
                                <Rocket size={200} className="text-white" />
                            </div>
                            
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-[9px] font-black text-indigo-300 uppercase tracking-[0.3em]">System v4.81.2</div>
                                    <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                        <Globe size={12} className="animate-spin-[10s]" /> Global Pulse Active
                                    </div>
                                </div>
                                <h2 className="text-4xl font-black text-white tracking-tighter leading-tight drop-shadow-xl">Development Matrix Updates</h2>
                                <p className="text-indigo-200/60 text-xs font-bold mt-2 font-mono">Operator Tracking: System Evolution Logs & Milestones</p>
                            </div>

                            <button onClick={onClose} className="absolute top-8 right-8 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-2xl transition-all flex items-center justify-center text-white/40 group">
                                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        {/* 🧱 LOGS AREA */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent bg-slate-50/50">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-px flex-1 bg-slate-200/60" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Taza Updates: Last 24 Hours</span>
                                <div className="h-px flex-1 bg-slate-200/60" />
                            </div>

                            <div className="space-y-4">
                                {MILESTONES.map((item, index) => (
                                    <motion.div 
                                        key={item.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="group p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-crosshair relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full -translate-y-12 translate-x-12 blur-3xl pointer-events-none" />
                                        
                                        <div className="flex items-start gap-5 relative z-10">
                                            <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500 ${
                                                item.category === 'AI' ? 'bg-indigo-50 text-indigo-600' : 
                                                item.category === 'PERFORMANCE' ? 'bg-emerald-50 text-emerald-600' :
                                                'bg-slate-50 text-slate-600'
                                            }`}>
                                                <item.icon size={22} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <h4 className="text-[15px] font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors uppercase italic">{item.title}</h4>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.time}</span>
                                                </div>
                                                <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight opacity-80">{item.description}</p>
                                                
                                                <div className="mt-3 flex items-center gap-3">
                                                    <div className="flex -space-x-1.5">
                                                        {[1,2,3].map(i => (
                                                            <div key={i} className="w-4 h-4 rounded-full border border-white bg-slate-200" />
                                                        ))}
                                                    </div>
                                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Verified by Core Engine</span>
                                                    <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 text-white rounded text-[7px] font-black uppercase tracking-widest group-hover:bg-indigo-600 transition-colors">
                                                        <Terminal size={8} /> Stable Build
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* 🛡️ FOOTER */}
                        <div className="px-10 py-8 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Architecture State</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xs font-black text-slate-900 italic tracking-tighter uppercase">High Precision</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={onClose}
                                className="px-10 py-4 bg-slate-900 text-white rounded-[20px] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-xl hover:shadow-indigo-200 active:scale-95"
                            >
                                Affirm Acknowledgment
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
