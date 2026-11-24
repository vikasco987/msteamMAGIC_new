'use client';

import { useUnifiedAuth as useUser } from "@/lib/useUnifiedAuth";
import { useEffect, useState, use, useMemo } from 'react';
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Mail,
    Phone,
    Shield,
    Lock,
    Save,
    Check,
    X,
    Loader2,
    Activity,
    History,
    Key,
    Eye,
    EyeOff,
    Code,
    Monitor,
    Globe,
    Plus,
    Trash2,
    ShieldAlert,
    Copy,
    Upload,
    Calendar,
    Briefcase,
    Building2,
    Sliders,
    Sparkles,
    UserCheck,
    RotateCcw,
    CheckSquare,
    Square,
    Laptop,
    Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// --- SYSTEM MODULES FOR GRANULAR ACCESS CONTROL ---
const SYSTEM_MODULES = [
    { group: "Core Operations", name: "Main Dashboard", path: "/" },
    { group: "Core Operations", name: "Team Board", path: "/team-board" },
    { group: "Core Operations", name: "Create Task", path: "/create-task" },
    { group: "Core Operations", name: "Assigned Task Report", path: "/report" },
    { group: "Core Operations", name: "Personal Profile (My Details)", path: "/my-details" },

    { group: "Revenue & Sales", name: "Sales Matrix", path: "/sales-dashboard" },
    { group: "Revenue & Sales", name: "Team Sales Terminal", path: "/tl-dashboard" },
    { group: "Revenue & Sales", name: "Seller Dashboard", path: "/seller/dashboard" },
    { group: "Revenue & Sales", name: "Payment Portal (Magic Scale)", path: "/payment-portal" },
    { group: "Revenue & Sales", name: "Onboard Portal", path: "/payment-portal-2" },
    { group: "Revenue & Sales", name: "Financial Ecosystem Report", path: "/admin/reports/payments" },
    { group: "Revenue & Sales", name: "Profit & Loss Hub", path: "/dashboard/profit-loss" },

    { group: "CRM & Field Operations", name: "CRM Dynamic Forms", path: "/crm/forms" },
    { group: "CRM & Field Operations", name: "Lead Terminal", path: "/crm/admin/leads" },
    { group: "CRM & Field Operations", name: "Follow-up Board", path: "/dashboard/followups" },
    { group: "CRM & Field Operations", name: "Call Reports", path: "/call-report" },
    { group: "CRM & Field Operations", name: "KAM Strategy", path: "/kam" },
    { group: "CRM & Field Operations", name: "Recovery Hub", path: "/payments/recovery" },

    { group: "Operations & HR", name: "Attendance Console", path: "/dashboard/attendance" },
    { group: "Operations & HR", name: "Tish Presence Monitor", path: "/dashboard/attendance/tish" },
    { group: "Operations & HR", name: "Activity Stream", path: "/activities" },
    { group: "Operations & HR", name: "Payroll Management", path: "/admin/payroll" },
    { group: "Operations & HR", name: "Access Commander (Roles & Permissions)", path: "/admin/roles" },
    { group: "Operations & HR", name: "System Settings", path: "/admin/settings" }
];

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
    const resolvedParams = use(params as any) as { id: string };
    const id = resolvedParams.id;
    const router = useRouter();
    const { user: currentUser, isLoaded } = useUser();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'organizations' | 'devices' | 'settings' | 'activity'>('profile');

    const [userData, setUserData] = useState<any>(null);
    const [profileData, setProfileData] = useState<any>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [activeHours, setActiveHours] = useState<number[]>(new Array(24).fill(0));
    const [recentActivities, setRecentActivities] = useState<any[]>([]);

    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showJson, setShowJson] = useState(false);

    // Impersonation state
    const [impersonating, setImpersonating] = useState(false);
    const [showImpersonateModal, setShowImpersonateModal] = useState(false);
    const [impersonateReason, setImpersonateReason] = useState("");

    // Custom Permissions Modal
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [userPaths, setUserPaths] = useState<string[]>([]);

    // Secondary Contact Modals
    const [showAddEmail, setShowAddEmail] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [showAddPhone, setShowAddPhone] = useState(false);
    const [newPhone, setNewPhone] = useState("");

    // Form fields
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        role: "USER",
        isDisabled: false,
        isVerified: false,
        department: "Digital",
        designation: "",
        employmentStatus: "Active",
        joiningDate: "",
        alternateEmail: "",
        alternatePhone: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        password: ""
    });

    const [initialState, setInitialState] = useState<any>(null);

    const isDirty = useMemo(() => {
        if (!initialState) return false;
        return (
            form.name !== initialState.name ||
            form.email !== initialState.email ||
            form.phone !== initialState.phone ||
            form.role !== initialState.role ||
            form.isDisabled !== initialState.isDisabled ||
            form.isVerified !== initialState.isVerified ||
            form.department !== initialState.department ||
            form.designation !== initialState.designation ||
            form.employmentStatus !== initialState.employmentStatus ||
            form.joiningDate !== initialState.joiningDate ||
            form.password !== ""
        );
    }, [form, initialState]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    useEffect(() => {
        if (isLoaded) {
            if (!currentUser) {
                toast.error("Please login to access this page");
                router.push('/admin/roles');
                return;
            }
            const currentRole = String(currentUser.publicMetadata?.role || 'user').toLowerCase();
            if (currentRole !== 'master' && currentRole !== 'admin') {
                toast.error("Access Denied: Only MASTER or ADMIN can view personnel details");
                router.push('/admin/roles');
                return;
            }
            fetchUserDetails();
        }
    }, [id, isLoaded, currentUser]);

    const fetchUserDetails = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/users/manage/${id}`);
            if (!res.ok) {
                const err = await res.json();
                toast.error(err.error || "Failed to load user details");
                return;
            }

            const data = await res.json();
            const u = data.user || {};
            const p = data.profile || {};

            setUserData(u);
            setProfileData(p);
            setAuditLogs(data.auditLogs || []);
            setActiveHours(data.activity?.activeHours || new Array(24).fill(0));
            setRecentActivities(data.activity?.recentActivities || []);
            setUserPaths(u.allowedPaths || []);

            const initialForm = {
                name: u.name || "",
                email: u.email || "",
                phone: u.phone || "",
                role: u.role || "USER",
                isDisabled: Boolean(u.isDisabled),
                isVerified: Boolean(u.isVerified),
                department: p.department || u.currentDepartment || "Digital",
                designation: p.designation || "",
                employmentStatus: p.employmentStatus || "Active",
                joiningDate: p.joiningDate ? new Date(p.joiningDate).toISOString().split('T')[0] : "",
                alternateEmail: p.alternateEmail || "",
                alternatePhone: p.alternatePhone || "",
                emergencyContactName: p.emergencyContactName || "",
                emergencyContactPhone: p.emergencyContactPhone || "",
                password: ""
            };

            setForm(initialForm);
            setInitialState(initialForm);

        } catch (error) {
            console.error("fetchUserDetails error:", error);
            toast.error("Error loading user profile");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/manage/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const result = await res.json();
            if (!res.ok) {
                toast.error(result.error || "Failed to update profile");
                return;
            }

            toast.success("Profile saved successfully");
            setIsEditing(false);
            fetchUserDetails();
        } catch {
            toast.error("Network error while saving");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async () => {
        const nextStatus = !userData.isDisabled;
        const confirmMsg = nextStatus 
            ? `Are you sure you want to suspend ${userData.name || userData.email}? They will be blocked from logging into the platform.`
            : `Are you sure you want to activate ${userData.name || userData.email}?`;

        if (!confirm(confirmMsg)) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/manage/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isDisabled: nextStatus })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(nextStatus ? "Account suspended" : "Account activated");
                fetchUserDetails();
            } else {
                toast.error(data.error || "Failed to update status");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setSaving(false);
        }
    };

    const handleLogoutEverywhere = async () => {
        if (!confirm(`Revoke all active sessions for ${userData.name || userData.email}? All currently authenticated devices will be forced to log in again.`)) {
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/manage/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ revokeAllSessions: true })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("All sessions revoked successfully");
                fetchUserDetails();
            } else {
                toast.error(data.error || "Failed to revoke sessions");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setSaving(false);
        }
    };

    const handleAddSecondaryIdentifier = async (type: 'email' | 'phone') => {
        const val = type === 'email' ? newEmail.trim().toLowerCase() : newPhone.trim();
        if (!val) return;

        setSaving(true);
        try {
            const currentList = type === 'email' 
                ? (userData.secondaryEmails || []) 
                : (userData.secondaryPhones || []);

            if (currentList.includes(val) || (type === 'email' && val === userData.email) || (type === 'phone' && val === userData.phone)) {
                toast.error(`This ${type} is already added`);
                return;
            }

            const updatedList = [...currentList, val];
            const payload = type === 'email' 
                ? { secondaryEmails: updatedList }
                : { secondaryPhones: updatedList };

            const res = await fetch(`/api/admin/users/manage/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success(`${type === 'email' ? 'Email address' : 'Phone number'} added`);
                if (type === 'email') { setNewEmail(""); setShowAddEmail(false); }
                else { setNewPhone(""); setShowAddPhone(false); }
                fetchUserDetails();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to add identifier");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveSecondaryIdentifier = async (type: 'email' | 'phone', val: string) => {
        if (!confirm(`Remove ${val}? This secondary ${type} will no longer be linked to this account.`)) return;

        setSaving(true);
        try {
            const currentList = type === 'email' 
                ? (userData.secondaryEmails || []) 
                : (userData.secondaryPhones || []);

            const updatedList = currentList.filter((item: string) => item !== val);
            const payload = type === 'email' 
                ? { secondaryEmails: updatedList }
                : { secondaryPhones: updatedList };

            const res = await fetch(`/api/admin/users/manage/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success(`Removed ${val}`);
                fetchUserDetails();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to remove");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setSaving(false);
        }
    };

    const handleSavePermissions = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/manage/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ allowedPaths: userPaths })
            });

            if (res.ok) {
                toast.success("Granular permissions updated");
                setShowPermissionsModal(false);
                fetchUserDetails();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to save permissions");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setSaving(false);
        }
    };

    const handleImpersonate = async () => {
        if (!impersonateReason || impersonateReason.trim().length < 5) {
            toast.error("Please enter a mandatory audit reason (minimum 5 characters)");
            return;
        }

        setImpersonating(true);
        try {
            const res = await fetch("/api/admin/users/impersonate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetUserId: userData.clerkId,
                    reason: impersonateReason.trim()
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(`Logging in as ${userData.name || userData.email}...`);
                window.location.href = data.redirect || "/";
            } else {
                toast.error(data.error || "Impersonation failed");
            }
        } catch {
            toast.error("Network error during impersonation");
        } finally {
            setImpersonating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0f12] flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="animate-spin text-indigo-500 mb-4" size={36} />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading Enterprise Personnel Profile...</p>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="min-h-screen bg-[#0f0f12] flex flex-col items-center justify-center text-slate-400 p-6">
                <ShieldAlert className="text-rose-500 mb-4" size={48} />
                <h2 className="text-lg font-bold text-white mb-2">User Not Found</h2>
                <p className="text-xs text-slate-500 mb-6">The specified user profile could not be located in the primary database.</p>
                <button
                    onClick={() => router.push('/admin/roles')}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/5"
                >
                    Return to Personnel Center
                </button>
            </div>
        );
    }

    const maxHourValue = Math.max(...activeHours, 1);
    const hasOverrides = (userData.allowedPaths || []).length > 0;

    return (
        <div className="min-h-screen bg-[#0f0f12] text-slate-200 font-sans selection:bg-indigo-500/30">
            {/* TOP HEADER */}
            <header className="border-b border-white/5 bg-[#0f0f12]/80 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push("/admin/roles")}
                            className="p-2 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white border border-transparent hover:border-white/5"
                            title="Back to Personnel Center"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/20">
                                {userData.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-sm font-bold text-white tracking-tight">{userData.name || "Personnel User"}</h1>
                                    {userData.isDisabled && (
                                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 text-[9px] font-black uppercase tracking-wider rounded border border-rose-500/20">
                                            Suspended
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {userData.id}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowJson(true)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 text-slate-300"
                        >
                            <Code size={12} /> Show JSON
                        </button>
                        <button
                            onClick={() => router.push('/admin/roles')}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-[10px] font-bold transition-all text-white shadow-lg shadow-indigo-500/20"
                        >
                            Access Commander
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT CONTAINER */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* NAVIGATION TABS */}
                <nav className="flex items-center gap-8 border-b border-white/5 mb-8 overflow-x-auto scrollbar-none">
                    {[
                        { id: 'profile', label: 'Profile', icon: Activity },
                        { id: 'organizations', label: 'Organizations', icon: Building2 },
                        { id: 'devices', label: 'Devices', icon: Monitor },
                        { id: 'settings', label: 'Settings', icon: Sliders },
                        { id: 'activity', label: 'Activity & Security', icon: History }
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`pb-3.5 text-xs font-bold uppercase tracking-wider relative transition-all whitespace-nowrap flex items-center gap-2 ${
                                    isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <Icon size={14} className={isActive ? 'text-indigo-400' : 'text-slate-600'} />
                                <span>{tab.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="tab-underline"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* LEFT MAIN COLUMN */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* ===================== TAB 1: PROFILE ===================== */}
                        {activeTab === 'profile' && (
                            <>
                                {/* 24-HOUR USER ACTIVITY SECTION */}
                                <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-2xl">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <Activity size={14} className="text-indigo-400" /> User Activity
                                            </h2>
                                            <p className="text-[10px] font-bold text-slate-500 mt-1">
                                                Based on verified presence and authentication check-in telemetry
                                            </p>
                                        </div>
                                        <div className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-lg">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Most Active Hours</span>
                                        </div>
                                    </div>

                                    {/* 24-Hour Activity Graph */}
                                    <div className="flex items-end h-32 gap-1 pt-4">
                                        {activeHours.map((val, hour) => {
                                            const heightPercent = (val / maxHourValue) * 100;
                                            return (
                                                <div key={hour} className="flex-1 flex flex-col justify-end items-center group relative">
                                                    {val > 0 && (
                                                        <div className="absolute -top-7 bg-white text-black text-[9px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap shadow-md">
                                                            {hour}:00 - {val} events
                                                        </div>
                                                    )}
                                                    <div
                                                        className={`w-full rounded-t-sm transition-all duration-300 ${
                                                            val > 0
                                                                ? 'bg-indigo-500 group-hover:bg-indigo-400 cursor-pointer shadow-[0_0_8px_rgba(99,102,241,0.3)]'
                                                                : 'bg-white/[0.03]'
                                                        }`}
                                                        style={{ height: val > 0 ? `${Math.max(12, heightPercent)}%` : '8%' }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between mt-3 text-[9px] font-black text-slate-500 uppercase tracking-widest border-t border-white/5 pt-2.5">
                                        <span>12 AM</span>
                                        <span>6 AM</span>
                                        <span>12 PM</span>
                                        <span>6 PM</span>
                                        <span>11 PM</span>
                                    </div>
                                </section>

                                {/* PERSONAL & EMPLOYEE INFORMATION SECTION */}
                                <section className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                                    <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                                        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Personal Information</h2>
                                        {isDirty && (
                                            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                                Unsaved Changes
                                            </span>
                                        )}
                                    </div>

                                    <div className="p-6 space-y-6">
                                        {/* Avatar row */}
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/20">
                                                {userData.name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <button
                                                    onClick={() => toast("Profile photo upload uses cloud storage pipeline", { icon: "ℹ️" })}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold transition-all text-slate-400 hover:text-white"
                                                >
                                                    <Upload size={12} /> Update Avatar
                                                </button>
                                                <p className="text-[9px] text-slate-500 mt-1">Accepts PNG, JPG or WEBP under 2MB</p>
                                            </div>
                                        </div>

                                        {/* Form Fields */}
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1">Full Name</label>
                                                <input
                                                    type="text"
                                                    disabled={!isEditing}
                                                    value={form.name}
                                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50 text-white"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1">Contact Phone</label>
                                                <input
                                                    type="tel"
                                                    disabled={!isEditing}
                                                    value={form.phone}
                                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50 text-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-6 pt-2">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1">Department</label>
                                                <select
                                                    disabled={!isEditing}
                                                    value={form.department}
                                                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                                                    className="w-full bg-[#16161a] border border-white/5 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50 text-white"
                                                >
                                                    {['Digital', 'Sales', 'Retention', 'Operations', 'KAM', 'HR', 'Finance', 'Tech'].map(d => (
                                                        <option key={d} value={d}>{d}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1">Designation</label>
                                                <input
                                                    type="text"
                                                    disabled={!isEditing}
                                                    value={form.designation}
                                                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                                                    placeholder="e.g. Senior Account Specialist"
                                                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50 text-white"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1">Employment Status</label>
                                                <select
                                                    disabled={!isEditing}
                                                    value={form.employmentStatus}
                                                    onChange={(e) => setForm({ ...form, employmentStatus: e.target.value })}
                                                    className="w-full bg-[#16161a] border border-white/5 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50 text-white"
                                                >
                                                    {['Active', 'Notice Period', 'Inactive', 'Suspended'].map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* SYSTEM ROLE SELECTION & PERMISSIONS */}
                                        <div className="pt-6 border-t border-white/5 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Role</h3>
                                                <span className="text-[8px] font-black px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20 uppercase">
                                                    Current: {form.role}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {['MASTER', 'ADMIN', 'TL', 'SELLER', 'USER', 'GUEST', 'MANAGER', 'INTERN'].map((r) => (
                                                    <button
                                                        key={r}
                                                        type="button"
                                                        onClick={() => {
                                                            if (isEditing) setForm({ ...form, role: r });
                                                        }}
                                                        disabled={!isEditing}
                                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                                            form.role === r
                                                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                                                                : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/10'
                                                        } ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                                                    >
                                                        {r}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Role permissions card */}
                                            <div className="mt-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                                                <div>
                                                    <p className="text-[11px] font-bold text-slate-300">Role Permissions</p>
                                                    <p className="text-[10px] text-slate-500 mt-1 max-w-sm">
                                                        {hasOverrides
                                                            ? `Custom granular overrides active (${userData.allowedPaths.length} route modules permitted).`
                                                            : `This user's access is currently managed by their default ${form.role} protocol.`}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setShowPermissionsModal(true)}
                                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                                                        hasOverrides
                                                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
                                                            : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                                                    }`}
                                                >
                                                    {hasOverrides ? "Edit Overrides" : "Customize"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="pt-4 flex justify-end gap-3">
                                            {!isEditing ? (
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                                                >
                                                    Edit Profile
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setIsEditing(false);
                                                            if (initialState) setForm(initialState);
                                                        }}
                                                        className="px-5 py-2.5 bg-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSaveProfile}
                                                        disabled={saving}
                                                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all flex items-center gap-2"
                                                    >
                                                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                                        Save Changes
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* MULTIPLE EMAIL & PHONE SECTION */}
                                    <div className="p-6 border-t border-white/5 bg-black/20 space-y-8">
                                        {/* EMAIL ADDRESSES */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Addresses</h3>
                                                <button
                                                    onClick={() => setShowAddEmail(true)}
                                                    className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-[10px] font-bold transition-all"
                                                >
                                                    <Plus size={14} /> Add email
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                {/* Primary Email */}
                                                <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5 rounded-xl group">
                                                    <div className="flex items-center gap-3">
                                                        <Mail size={14} className="text-slate-500" />
                                                        <span className="text-xs font-bold text-white font-mono">{userData.email}</span>
                                                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded border border-emerald-500/20">
                                                            Primary
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCopy(userData.email, 'Email address')}
                                                        className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        title="Copy email"
                                                    >
                                                        <Copy size={12} />
                                                    </button>
                                                </div>

                                                {/* Secondaries */}
                                                {(userData.secondaryEmails || []).map((secEmail: string) => (
                                                    <div key={secEmail} className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/5 rounded-xl group hover:bg-white/[0.02] transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <Mail size={14} className="text-slate-500" />
                                                            <span className="text-xs font-bold text-slate-300 font-mono">{secEmail}</span>
                                                            <span className="px-2 py-0.5 bg-white/5 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded border border-white/5">
                                                                Secondary
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button
                                                                onClick={() => handleCopy(secEmail, 'Email address')}
                                                                className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg transition-all"
                                                                title="Copy email"
                                                            >
                                                                <Copy size={12} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveSecondaryIdentifier('email', secEmail)}
                                                                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-all"
                                                                title="Remove email"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* PHONE NUMBERS */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone Numbers</h3>
                                                <button
                                                    onClick={() => setShowAddPhone(true)}
                                                    className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-[10px] font-bold transition-all"
                                                >
                                                    <Plus size={14} /> Add phone
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                {/* Primary Phone */}
                                                {userData.phone && (
                                                    <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5 rounded-xl group">
                                                        <div className="flex items-center gap-3">
                                                            <Phone size={14} className="text-slate-500" />
                                                            <span className="text-xs font-bold text-white font-mono">{userData.phone}</span>
                                                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded border border-emerald-500/20">
                                                                Primary
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleCopy(userData.phone, 'Phone number')}
                                                            className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                            title="Copy phone"
                                                        >
                                                            <Copy size={12} />
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Secondaries */}
                                                {(userData.secondaryPhones || []).map((secPhone: string) => (
                                                    <div key={secPhone} className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/5 rounded-xl group hover:bg-white/[0.02] transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <Phone size={14} className="text-slate-500" />
                                                            <span className="text-xs font-bold text-slate-300 font-mono">{secPhone}</span>
                                                            <span className="px-2 py-0.5 bg-white/5 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded border border-white/5">
                                                                Secondary
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button
                                                                onClick={() => handleCopy(secPhone, 'Phone number')}
                                                                className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg transition-all"
                                                                title="Copy phone"
                                                            >
                                                                <Copy size={12} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveSecondaryIdentifier('phone', secPhone)}
                                                                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-all"
                                                                title="Remove phone"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* PASSWORD & SECURITY SECTION */}
                                <section className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                                    <div className="p-6 border-b border-white/5 bg-white/[0.01]">
                                        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Key size={14} className="text-indigo-400" /> Password & Security
                                        </h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl mb-6 flex gap-3.5">
                                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                                                <Lock size={16} />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-bold text-amber-400">Security Notice</h3>
                                                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                                                    Changing a user's password will immediately invalidate all active sessions across web and mobile terminals. The user will be required to authenticate anew.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 max-w-lg">
                                            <label className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1">New Password</label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        value={form.password}
                                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                                        placeholder="Set a new secure password"
                                                        className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500/50 transition-all text-white font-mono"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white transition-all"
                                                    >
                                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const randomPass = Math.random().toString(36).slice(-8) + "!K" + Math.floor(Math.random() * 899 + 100);
                                                        setForm({ ...form, password: randomPass });
                                                        setShowPassword(true);
                                                        toast.success("Random strong password generated");
                                                    }}
                                                    className="px-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-bold text-slate-300 transition-all"
                                                >
                                                    Generate
                                                </button>
                                            </div>

                                            <div className="pt-2">
                                                <button
                                                    type="button"
                                                    onClick={handleSaveProfile}
                                                    disabled={!form.password || form.password.length < 6 || saving}
                                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 shadow-lg shadow-indigo-600/20"
                                                >
                                                    Update Password
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </>
                        )}

                        {/* ===================== TAB 2: ORGANIZATIONS ===================== */}
                        {activeTab === 'organizations' && (
                            <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
                                <div>
                                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Building2 size={14} className="text-indigo-400" /> Organization & Workspace Memberships
                                    </h2>
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        Active business tenants and organizational domains linked to this personnel account
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                                                MS
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-bold text-white">Magic Scale CRM Fleet</h3>
                                                <p className="text-[9px] text-slate-500 mt-0.5">crm.magicscale.in • Primary Operations Hub</p>
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase rounded-lg border border-emerald-500/20">
                                            Active Member
                                        </span>
                                    </div>

                                    <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                                                KV
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-bold text-white">Kravy POS Ecosystem</h3>
                                                <p className="text-[9px] text-slate-500 mt-0.5">crm.kravy.in • Merchant Terminal Network</p>
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase rounded-lg border border-emerald-500/20">
                                            Active Member
                                        </span>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* ===================== TAB 3: DEVICES ===================== */}
                        {activeTab === 'devices' && (
                            <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Monitor size={14} className="text-indigo-400" /> Active Devices & Sessions
                                        </h2>
                                        <p className="text-[10px] text-slate-500 mt-1">
                                            Verified telemetry and session tokens associated with this user
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleLogoutEverywhere}
                                        disabled={saving}
                                        className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                                    >
                                        Revoke All Sessions
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                                                <Laptop size={18} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-xs font-bold text-white">Web Browser Terminal</h3>
                                                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase rounded border border-indigo-500/20">
                                                        Current Session
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2 font-mono">
                                                    <span>Provider: {userData.authProvider}</span>
                                                    <span>•</span>
                                                    <span>Last Seen: {new Date(userData.updatedAt || userData.createdAt).toLocaleString()}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleLogoutEverywhere}
                                            className="px-3 py-1.5 bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 border border-white/5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all"
                                        >
                                            Revoke
                                        </button>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* ===================== TAB 4: SETTINGS ===================== */}
                        {activeTab === 'settings' && (
                            <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
                                <div>
                                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Sliders size={14} className="text-indigo-400" /> Account Preferences & Security Configuration
                                    </h2>
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        System-level security toggles and account operational parameters
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xs font-bold text-white">Account Active Status</h4>
                                            <p className="text-[10px] text-slate-500 mt-0.5">Toggle account access without deleting records or ledger history</p>
                                        </div>
                                        <button
                                            onClick={handleToggleStatus}
                                            className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${
                                                userData.isDisabled
                                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}
                                        >
                                            {userData.isDisabled ? 'Suspended' : 'Active'}
                                        </button>
                                    </div>

                                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xs font-bold text-white">Identity Verification Status</h4>
                                            <p className="text-[10px] text-slate-500 mt-0.5">Verified badge indicating validated company credentials</p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                const next = !form.isVerified;
                                                setForm({ ...form, isVerified: next });
                                                await fetch(`/api/admin/users/manage/${id}`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ isVerified: next })
                                                });
                                                toast.success(next ? "Marked as Verified" : "Marked as Unverified");
                                                fetchUserDetails();
                                            }}
                                            className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${
                                                userData.isVerified
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : 'bg-white/5 text-slate-500 border-white/5'
                                            }`}
                                        >
                                            {userData.isVerified ? 'Verified' : 'Unverified'}
                                        </button>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* ===================== TAB 5: ACTIVITY & SECURITY ===================== */}
                        {activeTab === 'activity' && (
                            <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
                                <div>
                                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <History size={14} className="text-indigo-400" /> Immutable Audit Trail
                                    </h2>
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        Tamper-evident log of administrative actions, role modifications, and status changes
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {auditLogs.length > 0 ? (
                                        auditLogs.map((log: any) => (
                                            <div key={log.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                                                            {log.action}
                                                        </span>
                                                        <span className="text-xs font-bold text-white">
                                                            {log.fieldName ? `Field: ${log.fieldName}` : log.action}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-mono">
                                                        {log.previousValue !== null && `From: "${log.previousValue}" `}
                                                        {log.newValue !== null && `→ To: "${log.newValue}"`}
                                                    </p>
                                                    <p className="text-[9px] text-slate-500">
                                                        By: <strong className="text-slate-400">{log.actorName || log.actorUserId}</strong> • {new Date(log.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                                                    {log.result || 'SUCCESS'}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center text-slate-500 text-xs">
                                            No audit entries recorded yet for this user.
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* RIGHT SIDEBAR PANEL */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-20 space-y-6">
                            {/* USER IDENTITY CARD */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">User ID</p>
                                    <div className="flex items-center justify-between group">
                                        <p className="text-[10px] font-mono font-bold text-slate-300 truncate max-w-[180px]">{userData.id}</p>
                                        <button
                                            onClick={() => handleCopy(userData.id, 'User ID')}
                                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white/5 rounded-lg transition-all text-slate-500"
                                            title="Copy ID"
                                        >
                                            <Copy size={12} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Primary Email</p>
                                    <div className="flex items-center justify-between group">
                                        <p className="text-[10px] font-mono font-bold text-white truncate max-w-[180px]">{userData.email}</p>
                                        <button
                                            onClick={() => handleCopy(userData.email, 'Email')}
                                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white/5 rounded-lg transition-all text-slate-500"
                                            title="Copy Email"
                                        >
                                            <Copy size={12} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Joined</p>
                                        <p className="text-[10px] font-bold text-white">
                                            {new Date(userData.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Updated</p>
                                        <p className="text-[10px] font-bold text-slate-400">
                                            {Math.floor((new Date().getTime() - new Date(userData.updatedAt || userData.createdAt).getTime()) / (1000 * 60 * 60 * 24))}d ago
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black uppercase text-slate-500">Auth</span>
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                                            userData.authProvider === 'CUSTOM'
                                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                        }`}>
                                            {userData.authProvider}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black uppercase text-slate-500">Role</span>
                                        <span className="text-[10px] font-bold text-white uppercase">{userData.role || 'USER'}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black uppercase text-slate-500">Department</span>
                                        <span className="text-[10px] font-bold text-indigo-400">{form.department || 'Digital'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* QUICK ACTIONS PANEL */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-3">
                                <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Quick Actions</h3>

                                <button
                                    onClick={() => setShowImpersonateModal(true)}
                                    disabled={impersonating || userData.isDisabled}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-40"
                                >
                                    <Shield size={12} />
                                    Login as User
                                </button>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={handleToggleStatus}
                                        disabled={saving}
                                        className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                            userData.isDisabled
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                                        }`}
                                    >
                                        {userData.isDisabled ? 'Activate' : 'Suspend'}
                                    </button>

                                    <button
                                        onClick={handleLogoutEverywhere}
                                        disabled={saving}
                                        className="py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-slate-400 border border-white/5"
                                    >
                                        Logout Everywhere
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* MODAL: LOGIN AS USER (IMPERSONATION) */}
            <AnimatePresence>
                {showImpersonateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#16161a] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Shield size={16} className="text-indigo-400" /> Administrative Impersonation
                                </h3>
                                <button onClick={() => setShowImpersonateModal(false)} className="text-slate-500 hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed">
                                You are about to initiate an authenticated administrative session as <strong className="text-white">{userData.name || userData.email}</strong>. This session is valid for 2 hours and will be permanently recorded in the immutable audit log.
                            </p>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                    Mandatory Reason for Impersonation <span className="text-rose-400">*</span>
                                </label>
                                <textarea
                                    value={impersonateReason}
                                    onChange={(e) => setImpersonateReason(e.target.value)}
                                    placeholder="e.g. Troubleshooting reported order dispatch error on merchant terminal"
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-indigo-500 transition-all text-white"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setShowImpersonateModal(false)}
                                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImpersonate}
                                    disabled={impersonating || !impersonateReason || impersonateReason.trim().length < 5}
                                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                                >
                                    {impersonating ? <Loader2 size={12} className="animate-spin" /> : <Shield size={12} />}
                                    Proceed & Login
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: CUSTOM PERMISSIONS */}
            <AnimatePresence>
                {showPermissionsModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                                <div>
                                    <h2 className="text-base font-bold text-white">Custom Permissions: {userData.name || userData.email}</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Select specific routing modules this user is permitted to access.</p>
                                </div>
                                <button onClick={() => setShowPermissionsModal(false)} className="text-slate-400 hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1 space-y-6">
                                {Array.from(new Set(SYSTEM_MODULES.map(m => m.group))).map(group => (
                                    <div key={group} className="space-y-3">
                                        <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest border-b border-white/5 pb-2">
                                            {group}
                                        </h4>
                                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {SYSTEM_MODULES.filter(m => m.group === group).map(item => {
                                                const checked = userPaths.includes(item.path);
                                                return (
                                                    <label
                                                        key={item.path}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                                            checked ? 'bg-white/5 border-indigo-500/30 text-white' : 'bg-transparent border-transparent text-slate-500 hover:bg-white/5'
                                                        }`}
                                                    >
                                                        <div onClick={(e) => {
                                                            e.preventDefault();
                                                            setUserPaths(prev => checked ? prev.filter(p => p !== item.path) : [...prev, item.path]);
                                                        }}>
                                                            {checked ? <CheckSquare size={16} className="text-indigo-400" /> : <Square size={16} className="text-slate-600" />}
                                                        </div>
                                                        <span className="text-xs font-bold flex-1">{item.name}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                                <button
                                    onClick={() => setUserPaths([])}
                                    className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                                >
                                    Reset to Role Defaults
                                </button>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowPermissionsModal(false)}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSavePermissions}
                                        disabled={saving}
                                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                                    >
                                        Save Overrides
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: ADD EMAIL */}
            <AnimatePresence>
                {showAddEmail && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#16161a] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4"
                        >
                            <h3 className="text-sm font-bold text-white">Add Secondary Email</h3>
                            <p className="text-xs text-slate-400">This email address will be linked as a secondary contact for authentication and alerts.</p>
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="e.g. alternate@magicscale.co.in"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-indigo-500 text-white font-mono"
                            />
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setShowAddEmail(false)}
                                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleAddSecondaryIdentifier('email')}
                                    disabled={!newEmail || saving}
                                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
                                >
                                    Add Email
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: ADD PHONE */}
            <AnimatePresence>
                {showAddPhone && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#16161a] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4"
                        >
                            <h3 className="text-sm font-bold text-white">Add Secondary Phone</h3>
                            <p className="text-xs text-slate-400">This phone number will be registered as a secondary contact line.</p>
                            <input
                                type="tel"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                placeholder="e.g. 9876543210"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-indigo-500 text-white font-mono"
                            />
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setShowAddPhone(false)}
                                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleAddSecondaryIdentifier('phone')}
                                    disabled={!newPhone || saving}
                                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
                                >
                                    Add Phone
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: RAW JSON INSPECTOR */}
            <AnimatePresence>
                {showJson && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0D1117] border border-white/10 w-full max-w-3xl h-[75vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div>
                                    <h3 className="text-white font-bold text-sm">Raw Personnel Record</h3>
                                    <p className="text-slate-500 text-[10px] uppercase tracking-wider font-mono">Prisma User & Profile Document</p>
                                </div>
                                <button onClick={() => setShowJson(false)} className="text-slate-400 hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto p-6 font-mono text-xs leading-relaxed text-indigo-300 bg-black/30">
                                <pre>{JSON.stringify({ user: userData, profile: profileData, auditLogs }, null, 2)}</pre>
                            </div>

                            <div className="px-6 py-3 bg-white/[0.02] border-t border-white/5 flex justify-end">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(JSON.stringify({ user: userData, profile: profileData }, null, 2));
                                        toast.success("JSON copied to clipboard");
                                    }}
                                    className="px-4 py-2 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-white/20 transition-all"
                                >
                                    Copy to Clipboard
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
