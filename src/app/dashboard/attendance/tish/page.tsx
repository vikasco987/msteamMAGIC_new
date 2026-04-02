"use client";

import React, { useEffect, useState } from "react";
import AttendanceTable from "../../../components/AttendanceTable";
import {
  Zap,
  Skull,
  TrendingUp,
  AlertCircle,
  Activity,
  BarChart3,
  Clock,
  ShieldAlert
} from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Link from "next/link";

export default function TishPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 space-y-8">
      {/* Header Area */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <ShieldAlert className="text-indigo-600" size={32} />
            Attendance Overview
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-1 opacity-70">Unified Administrative Oversight</p>
        </div>

        <Link
          href="/activities/report"
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-xl hover:bg-black transition-all"
        >
          <Activity size={18} />
          Detailed Lifecycle Trails
        </Link>
      </header>

      {/* Existing Attendance Table Section */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">Attendance Log</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time presence monitoring</p>
          </div>
        </div>
        <div className="p-4">
          <AttendanceTable all={true} />
        </div>
      </div>
    </div>
  );
}
