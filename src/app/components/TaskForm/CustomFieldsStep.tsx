"use client";

import React from "react";
import FileDropzone from "./FileDropzone";
import { Plus, Trash2, Settings2, Type, AlignLeft } from "lucide-react";

export type CustomField = {
  label: string;
  value: string;
  files: File[];
};

interface Props {
  customFields: CustomField[];
  setCustomFields: (fields: CustomField[]) => void;
}

export default function CustomFieldsStep({ customFields, setCustomFields }: Props) {
  const updateField = (
    index: number,
    key: keyof CustomField,
    value: string | File[]
  ) => {
    const updated = customFields.map((field, i) =>
      i === index ? { ...field, [key]: value } : field
    );
    setCustomFields(updated);
  };

  const addField = () => {
    setCustomFields([...customFields, { label: "", value: "", files: [] }]);
  };

  const removeField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-sm font-medium text-slate-700 placeholder:text-slate-400";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <Settings2 size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 tracking-tight">Additional Metadata</h3>
            <p className="text-xs text-slate-400 font-medium">Capture extra details and files</p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={addField}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
        >
          <Plus size={14} /> Add Field
        </button>
      </div>

      <div className="space-y-6">
        {customFields.length === 0 && (
          <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-200">
              <Plus size={32} />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No custom fields added</p>
            <p className="text-xs text-slate-300 mt-1">Click the button above to add extra fields</p>
          </div>
        )}

        {customFields.map((field, index) => (
          <div
            key={index}
            className="group relative bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)]"
          >
            <button
              type="button"
              onClick={() => removeField(index)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white text-slate-400 hover:text-red-500 rounded-full border border-slate-100 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:scale-90"
              title="Remove Field"
            >
              <Trash2 size={14} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="relative group/field">
                <label className={labelClass}>Field Label</label>
                <div className="relative">
                  <input
                    value={field.label}
                    onChange={(e) => updateField(index, "label", e.target.value)}
                    placeholder="e.g. GST Number, Referral"
                    className={inputClass}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-indigo-500">
                    <Type size={16} />
                  </div>
                </div>
              </div>

              <div className="relative group/field">
                <label className={labelClass}>Field Value</label>
                <div className="relative">
                  <input
                    value={field.value}
                    onChange={(e) => updateField(index, "value", e.target.value)}
                    placeholder="Enter value..."
                    className={inputClass}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-indigo-500">
                    <AlignLeft size={16} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50">
              <label className={labelClass}>Related Attachments</label>
              <FileDropzone
                onDrop={(files) => updateField(index, "files", files)}
                acceptedFiles={field.files}
                label="Drop supporting documents here"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
