// components/EditAmountModal.tsx
"use client";

import React, { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  currentAmount: number;
  currentReceived: number;
  onSave: (updatedAmount: number, updatedReceived: number) => void;
}

export default function EditAmountModal({
  isOpen,
  onClose,
  taskId,
  currentAmount,
  currentReceived,
  onSave,
}: Props) {
  const [amount, setAmount] = useState(currentAmount);
  const [received, setReceived] = useState(currentReceived);

  const handleSubmit = () => {
    onSave(amount, received);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-4 w-96">
        <h2 className="text-xl font-bold mb-4">Edit Payment</h2>

        <div className="mb-4">
          <label className="block mb-1">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Received</label>
          <input
            type="number"
            value={received}
            onChange={(e) => setReceived(Number(e.target.value))}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
