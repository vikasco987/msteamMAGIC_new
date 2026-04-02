'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import {
    Users,
    ShieldCheck,
    Search,
    UserPlus,
    UserMinus,
    Crown,
    ChevronRight,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
    id: string;
    clerkId: string;
    name: string;
    email: string;
    role: string;
    isTeamLeader: boolean;
    leaderId: string | null;
}

export default function TeamManagementPage() {
    const { user: currentUser, isLoaded } = useUser();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    useEffect(() => {
        if (isLoaded && currentUser) {
            const role = String(currentUser.publicMetadata?.role || 'user').toLowerCase();
            if (role !== 'master') {
                toast.error("Access Denied: Only MASTER can access this page.");
            } else {
                fetchUsers();
            }
        }
    }, [isLoaded, currentUser]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/teams');
            const data = await res.json();
            if (data.users) setUsers(data.users);
        } catch (error) {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTLStatus = async (targetUserId: string, isTeamLeader: boolean) => {
        setUpdatingUserId(targetUserId);
        try {
            const res = await fetch('/api/admin/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId, isTeamLeader })
            });

            if (res.ok) {
                toast.success(isTeamLeader ? "User set as Team Leader" : "Team Leader status removed");
                setUsers(users.map(u => u.clerkId === targetUserId ? { ...u, isTeamLeader } : u));
            } else {
                toast.error("Update failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleAssignLeader = async (targetUserId: string, leaderId: string | null) => {
        setUpdatingUserId(targetUserId);
        try {
            const res = await fetch('/api/admin/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId, leaderId })
            });

            if (res.ok) {
                toast.success("Leader assigned successfully");
                setUsers(users.map(u => u.clerkId === targetUserId ? { ...u, leaderId } : u));
            } else {
                toast.error("Assignment failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setUpdatingUserId(null);
        }
    };

    const teamLeaders = users.filter(u => u.isTeamLeader);
    
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const currentUserRole = String(currentUser?.publicMetadata?.role || 'user').toLowerCase();
    const isAuthorized = currentUserRole === 'master';

    if (!isLoaded || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <h1 className="text-4xl font-black text-slate-900 mb-2">ACCESS DENIED</h1>
                <p className="text-slate-500">Only Master accounts can manage team hierarchies.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-10 max-w-7xl">
            <header className="mb-12">
                <div className="flex items-center gap-3 text-indigo-600 mb-2">
                    <Users size={28} />
                    <span className="text-sm font-black uppercase tracking-widest">Team Hierarchy</span>
                </div>
                <h1 className="text-5xl font-black text-slate-900">Team <span className="text-indigo-600">Commander</span></h1>
                <p className="text-slate-500 font-bold mt-4">Assign Team Leaders and organize your personnel into effective operational units.</p>
            </header>

            <div className="grid gap-8 mb-12">
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search personnel by name or email..."
                        className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-200 rounded-[22px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="grid gap-6">
                    {filteredUsers.map(u => (
                        <div key={u.clerkId} className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:border-indigo-300 transition-all flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4 flex-1">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${u.isTeamLeader ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                    {u.isTeamLeader ? <Crown size={24} /> : <Users size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 flex-wrap">
                                        {u.name}
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter ${u.role.toUpperCase() === 'TL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            {u.role}
                                        </span>
                                        {u.isTeamLeader && <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full uppercase tracking-tighter font-black">TL Priority</span>}
                                    </h3>
                                    <p className="text-sm font-bold text-slate-400">{u.email}</p>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black uppercase text-slate-400 mb-1">TL Privilege</span>
                                    <button
                                        onClick={() => handleUpdateTLStatus(u.clerkId, !u.isTeamLeader)}
                                        disabled={updatingUserId === u.clerkId}
                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${u.isTeamLeader ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'}`}
                                    >
                                        {updatingUserId === u.clerkId ? <Loader2 size={14} className="animate-spin" /> : (u.isTeamLeader ? "REVOKE TL" : "MAKE TL")}
                                    </button>
                                </div>

                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black uppercase text-slate-400 mb-1">Assigned Leader</span>
                                    <select
                                        value={u.leaderId || ''}
                                        onChange={(e) => handleAssignLeader(u.clerkId, e.target.value || null)}
                                        disabled={u.isTeamLeader || updatingUserId === u.clerkId}
                                        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">No Leader</option>
                                        {teamLeaders.filter(tl => tl.clerkId !== u.clerkId).map(tl => (
                                            <option key={tl.clerkId} value={tl.clerkId}>{tl.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
