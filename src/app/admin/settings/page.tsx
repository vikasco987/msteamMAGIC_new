"use client";

import React from "react";
import Link from "next/link";
import { Settings, Building2, Users } from "lucide-react";

export default function CRMSettingsHub() {
  const settingsModules = [
    {
      title: "Business Details",
      description: "Manage company information, logo, banking details, and core preferences.",
      icon: <Building2 className="text-indigo-500" size={24} />,
      href: "/admin/settings/business",
      color: "bg-indigo-50",
      borderColor: "border-indigo-100",
    },
    {
      title: "Employee Portal Settings",
      description: "Configure visibility, features, and preferences for the employee dashboard.",
      icon: <Users className="text-emerald-500" size={24} />,
      href: "/admin/settings/employee-portal",
      color: "bg-emerald-50",
      borderColor: "border-emerald-100",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
          <Settings size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">CRM Settings</h1>
          <p className="text-sm font-bold text-slate-400 mt-1">Centralized configuration hub for your enterprise</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsModules.map((module, idx) => (
          <Link href={module.href} key={idx} className="block group">
            <div className={`p-6 rounded-3xl border ${module.borderColor} bg-white shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full`}>
              <div className={`w-12 h-12 rounded-2xl ${module.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {module.icon}
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">{module.title}</h3>
              <p className="text-sm font-medium text-slate-500">{module.description}</p>
              
              <div className="mt-6 flex items-center text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">
                Configure module &rarr;
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
