"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Zap, CheckCircle2, History, Palette, 
    Sun, Moon, Sparkles 
} from 'lucide-react';
import FormRemarkModal from "./FormRemarkModal";
import PaymentHubModal from "./PaymentHubModal";
import PaymentHubDashboard from "./PaymentHubDashboard";

export const CRMStatusMatrixModal = ({ 
    statusMatrixModal, 
    setStatusMatrixModal, 
    handleInstantStatusUpdate, 
    handleStatusCellUpdate,
    setOpenFollowUpModal,
    data,
    CALL_STATUS_OPTIONS 
}: any) => {
    if (!statusMatrixModal) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[99999999] flex items-center justify-center p-4 pointer-events-auto">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={() => setStatusMatrixModal(null)} 
                    className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 30 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.9, y: 30 }} 
                    className="relative w-full max-w-sm bg-white rounded-[48px] shadow-[0_50px_100px_rgba(0,0,0,0.4)] overflow-hidden border border-white"
                >
                    <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                <Zap size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">Update Status</h3>
                                <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Select matrix node</p>
                            </div>
                        </div>
                        <button onClick={() => setStatusMatrixModal(null)} className="p-2.5 text-slate-400 hover:text-rose-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 gap-2">
                            {(statusMatrixModal.options && statusMatrixModal.options.length > 0
                                ? statusMatrixModal.options.map((o: any) => typeof o === 'string' ? o : o.label)
                                : CALL_STATUS_OPTIONS
                            ).map((opt: string) => {
                                const isSelected = statusMatrixModal.val === opt;
                                return (
                                    <button
                                        key={opt}
                                        onClick={() => {
                                            if (statusMatrixModal.colId === "__followUpStatus") {
                                                handleInstantStatusUpdate(statusMatrixModal.rowId, opt);
                                            } else {
                                                handleStatusCellUpdate(statusMatrixModal.rowId, statusMatrixModal.colId, opt, statusMatrixModal.isInternal);
                                            }
                                            setStatusMatrixModal(null);
                                        }}
                                        className={`w-full text-left px-6 py-4 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all flex items-center justify-between group ${isSelected
                                            ? 'bg-indigo-600 text-white shadow-xl scale-[1.02]'
                                            : 'bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'
                                            }`}
                                    >
                                        <span>{opt}</span>
                                        {isSelected ? <CheckCircle2 size={18} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200 group-hover:border-indigo-300 transition-colors" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                        <button
                            onClick={() => {
                                setOpenFollowUpModal({ formId: data?.form?.id || '', responseId: statusMatrixModal.rowId });
                                setStatusMatrixModal(null);
                            }}
                            className="flex-1 py-4 bg-white text-indigo-600 rounded-[20px] text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                        >
                            <History size={16} /> Interaction Log
                        </button>
                        <button
                            onClick={() => setStatusMatrixModal(null)}
                            className="flex-1 py-4 bg-slate-200 text-slate-600 rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all"
                        >
                            Dismiss
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export const CRMThemePicker = ({ 
    showThemePicker, 
    setShowThemePicker, 
    canvasTheme, 
    setCanvasTheme 
}: any) => {
    if (!showThemePicker) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowThemePicker(false)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" />
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden w-full max-w-sm">
                    <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Palette size={18} /></div>
                            <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest">Workspace Core</h3>
                        </div>
                        <button onClick={() => setShowThemePicker(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-200 rounded-full transition-all"><X size={20} /></button>
                    </div>
                    <div className="p-6 space-y-3">
                        {[
                            { id: 'modern', label: 'Ethereal Light', icon: <Sun size={18} />, color: 'bg-white', desc: 'Maximum Clarity' },
                            { id: 'dark', label: 'Obsidian Night', icon: <Moon size={18} />, color: 'bg-slate-950', desc: 'Pro Performance' },
                            { id: 'glass', label: 'Crystal Matrix', icon: <Sparkles size={18} />, color: 'bg-indigo-50', desc: 'Advanced Depth' }
                        ].map((t) => (
                            <button key={t.id} onClick={() => { setCanvasTheme(t.id as any); setShowThemePicker(false); }} className={`w-full p-5 rounded-3xl flex items-center gap-5 transition-all text-left border-2 ${canvasTheme === t.id ? 'border-indigo-600 bg-indigo-50/50 shadow-xl' : 'border-slate-50 hover:bg-slate-50'}`}>
                                <div className={`w-12 h-12 rounded-2xl shadow-inner flex items-center justify-center ${t.color}`}>{t.icon}</div>
                                <div>
                                    <p className="text-xs font-black text-slate-950 uppercase tracking-wider">{t.label}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export const CRMAuxiliaryModals = ({
    openFollowUpModal,
    setOpenFollowUpModal,
    userRole,
    setRecentlyUpdatedIds,
    fetchData,
    currentPage,
    rowsPerPage,
    searchTerm,
    sortBy,
    sortOrder,
    conditions,
    filterConjunction,
    openPaymentModal,
    setOpenPaymentModal,
    isPaymentHubOpen,
    setIsPaymentHubOpen,
    formId
}: any) => {
    return (
        <>
            <AnimatePresence>
                {/* 🛸 FOLLOW-UP & REMARK MODAL */}
                {openFollowUpModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000001] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md pointer-events-auto"
                    >
                        <FormRemarkModal
                            formId={openFollowUpModal.formId}
                            responseId={openFollowUpModal.responseId}
                            columnId={openFollowUpModal.columnId}
                            onClose={() => setOpenFollowUpModal(null)}
                            userRole={userRole || 'GUEST'}
                            onSave={() => {
                                if (openFollowUpModal?.responseId) {
                                    setRecentlyUpdatedIds((prev: any) => ({ ...prev, [openFollowUpModal.responseId]: Date.now() }));
                                    setTimeout(() => {
                                        setRecentlyUpdatedIds((prev: any) => {
                                            const next = { ...prev };
                                            if (openFollowUpModal?.responseId) delete next[openFollowUpModal.responseId];
                                            return next;
                                        });
                                    }, 2500);
                                }
                                fetchData(currentPage, rowsPerPage, searchTerm, sortBy, sortOrder, conditions, filterConjunction, true);
                            }}
                        />
                    </motion.div>
                )}

                {/* 🛸 PAYMENT MODAL */}
                {openPaymentModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000002] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md pointer-events-auto"
                    >
                        <PaymentHubModal
                            formId={openPaymentModal.formId}
                            responseId={openPaymentModal.responseId}
                            userRole={userRole || 'GUEST'}
                            onClose={() => setOpenPaymentModal(null)}
                            onSave={() => {
                                if (openPaymentModal?.responseId) {
                                    setRecentlyUpdatedIds((prev: any) => ({ ...prev, [openPaymentModal.responseId]: Date.now() }));
                                    setTimeout(() => {
                                        setRecentlyUpdatedIds((prev: any) => {
                                            const next = { ...prev };
                                            if (openPaymentModal?.responseId) delete next[openPaymentModal.responseId];
                                            return next;
                                        });
                                    }, 2500);
                                }
                                fetchData(currentPage, rowsPerPage, searchTerm, sortBy, sortOrder, conditions, filterConjunction, true);
                            }}
                        />
                    </motion.div>
                )}

                {/* 🛸 PAYMENT HUB DASHBOARD */}
                {isPaymentHubOpen && (
                    <motion.div 
                        initial={{ opacity: 0, x: "100%" }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: "100%" }}
                        className="fixed inset-0 z-[10000003] pointer-events-auto"
                    >
                        <PaymentHubDashboard
                            formId={formId}
                            onClose={() => setIsPaymentHubOpen(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
