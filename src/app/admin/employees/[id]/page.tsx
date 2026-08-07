"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, UserCircle2, Calendar, FileText, Activity, CreditCard, Banknote, History, Wallet, CheckCircle, Clock, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function EmployeeFinancialProfile({ params }: { params: { id: string } }) {
  const { user: currentUser, isLoaded } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  const currentUserRole = String(currentUser?.publicMetadata?.role || 'user').toLowerCase();

  useEffect(() => {
    if (isLoaded && currentUserRole === 'master') {
      fetchData();
    }
  }, [isLoaded, currentUserRole, params.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, attRes, payRes, timeRes] = await Promise.all([
        fetch(`/api/admin/employees/detail/${params.id}`),
        fetch(`/api/admin/employees/detail/${params.id}/attendance`),
        fetch(`/api/admin/employees/detail/${params.id}/payroll`),
        fetch(`/api/admin/employees/detail/${params.id}/timeline`)
      ]);

      const [profileData, attData, payData, timeData] = await Promise.all([
        profileRes.json(),
        attRes.json(),
        payRes.json(),
        timeRes.json()
      ]);

      if (profileRes.ok) setProfile(profileData.profile);
      if (attRes.ok) setAttendance(attData.history || []);
      if (payRes.ok) setPayroll(payData.payrollHistory || []);
      if (timeRes.ok) setTimeline(timeData.timeline || []);

    } catch (error) {
      toast.error("Failed to fetch employee details");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (currentUserRole !== 'master') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-8 bg-slate-50">
        <h1 className="text-4xl font-black text-slate-900 mb-2">ACCESS REJECTED</h1>
        <p className="text-slate-500 max-w-md font-bold">This area is reserved for Master accounts only.</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-8 bg-slate-50">
        <h1 className="text-4xl font-black text-slate-900 mb-2">Employee Not Found</h1>
        <Link href="/admin/employees" className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">Go Back</Link>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <UserCircle2 size={16} /> },
    { id: "attendance", label: "Attendance", icon: <Calendar size={16} /> },
    { id: "payroll", label: "Payroll", icon: <Banknote size={16} /> },
    { id: "timeline", label: "Timeline", icon: <History size={16} /> },
    { id: "ledger", label: "Ledger", icon: <FileText size={16} />, v2: true },
    { id: "advances", label: "Advances", icon: <CreditCard size={16} />, v2: true },
    { id: "incentives", label: "Incentives", icon: <Activity size={16} />, v2: true },
    { id: "expenses", label: "Expenses", icon: <Wallet size={16} />, v2: true },
  ];

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Salary</span>
        <span className="text-3xl font-black text-slate-800">₹{profile.baseSalary?.toLocaleString() || 0}</span>
      </div>
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</span>
        <span className="text-3xl font-black text-slate-800">{profile.employmentStatus || "Active"}</span>
      </div>
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-1 opacity-50">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Advance</span>
        <span className="text-3xl font-black text-slate-800">₹0</span>
        <span className="text-[10px] font-black text-indigo-500 uppercase">Coming in V2</span>
      </div>
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-1 opacity-50">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Incentive</span>
        <span className="text-3xl font-black text-slate-800">₹0</span>
        <span className="text-[10px] font-black text-indigo-500 uppercase">Coming in V2</span>
      </div>

      <div className="col-span-1 md:col-span-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mt-4">
        <h3 className="text-lg font-black text-slate-800 mb-6">Employee Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Department</label>
            <span className="font-bold text-slate-800">{profile.department || "N/A"}</span>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Designation</label>
            <span className="font-bold text-slate-800">{profile.designation || "N/A"}</span>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email</label>
            <span className="font-bold text-slate-800">{profile.email}</span>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Phone</label>
            <span className="font-bold text-slate-800">{profile.phone || "N/A"}</span>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Joining Date</label>
            <span className="font-bold text-slate-800">{profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : "N/A"}</span>
          </div>
          {profile.employmentStatus === "Inactive" && (
            <>
              <div>
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">Last Working Date</label>
                <span className="font-bold text-rose-600">{profile.lastWorkingDate ? new Date(profile.lastWorkingDate).toLocaleDateString() : "N/A"}</span>
              </div>
              <div>
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">Exit Reason</label>
                <span className="font-bold text-rose-600">{profile.exitReason || "N/A"}</span>
              </div>
              <div>
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">Settlement Status</label>
                <span className="font-bold text-rose-600">{profile.finalSettlementStatus || "Pending"}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-800">Attendance History</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {attendance.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold">No attendance records found</div>
        ) : (
          attendance.map((att, i) => (
            <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <span className="block font-black text-slate-800 text-lg mb-1">{att.month}</span>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                  <span className="text-emerald-600">{att.present} Present</span>
                  <span className="text-rose-600">{att.absent} Absent</span>
                  <span className="text-amber-600">{att.halfDay} Half Day</span>
                  <span className="text-indigo-600">{att.paidLeave} Leave</span>
                  <span className="text-slate-400">{att.weeklyOff} Weekly Off</span>
                </div>
              </div>
              <button onClick={() => toast.error("Detailed calendar coming soon in V2")} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all">
                View Calendar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderPayroll = () => (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-800">Payroll History</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Month</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Gross</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Deduction</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net Salary</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Slip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payroll.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400 font-bold">No payroll records found</td>
              </tr>
            ) : (
              payroll.map((pay, i) => {
                const monthName = new Date(pay.date).toLocaleDateString('default', { month: 'long', year: 'numeric' });
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{monthName}</td>
                    <td className="px-6 py-4 font-bold text-slate-600 text-right">₹{pay.amount?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 font-bold text-rose-500 text-right">- ₹0</td>
                    <td className="px-6 py-4 font-black text-emerald-600 text-right">₹{pay.amount?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-md">
                        {pay.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => toast.error("PDF generation coming in V2")} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline">
                        PDF
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTimeline = () => (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-2xl">
      <h3 className="text-lg font-black text-slate-800 mb-8">Activity Timeline</h3>
      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-100">
        {timeline.map((item, i) => (
          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-100 text-indigo-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
              {item.type === 'join' ? <CheckCircle size={16} /> : item.type === 'exit' ? <AlertCircle size={16} /> : <Clock size={16} />}
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-slate-800">{item.title}</h4>
              </div>
              <time className="text-xs font-bold text-slate-400">{new Date(item.date).toLocaleDateString()}</time>
              {item.description && <p className="mt-2 text-sm text-slate-500 font-medium">{item.description}</p>}
            </div>
          </div>
        ))}
        {timeline.length === 0 && (
          <div className="text-slate-400 font-bold ml-12">No activity recorded yet.</div>
        )}
      </div>
    </div>
  );

  const renderV2Tab = (name: string) => (
    <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center">
      <div className="w-20 h-20 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mb-6">
        <Clock size={40} />
      </div>
      <h2 className="text-3xl font-black text-slate-900 mb-2">{name} Module</h2>
      <p className="text-slate-500 font-medium max-w-md">This module is planned for Version 2.0. It will be available in the next major update.</p>
    </div>
  );

  return (
    <div className="container mx-auto px-6 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/employees" className="inline-flex items-center gap-2 text-sm font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest mb-6">
          <ArrowLeft size={16} /> Back to Directory
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-indigo-200">
            {profile.name?.charAt(0).toUpperCase() || "E"}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">{profile.name}</h1>
              {profile.employmentStatus === 'Active' && <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Active</span>}
              {profile.employmentStatus === 'Notice Period' && <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Notice Period</span>}
              {profile.employmentStatus === 'Inactive' && <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Inactive</span>}
              {profile.employmentStatus === 'Suspended' && <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Suspended</span>}
            </div>
            <p className="text-slate-500 font-bold">{profile.designation || "Employee"} • {profile.department || "No Department"}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-fit max-w-full">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
            }`}
          >
            {tab.icon} {tab.label} {tab.v2 && <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-md ml-1">V2</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "attendance" && renderAttendance()}
        {activeTab === "payroll" && renderPayroll()}
        {activeTab === "timeline" && renderTimeline()}
        {tabs.find(t => t.id === activeTab)?.v2 && renderV2Tab(tabs.find(t => t.id === activeTab)?.label || "")}
      </div>
    </div>
  );
}
