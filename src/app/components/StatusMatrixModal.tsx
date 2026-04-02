"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, History } from "lucide-react";
import { FaHistory } from "react-icons/fa";

interface StatusMatrixModalProps {
    isOpen: boolean;
    onClose: () => void;
    label: string;
    val: string;
    options: any[];
    onSelect: (opt: string) => void;
    onFullLog?: () => void;
}

const DEFAULT_STATUS_OPTIONS = [
    "Scheduled", "Called", "Call Again", "Call done", "Not interested", "RNR", "RNR2 (Checked)", "RNR3", "Switch off", "Invalid Number", "Walked In", "Follow-up Done", "Missed", "Closed", "Walk-in scheduled"
];

export default function StatusMatrixModal({
    isOpen,
    onClose,
    label,
    val,
    options = [],
    onSelect,
    onFullLog
}: StatusMatrixModalProps) {
    if (!isOpen) return null;

    const displayOptions = options && options.length > 0 
        ? options.map((o: any) => typeof o === 'string' ? o : o.label) 
        : DEFAULT_STATUS_OPTIONS;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={onClose} 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.9, opacity: 0, y: 20 }} 
                className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm overflow-hidden relative z-10 border-4 border-white"
            >
                <div className="p-8 border-b border-slate-50 bg-[#F9FAFB] flex items-center justify-between">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">Update Dimension</h3>
                        <p className="text-[15px] font-black text-slate-800 tracking-tighter mt-1">{label}</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-100">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>
                
                <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar bg-white">
                    <div className="grid grid-cols-1 gap-2">
                        {displayOptions.map(opt => {
                            const isSelected = val === opt;
                            return (
                                <button
                                    key={opt}
                                    onClick={() => onSelect(opt)}
                                    className={`w-full text-left px-6 py-4 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all flex items-center justify-between group ${
                                        isSelected 
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
                    {onFullLog && (
                        <button 
                            onClick={onFullLog}
                            className="flex-1 py-4 bg-white text-indigo-600 rounded-[20px] text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                        >
                            <History size={16} /> Interaction Log
                        </button>
                    )}
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 bg-slate-200 text-slate-600 rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all"
                    >
                        Dismiss
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
