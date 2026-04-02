import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Bot, ArrowUpRight, ArrowUp, Activity, RefreshCw, Download, Filter } from "lucide-react";

interface CRMAIComponentsProps {
    isMounted: boolean;
    isAIFilterOpen: boolean;
    setIsAIFilterOpen: (val: boolean) => void;
    messages: any[];
    setMessages: (val: any[]) => void;
    input: string;
    handleInputChange: (e: any) => void;
    handleSubmit: (e: any) => void;
    isAIFetching: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    reportSuggestions: any[];
    isAIReportOpen: boolean;
    setIsAIReportOpen: (val: boolean) => void;
    aiReportHtml: string | null;
    isReportCached: boolean;
    isGeneratingReport: boolean;
    handleGenerateReport: (refresh?: boolean) => void;
    handleDownloadPDF: (html: string, title: string) => void;
    isDynamicReportOpen: boolean;
    setIsDynamicReportOpen: (val: boolean) => void;
    dynamicStats: any;
}

const CRMAIComponents: React.FC<CRMAIComponentsProps> = ({
    isMounted,
    isAIFilterOpen,
    setIsAIFilterOpen,
    messages,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
    isAIFetching,
    messagesEndRef,
    reportSuggestions,
    isAIReportOpen,
    setIsAIReportOpen,
    aiReportHtml,
    isReportCached,
    isGeneratingReport,
    handleGenerateReport,
    handleDownloadPDF,
    isDynamicReportOpen,
    setIsDynamicReportOpen,
    dynamicStats
}) => {
    return (
        <>
            <AnimatePresence>
                {isMounted && isAIFilterOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAIFilterOpen(false)}
                            className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-[10000004]"
                        />
                        <motion.div
                            initial={{ opacity: 0, x: 300, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 300, scale: 0.95 }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className="fixed right-0 top-0 bottom-0 w-full md:w-[420px] bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.05)] z-[10000005] flex flex-col border-l border-slate-100"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white/80">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-[14px] flex items-center justify-center shadow-lg shadow-indigo-200">
                                        <Sparkles size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-sm font-black text-slate-900 tracking-tighter">AI Assistant</h3>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Powered by Gemini Pro</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setMessages([])}
                                        className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        Clear
                                    </button>
                                    <button onClick={() => setIsAIFilterOpen(false)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
                                {messages.length === 0 && (
                                    <div className="space-y-8 py-4">
                                        <div className="flex flex-col items-center justify-center text-center space-y-3 opacity-80">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                                                <Bot size={24} className="text-indigo-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Intelligence Center</h4>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1">Select an analysis strategy to begin</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            {reportSuggestions.map((s, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => {
                                                        handleInputChange({ target: { value: s.query } } as any);
                                                        // This requires the form to be in this component or passed as ref
                                                        setTimeout(() => {
                                                            const form = document.getElementById("ai-chat-form") as HTMLFormElement;
                                                            if (form) form.requestSubmit();
                                                        }, 50);
                                                    }}
                                                    className="group text-left p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all active:scale-[0.98]"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">{s.title}</span>
                                                        <ArrowUpRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-2 line-clamp-1 group-hover:text-slate-500 transition-colors">{s.query}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {messages.map((m: any) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={m.id}
                                        className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className={`max-w-[85%] p-4 rounded-[20px] ${m.role === 'user'
                                            ? 'bg-slate-900 text-white rounded-tr-sm shadow-xl shadow-slate-200/50'
                                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm shadow-sm'
                                            }`}>
                                            <div className="text-sm font-semibold whitespace-pre-wrap leading-relaxed">
                                                {typeof (m as any).content === 'string' ? (m as any).content : (String((m as any).ui || JSON.stringify((m as any).content || '')))}
                                            </div>

                                            {Array.isArray(m.toolInvocations) && m.toolInvocations.map((toolInvocation: any) => {
                                                if (toolInvocation.toolName === 'applyFilter' && toolInvocation.state === 'result') {
                                                    return (
                                                        <div key={toolInvocation.toolCallId} className="mt-4 p-3 bg-indigo-50/80 border border-indigo-100/50 rounded-xl">
                                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider flex items-center gap-2 mb-2">
                                                                <Filter size={12} className="text-indigo-400" /> Filters Applied
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {toolInvocation.result?.filtersApplied && Array.isArray(toolInvocation.result.filtersApplied) && toolInvocation.result.filtersApplied.map((f: any, i: number) => (
                                                                    <span key={i} className="inline-flex px-2 py-1 text-[10px] font-bold text-indigo-700 bg-white border border-indigo-100 rounded shadow-sm items-center gap-1.5 truncate max-w-[150px]">
                                                                        <span className="text-indigo-400">{String(f.operator || f.op)}</span>
                                                                        <span>{String(f.value || f.val)}</span>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>
                                    </motion.div>
                                ))}
                                {isAIFetching && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                        <div className="bg-white p-4 rounded-[20px] border border-slate-100 rounded-tl-sm min-w-[70px] flex justify-center items-center gap-1.5 shadow-sm">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                                            <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-4 bg-white border-t border-slate-100">
                                <form id="ai-chat-form" onSubmit={handleSubmit} className="relative flex items-center shadow-lg shadow-slate-100/50 rounded-2xl">
                                    <input
                                        value={input}
                                        onChange={handleInputChange}
                                        placeholder="Message AI..."
                                        className="w-full pl-5 pr-14 py-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 focus:bg-white transition-all placeholder:text-slate-400"
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        disabled={!(input || "").trim() || isAIFetching}
                                        className="absolute right-2 p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition-all active:scale-95"
                                    >
                                        <ArrowUp size={16} />
                                    </button>
                                </form>
                                <div className="mt-3 flex justify-between items-center px-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-1"><Sparkles size={10} /> AI SDK V3</p>
                                    <button
                                        onClick={(e) => { e.preventDefault(); handleGenerateReport(); }}
                                        disabled={isGeneratingReport}
                                        className="text-[9px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-600 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    >
                                        {isGeneratingReport ? "Analyzing..." : "Generate Full Report"} <ArrowUpRight size={10} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isAIReportOpen && (
                    <div className="fixed inset-0 z-[10000006] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAIReportOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-[32px] shadow-2xl p-8 border border-white custom-scrollbar">
                            <div className="flex justify-between items-start mb-6 sticky top-0 bg-white/80 backdrop-blur-md pt-2 pb-4 z-10 border-b border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-600 rounded-[24px]">
                                        <Activity size={32} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-black text-slate-900 tracking-tighter">AI Insight Report</h3>
                                            {isReportCached && (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-bold uppercase rounded-full border border-slate-200">Archived Analysis</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Generated by Gemini Matrix</p>
                                            <button
                                                onClick={() => handleGenerateReport(true)}
                                                disabled={isGeneratingReport}
                                                className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-50"
                                            >
                                                <RefreshCw size={10} className={isGeneratingReport ? "animate-spin" : ""} />
                                                {isGeneratingReport ? "Analyzing..." : "Refresh"}
                                            </button>
                                            <div className="w-1 h-1 bg-slate-300 rounded-full mx-1" />
                                            <button
                                                onClick={() => handleDownloadPDF(aiReportHtml || "", "AI Insight Report")}
                                                className="text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                            >
                                                <Download size={10} /> PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setIsAIReportOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-[20px] transition-all">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="mt-4 text-slate-800 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: aiReportHtml || "No report content generated." }}></div>

                            <div className="mt-8 flex justify-end">
                                <button onClick={() => setIsAIReportOpen(false)} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                                    Dismiss Report
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isDynamicReportOpen && dynamicStats && (
                    <div className="fixed inset-0 z-[10000007] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDynamicReportOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl p-8 border border-white">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-600 rounded-[24px]">
                                        <BarChart3 size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tighter">Live Dynamic Report</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Real-time Matrix Aggregation</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            const el = document.getElementById('dynamic-report-content');
                                            if (el) handleDownloadPDF(el.innerHTML, "Dynamic Analytics Report");
                                        }}
                                        className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1"
                                    >
                                        <Download size={12} /> PDF Export
                                    </button>
                                    <button onClick={() => setIsDynamicReportOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-[20px] transition-all">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            <div id="dynamic-report-content" className="mt-4 space-y-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Records</p>
                                        <p className="text-3xl font-black text-slate-900">{dynamicStats.totalEntries}</p>
                                    </div>
                                    <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">New Today</p>
                                        <p className="text-3xl font-black text-emerald-700">{dynamicStats.newToday}</p>
                                    </div>
                                    <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">New This Month</p>
                                        <p className="text-3xl font-black text-blue-700">{dynamicStats.newThisMonth}</p>
                                    </div>
                                </div>

                                {Object.keys(dynamicStats.statusCounts).length > 0 && (
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 mt-6">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-200 pb-2">{dynamicStats.statusColName} Breakdown</p>
                                        <div className="space-y-3">
                                            {Object.entries(dynamicStats.statusCounts).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([status, count]) => (
                                                <div key={status} className="flex items-center justify-between">
                                                    <span className="text-sm font-bold text-slate-700">{status || "Unspecified"}</span>
                                                    <span className="text-sm font-black text-indigo-600 px-3 py-1 bg-indigo-50 rounded-lg">{count as number}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

import { BarChart3 } from "lucide-react";
export default CRMAIComponents;
