"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import { Briefcase, Users, Edit3 } from "lucide-react";

type TabType = "license" | "swiggy" | "zomato" | "combo" | "photo" | "account" | "other";

const ClientSelect = dynamic(() => import("./ClientSelect"), { ssr: false });

type TeamMember = {
  id: string;
  email: string;
  name?: string;
};

const TASK_CATEGORIES = [
  { label: "🍽️ Zomato Onboarding", value: "zomato" },
  { label: "🍔 Swiggy Onboarding", value: "swiggy" },
  { label: "🍽️🍔 Zomato + Swiggy Combo", value: "combo" },
  { label: "🧾 Food License", value: "license" },
  { label: "📸 Photo Upload", value: "photo" },
  { label: "📂 Account Handling", value: "account" },
  { label: "🛠️ Other", value: "other" },
];

interface Props {
  title: string;
  assigneeId: string;
  activeTab: TabType | "";
  setTitle: (val: string) => void;
  setAssigneeId: (val: string) => void;
  setActiveTab: (val: TabType | "") => void;
}

export default function BasicInfoStep({
  assigneeId,
  activeTab,
  title,
  setTitle,
  setAssigneeId,
  setActiveTab,
}: Props) {
  const { getToken } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/team-members", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch team members");

        const data = await res.json();
        setTeamMembers(data);
      } catch (err) {
        console.error("Failed to load team members", err);
      }
    };

    fetchTeamMembers();
  }, [getToken]);

  const memberOptions = teamMembers.map((member) => ({
    value: member.id,
    label: `${member.name || member.email} (${member.email})`,
  }));

  const isCustom = activeTab === "other";
  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-sm font-medium text-slate-700 placeholder:text-slate-400";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🚀 Section: Service Configuration */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <Briefcase size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 tracking-tight">Service Selection</h3>
            <p className="text-xs text-slate-400 font-medium">Choose the core onboarding service</p>
          </div>
        </div>

        <div className="bg-slate-50/30 p-6 rounded-[2rem] border border-slate-100 space-y-4">
          <div>
            <label className={labelClass}>📂 Service Type</label>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabType | "")}
              className={inputClass}
              required
            >
              <option value="">Select Service Type...</option>
              {TASK_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {isCustom && (
            <div className="animate-in zoom-in-95 duration-300">
              <label className={labelClass}>✍️ Custom Title</label>
              <div className="relative group">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your custom task title..."
                  className={inputClass}
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500">
                  <Edit3 size={16} />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 👥 Section: Ownership */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 tracking-tight">Assignment</h3>
            <p className="text-xs text-slate-400 font-medium">Who will handle this onboarding?</p>
          </div>
        </div>

        <div className="bg-emerald-50/20 p-6 rounded-[2rem] border border-emerald-100/50">
          <label className={labelClass}>👤 Assigned Team Member</label>
          <ClientSelect
            value={assigneeId}
            onChange={setAssigneeId}
            options={memberOptions}
          />
        </div>
      </section>
    </div>
  );
}