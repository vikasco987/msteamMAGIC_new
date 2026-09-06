"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
    Filter, Download, Search, LayoutDashboard, TrendingUp, Users, DollarSign,
    Briefcase, Calendar, ChevronDown, CheckCircle2, AlertCircle, RefreshCw, Crown
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
    
    // Custom Date Range
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Search
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isLoaded && user) {
            fetchData();
        }
    }, [isLoaded, user, department, saleType, paymentStatus, dateRange, startDate, endDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Compute dates based on dateRange
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
                return; // wait for both dates
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

    const filteredTableData = data?.detailedSales?.filter((row: any) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (row.createdByName || '').toLowerCase().includes(q) ||
            (row.id || '').toLowerCase().includes(q)
        );
    }) || [];

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
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Department Sales <span className="text-indigo-600">Dashboard</span></h1>
                        <p className="text-slate-500 font-medium mt-1">Deep dive into sales performance across all departments.</p>
                    </div>
                    
                    <button 
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 transition-all active:scale-95"
                    >
                        <Download size={18} />
                        Export Report
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
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Custom Date Range</label>
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
                        <p className="text-slate-500 font-bold">Analyzing Department Data...</p>
                    </div>
                ) : !data ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                        <AlertCircle size={32} className="mb-2" />
                        <p>No data available for the selected filters.</p>
                    </div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* Summary KPIs */}
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

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* Trend Chart */}
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
                                            <RechartsTooltip 
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: any) => formatCurrency(value)}
                                            />
                                            <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={4} dot={{r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Department Breakdown */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <PieChart className="text-amber-500" size={20} />
                                    Revenue by Department
                                </h3>
                                <div className="h-[250px] w-full relative">
                                    {data.chartData.departmentBreakdown.length === 0 ? (
                                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium">No Data</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={data.chartData.departmentBreakdown}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {data.chartData.departmentBreakdown.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                                <div className="mt-4 flex flex-wrap justify-center gap-4">
                                    {data.chartData.departmentBreakdown.map((entry: any, index: number) => (
                                        <div key={index} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                            {entry.name}
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Top Performers & Table */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            
                            {/* Top Members */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <Crown className="text-yellow-500" size={20} />
                                    Top Performers
                                </h3>
                                <div className="space-y-4">
                                    {data.chartData.topMembers.length === 0 && <p className="text-slate-400 text-center py-4">No performers yet</p>}
                                    {data.chartData.topMembers.map((member: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs">
                                                    {i + 1}
                                                </div>
                                                <span className="font-bold text-slate-800 text-sm">{member.name}</span>
                                            </div>
                                            <span className="font-black text-indigo-600 text-sm">{formatCurrency(member.revenue)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Detailed Data Table */}
                            <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-black text-slate-900">Transaction History</h3>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="Search transactions..." 
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 outline-none w-64"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-auto rounded-2xl border border-slate-100">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                                <th className="p-4 whitespace-nowrap">Date</th>
                                                <th className="p-4 whitespace-nowrap">Member</th>
                                                <th className="p-4 whitespace-nowrap">Department</th>
                                                <th className="p-4 whitespace-nowrap">Type</th>
                                                <th className="p-4 whitespace-nowrap text-right">Amount</th>
                                                <th className="p-4 whitespace-nowrap text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTableData.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">No transactions found</td>
                                                </tr>
                                            ) : (
                                                filteredTableData.map((row: any, idx: number) => {
                                                    const amt = row.amount || 0;
                                                    const rec = row.received || 0;
                                                    const isCompleted = rec >= amt && amt > 0;
                                                    
                                                    return (
                                                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-sm font-semibold text-slate-700">
                                                            <td className="p-4 whitespace-nowrap text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</td>
                                                            <td className="p-4">{row.createdByName || 'Unknown'}</td>
                                                            <td className="p-4">
                                                                <span className={`px-2.5 py-1 rounded-lg text-xs ${
                                                                    row.departmentAtSale === 'Digital' ? 'bg-indigo-100 text-indigo-700' :
                                                                    row.departmentAtSale === 'Retention' ? 'bg-emerald-100 text-emerald-700' :
                                                                    row.departmentAtSale === 'Onboarding' ? 'bg-amber-100 text-amber-700' :
                                                                    'bg-slate-100 text-slate-700'
                                                                }`}>
                                                                    {row.departmentAtSale || 'Digital'}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 whitespace-nowrap text-slate-500">{row.saleType || 'New Sale'}</td>
                                                            <td className="p-4 whitespace-nowrap text-right font-black text-slate-900">{formatCurrency(amt)}</td>
                                                            <td className="p-4 whitespace-nowrap text-right flex justify-end">
                                                                {isCompleted ? (
                                                                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs">
                                                                        <CheckCircle2 size={14} /> Paid
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg text-xs">
                                                                        <AlertCircle size={14} /> Pending
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

            </div>
        </div>
    );
}
