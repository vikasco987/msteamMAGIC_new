"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
    Filter, Download, Search, LayoutDashboard, TrendingUp, Users, DollarSign,
    Briefcase, Calendar, ChevronDown, CheckCircle2, AlertCircle, RefreshCw, Crown, Eye, EyeOff, Maximize, Minimize
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];

export default function DepartmentSalesDashboard() {
    const { isLoaded, user } = useUser();
    
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    // Filters
    const [department, setDepartment] = useState('All Departments');
    const [saleType, setSaleType] = useState('All');
    const [paymentStatus, setPaymentStatus] = useState('All');
    const [dateRange, setDateRange] = useState('This Month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [showCards, setShowCards] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [isFullScreen, setIsFullScreen] = useState(false);
    
    // Member History State
    const [memberHistory, setMemberHistory] = useState<any>(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [expandedMember, setExpandedMember] = useState<string | null>(null);

    const tabs = [
        { key: "overview", label: "Overview" },
        { key: "day", label: "Day on Day" },
        { key: "week", label: "Week on Week" },
        { key: "month", label: "Month on Month" },
        { key: "assigner", label: "Assigner-Wise" },
        { key: "history", label: "Member History" },
    ];

    useEffect(() => {
        if (isLoaded && user) {
            fetchData();
        }
    }, [isLoaded, user, department, saleType, paymentStatus, dateRange, startDate, endDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let sd = startDate;
            let ed = endDate;
            
            if (dateRange !== 'Custom') {
                const now = new Date();
                let start = new Date();
                let end = new Date();
                
                if (dateRange === 'Today') {
                    start.setHours(0,0,0,0);
                    end.setHours(23,59,59,999);
                } else if (dateRange === 'This Week') {
                    const day = start.getDay();
                    const diff = start.getDate() - day + (day == 0 ? -6:1);
                    start = new Date(start.setDate(diff));
                    start.setHours(0,0,0,0);
                } else if (dateRange === 'This Month') {
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                } else if (dateRange === 'Last Month') {
                    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                }
                
                sd = start.toISOString();
                ed = end.toISOString();
            }

            if (dateRange === 'Custom' && (!startDate || !endDate)) {
                setLoading(false);
                return; 
            }

            const query = new URLSearchParams({
                department,
                saleType,
                paymentStatus,
                ...(sd && { startDate: sd }),
                ...(ed && { endDate: ed })
            });

            const res = await fetch(`/api/stats/department-sales?${query}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else {
                toast.error("Failed to fetch dashboard data");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const fetchMemberHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await fetch('/api/stats/department-sales/member-history');
            if (res.ok) {
                const json = await res.json();
                setMemberHistory(json.data);
            } else {
                toast.error("Failed to fetch member history");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'history' && !memberHistory) {
            fetchMemberHistory();
        }
    }, [activeTab]);

    const exportToCSV = () => {
        if (!data?.detailedSales) return;
        
        const headers = ["Date", "Transaction ID", "Member Name", "Department", "Sale Type", "Amount", "Amount Received"];
        const rows = data.detailedSales.map((t: any) => [
            new Date(t.createdAt).toLocaleDateString(),
            t.id,
            t.createdByName || 'Unknown',
            t.departmentAtSale || 'Digital',
            t.saleType || 'New Sale',
            t.amount || 0,
            t.received || 0
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map((e: any) => e.join(",")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `department_sales_${department}_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    // Sub-components for tabs
    const renderTable = (headers: string[], rowRenderer: (row: any, i: number) => React.ReactNode, rowData: any[]) => (
        <div className={`bg-white rounded-3xl border border-slate-200/60 shadow-sm flex flex-col ${isFullScreen ? 'fixed inset-4 z-50 p-8 shadow-2xl overflow-hidden' : 'p-6'}`}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-900">{tabs.find(t => t.key === activeTab)?.label} Report</h3>
                <button 
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                >
                    {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
            </div>
            <div className="flex-1 overflow-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                        <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                            {headers.map((h, i) => <th key={i} className={`p-4 whitespace-nowrap ${i > 0 ? 'text-right' : ''}`}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {rowData.length === 0 ? (
                            <tr><td colSpan={headers.length} className="p-8 text-center text-slate-400 font-medium">No data available</td></tr>
                        ) : (
                            rowData.map((row, i) => (
                                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-sm font-semibold text-slate-700">
                                    {rowRenderer(row, i)}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 text-indigo-600 mb-2">
                            <LayoutDashboard size={24} />
                            <span className="text-sm font-black uppercase tracking-widest">Analytics Center</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Department Sales</h1>
                            <button
                                onClick={() => setShowCards(!showCards)}
                                className="flex items-center gap-2 bg-white rounded-xl shadow-sm p-1.5 px-3 hover:shadow-md border border-slate-200 transition-colors text-slate-600"
                                title={showCards ? "Hide KPIs" : "Unhide KPIs"}
                            >
                                {showCards ? <EyeOff size={16} /> : <Eye size={16} />}
                                <span className="text-xs font-bold">{showCards ? "Hide" : "Unhide"}</span>
                            </button>
                        </div>
                        <p className="text-slate-500 font-medium mt-1">Deep dive into sales performance across all departments.</p>
                    </div>
                    
                    <button 
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 transition-all active:scale-95"
                    >
                        <Download size={18} />
                        Export Data
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/60">
                    <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
                        <Filter size={18} className="text-indigo-600" />
                        Global Filters
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Department</label>
                            <select 
                                value={department} onChange={e => setDepartment(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-semibold rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            >
                                <option>All Departments</option>
                                <option>Digital</option>
                                <option>Retention</option>
                                <option>Onboarding</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Time Period</label>
                            <select 
                                value={dateRange} onChange={e => setDateRange(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-semibold rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            >
                                <option>Today</option>
                                <option>This Week</option>
                                <option>This Month</option>
                                <option>Last Month</option>
                                <option>Custom</option>
                            </select>
                        </div>
                        {dateRange === 'Custom' && (
                            <div className="flex flex-col gap-1.5 lg:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Custom Range</label>
                                <div className="flex items-center gap-2">
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-semibold text-slate-700" />
                                    <span className="text-slate-400">-</span>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-semibold text-slate-700" />
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sale Type</label>
                            <select 
                                value={saleType} onChange={e => setSaleType(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-semibold rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            >
                                <option>All</option>
                                <option>New Sale</option>
                                <option>Renewal</option>
                                <option>Upsell</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Payment Status</label>
                            <select 
                                value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-semibold rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            >
                                <option>All</option>
                                <option>Paid / Completed</option>
                                <option>Pending / Partial</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center space-y-4">
                        <RefreshCw className="animate-spin text-indigo-600" size={32} />
                        <p className="text-slate-500 font-bold">Fetching Analytics...</p>
                    </div>
                ) : !data ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                        <AlertCircle size={32} className="mb-2" />
                        <p>No data available for the selected filters.</p>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        
                        {/* Summary KPIs */}
                        {showCards && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { title: 'Total Revenue', value: formatCurrency(data.summary.totalRevenue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                    { title: 'Total Sales', value: data.summary.totalSalesCount, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                    { title: 'Avg Order Value', value: formatCurrency(data.summary.aov), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
                                    { title: 'Active Members', value: data.summary.activeMembersCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                                ].map((kpi, i) => (
                                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
                                            <kpi.icon size={26} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">{kpi.title}</p>
                                            <h3 className="text-2xl font-black text-slate-900">{kpi.value}</h3>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* TABS */}
                        <div className="flex space-x-2 border-b mt-8 overflow-x-auto pb-1 no-scrollbar">
                            {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-5 py-3 font-bold border-b-2 transition-colors whitespace-nowrap ${
                                    activeTab === tab.key ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                {tab.label}
                            </button>
                            ))}
                        </div>

                        {/* TAB CONTENTS */}
                        
                        {/* 1. OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                            <TrendingUp className="text-indigo-500" size={20} />
                                            Revenue Trend
                                        </h3>
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={data.chartData.salesTrend}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} dx={-10} tickFormatter={(v) => `₹${(v/1000)}k`} />
                                                    <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => formatCurrency(value)} />
                                                    <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={4} dot={{r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                            <PieChart className="text-amber-500" size={20} />
                                            Revenue Breakdown
                                        </h3>
                                        <div className="h-[250px] w-full relative">
                                            {data.chartData.departmentBreakdown.length === 0 ? (
                                                <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium">No Data</div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={data.chartData.departmentBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                                                            {data.chartData.departmentBreakdown.map((e: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                        </Pie>
                                                        <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Cross Department Leaders */}
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                            <Crown className="text-yellow-500" size={20} />
                                            Top 3 by Department
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {['digital', 'retention', 'onboarding'].map((d) => (
                                                <div key={d} className="space-y-3 bg-slate-50 p-4 rounded-2xl">
                                                    <h4 className="text-xs font-black uppercase text-slate-500">{d}</h4>
                                                    {data.analytics.crossDepartmentLeaders[d].length === 0 && <p className="text-slate-400 text-xs">No data</p>}
                                                    {data.analytics.crossDepartmentLeaders[d].map((leader: any, i: number) => (
                                                        <div key={i} className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-800">{leader.name}</span>
                                                            <span className="text-xs font-black text-indigo-600">{formatCurrency(leader.revenue)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Ticket Size Analysis */}
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                            <DollarSign className="text-emerald-500" size={20} />
                                            Ticket Size Analysis
                                        </h3>
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={data.analytics.ticketSizeAnalysis}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} dx={-10} />
                                                    <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 600 }} />
                                                    <Bar dataKey="micro" name="< 10k" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                                    <Bar dataKey="medium" name="10k - 50k" stackId="a" fill="#f59e0b" />
                                                    <Bar dataKey="enterprise" name="> 50k" stackId="a" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. DAY ON DAY TAB */}
                        {activeTab === 'day' && renderTable(
                            ["Date", "Total Revenue", "Digital", "Retention", "Onboarding", "Sales"],
                            (row, i) => (
                                <>
                                    <td className="p-4 whitespace-nowrap text-slate-500">{row.date}</td>
                                    <td className="p-4 text-right font-black text-slate-900">{formatCurrency(row.totalRevenue)}</td>
                                    <td className="p-4 text-right font-bold text-indigo-600">{formatCurrency(row.digital)}</td>
                                    <td className="p-4 text-right font-bold text-emerald-600">{formatCurrency(row.retention)}</td>
                                    <td className="p-4 text-right font-bold text-amber-600">{formatCurrency(row.onboarding)}</td>
                                    <td className="p-4 text-right font-bold text-slate-500">{row.totalSales}</td>
                                </>
                            ),
                            data.analytics.dayData
                        )}

                        {/* 3. WEEK ON WEEK TAB */}
                        {activeTab === 'week' && renderTable(
                            ["Week", "Total Revenue", "Digital", "Retention", "Onboarding", "Sales"],
                            (row, i) => (
                                <>
                                    <td className="p-4 whitespace-nowrap text-slate-500">{row.week}</td>
                                    <td className="p-4 text-right font-black text-slate-900">{formatCurrency(row.totalRevenue)}</td>
                                    <td className="p-4 text-right font-bold text-indigo-600">{formatCurrency(row.digital)}</td>
                                    <td className="p-4 text-right font-bold text-emerald-600">{formatCurrency(row.retention)}</td>
                                    <td className="p-4 text-right font-bold text-amber-600">{formatCurrency(row.onboarding)}</td>
                                    <td className="p-4 text-right font-bold text-slate-500">{row.totalSales}</td>
                                </>
                            ),
                            data.analytics.weekData
                        )}

                        {/* 4. MONTH ON MONTH TAB */}
                        {activeTab === 'month' && renderTable(
                            ["Month", "Total Revenue", "Digital", "Retention", "Onboarding", "Sales"],
                            (row, i) => (
                                <>
                                    <td className="p-4 whitespace-nowrap text-slate-500">{row.month}</td>
                                    <td className="p-4 text-right font-black text-slate-900">{formatCurrency(row.totalRevenue)}</td>
                                    <td className="p-4 text-right font-bold text-indigo-600">{formatCurrency(row.digital)}</td>
                                    <td className="p-4 text-right font-bold text-emerald-600">{formatCurrency(row.retention)}</td>
                                    <td className="p-4 text-right font-bold text-amber-600">{formatCurrency(row.onboarding)}</td>
                                    <td className="p-4 text-right font-bold text-slate-500">{row.totalSales}</td>
                                </>
                            ),
                            data.analytics.monthData
                        )}

                        {/* 5. ASSIGNER-WISE TAB */}
                        {activeTab === 'assigner' && renderTable(
                            ["Assigner", "Total Revenue", "Digital", "Retention", "Onboarding", "Sales"],
                            (row, i) => (
                                <>
                                    <td className="p-4 font-bold text-slate-700">{row.name}</td>
                                    <td className="p-4 text-right font-black text-slate-900">{formatCurrency(row.totalRevenue)}</td>
                                    <td className="p-4 text-right font-bold text-indigo-600">{formatCurrency(row.digital)}</td>
                                    <td className="p-4 text-right font-bold text-emerald-600">{formatCurrency(row.retention)}</td>
                                    <td className="p-4 text-right font-bold text-amber-600">{formatCurrency(row.onboarding)}</td>
                                    <td className="p-4 text-right font-bold text-slate-500">{row.totalSales}</td>
                                </>
                            ),
                            data.analytics.assignerData
                        )}

                        {/* 6. MEMBER HISTORY TAB */}
                        {activeTab === 'history' && (
                            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6">
                                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <Calendar className="text-indigo-500" size={20} />
                                    Department Transfer History
                                </h3>
                                
                                {loadingHistory ? (
                                    <div className="py-12 flex flex-col items-center justify-center space-y-4">
                                        <RefreshCw className="animate-spin text-indigo-600" size={24} />
                                        <p className="text-slate-500 font-bold">Analyzing Transfers...</p>
                                    </div>
                                ) : !memberHistory || memberHistory.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 font-medium">No transfer history found.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {memberHistory.map((member: any) => (
                                            <div key={member.clerkId} className="border border-slate-200 rounded-2xl overflow-hidden transition-all">
                                                <div 
                                                    className={`p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 ${expandedMember === member.clerkId ? 'bg-slate-50 border-b border-slate-200' : 'bg-white'}`}
                                                    onClick={() => setExpandedMember(expandedMember === member.clerkId ? null : member.clerkId)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-700">
                                                            {member.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900">{member.name}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs font-semibold text-slate-500">Current:</span>
                                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                                                    member.currentDepartment === 'Digital' ? 'bg-indigo-100 text-indigo-700' :
                                                                    member.currentDepartment === 'Retention' ? 'bg-emerald-100 text-emerald-700' :
                                                                    member.currentDepartment === 'Onboarding' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
                                                                }`}>
                                                                    {member.currentDepartment}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm font-bold text-slate-500">{member.tenures.length} Tenures</span>
                                                        <ChevronDown size={20} className={`text-slate-400 transition-transform ${expandedMember === member.clerkId ? 'rotate-180' : ''}`} />
                                                    </div>
                                                </div>
                                                
                                                {/* Expanded Timeline */}
                                                {expandedMember === member.clerkId && (
                                                    <div className="p-6 bg-slate-50/50">
                                                        <div className="relative pl-6 border-l-2 border-slate-200 space-y-8">
                                                            {member.tenures.map((t: any, idx: number) => (
                                                                <div key={idx} className="relative">
                                                                    <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-white ${t.isCurrent ? 'bg-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.2)]' : 'bg-slate-300'}`}></div>
                                                                    
                                                                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                                                                        <div className="flex justify-between items-start mb-4">
                                                                            <div>
                                                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                                                                                    t.department === 'Digital' ? 'bg-indigo-100 text-indigo-700' :
                                                                                    t.department === 'Retention' ? 'bg-emerald-100 text-emerald-700' :
                                                                                    t.department === 'Onboarding' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
                                                                                }`}>
                                                                                    {t.department}
                                                                                </span>
                                                                                <p className="text-xs font-bold text-slate-500 mt-2">
                                                                                    {new Date(t.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} 
                                                                                    {' → '} 
                                                                                    {t.isCurrent ? 'Present' : new Date(t.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                                </p>
                                                                            </div>
                                                                            {t.isCurrent && (
                                                                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-1 rounded">Active</span>
                                                                            )}
                                                                        </div>
                                                                        
                                                                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                                                                            <div>
                                                                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Total Revenue</p>
                                                                                <p className="text-lg font-black text-slate-900">{formatCurrency(t.totalRevenue)}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Total Sales</p>
                                                                                <p className="text-lg font-black text-slate-900">{t.totalSales}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </motion.div>
                )}
            </div>
        </div>
    );
}
