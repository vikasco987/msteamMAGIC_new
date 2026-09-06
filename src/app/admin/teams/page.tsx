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
    CheckCircle2,
    ArrowRightLeft,
    AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select';

interface User {
    id: string;
    clerkId: string;
    name: string;
    email: string;
    role: string;
    isTeamLeader: boolean;
    leaderIds: string[];
    currentDepartment?: string;
    banned?: boolean;
}

export default function TeamManagementPage() {
    const { user: currentUser, isLoaded } = useUser();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'management' | 'hierarchy'>('management');
    const [expandedTLs, setExpandedTLs] = useState<Record<string, boolean>>({});

    const toggleExpandedTL = (tlId: string) => {
        setExpandedTLs(prev => ({ ...prev, [tlId]: !prev[tlId] }));
    };

    // Migration State
    const [isMigrateModalOpen, setIsMigrateModalOpen] = useState(false);
    const [migrateFromUser, setMigrateFromUser] = useState<User | null>(null);
    const [migrateToUser, setMigrateToUser] = useState<string>('');
    const [migrating, setMigrating] = useState(false);

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

    const handleAssignLeader = async (targetUserId: string, leaderIds: string[]) => {
        setUpdatingUserId(targetUserId);
        try {
            const res = await fetch('/api/admin/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId, leaderIds })
            });

            if (res.ok) {
                toast.success("Leaders assigned successfully");
                setUsers(users.map(u => u.clerkId === targetUserId ? { ...u, leaderIds } : u));
            } else {
                toast.error("Assignment failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleAssignDepartment = async (targetUserId: string, currentDepartment: string) => {
        setUpdatingUserId(targetUserId);
        try {
            const res = await fetch('/api/admin/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId, currentDepartment })
            });

            if (res.ok) {
                toast.success("Department assigned successfully");
                setUsers(users.map(u => u.clerkId === targetUserId ? { ...u, currentDepartment } : u));
            } else {
                toast.error("Assignment failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleMigrateData = async () => {
        if (!migrateFromUser || !migrateToUser) {
            toast.error("Please select a destination user");
            return;
        }
        if (migrateFromUser.clerkId === migrateToUser) {
            toast.error("Source and destination cannot be the same");
            return;
        }

        setMigrating(true);
        try {
            const res = await fetch('/api/admin/users/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromUserId: migrateFromUser.clerkId,
                    toUserId: migrateToUser
                })
            });

            if (res.ok) {
                toast.success("Data migrated successfully");
                setIsMigrateModalOpen(false);
                setMigrateFromUser(null);
                setMigrateToUser('');
            } else {
                const data = await res.json();
                toast.error(data.error || "Migration failed");
            }
        } catch (error) {
            toast.error("An error occurred during migration");
        } finally {
            setMigrating(false);
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
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-5xl font-black text-slate-900">Team <span className="text-indigo-600">Commander</span></h1>
                        <p className="text-slate-500 font-bold mt-4">Assign Team Leaders and organize your personnel into effective operational units.</p>
                    </div>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto self-start md:self-auto shadow-inner">
                        <button 
                            onClick={() => setActiveTab('management')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'management' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        >
                            Personnel Management
                        </button>
                        <button 
                            onClick={() => setActiveTab('hierarchy')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'hierarchy' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        >
                            Team Hierarchy
                        </button>
                    </div>
                </div>
            </header>

            {activeTab === 'management' ? (
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
                                        {u.banned && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-tighter font-black">BANNED</span>}
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
                                    <span className="text-[10px] font-black uppercase text-slate-400 mb-1">Actions</span>
                                    <button
                                        onClick={() => {
                                            setMigrateFromUser(u);
                                            setIsMigrateModalOpen(true);
                                        }}
                                        className="px-4 py-2 rounded-xl text-xs font-black transition-all bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200 flex items-center gap-2"
                                    >
                                        <ArrowRightLeft size={14} />
                                        MIGRATE DATA
                                    </button>
                                </div>

                                <div className="flex flex-col items-end w-32">
                                    <span className="text-[10px] font-black uppercase text-slate-400 mb-1">Department</span>
                                    <select
                                        value={u.currentDepartment || "Digital"}
                                        onChange={(e) => handleAssignDepartment(u.clerkId, e.target.value)}
                                        disabled={updatingUserId === u.clerkId}
                                        className="text-sm font-medium text-slate-900 w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none hover:border-indigo-400 cursor-pointer"
                                    >
                                        <option value="Digital">Digital</option>
                                        <option value="Retention">Retention</option>
                                        <option value="Onboarding">Onboarding</option>
                                    </select>
                                </div>

                                <div className="flex flex-col items-end w-56">
                                    <span className="text-[10px] font-black uppercase text-slate-400 mb-1">Assigned Leaders</span>
                                    <Select
                                        isMulti
                                        options={teamLeaders.filter(tl => tl.clerkId !== u.clerkId).map(tl => ({
                                            value: tl.clerkId,
                                            label: tl.name
                                        }))}
                                        value={
                                            (u.leaderIds || []).map(id => {
                                                const tl = teamLeaders.find(t => t.clerkId === id);
                                                return { value: id, label: tl ? tl.name : id };
                                            })
                                        }
                                        onChange={(selectedOptions: any) => {
                                            const newLeaderIds = selectedOptions ? selectedOptions.map((opt: any) => opt.value) : [];
                                            handleAssignLeader(u.clerkId, newLeaderIds);
                                        }}
                                        isDisabled={u.isTeamLeader || updatingUserId === u.clerkId}
                                        placeholder="No Leader..."
                                        className="text-sm font-medium text-slate-900 w-full text-left"
                                        styles={{
                                            control: (baseStyles, state) => ({
                                                ...baseStyles,
                                                padding: '2px',
                                                borderRadius: '0.75rem',
                                                borderColor: state.isFocused ? '#4f46e5' : '#cbd5e1',
                                                boxShadow: state.isFocused ? '0 0 0 1px #4f46e5' : 'none',
                                                minHeight: '42px',
                                                backgroundColor: (u.isTeamLeader || updatingUserId === u.clerkId) ? '#f8fafc' : 'white',
                                                '&:hover': {
                                                    borderColor: '#4f46e5'
                                                }
                                            }),
                                            menu: (baseStyles) => ({
                                                ...baseStyles,
                                                zIndex: 50
                                            })
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                </div>
            ) : (
                <div className="grid gap-8 mb-12">
                    {/* Team Hierarchy Tab */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                        <div>
                            <h2 className="text-2xl font-black text-indigo-950">Active Team Leaders</h2>
                            <p className="text-indigo-700/80 font-bold text-sm mt-1">Click on a leader to view their team members</p>
                        </div>
                        <div className="flex flex-col items-center justify-center bg-white border border-indigo-100 rounded-2xl px-8 py-4 shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Total count</span>
                            <span className="text-4xl font-black text-indigo-600 leading-none">{teamLeaders.length}</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teamLeaders.map(tl => {
                            const teamMembers = users.filter(u => u.leaderIds?.includes(tl.clerkId));
                            const isExpanded = !!expandedTLs[tl.clerkId];
                            
                            return (
                                <motion.div 
                                    layout
                                    key={tl.clerkId} 
                                    className="bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-sm hover:border-indigo-300 hover:shadow-lg transition-all duration-300"
                                >
                                    <div 
                                        className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                                        onClick={() => toggleExpandedTL(tl.clerkId)}
                                    >
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-inner">
                                                <Crown size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-black text-slate-900 leading-tight mb-0.5">{tl.name}</h3>
                                                <p className="text-xs font-bold text-slate-400">{tl.email}</p>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                            >
                                                <ChevronRight className="text-slate-300" />
                                            </motion.div>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Team Size</span>
                                            <span className="text-[13px] font-black text-indigo-700 bg-indigo-50 px-4 py-1.5 rounded-full">{teamMembers.length} Members</span>
                                        </div>
                                    </div>
                                    
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="bg-slate-50/80 border-t border-slate-100"
                                            >
                                                <div className="p-5 space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar">
                                                    {teamMembers.length === 0 ? (
                                                        <div className="text-center py-8 text-slate-400 text-sm font-bold flex flex-col items-center gap-3">
                                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                                                <UserMinus size={20} className="text-slate-300" />
                                                            </div>
                                                            No members assigned yet.
                                                        </div>
                                                    ) : (
                                                        teamMembers.map(member => (
                                                            <div key={member.clerkId} className="flex items-center gap-4 bg-white p-4 rounded-[20px] shadow-sm border border-slate-100 hover:border-slate-200 transition-colors">
                                                                <div className="w-10 h-10 rounded-[14px] bg-slate-100 flex items-center justify-center text-slate-500">
                                                                    <Users size={18} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-900 leading-none mb-1">{member.name}</p>
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{member.role}</p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Migration Modal */}
            <AnimatePresence>
                {isMigrateModalOpen && migrateFromUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[24px] p-6 max-w-lg w-full shadow-2xl border border-slate-200"
                        >
                            <div className="flex items-center gap-3 text-amber-600 mb-4">
                                <AlertTriangle size={24} />
                                <h2 className="text-xl font-black">Migrate Account Data</h2>
                            </div>
                            
                            <p className="text-sm text-slate-600 mb-6 font-medium">
                                You are about to migrate all data (Tasks, CRM Forms, Attendance, Payments, etc.) from <strong className="text-slate-900">{migrateFromUser.name}</strong> to a new account.
                                This action is permanent.
                            </p>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">From (Old Account)</label>
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700">
                                        {migrateFromUser.name} ({migrateFromUser.email})
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">To (New Account)</label>
                                    <Select
                                        options={users.filter(u => u.clerkId !== migrateFromUser.clerkId).map(u => ({
                                            value: u.clerkId,
                                            label: `${u.name} (${u.email})`
                                        }))}
                                        value={
                                            migrateToUser 
                                                ? { 
                                                    value: migrateToUser, 
                                                    label: `${users.find(u => u.clerkId === migrateToUser)?.name || ''} (${users.find(u => u.clerkId === migrateToUser)?.email || ''})` 
                                                  } 
                                                : null
                                        }
                                        onChange={(option: any) => setMigrateToUser(option?.value || '')}
                                        placeholder="Search destination user..."
                                        className="text-sm font-medium text-slate-900"
                                        styles={{
                                            control: (baseStyles, state) => ({
                                                ...baseStyles,
                                                padding: '4px',
                                                borderRadius: '0.75rem',
                                                borderColor: state.isFocused ? '#f59e0b' : '#cbd5e1',
                                                boxShadow: state.isFocused ? '0 0 0 1px #f59e0b' : 'none',
                                                '&:hover': {
                                                    borderColor: '#f59e0b'
                                                }
                                            })
                                        }}
                                        isSearchable
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => {
                                        setIsMigrateModalOpen(false);
                                        setMigrateToUser('');
                                    }}
                                    disabled={migrating}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={handleMigrateData}
                                    disabled={migrating || !migrateToUser}
                                    className="px-5 py-2.5 rounded-xl text-sm font-black text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {migrating ? <Loader2 size={16} className="animate-spin" /> : <ArrowRightLeft size={16} />}
                                    {migrating ? "MIGRATING..." : "CONFIRM MIGRATION"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
