"use client";

import React, { useState, useRef } from "react";
import { X, UploadCloud, CheckCircle2, AlertCircle, RefreshCw, Trash2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";

interface BulkImportModalProps {
    formId: string;
    onClose: () => void;
    onSuccess: () => void;
    availableColumns: { id: string; label: string; isInternal: boolean; type: string }[];
}

export default function BulkImportModal({ formId, onClose, onSuccess, availableColumns }: BulkImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [matchColumnId, setMatchColumnId] = useState<string>("");
    const [headerMapping, setHeaderMapping] = useState<Record<string, string>>({});
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Upload, 2: Map & Preview, 3: Processing, 4: Results
    const [loading, setLoading] = useState(false);
    const [importErrors, setImportErrors] = useState<string[]>([]);
    const [successCount, setSuccessCount] = useState<number>(0);
    const [importMode, setImportMode] = useState<'update' | 'create' | 'upsert'>('upsert');
    const [progress, setProgress] = useState<{ total: number; current: number }>({ total: 0, current: 0 });
    const [disableActivityLogs, setDisableActivityLogs] = useState(false);

    // Status tracking per row for preview
    const [previewLimit] = useState(10);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        
        console.log("File selected:", selectedFile.name, selectedFile.size, selectedFile.type);
        setFile(selectedFile);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const dataBuffer = evt.target?.result;
                if (!dataBuffer) throw new Error("File reading failed (empty buffer)");

                // Try reading with multiple modes for maximum compatibility
                let wb;
                try {
                    wb = XLSX.read(dataBuffer, { type: dataBuffer instanceof ArrayBuffer ? "array" : "binary", cellDates: true });
                } catch (e) {
                    console.warn("Primary read failed, trying string fallback...");
                    wb = XLSX.read(dataBuffer, { type: "string" });
                }

                console.log("Sheets found:", wb.SheetNames);
                
                // Find the first sheet that actually has some data
                let targetSheetName = wb.SheetNames[0];
                let data: Record<string, any>[] = [];
                
                for (const name of wb.SheetNames) {
                    const ws = wb.Sheets[name];
                    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Record<string, any>[];
                    if (rows.length > 0) {
                        data = rows;
                        targetSheetName = name;
                        break;
                    }
                }

                console.log(`Using sheet: "${targetSheetName}" with ${data.length} rows`);
                
                if (data.length > 0) {
                    const excelHeaders = Object.keys(data[0]);
                    console.log("Excel headers found:", excelHeaders);
                    
                    setHeaders(excelHeaders);
                    setParsedData(data as Record<string, string>[]);

                    // Auto-map logic: attempt to find matching labels
                    const autoMap: Record<string, string> = {};
                    excelHeaders.forEach(h => {
                        const cleanH = h.toString().toLowerCase().trim();
                        const exactMatch = availableColumns.find(c => 
                            c.label.toLowerCase().trim() === cleanH || 
                            c.id.toLowerCase() === cleanH
                        );
                        if (exactMatch) {
                            console.log(`Auto-mapped "${h}" to DB Column "${exactMatch.label}"`);
                            autoMap[h] = exactMatch.id;
                        }
                    });
                    setHeaderMapping(autoMap);

                    const phoneMatch = availableColumns.find(c => {
                        const low = c.label.toLowerCase();
                        return low.includes("phone") || low.includes("mobile") || low.includes("contact");
                    });
                    const emailMatch = availableColumns.find(c => c.label.toLowerCase().includes("email"));
                    
                    if (phoneMatch) {
                        setMatchColumnId(phoneMatch.id);
                        console.log("Auto-selected Key Column (Phone):", phoneMatch.label);
                    } else if (emailMatch) {
                        setMatchColumnId(emailMatch.id);
                        console.log("Auto-selected Key Column (Email):", emailMatch.label);
                    }

                    setStep(2);
                } else {
                    // One last try: maybe it's a CSV that needs raw parsing or has only 1 row (headers only)
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const range = XLSX.utils.decode_range(ws['!ref'] || "A1");
                    if (range.e.r === 0) {
                        toast.error("This file only contains headers. Please add at least one row of data.");
                    } else {
                        toast.error("Could not find any data rows in this file. Please check the Excel formatting.");
                    }
                    console.error("No data found in any sheet. Range:", ws['!ref']);
                }
            } catch (err: any) {
                console.error("Excel Parsing Error:", err);
                toast.error("Error reading file: " + (err.message || "Unknown error"));
            } finally {
                if (e.target) e.target.value = "";
            }
        };
        
        reader.onerror = (err) => {
            console.error("FileReader Error:", err);
            toast.error("Failed to read file");
        };

        // Use readAsArrayBuffer for better binary support, but readAsBinaryString as fallback
        if (typeof reader.readAsArrayBuffer === 'function') {
            reader.readAsArrayBuffer(selectedFile);
        } else {
            (reader as any).readAsBinaryString(selectedFile);
        }
    };

    const handleMapChange = (excelHeader: string, dbColId: string) => {
        setHeaderMapping(prev => ({
            ...prev,
            [excelHeader]: dbColId
        }));
    };

    const handleConfirm = async () => {
        // Find if match column is internal
        const matchColDef = availableColumns.find(c => c.id === matchColumnId);
        const isInternalMatch = matchColDef?.isInternal ?? false;

        let matchExcelHeader = "";
        if (importMode === 'update' || importMode === 'upsert') {
            if (!matchColumnId) {
                return toast.error("Please select a Key Column to match records (e.g., Phone Number)");
            }
            matchExcelHeader = Object.keys(headerMapping).find(h => headerMapping[h] === matchColumnId) || "";
            if (!matchExcelHeader) {
                return toast.error("You must map an Excel column to your selected Key Column!");
            }
        }

        // Flatten mappings for API
        const updateColumnMap: Record<string, { id: string; isInternal: boolean }> = {};
        Object.entries(headerMapping).forEach(([excelH, dbColId]) => {
            if (!dbColId || dbColId === "SKIP") return;
            const colDef = availableColumns.find(c => c.id === dbColId);
            if (colDef) {
                updateColumnMap[excelH] = { id: dbColId, isInternal: colDef.isInternal };
            }
        });

        if (Object.keys(updateColumnMap).length === 0) {
            return toast.error("Please map at least one column to update");
        }

        setStep(3);
        setLoading(true);
        setImportErrors([]);
        setSuccessCount(0);
        setProgress({ total: parsedData.length, current: 0 });

        const CHUNK_SIZE = 500;
        let localSuccessCount = 0;
        let localCreatedCount = 0;
        let localUpdatedCount = 0;
        const allErrors: string[] = [];

        try {
            for (let i = 0; i < parsedData.length; i += CHUNK_SIZE) {
                const chunk = parsedData.slice(i, i + CHUNK_SIZE);
                console.log(`Sending chunk ${Math.floor(i / CHUNK_SIZE) + 1} (${chunk.length} rows)...`);
                
                // Normalize dates to prevent timezone shifting
                const normalizedChunk = chunk.map(row => {
                    const newRow = { ...row };
                    for (const excelH in updateColumnMap) {
                        const mapping = updateColumnMap[excelH];
                        if (!mapping) continue;
                        const colDef = availableColumns.find(c => c.id === mapping.id);
                        if (colDef?.type === 'date' && newRow[excelH]) {
                            const d = new Date(newRow[excelH]);
                            if (!isNaN(d.getTime())) {
                                // If it's a date, normalize it to UTC midnight of the day it represents in the user's local time
                                // This prevents shifting when sent to the server.
                                const utcDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                                newRow[excelH] = utcDate.toISOString();
                            }
                        }
                    }
                    return newRow;
                });

                const res = await fetch(`/api/crm/forms/${formId}/responses/bulk-import`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        data: normalizedChunk,
                        matchColumnId,
                        matchExcelHeader,
                        updateColumnMap,
                        isInternalMatch,
                        importMode,
                        disableActivityLogs
                    })
                });

                const result = await res.json();
                if (res.ok && result.success) {
                    localSuccessCount += result.successCount;
                    localCreatedCount += (result.createdCount || 0);
                    localUpdatedCount += (result.updatedCount || 0);
                    if (result.errors) allErrors.push(...result.errors);
                    
                    setSuccessCount(localSuccessCount);
                    setProgress(prev => ({ ...prev, current: Math.min(prev.total, i + CHUNK_SIZE) }));
                } else {
                    const errorMsg = result.error || "Failed to process a chunk";
                    allErrors.push(`Block starting at row ${i + 1}: ${errorMsg}`);
                    // We continue for other chunks or break? Let's break if it's a critical error
                    if (res.status === 401 || res.status === 403) {
                        toast.error(errorMsg);
                        setStep(2);
                        return;
                    }
                }
            }

            toast.success(`Completed! Processed ${localSuccessCount} records.`);
            if (allErrors.length > 0) {
                setImportErrors(allErrors);
                setStep(4);
            } else {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error("Bulk Import Network Error:", error);
            toast.error("Network error during update. Check console.");
            setStep(2);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 shrink-0 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black flex items-center gap-2">
                            <UploadCloud size={20} /> Smart Bulk Update
                        </h3>
                        <p className="text-blue-100 text-[11px] mt-1 font-bold uppercase tracking-widest">
                            Upload Excel • Match Columns • Safe Update
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {step === 1 && (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-5 border-4 border-blue-100">
                                <UploadCloud size={32} />
                            </div>
                            <h4 className="text-lg font-black text-slate-800 mb-2">Upload Excel File (.xlsx, .csv)</h4>
                            <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
                                Upload a file containing the records you want to update. Ensure you have a unique column like Phone or Email to match existing records.
                            </p>

                            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2">
                                <UploadCloud size={18} />
                                Choose File
                                <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} />
                            </label>

                            <div className="mt-8 bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 max-w-md">
                                <span className="font-bold flex items-center gap-1 mb-1"><AlertCircle size={14} /> Important:</span>
                                Only existing records will be updated. Records that do not match the selected Key Column will be skipped.
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                                <h4 className="text-sm font-black text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                                    Import Strategy
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setImportMode('update')}
                                        className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3 ${importMode === 'update'
                                            ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-50'
                                            : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${importMode === 'update' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                            <RefreshCw size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800">Only Update</p>
                                            <p className="text-[10px] text-slate-500 font-bold">Update existing records only</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setImportMode('upsert')}
                                        className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3 ${importMode === 'upsert'
                                            ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-50'
                                            : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${importMode === 'upsert' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                            <Sparkles size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800">Smart Sync</p>
                                            <p className="text-[10px] text-slate-500 font-bold">Update existing & Create new</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setImportMode('create')}
                                        className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3 ${importMode === 'create'
                                            ? 'border-slate-300 bg-slate-50 ring-4 ring-slate-100'
                                            : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${importMode === 'create' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                            <UploadCloud size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800">Fresh Upload</p>
                                            <p className="text-[10px] text-slate-500 font-bold">Create new rows for everything</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {(importMode === 'update' || importMode === 'upsert') && (
                                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                                    <h4 className="text-sm font-black text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
                                        Select Key Column (To Match Records)
                                    </h4>
                                    <div className="flex items-center gap-4">
                                        <p className="text-xs text-slate-500 flex-1">
                                            Which column in the database should we use to match the rows? (Usually Phone or Email). Records without a match will be {importMode === 'upsert' ? 'created' : 'skipped'}.
                                        </p>
                                        <select
                                            value={matchColumnId}
                                            onChange={(e) => setMatchColumnId(e.target.value)}
                                            className="w-1/2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">-- Select Unique Field --</option>
                                            {availableColumns.map(c => (
                                                <option key={c.id} value={c.id}>{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                                <h4 className="text-sm font-black text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">{(importMode === 'update' || importMode === 'upsert') ? '3' : '2'}</span>
                                    Map Excel Columns to Database Columns
                                </h4>

                                <div className="space-y-3">
                                    {headers.map(h => (
                                        <div key={h} className="flex items-center gap-4 p-2 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="w-1/3 text-xs font-bold text-slate-700 truncate px-2">
                                                {h} <span className="text-[10px] text-slate-400 font-normal ml-1">(Excel)</span>
                                            </div>
                                            <div className="text-slate-400">→</div>
                                            <select
                                                value={headerMapping[h] || "SKIP"}
                                                onChange={(e) => handleMapChange(h, e.target.value)}
                                                className={`flex-1 p-2 bg-white border rounded-lg text-xs font-bold outline-none ${headerMapping[h] && headerMapping[h] !== "SKIP"
                                                    ? (headerMapping[h] === matchColumnId ? 'border-blue-500 text-blue-700 bg-blue-50 ring-2 ring-blue-100' : 'border-emerald-200 text-emerald-700 bg-emerald-50')
                                                    : 'border-slate-200 text-slate-500'
                                                    }`}
                                            >
                                                <option value="SKIP">-- Do Not Update (Skip) --</option>
                                                {availableColumns.map(c => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.label} {c.id === matchColumnId ? " (⭐ Key Column)" : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}

                                    {importMode === 'update' && matchColumnId && !Object.values(headerMapping).includes(matchColumnId) && (
                                        <div className="mt-4 bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 animate-pulse">
                                            <AlertCircle className="text-rose-500 shrink-0" size={20} />
                                            <div>
                                                <p className="text-xs font-black text-rose-700 uppercase tracking-widest">Key Column Missing Mapping</p>
                                                <p className="text-[10px] text-rose-600 font-bold mt-1">Please map one of your Excel columns to <b>{availableColumns.find(c => c.id === matchColumnId)?.label}</b> to enable history matching.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800">Fast Upload Mode</p>
                                        <p className="text-[10px] text-slate-500 font-bold italic">Bypass activity logging for faster processing of large sets</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDisableActivityLogs(!disableActivityLogs)}
                                    className={`w-14 h-8 rounded-full relative transition-all duration-300 ${disableActivityLogs ? 'bg-emerald-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${disableActivityLogs ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">{importMode === 'update' ? '4' : '3'}</span>
                                        Data Preview ({parsedData.length} records)
                                    </h4>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                        You can delete rows before confirming
                                    </p>
                                </div>
                                <div className="overflow-x-auto max-h-[400px]">
                                    <table className="w-full min-w-max text-left border-separate border-spacing-0">
                                        <thead className="sticky top-0 z-10">
                                            <tr className="bg-slate-50">
                                                <th className="p-3 border-b border-r border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">#</th>
                                                <th className="p-3 border-b border-r border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">Action</th>
                                                {headers.map(h => (
                                                    <th key={h} className="p-3 border-b border-r border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider min-w-[120px]">
                                                        {h}
                                                        <div className={`text-[9px] mt-0.5 px-1.5 py-0.5 rounded inline-block ${headerMapping[h] && headerMapping[h] !== "SKIP" ? 'bg-indigo-100 text-indigo-700 font-black' : 'bg-slate-200 text-slate-500 font-bold'}`}>
                                                            {headerMapping[h] && headerMapping[h] !== "SKIP"
                                                                ? availableColumns.find(c => c.id === headerMapping[h])?.label
                                                                : "Skipped"}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedData.slice(0, 500).map((row, i) => (
                                                <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                                                    <td className="p-3 border-b border-r border-slate-100 text-[10px] font-bold text-slate-400 text-center">
                                                        {i + 1}
                                                    </td>
                                                    <td className="p-3 border-b border-r border-slate-100 text-center">
                                                        <button
                                                            onClick={() => {
                                                                const newData = [...parsedData];
                                                                newData.splice(i, 1);
                                                                setParsedData(newData);
                                                                toast.success("Row removed from import", { id: 'row-del' });
                                                            }}
                                                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                            title="Remove row from this import"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                    {headers.map(h => (
                                                        <td key={h} className={`p-3 border-b border-r border-slate-100 text-xs ${headerMapping[h] && headerMapping[h] !== "SKIP" ? 'font-black text-slate-800' : 'text-slate-400 italic'
                                                            }`}>
                                                            {row[h]?.toString().substring(0, 50) || "—"}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                            {parsedData.length > 500 && (
                                                <tr>
                                                    <td colSpan={headers.length + 2} className="p-4 text-center bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                        And {parsedData.length - 500} more rows will be matched and processed...
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6" />
                            <h4 className="text-lg font-black text-slate-800">Processing Chunks...</h4>
                            <p className="text-sm text-slate-500 mt-2 mb-8">Uploaded {progress.current} of {progress.total} rows. Do not close this browser.</p>
                            
                            {/* Progress bar */}
                            <div className="w-full max-w-sm h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <motion.div 
                                    className="h-full bg-indigo-600"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                                />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase mt-3 tracking-widest">
                                {Math.round((progress.current / progress.total) * 100)}% Synchronized
                            </p>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="bg-white border border-rose-200 p-6 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-rose-100">
                                    <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-rose-600">Action Required: Data Missmatch</h4>
                                        <p className="text-sm text-slate-500 font-bold mt-1">
                                            {successCount} rows updated successfully • {importErrors.length} rows failed mapping.
                                        </p>
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                    {importErrors.map((err, idx) => (
                                        <div key={idx} className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 font-mono tracking-tight leading-relaxed">
                                            {err}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                {step === 2 && (
                    <div className="p-4 border-t border-slate-100 bg-white flex justify-between shrink-0">
                        <button
                            onClick={() => { setStep(1); setFile(null); setParsedData([]); }}
                            className="px-5 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
                        >
                            Cancel & Restart
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={loading || ((importMode === 'update' || importMode === 'upsert') && !matchColumnId) || Object.values(headerMapping).filter(v => v && v !== "SKIP").length === 0}
                            className={`px-6 py-2.5 ${importMode === 'upsert' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-2`}
                        >
                            <CheckCircle2 size={16} /> {importMode === 'update' ? 'Confirm & Update' : (importMode === 'upsert' ? 'Confirm & Sync' : 'Confirm & Upload')} ({parsedData.length} records)
                        </button>
                    </div>
                )}

                {step === 4 && (
                    <div className="p-4 border-t border-slate-100 bg-white flex justify-end shrink-0">
                        <button
                            onClick={() => {
                                onSuccess();
                                onClose();
                            }}
                            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-2"
                        >
                            <CheckCircle2 size={16} /> Finish & Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

