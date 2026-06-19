"use client";

import React, { useState } from "react";
import { FaTimes, FaCloudUploadAlt, FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";
import type { Task } from "../../types/task";

interface UploadDocumentModalProps {
  task: Task;
  onClose: () => void;
  onUploadSuccess: (updatedFields: Partial<Task>) => void;
}

const documentTypes = [
  { id: "aadhaarUrl", label: "🆔 Aadhaar Card" },
  { id: "panUrl", label: "💳 PAN Card" },
  { id: "selfieUrl", label: "🤳 Selfie Photo" },
  { id: "chequeUrl", label: "🏦 Cheque/Bank Document" },
  { id: "menuCardUrls", label: "📄 Menu Card (Appends to existing)" },
  { id: "attachments", label: "📎 Other Attachment (Appends to existing)" },
];

export default function UploadDocumentModal({ task, onClose, onUploadSuccess }: UploadDocumentModalProps) {
  const [selectedType, setSelectedType] = useState(documentTypes[0].id);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Uploading document...");

    try {
      // 1. Upload file to Cloudinary
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file to server.");
      }

      const { url } = await uploadRes.json();
      if (!url) throw new Error("Did not receive URL from server.");

      // 2. Prepare payload for Task Update
      const payload: Partial<Task> = {};
      
      if (selectedType === "menuCardUrls") {
        payload.menuCardUrls = [...(task.menuCardUrls || []), url];
      } else if (selectedType === "attachments") {
        payload.attachments = [...(task.attachments || []), url];
      } else {
        (payload as any)[selectedType] = url;
      }

      // 3. Update the task
      const patchRes = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!patchRes.ok) {
        throw new Error("Failed to link document to the task.");
      }

      toast.success("Document uploaded successfully!", { id: toastId });
      onUploadSuccess(payload);
      onClose();

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Upload failed", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[3000] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <FaCloudUploadAlt className="text-indigo-500" size={20} />
            Upload Missing Document
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
            <FaTimes size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Document Type</label>
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {documentTypes.map(dt => (
                <option key={dt.id} value={dt.id}>{dt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select File</label>
            <input 
              type="file" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
            />
          </div>

          {file && (
            <div className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-2">
              <span className="truncate">{file.name}</span>
              <span className="shrink-0 opacity-75">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button 
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? <><FaSpinner className="animate-spin" /> Uploading...</> : 'Upload File'}
          </button>
        </div>
      </div>
    </div>
  );
}
