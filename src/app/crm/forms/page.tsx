"use client";

import React, { useEffect, useState } from "react";
import {
    Plus,
    FileText,
    MoreVertical,
    ExternalLink,
    Database,
    Trash2,
    Search,
    ChevronRight,
    LayoutDashboard,
    Clock,
    User,
    CheckCircle2,
    Copy,
    Share2,
    ShieldCheck,
    Check,
    X,
    UserPlus,
    Edit3,
    Pin,
    PinOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

import { useUser } from "@clerk/nextjs";

interface FormSummary {
    id: string;
    title: string;
    description: string;
    isPublished: boolean;
    createdAt: string;
    createdByName: string;
    _count: { responses: number };
    pinnedBy?: string[];
    visibleToRoles?: string[];
    visibleToUsers?: string[];
    visibleToUsersData?: { id: string; email: string; name: string; imageUrl: string }[];
}

export default function CRMFormsList() {
    const { user, isLoaded } = useUser();
    const [forms, setForms] = useState<FormSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [userRole, setUserRole] = useState<string>("GUEST");
    const [isMaster, setIsMaster] = useState(false);
    const [isPureMaster, setIsPureMaster] = useState(false);

    // Access Control States
    const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
    const [selectedFormForAccess, setSelectedFormForAccess] = useState<FormSummary | null>(null);
    const [permRoles, setPermRoles] = useState<string[]>([]);
    const [permUsers, setPermUsers] = useState<string[]>([]);
    const [accessUserSearch, setAccessUserSearch] = useState("");
    const [accessUserResults, setAccessUserResults] = useState<any[]>([]);
    const [isSavingAccess, setIsSavingAccess] = useState(false);

    // Form Access Info Modal State
    const [viewingForm, setViewingForm] = useState<FormSummary | null>(null);

    const getAccessInfo = (form: FormSummary) => {
        const roles = form.visibleToRoles || [];
        const users = form.visibleToUsers || [];
        if (roles.length === 0 && users.length === 0) return { type: "Public", icon: "🌍", color: "bg-emerald-50 text-emerald-700 border-emerald-100", desc: "Open to everyone" };
        if (roles.length > 0 && users.length === 0) return { type: "Team Access", icon: "👥", color: "bg-blue-50 text-blue-700 border-blue-100", desc: "Accessible to specific teams/roles" };
        if (users.length > 0) return { type: "Shared Users", icon: "👤+", color: "bg-purple-50 text-purple-700 border-purple-100", desc: "Accessible to specifically selected individuals" };
        return { type: "Private", icon: "🔒", color: "bg-rose-50 text-rose-700 border-rose-100", desc: "Private access only" };
    };

    // Sync isMaster check with Metadata (TeamBoard Logic)
    useEffect(() => {
        if (isLoaded && user) {
            const role = (user.publicMetadata?.role as string || "user").toUpperCase();
            setUserRole(role);
            if (role === "ADMIN" || role === "MASTER" || role === "TL") {
                setIsMaster(true);
            }
            if (role === "MASTER") {
                setIsPureMaster(true);
            }
        }
    }, [isLoaded, user]);

    const fetchForms = async () => {
        try {
            const res = await fetch(`/api/crm/forms?_t=${Date.now()}`, { cache: 'no-store' });
            const data = await res.json();
            setForms(data.forms || []);

            // Sync role states from API
            if (data.userRole) setUserRole(data.userRole);
            if (data.isMaster) setIsMaster(true);
            if (data.isPureMaster) setIsPureMaster(true);
        } catch (err) {
            toast.error("Failed to fetch forms");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAccessModal = (form: FormSummary) => {
        setSelectedFormForAccess(form);
        setPermRoles(form.visibleToRoles || []);
        setPermUsers(form.visibleToUsers || []);
        setIsAccessModalOpen(true);
    };

    const searchAccessUsers = async (q: string) => {
        setAccessUserSearch(q);
        if (q.length < 2) { setAccessUserResults([]); return; }
        try {
            const res = await fetch(`/api/crm/users?q=${q}`);
            const json = await res.json();
            setAccessUserResults(json);
        } catch (err) { console.error(err); }
    };

    const handleSavePermissions = async () => {
        if (!selectedFormForAccess) return;
        setIsSavingAccess(true);
        try {
            const res = await fetch(`/api/crm/forms/${selectedFormForAccess.id}/bulk/visibility`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "FORM",
                    visibleToRoles: permRoles,
                    visibleToUsers: permUsers
                })
            });
            if (res.ok) {
                toast.success("Form access rights updated");
                setIsAccessModalOpen(false);
                fetchForms();
            } else {
                const err = await res.json();
                toast.error(err.error || "Update failed");
            }
        } catch (err) {
            toast.error("Security sync failed");
        } finally {
            setIsSavingAccess(false);
        }
    };

    useEffect(() => {
        if (isLoaded && user) {
            fetchForms();
        } else if (isLoaded && !user) {
            // Wait for user or handle unauthenticated state if needed
            // But usually Clerk will redirect if protected
        }
    }, [isLoaded, user]);

    const copyToClipboard = (id: string) => {
        const url = `${window.location.origin}/f/${id}`;
        navigator.clipboard.writeText(url);
        toast.success("Public Link Copied!");
    };

    const togglePin = async (formId: string) => {
        try {
            const res = await fetch(`/api/crm/forms/${formId}/pin`, { method: "PATCH" });
            if (res.ok) {
                const json = await res.json();
                setForms(prev => prev.map(f =>
                    f.id === formId ? { ...f, pinnedBy: json.isPinned ? [...(f.pinnedBy || []), user?.id || ""] : (f.pinnedBy || []).filter(uid => uid !== user?.id) } : f
                ));
                toast.success(json.isPinned ? "Pinned to sidebar" : "Unpinned from sidebar", { icon: json.isPinned ? "📌" : undefined });
                window.dispatchEvent(new Event('pinnedFormsUpdated'));
            }
        } catch (err) {
            toast.error("Pin failed");
        }
    };

    const deleteForm = async (id: string) => {
        if (!confirm("Are you sure? All responses will be deleted.")) return;
        try {
            const res = await fetch(`/api/crm/forms/${id}`, { method: "DELETE" });
            if (res.ok) {
                setForms(forms.filter(f => f.id !== id));
                toast.success("Form deleted");
            }
        } catch (err) { toast.error("Delete failed"); }
    };

    const filteredForms = forms.filter(f =>
        f.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Container */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-slate-900 text-white rounded-[28px] shadow-2xl rotate-2">
                            <LayoutDashboard size={28} className="text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">CRM <span className="text-indigo-600">Forms</span></h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.25em]">Response Collection Hub</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search forms..."
                                className="pl-12 pr-6 py-4 bg-white border-2 border-slate-50 rounded-2xl shadow-sm focus:border-indigo-600 outline-none font-bold text-slate-600 w-[300px] transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {isMaster && (
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/crm/admin/leads"
                                    className="px-8 py-4 bg-white text-indigo-600 border-2 border-slate-50 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-indigo-100 shadow-sm transition-all flex items-center gap-2"
                                >
                                    <ShieldCheck size={18} /> Lead Terminal
                                </Link>
                                <Link
                                    href="/crm/forms/new"
                                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2"
                                >
                                    <Plus size={18} /> Build New Form
                                </Link>
                            </div>
                        )}
                    </div>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scanning Repositories...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence>
                            {filteredForms.map((form) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={form.id}
                                    className="bg-white rounded-[40px] border-2 border-white shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all group overflow-hidden"
                                >
                                    <div className="p-8">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                <FileText size={24} />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col items-end gap-2">
                                                    {form.isPublished && (
                                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100 rounded-full flex items-center gap-1.5 self-start shadow-sm">
                                                            <CheckCircle2 size={10} /> Live
                                                        </span>
                                                    )}
                                                    {(() => {
                                                        const accessInfo = getAccessInfo(form);
                                                        return (
                                                            <button
                                                                onClick={() => setViewingForm(form)}
                                                                className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest border rounded-full flex items-center gap-1.5 transition-all hover:scale-105 shadow-sm bg-white ${accessInfo.color}`}
                                                                title={accessInfo.desc}
                                                            >
                                                                <span className="text-[12px] leading-none mb-0.5">{accessInfo.icon}</span> {accessInfo.type}
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="flex items-center gap-1 self-start">
                                                    <button
                                                        onClick={() => togglePin(form.id)}
                                                        className={`p-3 rounded-xl transition-all ${form.pinnedBy?.includes(user?.id || "") ? 'text-indigo-600 bg-indigo-50' : 'text-slate-200 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                                        title={form.pinnedBy?.includes(user?.id || "") ? "Unpin from sidebar" : "Pin to sidebar"}
                                                    >
                                                        {form.pinnedBy?.includes(user?.id || "") ? <Pin className="fill-current" size={16} /> : <PinOff size={16} />}
                                                    </button>

                                                    {isMaster && (
                                                        <>
                                                            <button
                                                                onClick={() => handleOpenAccessModal(form)}
                                                                className="p-3 text-slate-200 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                                title="Access Control"
                                                            >
                                                                <ShieldCheck size={16} />
                                                            </button>
                                                            <button onClick={() => deleteForm(form.id)} className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-black text-slate-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">{form.title}</h3>
                                        <p className="text-slate-400 text-sm font-medium line-clamp-2 mb-8">{form.description || "No description provided."}</p>

                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Submissions</p>
                                                <p className="text-lg font-black text-slate-900">{form._count.responses}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Status</p>
                                                <p className={`text-sm font-black uppercase ${form.isPublished ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                    {form.isPublished ? "Public" : "Draft"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Shelf */}
                                        <div className="flex items-center gap-2">
                                            <Link
                                                prefetch={false}
                                                href={`/crm/forms/${form.id}/responses`}
                                                className="flex-1 py-4 bg-slate-900 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all"
                                            >
                                                <Database size={14} className="text-indigo-400" /> View Data
                                            </Link>
                                            {isMaster && (
                                                <Link
                                                    href={`/crm/forms/new?edit=${form.id}`}
                                                    className="p-4 bg-indigo-50 text-indigo-600 rounded-[20px] hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                    title="Edit Form"
                                                >
                                                    <Edit3 size={16} />
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => copyToClipboard(form.id)}
                                                className="p-4 bg-slate-100 text-slate-500 rounded-[20px] hover:bg-indigo-600 hover:text-white transition-all shadow-lg shadow-slate-200"
                                                title="Copy Live Link"
                                            >
                                                <Share2 size={16} />
                                            </button>
                                            <Link
                                                href={`/f/${form.id}`}
                                                target="_blank"
                                                className="p-4 bg-white border-2 border-slate-50 text-slate-400 rounded-[20px] hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                                                title="Preview Live"
                                            >
                                                <ExternalLink size={16} />
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase">
                                            <Clock size={12} /> {formatDistanceToNow(new Date(form.createdAt))} ago
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase">
                                            <User size={12} /> {form.createdByName}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {filteredForms.length === 0 && !loading && (
                    <div className="text-center py-40 bg-white rounded-[40px] border-4 border-dashed border-slate-100">
                        <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-8">
                            <FileText size={48} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900">No Forms Found</h2>
                        <p className="text-slate-400 font-bold max-w-sm mx-auto mt-2">Start by creating your first dynamic form to collect data from your team or clients.</p>
                        {isMaster && (
                            <Link
                                href="/crm/forms/new"
                                className="mt-10 inline-flex px-10 py-5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-2xl transition-all"
                            >
                                <Plus size={20} className="mr-2" /> Build Now
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Access Control Modal */}
            <AnimatePresence>
                {isAccessModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAccessModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white"
                        >
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Access Control</h2>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[200px]">{selectedFormForAccess?.title}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsAccessModalOpen(false)} className="p-4 hover:bg-slate-50 rounded-[20px] text-slate-400 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {/* Roles Section */}
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                        <Database size={12} /> Institutional Roles
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {["ADMIN", "MASTER", "MANAGER", "SELLER", "INTERN", "TL"].map(role => {
                                            const isSelected = permRoles.includes(role);
                                            return (
                                                <button
                                                    key={role}
                                                    onClick={() => setPermRoles(prev => isSelected ? prev.filter(r => r !== role) : [...prev, role])}
                                                    className={`px-4 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between border-2 transition-all ${isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200' : 'bg-white text-slate-400 border-slate-50 hover:border-slate-100 hover:bg-slate-50'}`}
                                                >
                                                    {role}
                                                    {isSelected ? <Check size={14} className="text-indigo-400" /> : <Plus size={14} className="opacity-20" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="mt-4 text-[9px] text-slate-300 font-bold uppercase leading-relaxed italic">MASTER role always retains absolute administrative visibility over all repositories.</p>
                                </div>

                                {/* Personalized Exceptions */}
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                        <UserPlus size={12} /> Personalized Exceptions
                                    </h4>
                                    <div className="relative mb-4">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            value={accessUserSearch}
                                            onChange={(e) => searchAccessUsers(e.target.value)}
                                            placeholder="Search by name or email..."
                                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-50 rounded-2xl text-[11px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-slate-50 transition-all placeholder:text-slate-300"
                                        />
                                        <AnimatePresence>
                                            {accessUserResults.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-[30px] shadow-2xl z-50 overflow-hidden"
                                                >
                                                    {accessUserResults.map(u => (
                                                        <button
                                                            key={u.clerkId}
                                                            onClick={() => {
                                                                if (!permUsers.includes(u.clerkId)) {
                                                                    setPermUsers(prev => [...prev, u.clerkId]);
                                                                }
                                                                setAccessUserSearch("");
                                                                setAccessUserResults([]);
                                                            }}
                                                            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black">{u.email[0].toUpperCase()}</div>
                                                                <div className="text-left">
                                                                    <p className="text-[11px] font-bold text-slate-900 truncate w-[200px]">{u.email}</p>
                                                                    <p className="text-[9px] text-slate-400 uppercase tracking-tighter">Authorized Identity</p>
                                                                </div>
                                                            </div>
                                                            <Plus size={14} className="text-slate-300" />
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-[30px] border border-dashed border-slate-200 min-h-[60px]">
                                        {permUsers.length === 0 && <p className="text-[10px] text-slate-400 font-bold m-auto uppercase tracking-widest">No individual overrides</p>}
                                        {permUsers.map(uid => (
                                            <div key={uid} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm group">
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter shrink-0">{uid.slice(0, 12)}...</span>
                                                <button
                                                    onClick={() => setPermUsers(prev => prev.filter(id => id !== uid))}
                                                    className="p-1 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <X size={12} className="text-slate-400 hover:text-rose-500" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 flex items-center gap-4">
                                <button
                                    onClick={() => setIsAccessModalOpen(false)}
                                    className="flex-1 py-4 bg-white text-slate-400 border-2 border-slate-200/50 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:text-slate-900 hover:border-slate-300 transition-all"
                                >
                                    Revoke
                                </button>
                                <button
                                    onClick={handleSavePermissions}
                                    disabled={isSavingAccess}
                                    className="flex-[2] py-4 bg-slate-900 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                                >
                                    {isSavingAccess ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <ShieldCheck size={16} className="text-indigo-400" /> Commit Protocol
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View Access Details Dashboard Modal */}
            <AnimatePresence>
                {viewingForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setViewingForm(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-[400px] bg-white rounded-[32px] shadow-2xl p-8 border border-white"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-[20px] shadow-sm">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tighter">Access Details</h3>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1 truncate max-w-[150px]">{viewingForm.title}</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingForm(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-[20px] transition-all">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-5 bg-slate-50 rounded-[24px] flex items-center justify-between border border-slate-100 shadow-sm">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Owner / Creator</p>
                                        <p className="font-bold text-slate-900">{viewingForm.createdByName || "Unknown"}</p>
                                    </div>
                                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black">
                                        {(viewingForm.createdByName || "U")[0].toUpperCase()}
                                    </div>
                                </div>

                                <div className="p-5 bg-slate-50 rounded-[24px] flex items-center justify-between border border-slate-100 shadow-sm">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Access Protocol</p>
                                        <p className={`font-black uppercase tracking-widest text-[11px] flex items-center gap-2 ${getAccessInfo(viewingForm!).color.replace('bg-', 'text-').split(' ')[1]}`}>
                                            <span className="text-base">{getAccessInfo(viewingForm!).icon}</span> {getAccessInfo(viewingForm!).type}
                                        </p>
                                    </div>
                                </div>

                                {(viewingForm.visibleToRoles && viewingForm.visibleToRoles.length > 0) && (
                                    <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Database size={12} /> Authorized Teams
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {viewingForm.visibleToRoles.map(r => (
                                                <span key={r} className="px-4 py-2 bg-white border border-slate-200 text-indigo-700 text-[10px] font-black rounded-xl uppercase tracking-widest shadow-sm">{r}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(viewingForm.visibleToUsersData && viewingForm.visibleToUsersData.length > 0) && (
                                    <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <UserPlus size={12} /> Isolated Users
                                        </p>
                                        <div className="flex flex-col gap-3">
                                            {viewingForm.visibleToUsersData.map(u => (
                                                <div key={u.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-[16px] shadow-sm">
                                                    {u.imageUrl ? (
                                                        <img src={u.imageUrl} alt={u.name} className="w-8 h-8 rounded-full shadow-sm object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-[10px] shadow-sm">
                                                            {(u.name && u.name !== "Unknown User") ? u.name[0].toUpperCase() : u.email[0].toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-[11px] font-black text-slate-900 truncate">{u.name}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 truncate">{u.email}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase tracking-tighter">* Database ID overrides mapped.</p>
                                        </div>
                                    </div>
                                )}

                                {(!viewingForm.visibleToRoles?.length && !viewingForm.visibleToUsers?.length) && (
                                    <div className="p-8 bg-emerald-50 rounded-[24px] border border-emerald-100 text-center shadow-sm">
                                        <span className="text-4xl mb-3 block animate-bounce">🌍</span>
                                        <p className="text-[12px] font-black text-emerald-700 uppercase tracking-widest">Public Domain</p>
                                        <p className="text-[10px] text-emerald-600/80 font-bold max-w-[200px] mx-auto mt-2 leading-relaxed">This matrix is accessible to anyone with the appropriate routing link.</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setViewingForm(null)}
                                className="w-full mt-8 py-5 bg-slate-900 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
                            >
                                Acknowledge & Close
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div >
    );
}
