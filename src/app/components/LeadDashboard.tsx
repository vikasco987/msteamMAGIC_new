"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

export default function LeadDashboard() {
  const [leads, setLeads] = useState<any[]>([]);

  // Read Excel file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      // Add default fields for status & notes
      const processedData = data.map((lead: any) => ({
        ...lead,
        Status: "New",
        Notes: ""
      }));

      setLeads(processedData);
    };
    reader.readAsBinaryString(file);
  };

  // Update status or notes
  const updateLead = (index: number, field: string, value: string) => {
    const updated = [...leads];
    updated[index][field] = value;
    setLeads(updated);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Lead Management</h1>

      {/* File Upload */}
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="mb-4"
      />

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              {leads.length > 0 &&
                Object.keys(leads[0]).map((key) => (
                  <th key={key} className="px-4 py-2 border">
                    {key}
                  </th>
                ))}
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Notes</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, i) => (
              <tr key={i} className="border-b">
                {Object.keys(lead).map((key) =>
                  key !== "Status" && key !== "Notes" ? (
                    <td key={key} className="px-4 py-2 border">
                      {lead[key]}
                    </td>
                  ) : null
                )}
                {/* Status Dropdown */}
                <td className="px-4 py-2 border">
                  <select
                    value={lead.Status}
                    onChange={(e) =>
                      updateLead(i, "Status", e.target.value)
                    }
                    className="border rounded px-2 py-1"
                  >
                    <option>New</option>
                    <option>Contacted</option>
                    <option>Follow-up</option>
                    <option>Interested</option>
                    <option>Not Interested</option>
                    <option>Closed</option>
                  </select>
                </td>
                {/* Notes Input */}
                <td className="px-4 py-2 border">
                  <input
                    type="text"
                    value={lead.Notes}
                    onChange={(e) => updateLead(i, "Notes", e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                    placeholder="Add notes..."
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
