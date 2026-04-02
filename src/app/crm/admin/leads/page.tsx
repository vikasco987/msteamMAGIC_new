"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { 
    Search, Filter, Users, UserPlus, CheckCircle2, 
    X, LayoutGrid, FileText, ChevronDown, ShieldCheck, Phone,
    Database, Plus, Trash2, ListChecks, ArrowRight, ArrowUpDown,
    Clock, AlertCircle, Zap, Layers, Send, RefreshCw,
    BarChart3, Settings, Menu, Bell, UserCheck, HardDrive,
    MoveRight, MousePointer2, Info, Calendar as CalendarIcon, User as UserIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { format, subHours, isAfter } from "date-fns";
import StatusMatrixModal from "@/app/components/StatusMatrixModal";
import FormRemarkModal from "@/app/components/FormRemarkModal";

const CALL_STATUS_OPTIONS = [
    "New Lead", "In Progress", "Call Back", "RNR", "Interested", "Closed", "Dead Lead"
];

const QUICK_FILTERS = [
    { label: "ALL", value: "" },
    { label: "FRESH", value: "New Lead" },
    { label: "RNR", value: "RNR" },
    { label: "IN PROGRESS", value: "In Progress" },
    { label: "INTERESTED", value: "Interested" },
];

interface Lead {
    id: string;
    formId: string;
    submittedByName: string;
    submittedBy: string;
    submittedAt: string;
    assignedTo: string[];
    values: { fieldId: string; value: string }[];
    internalValues?: { columnId: string; value: string }[];
    remarks: any[];
}

interface TeamMember {
    clerkId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
}

export default function LeadDistributionTerminal() {
    const router = useRouter();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    
    // Config
    const [formId, setFormId] = useState("69b8f819a8a6f09fd11148c7");
    const [formStructure, setFormStructure] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [activeStatus, setActiveStatus] = useState("");
    
    // Advanced Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedSubmitter, setSelectedSubmitter] = useState("");
    const [selectedAssignee, setSelectedAssignee] = useState("");
    const [availableSubmitters, setAvailableSubmitters] = useState<any[]>([]);
    
    // Selection & Assignment
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [forms, setForms] = useState<any[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

    // Modals
    const [statusModal, setStatusModal] = useState<{ lead: Lead, val: string } | null>(null);
    const [openFollowUpModal, setOpenFollowUpModal] = useState<{ formId: string, responseId: string } | null>(null);

        const initData = async () => {
             try {
                 const [fRes, uRes] = await Promise.all([
                     fetch("/api/crm/forms"),
                     fetch("/api/crm/users?limit=500")
                 ]);
                 const fd = await fRes.json();
                 const ud = await uRes.json();
                 
                 setForms(fd.forms || []);
                 
                 const userList = Array.isArray(ud) ? ud : (ud.users || []);
                 // Secondary filter here just in case API cache mismatch
                 setTeamMembers(userList.filter((u: any) => !u.banned));
             } catch (e) {
                 console.error("Init Error:", e);
             }
        };

    useEffect(() => { initData(); }, []);

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "25",
                search,
                formId,
                startDate,
                endDate,
                submitterId: selectedSubmitter,
                assignedTo: selectedAssignee
            });

            if (activeStatus) {
                const conds = JSON.stringify([{ colId: "__status", op: "equals", val: activeStatus }]);
                params.append("conditions", conds);
            }

            const res = await fetch(`/api/crm/admin/leads?${params.toString()}`);
            const data = await res.json();
            if (data.responses) {
                setLeads(data.responses);
                setTotal(data.total);
                setFormStructure(data.formStructure);
                setAvailableSubmitters(data.uniqueSubmitters || []);
            }
        } catch (e) { toast.error("Sync Failed"); } finally { setLoading(false); }
    }, [page, search, formId, activeStatus, startDate, endDate, selectedSubmitter, selectedAssignee]);

    useEffect(() => {
        const t = setTimeout(() => fetchLeads(), (search || startDate || endDate) ? 500 : 0);
        return () => clearTimeout(t);
    }, [fetchLeads]);

    const handleBatchAssign = async () => {
        if (selectedIds.length === 0 || !selectedAgentId) {
            toast.error("Select leads and an agent first!");
            return;
        }
        const tid = toast.loading(`Rerouting ${selectedIds.length} leads...`);
        try {
            const res = await fetch("/api/crm/admin/leads", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: selectedIds, assignedTo: [selectedAgentId] })
            });
            if (res.ok) {
                toast.success("Distribution Successful", { id: tid });
                setSelectedIds([]);
                setSelectedAgentId(null);
                fetchLeads();
            } else throw new Error();
        } catch (e) { toast.error("API Error", { id: tid }); }
    };

    const getSubmitterInfo = useCallback((lead: Lead) => {
        let name = lead.submittedByName;
        let num = "—";
        if (formStructure?.fields) {
            const numField = formStructure.fields.find((f: any) => /phone|mobile|number|contact|व्हाट्सएप|मोबाइल/i.test(f.label));
            if (numField) num = lead.values?.find(v => v.fieldId === numField.id)?.value || "—";
        }
        if (!name || name === "Public Submitter" || name === "Vivek Kunwar") {
            const first = lead.values?.[0]?.value;
            if (first && first.length > 2 && first.length < 25) name = first;
            else {
                const staff = teamMembers.find(m => m.clerkId === lead.submittedBy);
                if (staff) name = staff.firstName || staff.email.split('@')[0];
                else name = num !== "—" ? "Node-" + num.slice(-4) : "L-" + lead.id.slice(-4);
            }
        }
        return { name, number: num };
    }, [formStructure, teamMembers]);

    const clearFilters = () => {
        setStartDate("");
        setEndDate("");
        setSelectedSubmitter("");
        setSelectedAssignee("");
        setActiveStatus("");
        setSearch("");
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans">
            
            {/* 📁 SIDEBAR (Sector Switcher) */}
            <aside className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-[100] ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden opacity-0'}`}>
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div><h2 className="text-xl font-black tracking-tighter text-indigo-600 leading-none mb-1">HUB</h2><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lead Terminal</p></div>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><X size={16} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {forms.map(f => (
                        <button key={f.id} onClick={() => { setFormId(f.id); setPage(1); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border-2 text-left animate-in slide-in-from-left-2 ${formId === f.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${formId === f.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}><FileText size={16} /></div>
                            <div className="flex-1 min-w-0"><h4 className="text-[12px] font-black uppercase truncate leading-none mb-1">{f.title}</h4><span className={`text-[8px] font-bold uppercase transition-colors ${formId === f.id ? 'text-indigo-100' : 'text-slate-300'}`}>{f._count?.responses || 0} Leads</span></div>
                        </button>
                    ))}
                </div>
            </aside>

            {/* 🏢 MAIN AREA */}
            <main className="flex-1 flex flex-col min-w-0 bg-white">
                
                {/* 🛡️ TOP NAVIGATION & QUICK FILTERS */}
                <header className="h-20 px-8 border-b border-slate-100 flex items-center justify-between shadow-sm relative z-50">
                    <div className="flex items-center gap-6">
                        {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Menu size={18} /></button>}
                        <div className="relative w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                            <input type="text" placeholder="Deep scan database..." className="w-full pl-11 pr-4 py-2.5 bg-slate-100 rounded-2xl border-transparent focus:bg-white focus:border-indigo-600 outline-none transition-all font-black text-[12px] uppercase" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
                        {QUICK_FILTERS.map(f => (
                            <button key={f.label} onClick={() => { setActiveStatus(f.value); setPage(1); }} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeStatus === f.value ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{f.label}</button>
                        ))}
                        <div className="w-px h-6 bg-slate-200 mx-2" />
                        <button onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${isFilterPanelOpen ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                            <Filter size={14} /> Matrix Filters
                        </button>
                    </div>
                </header>

                {/* 📊 ADVANCED FILTER PANEL */}
                <AnimatePresence>
                    {isFilterPanelOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-slate-50 border-b border-slate-200 overflow-hidden relative z-40 px-8 py-6">
                            <div className="grid grid-cols-4 gap-6 max-w-[1400px]">
                                {/* DATE RANGE */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CalendarIcon size={12} /> Submission Timeline</label>
                                    <div className="flex items-center gap-2">
                                        <input type="date" className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-black outline-none focus:border-indigo-600" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                        <span className="text-slate-300 font-bold">to</span>
                                        <input type="date" className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-black outline-none focus:border-indigo-600" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                    </div>
                                </div>

                                {/* SUBMITTER DROP DOWN */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><UserIcon size={12} /> Origin Submitter</label>
                                    <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[11px] font-black outline-none focus:border-indigo-600 uppercase" value={selectedSubmitter} onChange={(e) => setSelectedSubmitter(e.target.value)}>
                                        <option value="">All Submitters</option>
                                        {availableSubmitters
                                            .filter(s => teamMembers.some(m => m.clerkId === s.submittedBy))
                                            .map(s => (
                                            <option key={s.submittedBy} value={s.submittedBy}>{s.submittedByName || "Unknown User"}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* ASSIGNEE / UNASSIGNED */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><UserCheck size={12} /> Allocation Status</label>
                                    <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[11px] font-black outline-none focus:border-indigo-600 uppercase" value={selectedAssignee} onChange={(e) => setSelectedAssignee(e.target.value)}>
                                        <option value="">All Allocations</option>
                                        <option value="unassigned" className="text-rose-600 font-black">--- UNASSIGNED ONLY ---</option>
                                        {teamMembers.map(m => (
                                            <option key={m.clerkId} value={m.clerkId}>{m.firstName || m.email.split('@')[0]}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-end pb-0.5">
                                    <button onClick={clearFilters} className="px-6 py-2.5 bg-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all w-full">Wipe Matrix Filters</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 📊 GRID AREA */}
                <div className="flex-1 overflow-auto custom-scrollbar p-8 bg-slate-50/30">
                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative h-full">
                        {loading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-[200] flex items-center justify-center">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full shadow-lg" />
                            </div>
                        )}
                        
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse table-fixed min-w-[1300px]">
                                <thead className="sticky top-0 bg-white border-b border-slate-100 z-[100]">
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 w-16 text-center border-r border-slate-100"><input type="checkbox" className="w-5 h-5 rounded-[7px] border-2 border-slate-200 text-indigo-600" checked={selectedIds.length === leads.length && leads.length > 0} onChange={(e) => { if(e.target.checked) setSelectedIds(leads.map(l => l.id)); else setSelectedIds([]); }} /></th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[280px] border-r border-slate-100">Client Identity</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[140px] border-r border-slate-100">Entry Matrix</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[160px] text-center border-r border-slate-100">Current Phase</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[220px]">Assigned Personnel</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {leads.map(lead => {
                                        const isSel = selectedIds.includes(lead.id);
                                        const { name, number } = getSubmitterInfo(lead);
                                        const status = lead.remarks?.[0]?.followUpStatus || "New Lead";
                                        const assigned = Array.from(new Set([...(lead.assignedTo || [])]));
                                        return (
                                            <tr key={lead.id} className={`group hover:bg-slate-50/50 transition-all ${isSel ? 'bg-indigo-50/30' : ''}`}>
                                                <td className="px-8 py-5 w-16 text-center border-r border-slate-50"><input type="checkbox" className="w-5 h-5 rounded-[7px] border-2 border-slate-200 text-indigo-600 shadow-sm" checked={isSel} onChange={() => { if(isSel) setSelectedIds(p => p.filter(id => id !== lead.id)); else setSelectedIds(p => [...p, lead.id]); }} /></td>
                                                <td className="px-6 py-5 border-r border-slate-50">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-slate-50 rounded-[18px] border border-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm text-[11px] uppercase truncate px-2">{name[0]}</div>
                                                        <div className="min-w-0">
                                                            <h4 className="text-[14px] font-black text-slate-900 truncate uppercase mb-1">{name}</h4>
                                                            <p className="text-[10px] font-black text-slate-400 flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity"><Phone size={10} className="text-indigo-600" /><span className="tabular-nums">{number}</span></p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 border-r border-slate-50"><p className="text-[11px] font-black text-slate-600 tabular-nums uppercase leading-none mb-1.5">{format(new Date(lead.submittedAt), "MMM dd")}</p><span className="text-[10px] font-bold text-slate-300 uppercase leading-none">{format(new Date(lead.submittedAt), "hh:mm a")}</span></td>
                                                <td className="px-6 py-5 border-r border-slate-50 text-center">
                                                    <button onClick={() => setStatusModal({ lead, val: status })} className={`text-[9px] font-black px-5 py-2.5 rounded-2xl border transition-all uppercase tracking-widest shadow-sm ${status === 'Closed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-indigo-600 hover:text-indigo-600'}`}>{status}</button>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex -space-x-2.5 items-center pointer-events-none">
                                                        {assigned.length === 0 ? <div className="text-[10px] font-black text-slate-300 uppercase flex items-center gap-2"><div className="w-10 h-10 rounded-xl border-2 border-dashed border-slate-100 flex items-center justify-center"><UserPlus size={14} /></div> Idle Node</div> : assigned.slice(0, 3).map(uid => {
                                                            const m = teamMembers.find(t => t.clerkId === uid);
                                                            return <div key={uid} className="w-11 h-11 rounded-2xl ring-4 ring-white bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm">{m?.imageUrl ? <img src={m.imageUrl} className="w-full h-full object-cover" /> : <span className="text-[10px] font-black text-slate-400 uppercase">{(m?.firstName || 'U')[0]}</span>}</div>
                                                        })}
                                                        {assigned.length > 3 && <div className="w-11 h-11 rounded-2xl ring-4 ring-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">+{assigned.length - 3}</div>}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* 💿 GRID FOOTER */}
                        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-8">
                                <div className="flex flex-col"><p className="text-[14px] font-black text-slate-900 tabular-nums leading-none mb-1">{total.toLocaleString()}</p><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Matrix Signals</span></div>
                                <div className="h-8 w-px bg-slate-200" />
                                <div className="flex flex-col"><p className="text-[14px] font-black text-indigo-600 uppercase leading-none mb-1">{selectedIds.length}</p><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Selections</span></div>
                            </div>

                            <div className="flex items-center gap-4 bg-white p-2 rounded-3xl border border-slate-200 shadow-sm">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-200 active:scale-90"><ArrowRight size={20} className="rotate-180" /></button>
                                <div className="px-8 py-2 text-[12px] font-black uppercase text-slate-900 tracking-widest">Page <span className="text-indigo-600 text-xl">{page}</span> OF {Math.ceil(total / 25) || 1}</div>
                                <button onClick={() => setPage(p => p + 1)} className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-200 active:scale-90"><ArrowRight size={20} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* 🛰️ ALLOCATION PANEL */}
            <aside className="w-[420px] bg-[#F1F5F9] border-l border-slate-200 flex flex-col relative z-50">
                <div className="p-10 border-b border-slate-200 bg-white">
                    <h3 className="text-2xl font-black tracking-tighter text-slate-900 leading-none mb-2 uppercase">Distribution</h3>
                    <div className="flex items-center justify-between">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reroute Batch Protocol</p>
                         <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[9px] font-black text-emerald-600 uppercase">Active Net</span></div>
                    </div>
                </div>

                <div className="p-10 flex-1 flex flex-col overflow-hidden">
                    <div className="bg-white p-10 rounded-[44px] border border-slate-100 shadow-2xl mb-10 flex flex-col gap-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/20 rounded-full translate-x-12 -translate-y-12" />
                        <div className="flex items-center gap-8">
                             <div className="w-16 h-16 bg-indigo-600 rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-indigo-100 group-hover:rotate-12 transition-transform"><MousePointer2 size={32} /></div>
                             <div><h4 className="text-5xl font-black text-slate-900 leading-none mb-1 tabular-nums">{selectedIds.length}</h4><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Target Leads</p></div>
                        </div>
                    </div>

                    <div className="px-4 mb-6 flex items-center justify-between"><span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Choose Personnel</span><Users size={16} className="text-slate-200" /></div>
                    
                    <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar space-y-4">
                        {teamMembers.map(m => (
                            <button key={m.clerkId} onClick={() => setSelectedAgentId(m.clerkId)} className={`w-full p-6 rounded-[38px] border-4 transition-all flex items-center gap-6 text-left group animate-in slide-in-from-right-3 ${selectedAgentId === m.clerkId ? 'bg-white border-indigo-600 shadow-2xl shadow-indigo-100 scale-105' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'}`}>
                                <div className="w-16 h-16 rounded-[24px] bg-slate-100 border-4 border-white overflow-hidden shrink-0 shadow-lg group-hover:scale-110 transition-transform">{m.imageUrl ? <img src={m.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-300 bg-white uppercase">{(m.firstName || 'U')[0]}</div>}</div>
                                <div className="flex-1 min-w-0 pointer-events-none"><h5 className="text-[16px] font-black text-slate-900 truncate uppercase mb-1 leading-none group-hover:text-indigo-600 transition-colors">{m.firstName || m.email.split('@')[0]}</h5><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-1 bg-slate-50 rounded-full">Personnel</span></div>
                                {selectedAgentId === m.clerkId && <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl animate-in zoom-in"><CheckCircle2 size={24} /></div>}
                            </button>
                        ))}
                    </div>

                    <div className="mt-10">
                        <button onClick={handleBatchAssign} className={`w-full py-8 rounded-[48px] font-black uppercase tracking-[0.5em] flex items-center justify-center gap-5 transition-all active:scale-95 shadow-[0_50px_100px_-25px_rgba(79,70,229,0.3)] hover:-translate-y-1 ${selectedAgentId && selectedIds.length > 0 ? 'bg-indigo-600 text-white shadow-indigo-300' : 'bg-slate-300 text-slate-500 pointer-events-none opacity-40 shadow-none'}`}>
                            <Zap size={24} /> Reroute Batch
                        </button>
                    </div>
                </div>

                <div className="p-10 bg-white border-t border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-5">
                         <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><ShieldCheck size={24} /></div>
                         <div><p className="text-[12px] font-black text-slate-900 uppercase leading-none mb-1">Master Terminal</p><span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Access Level 1</span></div>
                     </div>
                     <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all cursor-pointer"><Settings size={22} /></div>
                </div>
            </aside>

            {/* MODALS */}
            <StatusMatrixModal isOpen={!!statusModal} onClose={() => setStatusModal(null)} label="State Reset" val={statusModal?.val || ""} options={CALL_STATUS_OPTIONS} onSelect={async (opt) => { if (!statusModal) return; const tid = toast.loading("Executing Phase Shift..."); try { const res = await fetch(`/api/crm/forms/${statusModal.lead.formId}/responses/${statusModal.lead.id}/remarks`, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ followUpStatus: opt, remark: `Matrix Overlay: ${opt}` }) }); if(res.ok) { toast.success("Signal Synced", {id: tid}); setStatusModal(null); fetchLeads(); } else throw new Error(); } catch (e) { toast.error("Failure", {id: tid}); } }} onFullLog={() => { if(statusModal) { setOpenFollowUpModal({ formId: statusModal.lead.formId, responseId: statusModal.lead.id }); setStatusModal(null); } }} />
            {openFollowUpModal && (<FormRemarkModal formId={openFollowUpModal.formId} responseId={openFollowUpModal.responseId} userRole="ADMIN" onClose={() => setOpenFollowUpModal(null)} onSave={() => { setOpenFollowUpModal(null); fetchLeads(); }} />)}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { height: 10px; width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 12px; }
                input[type="date"]::-webkit-calendar-picker-indicator {
                  filter: invert(0.5);
                  cursor: pointer;
                }
            `}</style>
        </div>
    );
}
