"use client";

import React, { useEffect, useState } from "react";
import { FaTimes, FaExpandAlt, FaCompressAlt } from "react-icons/fa";
import TaskDetailsCard from "./TaskDetailsCard";
import { Task } from "../../types/task";

interface TaskModalPopupProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  isTL?: boolean;
  onDelete?: (taskId: string) => void;
  onUpdateTask?: (taskId: string, updatedFields: Partial<Task>) => void;
}

export default function TaskModalPopup({
  task: initialTask,
  isOpen,
  onClose,
  isAdmin = false,
  isTL = false,
  onDelete,
  onUpdateTask,
}: TaskModalPopupProps) {
  const [currentTask, setCurrentTask] = useState<Task>(initialTask);

  useEffect(() => {
    setCurrentTask(initialTask);
  }, [initialTask]);

  // Sync any updates locally
  const handleUpdate = (taskId: string, fields: Partial<Task>) => {
    setCurrentTask((prev) => ({ ...prev, ...fields }));
    if (onUpdateTask) onUpdateTask(taskId, fields);
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Large Square Popup Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Top Header bar with clean close button */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Task Details
            </span>
            {currentTask.taskCode && (
              <span className="px-2 py-0.5 rounded-md text-xs font-black tracking-wider bg-indigo-600 text-white">
                {currentTask.taskCode}
              </span>
            )}
            {currentTask.externalSource && (
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                currentTask.externalSource === "kravy"
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}>
                {currentTask.externalSource === "kravy" ? "KRAVY CRM" : "ONBOARDING CRM"}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-all cursor-pointer"
            title="Close (Esc)"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Scrollable Modal Body containing the full TaskDetailsCard */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">
          <TaskDetailsCard
            task={currentTask}
            isAdmin={isAdmin}
            isTL={isTL}
            onDelete={(id) => {
              if (onDelete) onDelete(id);
              onClose();
            }}
            onUpdateTask={handleUpdate}
          />
        </div>
      </div>
    </div>
  );
}
