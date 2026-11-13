'use client';
import { useUnifiedAuth as useUser } from "@/lib/useUnifiedAuth";

import { useEffect, useState } from 'react';

import {
    ShieldCheck,
    Users,
    Layout,
    ChevronRight,
    Search,
    Settings2,
    CheckCircle2,
    XCircle,
    ArrowRightLeft,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    FileText,
    Cloud,
    HardDrive,
    Ban,
    User,
    GripVertical,
    ArrowUp,
    ArrowDown,
    Sliders,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---
interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    synced: boolean;
    banned: boolean;
    isVerified?: boolean;
    isCustom?: boolean;
}

interface SidebarPermission {
    role: string;
    sidebarItems: string[];
}

const AVAILABLE_ROLES = ['MASTER', 'ADMIN', 'TL', 'SELLER', 'USER', 'GUEST', 'MANAGER', 'INTERN'];

export default function RoleManagementPage() {
    const { user: currentUser, isLoaded } = useUser();
    const [users, setUsers] = useState<User[]>([]);
    const [permissions, setPermissions] = useState<SidebarPermission[]>([]);
    const [allItems, setAllItems] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'users' | 'sidebar'>('users');
    const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
    const [showDocs, setShowDocs] = useState(false);
    const [viewingProfile, setViewingProfile] = useState<any>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    useEffect(() => {
        if (isLoaded && currentUser) {
            const role = String(currentUser.publicMetadata?.role || 'user').toLowerCase();
            if (role !== 'master') {
                toast.error("Access Denied: Only MASTER can access this page.");
                // window.location.href = '/'; // Simple redirect
            } else {
                fetchData();
            }
        }
    }, [isLoaded, currentUser]);

    const handleViewProfile = async (email: string) => {
        setProfileLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}/profile`);
            const data = await res.json();
            if (res.ok && data.profile) {
                setViewingProfile(data.profile);
            } else {
                toast.error(data.message || "Profile details not found for this user");
            }
        } catch (error) {
            toast.error("Failed to load profile details");
        } finally {
            setProfileLoading(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, sidebarRes] = await Promise.all([
                fetch('/api/admin/roles'),
                fetch('/api/admin/sidebar')
            ]);

            const usersData = await usersRes.json();
            const sidebarData = await sidebarRes.json();

            if (usersData.users) setUsers(usersData.users);
            if (sidebarData.permissions) setPermissions(sidebarData.permissions);
            if (sidebarData.allItems) setAllItems(sidebarData.allItems);

        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleSyncUsers = async () => {
        setLoading(true);
        const loadingToast = toast.loading("Syncing users from Clerk...");
        try {
            const res = await fetch('/api/admin/sync-users', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                toast.success(data.message, { id: loadingToast });
                fetchData(); // Refresh the data
            } else {
                toast.error("Failed to sync users", { id: loadingToast });
            }
        } catch (error) {
            toast.error("An error occurred during sync", { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (targetUserId: string, newRole: string) => {
        try {
            setChangingRoleId(targetUserId);
            const res = await fetch('/api/admin/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId, newRole })
            });

            if (res.ok) {
                toast.success(`Role updated to ${newRole}`);
                setUsers(users.map(u => u.id === targetUserId ? { ...u, role: newRole.toLowerCase(), isVerified: true } : u));
            } else {
                const err = await res.json();
                toast.error(err.error || "Update failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setChangingRoleId(null);
        }
    };

    const handleToggleDisable = async (targetUserId: string, isCurrentlyDisabled: boolean) => {
        if (!confirm(`Are you sure you want to ${isCurrentlyDisabled ? 'ENABLE' : 'DISABLE'} this user?`)) return;
        
        try {
            setChangingRoleId(targetUserId);
            const res = await fetch('/api/admin/users/block', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId, action: isCurrentlyDisabled ? 'unban' : 'ban' })
            });

            if (res.ok) {
                toast.success(`User ${isCurrentlyDisabled ? 'enabled' : 'disabled'} successfully`);
                setUsers(users.map(u => u.id === targetUserId ? { ...u, banned: !isCurrentlyDisabled } : u));
            } else {
                const err = await res.json();
                toast.error(err.error || "Action failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setChangingRoleId(null);
        }
    };

    const [draggedSidebarItem, setDraggedSidebarItem] = useState<{ role: string; item: string } | null>(null);

    const handleReorderSidebarItem = async (role: string, targetItem: string) => {
        if (!draggedSidebarItem || draggedSidebarItem.role !== role || draggedSidebarItem.item === targetItem) return;

        const roleLower = role.toLowerCase();
        const currentPerm = permissions.find(p => p.role === roleLower) || { role: roleLower, sidebarItems: [] };
        const items = [...currentPerm.sidebarItems];
        const fromIdx = items.indexOf(draggedSidebarItem.item);
        const toIdx = items.indexOf(targetItem);

        if (fromIdx === -1 || toIdx === -1) return;

        items.splice(fromIdx, 1);
        items.splice(toIdx, 0, draggedSidebarItem.item);

        try {
            const res = await fetch('/api/admin/sidebar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: roleLower, sidebarItems: items })
            });

            if (res.ok) {
                setPermissions(prev => {
                    const filtered = prev.filter(p => p.role !== roleLower);
                    return [...filtered, { role: roleLower, sidebarItems: items }];
                });
                toast.success(`Position updated for ${role}`);
            }
        } catch {
            toast.error("Failed to reorder sidebar items");
        } finally {
            setDraggedSidebarItem(null);
        }
    };

    const toggleSidebarItem = async (role: string, item: string) => {
        const roleLower = role.toLowerCase();
        const currentPerm = permissions.find(p => p.role === roleLower) || { role: roleLower, sidebarItems: [] };

        let newItems;
        if (currentPerm.sidebarItems.includes(item)) {
            newItems = currentPerm.sidebarItems.filter(i => i !== item);
        } else {
            newItems = [...currentPerm.sidebarItems, item];
        }

        try {
            const res = await fetch('/api/admin/sidebar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: roleLower, sidebarItems: newItems })
            });

            if (res.ok) {
                setPermissions(prev => {
                    const filtered = prev.filter(p => p.role !== roleLower);
                    return [...filtered, { role: roleLower, sidebarItems: newItems }];
                });
                toast.success(`Updated ${role} access`);
            }
        } catch (error) {
            toast.error("Failed to update sidebar permissions");
        }
    };

    const currentUserRole = String(currentUser?.publicMetadata?.role || 'user').toLowerCase();

    if (!isLoaded || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (currentUserRole !== 'master') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-red-100">
                    <Lock size={40} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-2">ACCESS REJECTED</h1>
                <p className="text-slate-500 max-w-md font-bold">This area is reserved for Level-0 MASTER accounts only. If you believe this is an error, please contact your systems architect.</p>
            </div>
        );
    }

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="container mx-auto px-6 py-10 max-w-7xl relative">
            {/* DOCUMENTATION MODAL overlay */}
            <AnimatePresence>
                {showDocs && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-white border border-slate-200 rounded-[32px] p-8 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                                <div className="flex items-center gap-3 text-indigo-600">
                                    <FileText size={24} />
                                    <h2 className="text-2xl font-black">Access Commander Guide</h2>
                                </div>
                                <button 
                                    onClick={() => setShowDocs(false)}
                                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    <XCircle className="text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-10">
                                <section className="space-y-3">
                                    <h3 className="text-indigo-600 font-black flex items-center gap-2">
                                        <Users className="w-5 h-5" /> 1. Personnel Management (Role System)
                                    </h3>
                                    <p className="text-sm text-slate-500 font-bold leading-relaxed">
                                        Yahan se aap kisi bhi staff member ki <span className="text-slate-900">Security Rank</span> change kar sakte hain. 
                                        Jab aap list mein se kisi user ka role (ADMIN, SELLER, etc.) बदलते हैं, toh woh real-time mein change hota hai. 
                                        Agli baar jab woh login karenge toh unhe wahi permissions milengi jo aapne yahan set ki hain.
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h3 className="text-indigo-600 font-black flex items-center gap-2">
                                        <Layout className="w-5 h-5" /> 2. Interface (Sidebar visibility)
                                    </h3>
                                    <p className="text-sm text-slate-500 font-bold leading-relaxed">
                                        Interface tab mein aap har role (MASTER ko chhod kar) ke liye yeh decide kar sakte hain ki unhe **Sidebar mein kya-kya dikhega**. 
                                        Eye icon 👁️ ka matlab hai woh item unhe dikhega, aur EyeOff icon unhe woh page access karne se rok dega.
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h3 className="text-indigo-600 font-black flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5" /> 3. MASTER Privileges
                                    </h3>
                                    <p className="text-sm text-slate-500 font-bold leading-relaxed">
                                        <span className="text-indigo-600">MASTER</span> account ke pas "God Mode" powers hoti hain. 
                                        Master ka view koi change nahi kar sakta aur Backup Center jaise sensitive areas sirf Master ke liye hi open hote hain.
                                    </p>
                                </section>
                            </div>

                            <div className="mt-12 flex justify-center">
                                <button 
                                    onClick={() => setShowDocs(false)}
                                    className="px-10 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
                                >
                                    Me Samajh Gaya!
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {viewingProfile && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white border border-slate-200 rounded-[32px] p-8 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                                <div className="flex items-center gap-3 text-indigo-600">
                                    <User size={24} />
                                    <h2 className="text-2xl font-black">Employee Profile</h2>
                                </div>
                                <button 
                                    onClick={() => setViewingProfile(null)}
                                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    <XCircle className="text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase">Full Name</p>
                                        <p className="font-bold text-slate-900">{viewingProfile.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase">Phone</p>
                                        <p className="font-bold text-slate-900">{viewingProfile.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase">Department</p>
                                        <p className="font-bold text-slate-900">{viewingProfile.department || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase">Designation</p>
                                        <p className="font-bold text-slate-900">{viewingProfile.designation || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase">Joining Date</p>
                                        <p className="font-bold text-slate-900">{viewingProfile.joiningDate ? new Date(viewingProfile.joiningDate).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase">Date of Birth</p>
                                        <p className="font-bold text-slate-900">{viewingProfile.dob ? new Date(viewingProfile.dob).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase">Alternate Phone</p>
                                        <p className="font-bold text-slate-900">{viewingProfile.alternatePhone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase">Blood Group</p>
                                        <p className="font-bold text-slate-900">{viewingProfile.bloodGroup || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase">Marital Status</p>
                                        <p className="font-bold text-slate-900">{viewingProfile.maritalStatus || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase">Gender</p>
                                        <p className="font-bold text-slate-900">{viewingProfile.gender || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs font-black text-slate-400 uppercase">Current Address</p>
                                        <p className="font-bold text-slate-900">{viewingProfile.address || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs font-black text-slate-400 uppercase">Permanent Address</p>
                                        <p className="font-bold text-slate-900">{viewingProfile.permanentAddress || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-6">
                                    <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                                        <ShieldCheck size={18} className="text-indigo-600" /> KYC & Bank Documents
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                            <p className="text-xs font-black text-slate-400 uppercase mb-1">PAN Number</p>
                                            <p className="font-bold text-slate-900 mb-2">{viewingProfile.panNumber || 'Not provided'}</p>
                                            {viewingProfile.panUrl ? (
                                                <a href={viewingProfile.panUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 hover:underline">View Uploaded PAN</a>
                                            ) : (
                                                <span className="text-xs text-rose-500 font-bold">No Document</span>
                                            )}
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                            <p className="text-xs font-black text-slate-400 uppercase mb-1">Aadhaar Number</p>
                                            <p className="font-bold text-slate-900 mb-2">{viewingProfile.aadhaarNumber || 'Not provided'}</p>
                                            {viewingProfile.aadhaarUrl ? (
                                                <a href={viewingProfile.aadhaarUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 hover:underline">View Uploaded Aadhaar</a>
                                            ) : (
                                                <span className="text-xs text-rose-500 font-bold">No Document</span>
                                            )}
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 col-span-2">
                                            <p className="text-xs font-black text-slate-400 uppercase mb-1">Bank Proof</p>
                                            <p className="font-bold text-slate-900 mb-2">Account: {viewingProfile.bankAccount || 'Not provided'}</p>
                                            {viewingProfile.bankProofUrl ? (
                                                <a href={viewingProfile.bankProofUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 hover:underline">View Passbook/Cancelled Cheque</a>
                                            ) : (
                                                <span className="text-xs text-rose-500 font-bold">No Document</span>
                                            )}
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 col-span-2">
                                            <p className="text-xs font-black text-slate-400 uppercase mb-1">UPI QR Code</p>
                                            <p className="font-bold text-slate-900 mb-2">UPI ID: {viewingProfile.upiId || 'Not provided'}</p>
                                            {viewingProfile.upiQrUrl ? (
                                                <a href={viewingProfile.upiQrUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 hover:underline">View Uploaded UPI QR</a>
                                            ) : (
                                                <span className="text-xs text-rose-500 font-bold">No Document</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 text-indigo-600 mb-2">
                        <ShieldCheck size={28} className="drop-shadow-sm" />
                        <span className="text-sm font-black uppercase tracking-[0.3em] opacity-80">Security Core</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Access <span className="text-indigo-600">Commander</span></h1>
                        <button 
                          onClick={() => setShowDocs(true)}
                          className="w-fit flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 text-xs font-black transition-all"
                        >
                          <AlertCircle size={14} className="text-indigo-600" />
                          HOW TO USE?
                        </button>
                    </div>
                    <p className="text-slate-500 font-bold mt-4 max-w-xl">Central synchronization engine for user roles and global interface visibility. Changes affect platform access in real-time.</p>
                </div>

                <div className="flex items-center p-1 bg-slate-200 rounded-2xl border border-slate-300 shadow-inner">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-300'}`}
                    >
                        <Users size={18} />
                        Personnel
                    </button>
                    <button
                        onClick={() => setActiveTab('sidebar')}
                        className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'sidebar' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-300'}`}
                    >
                        <Layout size={18} />
                        Interface
                    </button>
                </div>
            </div>

            <div className="flex justify-end mb-4">
                <button
                    onClick={handleSyncUsers}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-100 font-black text-sm uppercase tracking-widest transition-all shadow-sm"
                >
                    <Cloud size={16} />
                    Sync Clerk Users to Database
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'users' ? (
                    <motion.div
                        key="users-tab"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Synchronize by Name or Digital ID..."
                                className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-200 rounded-[22px] font-bold text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-4">
                            {filteredUsers.map(u => (
                                <motion.div
                                    layout
                                    key={u.id}
                                    className="bg-white p-6 rounded-[24px] border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden"
                                >
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
                                                <Users size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900">{u.name}</h3>
                                                <p className="text-sm font-bold text-slate-400">{u.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-end mr-4">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Current Protocol</span>
                                                <div className="flex items-center gap-2">
                                                    {!u.isVerified && (
                                                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] rounded-full font-black tracking-wider uppercase shadow-sm">
                                                            Pending Verification
                                                        </span>
                                                    )}
                                                    <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider ${u.role === 'master' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                        {u.role || 'GUEST'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <select
                                                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                                                    value={u.role.toUpperCase()}
                                                    onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                                                    disabled={changingRoleId === u.id || u.banned}
                                                >
                                                    {AVAILABLE_ROLES.map(role => (
                                                        <option key={role} value={role}>{role}</option>
                                                    ))}
                                                </select>
                                                
                                                <button
                                                    onClick={() => handleToggleDisable(u.id, u.banned)}
                                                    disabled={changingRoleId === u.id || u.id === currentUser?.id}
                                                    className={`px-4 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                                        u.banned 
                                                            ? 'bg-rose-100 text-rose-600 hover:bg-rose-200 border border-rose-200' 
                                                            : 'bg-slate-50 border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200'
                                                    } ${u.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    title={u.banned ? "Enable User" : "Disable User"}
                                                >
                                                    <Ban size={16} className={u.banned ? 'animate-pulse' : ''} />
                                                    {u.banned ? 'ENABLE' : 'DISABLE'}
                                                </button>

                                                {!u.isVerified && (
                                                    <button
                                                        onClick={() => handleUpdateRole(u.id, u.role)} // Re-assigning their current role verifies them
                                                        disabled={changingRoleId === u.id}
                                                        className="px-4 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest bg-amber-500 text-white hover:bg-amber-600 transition-all flex items-center gap-2 shadow-lg shadow-amber-200"
                                                        title="Verify this user"
                                                    >
                                                        <CheckCircle2 size={16} />
                                                        VERIFY
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => window.location.href = `/admin/roles/${u.id}`}
                                                    className="px-4 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-all flex items-center gap-2 cursor-pointer"
                                                    title="View Advanced Details"
                                                >
                                                    <Settings2 size={16} />
                                                    DETAILS
                                                </button>

                                                {changingRoleId === u.id && <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="sidebar-tab"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid lg:grid-cols-2 gap-8"
                    >
                        {AVAILABLE_ROLES.map(role => {
                            const rolePerm = permissions.find(p => p.role === role.toLowerCase());
                            const activeItems = rolePerm?.sidebarItems || [];

                            return (
                                <div key={role} className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
                                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                                <ShieldCheck size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{role} View</h3>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interface Visibility Control</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1 pb-1">
                                            <span>Active Visible Items ({activeItems.length}) • Drag to reorder</span>
                                            <span>Toggle to Show / Hide</span>
                                        </div>

                                        {/* Visible / Active Items (Draggable) */}
                                        <div className="space-y-2">
                                            {activeItems.map((item, idx) => (
                                                <div
                                                    key={item}
                                                    draggable
                                                    onDragStart={() => setDraggedSidebarItem({ role, item })}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={() => handleReorderSidebarItem(role, item)}
                                                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all bg-indigo-50/80 border-indigo-200 text-indigo-900 font-bold shadow-sm hover:shadow group cursor-grab active:cursor-grabbing ${
                                                        draggedSidebarItem?.item === item ? 'opacity-50 ring-2 ring-indigo-400' : ''
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <GripVertical size={16} className="text-indigo-400 group-hover:text-indigo-600 shrink-0" />
                                                        <span className="text-xs font-mono text-indigo-400 w-5">{idx + 1}.</span>
                                                        <span className="text-sm">{item}</span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (role === 'MASTER' && item === 'Access Control') {
                                                                toast.error("Master cannot hide Access Control (Safety Lock)");
                                                                return;
                                                            }
                                                            toggleSidebarItem(role, item);
                                                        }}
                                                        className="p-1.5 rounded-xl hover:bg-indigo-100 text-indigo-600 transition"
                                                        title="Hide from sidebar"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Hidden Items */}
                                        {allItems.filter(i => !activeItems.includes(i)).length > 0 && (
                                            <div className="pt-4 mt-4 border-t border-slate-100">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">
                                                    Hidden Items ({allItems.filter(i => !activeItems.includes(i)).length}) — Click Eye to Show
                                                </p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {allItems
                                                        .filter(i => !activeItems.includes(i))
                                                        .map(item => (
                                                            <button
                                                                key={item}
                                                                type="button"
                                                                onClick={() => toggleSidebarItem(role, item)}
                                                                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/60 text-slate-500 hover:text-indigo-700 transition group text-left"
                                                            >
                                                                <span className="text-xs font-medium truncate">{item}</span>
                                                                <EyeOff size={16} className="text-slate-400 group-hover:text-indigo-600 shrink-0 ml-2" />
                                                            </button>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
