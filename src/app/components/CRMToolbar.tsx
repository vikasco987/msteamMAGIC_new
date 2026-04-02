import React from "react";
import {
    ArrowLeft,
    Search,
    Maximize2,
    BarChart3,
    Calendar,
    IndianRupee,
    UploadCloud,
    Zap,
    Sparkles,
    Palette,
    Filter,
    Eye,
    Lock,
    Plus,
    Table,
    LayoutGrid,
    Minimize2,
    Pin,
    PinOff,
    ShieldCheck,
    CloudOff,
    Globe
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface CRMToolbarProps {
    canvasTheme: string;
    router: any;
    data: any;
    isFullScreen: boolean;
    isPinned: boolean;
    togglePin: () => void;
    isUserInvolved: boolean;
    isPureMaster: boolean;
    isOnline: boolean;
    handleManualSync: () => void;
    pendingOfflineCount: number;
    handleClearFilters: () => void;
    activeViewId: string | null;
    conditions: any[];
    savedViews: any[];
    applySavedView: (view: any) => void;
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    setIsDynamicReportOpen: (val: boolean) => void;
    setIsPaymentHubOpen: (val: boolean) => void;
    setIsBulkImportOpen: (val: boolean) => void;
    sortBy: string;
    setSortBy: (val: string) => void;
    setSortOrder: (val: "asc" | "desc") => void;
    setIsLeadAssignHubOpen: (val: boolean) => void;
    setIsAIFilterOpen: (val: boolean) => void;
    setIsThemePickerOpen: (val: boolean) => void;
    setIsFilterBuilderOpen: (val: boolean) => void;
    setIsColumnManagerOpen: (val: boolean) => void;
    hiddenColumns: any[];
    isMaster: boolean;
    setIsAccessModalOpen: (val: boolean) => void;
    handleAddRow: () => void;
    currentView: "table" | "kanban";
    setCurrentView: (val: "table" | "kanban") => void;
    setIsAddColumnOpen: (val: boolean) => void;
    density: "compact" | "standard" | "comfortable";
    setDensity: (val: "compact" | "standard" | "comfortable") => void;
    setIsFullScreen: (val: boolean) => void;
    setConditions: React.Dispatch<React.SetStateAction<any[]>>;
    isWebsiteMode?: boolean;
    formId?: string;
}

const CRMToolbar: React.FC<CRMToolbarProps> = ({
    canvasTheme,
    router,
    data,
    isFullScreen,
    isPinned,
    togglePin,
    isUserInvolved,
    isPureMaster,
    isOnline,
    handleManualSync,
    pendingOfflineCount,
    handleClearFilters,
    activeViewId,
    conditions,
    savedViews,
    applySavedView,
    searchTerm,
    setSearchTerm,
    setIsDynamicReportOpen,
    setIsPaymentHubOpen,
    setIsBulkImportOpen,
    sortBy,
    setSortBy,
    setSortOrder,
    setIsLeadAssignHubOpen,
    setIsAIFilterOpen,
    setIsThemePickerOpen,
    setIsFilterBuilderOpen,
    setIsColumnManagerOpen,
    hiddenColumns,
    isMaster,
    setIsAccessModalOpen,
    handleAddRow,
    currentView,
    setCurrentView,
    setIsAddColumnOpen,
    density,
    setDensity,
    setIsFullScreen,
    setConditions,
    isWebsiteMode = false,
    formId
}) => {
    
    // Check if Blank Filter is active
    const isBlankFilterActive = conditions.some(c => c.colId === "isTouched" && c.val === false);

    const toggleBlankFilter = () => {
        if (isBlankFilterActive) {
            setConditions(prev => prev.filter(c => c.colId !== "isTouched"));
        } else {
            // Clear other interaction filters if any, and add isTouched: false
            setConditions(prev => [
                ...prev.filter(c => c.colId !== "isTouched"),
                { colId: "isTouched", op: "equals", val: false }
            ]);
        }
    };

    return (
        <header className={`h-[68px] border-b px-6 flex items-center justify-between shrink-0 z-50 shadow-sm relative transition-colors duration-500 ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
            ? 'bg-black/20 backdrop-blur-md border-white/10'
            : 'bg-white border-slate-200'
            }`}>
            <div className="flex items-center gap-4">
                {isWebsiteMode ? (
                    <Link href={`/crm/forms/${formId}/responses`} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center group shadow-lg shadow-indigo-100">
                        <ArrowLeft size={16} />
                        <span className="ml-2 text-[10px] font-black uppercase tracking-widest hidden md:block">Back to CRM</span>
                    </Link>
                ) : (
                    <button onClick={() => router.back()} className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center group">
                        <ArrowLeft size={16} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
                    </button>
                )}
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className={`text-lg font-black tracking-tight transition-colors duration-500 ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-white' : 'text-slate-900'}`}>{data?.form?.title || (isWebsiteMode ? "Website Matrix" : "Data Explorer")}</h1>
                        {isUserInvolved && (
                            <button
                                onClick={togglePin}
                                className={`p-1.5 rounded-lg transition-all ${isPinned ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent')}`}
                                title={isPinned ? "Unpin from sidebar" : "Pin to sidebar"}
                            >
                                {isPinned ? <Pin className="fill-current" size={16} /> : <PinOff size={16} />}
                            </button>
                        )}
                        {isWebsiteMode && (
                             <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg shadow-indigo-100 border border-indigo-400/30">
                                <Globe size={10} className="text-white" />
                                <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Website Interaction Mode</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{isPureMaster ? "Master Core" : "Live Matrix"}</span>
                        </div>
                        {isPureMaster && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200">
                                <ShieldCheck size={10} className="text-white" />
                                <span className="text-[9px] font-black text-white uppercase tracking-widest">Master Auth</span>
                            </div>
                        )}

                        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border shadow-sm transition-all cursor-pointer ${isOnline ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-rose-50 border-rose-200 animate-pulse'}`} onClick={handleManualSync}>
                            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isOnline ? 'text-slate-600' : 'text-rose-600'}`}>
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                            {pendingOfflineCount > 0 && (
                                <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-md ml-1 border border-amber-200">
                                    <CloudOff size={10} />
                                    {pendingOfflineCount} Pending Sync
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-1.5">
                        <button
                            onClick={handleClearFilters}
                            className={`text-[10px] font-black uppercase tracking-widest transition-all ${!activeViewId && conditions.length === 0 ? 'text-indigo-600' : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}
                        >
                            Default Canvas
                        </button>
                        {savedViews.slice(0, 3).map(view => (
                            <button
                                key={view.id}
                                onClick={() => applySavedView(view)}
                                className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeViewId === view.id ? 'text-indigo-600' : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}
                            >
                                {view.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 -mb-2 scrollbar-none scroll-smooth">
                <div className="flex flex-nowrap items-center gap-2 w-max shrink-0 pr-4">
                    {/* 🔥 ULTRA PRIORITIZED INTERACTION CONTROLS */}
                    <div className="flex items-center gap-2 px-1 py-1 bg-slate-900/5 rounded-xl border border-slate-200 shadow-inner shrink-0">
                        <button
                            onClick={() => {
                                if (sortBy === "__mtv") {
                                    setSortBy("__submittedAt");
                                    setSortOrder("desc");
                                } else {
                                    setSortBy("__mtv");
                                    setSortOrder("desc");
                                }
                            }}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm h-9 ${sortBy === "__mtv"
                                ? 'bg-amber-100 text-amber-700 border-amber-200 ring-2 ring-amber-100 shadow-amber-100'
                                : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-none')}`}
                            title="Prioritize Untouched Leads (Sort)"
                        >
                            <Zap size={12} className={sortBy === "__mtv" ? "fill-amber-500 text-amber-500 animate-pulse" : ""} />
                            Untouched
                        </button>

                        <button
                            onClick={toggleBlankFilter}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm h-9 ${isBlankFilterActive
                                ? 'bg-rose-100 text-rose-700 border-rose-200 ring-2 ring-rose-100 shadow-rose-100'
                                : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-none')}`}
                            title="Filter: Show ONLY Blank Leads"
                        >
                            <Filter size={12} className={isBlankFilterActive ? "fill-rose-500 text-rose-500" : ""} />
                            Blank Filter
                        </button>
                    </div>

                    <div className="relative group shrink-0">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-500' : 'text-slate-400'} group-focus-within:text-indigo-500`} size={14} />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search records..."
                            className={`pl-9 pr-4 py-2 border rounded-lg outline-none text-xs font-bold transition-all min-w-[200px] ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                ? 'bg-white/5 border-white/10 text-white placeholder-slate-500 focus:bg-white/10 focus:ring-white/5'
                                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-indigo-50/50 focus:border-indigo-500'
                                }`}
                        />
                    </div>

                    <button
                        onClick={() => window.open(`${window.location.pathname}?fullview=true`, "_blank")}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-slate-100"
                    >
                        <Maximize2 size={12} />
                        Full View
                    </button>

                    <button
                        onClick={() => setIsDynamicReportOpen(true)}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-indigo-200 shadow-sm"
                    >
                        <BarChart3 size={12} />
                        Analytics
                    </button>

                    <button
                        onClick={() => window.open("/dashboard/followups", "_blank")}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-rose-200 shadow-sm"
                    >
                        <Calendar size={12} />
                        Follow-up Board
                    </button>

                    <button
                        onClick={() => setIsPaymentHubOpen(true)}
                        className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-emerald-200 shadow-sm"
                    >
                        <IndianRupee size={12} />
                        Payment Hub
                    </button>
                    <button
                        onClick={() => setIsBulkImportOpen(true)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg"
                    >
                        <UploadCloud size={12} />
                        Smart Update
                    </button>

                    {/* Moved to prioritized section below */}

                    <button
                        onClick={() => setIsLeadAssignHubOpen(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
                        title="Rapid Lead Distribution Hub"
                    >
                        <Sparkles size={12} />
                        Lead Distribute
                    </button>

                    <button
                        onClick={() => setIsAIFilterOpen(true)}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                    >
                        <Sparkles size={12} className="animate-pulse" />
                        Ask AI
                    </button>

                    <button
                        onClick={() => setIsThemePickerOpen(true)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                            ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        <Palette size={12} />
                        Canvas
                    </button>

                    <button
                        onClick={() => setIsFilterBuilderOpen(true)}
                        className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 border font-black text-[10px] uppercase tracking-widest ${conditions.length > 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')}`}
                    >
                        <Filter size={12} />
                        Filters
                        {conditions.length > 0 && <span className="ml-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[8px]">{conditions.length}</span>}
                    </button>

                    <button
                        onClick={() => setIsColumnManagerOpen(true)}
                        className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 border font-black text-[10px] uppercase tracking-widest ${hiddenColumns.length > 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        <Eye size={12} />
                        Columns
                        {hiddenColumns.length > 0 && <span className="ml-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[8px]">{hiddenColumns.length}</span>}
                    </button>

                    {isMaster && (
                        <button
                            onClick={() => setIsAccessModalOpen(true)}
                            className="px-4 py-2 bg-slate-900 text-white rounded-lg flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                        >
                            <Lock size={12} />
                            Access Control
                        </button>
                    )}

                    <button
                        onClick={handleAddRow}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                        <Plus size={14} />
                        Add Row
                    </button>
                    <div className={`flex bg-slate-50 p-1 rounded-lg border transition-all ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                        <button onClick={() => setCurrentView("table")} className={`p-1.5 rounded-md transition-all ${currentView === 'table' ? (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white text-indigo-400 shadow-sm border border-white/10' : 'bg-white text-indigo-600 shadow-sm border border-slate-200') : 'text-slate-400 hover:text-slate-600'}`}>
                            <Table size={16} />
                        </button>
                        <button onClick={() => setCurrentView("kanban")} className={`p-1.5 rounded-md transition-all ${currentView === 'kanban' ? (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white text-indigo-400 shadow-sm border border-white/10' : 'bg-white text-indigo-600 shadow-sm border border-slate-200') : 'text-slate-400 hover:text-slate-600'}`}>
                            <LayoutGrid size={16} />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsAddColumnOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                        <Plus size={14} /> Add Column
                    </button>

                    <div className={`flex p-1 rounded-lg border transition-all ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                        <button
                            onClick={() => setDensity("compact")}
                            className={`p-1.5 px-3 rounded-md transition-all flex items-center gap-2 ${density === 'compact' ? (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white text-indigo-400 shadow-sm border border-white/10' : 'bg-white text-indigo-600 shadow-sm border border-slate-200') : 'text-slate-400 hover:text-slate-600'}`}
                            title="Compact View"
                        >
                            <Minimize2 size={16} />
                            <span className="text-[9px] font-black uppercase">Small</span>
                        </button>
                        <button
                            onClick={() => setDensity("standard")}
                            className={`p-1.5 px-3 rounded-md transition-all flex items-center gap-2 ${density === 'standard' ? (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white text-indigo-400 shadow-sm border border-white/10' : 'bg-white text-indigo-600 shadow-sm border border-slate-200') : 'text-slate-400 hover:text-slate-600'}`}
                            title="Standard View"
                        >
                            <Table size={16} />
                            <span className="text-[9px] font-black uppercase">Medium</span>
                        </button>
                        <button
                            onClick={() => setDensity("comfortable")}
                            className={`p-1.5 px-3 rounded-md transition-all flex items-center gap-2 ${density === 'comfortable' ? (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white text-indigo-400 shadow-sm border border-white/10' : 'bg-white text-indigo-600 shadow-sm border border-slate-200') : 'text-slate-400 hover:text-slate-600'}`}
                            title="Comfortable View"
                        >
                            <Maximize2 size={16} />
                            <span className="text-[9px] font-black uppercase">Large</span>
                        </button>
                    </div>

                    <button
                        onClick={() => setIsFullScreen(true)}
                        className={`p-2 rounded-lg transition-all active:scale-95 border ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                            ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                        title="Full Screen Mode"
                    >
                        <Maximize2 size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default CRMToolbar;
