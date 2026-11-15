"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { FaTimes, FaSearch, FaUserCheck, FaShieldAlt } from "react-icons/fa";

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface ChangeCreatorModalProps {
  taskId: string;
  currentCreatorName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedTask: any) => void;
}

export default function ChangeCreatorModal({
  taskId,
  currentCreatorName = "Unknown",
  isOpen,
  onClose,
  onSuccess,
}: ChangeCreatorModalProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/team-members");
        if (!res.ok) throw new Error("Failed to fetch members");
        const data = await res.json();
        setTeamMembers(data || []);
      } catch (err) {
        console.error("Error fetching team members:", err);
        toast.error("Failed to load employee list");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [isOpen]);

  const filteredMembers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return teamMembers.filter(
      (m) =>
        m.name?.toLowerCase().includes(term) ||
        m.email?.toLowerCase().includes(term)
    );
  }, [teamMembers, searchTerm]);

  const handleConfirm = async () => {
    if (!selectedMember) {
      toast.error("Please select an employee");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/tasks/${taskId}/creator`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newCreatorId: selectedMember.id,
          newCreatorName: selectedMember.name,
          newCreatorEmail: selectedMember.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update task creator");
      }

      toast.success(`Task Creator updated to ${selectedMember.name}!`);
      onSuccess(data.task);
      onClose();
    } catch (err: any) {
      console.error("Creator update error:", err);
      toast.error(err.message || "Failed to update creator");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[10000] p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md relative border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <FaShieldAlt size={16} />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Change Task Creator
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Current: <span className="font-bold text-slate-800">{currentCreatorName}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative my-4">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              autoFocus
              type="text"
              placeholder="Search employee by name or email..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Employee List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar min-h-[220px] max-h-[340px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="w-7 h-7 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Loading Employees...
                </p>
              </div>
            ) : filteredMembers.length > 0 ? (
              filteredMembers.map((member) => {
                const isSelected = selectedMember?.id === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelectedMember(member)}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all text-left w-full border ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-300 shadow-sm"
                        : "hover:bg-slate-50 border-transparent hover:border-slate-100"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden border-2 shrink-0 ${
                        isSelected ? "border-indigo-600 ring-2 ring-indigo-200" : "border-slate-100"
                      }`}
                    >
                      <img
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-bold truncate ${
                          isSelected ? "text-indigo-900 font-extrabold" : "text-slate-800"
                        }`}
                      >
                        {member.name}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 truncate">
                        {member.email}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[10px] shrink-0">
                        <FaUserCheck size={11} />
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="text-center py-10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  No matching employees
                </p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-black uppercase tracking-wider text-[11px] hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedMember || isSubmitting}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-wider text-[11px] hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100"
            >
              {isSubmitting ? "Updating..." : "Save Creator"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
