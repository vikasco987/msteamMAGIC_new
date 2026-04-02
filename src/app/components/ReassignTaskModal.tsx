import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FaTimes, FaSearch, FaUserCircle } from "react-icons/fa";

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface ReassignTaskModalProps {
  taskId: string;
  onClose: () => void;
  onReassign: (taskId: string, assignee: TeamMember) => void;
  title?: string;
}

export default function ReassignTaskModal({ taskId, onClose, onReassign, title = "Reassign Task" }: ReassignTaskModalProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch team members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/team-members");
        if (!res.ok) throw new Error("Failed to fetch members");
        const data = await res.json();
        setTeamMembers(data);
      } catch (err) {
        toast.error("Error fetching team members");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return teamMembers.filter(m => 
      m.name.toLowerCase().includes(term) || 
      m.email.toLowerCase().includes(term)
    );
  }, [teamMembers, searchTerm]);

  const handleSelect = (member: TeamMember) => {
    onReassign(taskId, member);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md relative border border-slate-100 overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
        >
          <FaTimes size={18} />
        </button>

        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
          {title}
        </h2>

        {/* Search Input */}
        <div className="relative mb-6">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            type="text"
            placeholder="Search by name or email..."
            className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-purple-500 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* User List */}
        <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Team...</p>
            </div>
          ) : filteredMembers.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleSelect(member)}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors group text-left w-full border border-transparent hover:border-slate-100"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors overflow-hidden">
                    <img
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate group-hover:text-purple-600 transition-colors">
                      {member.name}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 truncate uppercase tracking-tight">
                      {member.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No users found</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
