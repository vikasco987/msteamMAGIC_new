"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { 
  Loader2, Globe, ShieldCheck, Copy, CheckCircle2, 
  MapPin, Phone, Mail, User, Home, Download, Eye, FileText,
  Clock, CheckSquare, AlertCircle, Share2
} from "lucide-react";
import { FaRegClipboard, FaTimes, FaRegStickyNote } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";

interface Note {
  content: string;
  authorName?: string;
  authorEmail?: string;
  createdAt: string;
}

interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  tags?: string[];
  createdAt: string;
  attachments?: string[];
  customFields?: Record<string, any>;
  assignerName?: string;
  assignerEmail?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  notes?: Note[];
  subtasks?: Subtask[];
}

const getLabelFromUrl = (url: string): string => {
  const fileName = url.split("/").pop()?.toLowerCase() || "";
  if (fileName.includes("aadhaar")) return "🆔 Aadhaar Card";
  if (fileName.includes("pan")) return "💳 PAN Card";
  if (fileName.includes("selfie")) return "🤳 Selfie Photo";
  if (fileName.endsWith(".pdf")) return "📄 PDF Document";
  if (fileName.includes("license")) return "🍔 Food License";
  if (fileName.includes("menu")) return "📄 Menu Card";
  return "📎 Attachment";
};

const isValidUrl = (str: string): boolean => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

const getDownloadUrl = (url: string): string =>
  url.includes("/upload/") ? url.replace("/upload/", "/upload/fl_attachment/") : url;

export default function SharedTaskPage() {
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await fetch(`/api/public-tasks/${taskId}`);
        if (!res.ok) throw new Error("Task not found");
        const data = await res.json();
        setTask(data);
      } catch (err) {
        console.error("Fetch shared task failed:", err);
      } finally {
        setLoading(false);
      }
    };

    if (taskId) fetchTask();
  }, [taskId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success("Shared link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownload = (url: string) => {
    const downloadUrl = getDownloadUrl(url);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-6" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Secure Shared Task...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 bg-rose-50 rounded-[40px] flex items-center justify-center mb-8 border border-rose-100 shadow-xl shadow-rose-100/50">
          <AlertCircle size={48} className="text-rose-400 animate-bounce" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Task Not Found</h1>
        <p className="text-slate-400 font-bold mt-2 text-center max-w-sm">This share link is either incorrect, expired, or has been revoked by the administrator.</p>
        <button
          onClick={() => window.location.href = "https://team.magicscale.in"}
          className="mt-8 px-8 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-black transition-all shadow-lg"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const cf = task.customFields || {};
  const showTitle = task.title !== cf.shopName && task.title !== cf.outletName;

  const getStatusColor = (status: string) => {
    if (status === "done") return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (status === "inprogress") return "bg-indigo-100 text-indigo-800 border-indigo-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  const getStatusLabel = (status: string) => {
    if (status === "done") return "✅ Done";
    if (status === "inprogress") return "⚡ In Progress";
    return "📋 To Do";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 md:px-8">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Security & Access Badges */}
      <div className="max-w-2xl mx-auto mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <ShieldCheck size={14} className="text-emerald-500" /> Secure Encryption
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <Globe size={14} className="text-indigo-500" /> Public Access View
          </div>
        </div>
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
        >
          <Share2 size={12} />
          {copiedLink ? "Copied!" : "Copy Share Link"}
        </button>
      </div>

      {/* Standalone Task Details Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-2xl mx-auto bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-6 sm:p-8"
      >
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap gap-2 items-center mb-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${getStatusColor(task.status)}`}>
                {getStatusLabel(task.status)}
              </span>
              <span className="text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-100 px-3 py-1 rounded-full flex items-center gap-1">
                <Clock size={12} />
                Created: {new Date(task.createdAt).toLocaleDateString()}
              </span>
            </div>
            {showTitle ? (
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-2">
                {task.title}
              </h1>
            ) : (
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-2">
                {cf.shopName || cf.outletName || "Task Details"}
              </h1>
            )}
            {task.description && (
              <p className="text-sm text-slate-500 italic mt-2 leading-relaxed">
                "{task.description}"
              </p>
            )}
          </div>
        </div>

        {/* 📌 HIGHLIGHTED NOTES (Amber alert card for important onboarding notes) */}
        {task.notes && task.notes.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="my-6 p-4 bg-amber-50/80 rounded-2xl border border-amber-200 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-8 h-8 bg-amber-200/20 rounded-bl-3xl" />
            
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">📝</span>
              <p className="text-[11px] font-black text-amber-800 uppercase tracking-widest mb-0">Crucial Notes</p>
            </div>
            
            <div className="space-y-3">
              {task.notes.map((note, idx) => (
                <div key={idx} className="text-xs text-amber-900 font-bold leading-relaxed border-l-2 border-amber-300 pl-3">
                  <p className="mb-0">{note.content}</p>
                  <p className="text-[9px] text-amber-600/70 font-medium mt-1">
                    — {note.authorName || "Team"} on {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Primary Information Grid */}
        <div className="my-6 space-y-3">
          <div className="grid grid-cols-1 gap-y-2">
            {cf.shopName && (
              <div className="flex items-center justify-between p-3 bg-slate-50/60 rounded-xl hover:bg-slate-50 transition-all">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                  🏪 Shop Name
                </span>
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  {cf.shopName}
                  <button onClick={() => handleCopyText(cf.shopName, "Shop name")} className="text-slate-400 hover:text-indigo-600">
                    <Copy size={12} />
                  </button>
                </span>
              </div>
            )}
            
            {cf.outletName && (
              <div className="flex items-center justify-between p-3 bg-slate-50/60 rounded-xl hover:bg-slate-50 transition-all">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                  🏷️ Outlet Name
                </span>
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  {cf.outletName}
                  <button onClick={() => handleCopyText(cf.outletName, "Outlet name")} className="text-slate-400 hover:text-indigo-600">
                    <Copy size={12} />
                  </button>
                </span>
              </div>
            )}

            {cf.customerName && (
              <div className="flex items-center justify-between p-3 bg-slate-50/60 rounded-xl hover:bg-slate-50 transition-all">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                  👤 Customer
                </span>
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  {cf.customerName}
                  <button onClick={() => handleCopyText(cf.customerName, "Customer name")} className="text-slate-400 hover:text-indigo-600">
                    <Copy size={12} />
                  </button>
                </span>
              </div>
            )}

            {cf.phone && (
              <div className="flex items-center justify-between p-3 bg-slate-50/60 rounded-xl hover:bg-slate-50 transition-all">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                  📞 Phone Number
                </span>
                <a href={`tel:${cf.phone}`} className="text-xs font-black text-indigo-600 hover:underline flex items-center gap-1.5">
                  {cf.phone}
                  <button type="button" onClick={(e) => { e.preventDefault(); handleCopyText(cf.phone, "Phone"); }} className="text-slate-400 hover:text-indigo-600">
                    <Copy size={12} />
                  </button>
                </a>
              </div>
            )}

            {cf.email && (
              <div className="flex items-center justify-between p-3 bg-slate-50/60 rounded-xl hover:bg-slate-50 transition-all">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                  📧 Email
                </span>
                <a href={`mailto:${cf.email}`} className="text-xs font-black text-indigo-600 hover:underline flex items-center gap-1.5">
                  {cf.email}
                  <button type="button" onClick={(e) => { e.preventDefault(); handleCopyText(cf.email, "Email"); }} className="text-slate-400 hover:text-indigo-600">
                    <Copy size={12} />
                  </button>
                </a>
              </div>
            )}

            {cf.packageAmount && (
              <div className="flex items-center justify-between p-3 bg-slate-50/60 rounded-xl hover:bg-slate-50 transition-all">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                  💰 Package Amount
                </span>
                <span className="text-xs font-black text-slate-800">
                  ₹{cf.packageAmount}
                </span>
              </div>
            )}
          </div>

          {/* Full Address Block */}
          {(cf.fullAddress || cf.city || cf.pincode) && (
            <div className="flex items-start gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 mt-4">
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">🏠 Full Address</p>
                <p className="text-xs text-slate-800 leading-relaxed font-bold">
                  {[cf.fullAddress, cf.city, cf.state, cf.country, cf.pincode].filter(Boolean).join(", ")}
                </p>
              </div>
              <button 
                onClick={() => handleCopyText([cf.fullAddress, cf.city, cf.state, cf.country, cf.pincode].filter(Boolean).join(", "), "Address")}
                className="mt-1 p-1 bg-white border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg shadow-sm"
              >
                <Copy size={12} />
              </button>
            </div>
          )}

          {/* Location Maps Block */}
          {cf.location && (
            <div className="flex items-center gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-100 mt-2">
              <div className="flex-1 truncate">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">📍 Maps Location</p>
                {isValidUrl(String(cf.location)) ? (
                  <a href={String(cf.location)} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-600 hover:underline">
                    Click to Open Google Maps Link
                  </a>
                ) : (
                  <span className="text-xs font-bold text-slate-800">{String(cf.location)}</span>
                )}
              </div>
              <button 
                onClick={() => handleCopyText(String(cf.location), "Location link")}
                className="p-1 bg-white border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg shadow-sm"
              >
                <Copy size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Attachments Section */}
        {task.attachments && task.attachments.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">📎 Documents & Attachments</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {task.attachments.map((url, i) => {
                const label = getLabelFromUrl(url);
                return (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all group"
                  >
                    <span className="text-xs font-black text-slate-700 truncate mr-2 flex items-center gap-1.5">
                      <FileText size={14} className="text-indigo-500 shrink-0" />
                      {label}
                    </span>
                    <div className="flex gap-2.5">
                      <button 
                        onClick={() => setPreviewUrl(url)} 
                        className="p-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-indigo-300 text-indigo-600 rounded-xl shadow-sm transition-all"
                        title="View Document"
                      >
                        <Eye size={12} />
                      </button>
                      <button 
                        onClick={() => handleDownload(url)} 
                        className="p-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-emerald-300 text-emerald-600 rounded-xl shadow-sm transition-all"
                        title="Download Document"
                      >
                        <Download size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Subtasks Block (if any exist) */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">✅ Checklist Items</p>
            <div className="space-y-2">
              {task.subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-3 p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
                  <CheckSquare size={14} className={sub.isCompleted ? "text-emerald-500" : "text-slate-300"} />
                  <span className={`text-xs font-bold ${sub.isCompleted ? "text-slate-400 line-through" : "text-slate-700"}`}>
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Info Block */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="space-y-1">
            {task.assignerName && (
              <p className="text-[10px] font-bold text-slate-500">
                Created By: <span className="text-slate-800 font-extrabold">{task.assignerName}</span>
              </p>
            )}
            {task.assigneeName && (
              <p className="text-[10px] font-bold text-slate-500">
                Assigned To: <span className="text-indigo-600 font-extrabold">{task.assigneeName}</span>
              </p>
            )}
          </div>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
            Shared Via magicscale
          </p>
        </div>
      </motion.div>

      {/* Lightbox Document Preview Modal */}
      <AnimatePresence>
        {previewUrl && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }} 
              className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setPreviewUrl(null)} 
                className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur hover:bg-slate-100 rounded-full shadow-lg transition-all"
              >
                <FaTimes />
              </button>
              <div className="p-2 max-h-[85vh] overflow-auto flex items-center justify-center min-h-[50vh]">
                {previewUrl.toLowerCase().endsWith(".pdf") ? (
                  <iframe 
                    src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`} 
                    className="w-full h-[75vh] rounded-2xl border-none" 
                  />
                ) : (
                  <Image 
                    src={previewUrl} 
                    alt="Preview Document" 
                    width={1200} 
                    height={800} 
                    className="w-full h-auto max-h-[75vh] object-contain rounded-2xl" 
                    unoptimized 
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
