'use client';

import { useUnifiedAuth as useUser } from "@/lib/useUnifiedAuth";
import { useEffect, useState, use } from 'react';
import { useRouter } from "next/navigation";
import {
    ShieldCheck,
    ArrowLeft,
    UserCircle,
    Mail,
    Phone,
    Lock,
    Save,
    Ban,
    UserCheck,
    AtSign
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user: currentUser, isLoaded } = useUser();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [userData, setUserData] = useState<any>(null);
    const [profileData, setProfileData] = useState<any>(null);

    // Form fields
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [isDisabled, setIsDisabled] = useState(false);
    const [alternateEmail, setAlternateEmail] = useState('');
    const [alternatePhone, setAlternatePhone] = useState('');

    const AVAILABLE_ROLES = ['MASTER', 'ADMIN', 'TL', 'SELLER', 'USER', 'GUEST', 'MANAGER', 'INTERN'];

    useEffect(() => {
        if (isLoaded && currentUser) {
            const currentRole = String(currentUser.publicMetadata?.role || 'user').toLowerCase();
            if (currentRole !== 'master') {
                toast.error("Access Denied: Only MASTER can access this page.");
                router.push('/admin/roles');
            } else {
                fetchUserDetails();
            }
        }
    }, [isLoaded, currentUser]);

    const fetchUserDetails = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users/manage/${id}`);
            if (res.ok) {
                const data = await res.json();
                setUserData(data.user);
                setProfileData(data.profile);
                
                setRole(data.user.role || 'USER');
                setIsDisabled(data.user.isDisabled || data.user.banned || false);
                setAlternateEmail(data.profile?.alternateEmail || '');
                setAlternatePhone(data.profile?.alternatePhone || '');
            } else {
                toast.error("Failed to load user details");
                router.push('/admin/roles');
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const body = {
                role,
                isDisabled,
                alternateEmail,
                alternatePhone,
                ...(password ? { password } : {})
            };

            const res = await fetch(`/api/admin/users/manage/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                toast.success("User details updated successfully!");
                setPassword(''); // Clear password field after successful update
                fetchUserDetails(); // Refresh data
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to update user");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    };

    if (!isLoaded || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!userData) return null;

    return (
        <div className="container mx-auto px-6 py-10 max-w-5xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => router.push('/admin/roles')}
                    className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Personnel Settings</h1>
                    <p className="text-slate-500 font-bold text-sm">Advanced configuration for {userData.name}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: User Overview */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-[24px] flex items-center justify-center text-indigo-600 shadow-inner mb-4">
                            <UserCircle size={48} />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 mb-1">{userData.name || 'No Name'}</h2>
                        <p className="text-slate-500 font-bold text-sm mb-4">{userData.email}</p>
                        
                        <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-6 ${isDisabled ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {isDisabled ? 'Access Disabled' : 'Active Account'}
                        </div>

                        <div className="w-full space-y-3 pt-4 border-t border-slate-100 text-left">
                            <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                <AtSign size={16} className="text-indigo-400" />
                                <span className="truncate">{userData.clerkId}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                <ShieldCheck size={16} className="text-indigo-400" />
                                <span>Current Role: {userData.role}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                            <Settings2 size={20} className="text-indigo-600" /> Security & Access Controls
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Role Select */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Account Role</label>
                                <select 
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                    value={role.toUpperCase()}
                                    onChange={(e) => setRole(e.target.value)}
                                >
                                    {AVAILABLE_ROLES.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Access Toggle */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">System Access</label>
                                <button
                                    onClick={() => setIsDisabled(!isDisabled)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                                        isDisabled 
                                            ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' 
                                            : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                    }`}
                                >
                                    {isDisabled ? <Ban size={18} /> : <UserCheck size={18} />}
                                    {isDisabled ? 'ACCOUNT DISABLED' : 'ACCOUNT ACTIVE'}
                                </button>
                            </div>
                        </div>

                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 pt-6 border-t border-slate-100">
                            <Lock size={20} className="text-indigo-600" /> Authentication
                        </h3>

                        <div className="space-y-2 mb-8">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">New Password</label>
                            <input 
                                type="password" 
                                placeholder="Leave blank to keep current password"
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <p className="text-xs text-slate-400 font-bold mt-1">If using Clerk, this will attempt to update the Clerk password. Otherwise updates local password.</p>
                        </div>

                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 pt-6 border-t border-slate-100">
                            <UserCircle size={20} className="text-indigo-600" /> Contact Overrides
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Alternate Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="email" 
                                        placeholder="Add secondary email"
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                        value={alternateEmail}
                                        onChange={(e) => setAlternateEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Alternate Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="tel" 
                                        placeholder="Add secondary phone"
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                        value={alternatePhone}
                                        onChange={(e) => setAlternatePhone(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-300 transition-all flex items-center gap-2 disabled:opacity-70"
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Save size={18} />
                                )}
                                SAVE CONFIGURATION
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
