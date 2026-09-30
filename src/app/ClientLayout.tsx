"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
  useAuth,
  useClerk,
} from '@clerk/nextjs';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import Sidebar from '../app/components/Sidebar';
import AttendanceTicker from '../app/components/AttendanceTicker';
import { Search, Bell, Command, Sun, Moon, Lock } from 'lucide-react';
import { createContext } from 'react';

export const UnifiedUserContext = createContext<any>(null);

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  
  const [isLocalDisabled, setIsLocalDisabled] = useState(false);
  const [isProfileChecking, setIsProfileChecking] = useState(true);
  const [unifiedUser, setUnifiedUser] = useState<any>(null);
  const [isUnifiedLoading, setIsUnifiedLoading] = useState(true);
  
  const isSharedPage = pathname.startsWith('/shared/');
  const isTrackPage = pathname.startsWith('/dispatch/track');
  const isPublicRoute = isSharedPage || isTrackPage || pathname.startsWith('/api/cashfree/') || pathname.startsWith('/api/razorpay/') || pathname === '/' || pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
  
  const isFullView = searchParams.get('fullview') === 'true' || searchParams.has('edit') || isSharedPage || isTrackPage || pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🛡️ CRM Unified User Check (Clerk OR Custom)
  useEffect(() => {
    const fetchProfile = () => {
      setIsUnifiedLoading(true);
      fetch('/api/user/profile', { cache: 'no-store' })
        .then(res => {
            if (res.ok) return res.json();
            throw new Error("Not authenticated");
        })
        .then(data => {
            if (data.user) {
                setUnifiedUser(data.user);
                // Also check if disabled locally
                const role = String(user?.publicMetadata?.role || data.user.role || '').toLowerCase();
                if (role === 'master') {
                    setIsLocalDisabled(false);
                } else if (data.user?.isDisabled) {
                    setIsLocalDisabled(true);
                } else {
                    setIsLocalDisabled(false);
                }
            } else {
                setUnifiedUser(null);
            }
        })
        .catch(() => {
            setUnifiedUser(null);
        })
        .finally(() => {
            setIsProfileChecking(false);
            setIsUnifiedLoading(false);
        });
    };

    if (userLoaded) {
      fetchProfile();
    }

    // Listen for custom auth events (login/logout) to refresh state without full reload
    window.addEventListener('auth_changed', fetchProfile);
    return () => window.removeEventListener('auth_changed', fetchProfile);
  }, [userLoaded, user]);

  // 🛡️ Global Auth Guard: Redirects instantly when session expires
  useEffect(() => {
    if (authLoaded && userLoaded && mounted && !isUnifiedLoading) {
      // If NOT signed in via Clerk AND NOT signed in via Custom JWT
      if (!isSignedIn && !unifiedUser && !isPublicRoute) {
        router.replace('/sign-in');
      }
    }
  }, [authLoaded, userLoaded, isSignedIn, unifiedUser, isUnifiedLoading, isPublicRoute, router, mounted]);

  if (!mounted) return <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">Initializing Engine...</div>;

  // Block rendering of protected children if session is dead to stop API infinite loops
  const shouldBlockRendering = !isPublicRoute && authLoaded && userLoaded && !isUnifiedLoading && !isSignedIn && !unifiedUser;

  if (shouldBlockRendering || (userLoaded && (isProfileChecking || isUnifiedLoading) && !isPublicRoute)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Session...</p>
        </div>
      </div>
    );
  }

  if (isLocalDisabled) {
    return (
        <div className="h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden w-full">
            <div className="text-center p-12 bg-slate-800/50 backdrop-blur-3xl rounded-[3.5rem] border border-red-500/30 shadow-2xl max-w-md relative z-10 mx-4">
                <div className="w-24 h-24 bg-red-500/20 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-red-500/30">
                    <Lock size={48} />
                </div>
                <h2 className="text-4xl font-black text-white tracking-tight mb-4">Access Denied</h2>
                <p className="text-slate-400 text-base mb-10 leading-relaxed font-medium">
                    Your account has been disabled for this CRM. Please contact your administrator.
                </p>
                <button 
                    onClick={async () => {
                        await fetch('/api/auth/custom/logout', { method: 'POST' });
                        window.dispatchEvent(new Event("auth_changed"));
                        if (isSignedIn) {
                            signOut(() => router.push('/sign-in'));
                        } else {
                            router.push('/sign-in');
                        }
                    }}
                    className="w-full py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-100 transition-all text-xs uppercase tracking-widest"
                >
                    Log Out
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] font-sans antialiased text-slate-900">

      {/* 🚀 Premium Navigation System */}
      {!isFullView && <Sidebar unifiedUser={unifiedUser} />}

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
                {(!isSignedIn && !unifiedUser) && (
                  <div className="flex items-center gap-3">
                    <SignInButton mode="modal">
                      <button className="text-xs font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 transition-colors">Sign In</button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100">Get Started</button>
                    </SignUpButton>
                  </div>
                )}
                
                {(isSignedIn || unifiedUser) && (
                  <div className="flex items-center gap-4">
                    {!isUnifiedLoading && unifiedUser && (
                      <div className="hidden md:flex flex-col text-right">
                        <span className="text-sm font-black text-slate-800 leading-none">Welcome, {unifiedUser.fullName}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Enterprise Plan</span>
                      </div>
                    )}
                    <div className="p-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full shadow-md">
                      <div className="bg-white p-0.5 rounded-full overflow-hidden w-9 h-9 flex items-center justify-center">
                        {isSignedIn ? (
                          <UserButton
                            appearance={{
                              elements: {
                                userButtonAvatarBox: "w-9 h-9 rounded-full",
                                userButtonTrigger: "focus:shadow-none focus:outline-none"
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-indigo-100 flex items-center justify-center cursor-pointer text-indigo-700 font-bold"
                               onClick={async () => {
                                  if (confirm("Log out?")) {
                                      await fetch('/api/auth/custom/logout', { method: 'POST' });
                                      window.dispatchEvent(new Event("auth_changed"));
                                      router.push('/sign-in');
                                  }
                               }}
                          >
                            {unifiedUser?.fullName?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        {/* 🌍 Viewport Scroll Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

          <div className="min-h-full pb-20 relative transition-all duration-500">
            <UnifiedUserContext.Provider value={unifiedUser}>
              {children}
            </UnifiedUserContext.Provider>
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
