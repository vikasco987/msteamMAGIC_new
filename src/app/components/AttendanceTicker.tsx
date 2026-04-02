"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Clock, Zap } from "lucide-react";

export default function AttendanceTicker() {
  const [data, setData] = useState<{ date?: string, early: string[], late: { name: string, latenessStr: string }[] }>({ early: [], late: [] });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchTicker = async () => {
      try {
        const res = await fetch("/api/attendance/ticker");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Ticker fetch error:", err);
      }
    };

    fetchTicker();
    const interval = setInterval(fetchTicker, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  if (!mounted || (data.early.length === 0 && data.late.length === 0)) return null;

  return (
    <div className="absolute bottom-0 left-0 w-full h-10 bg-slate-950/80 backdrop-blur-xl border-t border-white/10 z-[100] overflow-hidden flex items-center">
      
      {/* 🚀 Label: Official Status Monitor */}
      <div className="flex items-center gap-3 px-5 h-full bg-slate-900 border-r border-white/10 relative z-10 shrink-0">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">Presence Monitor</span>
          <span className="text-[7px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">{data.date || "TODAY"} 📅</span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_#6366f1] ml-2" />
      </div>

      {/* 🏎️ Marquee Area */}
      <div className="flex-1 overflow-hidden h-full flex items-center relative pr-4">
        <motion.div 
          animate={{ x: ["100%", "-100%"] }}
          transition={{ 
            duration: 60, // Balanced medium speed for professional feel
            repeat: Infinity,
            ease: "linear"
          }}
          className="flex items-center gap-12 whitespace-nowrap"
        >
          {/* ✅ Early Birds (Positive) */}
          {data.early.length > 0 && (
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2 text-[11px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                <Zap size={10} className="fill-emerald-400 text-emerald-400" /> Early Birds
              </span>
              {data.early.map((name, i) => (
                <span key={`early-${i}`} className="text-[11px] font-bold text-emerald-100 flex items-center gap-1.5 opacity-80 group hover:opacity-100 transition-opacity">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" /> {name}
                </span>
              ))}
            </div>
          )}

          {/* ❌ Late Arrivers (Negative) */}
          {data.late.length > 0 && (
            <div className="flex items-center gap-6 border-l border-white/10 pl-12">
              <span className="flex items-center gap-2 text-[11px] font-black text-rose-500 bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20 shadow-[0_0_15px_-5px_#f43f5e]">
                 <Clock size={10} /> Late Loggers
              </span>
              {data.late.map((user, i) => (
                <span key={`late-${i}`} className="text-[11px] font-black flex items-center gap-3 text-white group drop-shadow-sm">
                   <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" /> 
                   {user.name} 
                   <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-md border border-rose-400/30 uppercase tracking-wider shadow-lg shadow-rose-950/20">
                     {user.latenessStr === "ABSENT" ? "ABSENT" : `${user.latenessStr} Late`}
                   </span>
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* 🔮 Visual Decoration */}
      <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none" />
    </div>
  );
}
