"use client";

import React, { useState } from "react";
import { X, Printer, Loader2, Download, ExternalLink, Check } from "lucide-react";
import toast from "react-hot-toast";

interface PrintLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  awbNumber: string;
}

export default function PrintLabelModal({
  isOpen,
  onClose,
  awbNumber,
}: PrintLabelModalProps) {
  const [size, setSize] = useState<string>("2*3");
  const [fileType, setFileType] = useState<string>("pdf");
  const [includeProductDetails, setIncludeProductDetails] = useState<boolean>(false);
  const [includeGstNumber, setIncludeGstNumber] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [downloadedUrl, setDownloadedUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePrint = async () => {
    if (!awbNumber) {
      toast.error("AWB Number is required");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/dispatch/shadowfax/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          awbNumber: awbNumber.trim(),
          size,
          fileType,
          includeProductDetails,
          includeGstNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.labelUrl) {
        throw new Error(data.error || "Failed to generate label");
      }

      setDownloadedUrl(data.labelUrl);
      toast.success("Shipping label generated successfully!");

      // Open PDF in a new tab or trigger download automatically
      const newTab = window.open(data.labelUrl, "_blank");
      if (!newTab) {
        // Pop-up blocked, fall back to anchor click
        const link = document.createElement("a");
        link.href = data.labelUrl;
        link.target = "_blank";
        link.download = `${awbNumber}_label.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong while generating label");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Print Label</h2>
            <p className="text-base font-extrabold text-slate-900 mt-0.5 tracking-tight">
              {awbNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-sm">
          {/* AWB input (read only / tag display) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              AWBs:
            </label>
            <div className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-semibold text-xs flex items-center">
              <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide">
                {awbNumber}
              </span>
            </div>
          </div>

          {/* Size Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Select Size
            </label>
            <div className="relative">
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white cursor-pointer"
              >
                <option value="2*3">2*3 (Thermal Small)</option>
                <option value="4*6">4*6 (Standard Shipping Label)</option>
                <option value="3*5">3*5</option>
              </select>
            </div>
          </div>

          {/* File Type Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Select File Type
            </label>
            <div className="relative">
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white cursor-pointer"
              >
                <option value="pdf">Download PDF Format</option>
                <option value="prn">Download PRN Format (Thermal Printer)</option>
              </select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2.5 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 select-none text-xs font-medium">
              <input
                type="checkbox"
                checked={includeProductDetails}
                onChange={(e) => setIncludeProductDetails(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
              />
              <span>Include Product Details</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 select-none text-xs font-medium">
              <input
                type="checkbox"
                checked={includeGstNumber}
                onChange={(e) => setIncludeGstNumber(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
              />
              <span>Include GST Number</span>
            </label>
          </div>

          {/* Previously generated label quick link */}
          {downloadedUrl && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-semibold text-emerald-800">
              <div className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-600" />
                <span>Label is ready</span>
              </div>
              <a
                href={downloadedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 underline font-bold"
              >
                Open PDF <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {/* Footer / Action */}
        <div className="p-5 pt-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-700/20 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Generating Label...</span>
              </>
            ) : (
              <>
                <Printer size={16} />
                <span>Print Label</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
