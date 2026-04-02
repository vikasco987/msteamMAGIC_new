"use client";

import React, { useState } from "react";
import {
    Plus,
    Trash2,
    Settings,
    Save,
    ChevronLeft,
    GripVertical,
    Type,
    Hash,
    Calendar,
    CheckSquare,
    ChevronDown,
    AlignLeft,
    Phone,
    Mail,
    Image as ImageIcon,
    Layout,
    Eye,
    Rocket,
    ShieldCheck,
    Search,
    Users,
    X,
    Clock
} from "lucide-react";
import { motion, Reorder } from "framer-motion";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";

import { useUser } from "@clerk/nextjs";

type FieldType = "text" | "number" | "date" | "dropdown" | "checkbox" | "textarea" | "phone" | "email" | "file";

interface FormField {
    id: string;
    label: string;
    type: FieldType;
    placeholder: string;
    required: boolean;
    options: string[];
}

export default function FormBuilderPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");
    const { user, isLoaded } = useUser();
    const [title, setTitle] = useState("Untitled Form");
    const [description, setDescription] = useState("");
    const [fields, setFields] = useState<FormField[]>([]);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<"fields" | "permissions">("fields");

    // Fetch Existing Form if Edit Mode
    React.useEffect(() => {
        if (!editId) return;
        const fetchForm = async () => {
            try {
                const res = await fetch(`/api/crm/forms/${editId}`);
                if (!res.ok) throw new Error("Not found");
                const data = await res.json();
                if (data.form) {
                    setTitle(data.form.title);
                    setDescription(data.form.description || "");
                    setFields(data.form.fields || []);
                    setVisibleToRoles(data.form.visibleToRoles || []);
                    setVisibleToUsers(data.form.visibleToUsers || []);
                }
            } catch (err) {
                toast.error("Failed to load existing form");
            }
        };
        fetchForm();
    }, [editId]);

    // Authorization Check (TeamBoard Consistency)
    React.useEffect(() => {
        if (!isLoaded) return;

        const checkAuth = async () => {
            // First check metadata (fastest)
            const metaRole = (user?.publicMetadata?.role as string || "user").toUpperCase();

            // Then fallback/verify with API
            const res = await fetch("/api/crm/forms");
            const data = await res.json();
            const apiRole = (data.userRole || "GUEST").toUpperCase();

            const isAuthorized = metaRole === "ADMIN" || metaRole === "MASTER" || metaRole === "TL" ||
                apiRole === "ADMIN" || apiRole === "MASTER" || apiRole === "TL";

            if (!isAuthorized) {
                toast.error("Unauthorized: Access Denied");
                router.push("/crm/forms");
            }
        };
        checkAuth();
    }, [isLoaded, user, router]);

    // Visibility States
    const [visibleToRoles, setVisibleToRoles] = useState<string[]>([]);
    const [visibleToUsers, setVisibleToUsers] = useState<string[]>([]);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [userResults, setUserResults] = useState<{ clerkId: string, email: string }[]>([]);

    const AVAILABLE_ROLES = ["ADMIN", "MASTER", "MANAGER", "SELLER", "INTERN", "TL"];

    const addField = (type: FieldType) => {
        const newField: FormField = {
            id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
            type,
            placeholder: "",
            required: false,
            options: type === "dropdown" ? ["Option 1"] : []
        };
        setFields([...fields, newField]);
        setSelectedFieldId(newField.id);
        setSidebarTab("fields");
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
        if (selectedFieldId === id) setSelectedFieldId(null);
    };

    const updateField = (id: string, updates: Partial<FormField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const searchUsers = async (q: string) => {
        setUserSearchQuery(q);
        if (q.length < 2) { setUserResults([]); return; }
        try {
            const res = await fetch(`/api/crm/users?q=${q}`);
            const json = await res.json();
            setUserResults(json);
        } catch (err) { console.error(err); }
    };

    const handleSave = async (publish: boolean = false) => {
        if (!title.trim()) {
            toast.error("Please enter a form title");
            return;
        }
        setIsSaving(true);
        try {
            const url = editId ? `/api/crm/forms/${editId}` : "/api/crm/forms";
            const method = editId ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    fields,
                    isPublished: publish,
                    visibleToRoles,
                    visibleToUsers
                }),
            });
            if (res.ok) {
                toast.success(publish ? "Form Published!" : (editId ? "Form Updated!" : "Form Saved!"));
                router.push("/crm/forms");
            } else {
                toast.error("Failed to save form");
            }
        } catch (err) {
            toast.error("Network error");
        } finally {
            setIsSaving(false);
        }
    };

    const selectedField = fields.find(f => f.id === selectedFieldId);

    const fieldTypes: { type: FieldType; label: string; icon: any }[] = [
        { type: "text", label: "Short Text", icon: Type },
        { type: "textarea", label: "Long Text", icon: AlignLeft },
        { type: "number", label: "Number", icon: Hash },
        { type: "date", label: "Date Picker", icon: Calendar },
        { type: "dropdown", label: "Dropdown", icon: ChevronDown },
        { type: "checkbox", label: "Checkbox", icon: CheckSquare },
        { type: "phone", label: "Phone", icon: Phone },
        { type: "email", label: "Email", icon: Mail },
        { type: "file", label: "File Upload", icon: ImageIcon },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col h-screen overflow-hidden">
            {/* Top Bar */}
            <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                        <ChevronLeft size={20} className="text-slate-500" />
                    </button>
                    <div>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-xl font-black text-slate-900 bg-transparent border-none focus:ring-0 p-0"
                            placeholder="Enter Form Title..."
                        />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Form Builder Mode</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => handleSave(false)} disabled={isSaving} className="px-6 py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all">
                        {isSaving ? "Saving..." : "Save Draft"}
                    </button>
                    <button onClick={() => handleSave(true)} disabled={isSaving} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center gap-2">
                        <Rocket size={16} /> Publish Form
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Field Types */}
                <aside className="w-[300px] bg-white border-r border-slate-200 p-6 overflow-y-auto">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Field Inventory</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {fieldTypes.map((ft) => (
                            <button
                                key={ft.type}
                                onClick={() => addField(ft.type)}
                                className="flex items-center gap-4 p-4 bg-slate-50 border-2 border-transparent hover:border-indigo-600 hover:bg-white rounded-[20px] transition-all group"
                            >
                                <div className="p-2 bg-white group-hover:bg-indigo-50 rounded-xl shadow-sm group-hover:text-indigo-600 transition-colors">
                                    <ft.icon size={18} />
                                </div>
                                <span className="text-sm font-bold text-slate-700">{ft.label}</span>
                                <Plus size={16} className="ml-auto text-slate-300 group-hover:text-indigo-600" />
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Center: Live Preview Area */}
                <section className="flex-1 bg-slate-50 p-12 overflow-y-auto">
                    <div className="max-w-[700px] mx-auto space-y-6">
                        {/* Form Header Card */}
                        <div className="bg-white p-10 rounded-[32px] border-2 border-white shadow-xl">
                            <h2 className="text-3xl font-black text-slate-900 mb-4">{title || "Untitled Form"}</h2>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add a description for your team or customers..."
                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-500 font-medium leading-relaxed resize-none"
                                rows={2}
                            />
                        </div>

                        {/* Fields Container */}
                        <Reorder.Group axis="y" values={fields} onReorder={setFields} className="space-y-4">
                            {fields.map((field) => (
                                <Reorder.Item
                                    key={field.id}
                                    value={field}
                                    onClick={() => { setSelectedFieldId(field.id); setSidebarTab("fields"); }}
                                    className={`bg-white p-8 rounded-[32px] border-2 transition-all cursor-pointer group relative
                                        ${selectedFieldId === field.id ? 'border-indigo-600 shadow-2xl' : 'border-transparent shadow-sm hover:shadow-md'}`}
                                >
                                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing">
                                        <GripVertical size={24} />
                                    </div>

                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">{field.type}</span>
                                            <h4 className="text-lg font-black text-slate-900 mt-2">{field.label} {field.required && <span className="text-rose-500">*</span>}</h4>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                                            className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    {/* Dummy Inputs for Preview */}
                                    {field.type === "text" && <div className="w-full h-14 bg-slate-50 rounded-2xl border border-slate-100 border-dashed" />}
                                    {field.type === "textarea" && <div className="w-full h-32 bg-slate-50 rounded-2xl border border-slate-100 border-dashed" />}
                                    {field.type === "dropdown" && (
                                        <div className="w-full h-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center px-6 justify-between text-slate-400">
                                            Select an option... <ChevronDown size={18} />
                                        </div>
                                    )}
                                    {(field.type === "phone" || field.type === "number" || field.type === "email" || field.type === "date") && (
                                        <div className="w-full h-14 bg-slate-50 rounded-2xl border border-slate-100 border-dashed" />
                                    )}
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>

                        {fields.length === 0 && (
                            <div className="py-24 text-center border-4 border-dashed border-slate-200 rounded-[40px] bg-white/50">
                                <Layout size={60} className="mx-auto text-slate-200 mb-6" />
                                <h3 className="text-xl font-black text-slate-900">Your Canvas is Ready</h3>
                                <p className="text-slate-400 font-bold text-sm mt-2 mb-8">Pick a field from the left sidebar to start building.</p>
                                <button
                                    onClick={() => setSidebarTab("permissions")}
                                    className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2 mx-auto"
                                >
                                    <ShieldCheck size={14} /> Configure Access Matrix
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Right Sidebar: Field Settings */}
                <aside className="w-[400px] bg-white border-l border-slate-200 p-0 overflow-y-auto flex flex-col">
                    <div className="flex bg-slate-50 p-2 border-b border-slate-100 shrink-0 sticky top-0 z-10">
                        <button
                            onClick={() => setSidebarTab("fields")}
                            className={`flex-1 py-4 flex flex-col items-center gap-1 rounded-2xl transition-all ${sidebarTab === 'fields' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Settings size={18} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Field Engine</span>
                        </button>
                        <button
                            onClick={() => setSidebarTab("permissions")}
                            className={`flex-1 py-4 flex flex-col items-center gap-1 rounded-2xl transition-all ${sidebarTab === 'permissions' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <ShieldCheck size={18} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Access Matrix</span>
                        </button>
                    </div>

                    <div className="p-8">
                        {sidebarTab === "fields" ? (
                            selectedField ? (
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Settings className="text-indigo-600" size={20} />
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Field Configuration</h3>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Label</label>
                                            <input
                                                type="text"
                                                value={selectedField.label}
                                                onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                                                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-bold text-slate-700 outline-none transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Placeholder Message</label>
                                            <input
                                                type="text"
                                                value={selectedField.placeholder}
                                                onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                                                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-bold text-slate-700 outline-none transition-all"
                                            />
                                        </div>

                                        {selectedField.type === "dropdown" && (
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dropdown Options</label>
                                                {selectedField.options.map((opt, idx) => (
                                                    <div key={idx} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const newOpts = [...selectedField.options];
                                                                newOpts[idx] = e.target.value;
                                                                updateField(selectedField.id, { options: newOpts });
                                                            }}
                                                            className="flex-1 p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-bold text-slate-700 outline-none transition-all"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const newOpts = selectedField.options.filter((_, i) => i !== idx);
                                                                updateField(selectedField.id, { options: newOpts });
                                                            }}
                                                            className="p-4 text-rose-500 hover:bg-rose-50 rounded-2xl"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => updateField(selectedField.id, { options: [...selectedField.options, `Option ${selectedField.options.length + 1}`] })}
                                                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all"
                                                >
                                                    Add Option
                                                </button>
                                            </div>
                                        )}

                                        <div className="pt-4 border-t border-slate-100">
                                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-700">Required Field</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Make this input mandatory</span>
                                                </div>
                                                <button
                                                    onClick={() => updateField(selectedField.id, { required: !selectedField.required })}
                                                    className={`w-14 h-8 rounded-full relative transition-all duration-300 
                                                        ${selectedField.required ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all 
                                                        ${selectedField.required ? 'right-1' : 'left-1'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center px-6 py-20">
                                    <div className="p-8 bg-slate-50 rounded-[35px] mb-8">
                                        <Settings size={48} className="text-slate-200" />
                                    </div>
                                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-widest">Logic Hub</h4>
                                    <p className="text-xs font-bold text-slate-400 mt-4 leading-relaxed">Select a coordinate from the matrix center to calibrate its attributes.</p>
                                </div>
                            )
                        ) : (
                            <div className="space-y-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <ShieldCheck className="text-indigo-600" size={20} />
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Global Access Control</h3>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Role-Based Access (RBAC)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {AVAILABLE_ROLES.map(role => (
                                                <button
                                                    key={role}
                                                    onClick={() => {
                                                        setVisibleToRoles(prev =>
                                                            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
                                                        );
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${visibleToRoles.includes(role) ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'}`}
                                                >
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-3 tracking-tighter">Only users with these roles will see this form.</p>
                                    </div>

                                    <div className="pt-8 border-t border-slate-100 relative">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block text-indigo-600">Exclusive User Access</label>
                                        <div className="relative mb-4">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input
                                                value={userSearchQuery}
                                                onChange={(e) => searchUsers(e.target.value)}
                                                placeholder="Search by email..."
                                                className="w-full bg-slate-50 p-4 pl-12 rounded-2xl border-none font-bold text-[11px] shadow-inner outline-none focus:ring-1 ring-indigo-500"
                                            />
                                        </div>

                                        {userResults.length > 0 && (
                                            <div
                                                onMouseDown={(e) => e.preventDefault()}
                                                className="absolute left-0 right-0 top-[100px] bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 py-4 max-h-[200px] overflow-y-auto"
                                            >
                                                {userResults.map(u => (
                                                    <button
                                                        key={u.clerkId}
                                                        onClick={() => {
                                                            if (!visibleToUsers.includes(u.clerkId)) {
                                                                setVisibleToUsers([...visibleToUsers, u.clerkId]);
                                                            }
                                                            setUserResults([]);
                                                            setUserSearchQuery("");
                                                        }}
                                                        className="w-full px-6 py-3 text-left hover:bg-slate-50 flex items-center justify-between group"
                                                    >
                                                        <span className="text-[10px] font-black text-slate-700">{u.email}</span>
                                                        <Plus size={14} className="text-indigo-600 opacity-0 group-hover:opacity-100" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                            {visibleToUsers.map(uid => (
                                                <div key={uid} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100">
                                                    <span className="text-[9px] font-black">User: {uid.split('_').pop()?.slice(0, 5)}...</span>
                                                    <X size={12} className="cursor-pointer hover:text-rose-500" onClick={() => setVisibleToUsers(visibleToUsers.filter(x => x !== uid))} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-slate-100">
                                        <div className="p-6 bg-slate-900 rounded-[30px] text-white">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Layout size={16} className="text-indigo-400" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Global Settings</span>
                                            </div>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed">
                                                If no roles or users are selected, this form will be visible to <span className="text-emerald-400">Everyone</span>.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </main>
        </div>
    );
}
