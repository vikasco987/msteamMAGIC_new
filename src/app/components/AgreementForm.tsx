"use client";

import { useState } from "react";

export default function AgreementForm() {
  const [formData, setFormData] = useState({
    clientName: "",
    clientAddress: "",
    startDate: "",
    endDate: "",
    fee: "",
    targetSales: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to generate PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${formData.clientName}-agreement.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Error generating PDF. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-md mx-auto p-4 border rounded-md shadow-md">
      <input name="clientName" placeholder="Client Name" onChange={handleChange} value={formData.clientName} required className="w-full px-3 py-2 border rounded" />
      <input name="clientAddress" placeholder="Client Address" onChange={handleChange} value={formData.clientAddress} required className="w-full px-3 py-2 border rounded" />
      <input name="startDate" type="date" onChange={handleChange} value={formData.startDate} required className="w-full px-3 py-2 border rounded" />
      <input name="endDate" type="date" onChange={handleChange} value={formData.endDate} required className="w-full px-3 py-2 border rounded" />
      <input name="fee" placeholder="Fee" onChange={handleChange} value={formData.fee} required className="w-full px-3 py-2 border rounded" />
      <input name="targetSales" placeholder="Target Sales" onChange={handleChange} value={formData.targetSales} className="w-full px-3 py-2 border rounded" />
      <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Generate Agreement</button>
    </form>
  );
}
