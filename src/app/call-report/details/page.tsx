"use client";

import React, { useEffect, useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { useSearchParams } from "next/navigation";
import { 
    ChevronLeft, 
    ArrowLeft, 
    Table, 
    Layers, 
    User, 
    Calendar, 
    Search,
    Download,
    ExternalLink,
    Filter,
    Activity,
    CheckCircle2,
    MessageSquare,
    PhoneCall,
    PhoneOff,
    RotateCcw,
    PowerOff
} from "lucide-react";
import toast from "react-hot-toast";

type ResponseField = {
    fieldId: string;
    value: string;
};

type InternalField = {
    columnId: string;
    value: string;
};

type FormDetail = {
    form: {
        id: string;
        title: string;
        fields: { id: string; label: string; type: string; }[];
        internalColumns: { id: string; label: string; type: string; }[];
    };
    responses: {
        id: string;
        submittedByName: string;
        submittedAt: string;
        lastStatus: string;
        lastRemark: string;
        interactionDate: string;
        interactedBy: string;
        values: ResponseField[];
        internalValues: InternalField[];
    }[];
};

export default function CallReportDetailsPage() {
    const searchParams = useSearchParams();
    const userId = searchParams.get("userId");
    const date = searchParams.get("date");
    const type = searchParams.get("type");
    const userName = searchParams.get("name") || "Operator Detail";

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ forms: FormDetail[] } | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/call-report/details?userId=${userId}&date=${date}&type=${type}`);
            const json = await res.json();
            if (res.ok) {
                setData(json);
            } else {
                toast.error("Failed to fetch detailed data");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId && date) fetchDetails();
    }, [userId, date, type]);

    const handleBack = () => {
        window.history.back();
    };

    const getFieldValue = (res: any, fieldId: string) => {
        return res.values.find((v: any) => v.fieldId === fieldId)?.value || "—";
    };

    const stats = useMemo(() => {
        if (!data) return null;
        const all = data.forms.flatMap(f => f.responses);
        
        return {
            total: all.length,
            remarks: all.filter(r => r.lastRemark).length,
            rnr: all.filter(r => (r.lastStatus || "").toUpperCase().includes("RNR")).length,
            callAgain: all.filter(r => (r.lastStatus || "").toUpperCase().includes("AGAIN")).length,
            switchOff: all.filter(r => (r.lastStatus || "").toUpperCase().includes("OFF")).length,
            connected: all.filter(r => ["CALL DONE", "CONNECTED", "INTERESTED", "CLOSED"].some(s => (r.lastStatus || "").toUpperCase().includes(s))).length,
        };
    }, [data]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Aggregating Records...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pb-32">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-2xl" />
                
                <div className="flex items-center gap-6 relative z-10">
                    <button 
                        onClick={handleBack}
                        className="w-12 h-12 bg-slate-50 hover:bg-white border border-slate-100 hover:border-indigo-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">{userName}</h1>
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100 shadow-sm mt-1">
                                {type} ACTIVITY
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Calendar size={12} className="text-indigo-500" /> {date ? format(parseISO(date), "MMMM dd, yyyy") : ""}</span>
                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                            <span className="flex items-center gap-1.5"><Layers size={12} className="text-indigo-500" /> Lead Detail View</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative z-10 self-stretch md:self-auto">
                    <div className="relative group flex-1 md:flex-none">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search leads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-50 border border-slate-100 hover:border-indigo-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50/50 rounded-2xl pl-12 pr-6 py-3 text-sm font-bold text-slate-700 outline-none transition-all w-full md:w-64"
                        />
                    </div>
                </div>
            </div>

            {/* 🛡️ LIVE BREAKDOWN SHARDS */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:shadow-lg transition-all duration-300">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3">
                            <Layers size={18} />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Leads</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.total}</p>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:shadow-lg transition-all duration-300">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
                            <CheckCircle2 size={18} />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Connected</p>
                        <p className="text-2xl font-black text-emerald-600 tracking-tighter">{stats.connected}</p>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:shadow-lg transition-all duration-300">
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3">
                            <RotateCcw size={18} />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Call Again</p>
                        <p className="text-2xl font-black text-amber-600 tracking-tighter">{stats.callAgain}</p>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:shadow-lg transition-all duration-300">
                        <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-3">
                            <PhoneOff size={18} />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total RNR</p>
                        <p className="text-2xl font-black text-rose-600 tracking-tighter">{stats.rnr}</p>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:shadow-lg transition-all duration-300">
                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center mb-3">
                            <PowerOff size={18} />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Switch Off</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.switchOff}</p>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] border border-indigo-100 shadow-xl shadow-indigo-100/50 flex flex-col items-center text-center group hover:shadow-indigo-200 transition-all duration-300">
                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-200">
                            <MessageSquare size={18} />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Remarks</p>
                        <p className="text-2xl font-black text-indigo-600 tracking-tighter">{stats.remarks}</p>
                    </div>
                </div>
            )}

            {/* Content Section */}
            {!data?.forms || data.forms.length === 0 ? (
                <div className="bg-white rounded-[40px] p-24 text-center border border-slate-100 shadow-sm">
                    <Activity size={64} className="mx-auto text-slate-200 mb-6" />
                    <h2 className="text-2xl font-black text-slate-700">No Raw Data Found</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Zero records matched the specified interaction criteria</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {data.forms.map((formGroup) => {
                        const filteredResponses = formGroup.responses.filter(r => 
                            r.submittedByName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.lastRemark?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.lastStatus?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.values.some(v => v.value.toLowerCase().includes(searchTerm.toLowerCase()))
                        );

                        if (filteredResponses.length === 0 && searchTerm) return null;

                        return (
                            <div key={formGroup.form.id} className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden group/form shadow-2xl shadow-slate-100/50">
                                {/* Form Title Header */}
                                <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 group-hover/form:rotate-3 transition-transform">
                                            <Table size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 tracking-tight">{formGroup.form.title}</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredResponses.length} Impacted Records</p>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 bg-indigo-600 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center gap-2">
                                        <Filter size={12} /> Live Breakdown
                                    </div>
                                </div>

                                {/* Table Container */}
                                <div className="overflow-x-auto relative">
                                    <table className="w-full text-left border-collapse min-w-[800px]">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 w-16">Row No.</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Phone Number</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Services</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Interaction Log</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Contact Action</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Raw</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredResponses.map((res, rIdx) => {
                                                const phoneField = formGroup.form.fields.find(f => 
                                                    f.label.toUpperCase().includes("PHONE") || 
                                                    f.label.toUpperCase().includes("MOBILE") ||
                                                    f.label.toUpperCase().includes("CONTACT")
                                                );
                                                const servicesField = formGroup.form.fields.find(f => 
                                                    f.label.toUpperCase().includes("SERVICE") || 
                                                    f.label.toUpperCase().includes("PRODUCT") ||
                                                    f.label.toUpperCase().includes("CATEGORY")
                                                );

                                                return (
                                                    <tr key={res.id} className="group/row hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 min-h-[80px]">
                                                        <td className="px-6 py-6 text-xs font-black text-slate-400">
                                                            {rIdx + 1}
                                                        </td>
                                                        <td className="px-6 py-6 text-sm font-black text-indigo-600 tracking-tight">
                                                            {phoneField ? getFieldValue(res, phoneField.id) : "N/A"}
                                                        </td>
                                                        <td className="px-6 py-6">
                                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                                                {servicesField ? getFieldValue(res, servicesField.id) : "—"}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-6">
                                                            <div className="flex flex-col gap-1.5">
                                                                <p className="text-sm font-bold text-slate-700 leading-relaxed max-w-2xl whitespace-pre-wrap">{res.lastRemark || "No interaction notes recorded."}</p>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{format(parseISO(res.interactionDate), "MMM dd, yyyy • HH:mm aaa")}</p>
                                                                    </div>
                                                                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                                                                        <User size={10} className="text-slate-400" />
                                                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Filled By: {res.interactedBy}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-6">
                                                            <span className={`px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest border shadow-sm ${
                                                                ['Closed', 'Call done', 'Follow-up Done', 'Walked In', 'CONNECTED', 'INTERESTED', 'ONBOARDED'].includes((res.lastStatus || "").toUpperCase()) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                ['Missed', 'Not interested', 'RNR', 'REJECTED', 'INVALID NUMBER'].includes((res.lastStatus || "").toUpperCase()) ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                                'bg-amber-50 text-amber-700 border-amber-200'
                                                            }`}>
                                                                {res.lastStatus}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-6 text-right">
                                                            <button 
                                                                onClick={() => window.open(`/crm/forms/${formGroup.form.id}/responses/${res.id}/remarks?fullview=true`, '_blank')}
                                                                className="p-3 bg-slate-50 hover:bg-white text-slate-400 hover:text-indigo-600 border border-slate-100 hover:border-indigo-200 rounded-2xl transition-all shadow-sm group-hover/row:scale-110"
                                                            >
                                                                <ExternalLink size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
