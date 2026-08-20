import React, { useState, useEffect } from "react";
import { Task } from "../../types/task";
import { 
  FaTimes, FaSpinner, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, 
  FaFileAlt, FaMoneyBillWave, FaClock, FaCheckCircle, FaExclamationTriangle, 
  FaCopy, FaLink, FaCalendarAlt, FaIdCard, FaImage, FaFileInvoice
} from "react-icons/fa";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface TaskDetailsPanelProps {
  taskId: string | null;
  onClose: () => void;
}

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

  useEffect(() => {
    if (!taskId) {
      setTask(null);
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

  // Keys to exclude from the dynamic "Additional Details" section because they are manually handled
  const excludeCustomFields = ['shopName', 'phone', 'email', 'location', 'costPrice', 'afe', 'utrNumber', 'transactionId', 'awbNumber', 'awb', 'previousDispatches'];

  return (
    <div className={`fixed inset-0 z-[100] flex justify-end ${taskId ? "opacity-100 visible" : "opacity-0 invisible"} transition-all duration-300`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 overflow-y-auto ${taskId ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/80 sticky top-0 z-10 backdrop-blur-md">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
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
            className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-gray-200"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 bg-white">
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
              <FaSpinner className="animate-spin text-blue-500" size={32} />
              <p className="text-gray-500 font-medium">Loading comprehensive task data...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-48 space-y-4 text-red-500">
              <FaExclamationTriangle size={32} />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && task && (
            <div className="space-y-8 pb-10">
              {/* 1. Core Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                  <FaFileAlt /> Core Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoField label="Task ID" value={task.id} icon={<FaFileAlt />} copyable />
                  <InfoField label="Title" value={task.title} icon={<FaFileAlt />} copyable />
                  <InfoField label="Created At" value={task.createdAt ? format(new Date(task.createdAt), "dd MMM yyyy, hh:mm a") : ""} icon={<FaClock />} />
                  <InfoField label="Priority" value={task.priority} icon={<FaExclamationTriangle />} copyable />
                  
                  {/* Assignment Info */}
                  <div className="bg-indigo-50 p-4 rounded-xl sm:col-span-2 border border-indigo-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] font-black uppercase text-indigo-400 mb-1">Assigned By</div>
                        <div className="font-bold text-indigo-900">{task.assignerName || "Unknown"}</div>
                        <div className="text-xs text-indigo-600">{task.assignerEmail}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase text-indigo-400 mb-1">Assigned To</div>
                        {task.assigneeIds && task.assigneeIds.length > 0 ? (
                          <div className="text-xs text-indigo-800 font-bold">Multiple Assignees ({task.assigneeIds.length})</div>
                        ) : (
                          <>
                            <div className="font-bold text-indigo-900">{task.assigneeName || "Unknown"}</div>
                            <div className="text-xs text-indigo-600">{task.assigneeEmail}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Customer & Location Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-emerald-500 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                  <FaUser /> Customer & Location
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoField label="Shop Name" value={task.shopName || task.customFields?.shopName} icon={<FaUser />} copyable />
                  <InfoField label="Customer Name" value={task.customerName} icon={<FaUser />} copyable />
                  <InfoField label="Phone Number" value={task.phone || task.customFields?.phone} icon={<FaPhone />} copyable />
                  <InfoField label="Email" value={task.email || task.customFields?.email} icon={<FaEnvelope />} copyable />
                  
                  {/* Full width fields */}
                  <div className="sm:col-span-2">
                    <InfoField label="Location" value={task.location || task.customFields?.location} icon={<FaMapMarkerAlt />} copyable isLink={(task.location || task.customFields?.location || "").toString().startsWith("http")} />
                  </div>
                  <div className="sm:col-span-2">
                    <InfoField label="Outlet Name" value={task.outletName} icon={<FaMapMarkerAlt />} copyable />
                  </div>
                  <InfoField label="Restaurant ID" value={task.restId} icon={<FaIdCard />} copyable />
                </div>
              </div>

              {/* 3. Financial & Package Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-rose-500 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                  <FaMoneyBillWave /> Financials
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-center items-center">
                    <div className="text-[10px] font-black uppercase text-blue-500 mb-1">Amount</div>
                    <div className="font-black text-xl text-blue-700">₹{Number(task.amount || 0).toLocaleString()}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col justify-center items-center">
                    <div className="text-[10px] font-black uppercase text-green-500 mb-1">Received</div>
                    <div className="font-black text-xl text-green-700">₹{Number(task.received || 0).toLocaleString()}</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col justify-center items-center">
                    <div className="text-[10px] font-black uppercase text-red-500 mb-1">Pending</div>
                    <div className="font-black text-xl text-red-700">₹{Math.max(0, Number(task.amount || 0) - Number(task.received || 0)).toLocaleString()}</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col justify-center items-center">
                    <div className="text-[10px] font-black uppercase text-orange-500 mb-1">Cost Price</div>
                    <div className="font-black text-xl text-orange-700">₹{Number(task.customFields?.costPrice || task.customFields?.afe || 0).toLocaleString()}</div>
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
                
                {/* Transaction details from custom fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <InfoField label="UTR Number" value={task.customFields?.utrNumber} icon={<FaFileInvoice />} copyable />
                  <InfoField label="Transaction ID" value={task.customFields?.transactionId} icon={<FaFileInvoice />} copyable />
                  <InfoField label="AWB Number" value={task.customFields?.awbNumber || task.customFields?.awb} icon={<FaFileInvoice />} copyable />
                </div>
              </div>

              {/* 4. Documents & Links */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-amber-500 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                  <FaLink /> Documents & Links
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoField label="Aadhaar URL" value={task.aadhaarUrl} icon={<FaIdCard />} copyable isLink />
                  <InfoField label="PAN URL" value={task.panUrl} icon={<FaIdCard />} copyable isLink />
                  <InfoField label="Selfie URL" value={task.selfieUrl} icon={<FaImage />} copyable isLink />
                  <InfoField label="Cheque URL" value={task.chequeUrl} icon={<FaFileInvoice />} copyable isLink />
                </div>

                {/* Menu Cards array */}
                {task.menuCardUrls && task.menuCardUrls.length > 0 && (
                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="text-xs text-gray-500 mb-2 font-bold uppercase">Menu Cards ({task.menuCardUrls.length})</div>
                      <div className="flex flex-col gap-2">
                        {task.menuCardUrls.map((url, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate max-w-[80%] flex-1">
                              {url}
                            </a>
                            <button onClick={() => { navigator.clipboard.writeText(url); toast.success("Menu Card URL copied!"); }} className="text-gray-400 hover:text-blue-500 p-1">
                              <FaCopy />
                            </button>
                          </div>
                        ))}
                      </div>
                   </div>
                )}

                {/* Attachments array */}
                {task.attachments && task.attachments.length > 0 && (
                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="text-xs text-gray-500 mb-2 font-bold uppercase">Attachments ({task.attachments.length})</div>
                      <div className="flex flex-col gap-2">
                        {task.attachments.map((url, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate max-w-[80%] flex-1">
                              {url}
                            </a>
                            <button onClick={() => { navigator.clipboard.writeText(url); toast.success("Attachment URL copied!"); }} className="text-gray-400 hover:text-blue-500 p-1">
                              <FaCopy />
                            </button>
                          </div>
                        ))}
                      </div>
                   </div>
                )}
                
                {/* Payment Proofs array */}
                {task.paymentProofs && task.paymentProofs.length > 0 && (
                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="text-xs text-gray-500 mb-2 font-bold uppercase">Payment Proofs ({task.paymentProofs.length})</div>
                      <div className="flex flex-col gap-2">
                        {task.paymentProofs.map((url, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate max-w-[80%] flex-1">
                              {url}
                            </a>
                            <button onClick={() => { navigator.clipboard.writeText(url); toast.success("Payment Proof URL copied!"); }} className="text-gray-400 hover:text-blue-500 p-1">
                              <FaCopy />
                            </button>
                          </div>
                        ))}
                      </div>
                   </div>
                )}
              </div>

              {/* 5. Custom Fields (Dynamic Loop) */}
              {task.customFields && Object.keys(task.customFields).filter(key => !excludeCustomFields.includes(key)).length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-purple-500 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                    <FaFileAlt /> Additional Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(task.customFields)
                      .filter(([key]) => !excludeCustomFields.includes(key))
                      .map(([key, value]) => {
                        // Determine if it looks like a link
                        const isLink = typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
                        // Beautify the camelCase key
                        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        
                        // Handle objects/arrays inside custom fields
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
      </div>
    </div>
  );
}
