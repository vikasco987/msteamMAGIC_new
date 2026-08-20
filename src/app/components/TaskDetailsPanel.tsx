import React, { useState, useEffect } from "react";
import { Task } from "../../types/task";
import { 
  FaTimes, FaSpinner, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, 
  FaFileAlt, FaMoneyBillWave, FaClock, FaCheckCircle, FaExclamationTriangle, 
  FaCopy, FaLink, FaCalendarAlt, FaIdCard, FaImage, FaFileInvoice, FaFilePdf, FaDownload
} from "react-icons/fa";
import { format } from "date-fns";
import toast from "react-hot-toast";

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
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'customer' | 'financials' | 'documents' | 'custom'>('overview');
  const [lightbox, setLightbox] = useState<LightboxState>(null);

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
              Task Details
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
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-gray-100"
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Tabs */}
          {task && !loading && (
            <div className="flex items-center gap-6 px-6 overflow-x-auto scrollbar-hide">
              <button onClick={() => setActiveTab('overview')} className={`pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Overview</button>
              <button onClick={() => setActiveTab('customer')} className={`pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${activeTab === 'customer' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Customer</button>
              <button onClick={() => setActiveTab('financials')} className={`pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${activeTab === 'financials' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Financials</button>
              <button onClick={() => setActiveTab('documents')} className={`pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${activeTab === 'documents' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Documents</button>
              {hasCustomFields && (
                <button onClick={() => setActiveTab('custom')} className={`pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${activeTab === 'custom' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Custom Data</button>
              )}
            </div>
          )}
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="p-6 flex-1 bg-white overflow-y-auto relative">
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
                    <InfoField label="Title" value={task.title} icon={<FaFileAlt />} copyable />
                    <InfoField label="Created At" value={task.createdAt ? format(new Date(task.createdAt), "dd MMM yyyy, hh:mm a") : ""} icon={<FaClock />} />
                    <InfoField label="Priority" value={task.priority} icon={<FaExclamationTriangle />} copyable />
                    
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
                    <InfoField label="Shop Name" value={task.shopName || task.customFields?.shopName} icon={<FaUser />} copyable />
                    <InfoField label="Customer Name" value={task.customerName} icon={<FaUser />} copyable />
                    <InfoField label="Phone Number" value={task.phone || task.customFields?.phone} icon={<FaPhone />} copyable />
                    <InfoField label="Email" value={task.email || task.customFields?.email} icon={<FaEnvelope />} copyable />
                    <div className="sm:col-span-2">
                      <InfoField label="Location" value={task.location || task.customFields?.location} icon={<FaMapMarkerAlt />} copyable isLink={(task.location || task.customFields?.location || "").toString().startsWith("http")} />
                    </div>
                    <div className="sm:col-span-2">
                      <InfoField label="Outlet Name" value={task.outletName} icon={<FaMapMarkerAlt />} copyable />
                    </div>
                    <InfoField label="Restaurant ID" value={task.restId} icon={<FaIdCard />} copyable />
                  </div>
                </div>
              )}

              {/* TAB: FINANCIALS */}
              {activeTab === 'financials' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                    <InfoField label="Account Number" value={task.accountNumber} icon={<FaMoneyBillWave />} copyable />
                    <InfoField label="IFSC Code" value={task.ifscCode} icon={<FaMoneyBillWave />} copyable />
                    <InfoField label="Package Amount" value={task.packageAmount} icon={<FaMoneyBillWave />} copyable />
                    <InfoField label="Start Date" value={task.startDate} icon={<FaCalendarAlt />} copyable />
                    <InfoField label="End Date" value={task.endDate} icon={<FaCalendarAlt />} copyable />
                    <InfoField label="Timeline" value={task.timeline} icon={<FaClock />} copyable />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <InfoField label="UTR Number" value={task.customFields?.utrNumber} icon={<FaFileInvoice />} copyable />
                    <InfoField label="Transaction ID" value={task.customFields?.transactionId} icon={<FaFileInvoice />} copyable />
                    <InfoField label="AWB Number" value={task.customFields?.awbNumber || task.customFields?.awb} icon={<FaFileInvoice />} copyable />
                  </div>
                </div>
              )}

              {/* TAB: DOCUMENTS */}
              {activeTab === 'documents' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  {/* Primary Documents */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {renderDocCard(task.aadhaarUrl, "Aadhaar Card")}
                    {renderDocCard(task.panUrl, "PAN Card")}
                    {renderDocCard(task.selfieUrl, "Selfie")}
                    {renderDocCard(task.chequeUrl, "Cheque / Passbook")}
                  </div>

                  {/* Array Documents */}
                  {task.menuCardUrls && task.menuCardUrls.length > 0 && (
                    <div>
                      <h4 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">Menu Cards</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {task.menuCardUrls.map((url, idx) => (
                           <React.Fragment key={idx}>
                             {renderDocCard(url, `Menu Card ${idx + 1}`)}
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
                             {renderDocCard(url, `Attachment ${idx + 1}`)}
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
                             {renderDocCard(url, `Payment Proof ${idx + 1}`)}
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

