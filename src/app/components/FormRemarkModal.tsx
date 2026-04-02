"use client";

import React, { useState, useEffect } from "react";
import { FaTimes, FaSave, FaTrash, FaPlus, FaCalendarAlt, FaMicrophone } from "react-icons/fa";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface FormRemark {
    id: string;
    remark: string;
    nextFollowUpDate?: string;
    followUpStatus?: string;
    leadStatus?: string;
    columnId?: string;
    authorName: string;
    createdAt: string;
}

interface Props {
    formId: string;
    responseId: string;
    columnId?: string; // NEW: Optional column link
    userRole: string; // "MASTER", "ADMIN", etc.
    onClose: () => void;
    onSave?: () => void;
    initialData?: { remark?: string, nextFollowUpDate?: string, followUpStatus?: string, leadStatus?: string };
}

export default function FormRemarkModal({ formId, responseId, columnId, userRole, onClose, onSave, initialData }: Props) {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false); // ⚡ Instant Launch Protocol
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [remarks, setRemarks] = useState<FormRemark[]>([]);
    const [form, setForm] = useState({
        remark: initialData?.remark || "",
        nextFollowUpDate: initialData?.nextFollowUpDate || "",
        followUpStatus: initialData?.followUpStatus || "",
        leadStatus: initialData?.leadStatus || ""
    });

    const [isAdding, setIsAdding] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = React.useRef<any>(null);

    // Stop recognition on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    // 🗣️ VOICE FEEDBACK ENGINE (Speech Synthesis)
    const speakResponse = (text: string) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        window.speechSynthesis.cancel(); 
        const utterance = new ((window as any).SpeechSynthesisUtterance)(text);
        utterance.rate = 1.1; 
        utterance.lang = "en-IN";
        window.speechSynthesis.speak(utterance);
    };

    const toggleListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Mic not supported in this browser");
            return;
        }

        // 🛡️ Instance Lockdown: Stop existing session if active
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            return;
        }

        const initialRemark = form.remark.replace(/\.\.\.$/, '').trim();

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = "en-IN"; 
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;
            recognition.continuous = true; // ⚡ Keep it alive for complex multi-intent

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event: any) => {
                setIsListening(false);
                if (event.error !== 'no-speech') toast.error(`Mic Error: ${event.error}`);
            };

            const processTranscript = (text: string) => {
                const dictionary: Record<string, string> = {
                    '\\bcal\\b': 'kal', '\\bcall\\b': 'kal', '\\bperson\\b': 'parson',
                    '\\bhay\\b': 'hai', '\\bhigh\\b': 'hai', '\\bhey\\b': 'hai',
                    '\\bball\\b': 'bol', '\\braha\\b': 'raha', '\\brahow\\b': 'raho',
                    '\\bli\\b': 'liye', '\\blee\\b': 'liye', '\\bkey\\b': 'ke',
                    '\\bkay\\b': 'ke', '\\bmarning\\b': 'morning'
                };
                let cleaned = text.toLowerCase();
                Object.entries(dictionary).forEach(([wrong, right]) => {
                    cleaned = cleaned.replace(new RegExp(wrong, 'gi'), right);
                });
                return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
            };

            const CALL_STATUS_OPTIONS = ["CALL AGAIN", "CALL DONE", "RNR", "INVALID NUMBER", "SWITCH OFF", "RNR 2", "RNR3", "INCOMING NOT AVAIABLE", "MEETING", "DUPLICATE", "WRONG NUMBER"];

            recognition.onresult = (event: any) => {
                let fullFinal = "";
                let fullInterim = "";

                for (let i = 0; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) fullFinal += event.results[i][0].transcript;
                    else fullInterim += event.results[i][0].transcript;
                }

                // Core logic now uses the TOTAL transcript since mic started
                const rawTranscript = (fullFinal || fullInterim).toLowerCase();
                
                // ⚡ REAL-TIME INTENT DETECTION (Global)
                const ACTIONS = {
                    SAVE: rawTranscript.includes("save") || rawTranscript.includes("submit") || rawTranscript.includes("ho gaya"),
                    CLOSE: rawTranscript.includes("band") || rawTranscript.includes("close") || rawTranscript.includes("cancel")
                };

                // Update UI state with total session results
                const currentTranscript = fullFinal + (fullInterim ? " " + fullInterim + "..." : "");
                setForm(prev => ({ 
                    ...prev, 
                    remark: initialRemark ? initialRemark + " " + currentTranscript : currentTranscript 
                }));

                if (!fullFinal) return; // Only trigger major NLP on final results

                const tWords = fullFinal.toLowerCase();
                const isNegated = (target: string) => {
                    const t = target.toLowerCase();
                    return tWords.includes(`nahi ${t}`) || tWords.includes(`not ${t}`) || tWords.includes(`${t} nahi`);
                };

                const tClean = tWords.replace(/\bkarke\b|\bkar do\b|\bkardo\b/gi, '').trim();
                const transcript = processTranscript(tClean);
                
                // 📅 SMART DATE PRIORITY ENGINE
                let detectedDateString = "";
                const today = new Date();
                const numMap: Record<string, number> = { 
                    'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'panch': 5, 'chhe': 6, 'saat': 7, 
                    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7 
                };
                
                let daysToAdd = 0;
                let priorityLevel = 0;

                const weekMatch = tWords.match(/(\d+|ek|do|teen|one|two|three)\s*(hafte|week|weeks)/);
                if (weekMatch) {
                    const val = weekMatch[1];
                    daysToAdd = (numMap[val] || parseInt(val) || 1) * 7;
                    priorityLevel = 3;
                } else if (tWords.includes("agle hafte") || tWords.includes("next week")) {
                    daysToAdd = 7;
                    priorityLevel = 3;
                }

                if (priorityLevel < 3) {
                    const dayMatch = tWords.match(/(\d+|ek|do|teen|char|panch|chhe|saat|one|two|three|four|five|six|seven)\s*(din|day|days)/);
                    if (dayMatch) {
                        const val = dayMatch[1];
                        daysToAdd = numMap[val] || parseInt(val) || 0;
                        priorityLevel = 2;
                    }
                }

                if (priorityLevel < 1) {
                    if (!isNegated("parson") && tWords.includes("parson")) {
                        daysToAdd = 2;
                        priorityLevel = 1;
                    } else if (!isNegated("kal") && (tWords.includes("kal") || tWords.includes("tomorrow"))) {
                        daysToAdd = 1;
                        priorityLevel = 1;
                    }
                }

                const hasConflict = (priorityLevel > 1) && (tWords.includes("kal") || tWords.includes("tomorrow") || tWords.includes("parson"));
                if (hasConflict) speakResponse("Aapne date conflict bola hai, main strongest date set kar rahi hoon.");

                if (daysToAdd > 0) {
                    const finalD = new Date(today); finalD.setDate(today.getDate() + daysToAdd);
                    detectedDateString = finalD.toISOString().split('T')[0];
                }

                const getSimilarity = (s1: string, s2: string) => {
                    const longer = s1.length > s2.length ? s1.toLowerCase() : s2.toLowerCase();
                    const shorter = s1.length > s2.length ? s2.toLowerCase() : s1.toLowerCase();
                    if (longer.length === 0) return 1.0;
                    const editDistance = (a: string, b: string) => {
                        const costs = [];
                        for (let i = 0; i <= a.length; i++) {
                            let last = i;
                            for (let j = 0; j <= b.length; j++) {
                                if (i === 0) costs[j] = j;
                                else if (j > 0) {
                                    let newVal = costs[j-1];
                                    if (a[i-1] !== b[j-1]) newVal = Math.min(Math.min(newVal, last), costs[j]) + 1;
                                    costs[j-1] = last; last = newVal;
                                }
                            }
                            if (i > 0) costs[b.length] = last;
                        }
                        return costs[b.length];
                    };
                    return (longer.length - editDistance(longer, shorter)) / longer.length;
                };

                let detectedCalling = "";
                let detectedLead = "";
                const SEARCH_PATTERNS = [
                    ...CALL_STATUS_OPTIONS.map(opt => ({ text: opt, intent: opt, type: 'calling' })),
                    ...LEAD_STATUS_OPTIONS.map(opt => ({ text: opt, intent: opt, type: 'lead' })),
                    { text: "nr", intent: "RNR", type: 'calling' },
                    { text: "call karenge", intent: "CALL AGAIN", type: 'calling' },
                    { text: "meeting fix", intent: "MEETING", type: 'calling' }
                ];

                let bestMatch = { intent: "", type: "", rating: 0 };
                SEARCH_PATTERNS.forEach(p => {
                    if (isNegated(p.text)) return; 
                    const exists = tWords.includes(p.text.toLowerCase());
                    const rating = exists ? 1.0 : getSimilarity(tWords, p.text);
                    if (rating > bestMatch.rating && rating > 0.65) {
                        bestMatch = { intent: p.intent, type: p.type, rating };
                    }
                });

                if (bestMatch.rating >= 0.8) {
                    if (bestMatch.type === 'calling') detectedCalling = bestMatch.intent;
                    if (bestMatch.type === 'lead') detectedLead = bestMatch.intent;
                } else if (bestMatch.rating >= 0.6) {
                    speakResponse(`Mujhe laga aap keh rahe ho ${bestMatch.intent}, confirm karein?`);
                }

                let finalRemark = transcript.trim();
                const processedText = [detectedCalling, detectedLead, bestMatch.intent].filter(Boolean);
                processedText.forEach(t => {
                    if (!t) return;
                    const cleanRegex = new RegExp(`\\b${t.replace(/\s+/g, '\\s*')}\\b`, 'gi');
                    finalRemark = finalRemark.replace(cleanRegex, '').trim();
                });

                setForm(prev => ({ 
                    ...prev, 
                    followUpStatus: detectedCalling || prev.followUpStatus,
                    leadStatus: detectedLead || prev.leadStatus,
                    nextFollowUpDate: detectedDateString || prev.nextFollowUpDate
                }));

                // ⚡ PRIORITY EXECUTION ENGINE (Final)
                if (detectedCalling) speakResponse(`Status set to ${detectedCalling}`);
                if (detectedLead) speakResponse(`Lead marked as ${detectedLead}`);
                if (detectedDateString) speakResponse(`Date set for ${daysToAdd} days later`);
                
                if (ACTIONS.SAVE) {
                    speakResponse("Saving interaction matrix now.");
                    toast.loading("AI Pulse: Saving...");
                    recognitionRef.current?.stop();
                    setIsListening(false);
                    setTimeout(() => (document.querySelector('button[type="submit"]') as HTMLButtonElement)?.click(), 800);
                } else if (ACTIONS.CLOSE) {
                    speakResponse("Terminating session.");
                    recognitionRef.current?.stop();
                    setIsListening(false);
                    setTimeout(() => onClose(), 400);
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (e) {
            console.error(e);
            toast.error("Voice typing failed");
        }
    };

    const fetchRemarks = async () => {
        const cacheKey = `remarks_cache_${responseId}`;
        const cached = localStorage.getItem(cacheKey);
        
        // 🚀 PHASE 1: Populate instantly from cache
        if (cached) {
            try { 
                const cachedData = JSON.parse(cached);
                setRemarks(cachedData);
                setIsInitialLoad(false); // Immediately show UI if cache exists
            } catch (e) { }
        }

        // 🛰️ PHASE 2: Silent Background Refresh
        setFetching(true);
        try {
            const res = await fetch(`/api/crm/forms/${formId}/responses/${responseId}/remarks?_t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                const fetchedRemarks = data.remarks || [];
                
                // Merge with offline queue if any
                const queue = JSON.parse(localStorage.getItem("offline_remarks_queue") || "[]");
                const currentOffline = queue.filter((item: any) => item.responseId === responseId);
                const finalRemarks = [...currentOffline, ...fetchedRemarks];
                
                setRemarks(finalRemarks);
                localStorage.setItem(cacheKey, JSON.stringify(fetchedRemarks));
            }
        } catch (error) {
            if (navigator.onLine) console.error("Silent sync failed");
        } finally {
            setFetching(false);
            setIsInitialLoad(false);
        }
    };

    // 🛑 REMOVED: Automatic date calculation (User wants manual control)

    const LEAD_STATUS_OPTIONS = [
        "Will Share today", "Will let me know in 2 days", "Not Intertested", "Onboarded", 
        "Will Let me know 7 days", "Customer Will Call", "Meeting Fix", "already applyed", 
        "language barrier", "Already Done", "Delivery Partners", "CUSTOMER WILL LET ME KNOW"
    ];

    useEffect(() => {
        fetchRemarks();
        if (columnId) setIsAdding(true);
        const handleSync = () => syncOfflineQueue();
        window.addEventListener('online', handleSync);
        return () => window.removeEventListener('online', handleSync);
    }, [formId, responseId, columnId]);

    const syncOfflineQueue = async () => {
        const queue = JSON.parse(localStorage.getItem("offline_remarks_queue") || "[]");
        if (queue.length === 0) return;
        toast.loading("Syncing offline follow-ups...", { id: "sync-toast" });
        const newQueue = [...queue];
        for (let i = 0; i < queue.length; i++) {
            const item = queue[i];
            try {
                const res = await fetch(`/api/crm/forms/${item.formId}/responses/${item.responseId}/remarks`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(item.data)
                });
                if (res.ok) newQueue.splice(newQueue.indexOf(item), 1);
            } catch (e) { }
        }
        localStorage.setItem("offline_remarks_queue", JSON.stringify(newQueue));
        if (newQueue.length === 0) {
            toast.success("All follow-ups synced!", { id: "sync-toast" });
            fetchRemarks();
            if (onSave) onSave();
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const finalRemark = form.remark || `Status interaction: ${form.followUpStatus}`;
        if (!finalRemark && !columnId) return toast.error("Please enter a remark.");
        
        const payload = { 
            remark: finalRemark,
            nextFollowUpDate: form.nextFollowUpDate || null,
            followUpStatus: form.followUpStatus || null,
            leadStatus: form.leadStatus || null,
            columnId 
        };

        toast.success("Update recorded!", { id: "save-interaction" });
        setIsAdding(false);

        if (!navigator.onLine) {
            const offlineItem = { id: `offline-${Date.now()}`, formId, responseId, data: payload, remark: payload.remark, authorName: "You (Offline)", createdAt: new Date().toISOString(), nextFollowUpDate: payload.nextFollowUpDate, followUpStatus: payload.followUpStatus, columnId: payload.columnId };
            const queue = JSON.parse(localStorage.getItem("offline_remarks_queue") || "[]");
            localStorage.setItem("offline_remarks_queue", JSON.stringify([...queue, offlineItem]));
            setRemarks(prev => [offlineItem as any, ...prev]);
            setForm({ remark: "", nextFollowUpDate: "", followUpStatus: "", leadStatus: "" });
            return;
        }

        setLoading(true);
        // Background Save
        try {
            const res = await fetch(`/api/crm/forms/${formId}/responses/${responseId}/remarks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                if (onSave) onSave();
                if (columnId) onClose();
                fetchRemarks(); // Silently refresh local history
            }
        } catch (error) {
            toast.error("Background sync failed. Data cached locally.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (remarkId: string) => {
        if (!confirm("Are you sure you want to delete this follow-up?")) return;
        try {
            const res = await fetch(`/api/crm/forms/${formId}/responses/${responseId}/remarks?remarkId=${remarkId}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Follow-up deleted");
                fetchRemarks();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to delete");
            }
        } catch (error) {
            toast.error("Network error deleting follow-up");
        }
    };

    const canDelete = userRole === "MASTER" || userRole === "ADMIN" || userRole === "TL";

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="bg-indigo-600 p-5 pl-6 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-black flex items-center gap-2 text-white">
                            <FaCalendarAlt /> {columnId ? "Status Updates" : "Calls & Remarks"}
                        </h3>
                        <p className="text-indigo-100 text-[11px] mt-1 font-bold uppercase tracking-widest">
                            Client interaction history
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-indigo-500/50 hover:bg-indigo-500 text-white rounded-xl transition-colors">
                        <FaTimes size={16} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                    {fetching && remarks.length === 0 && isInitialLoad ? (
                        <div className="flex flex-col items-center justify-center p-12 space-y-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600"></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Matrix...</p>
                        </div>
                    ) : remarks.length === 0 && !isAdding ? (
                        <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 border-dashed">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <FaCalendarAlt className="text-slate-300 text-xl" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-700">No Interactions Yet</h4>
                            <p className="text-xs text-slate-500 mt-1 mb-4">You haven't added any remarks or calling dates to this response.</p>
                            <button onClick={() => setIsAdding(true)} className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2">
                                <FaPlus /> Add First Interaction
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {!isAdding ? (
                                <button onClick={() => setIsAdding(true)} className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-white">
                                    <FaPlus /> Add New Interaction
                                </button>
                            ) : (
                                <form onSubmit={handleSubmit} className="bg-white border border-indigo-100 shadow-xl rounded-[32px] p-6 space-y-5 animate-in slide-in-from-top-4">
                                    {!columnId && (
                                        <>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Update / Remark</label>
                                                <div className="relative group">
                                                    <textarea
                                                        autoFocus
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-[32px] p-6 pr-24 text-base focus:ring-[12px] focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 min-h-[160px] font-bold text-slate-700 shadow-inner resize-none leading-relaxed"
                                                        placeholder="Speak naturally (Hinglish Supported)..."
                                                        value={form.remark}
                                                        onChange={(e) => setForm({ ...form, remark: e.target.value })}
                                                    />
                                                    <div className="absolute bottom-5 right-5 flex flex-col items-center gap-2">
                                                        {isListening && <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest animate-pulse">Listening...</span>}
                                                        <button 
                                                            type="button"
                                                            onClick={toggleListening}
                                                            title="Speak in Hindi/English/Hinglish"
                                                            className={`flex flex-col items-center justify-center w-16 h-16 rounded-[24px] shadow-[0_15px_30px_-5px_rgba(0,0,0,0.3)] transition-all active:scale-90 z-10 border-4 ${isListening ? 'bg-rose-500 text-white border-rose-400 animate-pulse ring-8 ring-rose-500/20' : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700 ring-8 ring-transparent hover:ring-indigo-500/10'}`}
                                                        >
                                                            <FaMicrophone size={28} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Next Scheduled Interaction (Optional)</label>
                                                <input
                                                    type="date"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 shadow-inner"
                                                    value={form.nextFollowUpDate}
                                                    onChange={(e) => setForm({ ...form, nextFollowUpDate: e.target.value })}
                                                />
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Calling Status</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 appearance-none cursor-pointer"
                                            value={form.followUpStatus}
                                            onChange={(e) => setForm({ ...form, followUpStatus: e.target.value })}
                                        >
                                            <option value="">Select Calling Status</option>
                                            <option>CALL AGAIN</option>
                                            <option>CALL DONE</option>
                                            <option>RNR</option>
                                            <option>INVALID NUMBER</option>
                                            <option>SWITCH OFF</option>
                                            <option>RNR 2</option>
                                            <option>RNR3</option>
                                            <option>INCOMING NOT AVAIABLE</option>
                                            <option>MEETING</option>
                                            <option>DUPLICATE</option>
                                            <option>WRONG NUMBER</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Lead Status (Optional)</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 appearance-none cursor-pointer"
                                            value={form.leadStatus}
                                            onChange={(e) => setForm({ ...form, leadStatus: e.target.value })}
                                        >
                                            <option value="">Select Lead Status (None)</option>
                                            {LEAD_STATUS_OPTIONS.map(opt => (
                                                <option key={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">Cancel</button>
                                        <button disabled={loading} type="submit" className="flex-[2] py-2.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-md transition-all flex items-center justify-center gap-2">
                                            {loading ? "Saving..." : (columnId ? "Update Status" : "Save Interaction")}
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="space-y-3 mt-6">
                                {remarks.map((r, i) => (
                                    <div key={r.id} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all group relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-[10px]">
                                                    {r.authorName?.charAt(0) || "U"}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-tighter leading-none">{r.authorName}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold">{format(new Date(r.createdAt), "MMM d, h:mm a")}</p>
                                                </div>
                                            </div>
                                            {canDelete && (
                                                <button onClick={() => handleDelete(r.id)} className="p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                                    <FaTrash size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="pl-9">
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {r.followUpStatus && (
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-black border border-slate-200">
                                                        {r.followUpStatus}
                                                    </span>
                                                )}
                                                {r.nextFollowUpDate && (
                                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black border border-indigo-100">
                                                        📅 NEXT: {format(new Date(r.nextFollowUpDate), "MMM d, yyyy")}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 font-bold leading-relaxed whitespace-pre-wrap">{r.remark}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
