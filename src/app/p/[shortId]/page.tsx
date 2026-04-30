"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RedirectPage() {
  const params = useParams();
  const shortId = params.shortId as string;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performRedirect = async () => {
      try {
        const response = await fetch(`/api/cashfree/redirect-handler?shortId=${shortId}`);
        const data = await response.json();

        if (data.success && data.url) {
          window.location.href = data.url;
        } else {
          setError(data.message || "Link not found or expired.");
        }
      } catch (err) {
        console.error("Redirect failed:", err);
        setError("Failed to resolve link.");
      }
    };

    if (shortId) {
      performRedirect();
    }
  }, [shortId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-black">!</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Invalid Link</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mb-6">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl uppercase tracking-widest text-xs"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-indigo-100 dark:border-indigo-900 rounded-full" />
        <div className="w-24 h-24 border-t-4 border-indigo-600 rounded-full absolute top-0 animate-spin" />
      </div>
      <div className="mt-8 text-center">
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Securing Connection...</h2>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 animate-pulse">Redirecting to Cashfree Node</p>
      </div>
    </div>
  );
}
