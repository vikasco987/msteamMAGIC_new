"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Users, Search, Lock, Unlock, ShieldCheck, XCircle, CheckCircle2, FileEdit, Banknote, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function EmployeeDirectoryPage() {
    const { user: currentUser, isLoaded } = useUser();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Modal states
    const [editingEmployee, setEditingEmployee] = useState<any>(null);
    const [viewingEmployee, setViewingEmployee] = useState<any>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [saving, setSaving] = useState(false);

    const currentUserRole = String(currentUser?.publicMetadata?.role || 'user').toLowerCase();

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/employees");
            const data = await res.json();
            if (res.ok) {
                setEmployees(data.profiles || []);
            } else {
                toast.error(data.error || "Failed to load employees");
            }
        } catch (error) {
            toast.error("Error loading employee directory");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded && currentUserRole === 'master') {
            fetchEmployees();
        }
    }, [isLoaded, currentUserRole]);

    const handleEditClick = (emp: any) => {
        setEditingEmployee(emp);
        setEditForm({
            name: emp.name || "",
            department: emp.department || "",
            designation: emp.designation || "",
            baseSalary: emp.baseSalary || 0,
            isLocked: emp.isLocked || false,
            verificationStatus: emp.verificationStatus || "PENDING"
        });
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        const toastId = toast.loading("Saving changes...");
        try {
            const res = await fetch(`/api/admin/employees/${encodeURIComponent(editingEmployee.email)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm)
            });
            const data = await res.json();
            
            if (res.ok) {
                toast.success("Employee updated successfully", { id: toastId });
                setEditingEmployee(null);
                fetchEmployees();
            } else {
                toast.error(data.error || "Failed to update", { id: toastId });
            }
        } catch (error) {
            toast.error("Failed to update employee", { id: toastId });
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

    if (currentUserRole !== 'master') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-red-100">
                    <Lock size={40} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-2">ACCESS REJECTED</h1>
                <p className="text-slate-500 max-w-md font-bold">This area is reserved for Level-0 MASTER accounts only.</p>
            </div>
        );
    }

    const filteredEmployees = employees.filter(emp => 
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (emp.name && emp.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="container mx-auto px-6 py-10 max-w-7xl">
            {/* Edit Modal */}
            <AnimatePresence>
                {viewingEmployee && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-[32px] p-8 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                                <div className="flex items-center gap-3 text-indigo-600">
                                    <Eye size={24} />
                                    <h2 className="text-2xl font-black">Employee Full Profile</h2>
                                </div>
                                <button onClick={() => setViewingEmployee(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                    <XCircle className="text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Name</label>
                                        <p className="font-bold text-slate-800">{viewingEmployee.name || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Email</label>
                                        <p className="font-bold text-slate-800">{viewingEmployee.email || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Phone</label>
                                        <p className="font-bold text-slate-800">{viewingEmployee.phone || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Alt Phone</label>
                                        <p className="font-bold text-slate-800">{viewingEmployee.alternatePhone || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase">DOB</label>
                                        <p className="font-bold text-slate-800">{viewingEmployee.dob ? new Date(viewingEmployee.dob).toLocaleDateString() : '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Blood Group</label>
                                        <p className="font-bold text-slate-800">{viewingEmployee.bloodGroup || '-'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Current Address</label>
                                        <p className="font-bold text-slate-800">{viewingEmployee.address || '-'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Permanent Address</label>
                                        <p className="font-bold text-slate-800">{viewingEmployee.permanentAddress || '-'}</p>
                                    </div>
                                </div>

                                {/* Work Info */}
                                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-indigo-400 uppercase">Department</label>
                                        <p className="font-bold text-indigo-900">{viewingEmployee.department || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-indigo-400 uppercase">Designation</label>
                                        <p className="font-bold text-indigo-900">{viewingEmployee.designation || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-indigo-400 uppercase">Date of Joining</label>
                                        <p className="font-bold text-indigo-900">{viewingEmployee.joiningDate ? new Date(viewingEmployee.joiningDate).toLocaleDateString() : '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-indigo-400 uppercase">Salary</label>
                                        <p className="font-bold text-indigo-900">₹ {viewingEmployee.baseSalary?.toLocaleString() || '0'}</p>
                                    </div>
                                </div>

                                {/* Bank Details */}
                                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-emerald-500 uppercase">Bank Name</label>
                                        <p className="font-bold text-emerald-900">{viewingEmployee.bankName || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-emerald-500 uppercase">Account Holder</label>
                                        <p className="font-bold text-emerald-900">{viewingEmployee.accountHolderName || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-emerald-500 uppercase">Account Number</label>
                                        <p className="font-bold text-emerald-900">{viewingEmployee.bankAccount || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-emerald-500 uppercase">IFSC Code</label>
                                        <p className="font-bold text-emerald-900">{viewingEmployee.ifscCode || '-'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-emerald-500 uppercase">UPI ID</label>
                                        <p className="font-bold text-emerald-900">{viewingEmployee.upiId || '-'}</p>
                                    </div>
                                </div>

                                {/* KYC & Emergency */}
                                <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-rose-500 uppercase">PAN Number</label>
                                        <p className="font-bold text-rose-900">{viewingEmployee.panNumber || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-rose-500 uppercase">Aadhaar Number</label>
                                        <p className="font-bold text-rose-900">{viewingEmployee.aadhaarNumber || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-rose-500 uppercase">Emergency Contact Name</label>
                                        <p className="font-bold text-rose-900">{viewingEmployee.emergencyContactName || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-rose-500 uppercase">Emergency Contact Phone</label>
                                        <p className="font-bold text-rose-900">{viewingEmployee.emergencyContactPhone || '-'}</p>
                                    </div>
                                </div>

                                {/* Documents Links */}
                                <div className="flex flex-wrap gap-3">
                                    {viewingEmployee.profilePhotoUrl && <a href={viewingEmployee.profilePhotoUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100">View Photo</a>}
                                    {viewingEmployee.panUrl && <a href={viewingEmployee.panUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100">View PAN</a>}
                                    {viewingEmployee.aadhaarUrl && <a href={viewingEmployee.aadhaarUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100">View Aadhaar</a>}
                                    {viewingEmployee.bankProofUrl && <a href={viewingEmployee.bankProofUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100">View Bank Proof</a>}
                                    {viewingEmployee.upiQrUrl && <a href={viewingEmployee.upiQrUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100">View UPI QR</a>}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                {editingEmployee && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-[32px] p-8 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                                <div className="flex items-center gap-3 text-indigo-600">
                                    <FileEdit size={24} />
                                    <h2 className="text-2xl font-black">Edit Employee Profile</h2>
                                </div>
                                <button onClick={() => setEditingEmployee(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                    <XCircle className="text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-1">Email</label>
                                    <input type="text" value={editingEmployee.email} disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 font-bold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-1">Name</label>
                                    <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase mb-1">Department</label>
                                        <input type="text" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase mb-1">Designation</label>
                                        <input type="text" value={editForm.designation} onChange={e => setEditForm({...editForm, designation: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-1">Base Salary (Monthly)</label>
                                    <div className="relative">
                                        <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input type="number" value={editForm.baseSalary} onChange={e => setEditForm({...editForm, baseSalary: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase mb-1">Profile Lock</label>
                                        <button 
                                            onClick={() => setEditForm({...editForm, isLocked: !editForm.isLocked})}
                                            className={`w-full py-3 rounded-xl text-sm font-black uppercase flex items-center justify-center gap-2 transition-all ${
                                                editForm.isLocked ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                            }`}
                                        >
                                            {editForm.isLocked ? <><Lock size={16}/> Locked</> : <><Unlock size={16}/> Unlocked</>}
                                        </button>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase mb-1">KYC Status</label>
                                        <select 
                                            value={editForm.verificationStatus} 
                                            onChange={e => setEditForm({...editForm, verificationStatus: e.target.value})}
                                            className="w-full py-3 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none"
                                        >
                                            <option value="PENDING">Pending</option>
                                            <option value="APPROVED">Approved</option>
                                            <option value="REJECTED">Rejected</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                                    <button onClick={() => setEditingEmployee(null)} className="px-6 py-3 rounded-xl text-sm font-black text-slate-500 hover:bg-slate-100 transition-all">Cancel</button>
                                    <button onClick={handleSaveEdit} disabled={saving} className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 text-indigo-600 mb-2">
                        <Users size={28} className="drop-shadow-sm" />
                        <span className="text-sm font-black uppercase tracking-[0.3em] opacity-80">Master Control</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Employee <span className="text-indigo-600">Directory</span></h1>
                </div>
                
                <div className="w-full md:w-96 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search by name or email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">Employee Info</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">Role & Dept</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">Salary</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">Status</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredEmployees.map((emp) => (
                                <tr key={emp.email} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{emp.name || 'No Name'}</span>
                                            <span className="text-xs font-medium text-slate-500">{emp.email}</span>
                                            <span className="text-xs font-medium text-slate-400 mt-1">{emp.phone || 'No Phone'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">{emp.designation || '-'}</span>
                                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{emp.department || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                            ₹ {emp.baseSalary?.toLocaleString() || '0'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-2">
                                            {emp.verificationStatus === 'APPROVED' ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-md w-fit">
                                                    <CheckCircle2 size={12} /> Approved
                                                </span>
                                            ) : emp.verificationStatus === 'REJECTED' ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-100 px-2.5 py-1 rounded-md w-fit">
                                                    <XCircle size={12} /> Rejected
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-100 px-2.5 py-1 rounded-md w-fit">
                                                    Pending KYC
                                                </span>
                                            )}
                                            
                                            {emp.isLocked ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-md w-fit">
                                                    <Lock size={10} /> Locked
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md w-fit">
                                                    <Unlock size={10} /> Editable
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => setViewingEmployee(emp)}
                                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                                title="View Full Details"
                                            >
                                                <Eye size={20} />
                                            </button>
                                            <button 
                                                onClick={() => handleEditClick(emp)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                title="Edit Employee Details"
                                            >
                                                <FileEdit size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredEmployees.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                                        No employees found matching "{searchQuery}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
