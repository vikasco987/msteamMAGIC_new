// src/app/components/CopyTaskDetailsIcon.js or .tsx
"use client";
import React from "react";
import { Copy } from "lucide-react";
import { toast } from "react-hot-toast";

const CopyTaskDetailsIcon = ({ amount, received, pending, updatedAt }) => {
  const handleCopy = () => {
    const text = `Amount: ₹${amount}\nReceived: ₹${received}\nPending: ₹${pending}\nUpdated At: ${new Date(
      updatedAt
    ).toLocaleString()}`;

    navigator.clipboard.writeText(text);
    toast.success("Copied task details!");
  };

  return (
    <button onClick={handleCopy} title="Copy Task Details">
      <Copy size={16} />
    </button>
  );
};

export default CopyTaskDetailsIcon;
