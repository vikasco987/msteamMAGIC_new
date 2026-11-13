"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from "@/lib/useUnifiedAuth";
import {
  Briefcase,
  Users,
  Edit3,
  Mic,
  Check,
  Search,
  X,
  Shuffle,
  Layers,
  UserCheck,
  ChevronDown,
  Info,
  AlertCircle,
} from "lucide-react";

export type TabType =
  | "license"
  | "swiggy"
  | "zomato"
  | "toing"
  | "ownly"
  | "combo"
  | "photo"
  | "account"
  | "other"
  | "printer"
  | "printer_software"
  | "rto_printer"
  | "escalation";

export type AssignmentMode = "SAME_ALL" | "SEPARATE" | "DISTRIBUTE";

export type TeamMember = {
  id: string;
  email: string;
  name?: string;
};

export const TASK_CATEGORIES: { label: string; value: TabType }[] = [
  { label: "🍽️ Zomato Onboarding", value: "zomato" },
  { label: "🍔 Swiggy Onboarding", value: "swiggy" },
  { label: "🛵 Toing Onboarding", value: "toing" },
  { label: "🛍️ Ownly Onboarding", value: "ownly" },
  { label: "🧾 Food License", value: "license" },
  { label: "📸 Photo Upload", value: "photo" },
  { label: "📂 Account Handling", value: "account" },
  { label: "🖨️ Printer Setup", value: "printer" },
  { label: "🖨️💻 Printer + Software", value: "printer_software" },
  { label: "🔄 RTO Printer", value: "rto_printer" },
  { label: "⚠️ Escalation", value: "escalation" },
  { label: "🛠️ Other", value: "other" },
];

export interface TaskAssignmentConfig {
  service: TabType;
  title: string;
  assigneeIds: string[];
  primaryAssigneeId: string;
}

interface Props {
  // Legacy single props maintained for complete backwards compatibility
  title: string;
  assigneeId: string;
  activeTab: TabType | "";
  initialNote: string;
  supportGroupUrl: string;
  setTitle: (val: string) => void;
  setAssigneeId: (val: string) => void;
  setInitialNote: (val: string) => void;
  setSupportGroupUrl: (val: string) => void;
  setActiveTab: (val: TabType | "") => void;
  accountType: string;
  setAccountType: (val: string) => void;

  // Multi-service & Multi-staff extensions
  selectedServices: TabType[];
  setSelectedServices: (services: TabType[]) => void;
  selectedStaffIds: string[];
  setSelectedStaffIds: (staffIds: string[]) => void;
  assignmentMode: AssignmentMode;
  setAssignmentMode: (mode: AssignmentMode) => void;
  perTaskAssignments: Record<string, string[]>;
  setPerTaskAssignments: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  customServiceTitles: Record<string, string>;
  setCustomServiceTitles: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function BasicInfoStep({
  title,
  assigneeId,
  activeTab,
  initialNote,
  supportGroupUrl,
  setTitle,
  setAssigneeId,
  setInitialNote,
  setSupportGroupUrl,
  setActiveTab,
  accountType,
  setAccountType,
  selectedServices,
  setSelectedServices,
  selectedStaffIds,
  setSelectedStaffIds,
  assignmentMode,
  setAssignmentMode,
  perTaskAssignments,
  setPerTaskAssignments,
  customServiceTitles,
  setCustomServiceTitles,
}: Props) {
  const { getToken } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  const staffDropdownRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        serviceDropdownRef.current &&
        !serviceDropdownRef.current.contains(event.target as Node)
      ) {
        setIsServiceDropdownOpen(false);
      }
      if (
        staffDropdownRef.current &&
        !staffDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStaffDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/team-members", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) throw new Error("Failed to fetch team members");

        const data = await res.json();
        if (Array.isArray(data)) {
          setTeamMembers(data);
        }
      } catch (err) {
        console.error("Failed to load team members", err);
      }
    };

    fetchTeamMembers();
  }, [getToken]);

  // Voice note typing support
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Microphone is not supported in this browser.");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = true;
      recognition.continuous = true;

      const initialText = initialNote.trim();

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        let fullFinal = "";
        let fullInterim = "";

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) fullFinal += event.results[i][0].transcript;
          else fullInterim += event.results[i][0].transcript;
        }

        const currentTranscript = (fullFinal + fullInterim).trim();
        const separator = initialText && currentTranscript ? " " : "";
        setInitialNote(initialText + separator + currentTranscript);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error("Speech recognition error:", error);
      setIsListening(false);
    }
  };

  // Filtered services based on search
  const filteredServices = useMemo(() => {
    if (!serviceSearch.trim()) return TASK_CATEGORIES;
    return TASK_CATEGORIES.filter((c) =>
      c.label.toLowerCase().includes(serviceSearch.toLowerCase())
    );
  }, [serviceSearch]);

  // Filtered staff based on search
  const filteredStaff = useMemo(() => {
    if (!staffSearch.trim()) return teamMembers;
    const q = staffSearch.toLowerCase();
    return teamMembers.filter(
      (m) =>
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q))
    );
  }, [teamMembers, staffSearch]);

  // Quick lookup maps
  const teamMemberMap = useMemo(() => {
    const map = new Map<string, TeamMember>();
    teamMembers.forEach((m) => map.set(m.id, m));
    return map;
  }, [teamMembers]);

  const serviceCategoryMap = useMemo(() => {
    const map = new Map<TabType, string>();
    TASK_CATEGORIES.forEach((c) => map.set(c.value, c.label));
    return map;
  }, []);

  // Toggle single service
  const toggleService = (srv: TabType) => {
    let next: TabType[];
    if (selectedServices.includes(srv)) {
      next = selectedServices.filter((s) => s !== srv);
    } else {
      next = [...selectedServices, srv];
    }
    setSelectedServices(next);

    // Sync legacy single activeTab & title for backward compatibility
    if (next.length > 0) {
      const primarySrv = next[0];
      setActiveTab(primarySrv);
      if (primarySrv !== "other" && primarySrv !== "escalation") {
        setTitle(serviceCategoryMap.get(primarySrv) || "");
      }
    } else {
      setActiveTab("");
      setTitle("");
    }
  };

  // Toggle single staff
  const toggleStaff = (id: string) => {
    let next: string[];
    if (selectedStaffIds.includes(id)) {
      next = selectedStaffIds.filter((s) => s !== id);
    } else {
      next = [...selectedStaffIds, id];
    }
    setSelectedStaffIds(next);

    // Sync legacy single assigneeId
    if (next.length > 0) {
      setAssigneeId(next[0]);
    } else {
      setAssigneeId("");
    }
  };

  // Select all staff
  const handleSelectAllStaff = () => {
    const allIds = teamMembers.map((m) => m.id);
    setSelectedStaffIds(allIds);
    if (allIds.length > 0) setAssigneeId(allIds[0]);
  };

  // Clear all staff
  const handleClearAllStaff = () => {
    setSelectedStaffIds([]);
    setAssigneeId("");
  };

  // Auto-distribute Round-Robin logic
  useEffect(() => {
    if (assignmentMode === "DISTRIBUTE") {
      if (selectedServices.length === 0 || selectedStaffIds.length === 0) return;

      const nextPerTask: Record<string, string[]> = {};
      selectedServices.forEach((srv, index) => {
        // Round robin pick
        const assignedStaffId = selectedStaffIds[index % selectedStaffIds.length];
        nextPerTask[srv] = [assignedStaffId];
      });
      setPerTaskAssignments(nextPerTask);
    }
  }, [assignmentMode, selectedServices, selectedStaffIds, setPerTaskAssignments]);

  // Handlers for individual per-task assignment in SEPARATE or DISTRIBUTE mode
  const toggleStaffForSingleTask = (service: TabType, staffId: string) => {
    setPerTaskAssignments((prev) => {
      const current = prev[service] || [];
      const updated = current.includes(staffId)
        ? current.filter((id) => id !== staffId)
        : [...current, staffId];
      return { ...prev, [service]: updated };
    });
  };

  const inputClass =
    "w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-sm font-medium text-slate-700 placeholder:text-slate-400";
  const labelClass =
    "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🚀 Section 1: Multi-Service Selection */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Briefcase size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <span>Service Selection</span>
                {selectedServices.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-700 border border-indigo-200">
                    {selectedServices.length}{" "}
                    {selectedServices.length === 1 ? "Service" : "Services"} Selected
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Select one or multiple services. Each selected service creates an independent task.
              </p>
            </div>
          </div>

          {selectedServices.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedServices([]);
                setActiveTab("");
                setTitle("");
              }}
              className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Selected Services Removable Chips */}
        {selectedServices.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-3 bg-indigo-50/40 border border-indigo-100 rounded-2xl">
            {selectedServices.map((srv) => (
              <span
                key={srv}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-indigo-200 text-indigo-900 text-xs font-semibold rounded-xl shadow-xs animate-in zoom-in-95 duration-200"
              >
                <span>{serviceCategoryMap.get(srv) || srv}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleService(srv);
                  }}
                  className="hover:bg-indigo-100 rounded-full p-0.5 text-indigo-500 hover:text-indigo-800 transition"
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Searchable Multi-Select Dropdown */}
        <div className="relative" ref={serviceDropdownRef}>
          <label className={labelClass}>📂 Select Services (Checkboxes)</label>
          <div
            onClick={() => setIsServiceDropdownOpen((prev) => !prev)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-indigo-400 transition"
          >
            <span className="text-sm text-slate-600 font-medium">
              {selectedServices.length === 0
                ? "Click to choose services..."
                : `${selectedServices.length} service(s) selected - click to modify`}
            </span>
            <ChevronDown
              size={18}
              className={`text-slate-400 transition-transform duration-200 ${
                isServiceDropdownOpen ? "rotate-180 text-indigo-600" : ""
              }`}
            />
          </div>

          {isServiceDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 p-3 max-h-80 flex flex-col animate-in fade-in zoom-in-95 duration-150">
              {/* Search Box */}
              <div className="relative mb-2">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  placeholder="Search service..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  autoFocus
                />
              </div>

              {/* Service List */}
              <div className="overflow-y-auto space-y-1 divide-y divide-slate-50">
                {filteredServices.map((cat) => {
                  const isChecked = selectedServices.includes(cat.value);
                  return (
                    <label
                      key={cat.value}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs font-medium transition ${
                        isChecked
                          ? "bg-indigo-50/80 text-indigo-900 font-semibold"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleService(cat.value)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <span>{cat.label}</span>
                      </div>
                      {isChecked && <Check size={14} className="text-indigo-600 font-bold" />}
                    </label>
                  );
                })}
                {filteredServices.length === 0 && (
                  <p className="p-4 text-center text-xs text-slate-400">No services found.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic sub-fields for Account or Custom/Escalation if present */}
        {selectedServices.includes("account") && (
          <div className="mt-4 p-4 bg-slate-50/60 rounded-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
            <label className={labelClass}>🏢 Account Plan Type (For Account Handling)</label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className={inputClass}
              required
            >
              <option value="BASIC">Basic</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>
        )}

        {(selectedServices.includes("other") || selectedServices.includes("escalation")) && (
          <div className="mt-4 p-4 bg-slate-50/60 rounded-2xl border border-slate-100 space-y-3 animate-in zoom-in-95 duration-300">
            {selectedServices.includes("escalation") && (
              <div>
                <label className={labelClass}>⚠️ Issue Title (For Escalation Task)</label>
                <input
                  value={customServiceTitles["escalation"] || ""}
                  onChange={(e) =>
                    setCustomServiceTitles((prev) => ({
                      ...prev,
                      escalation: e.target.value,
                    }))
                  }
                  placeholder="Describe the escalation issue..."
                  className={inputClass}
                  required
                />
              </div>
            )}
            {selectedServices.includes("other") && (
              <div>
                <label className={labelClass}>🛠️ Custom Title (For Other Task)</label>
                <input
                  value={customServiceTitles["other"] || ""}
                  onChange={(e) =>
                    setCustomServiceTitles((prev) => ({
                      ...prev,
                      other: e.target.value,
                    }))
                  }
                  placeholder="Enter custom task title..."
                  className={inputClass}
                  required
                />
              </div>
            )}
          </div>
        )}
      </section>

      {/* 👥 Section 2: Multi-Staff Selection */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <span>Team Member Selection</span>
                {selectedStaffIds.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {selectedStaffIds.length}{" "}
                    {selectedStaffIds.length === 1 ? "Staff" : "Staff"} Selected
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Choose eligible staff members who will handle the onboarding tasks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllStaff}
              className="text-xs text-emerald-600 hover:text-emerald-800 font-bold px-2 py-1 rounded-lg hover:bg-emerald-50 transition"
            >
              Select All
            </button>
            {selectedStaffIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllStaff}
                className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Selected Staff Removable Chips */}
        {selectedStaffIds.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-3 bg-emerald-50/40 border border-emerald-100 rounded-2xl">
            {selectedStaffIds.map((id) => {
              const member = teamMemberMap.get(id);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-xl shadow-xs animate-in zoom-in-95 duration-200"
                >
                  <span className="truncate max-w-[150px]">
                    {member?.name || member?.email || id}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStaff(id);
                    }}
                    className="hover:bg-emerald-100 rounded-full p-0.5 text-emerald-600 hover:text-emerald-900 transition"
                  >
                    <X size={13} />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Searchable Multi-Staff Dropdown */}
        <div className="relative" ref={staffDropdownRef}>
          <label className={labelClass}>👤 Select Staff (Checkboxes)</label>
          <div
            onClick={() => setIsStaffDropdownOpen((prev) => !prev)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-emerald-400 transition"
          >
            <span className="text-sm text-slate-600 font-medium">
              {selectedStaffIds.length === 0
                ? "Click to pick staff members..."
                : `${selectedStaffIds.length} staff member(s) selected - click to modify`}
            </span>
            <ChevronDown
              size={18}
              className={`text-slate-400 transition-transform duration-200 ${
                isStaffDropdownOpen ? "rotate-180 text-emerald-600" : ""
              }`}
            />
          </div>

          {isStaffDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 p-3 max-h-80 flex flex-col animate-in fade-in zoom-in-95 duration-150">
              <div className="relative mb-2">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder="Search staff by name or email..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  autoFocus
                />
              </div>

              <div className="overflow-y-auto space-y-1 divide-y divide-slate-50">
                {filteredStaff.map((member) => {
                  const isChecked = selectedStaffIds.includes(member.id);
                  return (
                    <label
                      key={member.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs font-medium transition ${
                        isChecked
                          ? "bg-emerald-50/80 text-emerald-900 font-semibold"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStaff(member.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                        />
                        <div>
                          <p className="font-semibold text-slate-800">{member.name || "Team Member"}</p>
                          <p className="text-[11px] text-slate-400">{member.email}</p>
                        </div>
                      </div>
                      {isChecked && <Check size={14} className="text-emerald-600 font-bold" />}
                    </label>
                  );
                })}
                {filteredStaff.length === 0 && (
                  <p className="p-4 text-center text-xs text-slate-400">No staff found.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ⚙️ Section 3: Task Assignment Modes (When 2+ services selected) */}
      {selectedServices.length > 1 && (
        <section className="bg-gradient-to-r from-purple-50/60 to-indigo-50/60 p-6 rounded-[2rem] border border-purple-100 space-y-5 animate-in zoom-in-95 duration-400">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Assignment Mode for {selectedServices.length} Tasks
              </h3>
              <p className="text-xs text-slate-500">
                Choose how the selected employees will be assigned to each service task.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Mode A */}
            <button
              type="button"
              onClick={() => setAssignmentMode("SAME_ALL")}
              className={`p-4 rounded-2xl border text-left transition-all relative ${
                assignmentMode === "SAME_ALL"
                  ? "bg-white border-purple-500 shadow-md ring-2 ring-purple-400/20"
                  : "bg-white/70 border-slate-200 hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-purple-700 uppercase tracking-wider">
                  Mode A
                </span>
                <UserCheck size={16} className="text-purple-600" />
              </div>
              <p className="text-xs font-bold text-slate-800">Same Staff for All</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                All selected staff will be assigned to every created task.
              </p>
            </button>

            {/* Mode B */}
            <button
              type="button"
              onClick={() => setAssignmentMode("SEPARATE")}
              className={`p-4 rounded-2xl border text-left transition-all relative ${
                assignmentMode === "SEPARATE"
                  ? "bg-white border-purple-500 shadow-md ring-2 ring-purple-400/20"
                  : "bg-white/70 border-slate-200 hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-purple-700 uppercase tracking-wider">
                  Mode B
                </span>
                <Users size={16} className="text-purple-600" />
              </div>
              <p className="text-xs font-bold text-slate-800">Separate per Task</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Select different team members specifically for each task below.
              </p>
            </button>

            {/* Mode C */}
            <button
              type="button"
              onClick={() => setAssignmentMode("DISTRIBUTE")}
              className={`p-4 rounded-2xl border text-left transition-all relative ${
                assignmentMode === "DISTRIBUTE"
                  ? "bg-white border-purple-500 shadow-md ring-2 ring-purple-400/20"
                  : "bg-white/70 border-slate-200 hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-purple-700 uppercase tracking-wider">
                  Mode C
                </span>
                <Shuffle size={16} className="text-purple-600" />
              </div>
              <p className="text-xs font-bold text-slate-800">Auto Distribute</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Round-robin automatic allocation across tasks (with manual change).
              </p>
            </button>
          </div>

          {/* Individual per-task assignment list for Mode B & C */}
          {(assignmentMode === "SEPARATE" || assignmentMode === "DISTRIBUTE") && (
            <div className="mt-4 pt-4 border-t border-purple-200/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                  Individual Task Assignments ({selectedServices.length} Tasks)
                </span>
                <span className="text-[11px] text-purple-600">
                  {assignmentMode === "DISTRIBUTE"
                    ? "Distributed automatically (modify anytime)"
                    : "Pick assignees for each service"}
                </span>
              </div>

              <div className="space-y-2.5">
                {selectedServices.map((srv) => {
                  const assigned = perTaskAssignments[srv] || [];
                  const srvLabel = serviceCategoryMap.get(srv) || srv;

                  return (
                    <div
                      key={srv}
                      className="p-3 bg-white rounded-xl border border-purple-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="min-w-[180px]">
                        <span className="text-xs font-bold text-slate-800">{srvLabel}</span>
                        <p className="text-[10px] text-slate-400">
                          {assigned.length === 0
                            ? "⚠️ No staff assigned"
                            : `${assigned.length} staff assigned`}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {selectedStaffIds.map((staffId) => {
                          const isAssigned = assigned.includes(staffId);
                          const member = teamMemberMap.get(staffId);
                          return (
                            <button
                              key={staffId}
                              type="button"
                              onClick={() => toggleStaffForSingleTask(srv, staffId)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                                isAssigned
                                  ? "bg-purple-600 text-white shadow-xs"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              <span>{member?.name || member?.email || staffId}</span>
                              {isAssigned && <Check size={11} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 📝 Section 4: Notes */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
            <Edit3 size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 tracking-tight">Additional Notes</h3>
            <p className="text-xs text-slate-400 font-medium">
              These notes will be attached to each generated task.
            </p>
          </div>
        </div>

        <div className="bg-amber-50/20 p-6 rounded-[2rem] border border-amber-100/50">
          <div className="flex items-center justify-between mb-1.5 ml-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
              📝 Task Notes (Required)
            </label>
            <button
              type="button"
              onClick={toggleListening}
              className={`p-1.5 rounded-full transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${
                isListening
                  ? "bg-red-100 text-red-600 animate-pulse"
                  : "bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600"
              }`}
              title={isListening ? "Stop Listening" : "Start Voice Typing"}
            >
              <Mic size={14} />
              {isListening ? "Listening..." : "Mic"}
            </button>
          </div>
          <textarea
            value={initialNote}
            onChange={(e) => setInitialNote(e.target.value)}
            placeholder="Please enter task details and requirements here..."
            className={`${inputClass} min-h-[100px] resize-y`}
            required
          />
        </div>
      </section>

      {/* 🔗 Section 5: Support Group */}
      <section>
        <div className="bg-blue-50/20 p-6 rounded-[2rem] border border-blue-100/50">
          <label className={labelClass}>
            🔗 WhatsApp Support Group URL{" "}
            {selectedServices.some((s) => ["printer", "printer_software"].includes(s))
              ? "(Required for Printer)"
              : "(Optional)"}
          </label>
          <input
            type="url"
            value={supportGroupUrl}
            onChange={(e) => setSupportGroupUrl(e.target.value)}
            placeholder="https://chat.whatsapp.com/..."
            className={inputClass}
            required={selectedServices.some((s) => ["printer", "printer_software"].includes(s))}
          />
        </div>
      </section>

      {/* 👁️ Section 6: Dynamic Task Preview Box */}
      {selectedServices.length > 0 && (
        <section className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-xl space-y-3 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-widest text-indigo-400 uppercase flex items-center gap-1.5">
              <Info size={14} />
              Task Generation Preview
            </span>
            <span className="text-xs font-extrabold bg-indigo-600 px-3 py-0.5 rounded-full">
              {selectedServices.length}{" "}
              {selectedServices.length === 1 ? "Independent Task" : "Independent Tasks"}
            </span>
          </div>

          <div className="divide-y divide-slate-800 text-xs">
            {selectedServices.map((srv, idx) => {
              const label =
                srv === "other"
                  ? customServiceTitles["other"] || "Other Service"
                  : srv === "escalation"
                  ? customServiceTitles["escalation"] || "Escalation"
                  : serviceCategoryMap.get(srv) || srv;

              let assignees: string[] = [];
              if (assignmentMode === "SAME_ALL") {
                assignees = selectedStaffIds;
              } else {
                assignees = perTaskAssignments[srv] || [];
              }

              const assigneeNames = assignees
                .map((id) => teamMemberMap.get(id)?.name || id)
                .join(", ");

              return (
                <div key={srv} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-400">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-100">{label}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 text-[11px]">Assigned to: </span>
                    <span className="font-medium text-emerald-400">
                      {assigneeNames || (
                        <span className="text-amber-400 flex items-center gap-1 inline-flex">
                          <AlertCircle size={12} /> Unassigned
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
