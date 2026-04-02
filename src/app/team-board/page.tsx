"use client";

import dynamic from "next/dynamic";

// 🧠 Dynamically import Board to avoid Hydration and SSR issues with Drag & Drop
const Board = dynamic(() => import("../components/Board"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
});

export default function TeamBoardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Board />
    </div>
  );
}
