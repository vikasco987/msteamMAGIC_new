"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { Package, Loader2 } from "lucide-react";

interface Props {
  taskId: string;
  hasAwb: boolean;
  isHardwareTask: boolean;
  onSuccess: (awb: string) => void;
}

export default function CreateDelhiveryOrderButton({ taskId, hasAwb, isHardwareTask, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  // Only show for hardware tasks that don't have an AWB yet
  if (hasAwb || !isHardwareTask) return null;

  const handleCreateOrder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (loading) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/dispatch/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create order");
      }
      
      toast.success(`Delhivery Order Created! AWB: ${data.awbNumber}`);
      onSuccess(data.awbNumber);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong while creating order");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCreateOrder}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer outline-none w-full border border-indigo-100 transition-colors mt-2"
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin text-indigo-500" />
      ) : (
        <Package size={14} className="text-indigo-500" />
      )}
      {loading ? "CREATING ORDER..." : "CREATE DELHIVERY ORDER"}
    </button>
  );
}
