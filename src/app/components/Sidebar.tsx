"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  ClipboardList,
  ClipboardCheck,
  Building2,
  LineChart,
  ShoppingCart,
  FileSpreadsheet,
  CalendarCheck,
  UserSquare2,
  History,
  HandCoins,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Settings,
  ShieldCheck,
  Compass,
  Zap,
  Briefcase,
  Calendar,
  PhoneCall,
  Activity,
  Database,
  Clock,
  CreditCard,
  MapPin,
  DollarSign
} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, SignOutButton } from '@clerk/nextjs';
import NotificationBell from './NotificationBell';

// --- NAVIGATION GROUPS ---
const NAVIGATION_GROUPS = [
  {
    title: "Core Fleet",
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/', roles: ['admin', 'master', 'seller', 'tl'] },
      { label: 'My Details', icon: UserSquare2, href: '/my-details', roles: ['admin', 'master', 'seller', 'tl', 'user', 'guest', 'intern', 'manager'] },
      { label: 'Team Board', icon: Users, href: '/team-board', roles: ['admin', 'master', 'seller', 'tl', 'user'] },
      { label: 'Create Task', icon: ClipboardList, href: '/create-task', roles: ['admin', 'master', 'seller', 'tl', 'user'] },
      { label: 'Assigned Task', icon: ClipboardCheck, href: '/report', roles: ['admin', 'master', 'seller', 'tl'] },
    ]
  },
  {
    title: "Intelligence",
    items: [
      { label: 'Recovery Hub', icon: HandCoins, href: '/payments/recovery', roles: ['admin', 'master', 'seller', 'tl'] },
      { label: 'KAM Strategy', icon: Building2, href: '/kam', roles: ['admin', 'master', 'seller', 'tl'] },
      { label: 'Sales Matrix', icon: TrendingUp, href: '/sales-dashboard', roles: ['master'] },
      { label: 'Team Sales', icon: LineChart, href: '/tl-dashboard', roles: ['tl', 'admin', 'master'] },
      { label: 'My Growth', icon: ShoppingCart, href: '/seller/dashboard', roles: ['seller', 'admin', 'master', 'tl'] },
      { label: 'CRM Forms', icon: Briefcase, href: '/crm/forms', roles: ['admin', 'master', 'seller', 'tl', 'user', 'guest', 'intern', 'manager'] },
      { label: 'Lead Terminal', icon: ShieldCheck, href: '/crm/admin/leads', roles: ['admin', 'master', 'tl'] },
      { label: 'Follow-up Board', icon: Calendar, href: '/dashboard/followups', roles: ['admin', 'master', 'seller', 'tl', 'manager'] },
      { label: 'Call Report', icon: PhoneCall, href: '/call-report', roles: ['admin', 'master', 'seller', 'tl'] },
      { label: 'Financial Ecosystem', icon: FileSpreadsheet, href: '/admin/reports/payments', roles: ['admin', 'master', 'tl'] },
      { label: 'Profit & Loss', icon: FileSpreadsheet, href: '/dashboard/profit-loss', roles: ['master'] },
      { label: 'Payment Portal', icon: CreditCard, href: '/payment-portal', roles: ['admin', 'master', 'seller', 'tl', 'user', 'manager', 'intern', 'guest'] },
    ]
  },
  {
    title: "Operations",
    items: [
      { label: 'Attendance', icon: CalendarCheck, href: '/dashboard/attendance', roles: ['admin', 'master', 'seller', 'tl'] },
      { label: 'Tish Control', icon: ShieldCheck, href: '/dashboard/attendance/tish', roles: ['admin', 'master', 'tl'] },
      { label: 'Employee Insights', icon: UserSquare2, href: '/dashboard/attendance/tish?view=analytics', roles: ['admin', 'master', 'tl'] },
      { label: 'Activity Log', icon: History, href: '/activities', roles: ['admin', 'master', 'seller', 'tl', 'user'] },
      { label: 'Daily Payments', icon: HandCoins, href: '/payments-today', roles: ['admin', 'master', 'tl'] },
      { label: 'Lifecycle Report', icon: LineChart, href: '/activities/report', roles: ['admin', 'master', 'tl'] },
      { label: 'Customers', icon: UserSquare2, href: '/customers', roles: ['admin', 'master', 'seller', 'tl'] },
      { label: 'Payroll Management', icon: DollarSign, href: '/admin/payroll', roles: ['admin', 'master'] },
    ]
  },
  {
    title: "Resources",
    items: [
      { label: 'Agreements', icon: FileSpreadsheet, href: '/agreements', roles: ['admin', 'master', 'seller', 'tl'] },
      { label: 'Setup Agreement', icon: FileSpreadsheet, href: '/setup-agreement', roles: ['admin', 'master', 'seller', 'tl'] },
      { label: 'Timeline', icon: LineChart, href: '/timeline', roles: ['admin', 'master', 'seller', 'tl'] },
    ]
  },
  {
    title: "System",
    items: [
      { label: 'Client Locator', icon: MapPin, href: '/dashboard/territory', roles: ['admin', 'master', 'seller'] },
      { label: 'CRM Settings', icon: Settings, href: '/admin/settings', roles: ['master'] },
      { label: 'Business Setup', icon: Building2, href: '/admin/settings/business', roles: ['admin', 'master'] },
      { label: 'Access Control', icon: ShieldCheck, href: '/admin/roles', roles: ['master'] },
      { label: 'Employee Directory', icon: UserSquare2, href: '/admin/employees', roles: ['master'] },
      { label: 'Team Management', icon: Users, href: '/admin/teams', roles: ['master'] },
      { label: 'POS Sign-ups', icon: Users, href: '/admin/pos-signups', roles: ['admin', 'master'] },
      { label: 'DB Backups', icon: Database, href: '/admin/backups', roles: ['master'] },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);
  const roleFromMetadata = user?.publicMetadata?.role as string;
  const userRole = String(isLoaded ? (roleFromMetadata || 'user') : 'user').toLowerCase().trim();

  // --- BRAND IDENTITY ---
  const [businessName, setBusinessName] = useState<string>("MAGICSCALE");
  const [businessLogo, setBusinessLogo] = useState<string | null>(null);

  // --- DYNAMIC PERMISSIONS ---
  const [dynamicPermissions, setDynamicPermissions] = useState<string[] | null>(null);
  const [pinnedForms, setPinnedForms] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/admin/settings/business`)
      .then(res => res.json())
      .then(data => {
        if (data.name) setBusinessName(data.name);
        if (data.logo) setBusinessLogo(data.logo);
      })
      .catch(err => console.error("Sidebar brand identity fetch error:", err));
  }, []);

  useEffect(() => {
    const fetchPinned = () => {
      fetch(`/api/crm/forms/pinned`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setPinnedForms(data);
        })
        .catch(err => console.error("Pinned forms fetch error:", err));
    };

    if (isLoaded && userRole) {
      fetch(`/api/admin/sidebar/per-role?role=${userRole}`)
        .then(res => res.json())
        .then(data => {
          if (data.sidebarItems) setDynamicPermissions(data.sidebarItems);
        })
        .catch(err => console.error("Sidebar permissions fetch error:", err));
      
      fetchPinned();

      // Listen for updates
      window.addEventListener('pinnedFormsUpdated', fetchPinned);
      
      // Auto-poll
      const interval = setInterval(fetchPinned, 30000);

      return () => {
        window.removeEventListener('pinnedFormsUpdated', fetchPinned);
        clearInterval(interval);
      };
    }
  }, [isLoaded, userRole]);

  useEffect(() => {
    setMounted(true);
    // Auto-collapse on smaller screens, expand on large
    const handleResize = () => {
      if (window.innerWidth < 1280) setIsCollapsed(true);
      else setIsCollapsed(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!mounted) return <div className="w-20 lg:w-64 h-screen bg-[#0f172a]" />;

  const renderStylishBrand = (name: string) => {
    const parts = name.trim().split(" ");
    
    // Short name layout
    if (name.length <= 15 || parts.length <= 2) {
      let styledName;
      if (parts.length === 1) {
        const len = name.length;
        if (len <= 4) {
          styledName = <span className="text-white">{name}</span>;
        } else {
          const half = Math.ceil(len / 2);
          styledName = (
            <>
              <span className="text-white">{name.substring(0, half)}</span>
              <span className="text-indigo-400 bg-gradient-to-r from-indigo-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">{name.substring(half)}</span>
            </>
          );
        }
      } else {
        styledName = (
          <>
            <span className="text-white mr-1">{parts[0]}</span>
            <span className="text-indigo-400 bg-gradient-to-r from-indigo-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">{parts.slice(1).join(" ")}</span>
          </>
        );
      }

      return (
        <div className="flex flex-col justify-center min-w-0">
          <span className="text-[15px] sm:text-[17px] font-black leading-tight tracking-tight uppercase break-words">
            {styledName}
          </span>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Enterprise OS</span>
        </div>
      );
    }

    // Long name layout (visual hierarchy)
    const mainTitleWords = parts.slice(0, 2);
    const subtitleWords = parts.slice(2);
    
    const mainTitleFirst = mainTitleWords[0];
    const mainTitleRest = mainTitleWords.slice(1).join(" ");
    
    return (
      <div className="flex flex-col justify-center min-w-0">
        <span className="text-[13px] sm:text-[14px] font-black leading-tight tracking-tight uppercase break-words">
          <span className="text-white mr-1">{mainTitleFirst}</span>
          <span className="text-indigo-400 bg-gradient-to-r from-indigo-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">{mainTitleRest}</span>
        </span>
        <span className="text-[9px] font-extrabold text-indigo-300/80 uppercase tracking-wider truncate mt-0.5" title={subtitleWords.join(" ")}>
          {subtitleWords.join(" ")}
        </span>
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Enterprise OS</span>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Trigger */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="xl:hidden fixed top-5 left-5 z-[100] p-3 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-100"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] xl:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 88 : 280,
          x: isMobileOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1280 ? -300 : 0)
        }}
        className={`fixed xl:sticky top-0 left-0 h-screen bg-[#0f172a] text-slate-300 z-[90] 
          border-r border-slate-800 transition-all duration-300 ease-in-out flex flex-col shadow-2xl overflow-hidden`}
      >
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-full h-32 bg-indigo-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-full h-32 bg-purple-500/10 blur-[100px] pointer-events-none" />

        {/* Brand Header */}
        <div className="p-6 flex items-center justify-between relative z-10">
          <Link href="/" className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 overflow-hidden">
              {businessLogo ? (
                <img src={businessLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Zap className="text-white fill-white" size={20} />
              )}
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col flex-1 min-w-0 justify-center"
              >
                {renderStylishBrand(businessName)}
              </motion.div>
            )}
          </Link>
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors shrink-0 xl:flex hidden"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="absolute -right-3 top-20 w-6 h-6 bg-indigo-600 text-white rounded-full items-center justify-center shadow-lg xl:flex hidden hover:scale-110 transition-transform"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* Multi-tier Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-hide relative z-10">

          {userRole !== 'user' && (
            <div className="space-y-2">
              <NotificationBell isCollapsed={isCollapsed} />
            </div>
          )}

          {pinnedForms.length > 0 && (
            <div className="space-y-2">
              {!isCollapsed && (
                <div className="flex items-center gap-2 px-4 mb-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">
                    Pinned Forms
                  </h3>
                  <div className="flex-1 h-px bg-slate-800/50" />
                </div>
              )}
              {pinnedForms.map((form) => {
                const responseHref = `/crm/forms/${form.id}/responses`;
                const websiteHref = `/crm/website/${form.id}?fullview=true`;
                const isResponseActive = pathname === responseHref;
                const isWebsiteActive = pathname === `/crm/website/${form.id}`; // Match base path for active state
                
                return (
                  <div key={form.id} className="space-y-1">
                    {/* Matrix View (Original) */}
                    <Tooltip.Root delayDuration={0}>
                      <Tooltip.Trigger asChild>
                        <Link
                          href={responseHref}
                          onClick={() => setIsMobileOpen(false)}
                          className={`group flex items-center gap-3 px-4 py-2.5 rounded-[12px] transition-all relative
                            ${isResponseActive
                              ? 'bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30'
                              : 'hover:bg-slate-800/50 hover:text-white text-slate-400'}`}
                        >
                          <FileSpreadsheet size={18} className={`shrink-0 ${isResponseActive ? 'text-indigo-400' : 'group-hover:text-amber-400'}`} />
                          {!isCollapsed && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[13px] font-bold truncate">
                              {form.title} (Matrix)
                            </motion.span>
                          )}
                        </Link>
                      </Tooltip.Trigger>
                      {isCollapsed && (
                        <Tooltip.Portal>
                          <Tooltip.Content side="right" sideOffset={15} className="bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-2xl border border-slate-800 z-[1000] uppercase tracking-widest">
                            {form.title} (Matrix)
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      )}
                    </Tooltip.Root>

                    {/* Website Version (New) */}
                    <Tooltip.Root delayDuration={0}>
                      <Tooltip.Trigger asChild>
                        <Link
                          href={websiteHref}
                          onClick={() => setIsMobileOpen(false)}
                          className={`group flex items-center gap-3 px-4 py-2.5 rounded-[12px] transition-all relative
                            ${isWebsiteActive
                              ? 'bg-purple-600/20 text-purple-400 ring-1 ring-purple-500/30'
                              : 'hover:bg-slate-800/50 hover:text-white text-slate-400'}`}
                        >
                          <Compass size={18} className={`shrink-0 ${isWebsiteActive ? 'text-purple-400' : 'group-hover:text-cyan-400'}`} />
                          {!isCollapsed && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[13px] font-bold truncate">
                              {form.title} (Website)
                            </motion.span>
                          )}
                        </Link>
                      </Tooltip.Trigger>
                      {isCollapsed && (
                        <Tooltip.Portal>
                          <Tooltip.Content side="right" sideOffset={15} className="bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-2xl border border-slate-800 z-[1000] uppercase tracking-widest">
                            {form.title} (Website Version)
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      )}
                    </Tooltip.Root>

                    {/* Today's Leads (New) */}
                    <Tooltip.Root delayDuration={0}>
                      <Tooltip.Trigger asChild>
                        <Link
                          href={`/crm/today-leads/${form.id}?fullview=true`}
                          onClick={() => setIsMobileOpen(false)}
                          className={`group flex items-center gap-3 px-4 py-2.5 rounded-[12px] transition-all relative
                            ${pathname === `/crm/today-leads/${form.id}`
                              ? 'bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-500/30'
                              : 'hover:bg-slate-800/50 hover:text-white text-slate-400'}`}
                        >
                          <Clock size={18} className={`shrink-0 ${pathname === `/crm/today-leads/${form.id}` ? 'text-emerald-400' : 'group-hover:text-emerald-400'}`} />
                          {!isCollapsed && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[13px] font-bold truncate">
                              {form.title} (Today)
                            </motion.span>
                          )}
                        </Link>
                      </Tooltip.Trigger>
                      {isCollapsed && (
                        <Tooltip.Portal>
                          <Tooltip.Content side="right" sideOffset={15} className="bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-2xl border border-slate-800 z-[1000] uppercase tracking-widest">
                            {form.title} (Today's Leads)
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      )}
                    </Tooltip.Root>
                  </div>
                );
              })}
            </div>
          )}

          {NAVIGATION_GROUPS.map((group, gIdx) => {
            // Filter group items by role and dynamic permissions
            const visibleItems = group.items.filter(i => {
              const hasHardcodedRole = i.roles.includes(userRole);

              // If we have dynamic permissions, they override or restrict
              if (dynamicPermissions !== null) {
                // Safety Lock: Master should always see Access Control & Business Setup to avoid locking out
                if (userRole === 'master' && (i.label === 'Access Control' || i.label === 'Business Setup' || i.label === 'Payment Portal' || i.label === 'Profit & Loss')) return true;
                
                // Ensure new routes are not hidden by stale DB permissions
                if (i.label === 'Agreements' || i.label === 'Setup Agreement' || i.label === 'My Details') return hasHardcodedRole;

                return dynamicPermissions.includes(i.label);
              }

              // Fallback to hardcoded roles if no dynamic permissions are fetched yet or they are empty
              return hasHardcodedRole;
            });
            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-2">
                {!isCollapsed && (
                  <h3 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4">
                    {group.title}
                  </h3>
                )}
                {visibleItems.map((item, iIdx) => {
                  const isActive = pathname === item.href;
                  return (
                    <Tooltip.Root key={iIdx} delayDuration={0}>
                      <Tooltip.Trigger asChild>
                        <Link
                          href={item.href}
                          onClick={() => setIsMobileOpen(false)}
                          className={`group flex items-center gap-3 px-4 py-3 rounded-[14px] transition-all relative
                            ${isActive
                              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20'
                              : 'hover:bg-slate-800/50 hover:text-white text-slate-400'}`}
                        >
                          <item.icon size={20} className={`shrink-0 ${isActive ? 'text-white' : 'group-hover:text-indigo-400'}`} />

                          {!isCollapsed && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-sm font-bold truncate"
                            >
                              {item.label}
                            </motion.span>
                          )}

                          {isActive && !isCollapsed && (
                            <motion.div
                              layoutId="activeHighlight"
                              className="absolute right-2 w-1.5 h-1.5 rounded-full bg-indigo-200 shadow-sm"
                            />
                          )}
                        </Link>
                      </Tooltip.Trigger>
                      {isCollapsed && (
                        <Tooltip.Portal>
                          <Tooltip.Content
                            side="right"
                            sideOffset={15}
                            className="bg-slate-900 text-white text-[11px] font-black px-4 py-2 rounded-xl shadow-2xl border border-slate-800 z-[1000] uppercase tracking-widest"
                          >
                            {item.label}
                            <Tooltip.Arrow className="fill-slate-900" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      )}
                    </Tooltip.Root>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User Workspace Profile */}
        <div className="p-4 bg-slate-800/20 border-t border-slate-800/50 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-3 p-2">
            <div className="shrink-0 relative">
              {isLoaded && user && (
                <img src={user.imageUrl} className="w-10 h-10 rounded-[14px] ring-2 ring-slate-800 shadow-lg" alt="Profile" />
              )}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0f172a] rounded-full" />
            </div>

            {!isCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-black text-white truncate">{user?.firstName || 'Innovator'}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{userRole} Workspace</span>
              </motion.div>
            )}

            {!isCollapsed && (
              <SignOutButton>
                <button className="p-2 hover:bg-red-500/10 hover:text-red-400 text-slate-500 rounded-xl transition-all">
                  <LogOut size={16} />
                </button>
              </SignOutButton>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
