"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { FaTimes } from "react-icons/fa";
import { UploadCloud, FileText, Eye, Trash2, X } from "lucide-react";
import Image from "next/image";

interface FileDropzoneProps {
  onDrop: (files: File[]) => void;
  acceptedFiles: File[];
  label: string;
}

export default function FileDropzone({
  onDrop,
  acceptedFiles,
  label,
}: FileDropzoneProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "pdf" | null>(null);

  const handleDrop = useCallback(
    (accepted: File[]) => {
      onDrop(accepted);
    },
    [onDrop]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple: true,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "application/pdf": [".pdf"],
    },
  });

  const handlePreview = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPreviewType(file.type === "application/pdf" ? "pdf" : "image");
  };

  useEffect(() => {
    if (previewUrl) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [previewUrl]);

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`group relative border-2 border-dashed p-6 rounded-[2rem] cursor-pointer transition-all duration-500 overflow-hidden ${
          isDragActive
            ? "bg-indigo-50 border-indigo-500 ring-4 ring-indigo-500/10 scale-[0.99]"
            : "bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5"
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
            isDragActive ? "bg-indigo-600 text-white rotate-12" : "bg-white text-slate-400 group-hover:text-indigo-600 group-hover:shadow-lg shadow-sm"
          }`}>
            <UploadCloud size={24} />
          </div>
          
          <div>
            <p className="text-xs font-black text-slate-700 uppercase tracking-widest">{label}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tighter">PDF, PNG, JPG up to 10MB</p>
          </div>
        </div>

        {/* Floating background element */}
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700" />
      </div>

      {acceptedFiles?.length > 0 && (
        <div className="mt-4 space-y-2">
          {acceptedFiles.map((file, i) => (
            <div 
              key={i} 
              className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group/item animate-in slide-in-from-left-2 duration-300"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-indigo-50 group-hover/item:text-indigo-600 transition-colors">
                  <FileText size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(file);
                  }}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  title="Preview"
                >
                  <Eye size={14} />
                </button>
                <button
                  type="button"
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Optional: Add remove logic if needed, but the current state management 
                    // handles this via the parent component usually.
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modern Glassmorphism Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden relative shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] flex flex-col">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Eye size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 tracking-tight">Document Preview</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Visual Inspection Mode</p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setPreviewUrl(null);
                  setPreviewType(null);
                }}
                className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50/50">
              {previewType === "pdf" ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[60vh] rounded-[2rem] border-4 border-white shadow-xl"
                  title="PDF Preview"
                />
              ) : (
                <div className="relative w-full h-[60vh] rounded-[2rem] border-4 border-white shadow-xl overflow-hidden bg-white">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}