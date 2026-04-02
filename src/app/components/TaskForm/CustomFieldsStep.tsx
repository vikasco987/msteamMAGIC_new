"use client";

import React from "react";
import FileDropzone from "./FileDropzone";

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

  return (
    <div className="space-y-6">
      {customFields.map((field, index) => (
        <div
          key={index}
          className="relative border border-gray-200 p-4 rounded-lg bg-gray-50 space-y-3 shadow-sm"
        >
          <button
            type="button"
            onClick={() => removeField(index)}
            className="absolute top-2 right-2 text-sm text-red-500 hover:text-red-700"
            title="Remove Field"
          >
            ✖
          </button>

          <input
            value={field.label}
            onChange={(e) => updateField(index, "label", e.target.value)}
            placeholder="📝 Custom Field Label"
            className="w-full border border-gray-300 p-2 rounded-lg focus:ring-1 focus:ring-purple-300"
          />

          <input
            value={field.value}
            onChange={(e) => updateField(index, "value", e.target.value)}
            placeholder="💬 Custom Field Value"
            className="w-full border border-gray-300 p-2 rounded-lg focus:ring-1 focus:ring-purple-300"
          />

          <FileDropzone
            onDrop={(files) => updateField(index, "files", files)}
            acceptedFiles={field.files}
            label="📁 Drag & drop files here or click to upload"
          />

          {field.files.length > 0 && (
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              {field.files.map((file, i) => (
                <li key={i}>📎 {file.name}</li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addField}
        className="w-full py-2 px-4 bg-purple-100 text-purple-700 border border-purple-300 rounded-lg hover:bg-purple-200 transition-colors duration-200 shadow-sm"
      >
        ➕ Add Custom Field
      </button>
    </div>
  );
}
