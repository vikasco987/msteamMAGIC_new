"use client";

import React, { useState, useMemo } from "react";
import { X, Search, UserMinus, UserPlus, Filter, CheckCircle2, Users, Loader2, Sparkles, Phone, Mail, Clock, EyeOff, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface TeamMember {
    clerkId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
    role?: string;
}

interface LeadAssignHubProps {
    formId: string;
    onClose: () => void;
    selectedIds?: string[];
    teamMembers: TeamMember[];
    totalCount?: number;
    onSuccess: () => void;
    onFetchAll?: () => Promise<any[]>;
    responses: any[];
}

export default function LeadAssignHub({ formId, onClose, responses, selectedIds = [], teamMembers, totalCount = 0, onSuccess, onFetchAll }: LeadAssignHubProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [assigneeSearch, setAssigneeSearch] = useState("");
    const [unassignedOnly, setUnassignedOnly] = useState(false);
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
    const [selectedBulkIds, setSelectedBulkIds] = useState<Set<string>>(new Set());
    const [isBulkAssigning, setIsBulkAssigning] = useState<boolean>(false);
    const [allHubLeads, setAllHubLeads] = useState<any[] | null>(null);
    const [isLoadingFull, setIsLoadingFull] = useState(false);
    const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
    const [hiddenTeamMembers, setHiddenTeamMembers] = useState<Set<string>>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(`hidden_ops_${formId}`);
            return saved ? new Set(JSON.parse(saved)) : new Set();
        }
        return new Set();
    });
    const [showHiddenView, setShowHiddenView] = useState(false);
    const [customSelectCount, setCustomSelectCount] = useState<string>("");

    // Sync hidden members to localStorage
    const hideMember = (clerkId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const next = new Set(hiddenTeamMembers);
        next.add(clerkId);
        setHiddenTeamMembers(next);
        localStorage.setItem(`hidden_ops_${formId}`, JSON.stringify(Array.from(next)));
        toast.success("Operative hidden");
    };

    const unhideMember = (clerkId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const next = new Set(hiddenTeamMembers);
        next.delete(clerkId);
        setHiddenTeamMembers(next);
        localStorage.setItem(`hidden_ops_${formId}`, JSON.stringify(Array.from(next)));
        toast.success("Operative restored");
    };

    // Filter leads based on selection from main table
    const filteredLeads = useMemo(() => {
        let leads = allHubLeads || responses;
        if (selectedIds.length > 0 && !allHubLeads) { // Only restrict to selection if we haven't loaded all
            leads = leads.filter((r: any) => selectedIds.includes(r.id));
        }

        return leads.filter((res: any) => {
            const assigned = res.assignedTo || [];
            // Enhanced Unassigned Logic: Empty OR only contains the original submitter (not yet reassigned)
            const isTrulyUnassigned = assigned.length === 0 || (assigned.length === 1 && (assigned[0] === res.submittedBy || !res.submittedBy));
            
            if (unassignedOnly && !isTrulyUnassigned) return false;

            if (!searchTerm) return true;

            const searchVal = searchTerm.toLowerCase();
            const hasMatch = res.values?.some((v: any) => v.value?.toLowerCase().includes(searchVal));
            const hasInternalMatch = res.internalValues?.some((v: any) => v.value?.toLowerCase().includes(searchVal));
            const nameMatch = res.submittedByName?.toLowerCase().includes(searchVal);

            return hasMatch || hasInternalMatch || nameMatch;
        });
    }, [responses, allHubLeads, searchTerm, unassignedOnly, selectedIds]);

    const handleLoadAll = async () => {
        if (!onFetchAll) return;
        setIsLoadingFull(true);
        try {
            const all = await onFetchAll();
            setAllHubLeads(all);
            toast.success(`Matrix Fully Loaded (${all.length} leads)`);
        } catch (err) {
            toast.error("Failed to load full sector");
        } finally {
            setIsLoadingFull(false);
        }
    };

    // Filter team members for quick picker
    const filteredTeam = useMemo(() => {
        let members = teamMembers;
        
        // Exclude permanently hidden members from this view unless we are in management mode
        if (hiddenTeamMembers.size > 0 && !showHiddenView) {
            members = members.filter(m => !hiddenTeamMembers.has(m.clerkId));
        }

        // If in hidden view, ONLY show hidden members to make it easier to restore
        if (showHiddenView) {
            members = members.filter(m => hiddenTeamMembers.has(m.clerkId));
        }

        if (!assigneeSearch) return members.slice(0, 100);
        const s = assigneeSearch.toLowerCase();
        return members.filter(m =>
            m.firstName?.toLowerCase().includes(s) ||
            m.lastName?.toLowerCase().includes(s) ||
            m.email?.toLowerCase().includes(s)
        ).slice(0, 100);
    }, [teamMembers, assigneeSearch, hiddenTeamMembers, showHiddenView]);

    const handleToggleAssignment = async (responseId: string, currentAssigned: string[], targetClerkId: string) => {
        const isAssigned = currentAssigned.includes(targetClerkId);
        
        // 🛡️ EXCLUSIVE ASSIGNMENT LOGIC: One lead, one owner at a time
        // If assigned, we click again to remove. If not, we replace the entire list with the new owner.
        const newAssigned = isAssigned ? [] : [targetClerkId];

        const key = `${responseId}-${targetClerkId}`;
        setUpdatingIds(prev => {
            const next = new Set(prev);
            next.add(key);
            return next;
        });

        try {
            const res = await fetch(`/api/crm/forms/${formId}/responses`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    responseId,
                    assignedTo: newAssigned
                })
            });

            if (!res.ok) throw new Error("Failed to update");

            const memberName = teamMembers.find(m => m.clerkId === targetClerkId)?.firstName || "Agent";
            toast.success(isAssigned ? `Removed ${memberName}` : `Assigned to ${memberName}`, { id: key, duration: 1500 });
            onSuccess(); // Refresh parent data
        } catch (err) {
            toast.error("Sector Assignment Error");
        } finally {
            setUpdatingIds(prev => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
    };

    const handleBulkAssign = async (targetUserId: string) => {
        if (selectedBulkIds.size === 0) return;
        setIsBulkAssigning(true);
        const tid = toast.loading(`Reassigning ${selectedBulkIds.size} leads...`);
        const targetMember = teamMembers.find(t => t.clerkId === targetUserId);

        try {
            const idsArray = Array.from(selectedBulkIds);
            const results = await Promise.all(idsArray.map(async (id) => {
                const sourceList = allHubLeads || responses;
                const resObj = sourceList.find(r => r.id === id);
                if (!resObj) return null;
                const currentAssigned = resObj.assignedTo || [];
                // Add the user if not already assigned
                if (currentAssigned.includes(targetUserId)) return "skip";

                // 🚀 SINGLE ASSIGNEE ENFORCEMENT
                // Replace everything with only the target user
                const newAssigned = [targetUserId];
                const res = await fetch(`/api/crm/forms/${formId}/responses`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ responseId: id, assignedTo: newAssigned })
                });
                return res.ok;
            }));

            const successCount = results.filter(r => r === true).length;
            const skippedCount = results.filter(r => r === "skip").length;

            toast.success(`${successCount} Leads Matrix Enforced. ${skippedCount > 0 ? skippedCount + ' Skipped' : ''}`, { id: tid });
            if (successCount > 0) onSuccess();
            setSelectedBulkIds(new Set());
        } catch (error) {
            toast.error("Sector Reassignment Failure", { id: tid });
        } finally {
            setIsBulkAssigning(false);
        }
    };

    const toggleTeamSelection = (clerkId: string) => {
        setSelectedTeamIds(prev => {
            const next = new Set(prev);
            if (next.has(clerkId)) next.delete(clerkId);
            else next.add(clerkId);
            return next;
        });
    };

    const handleSequentialSync = async () => {
        if (selectedBulkIds.size === 0 || selectedTeamIds.size === 0) return;
        setIsBulkAssigning(true);
        const tid = toast.loading(`Executing Sequential Sync for ${selectedBulkIds.size} leads...`);
        
        const teamIds = Array.from(selectedTeamIds);
        const leadIds = Array.from(selectedBulkIds);

        try {
            // Process in chunks or parallel with index mapping
            const results = await Promise.all(leadIds.map(async (id, index) => {
                // Round Robin: Pick user based on lead index
                const targetUserId = teamIds[index % teamIds.length];
                const res = await fetch(`/api/crm/forms/${formId}/responses`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        responseId: id, 
                        assignedTo: [targetUserId] 
                    })
                });
                return res.ok;
            }));

            const successCount = results.filter(r => r === true).length;
            toast.success(`Sequential Sync Complete: ${successCount} Leads Distributed across ${teamIds.length} agents`, { id: tid });
            if (successCount > 0) onSuccess();
            setSelectedBulkIds(new Set());
            setSelectedTeamIds(new Set());
        } catch (error) {
            toast.error("Sequential sync failed", { id: tid });
        } finally {
            setIsBulkAssigning(false);
        }
    };

    const handleBulkUnassign = async () => {
        if (selectedBulkIds.size === 0) return;
        setIsBulkAssigning(true);
        const tid = toast.loading(`Unassigning ${selectedBulkIds.size} leads...`);

        try {
            const idsArray = Array.from(selectedBulkIds);
            const res = await fetch(`/api/crm/forms/${formId}/responses/assign`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    responseIds: idsArray, 
                    assignedTo: [] 
                })
            });

            if (!res.ok) throw new Error("Failed to unassign");

            toast.success(`${selectedBulkIds.size} Leads Unassigned Successfully`, { id: tid });
            onSuccess();
            setSelectedBulkIds(new Set());
        } catch (error) {
            toast.error("Bulk Unassignment Failure", { id: tid });
        } finally {
            setIsBulkAssigning(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedBulkIds.size === filteredLeads.length) setSelectedBulkIds(new Set());
        else setSelectedBulkIds(new Set(filteredLeads.map(l => l.id)));
    };

    const handleSelectSpecificCount = () => {
        const count = parseInt(customSelectCount);
        if (isNaN(count) || count <= 0) {
            toast.error("Please enter a valid count");
            return;
        }
        const toSelect = filteredLeads.slice(0, count).map(l => l.id);
        setSelectedBulkIds(new Set(toSelect));
        toast.success(`Selected top ${toSelect.length} leads`);
    };

    const toggleRowSelection = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedBulkIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // 🛡️ ENHANCED IDENTITY EXTRACTOR
    const getLeadInfo = (res: any) => {
        const val = res.values?.[0]?.value || res.values?.[1]?.value || "Lead Record";
        const email = res.values?.find((v: any) => v.value?.includes("@"))?.value;
        const phone = res.values?.find((v: any) => /^\d{10}$/.test(v.value?.replace(/[^0-9]/g, "")))?.value;
        const submitter = res.submittedByName || "Anonymous";

        return { name: val, email, phone, submitter };
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl pointer-events-auto animate-in fade-in duration-500" onClick={onClose} />

            <div className="relative w-full max-w-7xl h-[90vh] bg-white rounded-[48px] shadow-[0_40px_160px_-12px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden pointer-events-auto border border-white/20 animate-in zoom-in-95 fade-in duration-300">

                {/* 🏆 MODERN GLASS HEADER */}
                <div className="px-12 py-8 border-b border-slate-100 flex items-center justify-between bg-white/70 backdrop-blur-md shrink-0 z-20">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-200 group-hover:scale-105 transition-transform">
                            <Sparkles className="text-white" size={32} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Lead Matrix Pro</h2>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">Distribution Terminal</span>
                                {totalCount > filteredLeads.length && !allHubLeads && (
                                    <button
                                        onClick={handleLoadAll}
                                        disabled={isLoadingFull}
                                        className="flex items-center gap-2 text-[10px] font-black text-amber-600 hover:text-amber-700 transition-colors uppercase tracking-widest active:scale-95"
                                    >
                                        {isLoadingFull ? <Loader2 size={12} className="animate-spin" /> : <Users size={12} />}
                                        Full Matrix ({totalCount})
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner">
                            <button
                                onClick={() => setUnassignedOnly(false)}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!unassignedOnly ? 'bg-white text-indigo-600 shadow-xl border border-slate-200 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                All Sector
                            </button>
                            <button
                                onClick={() => setUnassignedOnly(true)}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${unassignedOnly ? 'bg-white text-orange-600 shadow-xl border border-slate-200 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Unassigned
                            </button>
                        </div>

                        <button onClick={onClose} className="w-14 h-14 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-[22px] border border-slate-100 transition-all flex items-center justify-center text-slate-400">
                            <X size={28} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden bg-slate-50">

                    {/* 👤 LEFT: ACTIVE LEADS CHANNEL */}
                    <div className="flex-1 flex flex-col border-r border-slate-200/40">
                        <div className="px-12 py-6 bg-white/40 border-b border-slate-200/40 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by name, contact or notes..."
                                    className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-3xl outline-none focus:ring-[12px] focus:ring-indigo-500/5 focus:border-indigo-600 font-bold text-slate-800 shadow-sm text-base transition-all placeholder:text-slate-300"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                    <button
                                        onClick={toggleSelectAll}
                                        className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${selectedBulkIds.size > 0 ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        Selected: {selectedBulkIds.size}
                                    </button>
                                    
                                    {selectedBulkIds.size > 0 && (
                                        <button
                                            onClick={handleBulkUnassign}
                                            disabled={isBulkAssigning}
                                            className="px-5 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-rose-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                                            title="Unassign All Selected"
                                        >
                                            {isBulkAssigning ? <Loader2 size={12} className="animate-spin" /> : <UserMinus size={14} />}
                                            Unassign
                                        </button>
                                    )}
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
                                        <input
                                            type="number"
                                            placeholder="QTY"
                                            value={customSelectCount}
                                            onChange={(e) => setCustomSelectCount(e.target.value)}
                                            className="w-16 px-3 py-1 bg-white border border-slate-200 rounded-xl text-[10px] font-black outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <button
                                            onClick={handleSelectSpecificCount}
                                            className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 active:scale-95 transition-all shadow-sm"
                                        >
                                            Select
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 space-y-6 scrollbar-none">
                            {filteredLeads.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-xl border border-slate-100 cursor-not-allowed">
                                        <Loader2 size={40} className="text-slate-200" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-400 tracking-tighter uppercase">No Active Sector Matches</h3>
                                    <p className="text-sm font-bold text-slate-300 uppercase tracking-widest mt-2">Scanner protocol yielded zero returns.</p>
                                </div>
                            ) : (
                                filteredLeads.map((res: any) => {
                                    const info = getLeadInfo(res);
                                    const currentAssigned = res.assignedTo || [];
                                    const isRowSelected = selectedBulkIds.has(res.id);

                                    return (
                                        <div key={res.id}
                                            onClick={() => toggleRowSelection(res.id)}
                                            className={`p-10 bg-white rounded-[40px] border transition-all duration-300 flex items-center gap-10 cursor-pointer shadow-sm relative group/lead overflow-hidden ${isRowSelected ? 'border-indigo-500 ring-[16px] ring-indigo-500/5 shadow-2xl scale-[1.01]' : 'border-slate-100 hover:border-indigo-100 hover:shadow-2xl'}`}
                                        >
                                            <div className="shrink-0 relative">
                                                <div className={`w-8 h-8 rounded-xl border-4 flex items-center justify-center transition-all ${isRowSelected ? 'bg-indigo-600 border-indigo-500 text-white scale-110' : 'border-slate-100 bg-slate-50 text-transparent group-hover/lead:border-indigo-200'}`}>
                                                    <CheckCircle2 size={16} />
                                                </div>
                                            </div>

                                            <div className="shrink-0">
                                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-inner transition-all transform group-hover/lead:scale-110 ${currentAssigned.length > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600 animate-pulse'}`}>
                                                    {currentAssigned.length > 0 ? <CheckCircle2 size={32} /> : <Phone size={32} />}
                                                </div>
                                            </div>


                                            <div className="flex-1">
                                                <div className="flex items-center gap-4 mb-3">
                                                    <h4 className="text-xl font-black text-slate-900 tracking-tight leading-none truncate group-hover/lead:text-indigo-600 transition-colors">{info.name}</h4>
                                                    {currentAssigned.length === 0 && (
                                                        <span className="px-3 py-1 bg-orange-600 text-white rounded-lg text-[8px] font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-100">Identity Pending</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-6 text-slate-400">
                                                    <div className="flex items-center gap-2 text-[11px] font-bold">
                                                        <Mail size={12} className="text-slate-300" /> {info.email || 'No email portal'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] font-bold">
                                                        <Clock size={12} className="text-slate-300" /> {res.submittedAt ? format(new Date(res.submittedAt), "MMM d, h:mm a") : 'Real-time Sync'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="shrink-0 flex items-center gap-4 border-l border-slate-50 pl-10">
                                                {currentAssigned.length > 0 ? (
                                                    <div className="flex items-center gap-3">
                                                        {currentAssigned.map((clerkId: string) => {
                                                            const member = teamMembers.find(t => t.clerkId === clerkId);
                                                            return (
                                                                <button
                                                                    key={clerkId}
                                                                    onClick={(e) => { e.stopPropagation(); handleToggleAssignment(res.id, currentAssigned, clerkId); }}
                                                                    className="group/agent relative"
                                                                >
                                                                    <div className="w-14 h-14 rounded-3xl bg-indigo-600 p-1 shadow-2xl shadow-indigo-100 flex items-center justify-center overflow-hidden border-2 border-white ring-4 ring-indigo-50 transition-all hover:scale-110">
                                                                        {member?.imageUrl ? <img src={member.imageUrl} className="w-full h-full object-cover rounded-2xl" /> : <Users className="text-white" size={24} />}
                                                                        <div className="absolute inset-0 bg-rose-600/90 flex items-center justify-center opacity-0 group-hover/agent:opacity-100 transition-opacity">
                                                                            <UserMinus className="text-white" size={20} />
                                                                        </div>
                                                                    </div>
                                                                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover/agent:opacity-100 transition-opacity translate-y-1 group-hover/agent:translate-y-0">
                                                                        {member?.firstName || 'Owner'}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mr-2">Quick Assign</div>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); /* Optional: Open picker */ }}
                                                            className="w-14 h-14 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:border-indigo-400 hover:text-indigo-600 hover:bg-white transition-all active:scale-95"
                                                        >
                                                            <UserPlus size={24} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* 🕵️ RIGHT: TARGET AGENT MATRIX */}
                    <div className="w-[420px] bg-white flex flex-col z-10 shadow-[-40px_0_80px_-20px_rgba(0,0,0,0.08)]">
                        <div className="p-10 border-b border-slate-50">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em]">
                                    {showHiddenView ? 'Hidden Operatives' : 'Elite Channel Managers'}
                                </h3>
                                {hiddenTeamMembers.size > 0 && (
                                    <button 
                                        onClick={() => setShowHiddenView(!showHiddenView)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showHiddenView ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white'}`}
                                    >
                                        {showHiddenView ? <Eye size={12} /> : <EyeOff size={12} />}
                                        {showHiddenView ? 'View Active' : `Manage Hidden (${hiddenTeamMembers.size})`}
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder={showHiddenView ? "Search hidden operatives..." : "Search by operative name..."}
                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[12px] font-black outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                    value={assigneeSearch}
                                    onChange={(e) => setAssigneeSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-none">
                            {filteredTeam.length === 0 && showHiddenView ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
                                        <Eye size={32} />
                                    </div>
                                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">Clean Roster</h4>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">No hidden operative assets identified.</p>
                                    <button onClick={() => setShowHiddenView(false)} className="mt-6 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Return to active matrix</button>
                                </div>
                            ) : (
                                filteredTeam.map((member) => {
                                    const memberLeads = (allHubLeads || responses).filter(r => (r.assignedTo || []).includes(member.clerkId)).length;
                                    const isSelected = selectedTeamIds.has(member.clerkId);
                                    const isHidden = hiddenTeamMembers.has(member.clerkId);

                                    return (
                                        <div key={member.clerkId}
                                            onClick={() => !isHidden && toggleTeamSelection(member.clerkId)}
                                            className={`p-6 rounded-[32px] border transition-all group/agent flex items-center gap-6 ${isHidden ? 'bg-slate-50/30 border-dashed border-slate-200 opacity-60' : isSelected ? 'bg-indigo-600 border-indigo-500 shadow-2xl shadow-indigo-200 cursor-pointer' : 'bg-slate-50/50 hover:bg-white border-transparent hover:border-indigo-100 cursor-pointer'}`}
                                        >
                                            <div className="relative">
                                                <div className={`w-16 h-16 rounded-[28px] bg-white border flex items-center justify-center overflow-hidden shadow-xl ring-4 ring-transparent transition-all ${isSelected ? 'border-white' : 'border-slate-200'}`}>
                                                    {member.imageUrl ? <img src={member.imageUrl} className="w-full h-full object-cover" /> : <Users className={isSelected ? "text-indigo-600" : isHidden ? "text-slate-100" : "text-slate-200"} size={32} />}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-4 border-white rounded-full ${isSelected ? 'bg-white text-indigo-600 flex items-center justify-center' : isHidden ? 'bg-slate-200' : 'bg-emerald-500'}`}>
                                                    {isSelected && <CheckCircle2 size={12} />}
                                                </div>
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <h6 className={`text-base font-black leading-none transition-colors ${isSelected ? 'text-white' : isHidden ? 'text-slate-400' : 'text-slate-900 group-hover/agent:text-indigo-600'}`}>
                                                        {member.firstName || member.email.split('@')[0]}
                                                    </h6>
                                                    {!isSelected && (
                                                        isHidden ? (
                                                            <button
                                                                onClick={(e) => unhideMember(member.clerkId, e)}
                                                                className="p-1.5 bg-white text-indigo-600 border border-slate-200 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                                title="Restore Operative"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => hideMember(member.clerkId, e)}
                                                                className="p-1.5 opacity-0 group-hover/agent:opacity-100 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                                title="Hide Permanente"
                                                            >
                                                                <EyeOff size={14} />
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest leading-none ${isSelected ? 'text-indigo-100' : isHidden ? 'text-slate-300' : 'text-slate-400'}`}>{memberLeads} Portfolio Depth</span>
                                                    <div className={`h-1 w-1 rounded-full ${isSelected ? 'bg-indigo-300' : 'bg-slate-300'}`} />
                                                    <span className={`text-[9px] font-black uppercase tracking-widest leading-none ${isSelected ? 'text-white' : isHidden ? 'text-slate-300' : 'text-emerald-500'}`}>
                                                        {isHidden ? 'Deactivated' : 'Online'}
                                                    </span>
                                                </div>
                                            </div>

                                            {selectedBulkIds.size > 0 && selectedTeamIds.size === 0 && !isHidden && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleBulkAssign(member.clerkId); }}
                                                    disabled={isBulkAssigning}
                                                    className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-110 active:scale-95 transition-all shadow-xl shadow-indigo-200 flex items-center gap-2"
                                                >
                                                    {isBulkAssigning ? <Loader2 size={12} className="animate-spin" /> : "Deploy Leads"}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        
                        {selectedBulkIds.size > 0 && selectedTeamIds.size > 1 && (
                            <div className="p-10 border-t border-slate-100 bg-indigo-50/30">
                                <button
                                    onClick={handleSequentialSync}
                                    disabled={isBulkAssigning}
                                    className="w-full p-8 bg-indigo-600 hover:bg-slate-900 text-white rounded-[40px] shadow-2xl shadow-indigo-200 relative overflow-hidden group active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-2"
                                >
                                    <div className="flex items-center gap-3">
                                        <Sparkles size={24} className={isBulkAssigning ? "animate-spin" : "animate-pulse"} />
                                        <span className="font-black text-lg uppercase tracking-[0.2em]">Sequential Sync</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">
                                        Distribute {selectedBulkIds.size} Leads among {selectedTeamIds.size} Agents
                                    </span>
                                </button>
                            </div>
                        )}

                    </div>
                </div>

                {/* 🛡️ SYSTEM FOOTER */}
                <div className="px-12 py-8 bg-white border-t border-slate-100 flex items-center justify-between z-20 shrink-0">
                    <div className="flex items-center gap-12">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 shadow-indigo-600 underline underline-offset-8 decoration-2">Distribution Integrity</span>
                            <span className="text-2xl font-black text-slate-900 tracking-tighter">{filteredLeads.length} <span className="text-xs text-slate-400 font-bold uppercase tracking-widest ml-1">Processed</span></span>
                        </div>
                        <div className="w-px h-12 bg-slate-200/60" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Global Operations</span>
                            <span className="text-2xl font-black text-slate-900 tracking-tighter">{teamMembers.length} <span className="text-xs text-slate-400 font-bold uppercase tracking-widest ml-1">Synced Assets</span></span>
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <button
                            onClick={onClose}
                            className="px-12 py-5 bg-slate-900 text-white rounded-[24px] text-[12px] font-black uppercase tracking-[0.4em] hover:bg-indigo-600 transition-all shadow-2xl active:scale-95 flex items-center gap-4"
                        >
                            Commit & Exit Matrix
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
