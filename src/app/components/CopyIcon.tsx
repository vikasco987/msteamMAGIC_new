// components/CopyIcon.tsx
"use client";

import { ClipboardCopy } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface CopyIconProps {
  amount: number;
  received: number;
  pending: number;
  updatedAt: string;
}

const CopyIcon: React.FC<CopyIconProps> = ({ amount, received, pending, updatedAt }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const now = new Date(updatedAt).toLocaleString("en-IN", {
      dateStyle: "short",
      timeStyle: "short",
    });

    const text = `Amount - ₹${amount}\nReceived - ₹${received}\nPending - ₹${pending}\nUpdated: ${now}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Copied payment info!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <ClipboardCopy
      className="cursor-pointer hover:text-blue-600"
      size={20}
      onClick={handleCopy}
    />
  );
};

export default CopyIcon;
