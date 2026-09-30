"use client";

import { useState } from "react";
import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, Phone, ArrowRight, ShieldCheck, Zap, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function CustomAuthPage() {
    const router = useRouter();
    const [view, setView] = useState<"login" | "signup" | "clerk">("login");
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/auth/custom/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message, { duration: 5000 });
                setView("login");
            } else {
                toast.error(data.error);
            }
        } catch (err) {
            toast.error("Something went wrong");
        }
        setLoading(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/auth/custom/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email, password: formData.password })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Welcome back!");
                window.dispatchEvent(new Event("auth_changed"));
                router.push("/dashboard");
                router.refresh();
            } else {
                toast.error(data.error);
            }
        } catch (err) {
            toast.error("Something went wrong");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen w-full flex bg-slate-50">
            {/* LEFT SIDE - Office Image */}
            <div className="hidden lg:flex w-1/2 relative bg-indigo-900 overflow-hidden">
                <div className="absolute inset-0 bg-black/40 z-10" />
                <img 
                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop" 
                    alt="Office"
                    className="absolute inset-0 w-full h-full object-cover z-0"
                />
                <div className="relative z-20 flex flex-col justify-end p-16 h-full text-white">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl max-w-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-indigo-500 rounded-lg text-white">
                                <Zap size={24} />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight">Lead Matrix Pro</h2>
                        </div>
                        <p className="text-indigo-100 text-lg leading-relaxed">
                            Welcome to the next generation of team management and CRM solutions. Secure, fast, and scalable for modern businesses.
                        </p>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE - Auth Forms */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
                
                <div className="w-full max-w-md space-y-8">
                    {/* Header */}
                    <div className="text-center">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            {view === "login" && "Welcome Back"}
                            {view === "signup" && "Create an Account"}
                            {view === "clerk" && "Partner Login"}
                        </h1>
                        <p className="mt-2 text-slate-500">
                            {view === "login" && "Sign in with your workspace credentials."}
                            {view === "signup" && "Join your team workspace today."}
                            {view === "clerk" && "Sign in via global Clerk authentication."}
                        </p>
                    </div>

                    {/* View Switcher */}
                    <div className="flex p-1 space-x-1 bg-slate-100 rounded-xl">
                        <button
                            onClick={() => setView("login")}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${view === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setView("signup")}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${view === 'signup' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Sign Up
                        </button>
                        <button
                            onClick={() => setView("clerk")}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${view === 'clerk' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Partner Login
                        </button>
                    </div>

                    {/* Login Form */}
                    {view === "login" && (
                        <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                                        <input 
                                            type="email" 
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({...formData, email: e.target.value})}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="you@company.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                                        <input 
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={formData.password}
                                            onChange={e => setFormData({...formData, password: e.target.value})}
                                            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button 
                                disabled={loading}
                                type="submit" 
                                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                            >
                                {loading ? "Signing in..." : "Sign In"}
                                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </form>
                    )}

                    {/* Signup Form */}
                    {view === "signup" && (
                        <form onSubmit={handleSignup} className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 text-slate-400" size={18} />
                                        <input 
                                            type="text" 
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                                        <input 
                                            type="email" 
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({...formData, email: e.target.value})}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="you@company.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                                        <input 
                                            type="tel" 
                                            required
                                            value={formData.phone}
                                            onChange={e => setFormData({...formData, phone: e.target.value})}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="+91 9876543210"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Create Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                                        <input 
                                            type={showPassword ? "text" : "password"}
                                            required
                                            minLength={6}
                                            value={formData.password}
                                            onChange={e => setFormData({...formData, password: e.target.value})}
                                            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button 
                                disabled={loading}
                                type="submit" 
                                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                <ShieldCheck size={18} />
                                {loading ? "Creating Account..." : "Create Account"}
                            </button>
                            <p className="text-xs text-slate-500 text-center mt-4">
                                Note: After signing up, your account will need to be approved by an administrator before you can log in.
                            </p>
                        </form>
                    )}

                    {/* Clerk Form */}
                    {view === "clerk" && (
                        <div className="animate-in fade-in zoom-in-95 duration-300 flex justify-center w-full">
                            <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
