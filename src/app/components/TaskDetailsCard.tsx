"use client";

import React, { useState } from "react";
import { FaRegClipboard, FaTimes, FaUserEdit, FaCrown, FaEllipsisV, FaRegStickyNote, FaTrashAlt } from "react-icons/fa";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreVertical, Copy, History, DollarSign, Pin, Trash2, Layers } from "lucide-react";
import toast from "react-hot-toast";
import { useUser } from "@clerk/nextjs";
import type { Task } from "../../types/task";
import { Note } from "../../../types/note";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import NotesModal from "./NotesModal";
import { PiPushPinSimpleFill } from "react-icons/pi";
import ReassignTaskModal from "./ReassignTaskModal";
import CloneTaskButton from "./CloneTaskButton";
import PaymentRemarkModal from "./PaymentRemarkModal";
import TaskActivityModal from "./TaskActivityModal";
import { FaHandHoldingUsd, FaCommentsDollar, FaHistory } from "react-icons/fa";

interface Props {
  task: Task;
  isAdmin?: boolean;
  onDelete?: (taskId: string) => void;
  onUpdateTask?: (taskId: string, updatedFields: Partial<Task>) => void;
  onFloatRequest?: (task: Task) => void;
}

// --- Utility Functions ---
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

// --- Components ---

// Animated Copy Icon component
const CopyIcon = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);

    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative inline-block ml-2">
      <motion.div
        onClick={handleCopy}
        className="text-gray-500 cursor-pointer hover:text-purple-600"
        title="Copy"
        whileTap={{ scale: 0.9 }}
        animate={copied ? { rotate: [0, 10, -10, 0], scale: [1, 1.4, 1] } : {}}
        transition={{ duration: 0.5 }}
      >
        <FaRegClipboard />
      </motion.div>

      <AnimatePresence>
        {copied && (
          <motion.div
            className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-black text-white px-2 py-1 rounded shadow"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: -10 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            Copied!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Updated Animated Icon Button for better UI
const AnimatedIconButton = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
  <motion.button
    onClick={onClick}
    title={title}
    className="p-2 rounded-full hover:bg-purple-100 text-purple-600 transition-colors"
    whileHover={{ scale: 1.15 }}
    whileTap={{ scale: 0.9 }}
  >
    {children}
  </motion.button>
);

// New reusable component for displaying a field with a copy icon
const FieldWithCopy = ({ label, value }: { label: string; value: any }) => {
  if (value === null || value === undefined || value === "") return null;
  const stringValue = String(value);

  return (
    <div className="flex items-center gap-1">
      <p className="mb-0">
        <strong>{label}:</strong> {stringValue}
      </p>
      <CopyIcon text={stringValue} />
    </div>
  );
};

// Update timer component
const TaskTimer = ({ createdAt, status }: { createdAt: string | Date | undefined, status: string }) => {
  const [elapsed, setElapsed] = useState<number>(0);

  React.useEffect(() => {
    if (!createdAt) return;
    const startTime = new Date(createdAt).getTime();

    const updateTimer = () => {
      setElapsed(Date.now() - startTime);
    };

    updateTimer();
    let intervalId: NodeJS.Timeout;
    if (status !== "done") {
      intervalId = setInterval(updateTimer, 1000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [createdAt, status]);

  if (!createdAt) return null;

  if (status === "done") {
    return (
      <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded shadow-sm border border-emerald-200 w-max shrink-0">
        <span>✅ Done</span>
      </div>
    );
  }

  const totalSecs = Math.max(0, Math.floor(elapsed / 1000));
  const d = Math.floor(totalSecs / (3600 * 24));
  const h = Math.floor((totalSecs % (3600 * 24)) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;

  let timeStr = "";
  if (d > 0) timeStr += `${d}d `;
  if (h > 0 || d > 0) timeStr += `${h.toString().padStart(2, '0')}h `;
  if (m > 0 || h > 0 || d > 0) timeStr += `${m.toString().padStart(2, '0')}m `;
  timeStr += `${s.toString().padStart(2, '0')}s`;

  return (
    <div className="flex items-center gap-1.5 text-[9px] font-black tracking-wider text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded shadow-sm border border-orange-200 w-max shrink-0">
      <span className="animate-pulse">⏳</span> {timeStr}
    </div>
  );
};

// --- TaskDetailsCard Component ---
export default function TaskDetailsCard({ task, isAdmin = false, onDelete, onUpdateTask, onFloatRequest }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);

  const cf = task.customFields || {};
  const showTitle = task.title !== cf.shopName && task.title !== cf.outletName;

  const displayAssignerName = task.assigner?.name || task.assignerName || "—";
  const displayAssignerEmail = task.assigner?.email || task.assignerEmail || "";
  const displayAssigneeName = task.assignees?.map(a => a?.name || a?.email).filter(Boolean).join(", ") || task.assignee?.name || "—";
  const displayAssigneeEmail = task.assignee?.email || task.assigneeEmail || "";

  const allValues = [
    task.title,
    task.description,
    cf.shopName,
    cf.outletName,
    cf.phone,
    cf.email,
    cf.location,
    cf.accountNumber,
    cf.ifscCode,
    cf.customerName,
    cf.restId,
    cf.packageAmount,
    cf.startDate,
    cf.endDate,
    cf.timeline,
    task.aadhaarUrl,
    task.panUrl,
    task.selfieUrl,
    task.chequeUrl,
    ...(task.menuCardUrls ?? []),
    task.priority,
    task.tags?.join(", "),
    displayAssignerName,
    displayAssignerEmail,
    displayAssigneeName,
    displayAssigneeEmail,
    ...(cf ? Object.entries(cf).map(([key, value]) => `${key}: ${value}`) : []),
  ].filter(Boolean).join("\n");

  const copyAllFields = () => {
    const textarea = document.createElement('textarea');
    textarea.value = allValues;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    toast.success("All details copied!");
  };

  const handleDownload = (url: string) => {
    const downloadUrl = getDownloadUrl(url);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const notesCount = task.notes?.length || 0;

  const handleReassignTask = (taskId: string, assignee: { id: string; name: string; email: string }) => {
    setShowReassignModal(false);
    if (onUpdateTask) {
      // ✅ Instantly update all assignee metadata for a snappier UI
      onUpdateTask(taskId, { 
        assigneeId: assignee.id, 
        assigneeIds: [assignee.id],
        assigneeName: assignee.name,
        assigneeEmail: assignee.email,
        assignees: [{ 
          id: assignee.id, 
          name: assignee.name, 
          email: assignee.email,
          imageUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${assignee.id}`
        }]
      });
      toast.success("Task reassigned successfully!");
    } else {
      toast.error("Reassign functionality not available.");
    }
  };

  const handleTakeOwnership = () => {
    setShowOwnerModal(true);
  };

  const handleTransferOwnership = (taskId: string, member: { id: string, name: string, email: string }) => {
    setShowOwnerModal(false); // 🚀 Close modal INSTANTLY
    if (onUpdateTask) {
      // ✅ Instantly update locally for snappy UI
      onUpdateTask(taskId, {
        assignerId: member.id,
        assignerName: member.name,
        assignerEmail: member.email,
        assigner: { name: member.name, email: member.email }
      });
      toast.success(`Ownership transferred to ${member.name}!`);
    } else {
      toast.error("Ownership change not available.");
    }
  };

  return (
    <div className="text-sm text-gray-700 space-y-3 overflow-hidden">
      {/* Header with Title and Control Icons */}
      <div className="flex items-start justify-between gap-3">
        {showTitle && (
          <div className="flex flex-col gap-1.5 mt-1">
            <h3
              className="text-base font-bold text-slate-900 leading-tight line-clamp-2"
              title={task.title}
            >
              {task.title}
            </h3>
            <TaskTimer createdAt={task.createdAt} status={task.status} />
          </div>
        )}
        {!showTitle && (
          <div className="mt-1">
            <TaskTimer createdAt={task.createdAt} status={task.status} />
          </div>
        )}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 🛠️ Primary Action Toolbar */}
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-xl border border-slate-200 shadow-sm">
            {/* 1. Status Check */}
            <AnimatedIconButton 
              onClick={() => {
                const newStatus = task.status === "done" ? "todo" : "done";
                onUpdateTask?.(task.id, { status: newStatus });
              }} 
              title={task.status === "done" ? "Mark as To Do" : "Mark as Done"}
            >
              <span className={`text-base ${task.status === "done" ? "opacity-40" : "animate-pulse"}`}>
                {task.status === "done" ? "🔄" : "✅"}
              </span>
            </AnimatedIconButton>

            {/* 2. Reassign */}
            <AnimatedIconButton onClick={() => setShowReassignModal(true)} title="Reassign Task">
              <FaUserEdit size={14} className="text-slate-600" />
            </AnimatedIconButton>
            
            {/* 3. Ownership (Admin Only) */}
            {isAdmin && (
              <AnimatedIconButton onClick={handleTakeOwnership} title="Take Ownership">
                <FaCrown size={14} className="text-amber-500" />
              </AnimatedIconButton>
            )}

            {/* 4. More Options Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors outline-none text-slate-400 hover:text-slate-600">
                  <MoreVertical size={16} />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content 
                  className="min-w-[180px] bg-white rounded-xl shadow-2xl p-1.5 border border-slate-100 z-[1000] animate-in fade-in zoom-in duration-200"
                  sideOffset={5}
                  align="end"
                >
                  {/* Notes with Count Badge */}
                  <DropdownMenu.Item 
                    onClick={() => setShowNotesModal(true)}
                    className="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg cursor-pointer outline-none group"
                  >
                    <div className="flex items-center gap-2">
                       <FaRegStickyNote className="text-slate-400 group-hover:text-indigo-500" size={12} />
                       NOTES
                    </div>
                    {notesCount > 0 && (
                      <span className="bg-red-500 text-white text-[9px] px-1.5 rounded-full">{notesCount}</span>
                    )}
                  </DropdownMenu.Item>

                  <DropdownMenu.Item 
                    onClick={() => setShowActivityModal(true)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer outline-none"
                  >
                    <History size={12} className="text-slate-400" />
                    ACTIVITY LOG
                  </DropdownMenu.Item>

                  {(task.amount !== undefined && task.amount > 0) && (
                    <DropdownMenu.Item 
                      onClick={() => setShowRecoveryModal(true)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer outline-none"
                    >
                      <DollarSign size={13} />
                      RECOVERY STATUS
                    </DropdownMenu.Item>
                  )}

                  <DropdownMenu.Separator className="h-px bg-slate-100 my-1" />

                  <DropdownMenu.Item 
                    asChild 
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer outline-none"
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <Layers size={12} className="text-slate-400" />
                      <CloneTaskButton taskId={task.id} onCloned={() => onUpdateTask?.(task.id, {})} />
                    </div>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item 
                    onClick={copyAllFields}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer outline-none"
                  >
                    <Copy size={12} className="text-slate-400" />
                    COPY DETAILS
                  </DropdownMenu.Item>

                  {onFloatRequest && (
                    <DropdownMenu.Item 
                      onClick={() => onFloatRequest(task)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-orange-600 hover:bg-orange-50 rounded-lg cursor-pointer outline-none"
                    >
                      <Pin size={12} />
                      PIN TO TOP
                    </DropdownMenu.Item>
                  )}

                  {isAdmin && (
                    <>
                      <DropdownMenu.Separator className="h-px bg-slate-100 my-1" />
                      <DropdownMenu.Item 
                        onClick={() => {
                          const confirmDelete = window.confirm("Are you sure you want to delete this task?");
                          if (confirmDelete && task.id && onDelete) onDelete(task.id);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer outline-none"
                      >
                        <Trash2 size={12} />
                        DELETE TASK
                      </DropdownMenu.Item>
                    </>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-2">
        {task.description && (
          <div className="bg-slate-50/50 p-2.5 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-500 italic leading-relaxed line-clamp-3" title={task.description}>
              "{task.description}"
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-y-1.5">
          <FieldWithCopy label="🏪 Shop" value={cf.shopName} />
          <FieldWithCopy label="🏷️ Outlet" value={cf.outletName} />
          <FieldWithCopy label="📞 Phone" value={cf.phone} />
          <FieldWithCopy label="📧 Email" value={cf.email} />
          <FieldWithCopy label="👤 Customer" value={cf.customerName} />
          <FieldWithCopy label="💰 Package" value={cf.packageAmount} />

          {cf.location && (
            <div className="flex items-center gap-2 group">
              <p className="text-xs font-medium text-slate-600 truncate flex-1">
                <strong>📍 Location:</strong>{" "}
                {isValidUrl(String(cf.location)) ? (
                  <a href={String(cf.location)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    View Maps Link
                  </a>
                ) : String(cf.location)}
              </p>
              <CopyIcon text={String(cf.location)} />
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 pt-1">
            <FieldWithCopy label="🏦 A/C" value={cf.accountNumber} />
            <FieldWithCopy label="🔢 IFSC" value={cf.ifscCode} />
          </div>
        </div>

        {/* Status Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.tags.map(tag => (
              <span key={tag} className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Attachments Section */}
        {task.attachments && task.attachments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Attachments</p>
            <div className="grid grid-cols-1 gap-1.5">
              {task.attachments.map((url, i) => {
                const label = getLabelFromUrl(url);
                return (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-colors">
                    <span className="text-xs font-bold text-slate-600 truncate mr-2">{label}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setPreviewUrl(url)} className="text-[10px] font-black text-indigo-600 uppercase">View</button>
                      <button onClick={() => handleDownload(url)} className="text-[10px] font-black text-emerald-600 uppercase">Save</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Meta Details */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              {displayAssignerName !== "—" && (
                <div className="flex flex-col">
                  <p className="text-[10px] font-medium text-slate-600">
                    By <span className="text-slate-800 font-bold">{displayAssignerName}</span>
                  </p>
                  {displayAssignerEmail && <p className="text-[9px] text-slate-600 lowercase">{displayAssignerEmail}</p>}
                </div>
              )}
              {displayAssigneeName !== "—" && (
                <div className="flex flex-col mt-1">
                  <p className="text-[10px] font-medium text-slate-600">
                    To <span className="text-indigo-600 font-bold">{displayAssigneeName}</span>
                  </p>
                  {displayAssigneeEmail && <p className="text-[9px] text-indigo-500 lowercase">{displayAssigneeEmail}</p>}
                </div>
              )}
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase">
              {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : ""}
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                const confirmDelete = window.confirm("Are you sure you want to delete this task?");
                if (confirmDelete && task.id && onDelete) onDelete(task.id);
              }}
              className="w-full py-2 mt-1 text-[10px] font-black text-red-500 uppercase tracking-widest border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete Task
            </button>
          )}
        </div>
      </div>

      {/* Modals and Overlays */}
      <AnimatePresence>
        {previewUrl && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl relative">
              <button onClick={() => setPreviewUrl(null)} className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur rounded-full shadow-lg">
                <FaTimes />
              </button>
              <div className="p-2 max-h-[85vh] overflow-auto">
                {previewUrl.toLowerCase().endsWith(".pdf") ? (
                  <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`} className="w-full h-[75vh] rounded-2xl" />
                ) : (
                  <Image src={previewUrl} alt="Preview" width={1200} height={800} className="w-full h-auto object-contain rounded-2xl" unoptimized />
                )}
              </div>
            </motion.div>
          </div>
        )}

        {showNotesModal && (
          <NotesModal
            taskId={task.id}
            initialNotes={task.notes}
            onClose={(notes) => {
              if (notes && onUpdateTask) onUpdateTask(task.id, { notes });
              setShowNotesModal(false);
            }}
          />
        )}

        {showReassignModal && (
          <ReassignTaskModal
            taskId={task.id}
            onClose={() => setShowReassignModal(false)}
            onReassign={handleReassignTask}
          />
        )}

        {showOwnerModal && (
          <ReassignTaskModal
            taskId={task.id}
            title="Transfer Ownership"
            onClose={() => setShowOwnerModal(false)}
            onReassign={handleTransferOwnership}
          />
        )}

        {showRecoveryModal && (
          <PaymentRemarkModal
            taskId={task.id}
            onClose={() => setShowRecoveryModal(false)}
            onSave={() => onUpdateTask?.(task.id, {})}
          />
        )}

        {showActivityModal && (
          <TaskActivityModal
            taskId={task.id}
            taskTitle={task.title}
            onClose={() => setShowActivityModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
