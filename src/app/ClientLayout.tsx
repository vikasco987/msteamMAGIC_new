"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from '@clerk/nextjs';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '../app/components/Sidebar';
import AttendanceTicker from '../app/components/AttendanceTicker';
import { Search, Bell, Command, Sun, Moon } from 'lucide-react';

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const isFullView = searchParams.get('fullview') === 'true';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">Initializing Engine...</div>;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] font-sans antialiased text-slate-900">

      {/* 🚀 Premium Navigation System */}
      {!isFullView && <Sidebar />}

      {/* 🛡️ Main Execution Area */}
      <div className="flex flex-col flex-1 overflow-hidden relative">

        {/* 🪄 Smart Global Header */}
        {!isFullView && (
          <header className="h-[72px] flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-slate-200 z-30 sticky top-0">

            <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200 group focus-within:border-indigo-500 transition-all">
                <Search size={16} className="text-slate-400 group-focus-within:text-indigo-600" />
                <input
                  type="text"
                  placeholder="Universal Search..."
                  className="bg-transparent text-sm font-bold outline-none w-64 placeholder:text-slate-400"
                />
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-400">
                  <Command size={10} /> K
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 pr-4 border-r border-slate-200 hidden sm:flex">
                <button className="p-2.5 hover:bg-slate-100 rounded-xl transition-all text-slate-500">
                  <Sun size={18} />
                </button>
                <button className="p-2.5 hover:bg-slate-100 rounded-xl transition-all text-slate-500 relative">
                  <Bell size={18} />
                  <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
                </button>
              </div>

              <div className="flex gap-4 items-center pl-2">
                <SignedOut>
                  <div className="flex items-center gap-3">
                    <SignInButton mode="modal">
                      <button className="text-xs font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 transition-colors">Sign In</button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100">Get Started</button>
                    </SignUpButton>
                  </div>
                </SignedOut>
                <SignedIn>
                  <div className="flex items-center gap-4">
                    {isLoaded && user && (
                      <div className="hidden md:flex flex-col text-right">
                        <span className="text-sm font-black text-slate-800 leading-none">Welcome, {user.firstName}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Enterprise Plan</span>
                      </div>
                    )}
                    <div className="p-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full shadow-md">
                      <div className="bg-white p-0.5 rounded-full">
                        <UserButton
                          appearance={{
                            elements: {
                              userButtonAvatarBox: "w-9 h-9 rounded-full",
                              userButtonTrigger: "focus:shadow-none focus:outline-none"
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </SignedIn>
              </div>
            </div>
          </header>
        )}

        {/* 🌍 Viewport Scroll Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

          <div className="min-h-full pb-20 relative z-10 transition-all duration-500">
            {children}
          </div>
        </main>

        {/* 🚀 Interactive Knowledge Layer */}
        {!isFullView && <AttendanceTicker />}
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">Initializing Engine...</div>}>
      <ClientLayoutContent>{children}</ClientLayoutContent>
    </Suspense>
  );
}
