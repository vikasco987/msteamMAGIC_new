import React, { useState, useEffect, useRef } from "react";
import { Task } from "../../types/task";
import { Note } from "../../../types/note";
import { useUser } from "@clerk/nextjs";
import { 
  FaTimes, FaSpinner, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, 
  FaFileAlt, FaMoneyBillWave, FaClock, FaCheckCircle, FaExclamationTriangle, 
  FaCopy, FaLink, FaCalendarAlt, FaIdCard, FaImage, FaFileInvoice, FaFilePdf, FaDownload, FaClipboardList,
  FaPaperclip, FaPaperPlane, FaUserCircle, FaSave, FaTrash, FaEdit
} from "react-icons/fa";
import { format } from "date-fns";
import toast from "react-hot-toast";
import PaymentHistory from "./PaymentHistory";

interface TaskDetailsPanelProps {
  taskId: string | null;
  onClose: () => void;
}

type LightboxState = {
  url: string;
  type: 'image' | 'pdf';
  title: string;
} | null;

const InfoField = ({ label, value, icon, copyable = false, isLink = false }: { label: string, value: any, icon?: React.ReactNode, copyable?: boolean, isLink?: boolean }) => {
  if (value === undefined || value === null || value === "") return null;
  
  const displayValue = String(value);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayValue);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-xl flex items-start justify-between group hover:bg-gray-100 transition-colors border border-gray-100">
      <div className="flex-1 overflow-hidden pr-2">
        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1 font-bold uppercase tracking-wider">
          {icon} {label}
        </div>
        {isLink ? (
          <a href={displayValue} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline break-all text-sm">
            {displayValue}
          </a>
        ) : (
          <div className="font-semibold text-gray-800 break-words whitespace-pre-wrap text-sm">{displayValue}</div>
        )}
      </div>
      {copyable && (
        <button 
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex-shrink-0"
          title="Copy"
        >
          <FaCopy />
        </button>
      )}
    </div>
  );
};

export default function TaskDetailsPanel({ taskId, onClose }: TaskDetailsPanelProps) {
  const { user } = useUser();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'customer' | 'financials' | 'invoices' | 'documents' | 'custom' | 'discussion'>('overview');
  const [lightbox, setLightbox] = useState<LightboxState>(null);
  
  const userRole = String(user?.publicMetadata?.role || user?.unsafeMetadata?.role || "USER").trim().toUpperCase();
  const isMaster = ["MASTER", "ADMIN"].includes(userRole);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<any>({});
  const [savingTask, setSavingTask] = useState(false);

  const handleEditChange = (field: string, value: any, isCustom = false) => {
    setEditedTask((prev: any) => {
      if (isCustom) {
        return { ...prev, customFields: { ...(prev.customFields || {}), [field]: value } };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSave = async () => {
    setSavingTask(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedTask)
      });
      if (!res.ok) throw new Error("Failed to save changes");
      const updated = await res.json();
      setTask(updated.task);
      setIsEditing(false);
      setEditedTask({});
      toast.success("Task updated successfully!");
    } catch(err) {
      toast.error("Error saving task");
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm("Are you sure you want to completely DELETE this task? This cannot be undone!")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Task deleted successfully!");
      onClose(); // close panel
      window.location.reload(); // Refresh the list
    } catch(err) {
      toast.error("Error deleting task");
    }
  };

  const handleRemoveDoc = (type: string, urlToRemove: string, isArray: boolean = false) => {
    if (!confirm("Remove this document?")) return;
    setEditedTask((prev: any) => {
      const updated = { ...prev };
      if (isArray) {
        updated[type] = (updated[type] || task?.[type as keyof Task] || []).filter((u: string) => u !== urlToRemove);
      } else {
        updated[type] = null;
      }
      return updated;
    });
  };

  useEffect(() => {
    if (isEditing && task) {
      setEditedTask({ ...task });
    }
  }, [isEditing, task]);
  
  // Discussion State
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [uploadingNote, setUploadingNote] = useState(false);
  const [noteFile, setNoteFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!taskId) {
      setTask(null);
      setActiveTab('overview');
      setLightbox(null);
      return;
    }

    const fetchTaskDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/tasks/${taskId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch task details");
        }
        const data = await res.json();
        setTask(data);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId]);

  // Lightbox Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightbox) {
        setLightbox(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox]);

  // Fetch Notes for Discussion
  useEffect(() => {
    if (activeTab === 'discussion' && taskId) {
      setNotesLoading(true);
      fetch(`/api/notes?taskId=${taskId}`)
        .then(res => res.json())
        .then(data => { setNotes(data); setNotesLoading(false); })
        .catch(err => { console.error("Error fetching notes:", err); setNotesLoading(false); });
    }
  }, [activeTab, taskId]);

  const handleAddNote = async () => {
    if (!noteInput.trim() && !noteFile) return;
    setUploadingNote(true);
    try {
      let uploadedFileUrl = "";
      if (noteFile) {
        const formData = new FormData();
        formData.append("file", noteFile);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        uploadedFileUrl = data.url;
      }
      
      const authorName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
      const authorEmail = user?.primaryEmailAddress?.emailAddress || "unknown@example.com";
      
      const noteRes = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          content: noteInput,
          authorName,
          authorEmail,
          fileUrl: uploadedFileUrl || undefined,
        })
      });
      if (!noteRes.ok) throw new Error("Note creation failed");
      const newNote = await noteRes.json();
      setNotes(prev => [newNote, ...prev]);
      setNoteInput("");
      setNoteFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Note added!");
    } catch(e) {
      console.error(e);
      toast.error("Failed to add note.");
    } finally {
      setUploadingNote(false);
    }
  };

  // Helper to determine document type
  const getDocType = (url: string): 'pdf' | 'image' => {
    if (url.toLowerCase().includes('.pdf')) return 'pdf';
    return 'image';
  };

  // Helper to render Document Cards
  const renderDocCard = (url: string, title: string) => {
    if (!url) return null;
    const type = getDocType(url);
    const isPdf = type === 'pdf';

    return (
      <div 
        onClick={() => setLightbox({ url, type, title })}
        className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group"
      >
        <div className={`p-4 rounded-full ${isPdf ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'} group-hover:scale-110 transition-transform`}>
          {isPdf ? <FaFilePdf size={28} /> : <FaImage size={28} />}
        </div>
        <div className="text-center w-full">
          <p className="font-bold text-sm text-gray-800 truncate">{title}</p>
          <p className="text-xs text-gray-500 uppercase">{isPdf ? 'PDF Document' : 'Image File'}</p>
        </div>
      </div>
    );
  };

  const excludeCustomFields = ['shopName', 'phone', 'email', 'location', 'costPrice', 'afe', 'utrNumber', 'transactionId', 'awbNumber', 'awb', 'previousDispatches'];
  const hasCustomFields = task?.customFields && Object.keys(task.customFields).filter(key => !excludeCustomFields.includes(key)).length > 0;

  const totalAmt = Number(task?.amount || 0);
  const rcvdAmt = Number(task?.received || 0);
  const percentPaid = totalAmt > 0 ? Math.min(100, Math.round((rcvdAmt / totalAmt) * 100)) : 0;

  return (
    <div className={`fixed inset-0 z-[100] flex justify-end ${taskId ? "opacity-100 visible" : "opacity-0 invisible"} transition-all duration-300`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className={`relative w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ${taskId ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Sticky Header */}
        <div className="flex flex-col border-b border-gray-100 bg-white sticky top-0 z-20">
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
              Task Details <span className="text-xs text-gray-400 font-normal ml-2">({userRole})</span>
              {task && (
                <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-black tracking-wider ${
                  task.status === "Completed" ? "bg-green-100 text-green-700" :
                  task.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-200 text-gray-700"
                }`}>
                  {task.status.replace("_", " ")}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              {isMaster && !isEditing && (
                <>
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors">
                    <FaEdit /> Edit Task
                  </button>
                  <button onClick={handleDeleteTask} className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors">
                    <FaTrash /> Delete
                  </button>
                </>
              )}
              {isMaster && isEditing && (
                <>
                  <button onClick={() => { setIsEditing(false); setEditedTask({}); }} className="flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={savingTask} className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50">
                    {savingTask ? <FaSpinner className="animate-spin" /> : <FaSave />} Save
                  </button>
                </>
              )}
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-gray-100"
              >
                <FaTimes size={20} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          {task && !loading && (
            <div className="flex items-center gap-6 px-6 overflow-x-auto scrollbar-hide">
              <button onClick={() => setActiveTab('overview')} className={`pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Overview</button>
              <button onClick={() => setActiveTab('customer')} className={`pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${activeTab === 'customer' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Customer</button>
              <button onClick={() => setActiveTab('financials')} className={`pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${activeTab === 'financials' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Financials</button>
              <button onClick={() => setActiveTab('invoices')} className={`pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${activeTab === 'invoices' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Invoices</button>
              <button onClick={() => setActiveTab('documents')} className={`pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${activeTab === 'documents' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Documents</button>
              {hasCustomFields && (
                <button onClick={() => setActiveTab('custom')} className={`pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${activeTab === 'custom' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Custom Data</button>
              )}
              <button onClick={() => setActiveTab('discussion')} className={`pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${activeTab === 'discussion' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Discussion & Docs</button>
            </div>
          )}
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="p-6 flex-1 bg-slate-50/40 overflow-y-auto relative z-0 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
          {/* Subtle Watermark Pattern */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] z-[-1]">
            <FaClipboardList style={{ width: '300px', height: '300px' }} className="text-indigo-900" />
          </div>
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 z-[-2]"></div>
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
              <FaSpinner className="animate-spin text-indigo-500" size={32} />
              <p className="text-gray-500 font-medium">Loading task data...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-48 space-y-4 text-red-500">
              <FaExclamationTriangle size={32} />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && task && (
            <div className="pb-10">
              {/* TAB: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoField label="Task ID" value={task.id} icon={<FaFileAlt />} copyable />
                    <InfoField label="Title" value={(isEditing ? editedTask.title : (task.title))} editable={isEditing} onChange={(val) => handleEditChange('title', val, false)} type="text"  icon={<FaFileAlt />} copyable />
                    <InfoField label="Created At" value={task.createdAt ? format(new Date(task.createdAt), "dd MMM yyyy, hh:mm a") : ""} icon={<FaClock />} />
                    <InfoField label="Priority" value={(isEditing ? editedTask.priority : (task.priority))} editable={isEditing} onChange={(val) => handleEditChange('priority', val, false)} type="select" options={["low", "medium", "high", "urgent"]} icon={<FaExclamationTriangle />} copyable />
                    
                    {/* Assignment Info */}
                    <div className="bg-indigo-50 p-5 rounded-xl sm:col-span-2 border border-indigo-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <div className="text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">Assigned By</div>
                          <div className="font-bold text-indigo-900 text-lg">{task.assignerName || "Unknown"}</div>
                          <div className="text-sm text-indigo-600">{task.assignerEmail}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-wider">Assigned To</div>
                          {task.assigneeIds && task.assigneeIds.length > 0 ? (
                            <div className="text-sm text-indigo-800 font-bold bg-indigo-200/50 inline-block px-3 py-1 rounded-full">
                              Multiple Assignees ({task.assigneeIds.length})
                            </div>
                          ) : (
                            <>
                              <div className="font-bold text-indigo-900 text-lg">{task.assigneeName || "Unknown"}</div>
                              <div className="text-sm text-indigo-600">{task.assigneeEmail}</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: CUSTOMER */}
              {activeTab === 'customer' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoField label="Shop Name" value={(isEditing ? editedTask.customFields?.shopName : (task.shopName || task.customFields?.shopName))} editable={isEditing} onChange={(val) => handleEditChange('shopName', val, true)} type="text"  icon={<FaUser />} copyable />
                    <InfoField label="Customer Name" value={(isEditing ? editedTask.customerName : (task.customerName))} editable={isEditing} onChange={(val) => handleEditChange('customerName', val, false)} type="text"  icon={<FaUser />} copyable />
                    <InfoField label="Phone Number" value={(isEditing ? editedTask.customFields?.phone : (task.phone || task.customFields?.phone))} editable={isEditing} onChange={(val) => handleEditChange('phone', val, true)} type="text"  icon={<FaPhone />} copyable />
                    <InfoField label="Email" value={(isEditing ? editedTask.customFields?.email : (task.email || task.customFields?.email))} editable={isEditing} onChange={(val) => handleEditChange('email', val, true)} type="text"  icon={<FaEnvelope />} copyable />
                    <div className="sm:col-span-2">
                      <InfoField label="Location" value={(isEditing ? editedTask.customFields?.location : (task.location || task.customFields?.location))} editable={isEditing} onChange={(val) => handleEditChange('location', val, true)} type="text"  icon={<FaMapMarkerAlt />} copyable isLink={(task.location || task.customFields?.location || "").toString().startsWith("http")} />
                    </div>
                    <div className="sm:col-span-2">
                      <InfoField label="Outlet Name" value={(isEditing ? editedTask.outletName : (task.outletName))} editable={isEditing} onChange={(val) => handleEditChange('outletName', val, false)} type="text"  icon={<FaMapMarkerAlt />} copyable />
                    </div>
                    <InfoField label="Restaurant ID" value={(isEditing ? editedTask.restId : (task.restId))} editable={isEditing} onChange={(val) => handleEditChange('restId', val, false)} type="text"  icon={<FaIdCard />} copyable />
                  </div>
                </div>
              )}

              {/* TAB: FINANCIALS */}
              {activeTab === 'financials' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Payment Progress Bar */}
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2"><FaMoneyBillWave className="text-green-500" /> Payment Progress</h3>
                      <span className={`font-black text-lg ${percentPaid === 100 ? 'text-green-500' : percentPaid > 0 ? 'text-yellow-600' : 'text-red-500'}`}>{percentPaid}% Collected</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden border border-gray-200">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${percentPaid === 100 ? 'bg-green-500' : percentPaid > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${percentPaid}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-center items-center shadow-sm">
                      <div className="text-[10px] font-black uppercase text-blue-500 mb-1 tracking-widest">Amount</div>
                      <div className="font-black text-2xl text-blue-700">₹{Number(task.amount || 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col justify-center items-center shadow-sm">
                      <div className="text-[10px] font-black uppercase text-green-500 mb-1 tracking-widest">Received</div>
                      <div className="font-black text-2xl text-green-700">₹{Number(task.received || 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col justify-center items-center shadow-sm">
                      <div className="text-[10px] font-black uppercase text-red-500 mb-1 tracking-widest">Pending</div>
                      <div className="font-black text-2xl text-red-700">₹{Math.max(0, Number(task.amount || 0) - Number(task.received || 0)).toLocaleString()}</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col justify-center items-center shadow-sm">
                      <div className="text-[10px] font-black uppercase text-orange-500 mb-1 tracking-widest">Cost Price</div>
                      <div className="font-black text-2xl text-orange-700">₹{Number(task.customFields?.costPrice || task.customFields?.afe || 0).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <InfoField label="Account Number" value={(isEditing ? editedTask.accountNumber : (task.accountNumber))} editable={isEditing} onChange={(val) => handleEditChange('accountNumber', val, false)} type="text"  icon={<FaMoneyBillWave />} copyable />
                    <InfoField label="IFSC Code" value={(isEditing ? editedTask.ifscCode : (task.ifscCode))} editable={isEditing} onChange={(val) => handleEditChange('ifscCode', val, false)} type="text"  icon={<FaMoneyBillWave />} copyable />
                    <InfoField label="Package Amount" value={(isEditing ? editedTask.packageAmount : (task.packageAmount))} editable={isEditing} onChange={(val) => handleEditChange('packageAmount', val, false)} type="number"  icon={<FaMoneyBillWave />} copyable />
                    <InfoField label="Start Date" value={(isEditing ? editedTask.startDate : (task.startDate))} editable={isEditing} onChange={(val) => handleEditChange('startDate', val, false)} type="date"  icon={<FaCalendarAlt />} copyable />
                    <InfoField label="End Date" value={(isEditing ? editedTask.endDate : (task.endDate))} editable={isEditing} onChange={(val) => handleEditChange('endDate', val, false)} type="date"  icon={<FaCalendarAlt />} copyable />
                    <InfoField label="Timeline" value={(isEditing ? editedTask.timeline : (task.timeline))} editable={isEditing} onChange={(val) => handleEditChange('timeline', val, false)} type="text"  icon={<FaClock />} copyable />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <InfoField label="UTR Number" value={(isEditing ? editedTask.customFields?.utrNumber : (task.customFields?.utrNumber))} editable={isEditing} onChange={(val) => handleEditChange('utrNumber', val, true)} type="text"  icon={<FaFileInvoice />} copyable />
                    <InfoField label="Transaction ID" value={(isEditing ? editedTask.customFields?.transactionId : (task.customFields?.transactionId))} editable={isEditing} onChange={(val) => handleEditChange('transactionId', val, true)} type="text"  icon={<FaFileInvoice />} copyable />
                    <InfoField label="AWB Number" value={(isEditing ? editedTask.customFields?.customFieldsawbNumber : (task.customFields?.awbNumber || task.customFields?.awb))} editable={isEditing} onChange={(val) => handleEditChange('customFieldsawbNumber', val, true)} type="text"  icon={<FaFileInvoice />} copyable />
                  </div>
                </div>
              )}

              {/* TAB: INVOICES */}
              {activeTab === 'invoices' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><FaFileInvoice className="text-blue-500" /> Invoices & Payment History</h3>
                    <PaymentHistory 
                      paymentHistory={(task.paymentHistory as any) || []} 
                      taskTitle={task.title}
                      taskDetails={{
                        taskId: task.id,
                        shopName: task.customFields?.shopName || task.shopName,
                        customerName: task.customerName,
                        address: task.customFields?.location,
                        phone: task.customFields?.phone || task.phone,
                        gstin: task.customFields?.gstin || task.customFields?.gstNo,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TAB: DOCUMENTS */}
              {activeTab === 'documents' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  {/* Primary Documents */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {renderDocCard(task.aadhaarUrl || "", "Aadhaar Card", "aadhaarUrl")}
                    {renderDocCard(task.panUrl || "", "PAN Card", "panUrl")}
                    {renderDocCard(task.selfieUrl || "", "Selfie", "selfieUrl")}
                    {renderDocCard(task.chequeUrl || "", "Cheque / Passbook", "chequeUrl")}
                  </div>

                  {/* Array Documents */}
                  {task.menuCardUrls && task.menuCardUrls.length > 0 && (
                    <div>
                      <h4 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">Menu Cards</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {task.menuCardUrls.map((url, idx) => (
                           <React.Fragment key={idx}>
                             {renderDocCard(url, `Menu Card ${idx + 1}`, "menuCardUrls", true)}
                           </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {task.attachments && task.attachments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">Attachments</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {task.attachments.map((url, idx) => (
                           <React.Fragment key={idx}>
                             {renderDocCard(url, `Attachment ${idx + 1}`, "attachments", true)}
                           </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {task.paymentProofs && task.paymentProofs.length > 0 && (
                    <div>
                      <h4 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">Payment Proofs</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {task.paymentProofs.map((url, idx) => (
                           <React.Fragment key={idx}>
                             {renderDocCard(url, `Payment Proof ${idx + 1}`, "paymentProofs", true)}
                           </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {!task.aadhaarUrl && !task.panUrl && !task.selfieUrl && !task.chequeUrl && 
                   (!task.menuCardUrls || task.menuCardUrls.length === 0) &&
                   (!task.attachments || task.attachments.length === 0) &&
                   (!task.paymentProofs || task.paymentProofs.length === 0) && (
                    <div className="text-center py-12 text-gray-400">
                      <FaImage size={48} className="mx-auto mb-4 opacity-20" />
                      <p>No documents available for this task.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: CUSTOM DATA */}
              {activeTab === 'custom' && task.customFields && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(task.customFields)
                      .filter(([key]) => !excludeCustomFields.includes(key))
                      .map(([key, value]) => {
                        const isLink = typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
                        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        let displayValue = value;
                        if (typeof value === 'object' && value !== null) {
                          displayValue = JSON.stringify(value, null, 2);
                        }
                        return (
                          <div key={key} className="sm:col-span-2">
                            <InfoField 
                              label={label} 
                              value={displayValue} 
                              copyable 
                              isLink={isLink}
                            />
                          </div>
                        );
                      })
                    }
                  </div>
                </div>
              )}

              {/* TAB: DISCUSSION & DOCS */}
              {activeTab === 'discussion' && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Chat History */}
                  <div className="flex-1 space-y-4 mb-6">
                    {notesLoading ? (
                      <div className="flex justify-center p-8"><FaSpinner className="animate-spin text-cyan-500 text-2xl" /></div>
                    ) : notes.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 italic">No discussion yet. Start the conversation!</div>
                    ) : (
                      notes.map((note) => {
                        const isMe = note.authorEmail === user?.primaryEmailAddress?.emailAddress;
                        return (
                          <div key={note.id || note.createdAt.toString()} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${isMe ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'}`}>
                              <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isMe ? 'text-cyan-200' : 'text-gray-400'}`}>
                                {note.authorName || "Unknown"} • {format(new Date(note.createdAt), "dd MMM, HH:mm")}
                              </div>
                              <div className="whitespace-pre-wrap text-sm">{note.content}</div>
                              {note.fileUrl && (
                                <div className="mt-3">
                                  {note.fileUrl.toLowerCase().endsWith('.pdf') ? (
                                    <a href={note.fileUrl} target="_blank" rel="noreferrer" className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold ${isMe ? 'bg-cyan-700 text-white hover:bg-cyan-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                      <FaFilePdf size={16} /> View Attached PDF
                                    </a>
                                  ) : (
                                    <div 
                                      className="cursor-pointer overflow-hidden rounded-lg border-2 border-transparent hover:border-white/50 transition-all"
                                      onClick={() => setLightbox({ url: note.fileUrl!, type: 'image', title: 'Attachment' })}
                                    >
                                      <img src={note.fileUrl} alt="attachment" className="max-h-32 rounded-lg object-cover" />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {/* Chat Input */}
                  <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex items-end gap-2 sticky bottom-0 z-10">
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={(e) => setNoteFile(e.target.files?.[0] || null)}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-3 rounded-xl transition-colors ${noteFile ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                      title="Attach File"
                    >
                      <FaPaperclip size={18} />
                    </button>
                    <div className="flex-1 bg-gray-50 rounded-xl border border-gray-100 px-3 py-2 focus-within:bg-white focus-within:border-cyan-300 transition-colors">
                      {noteFile && (
                        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-cyan-700 bg-cyan-50 p-1.5 rounded-lg border border-cyan-100">
                          <FaCheckCircle /> {noteFile.name}
                          <button onClick={() => setNoteFile(null)} className="ml-auto text-red-500 hover:text-red-700"><FaTimes /></button>
                        </div>
                      )}
                      <textarea 
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="Type a note..."
                        className="w-full bg-transparent border-none outline-none resize-none text-sm text-gray-800 placeholder-gray-400"
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddNote();
                          }
                        }}
                      />
                    </div>
                    <button 
                      onClick={handleAddNote}
                      disabled={uploadingNote || (!noteInput.trim() && !noteFile)}
                      className="p-3 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {uploadingNote ? <FaSpinner className="animate-spin" size={18} /> : <FaPaperPlane size={18} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* LIGHTBOX MODAL */}
        {lightbox && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/95 backdrop-blur-md animate-in fade-in duration-200">
            {/* Lightbox Backdrop clickable area */}
            <div className="absolute inset-0" onClick={() => setLightbox(null)} />
            
            {/* Lightbox Header Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent z-10">
              <h3 className="text-white font-bold text-lg px-2 drop-shadow-md">{lightbox.title}</h3>
              <div className="flex items-center gap-3">
                <a 
                  href={lightbox.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg"
                  download
                >
                  <FaDownload /> <span className="hidden sm:inline">Download</span>
                </a>
                <button 
                  onClick={() => setLightbox(null)}
                  className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
                >
                  <FaTimes size={24} />
                </button>
              </div>
            </div>

            {/* Lightbox Content Viewer */}
            <div className="relative z-0 w-full h-full p-16 pb-8 flex items-center justify-center pointer-events-none">
              <div className="w-full h-full relative flex items-center justify-center pointer-events-auto shadow-2xl rounded-lg overflow-hidden">
                {lightbox.type === 'pdf' ? (
                  <iframe 
                    src={lightbox.url} 
                    className="w-full h-full bg-white rounded-lg"
                    title={lightbox.title}
                  />
                ) : (
                  <img 
                    src={lightbox.url} 
                    alt={lightbox.title} 
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

