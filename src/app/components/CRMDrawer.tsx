import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Activity, Target, Plus, Calendar, Quote, ExternalLink, Trash2, Database, ArrowRight, Clock, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";

interface CRMDrawerProps {
    selectedResponse: any;
    setSelectedResponse: (val: any) => void;
    drawerTab: "edit" | "history";
    setDrawerTab: (val: "edit" | "history") => void;
    data: any;
    getCellValue: (rowId: string, colId: string, isInternal: boolean) => any;
    handleUpdateCellValue: (rowId: string, colId: string, value: any, isInternal: boolean) => void;
    setOpenFollowUpModal: (val: any) => void;
    safeFormat: (date: any, formatStr: string) => string;
    teamMembers: any[];
    selectedResponseActivities: any[];
    isFetchingActivities: boolean;
    userRole: string;
    isUpdatingValue: boolean;
    handleInstantStatusUpdate: (rowId: string, colId: string, val: any, isInternal: boolean) => void;
    isAccessRestrictedToSelfOnly: boolean;
    isSuperAdmin: boolean;
}

const CRMDrawer: React.FC<CRMDrawerProps> = ({
    selectedResponse,
    setSelectedResponse,
    drawerTab,
    setDrawerTab,
    data,
    getCellValue,
    handleUpdateCellValue,
    setOpenFollowUpModal,
    safeFormat,
    teamMembers,
    selectedResponseActivities,
    isFetchingActivities,
    userRole,
    isUpdatingValue,
    handleInstantStatusUpdate,
    isAccessRestrictedToSelfOnly,
    isSuperAdmin
}) => {
    if (!selectedResponse) return null;

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedResponse(null)}
                className="fixed inset-0 bg-slate-950/90 backdrop-blur-3xl z-[9999999] pointer-events-auto"
            />

            <motion.div
                initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed top-0 right-0 h-full w-full max-w-[800px] bg-white shadow-[-100px_0_200px_rgba(0,0,0,0.6)] z-[9999999] overflow-hidden flex flex-col border-l border-slate-100 pointer-events-auto"
            >
                <div className="relative p-12 overflow-hidden shrink-0 bg-slate-950">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-950 to-emerald-950 opacity-40" />
                    <div className="absolute top-0 right-0 p-20 bg-indigo-500/10 blur-[100px] rounded-full" />

                    <div className="relative z-10 flex flex-col gap-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-[28px] bg-white text-slate-950 flex items-center justify-center shadow-2xl animate-pulse">
                                    <Activity size={28} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-none mb-2">Record Intelligence</h2>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em]">Workspace Matrix v4</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedResponse(null)}
                                className="w-16 h-16 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 rounded-[30px] transition-all border border-white/5 group"
                            >
                                <X size={28} className="group-hover:rotate-90 transition-transform duration-500" />
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex bg-white/5 p-1.5 rounded-[24px] border border-white/10 shadow-inner">
                                <button onClick={() => setDrawerTab('edit')} className={`px-10 py-3.5 rounded-[20px] text-[11px] font-black uppercase tracking-[0.3em] transition-all ${drawerTab === 'edit' ? 'bg-indigo-600 text-white shadow-2xl' : 'text-slate-400 hover:text-white'}`}>Matrix Input</button>
                                <button onClick={() => setDrawerTab('history')} className={`px-10 py-3.5 rounded-[20px] text-[11px] font-black uppercase tracking-[0.3em] transition-all ${drawerTab === 'history' ? 'bg-indigo-600 text-white shadow-2xl' : 'text-slate-400 hover:text-white'}`}>Audit Life</button>
                            </div>
                            <div className="h-10 w-px bg-white/10 mx-4" />
                            <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none">ID: {selectedResponse.id.slice(-8)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-16 bg-white">
                    <AnimatePresence mode="wait">
                        {drawerTab === 'edit' ? (
                            <motion.div
                                key="edit-matrix" initial={{ opacity: 0, scale: 0.98, x: -15 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.98, x: -15 }}
                                className="space-y-16"
                            >
                                <div className="bg-slate-50 p-10 rounded-[56px] border border-slate-100 shadow-sm relative overflow-hidden group/radar">
                                    <div className="absolute top-0 right-0 p-16 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
                                    <div className="flex items-center justify-between mb-10 relative z-10">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-xl">
                                                <Target size={22} className="animate-pulse" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">INTERACTION MATRIX</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Lifecycle & Retention Stage</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setOpenFollowUpModal({ formId: data?.form.id || "", responseId: selectedResponse.id })}
                                            className="px-8 py-4 bg-indigo-600 hover:bg-slate-950 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl hover:shadow-[0_20px_40px_rgba(79,70,229,0.3)] hover:scale-[1.05] flex items-center gap-3"
                                        >
                                            <Plus size={16} /> Deploy REMARK
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 relative z-10">
                                        <div className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-inner group hover:bg-slate-950 hover:border-slate-800 transition-all duration-500">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 group-hover:text-indigo-400">Next Scheduled Interaction</p>
                                            <div className="flex items-center gap-4 text-xl font-black text-slate-950 group-hover:text-white">
                                                <Calendar className="text-indigo-500" size={18} />
                                                {selectedResponse.remarks?.[0]?.nextFollowUpDate ? safeFormat(selectedResponse.remarks[0].nextFollowUpDate, "dd MMM yyyy") : "UNAWAITED"}
                                            </div>
                                        </div>
                                        <div className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-inner group hover:bg-slate-950 hover:border-slate-800 transition-all duration-500">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 group-hover:text-indigo-400">Execution Status</p>
                                            <div className="flex items-center gap-4">
                                                <div className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-sm ${(selectedResponse.remarks?.[0]?.followUpStatus || "") === "Drained" || (selectedResponse.remarks?.[0]?.followUpStatus || "") === "Closed"
                                                    ? "bg-rose-500 text-white shadow-rose-200"
                                                    : "bg-emerald-500 text-white shadow-emerald-200"
                                                    }`}>
                                                    {selectedResponse.remarks?.[0]?.followUpStatus || "ACTIVE PIPELINE"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedResponse.remarks?.[0]?.remark && (
                                        <div className="mt-8 p-10 bg-white rounded-[32px] border border-slate-100 relative group/remark hover:border-indigo-200 transition-all">
                                            <Quote size={30} className="absolute -top-4 -left-2 text-slate-100 group-hover:text-indigo-500/20 transition-colors" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Recent Interaction Node</p>
                                            <p className="text-lg font-bold text-slate-800 leading-relaxed tracking-tight italic">"{selectedResponse.remarks?.[0]?.remark}"</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-12">
                                    <div className="flex items-center gap-5 px-4">
                                        <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-6 shrink-0">DATA PROTOCOLS <div className="h-[2px] w-24 bg-slate-100" /></h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-12 px-2">
                                        {[...data?.internalColumns?.map(c => ({ ...c, isInternal: true })) || [], ...data.form?.fields?.filter(f => !["static", "header", "separator"].includes(f.type)).map(f => ({ ...f, isInternal: false })) || []].map((col) => {
                                            const val = getCellValue(selectedResponse.id, col.id, col.isInternal);
                                            const isInternal = col.isInternal;

                                            return (
                                                <div key={col.id} className="group/field relative">
                                                    <div className="flex flex-col gap-6 p-8 rounded-[48px] bg-white border-2 border-slate-100 group-hover/field:border-indigo-500/30 group-hover/field:shadow-[0_30px_70px_rgba(0,0,0,0.05)] transition-all duration-500 relative z-10">
                                                        <div className="flex items-center justify-between relative px-2">
                                                            <div className="flex items-center gap-4">
                                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover/field:text-indigo-500 transition-colors">{col.label}</label>
                                                                {isInternal && <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">INTERNAL</div>}
                                                            </div>
                                                            {col.type === "dropdown" && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
                                                        </div>

                                                        <div className="relative px-2">
                                                            {col.type === "dropdown" ? (
                                                                <select
                                                                    className="w-full bg-slate-50 border-none rounded-3xl px-8 py-5 text-xl font-black text-slate-950 focus:ring-2 ring-indigo-500/20 appearance-none cursor-pointer transition-all shadow-inner"
                                                                    value={val}
                                                                    onChange={(e) => handleUpdateCellValue(selectedResponse.id, col.id, e.target.value, isInternal)}
                                                                >
                                                                    <option value="">Select Option Protocol...</option>
                                                                    {col.options?.map((opt: any) => {
                                                                        const optLabel = typeof opt === 'string' ? opt : opt.label;
                                                                        return <option key={optLabel} value={optLabel}>{optLabel}</option>;
                                                                    })}
                                                                </select>
                                                            ) : col.type === "user" ? (
                                                                <select
                                                                    className="w-full bg-slate-50 border-none rounded-3xl px-8 py-5 text-xl font-black text-slate-950 focus:ring-2 ring-indigo-500/20 appearance-none cursor-pointer transition-all shadow-inner"
                                                                    value={val}
                                                                    onChange={(e) => handleUpdateCellValue(selectedResponse.id, col.id, e.target.value, isInternal)}
                                                                >
                                                                    <option value="">Choose Agent Entity...</option>
                                                                    {teamMembers.map(tm => (
                                                                        <option key={tm.clerkId} value={tm.clerkId}>{tm.firstName ? `${tm.firstName} ${tm.lastName || ''}` : tm.email}</option>
                                                                    ))}
                                                                </select>
                                                            ) : col.type === "textarea" ? (
                                                                <textarea
                                                                    className="w-full bg-white border-2 border-slate-100 rounded-[32px] p-8 text-[18px] font-bold text-slate-800 focus:border-indigo-500 focus:ring-0 min-h-[140px] resize-none leading-relaxed transition-all shadow-inner"
                                                                    value={val}
                                                                    onChange={(e) => handleUpdateCellValue(selectedResponse.id, col.id, e.target.value, isInternal)}
                                                                    placeholder={`Enter detailed ${col.label} metrics...`}
                                                                />
                                                            ) : col.type === "file" ? (
                                                                <div className="flex flex-col gap-6">
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        {String(val || "").split(",").filter(Boolean).map((fileUrl, fIdx) => (
                                                                            <div key={fIdx} className="relative group/file">
                                                                                <div className="aspect-square bg-slate-100 rounded-[32px] overflow-hidden border-2 border-slate-200 group-hover/file:border-indigo-400 group-hover/file:shadow-2xl transition-all duration-500">
                                                                                    <img src={fileUrl} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://img.icons8.com/color/96/file.png')} />
                                                                                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                                                                        <a href={fileUrl} target="_blank" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-950 hover:bg-indigo-600 hover:text-white transition-all transform hover:scale-110"><ExternalLink size={20} /></a>
                                                                                        <button onClick={() => {
                                                                                            const files = String(val || "").split(",").filter(Boolean);
                                                                                            files.splice(fIdx, 1);
                                                                                            handleUpdateCellValue(selectedResponse.id, col.id, files.join(","), isInternal);
                                                                                        }} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-600 hover:bg-rose-600 hover:text-white transition-all transform hover:scale-110"><Trash2 size={20} /></button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        <div className="relative group/upload h-full">
                                                                            <input
                                                                                type="file"
                                                                                onChange={(e) => {
                                                                                    const file = e.target.files?.[0];
                                                                                    if (file) {
                                                                                        const currentFiles = String(val || "").split(",").filter(Boolean);
                                                                                        if (currentFiles.length >= 4) { toast.error("Matrix limit reached"); return; }
                                                                                        toast.loading("Uploading...");
                                                                                        setTimeout(() => {
                                                                                            handleUpdateCellValue(selectedResponse.id, col.id, [...currentFiles, "https://images.unsplash.com/photo-1621252179027-94459d278660?auto=format"].join(","), isInternal);
                                                                                            toast.dismiss();
                                                                                            toast.success("Uploaded");
                                                                                        }, 1000);
                                                                                    }
                                                                                }}
                                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                            />
                                                                            <div className="aspect-square border-[3px] border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center gap-4 group-hover/upload:border-indigo-400 group-hover/upload:bg-indigo-50/50 transition-all duration-500 shadow-inner">
                                                                                <UploadCloud size={28} className="text-slate-400 group-hover:text-indigo-600" />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <input
                                                                    type={col.type === "number" || col.type === "currency" ? "number" : col.type === "date" ? "date" : "text"}
                                                                    className="w-full bg-slate-50 border-none rounded-3xl px-8 py-5 text-xl font-black text-slate-950 focus:ring-2 ring-indigo-500/20 appearance-none transition-all shadow-inner tracking-tight"
                                                                    value={val}
                                                                    onChange={(e) => handleUpdateValue(selectedResponse.id, col.id, e.target.value, isInternal)}
                                                                    placeholder={`Inject ${col.label} value...`}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="history-matrix" initial={{ opacity: 0, scale: 0.98, x: 15 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.98, x: 15 }}
                                className="space-y-12"
                            >
                                <div className="flex flex-col gap-10">
                                    <div className="flex items-center justify-between px-6">
                                        <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-6">Audit Lifecycle <div className="h-[2px] w-24 bg-slate-100 rounded-full" /></h3>
                                        <span className="text-[10px] font-black text-slate-500 bg-slate-100/80 px-5 py-2 rounded-full uppercase tracking-[0.2em]">{selectedResponseActivities.length} Actions</span>
                                    </div>
                                    <div className="space-y-10 px-6 border-l-[3px] border-slate-100 ml-6 relative">
                                        {isFetchingActivities ? (
                                            <div className="space-y-8 pl-12">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="h-32 w-full bg-slate-100 animate-pulse rounded-[56px]" />
                                                ))}
                                            </div>
                                        ) : selectedResponseActivities.length > 0 ? (
                                            selectedResponseActivities.map((act) => (
                                                <div key={act.id} className="relative pl-12 pb-12 group/audit">
                                                    <div className="absolute left-[-15px] top-2 w-7 h-7 rounded-full bg-white border-[6px] border-slate-100 group-hover/audit:border-indigo-500 group-hover/audit:scale-125 transition-all duration-500 shadow-xl" />
                                                    <div className="flex flex-col gap-6">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-12 h-12 rounded-[18px] bg-slate-950 flex items-center justify-center text-[12px] font-black text-white">{act.userName?.[0] || "U"}</div>
                                                            <div>
                                                                <p className="text-[16px] font-black text-slate-950 mb-1">{act.userName}</p>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{safeFormat(act.createdAt, "dd MMM yyyy, HH:mm:ss")}</span>
                                                            </div>
                                                        </div>
                                                        <div className="bg-slate-50/50 p-10 rounded-[56px] border border-slate-100 group-hover/audit:bg-white group-hover/audit:border-indigo-200 transition-all duration-700">
                                                            <div className="flex items-center gap-4 mb-6">
                                                                <Database size={14} className="text-indigo-600" />
                                                                <p className="text-[12px] text-slate-400 font-black uppercase tracking-widest">Field Updated: <span className="text-slate-950">{act.columnName}</span></p>
                                                            </div>
                                                            <div className="flex items-center gap-8">
                                                                <div className="flex-1 px-8 py-5 rounded-3xl bg-rose-50/50 text-rose-600 line-through opacity-50 truncate font-bold">{act.oldValue || "-"}</div>
                                                                <ArrowRight size={20} className="text-slate-300" />
                                                                <div className="flex-1 px-8 py-5 rounded-3xl bg-emerald-50 text-emerald-600 font-black truncate shadow-sm">{act.newValue}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50 rounded-[64px] border-2 border-dashed border-slate-200 ml-[-20px]">
                                                <Clock size={50} className="text-slate-200 mb-6" />
                                                <h4 className="text-[14px] font-black text-slate-950 uppercase tracking-[0.4em]">Silent Matrix</h4>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </>
    );
};

export default CRMDrawer;
