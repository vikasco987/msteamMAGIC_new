"use client";

import { useState } from "react";

export default function AgreementForm() {
  const [formData, setFormData] = useState({
    clientName: "",
    startDate: "",
    endDate: "",
    fee: "",
    targetSales: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/generate-agreement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData.clientName}-agreement.pdf`;
    a.click();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        name="clientName"
        placeholder="Client Name"
        onChange={handleChange}
        required
      />
      <input
        name="startDate"
        type="date"
        onChange={handleChange}
        required
      />
      <input
        name="endDate"
        type="date"
        onChange={handleChange}
        required
      />
      <input
        name="fee"
        placeholder="Fee"
        onChange={handleChange}
        required
      />
      <input
        name="targetSales"
        placeholder="Target Sales"
        onChange={handleChange}
      />
      <button type="submit">Generate Agreement</button>
    </form>
  );
}
