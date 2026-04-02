"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
    Database,
    UploadCloud,
    ArrowLeft,
    ArrowRight,
    Download,
    ChevronLeft,
    ChevronRight,
    User,
    Calendar,
    Search,
    Filter,
    ArrowUpRight,
    X,
    MoreHorizontal,
    Table,
    FileSpreadsheet,
    Smartphone,
    Plus,
    LayoutGrid,
    CheckCircle2,
    Clock,
    UserPlus,
    Type,
    ChevronDown,
    Save,
    Maximize2,
    ExternalLink,
    ShieldCheck,
    History,
    FileText,
    Hash,
    IndianRupee,
    Percent,
    ListFilter,
    Layers,
    CalendarDays,
    CheckSquare,
    Users,
    Paperclip,
    FunctionSquare,
    Star,
    Link,
    Phone,
    Mail,
    Zap,
    Layout,
    Trash2,
    Settings,
    Activity,
    Eye,
    EyeOff,
    Check,
    GripVertical,
    Lock,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Minimize2,
    Sparkles,
    Bot,
    RefreshCw,
    Palette,
    Send,
    BarChart3,
    CloudOff,
    Wifi,
    Pin,
    PinOff,
    Target,
    Quote,
    TrendingUp,
    AlertCircle,
    Settings2,
    Globe
} from "lucide-react";
import FormRemarkModal from "@/app/components/FormRemarkModal";
import { createPortal } from "react-dom";
import PaymentHubModal from "@/app/components/PaymentHubModal";
import PaymentHubDashboard from "@/app/components/PaymentHubDashboard";
import BulkImportModal from "@/app/components/BulkImportModal";
import LeadAssignHub from "@/app/components/LeadAssignHub";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useChat } from "@ai-sdk/react";
import { useUser } from "@clerk/nextjs";
import { useVirtualizer } from "@tanstack/react-virtual";

const CALL_STATUS_OPTIONS = [
    "CALL AGAIN", "CALL DONE", "RNR", "INVALID NUMBER", "SWITCH OFF", "RNR 2", "RNR3", "INCOMING NOT AVAIABLE", "MEETING", "DUPLICATE", "WRONG NUMBER"
];

const getExcelLabel = (index: number): string => {
    let label = "";
    while (index >= 0) {
        label = String.fromCharCode((index % 26) + 65) + label;
        index = Math.floor(index / 26) - 1;
    }
    return label;
};

const getColumnGroup = (col: any) => {
    if (["__profile", "__assigned"].includes(col.id)) return "OPERATIONAL";
    if (["__submittedAt", "__contributor"].includes(col.id) || !col.isInternal) return "LEAD_INFO";
    if (col.id === "__payment" || col.label?.toLowerCase().includes("amount") || col.type === "currency") return "FINANCIALS";
    if (["__followup", "__recentRemark", "__nextFollowUpDate", "__followUpStatus", "__nextFollow up date"].includes(col.id) || col.isInternal) return "CRM_TRACKING";
    return "OTHERS";
};

const getGroupStyle = (group: string) => {
    switch (group) {
        case "OPERATIONAL": return {
            bg: "bg-indigo-50/50",
            headerBg: "bg-indigo-100/50",
            text: "text-indigo-600",
            accent: "bg-indigo-500",
            border: "border-indigo-200",
            label: "Operations"
        };
        case "LEAD_INFO": return {
            bg: "bg-blue-50/50",
            headerBg: "bg-blue-100/50",
            text: "text-blue-600",
            accent: "bg-blue-500",
            border: "border-blue-200",
            label: "Lead Entry"
        };
        case "FINANCIALS": return {
            bg: "bg-emerald-50/50",
            headerBg: "bg-emerald-100/50",
            text: "text-emerald-600",
            accent: "bg-emerald-500",
            border: "border-emerald-200",
            label: "Financials"
        };
        case "CRM_TRACKING": return {
            bg: "bg-amber-50/50",
            headerBg: "bg-amber-100/50",
            text: "text-amber-600",
            accent: "bg-amber-500",
            border: "border-amber-200",
            label: "CRM Tracking"
        };
        default: return {
            bg: "bg-slate-50/50",
            headerBg: "bg-slate-100/50",
            text: "text-slate-600",
            accent: "bg-slate-500",
            border: "border-slate-200",
            label: "Core Data"
        };
    }
};

interface FormField {
    id: string;
    label: string;
    type: string;
    options: any;
}

interface InternalColumn {
    id: string;
    label: string;
    type: string;
    options: any;
    isRequired?: boolean;
    isLocked?: boolean;
    formId?: string;
    visibleToRoles?: string[];
    visibleToUsers?: string[];
}

interface ResponseValue {
    fieldId: string;
    value: string;
}

interface FormActivity {
    id: string;
    responseId: string;
    userName: string;
    type: string;
    columnName: string;
    oldValue: string;
    newValue: string;
    createdAt: string;
}

interface TeamMember {
    clerkId: string;
    email: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    imageUrl?: string;
}

const safeFormat = (dateStr: string, formatStr: string) => {
    try {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return format(date, formatStr);
    } catch (e) {
        return dateStr;
    }
};

interface SavedView {
    id: string;
    name: string;
    conditions: { colId: string, op: string, val: string, val2?: string }[];
    conjunction: "AND" | "OR";
}

interface FormResponse {
    id: string;
    submittedAt: string;
    createdAt?: string;
    submittedByName: string;
    assignedTo?: string[];
    visibleToRoles?: string[];
    visibleToUsers?: string[];
    values: ResponseValue[];
    submittedBy?: string; // Added for __assigned logic
    remarks?: any[]; // Added for __followup logic
    rowColor?: string; // Enhanced: custom highlight color
}

interface MasterData {
    form: {
        title: string;
        fields: FormField[];
        visibleToRoles?: string[];
        visibleToUsers?: string[];
        visibleToUsersData?: { id: string; email: string; name: string; imageUrl: string }[];
        id?: string; // Added for FormRemarkModal
        columnPermissions?: any; // Added for GAC logic
        defaultColumnOrder?: string[];
        defaultHiddenColumns?: string[];
    };
    responses: FormResponse[];
    internalColumns: InternalColumn[];
    internalValues: { responseId: string; columnId: string; value: string; updatedByName?: string; updatedAt?: string }[];
    activities: FormActivity[];
    clerkId?: string; // Added for permission logic
    userRole?: string; // Added for permission logic
    isMaster?: boolean; // Added for permission logic
    isPureMaster?: boolean; // Added for permission logic
    totalCount?: number;
    filteredCount?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
}

const COLUMN_TYPES = [
    { title: "Standard Text", id: "text", icon: Type, color: "text-[#667085]" },
    { title: "Long Narrative", id: "long_text", icon: FileText, color: "text-[#667085]" },
    { title: "Pure Number", id: "number", icon: Hash, color: "text-[#667085]" },
    { title: "Currency (INR)", id: "currency", icon: IndianRupee, color: "text-[#667085]" },
    { title: "Smart Dropdown", id: "dropdown", icon: ListFilter, color: "text-[#667085]" },
    { title: "Multi Select", id: "multi_select", icon: Layers, color: "text-[#667085]" },
    { title: "Universal Date", id: "date", icon: CalendarDays, color: "text-[#rose-500]" },
    { title: "Checkbox/Binary", id: "checkbox", icon: CheckSquare, color: "text-[#667085]" },
    { title: "Team Member", id: "user", icon: Users, color: "text-[#667085]" },
    { title: "Phone Matrix", id: "phone", icon: Phone, color: "text-[#667085]" },
    { title: "Verified Email", id: "email", icon: Mail, color: "text-[#667085]" },
    { title: "Deep Formula", id: "formula", icon: FunctionSquare, color: "text-[#667085]" },
    { title: "External Link", id: "url", icon: Link, color: "text-[#667085]" },
    { title: "Attachment Hub", id: "file", icon: Paperclip, color: "text-[#667085]" },
];

const AVAILABLE_ROLES = ["ADMIN", "MASTER", "MANAGER", "SELLER", "INTERN", "TL"];

const FILTER_OPERATORS = {
    text: [
        { label: "Equals", value: "equals" },
        { label: "Contains", value: "contains" },
        { label: "Starts With", value: "starts_with" },
        { label: "Ends With", value: "ends_with" },
        { label: "Complement (Not)", value: "not_equals" },
        { label: "Is Empty", value: "is_empty" },
        { label: "Is Not Empty", value: "is_not_empty" }
    ],
    number: [
        { label: "Equals", value: "eq" },
        { label: "Greater Than", value: "gt" },
        { label: "Less Than", value: "lt" },
        { label: "Greater or Equal", value: "gte" },
        { label: "Less or Equal", value: "lte" },
        { label: "Between", value: "between" },
        { label: "Is Empty", value: "is_empty" },
        { label: "Is Not Empty", value: "is_not_empty" }
    ],
    date: [
        { label: "Exactly", value: "exact_date" },
        { label: "Is Today", value: "today" },
        { label: "Is Yesterday", value: "yesterday" },
        { label: "Before", value: "before" },
        { label: "After", value: "after" },
        { label: "Is Tomorrow", value: "tomorrow" },
        { label: "This Week", value: "this_week" },
        { label: "Between", value: "between" },
        { label: "Is Empty", value: "is_empty" },
        { label: "Is Not Empty", value: "is_not_empty" }
    ],
    dropdown: [
        { label: "Is", value: "equals" },
        { label: "Is Not", value: "not_equals" },
        { label: "Is One Of", value: "one_of" },
        { label: "Is Empty", value: "is_empty" },
        { label: "Is Not Empty", value: "is_not_empty" }
    ],
    multi_select: [
        { label: "Contains", value: "contains" },
        { label: "Is One Of", value: "one_of" },
        { label: "Is Empty", value: "is_empty" },
        { label: "Is Not Empty", value: "is_not_empty" }
    ],
    checkbox: [
        { label: "Is Checked", value: "is_true" },
        { label: "Is Unchecked", value: "is_false" },
        { label: "Is Empty", value: "is_empty" },
        { label: "Is Not Empty", value: "is_not_empty" }
    ],
    user: [
        { label: "Contains User", value: "contains" },
        { label: "Is Exact Match", value: "equals" },
        { label: "Is Not", value: "not_equals" },
        { label: "Is Empty", value: "is_empty" },
        { label: "Is Not Empty", value: "is_not_empty" }
    ]
};

const getFallbackAvatar = (userId: string, imageUrl?: string | null) => {
    if (imageUrl && !imageUrl.includes("default") && !imageUrl.includes("gravatar") && imageUrl.trim() !== "") return imageUrl;
    const sum = (userId || "unknown").split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = (sum % 5) + 1;
    return `/avatars/${index}.png`;
};

export default function CRMSpreadsheetPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const [data, setData] = useState<MasterData | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string>("GUEST");
    const [isMaster, setIsMaster] = useState(false);
    const [isPureMaster, setIsPureMaster] = useState(false);
    const [isTL, setIsTL] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isDataSynced, setIsDataSynced] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
    const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
    const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);

    // ⚡ Performance Fix: Debounce Search to prevent re-filtering on every keystroke
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
    const [editValue, setEditValue] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [editingCell, setEditingCell] = useState<{ rowId: string, colId: string } | null>(null);
    const [focusedCell, setFocusedCell] = useState<{ rowId: string, colId: string } | null>(null);
    const [savingCells, setSavingCells] = useState<Set<string>>(new Set());
    const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
    const [isAddingHubCols, setIsAddingHubCols] = useState(false);
    const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [canvasTheme, setCanvasTheme] = useState<string>("default");
    const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
    const [openAssignedCell, setOpenAssignedCell] = useState<string | null>(null);
    const [openFollowUpModal, setOpenFollowUpModal] = useState<{ formId: string, responseId: string, columnId?: string } | null>(null);
    const [openPaymentModal, setOpenPaymentModal] = useState<{ formId: string, responseId: string } | null>(null);
    const [isPaymentHubOpen, setIsPaymentHubOpen] = useState(false);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [isLeadAssignHubOpen, setIsLeadAssignHubOpen] = useState(false);
    const [selectedResponseActivities, setSelectedResponseActivities] = useState<FormActivity[]>([]);
    const [isFetchingActivities, setIsFetchingActivities] = useState(false);
    const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState<Record<string, number>>({});
    // Saare responses (bina pagination ke) sirf Today Follow-up cards ke liye
    const [allResponsesForFollowUps, setAllResponsesForFollowUps] = useState<any[]>([]);
    const [todayFollowUpsData, setTodayFollowUpsData] = useState<any[]>([]);
    const [deleteProgress, setDeleteProgress] = useState<{ current: number; total: number } | null>(null);
    const [isAddingRow, setIsAddingRow] = useState(false);
    const [drawerTab, setDrawerTab] = useState<'edit' | 'history'>('edit');
    const [isSelectAllMenuOpen, setIsSelectAllMenuOpen] = useState(false);
    const [customSelectCount, setCustomSelectCount] = useState("50");
    const [activeStatusDropdown, setActiveStatusDropdown] = useState<string | null>(null);
    const [statusMatrixModal, setStatusMatrixModal] = useState<{ rowId: string, colId: string, label: string, options: any[], val: string, isInternal: boolean } | null>(null);
    const [activeColumnFilterSearch, setActiveColumnFilterSearch] = useState("");

    // Offline Syncing States
    const [isOnline, setIsOnline] = useState(true);
    const [pendingOfflineCount, setPendingOfflineCount] = useState(0);
    const [pendingUpdates, setPendingUpdates] = useState<Record<string, string>>({});

    // AI Filter & Chat States
    const [isAIFilterOpen, setIsAIFilterOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const processedToolCallsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Vercel AI Setup
    const chatBody = useMemo(() => ({
        dataContext: {
            columns: data?.form?.fields || []
        }
    }), [data?.form?.fields]);

    const formId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

    const { messages, input, handleInputChange, handleSubmit: baseHandleSubmit, setMessages, isLoading: isAIFetching } = useChat({
        api: formId ? `/api/crm/forms/${formId}/chat` : undefined,
        body: chatBody
    } as any) as any;

    useEffect(() => {
        const fetchActivities = async () => {
            if (!selectedResponse) {
                setSelectedResponseActivities([]);
                return;
            }
            setIsFetchingActivities(true);
            try {
                const res = await fetch(`/api/crm/forms/${formId}/responses/${selectedResponse.id}/activities`);
                if (!res.ok) throw new Error("Failed to fetch activities");
                const result = await res.json();
                setSelectedResponseActivities(result.activities || []);
            } catch (err) {
                console.error("Fetch activities error:", err);
            } finally {
                setIsFetchingActivities(false);
            }
        };

        fetchActivities();
    }, [selectedResponse?.id, formId]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        if (!(input || "").trim()) return;
        console.log("Submit Clicked, input length:", input.length);
        toast.loading("Analyzing request...", { id: "ai-chat-submit", duration: 1000 });
        baseHandleSubmit(e);
    };

    // Auto-apply filters when tool is called and returns
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
            const toolCals = lastMessage.toolInvocations;
            if (toolCals) {
                toolCals.forEach((invocation: any) => {
                    if (invocation.state === 'result' && !processedToolCallsRef.current.has(invocation.toolCallId)) {
                        processedToolCallsRef.current.add(invocation.toolCallId);

                        if (invocation.toolName === 'applyFilter') {
                            const result = invocation.result;
                            if (result?.filtersApplied && Array.isArray(result.filtersApplied)) {
                                console.log("Applying AI filters:", result.filtersApplied);
                                setConditions(result.filtersApplied.map((f: { columnId?: string; colId?: string; operator?: string; op?: string; value?: any; val?: any }) => ({
                                    colId: f.columnId || f.colId,
                                    op: f.operator || f.op,
                                    val: String(f.value || f.val || "")
                                })));
                            }
                        }

                        if (invocation.toolName === 'generateReport') {
                            console.log("Triggering AI report from tool call with query:", invocation.args?.query);
                            handleGenerateReport(false, invocation.args?.query);
                        }
                    }
                });
            }
        }
    }, [messages]);

    useEffect(() => {
        if (isAIFilterOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isAIFilterOpen]);

    const [isAIReportOpen, setIsAIReportOpen] = useState(false);
    const [aiReportHtml, setAiReportHtml] = useState<string | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [isDynamicReportOpen, setIsDynamicReportOpen] = useState(false);

    const reportSuggestions = [
        { title: "Standard Summary", query: "Generate a simple, easy-to-read summary of the key data points without complex deep analysis." },
        { title: "Strategic Audit (Deep)", query: "Generate a full Strategic Audit and Deep Intelligence report." },
        { title: "Quick Status Update", query: "Provide a brief status update highlighting the most common trends and numbers." },
        { title: "Risk Assessment (Deep)", query: "Deep dive risk assessment, identifying data anomalies and outliers." },
        { title: "Performance ROI", query: "Exhaustive analysis of revenue, volume, and performance metrics." },
        { title: "Basic Data Overview", query: "Give a simple overview of what this data contains and any obvious patterns." }
    ];

    // Permission Buffer
    const [permRoles, setPermRoles] = useState<string[]>([]);
    const [permUsers, setPermUsers] = useState<string[]>([]);
    const [accessUserSearch, setAccessUserSearch] = useState("");
    const [accessUserResults, setAccessUserResults] = useState<{ clerkId: string, email: string }[]>([]);

    // Granular Access Control (GAC)
    const [isPinned, setIsPinned] = useState(false);

    const togglePin = async () => {
        const previousState = isPinned;
        setIsPinned(!isPinned);
        try {
            const res = await fetch(`/api/crm/forms/${params.id}/pin`, { method: "PATCH" });
            if (!res.ok) throw new Error("Pin failed");
            const json = await res.json();
            setIsPinned(json.isPinned);
            if (json.isPinned) toast.success("Pinned to sidebar", { icon: "📌" });
            else toast.success("Unpinned from sidebar");
            window.dispatchEvent(new Event('pinnedFormsUpdated'));
        } catch (err) {
            setIsPinned(previousState);
            toast.error("Could not update pin");
        }
    };

    const [accessTab, setAccessTab] = useState<"GLOBAL" | "COLUMNS">("GLOBAL");
    const [colPermissions, setColPermissions] = useState<{ roles: any, users: any }>({ roles: {}, users: {} });
    const [selectedRoleForGAC, setSelectedRoleForGAC] = useState<string>("ADMIN");
    const [selectedUserForGAC, setSelectedUserForGAC] = useState<{ id: string, email: string } | null>(null);

    // Phase 2 — SaaS Level States
    const [currentView, setCurrentView] = useState<"table" | "kanban">("table");
    const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
    const [conditions, setConditions] = useState<SavedView['conditions']>([]);
    const [filterConjunction, setFilterConjunction] = useState<SavedView['conjunction']>("AND");
    const [savedViews, setSavedViews] = useState<SavedView[]>([]);
    const [autoApply, setAutoApply] = useState(true);
    const [activeViewId, setActiveViewId] = useState<string | null>(null);

    const [activeColumnFilter, setActiveColumnFilter] = useState<string | null>(null);

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

    // Load initial width from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem(`matrix_theme_${params.id}`);
        // Default to a cleaner "ocean" look for the website version if no theme is saved
        if (savedTheme) setCanvasTheme(savedTheme);
        else setCanvasTheme("ocean");

        const saved = localStorage.getItem(`matrix_widths_${params.id}`);
        if (saved) {
            try { setColumnWidths(JSON.parse(saved)); } catch (e) { console.error(e); }
        }
    }, [params.id]);

    // Save width to localStorage on change
    useEffect(() => {
        localStorage.setItem(`matrix_theme_${params.id}`, canvasTheme);
    }, [canvasTheme, params.id]);

    useEffect(() => {
        if (Object.keys(columnWidths).length > 0) {
            localStorage.setItem(`matrix_widths_${params.id}`, JSON.stringify(columnWidths));
        }
    }, [columnWidths, params.id]);



    const [columnOrder, setColumnOrder] = useState<string[]>([]);

    // Column Order Persistence
    useEffect(() => {
        const isPrivileged = (userRole === 'TL' || isMaster || isPureMaster);
        const localOrder = localStorage.getItem(`matrix_order_${params.id}`);

        // 🛡️ RE-ENFORCEMENT PROTECTOR: If not TL/Master, ALWAYS use system default if it exists
        if (!isPrivileged && data?.form?.defaultColumnOrder) {
            setColumnOrder(data.form.defaultColumnOrder);
            return;
        }

        if (localOrder) {
            try { setColumnOrder(JSON.parse(localOrder)); } catch (e) { console.error(e); }
        } else if (data?.form?.defaultColumnOrder) {
            setColumnOrder(data.form.defaultColumnOrder);
        }
    }, [params.id, data?.form?.defaultColumnOrder, userRole, isMaster, isPureMaster]);

    useEffect(() => {
        const isPrivileged = (userRole === 'TL' || isMaster || isPureMaster);
        if (columnOrder.length > 0 && isPrivileged) {
            localStorage.setItem(`matrix_order_${params.id}`, JSON.stringify(columnOrder));
        }
    }, [columnOrder, params.id, userRole, isMaster, isPureMaster]);

    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

    // Hidden Columns Persistence
    useEffect(() => {
        const isPrivileged = (userRole === 'TL' || isMaster || isPureMaster);
        const localHidden = localStorage.getItem(`matrix_hidden_${params.id}`);

        // 🛡️ RE-ENFORCEMENT PROTECTOR: If not TL/Master, ALWAYS use system default if it exists
        if (!isPrivileged && data?.form?.defaultHiddenColumns) {
            setHiddenColumns(data.form.defaultHiddenColumns);
            return;
        }

        if (localHidden) {
            try { setHiddenColumns(JSON.parse(localHidden)); } catch (e) { console.error(e); }
        } else if (data?.form?.defaultHiddenColumns) {
            setHiddenColumns(data.form.defaultHiddenColumns);
        }
    }, [params.id, data?.form?.defaultHiddenColumns, userRole, isMaster, isPureMaster]);

    useEffect(() => {
        const isPrivileged = (userRole === 'TL' || isMaster || isPureMaster);
        if (isPrivileged) {
            localStorage.setItem(`matrix_hidden_${params.id}`, JSON.stringify(hiddenColumns));
        }
    }, [hiddenColumns, params.id, userRole, isMaster, isPureMaster]);

    const [groupByColId, setGroupByColId] = useState<string | null>(null);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [density, setDensity] = useState<"compact" | "standard" | "comfortable">("compact");
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [sortBy, setSortBy] = useState<string>("__submittedAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // New Column Advanced State
    const [newColLabel, setNewColLabel] = useState("");
    const [newColType, setNewColType] = useState("text");
    const [newColOptions, setNewColOptions] = useState<{ label: string, color: string }[]>([]);
    const [newColSettings, setNewColSettings] = useState({ isRequired: false, isLocked: false, showInPublic: false });
    const [newColPermissions, setNewColPermissions] = useState<{ roles: string[], users: string[] }>({ roles: [], users: [] });
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    // Visibility & User Search
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [userResults, setUserResults] = useState<{ clerkId: string, email: string }[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [teamMemberSearch, setTeamMemberSearch] = useState("");
    const [resizing, setResizing] = useState<{ id: string, startX: number, startWidth: number } | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const activeFetchIdRef = useRef<number>(0);
    const tableRef = useRef<HTMLDivElement>(null);

    const prevFiltersRef = useRef({ conditions, filterConjunction, debouncedSearchTerm, rowsPerPage, sortBy, sortOrder, paramsId: params.id });








    const handleResizeStart = (e: React.MouseEvent, id: string, currentWidth: number) => {
        e.preventDefault();
        setResizing({ id, startX: e.clientX, startWidth: currentWidth });
    };

    useEffect(() => {
        if (!resizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - resizing.startX;
            const newWidth = Math.max(80, resizing.startWidth + deltaX);
            setColumnWidths(prev => ({ ...prev, [resizing.id]: newWidth }));
        };

        const handleMouseUp = () => {
            setResizing(null);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [resizing]);

    // Phase 3 — Excel Level Features
    const [selection, setSelection] = useState<{
        start: { row: number, col: number } | null,
        end: { row: number, col: number } | null
    }>({ start: null, end: null });
    const [isSelecting, setIsSelecting] = useState(false);

    const isUserInvolved = useMemo(() => {
        if (!data) return false;
        if (isMaster || isPureMaster) return true;

        const currentClerkId = data.clerkId;
        const currentRole = userRole?.toUpperCase();

        // 1. Explicitly added to form (Access Control settings)
        const visibleUsers = data.form?.visibleToUsers || [];
        const visibleRoles = data.form?.visibleToRoles || [];

        if (currentClerkId && visibleUsers.includes(currentClerkId)) return true;
        if (currentRole && (visibleRoles.includes(currentRole) || ["ADMIN", "MASTER", "TL"].includes(currentRole))) return true;

        // 2. Assigned to any response in this form
        const isAssigned = data.responses?.some(r => r.assignedTo?.includes(currentClerkId || ""));
        if (isAssigned) return true;

        return false;
    }, [data, isMaster, isPureMaster, userRole]);

    const fetchData = async (page = currentPage, limit = rowsPerPage, search = debouncedSearchTerm, sBy = sortBy, sOrder = sortOrder, conds = conditions, conjunction = filterConjunction, isSilent = false) => {
        const fetchId = ++activeFetchIdRef.current;
        setIsDataSynced(false);
        // 🔥 Race Condition Protection: Abort any pending requests before starting a new one
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        console.log(`[FetchData] Syncing matrix with conditions:`, JSON.stringify(conds));
        const syncStartTime = Date.now();
        if (!isSilent) {
            setIsSyncing(true);
        }

        // 1. FAST CACHE LOAD (Run before API Call)
        const cachedDataStr = localStorage.getItem(`matrix_cache_${params.id}`);
        if (cachedDataStr) {
            try {
                const cachedJson = JSON.parse(cachedDataStr);
                const offlineUpdates = JSON.parse(localStorage.getItem(`offlineUpdates-${params.id}`) || '[]');
                if (offlineUpdates.length > 0) {
                    offlineUpdates.forEach((update: any) => {
                        const { responseId, columnId, value, isInternal } = update;
                        if (isInternal) {
                            if (!cachedJson.internalValues) cachedJson.internalValues = [];
                            const idx = cachedJson.internalValues.findIndex((v: any) => v.responseId === responseId && v.columnId === columnId);
                            if (idx > -1) cachedJson.internalValues[idx].value = value;
                            else cachedJson.internalValues.push({ responseId, columnId, value });
                        } else {
                            if (!cachedJson.responses) cachedJson.responses = [];
                            const rIdx = cachedJson.responses.findIndex((r: any) => r.id === responseId);
                            if (rIdx > -1) {
                                if (!cachedJson.responses[rIdx].values) cachedJson.responses[rIdx].values = [];
                                const vIdx = cachedJson.responses[rIdx].values.findIndex((v: any) => v.fieldId === columnId);
                                if (vIdx > -1) cachedJson.responses[rIdx].values[vIdx].value = value;
                                else cachedJson.responses[rIdx].values.push({ fieldId: columnId, value });
                            }
                        }
                    });
                }
                setData(cachedJson);
                setUserRole(cachedJson.userRole);
                setIsMaster(cachedJson.isMaster);
                setIsPureMaster(cachedJson.isPureMaster);
                setLoading(false); // Stop loading instantly so UI shows!
            } catch (e) {
                console.error("Cache parsing error", e);
            }
        }

        // 2. NETWORK SYNC (Silently override cache if online)
        if (!navigator.onLine) return; // if definitely offline, skip API

        try {
            // 🔑 Performance Fix: Removed 99999 limit hack. 
            // The backend already handles filtering, so we should always paginate.
            const effectiveLimit = limit;
            const localToday = new Date().toISOString().split('T')[0];
            const conditionsParam = conds.length > 0 ? `&conditions=${encodeURIComponent(JSON.stringify(conds))}&conjunction=${conjunction}` : "";
            const [dataRes, viewsRes, permRes] = await Promise.all([
                fetch(`/api/crm/forms/${params.id}/responses?page=${page}&limit=${effectiveLimit}&search=${encodeURIComponent(search)}&sortBy=${sBy}&sortOrder=${sOrder}${conditionsParam}&today=${localToday}&_t=${Date.now()}`, { cache: 'no-store', signal }),
                fetch(`/api/crm/forms/${params.id}/views?_t=${Date.now()}`, { cache: 'no-store', signal }),
                fetch(`/api/crm/forms/${params.id}/column-permissions?_t=${Date.now()}`, { cache: 'no-store', signal })
            ]);


            const json = await dataRes.json();

            // Inject offline edits before rendering
            const offlineUpdates = JSON.parse(localStorage.getItem(`offlineUpdates-${params.id}`) || '[]');
            if (offlineUpdates.length > 0) {
                offlineUpdates.forEach((update: any) => {
                    const { responseId, columnId, value, isInternal } = update;
                    if (isInternal) {
                        if (!json.internalValues) json.internalValues = [];
                        const idx = json.internalValues.findIndex((v: any) => v.responseId === responseId && v.columnId === columnId);
                        if (idx > -1) json.internalValues[idx].value = value;
                        else json.internalValues.push({ responseId, columnId, value });
                    } else {
                        if (!json.responses) json.responses = [];
                        const rIdx = json.responses.findIndex((r: any) => r.id === responseId);
                        if (rIdx > -1) {
                            if (!json.responses[rIdx].values) json.responses[rIdx].values = [];
                            const vIdx = json.responses[rIdx].values.findIndex((v: any) => v.fieldId === columnId);
                            if (vIdx > -1) json.responses[rIdx].values[vIdx].value = value;
                            else json.responses[rIdx].values.push({ fieldId: columnId, value });
                        }
                    }
                });
            }

            if (fetchId !== activeFetchIdRef.current) return;
            setData(prev => {
                const serverResponses = json.responses || [];
                if (!prev || !isSilent) {
                    return {
                        ...json,
                        // Ensure counts are preserved from prev if server omitted them (resilience)
                        totalCount: (json.totalCount !== undefined && json.totalCount !== null) ? json.totalCount : (prev?.totalCount ?? 0),
                        filteredCount: (json.filteredCount !== undefined && json.filteredCount !== null) ? json.filteredCount : (prev?.filteredCount ?? 0),
                        totalPages: (json.totalPages !== undefined && json.totalPages !== null) ? json.totalPages : (prev?.totalPages ?? 0),
                        page: json.page ?? (prev?.page ?? 1),
                    };
                }

                // 💎 ATOMIC MERGE (Background/Silent updates only)
                // Use Map for O(1) row lookup to update/insert without losing existing in-memory rows
                const existingResponses = prev.responses || [];
                const responseMap = new Map(existingResponses.map(r => [r.id, r]));
                
                serverResponses.forEach((res: any) => {
                    const existing = responseMap.get(res.id);
                    if (existing) {
                        responseMap.set(res.id, { 
                            ...existing, 
                            ...res,
                            remarks: res.remarks ?? existing.remarks,
                            values: res.values ?? existing.values,
                            payments: res.payments ?? existing.payments,
                            rowColor: res.rowColor ?? existing.rowColor
                        });
                    } else {
                        // If it's a new row not in current view, we can still add it 
                        // though usually background updates target visible IDs
                        responseMap.set(res.id, res);
                    }
                });

                return { 
                    ...json, 
                    responses: Array.from(responseMap.values()),
                    totalCount: (json.totalCount !== undefined && json.totalCount !== null) ? json.totalCount : prev.totalCount,
                    filteredCount: (json.filteredCount !== undefined && json.filteredCount !== null) ? json.filteredCount : prev.filteredCount,
                };
            });

            // Save sanitized cache (Merged state is better for offline/stale-while-revalidate)
            // 🚪 Move outside functional update to avoid React side-effect issues
            const syncJson = { ...json, responses: json.responses }; // mini snapshot
            localStorage.setItem(`matrix_cache_${params.id}`, JSON.stringify(syncJson));
            
            setIsDataSynced(true);
            setUserRole(json.userRole);
            setIsMaster(json.isMaster);
            setIsPureMaster(json.isPureMaster);
            setIsTL(json.userRole === 'TL');

            // Set Pinned State
            if (json.form?.pinnedBy && Array.isArray(json.form.pinnedBy)) {
                setIsPinned(json.form.pinnedBy.includes(json.clerkId));
            }

            if (viewsRes.ok) {
                const viewsJson = await viewsRes.json();
                setSavedViews(viewsJson);
            }

            if (permRes.ok) {
                const permJson = await permRes.json();
                setColPermissions(permJson && Object.keys(permJson).length > 0 ? permJson : { roles: {}, users: {} });
            }

            // Phase 2: Auto-detect Kanban Group Field (Dropdown)
            if (!groupByColId) {
                const firstDropdown = json.internalColumns?.find((c: any) => c.type === "dropdown");
                if (firstDropdown) setGroupByColId(firstDropdown.id);
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log("[FetchData] Request aborted -> Race condition prevented.");
                return;
            }
            console.error("Fetch error:", err);
            if (!navigator.onLine || String(err).includes('Network') || String(err).includes('fetch')) {
                const cachedDataStr = localStorage.getItem(`matrix_cache_${params.id}`);
                if (cachedDataStr) {
                    const cachedJson = JSON.parse(cachedDataStr);

                    const offlineUpdates = JSON.parse(localStorage.getItem(`offlineUpdates-${params.id}`) || '[]');
                    if (offlineUpdates.length > 0) {
                        offlineUpdates.forEach((update: any) => {
                            const { responseId, columnId, value, isInternal } = update;
                            if (isInternal) {
                                if (!cachedJson.internalValues) cachedJson.internalValues = [];
                                const idx = cachedJson.internalValues.findIndex((v: any) => v.responseId === responseId && v.columnId === columnId);
                                if (idx > -1) cachedJson.internalValues[idx].value = value;
                                else cachedJson.internalValues.push({ responseId, columnId, value });
                            } else {
                                if (!cachedJson.responses) cachedJson.responses = [];
                                const rIdx = cachedJson.responses.findIndex((r: any) => r.id === responseId);
                                if (rIdx > -1) {
                                    if (!cachedJson.responses[rIdx].values) cachedJson.responses[rIdx].values = [];
                                    const vIdx = cachedJson.responses[rIdx].values.findIndex((v: any) => v.fieldId === columnId);
                                    if (vIdx > -1) cachedJson.responses[rIdx].values[vIdx].value = value;
                                    else cachedJson.responses[rIdx].values.push({ fieldId: columnId, value });
                                }
                            }
                        });
                    }
                    setData(cachedJson);
                    setUserRole(cachedJson.userRole);
                    setIsMaster(cachedJson.isMaster);
                    setIsPureMaster(cachedJson.isPureMaster);
                    toast("Restored offline session", { icon: "📶" });
                } else {
                    toast.error("Offline and no cached data available.", { id: 'offline-err' });
                }
            } else {
                toast.error("Failed to sync matrix");
            }
        } finally {
            if (!isSilent && !signal.aborted) {
                const elapsed = Date.now() - syncStartTime;
                if (elapsed < 800) {
                    await new Promise(resolve => setTimeout(resolve, 800 - elapsed));
                }
                setIsSyncing(false);
            }
        }
    };

    const handleAddRow = async () => {
        if (!data) return;
        setIsAddingRow(true);
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const previousData = { ...data };

        // Optimistic Update
        const newResponse: FormResponse = {
            id: tempId,
            submittedAt: new Date().toISOString(),
            submittedByName: "Creating...",
            values: [],
            isOptimistic: true // Custom flag
        } as any;

        setData(prev => {
            if (!prev) return prev;
            const next = { ...prev, responses: [...(prev.responses || []), newResponse] };
            // Move to last page
            setTimeout(() => {
                setCurrentPage(Math.ceil((next.responses?.length || 0) / rowsPerPage) || 1);
            }, 0);
            return next;
        });
        toast.loading("Deploying new sector...", { id: "add-row" });

        try {
            const res = await fetch(`/api/crm/forms/${params.id}/responses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ values: {} })
            });
            if (res.ok) {
                const result = await res.json();
                if (!result || !result.response) {
                    throw new Error("Invalid response format");
                }
                toast.success("Sector Deployed", { id: "add-row" });
                // Replace temp with real data and update internal values IDs
                setData(prev => {
                    if (!prev || !prev.responses) return prev;
                    const realId = result.response.id;
                    const responses = prev.responses.map(r => r.id === tempId ? { ...result.response, isOptimistic: false } : r);

                    // CRITICAL: Update orphaned internal values
                    const internalValues = (prev.internalValues || []).map(iv =>
                        iv.responseId === tempId ? { ...iv, responseId: realId } : iv
                    );

                    return { ...prev, responses, internalValues };
                });

                // Keep the new row highlighted for focus
                setHighlightedRowId(result.response.id);
            } else {
                toast.error("Deployment failed", { id: "add-row" });
                setData(previousData); // Rollback
            }
        } catch (err) {
            toast.error("Matrix failure", { id: "add-row" });
            setData(previousData); // Rollback
        } finally {
            setIsAddingRow(false);
        }
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
    const searchAccessUsers = async (q: string) => {
        setAccessUserSearch(q);
        if (q.length < 2) { setAccessUserResults([]); return; }
        try {
            const res = await fetch(`/api/crm/users?q=${q}`);
            const json = await res.json();
            setAccessUserResults(json);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (searchParams.get("fullview") === "true") {
            setIsFullScreen(true);
        }
    }, [searchParams]);

    useEffect(() => {
        // 💎 SMART RESET: Only reset to page 1 if FILTERS have changed
        const filtersChanged = 
            prevFiltersRef.current.conditions !== conditions ||
            prevFiltersRef.current.filterConjunction !== filterConjunction ||
            prevFiltersRef.current.debouncedSearchTerm !== debouncedSearchTerm ||
            prevFiltersRef.current.rowsPerPage !== rowsPerPage ||
            prevFiltersRef.current.sortBy !== sortBy ||
            prevFiltersRef.current.sortOrder !== sortOrder;

        if (filtersChanged && currentPage !== 1) {
            prevFiltersRef.current = { ...prevFiltersRef.current, conditions, filterConjunction, debouncedSearchTerm, rowsPerPage, sortBy, sortOrder };
            setCurrentPage(1);
            return;
        }

        // Update ref if not changed but page moved
        prevFiltersRef.current = { ...prevFiltersRef.current, conditions, filterConjunction, debouncedSearchTerm, rowsPerPage, sortBy, sortOrder };
        
        if (isLoaded && user) {
            fetchData(currentPage, rowsPerPage, debouncedSearchTerm, sortBy, sortOrder, conditions, filterConjunction);
        }
    }, [params.id, isLoaded, user, currentPage, rowsPerPage, debouncedSearchTerm, sortBy, sortOrder, conditions, filterConjunction]);

    // Background mein limit ke saath records fetch karo (max 500 for cards/filters)
    // Yeh performance release ke liye zaroori hai
    useEffect(() => {
        if (!isLoaded || !user) return;
        const fetchBackgroundData = async () => {
            try {
                // 1. Fetch Today's Follow-ups specifically (Crucial for cards)
                const followUpsRes = await fetch(
                    `/api/crm/forms/${params.id}/responses?page=1&limit=100&conditions=${encodeURIComponent(JSON.stringify([{ colId: "__nextFollowUpDate", op: "today" }]))}&_t=${Date.now()}`,
                    { cache: 'no-store' }
                );
                if (followUpsRes.ok) {
                    const json = await followUpsRes.json();
                    setTodayFollowUpsData(json.responses || []);
                }

                // 2. Disabled redundant full-matrix background fetch to save DB connections
                // (The grid already handles current page results)
                /* 
                const latestRes = await fetch(
                    `/api/crm/forms/${params.id}/responses?page=1&limit=100&sortBy=__submittedAt&sortOrder=desc&_t=${Date.now()}`,
                    { cache: 'no-store' }
                );
                if (latestRes.ok) { ... }
                */
            } catch (err) {
                console.error('Background fetch failed:', err);
            }
        };
        // 🚀 ULTRA LAZY LOAD: Delay background stat fetches to clear network pipeline for the main grid
        const timerId = setTimeout(() => {
            fetchBackgroundData();
        }, 10000); // 10s delay to ensure grid is 100% interactive first
        return () => clearTimeout(timerId);
    }, [params.id, isLoaded, user]);

    useEffect(() => {
        if (!isLoaded || !user) return;
        const fetchMembers = async () => {
            try {
                const res = await fetch("/api/crm/users?limit=500");
                if (res.ok) {
                    const data = await res.json();
                    setTeamMembers(data);
                }
            } catch (err) {
                console.error("Error fetching team members:", err);
            }
        };
        fetchMembers();
    }, [isLoaded, user]);

    // Check offline status and pending count on mount
    useEffect(() => {
        setIsOnline(navigator.onLine);
        const pending = JSON.parse(localStorage.getItem(`offlineUpdates-${params.id}`) || '[]');
        setPendingOfflineCount(pending.length);
    }, [params.id, data]); // re-check when data changes

    const handleManualSync = async () => {
        if (!navigator.onLine) {
            toast.error("Shield down: Connectivity required for sync.");
            return;
        }
        const offlineUpdates = JSON.parse(localStorage.getItem(`offlineUpdates-${params.id}`) || '[]');
        if (offlineUpdates.length > 0) {
            toast.loading(`Syncing ${offlineUpdates.length} matrix interactions...`, { id: "offline-sync" });
            let successCount = 0;
            const failedUpdates: any[] = [];

            for (const update of offlineUpdates) {
                try {
                    // 🛡️ DATA PROTECTION: Determine correct endpoint based on update type
                    let res;
                    if (update.type === 'STATUS_UPDATE') {
                        res = await fetch(`/api/crm/forms/${params.id}/responses/${update.responseId}/remarks`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                remark: update.remark,
                                followUpStatus: update.followUpStatus,
                                columnId: update.columnId
                            })
                        });
                    } else {
                        // Default cell update
                        res = await fetch(`/api/crm/forms/${params.id}/responses`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(update)
                        });
                    }

                    if (res.ok) {
                        successCount++;
                    } else {
                        console.error("[Sync] Entry failed:", await res.text());
                        failedUpdates.push(update);
                    }
                } catch (err) {
                    console.error("[Sync] Network error for entry:", err);
                    failedUpdates.push(update);
                }
            }

            // 💎 Sync Resolution
            if (failedUpdates.length === 0) {
                localStorage.removeItem(`offlineUpdates-${params.id}`);
                setPendingOfflineCount(0);
                toast.success("All interactions secured and synced.", { id: "offline-sync" });
            } else {
                localStorage.setItem(`offlineUpdates-${params.id}`, JSON.stringify(failedUpdates));
                setPendingOfflineCount(failedUpdates.length);
                toast.error(`Partial sync: ${successCount}/${offlineUpdates.length} secured.`, { id: "offline-sync" });
            }
            fetchData(currentPage, rowsPerPage, searchTerm, sortBy, sortOrder, conditions, filterConjunction, true);
        } else {
            toast("Matrix is consistent. No sync required.", { icon: '✅' });
        }
    };

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            handleManualSync();
        };
        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [params.id]);

    useEffect(() => {
        if (data?.form) {
            setPermRoles(data.form.visibleToRoles || []);
            setPermUsers(data.form.visibleToUsers || []);
        }
    }, [data]);

    const handleSavePermissions = async () => {
        try {
            const res = await fetch(`/api/crm/forms/${params.id}/bulk/visibility`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "FORM",
                    visibleToRoles: permRoles,
                    visibleToUsers: permUsers
                })
            });
            if (res.ok) {
                toast.success("Security policies updated");
                setIsAccessModalOpen(false);
                fetchData();
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || "Policy breach: update failed");
            }
        } catch (err) {
            toast.error("Network error during security sync");
        }
    };

    const handleSaveColumnPermissions = async () => {
        try {
            const res = await fetch(`/api/crm/forms/${params.id}/column-permissions`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(colPermissions)
            });
            if (res.ok) {
                toast.success("Column Access Matrix Synchronized");
                setIsAccessModalOpen(false);
                fetchData();
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || "Sync failed: access restricted");
            }
        } catch (err) {
            toast.error("Failed to sync column permissions");
        }
    };

    const handleDeleteRow = async (responseId: string) => {
        if (!isMaster && !isPureMaster) return toast.error("MASTER MODE REQUIRED");
        if (!confirm("Are you sure you want to delete this record? This cannot be undone.")) return;
        if (!data) return;

        const previousData = { ...data };
        const loadingToast = toast.loading("Purging sector...", { id: `del-${responseId}` });

        // Optimistic Delete
        setData(prev => prev ? { ...prev, responses: prev.responses.filter(r => r.id !== responseId) } : prev);

        try {
            const res = await fetch(`/api/crm/forms/${params.id}/responses?responseId=${responseId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                toast.success("Sector Purged", { id: `del-${responseId}` });
            } else {
                const error = await res.json();
                toast.error(error.error || "Purge failed", { id: `del-${responseId}` });
                setData(previousData); // Rollback
            }
        } catch (err) {
            toast.error("Process interrupted", { id: `del-${responseId}` });
            setData(previousData); // Rollback
        }
    };

    const handleBulkDelete = async () => {
        console.log("[BulkDelete] Button clicked. selectedRows:", selectedRows.length);
        console.log("[BulkDelete] Role status - isMaster:", isMaster, "isPureMaster:", isPureMaster);

        if (!isMaster && !isPureMaster) {
            console.error("[BulkDelete] Permission denied: Not a Master or PureMaster");
            return toast.error("MASTER MODE REQUIRED");
        }
        if (selectedRows.length === 0) {
            console.warn("[BulkDelete] Aborted: No rows selected");
            return;
        }

        const confirmMsg = `PURGE PROTOCOL: Are you sure you want to permanently delete ${selectedRows.length} records? This action cannot be undone.`;
        if (!window.confirm(confirmMsg)) {
            console.log("[BulkDelete] Aborted by user via confirm dialog");
            return;
        }

        toast.loading(`Initializing purge of ${selectedRows.length} records...`, { id: "bulk-delete-start" });
        setIsBulkDeleting(true);
        setDeleteProgress({ current: 0, total: selectedRows.length });
        const batchSize = 100;
        const total = selectedRows.length;
        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        console.log(`[BulkDelete] Starting purge of ${total} records in batches of ${batchSize}`);

        try {
            for (let i = 0; i < total; i += batchSize) {
                const batch = selectedRows.slice(i, i + batchSize);
                const currentBatchSize = batch.length;

                console.log(`[BulkDelete] Deleting batch ${Math.floor(i / batchSize) + 1} (${batch.length} records)...`);

                try {
                    const res = await fetch(`/api/crm/forms/${params.id}/responses`, {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ids: batch })
                    });

                    if (res.ok) {
                        const result = await res.json();
                        successCount += (result.deleted || batch.length);
                        console.log(`[BulkDelete] Successfully deleted ${batch.length} records.`);
                    } else {
                        const errText = await res.text();
                        console.error(`[BulkDelete] Batch failed:`, errText);
                        errors.push(`Batch starting at ${i + 1}: ${errText}`);
                        failCount += batch.length;
                    }
                } catch (batchErr: any) {
                    console.error(`[BulkDelete] Network error for batch at ${i}:`, batchErr);
                    errors.push(`Network error at ${i + 1}: ${batchErr.message}`);
                    failCount += batch.length;
                }

                setDeleteProgress(prev => prev ? { ...prev, current: Math.min(i + batchSize, total) } : null);
            }

            if (errors.length > 0) {
                console.group("Bulk Delete Errors");
                errors.forEach(e => console.error(e));
                console.groupEnd();
                toast.error(`Purge completed with ${errors.length} errors. See console for logs.`);
            } else {
                toast.success(`Successfully purged ${successCount} records.`);
            }

            setSelectedRows([]);
            await fetchData();
        } catch (globalErr: any) {
            console.error("[BulkDelete] Critical failure:", globalErr);
            toast.error(`Critical failure: ${globalErr.message}`);
        } finally {
            setIsBulkDeleting(false);
            setTimeout(() => setDeleteProgress(null), 1000);
        }
    };

    // AI chatbot and filters are now handled by useChat at the top level.


    // ⚡ Flash Recovery Engine: Identify items needing attention TODAY
    const todayFollowUps = useMemo(() => {
        // use specifically fetched todayFollowUpsData
        if (todayFollowUpsData.length > 0) return todayFollowUpsData;

        // Fallback to filtering from local data if background fetch hasn't finished
        const source = allResponsesForFollowUps.length > 0 ? allResponsesForFollowUps : (data?.responses || []);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return source.filter(res => {
            const remarks = res.remarks || [];
            const latestRemark = remarks?.[0];
            if (latestRemark?.nextFollowUpDate && latestRemark?.followUpStatus !== 'Closed') {
                const followUpDate = new Date(latestRemark.nextFollowUpDate);
                followUpDate.setHours(0, 0, 0, 0);
                return followUpDate.getTime() === today.getTime();
            }
            return false;
        });
    }, [todayFollowUpsData, allResponsesForFollowUps, data?.responses]);

    const getColumns = useMemo(() => {
        if (!data) return [];
        const deletedSystemCols = (data.form?.columnPermissions as any)?.deletedSystemCols || [];
        const assignedIds = new Set<string>();
        const responsesSource = allResponsesForFollowUps.length > 0 ? allResponsesForFollowUps : (data?.responses || []);
        responsesSource.forEach((res: any) => {
            const rawAssigned = res.assignedTo || [];
            const rawVisible = res.visibleToUsers || [];
            const defaultVisibleIds: string[] = [];
            if (res.submittedBy) defaultVisibleIds.push(res.submittedBy);
            const assignedUsers = Array.from(new Set([...rawAssigned, ...rawVisible, ...defaultVisibleIds]));
            assignedUsers.forEach(uid => assignedIds.add(uid as string));
        });
        const teamOptions = teamMembers
            .filter(tm => assignedIds.has(tm.clerkId))
            .map(tm => {
                const name = tm.firstName ? `${tm.firstName} ${tm.lastName || ''}`.trim() : (tm.email ? tm.email.split('@')[0] : tm.clerkId);
                return { label: name, value: tm.clerkId };
            });
        const baseCols: any[] = [
            { id: "__profile", label: "Profile", isPublic: false, type: "static" },
            { id: "__submittedAt", label: "Date", isPublic: false, type: "date" },
            { id: "__contributor", label: "Submitter info", isPublic: false, type: "static" },
            { id: "__assigned", label: "Assigned To", isPublic: false, type: "user", options: teamOptions }
        ];

        if (!deletedSystemCols.includes("__followup")) baseCols.push({ id: "__followup", label: "Follow-ups", isPublic: false, type: "static" });
        if (!deletedSystemCols.includes("__recentRemark")) baseCols.push({ id: "__recentRemark", label: "Recent Remark", isPublic: false, type: "static" });
        if (!deletedSystemCols.includes("__nextFollowUpDate")) baseCols.push({ id: "__nextFollowUpDate", label: "Next Follow-up Date", isPublic: false, type: "date" });
        if (!deletedSystemCols.includes("__followUpStatus")) baseCols.push({ id: "__followUpStatus", label: "Calling Status", isPublic: false, type: "static" });

        const hasSalesHub = (data?.internalColumns || []).some((c: any) => c.label === "Amount");
        if (!deletedSystemCols.includes("__payment") && hasSalesHub) {
            baseCols.push({ id: "__payment", label: "💰 Payment", isPublic: false, type: "static" });
        }

        (data.form?.fields || []).forEach(f => baseCols.push({ ...f, isInternal: false }));

        // Filter duplicate internal columns to avoid "extras"
        const systemLabels = ["Recent Remark", "Next Follow-up Date", "Calling Status", "Next Follow up date"];
        (data.internalColumns || []).forEach(ic => {
            if (!systemLabels.includes(ic.label)) {
                baseCols.push({ ...ic, isInternal: true });
            }
        });

        const currentClerkId = (data as any).clerkId;
        const gac = colPermissions || { roles: {}, users: {} };
        const rolePerms = gac.roles?.[userRole] || {};
        const userPerms = gac.users?.[currentClerkId] || {};
        const colAccess = { ...rolePerms, ...userPerms };

        let filtered = baseCols;
        if (!isMaster && !isPureMaster) {
            filtered = baseCols.filter(col => {
                const perm = colAccess[col.id];
                if (perm === "hide") return false;

                // NEW: Sensitive Shield logic — filter internal columns by default if no explicit permission
                if (col.isInternal && !perm) {
                    const roles = col.visibleToRoles || [];
                    const users = col.visibleToUsers || [];
                    if (roles.length > 0 || users.length > 0) {
                        return roles.includes(userRole) || users.includes(currentClerkId);
                    }
                    // If it's internal and has no roles/users/explicit-perm, we hide it for staff.
                    // This prevents internal data leakage when new internal columns are added.
                    return ["MASTER", "ADMIN", "TL"].includes(userRole);
                }
                return true;
            });
        }

        let ordered = filtered;
        if (columnOrder.length > 0) {
            ordered = columnOrder.map(id => filtered.find(c => c.id === id)).filter(Boolean) as any[];
            filtered.forEach(bc => {
                if (!columnOrder.includes(bc.id)) ordered.push(bc);
            });
        }

        return ordered.filter(c => !hiddenColumns.includes(c.id));
    }, [data, hiddenColumns, columnOrder, userRole, colPermissions, isMaster, isPureMaster, teamMembers]);

    const allColumns = useMemo(() => {
        if (!data) return [];
        const deletedSystemCols = (data.form?.columnPermissions as any)?.deletedSystemCols || [];
        const assignedIds = new Set<string>();
        const responsesSource = allResponsesForFollowUps.length > 0 ? allResponsesForFollowUps : (data?.responses || []);
        responsesSource.forEach((res: any) => {
            const rawAssigned = res.assignedTo || [];
            const rawVisible = res.visibleToUsers || [];
            const defaultVisibleIds: string[] = [];
            if (res.submittedBy) defaultVisibleIds.push(res.submittedBy);
            const assignedUsers = Array.from(new Set([...rawAssigned, ...rawVisible, ...defaultVisibleIds]));
            assignedUsers.forEach(uid => assignedIds.add(uid as string));
        });
        const teamOptions = teamMembers
            .filter(tm => assignedIds.has(tm.clerkId))
            .map(tm => {
                const name = tm.firstName ? `${tm.firstName} ${tm.lastName || ''}`.trim() : (tm.email ? tm.email.split('@')[0] : tm.clerkId);
                return { label: name, value: tm.clerkId };
            });
        const baseCols: any[] = [
            { id: "__profile", label: "Profile", isPublic: false, type: "static" },
            { id: "__submittedAt", label: "Date", isPublic: false, type: "date" },
            { id: "__contributor", label: "Submitter info", isPublic: false, type: "static" },
            { id: "__assigned", label: "Assigned To", isPublic: false, type: "user", options: teamOptions }
        ];

        if (!deletedSystemCols.includes("__followup")) baseCols.push({ id: "__followup", label: "Follow-ups", isPublic: false, type: "static" });
        if (!deletedSystemCols.includes("__recentRemark")) baseCols.push({ id: "__recentRemark", label: "Recent Remark", isPublic: false, type: "static" });
        if (!deletedSystemCols.includes("__nextFollowUpDate")) baseCols.push({ id: "__nextFollowUpDate", label: "Next Follow-up Date", isPublic: false, type: "date" });
        if (!deletedSystemCols.includes("__followUpStatus")) baseCols.push({ id: "__followUpStatus", label: "Calling Status", isPublic: false, type: "static" });

        const hasSalesHub = (data?.internalColumns || []).some((c: any) => c.label === "Amount");
        if (!deletedSystemCols.includes("__payment") && hasSalesHub) {
            baseCols.push({ id: "__payment", label: "💰 Payment", isPublic: false, type: "static" });
        }

        (data.form?.fields || []).forEach(f => baseCols.push({ ...f, isInternal: false }));

        const systemLabels = ["Recent Remark", "Next Follow-up Date", "Calling Status", "Next Follow up date"];
        (data.internalColumns || []).forEach(ic => {
            if (!systemLabels.includes(ic.label)) {
                baseCols.push({ ...ic, isInternal: true });
            }
        });

        let ordered = baseCols;
        if (columnOrder.length > 0) {
            ordered = columnOrder.map(id => baseCols.find(c => c.id === id)).filter(Boolean) as any[];
            baseCols.forEach(bc => {
                if (!columnOrder.includes(bc.id)) ordered.push(bc);
            });
        }
        return ordered;
    }, [data, columnOrder, teamMembers]);

    const moveColumn = (index: number, direction: 'up' | 'down') => {
        const currentOrder = allColumns.map(c => c.id);
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= currentOrder.length) return;

        const newOrder = [...currentOrder];
        const temp = newOrder[index];
        newOrder[index] = newOrder[targetIndex];
        newOrder[targetIndex] = temp;
        setColumnOrder(newOrder);
    };

    const handleSaveGlobalLayout = async () => {
        if (!isPureMaster) {
            toast.error("Only Master Authority can push global protocols");
            return;
        }

        const confirmPush = confirm("Push this layout as the GLOBAL MATRIX PROTOCOL? This will LOCK the format for all Sellers and Interns across the entire system.");
        if (!confirmPush) return;

        // CRITICAL: Calculate FULL current order to ensure ALL columns are explicitly synced
        const fullCurrentOrder = allColumns.map(c => c.id);

        setIsSyncing(true);
        try {
            const res = await fetch(`/api/crm/forms/${params.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    defaultColumnOrder: fullCurrentOrder,
                    defaultHiddenColumns: hiddenColumns
                })
            });
            if (!res.ok) throw new Error("Push failed");

            toast.success("Master Protocol Synchronized! Everyone is now locked to this format.", { icon: "🌎" });
            fetchData(currentPage, rowsPerPage, debouncedSearchTerm, sortBy, sortOrder, conditions, filterConjunction, true);
        } catch (err) {
            toast.error("Master protocol sync failed");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleResetToSystemDefault = () => {
        localStorage.removeItem(`matrix_order_${params.id}`);
        localStorage.removeItem(`matrix_hidden_${params.id}`);
        if (data?.form) {
            setColumnOrder(data.form.defaultColumnOrder || []);
            setHiddenColumns(data.form.defaultHiddenColumns || []);
            toast.success("Synchronized with Master Global Protocol");
        }
    };

    const totalTableWidth = useMemo(() => {
        if (!data) return 1400;
        let w = isPureMaster ? 70 : 50; // 70px if master, 50px if normal for row selector column
        getColumns.forEach(c => {
            w += (columnWidths[c.id] || (c.id === "__profile" ? 70 : c.id === "__contributor" ? 220 : c.id === "__assigned" ? 200 : 180));
        });
        return w;
    }, [columnWidths, data, isMaster, isPureMaster, getColumns]);

    const getCellValue = (responseId: string, colId: string, isInternal: boolean) => {
        const cellKey = `${responseId}-${colId}`;
        if (pendingUpdates[cellKey] !== undefined) return pendingUpdates[cellKey];
        if (!data) return "";
        const resp = data.responses?.find(r => r.id === responseId);
        if (!resp) return "";

        if (colId === "__contributor") return resp.submittedByName || "";
        if (colId === "__submittedAt") return resp.submittedAt || "";
        if (colId === "__assigned") {
            const rawAssigned = resp.assignedTo || [];
            const rawVisible = resp.visibleToUsers || [];
            const defaultVisibleIds: string[] = [];
            if (resp.submittedBy) defaultVisibleIds.push(resp.submittedBy);
            const assignedUsers = Array.from(new Set([...rawAssigned, ...rawVisible, ...defaultVisibleIds]));
            return assignedUsers.map((uid: string) => { const tm = teamMembers.find(t => t.clerkId === uid); return tm ? (tm.firstName ? `${tm.firstName} ${tm.lastName || ''}`.trim() : (tm.email ? tm.email.split('@')[0] : uid)) : uid; }).join(", ");
        }

        // 🟢 FOLLOW-UP BOARD SYSTEM COLUMNS
        const remarks = (resp as any).remarks || [];
        const latestRemark = remarks[0];
        if (colId === "__nextFollowUpDate") return latestRemark?.nextFollowUpDate || "";
        if (colId === "__followUpStatus") return latestRemark?.followUpStatus || "";
        if (colId === "__recentRemark") return latestRemark?.remark || "";
        if (colId === "__followup") return latestRemark?.remark || ""; // Fallback for general follow-up col


        if (isInternal) {
            const internalVal = data.internalValues?.find(v => v.responseId === responseId && v.columnId === colId)?.value;
            // High priority check for status consistency from response object properties
            return internalVal || (resp as any)[colId] || "";
        }

        const fieldVal = resp.values?.find(v => v.fieldId === colId)?.value;
        return fieldVal || (resp as any)[colId] || "";
    };

    const [isReportCached, setIsReportCached] = useState(false);
    const [activeReportQuery, setActiveReportQuery] = useState("Generate a comprehensive analysis summary of this tabular data.");

    const handleGenerateReport = async (force: boolean = false, customQuery?: string) => {
        if (!data || !data.form) return;

        const queryToUse = customQuery || (force ? activeReportQuery : "Generate a comprehensive analysis summary of this tabular data.");
        if (customQuery) setActiveReportQuery(customQuery);

        setIsGeneratingReport(true);
        try {
            const allColumns = [
                ...data.form.fields.map((f: any) => ({ id: f.id, label: f.label, type: f.type })),
                ...data.internalColumns.map((c: any) => ({ id: c.id, label: c.label, type: c.type }))
            ];

            const rowData = (data.responses || []).map((r: any) => {
                let row: any = {};
                row["Contributor"] = r.submittedByName || "Guest";
                allColumns.forEach(c => {
                    const isInternal = data.internalColumns.some((ic: any) => ic.id === c.id);
                    row[c.label] = getCellValue(r.id, c.id, isInternal) || "";
                });
                return row;
            });

            const res = await fetch(`/api/crm/forms/${params.id}/ai-report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: queryToUse,
                    columns: allColumns,
                    rowData,
                    forceRefresh: force
                })
            });

            if (res.ok) {
                const result = await res.json();
                setAiReportHtml(result.html);
                setIsReportCached(!!result.isCached);
                setIsAIReportOpen(true);
                setIsAIFilterOpen(false);
                toast.success(result.isCached ? "Displaying Archived Analysis" : "Fresh AI Analysis Generated!");
            } else {
                toast.error("Failed to generate AI report.");
            }
        } catch (error) {
            toast.error("Failed to connect to AI Analysis Engine.");
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const filteredResponses = useMemo(() => {
        if (!data) return [];
        const isServerFiltering = data.totalPages !== undefined;
        let results = data.responses || [];

        // 🛡️ REDUNDANCY SHIELD: Skip client-side filtering if server already did the heavy lifting
        // This ensures pagination fidelity (displaying full pages of filtered results)
        if (isServerFiltering) {
            return results;
        }

        if (debouncedSearchTerm) {
            const term = debouncedSearchTerm.toLowerCase();
            results = results.filter(r =>
                (r.submittedByName || "").toLowerCase().includes(term) ||
                (r.submittedBy || "").toLowerCase().includes(term) ||
                (r.assignedTo || []).some(uid => uid.toLowerCase().includes(term)) ||
                (r.values && Array.isArray(r.values) && r.values.some(v => (v.value || "").toLowerCase().includes(term))) ||
                (data.internalValues && Array.isArray(data.internalValues) && data.internalValues.some(iv => iv.responseId === r.id && (iv.value || "").toLowerCase().includes(term))) ||
                (r.remarks || []).some((rem: any) => (rem.remark || "").toLowerCase().includes(term) || (rem.followUpStatus || "").toLowerCase().includes(term))
            );
        }

        if (conditions.length > 0) {
            const before = results.length;
            results = results.filter(r => {
                // Group conditions by column ID so multiple selections on the same column work as OR
                const groupedConditions = conditions.reduce((acc, cond) => {
                    if (!acc[cond.colId]) acc[cond.colId] = [];
                    acc[cond.colId].push(cond);
                    return acc;
                }, {} as Record<string, typeof conditions>);

                const groupMatches = Object.entries(groupedConditions).map(([colId, conds]) => {
                    const col = getColumns.find(c => c.id === colId);
                    const isInternal = col?.isInternal;

                    if (colId === "__assigned") {
                        const result = (conds as any[]).some((cond: any) => {
                            const fullVal = (cond.val || "").toString();
                            let targetId = fullVal;
                            let isStrict = fullVal.startsWith("__STRICT_ASSIGNED__");
                            let isGlobal = fullVal.startsWith("__GLOBAL_OWNER__");

                            if (isStrict) targetId = fullVal.replace("__STRICT_ASSIGNED__", "");
                            if (isGlobal) targetId = fullVal.replace("__GLOBAL_OWNER__", "");

                            const rawAssigned = (r.assignedTo || []).filter((id: any) => !!id);
                            const rawVisible = (r.visibleToUsers || []).filter((id: any) => !!id);

                            const isUserAssigned = rawAssigned.includes(targetId) || rawVisible.includes(targetId);
                            const isSubmitter = r.submittedBy === targetId;

                            let match = false;
                            if (cond.op === "equals" || cond.op === "contains") {
                                if (isStrict) {
                                    match = isUserAssigned && !isSubmitter;
                                } else if (isGlobal) {
                                    match = isUserAssigned || isSubmitter;
                                } else {
                                    // Default behavior for standard IDs or names
                                    match = isUserAssigned || (rawAssigned.length === 0 && isSubmitter);
                                }
                            } else if (cond.op === "is_empty") {
                                match = rawAssigned.length === 0 && !r.submittedBy;
                            } else if (cond.op === "is_not_empty") {
                                match = rawAssigned.length > 0 || !!r.submittedBy;
                            } else if (cond.op === "not_equals") {
                                if (isStrict) match = !isUserAssigned || isSubmitter;
                                else if (isGlobal) match = !isUserAssigned && !isSubmitter;
                                else match = !isUserAssigned && !(rawAssigned.length === 0 && isSubmitter);
                            }

                            return match;
                        });
                        return result;
                    }

                    // ⚡ Value Logic: Try internal first, then fields if empty (for custom columns)
                    const cellVal = getCellValue(r.id, colId, true) || getCellValue(r.id, colId, false);
                    const val = (cellVal || "").toString().toLowerCase().replace(/\s+/g, ' ').trim();

                    const conditionMatches = (conds as any[]).map(cond => {
                        const targetVal = (cond.val || "").toString().toLowerCase().replace(/\s+/g, ' ').trim();
                        const targetVal2 = (cond.val2 || "").toString().toLowerCase().replace(/\s+/g, ' ').trim();

                        switch (cond.op) {
                            case "equals": return val === targetVal;
                            case "not_equals": return val !== targetVal;
                            case "contains": return val.includes(targetVal);
                            case "one_of": {
                                const targets = (cond.val || "").split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean);
                                return targets.includes(val);
                            }
                            case "starts_with": return val.startsWith(targetVal);
                            case "ends_with": return val.endsWith(targetVal);
                            case "is_empty": return (val === "" || val === null || val === "undefined" || val === "null" || (val || "").trim().length === 0);
                            case "is_not_empty": return (val || "").trim().length > 0 && val !== "undefined" && val !== "null";
                            case "eq": return parseFloat(val) === parseFloat(targetVal);
                            case "gt": return parseFloat(val) > parseFloat(targetVal);
                            case "lt": return parseFloat(val) < parseFloat(targetVal);
                            case "gte": return parseFloat(val) >= parseFloat(targetVal);
                            case "lte": return parseFloat(val) <= parseFloat(targetVal);
                            case "between": return parseFloat(val) >= parseFloat(targetVal) && parseFloat(val) <= parseFloat(targetVal2);
                            case "is_true": return val === "true";
                            case "is_false": return val === "false" || val === "";
                            case "today": {
                                const d = new Date(cellVal);
                                const now = new Date();
                                return !isNaN(d.getTime()) && d.toDateString() === now.toDateString();
                            }
                            case "this_week": {
                                const d = new Date(cellVal);
                                const now = new Date();
                                const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                                return !isNaN(d.getTime()) && d >= startOfWeek;
                            }
                            case "before": return !isNaN(new Date(cellVal).getTime()) && new Date(cellVal) < new Date(cond.val);
                            case "after": return !isNaN(new Date(cellVal).getTime()) && new Date(cellVal) > new Date(cond.val);
                            case "exact_date": {
                                const d = new Date(cellVal);
                                const target = new Date(cond.val);
                                return !isNaN(d.getTime()) && !isNaN(target.getTime()) && d.toDateString() === target.toDateString();
                            }
                            default: return true;
                        }
                    });

                    return conditionMatches.some(m => m);
                });

                if (filterConjunction === "AND") return groupMatches.every(m => m);
                return groupMatches.some(m => m);
            });
            if (isServerFiltering && results.length < before) {
                console.warn(`[FilterDebug] Local CONDITION filter dropped ${before - results.length} rows that server included! (Date/Timezone mismatch or logic difference)`);
            }
        }
        return results;
    }, [data, debouncedSearchTerm, conditions, getCellValue, filterConjunction, getColumns]);

    const columnMetrics = useMemo(() => {
        const columns = getColumns;
        const metrics: Record<string, { width: number; left: number; isSticky: boolean }> = {};
        const baseLeft = isPureMaster ? 70 : 56;
        let currentLeft = baseLeft;

        columns.forEach((col, idx) => {
            const width = columnWidths[col.id] || (col.id === "__profile" ? 70 : col.id === "__contributor" ? 220 : col.id === "__assigned" ? 200 : 180);
            const isSticky = idx < 2;
            metrics[col.id] = {
                width,
                left: isSticky ? currentLeft : 0,
                isSticky
            };
            if (isSticky) {
                currentLeft += width;
            }
        });
        return metrics;
    }, [getColumns, columnWidths, isPureMaster]);

    const paginatedResponses = useMemo(() => {
        // 💎 SERVER SLICE REDUNDANCY: If server already paginated, don't slice again on client
        if (data?.responses && (data.page !== undefined || data.totalPages !== undefined)) return filteredResponses;

        const start = (currentPage - 1) * rowsPerPage;
        return filteredResponses.slice(start, start + rowsPerPage);
    }, [filteredResponses, currentPage, rowsPerPage, data?.totalPages, data?.page]);

    const tbodyScrollRef = useRef<HTMLDivElement>(null);
    const rowVirtualizer = useVirtualizer({
        count: paginatedResponses.length,
        getScrollElement: () => tbodyScrollRef.current,
        estimateSize: () => (density === 'compact' ? 32 : density === 'comfortable' ? 80 : 50),
        overscan: 10,
    });

    useEffect(() => {
        setCurrentPage(1);
        // searchTerm change pe bhi page 1 pe jaao
    }, [debouncedSearchTerm]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't interfere if actively editing a cell's input
            if (editingCell) {
                if (e.key === "Escape") setEditingCell(null);
                return;
            }

            // Don't interfere if focus is in a search box or other global UI input
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

            const rowIds = paginatedResponses.map(r => r.id);
            const cols = getColumns;
            const colIds = cols.map(c => c.id);

            if (rowIds.length === 0 || colIds.length === 0) return;

            // If nothing is focused and user hits an arrow, focus the first visible cell
            if (!focusedCell) {
                if (e.key.startsWith("Arrow") || e.key === "Enter") {
                    setFocusedCell({ rowId: rowIds[0], colId: colIds[0] });
                }
                return;
            }

            const rIdx = rowIds.indexOf(focusedCell.rowId);
            const cIdx = colIds.indexOf(focusedCell.colId);

            // Row might have disappeared due to filtering/pagination
            if (rIdx === -1) {
                setFocusedCell({ rowId: rowIds[0], colId: colIds[0] });
                return;
            }

            let nextR = rIdx;
            let nextC = cIdx;

            const moveAndScroll = (r: number, c: number) => {
                const newFocus = { rowId: rowIds[r], colId: colIds[c] };
                setFocusedCell(newFocus);
                // Ensure it's visible - small timeout to allow DOM to settle if needed
                setTimeout(() => {
                    const el = document.getElementById(`cell-${newFocus.rowId}-${newFocus.colId}`);
                    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                }, 0);
            };

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    nextR = Math.min(rowIds.length - 1, rIdx + 1);
                    moveAndScroll(nextR, nextC);
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    nextR = Math.max(0, rIdx - 1);
                    moveAndScroll(nextR, nextC);
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    nextC = Math.min(colIds.length - 1, cIdx + 1);
                    moveAndScroll(nextR, nextC);
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    nextC = Math.max(0, cIdx - 1);
                    moveAndScroll(nextR, nextC);
                    break;
                case "Enter":
                    e.preventDefault();
                    const col = cols[cIdx];
                    if (!col) return;
                    // If it's a field we can edit, start editing
                    if (col.type !== "static" && col.id !== "__profile" && col.id !== "__contributor" && col.id !== "__assigned" && col.id !== "__payment") {
                        const canEdit = isMaster || isPureMaster || (colPermissions?.roles?.[userRole]?.[col.id] || colPermissions?.users?.[(data as any).clerkId]?.[col.id] || (col.isInternal ? "hide" : "edit")) === "edit";
                        if (canEdit && !col.isLocked) {
                            const res = paginatedResponses[rIdx];
                            const val = getCellValue(res.id, col.id, !!col.isInternal);
                            setEditingCell({ rowId: res.id, colId: col.id });
                            setEditValue(val || "");
                        }
                    } else {
                        // For special columns like profile, assigned, etc, Enter should trigger their click action
                        const res = paginatedResponses[rIdx];
                        if (col.id === "__profile") { setSelectedResponse(res); setHighlightedRowId(res.id); }
                        else if (col.id === "__assigned") { setOpenAssignedCell(res.id); }
                        else if (col.id === "__payment") { setOpenPaymentModal({ formId: data?.form?.id || "", responseId: res.id }); }
                        else if (["__followup", "__recentRemark", "__nextFollowUpDate", "__followUpStatus"].includes(col.id)) {
                            setOpenFollowUpModal({ formId: data?.form?.id || '', responseId: res.id });
                        }
                    }
                    break;
                case "Tab":
                    e.preventDefault();
                    if (e.shiftKey) nextC = Math.max(0, cIdx - 1);
                    else nextC = Math.min(colIds.length - 1, cIdx + 1);
                    moveAndScroll(nextR, nextC);
                    break;
                case "Escape":
                    setFocusedCell(null);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [focusedCell, editingCell, paginatedResponses, getColumns, isMaster, isPureMaster, data, userRole, colPermissions]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            const target = e.target as Element;
            if (target?.closest('.ignore-click-outside')) {
                return;
            }
            setOpenColorPicker(null);
            setOpenAssignedCell(null);
            setActiveColumnFilter(null);
            setUserResults([]);
            setAccessUserResults([]);
            // Don't clear focusedCell on every click here, because we want to set it in td's onClick
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    const groupedResponses = useMemo(() => {
        if (!groupByColId || !data) return {};
        const groups: Record<string, FormResponse[]> = {};
        const groupCol = data.internalColumns?.find(c => c.id === groupByColId);
        const options = groupCol?.options;

        if (Array.isArray(options)) {
            options.forEach((opt: any) => {
                if (opt && opt.label) groups[opt.label] = [];
            });
        }
        groups["Unassigned"] = [];

        filteredResponses.forEach(res => {
            const val = getCellValue(res.id, groupByColId, true);
            if (groups[val]) groups[val].push(res);
            else groups["Unassigned"].push(res);
        });
        return groups;
    }, [filteredResponses, groupByColId, data, getCellValue]);

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                handleCopy();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                // Browser handles paste event, listener below will catch it
            }
        };

        const handlePasteEvent = (e: ClipboardEvent) => {
            const activeElement = document.activeElement;
            if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') return;

            const text = e.clipboardData?.getData("text");
            if (text) handlePaste(text);
        };

        window.addEventListener("keydown", handleKeyPress);
        window.addEventListener("paste", handlePasteEvent);
        return () => {
            window.removeEventListener("keydown", handleKeyPress);
            window.removeEventListener("paste", handlePasteEvent);
        };
    }, [selection, filteredResponses, getColumns]);

    const handleCopy = () => {
        if (!selection.start || !selection.end) return;

        const startR = Math.min(selection.start.row, selection.end.row);
        const endR = Math.max(selection.start.row, selection.end.row);
        const startC = Math.min(selection.start.col, selection.end.col);
        const endC = Math.max(selection.start.col, selection.end.col);

        const rows: string[] = [];
        for (let r = startR; r <= endR; r++) {
            const rowValues: string[] = [];
            for (let c = startC; c <= endC; c++) {
                const col = getColumns[c];
                const res = filteredResponses[r];
                if (!col || !res) continue;

                if (col.type === "static") {
                    rowValues.push(col.id === "__profile" ? (res.submittedByName || "") : (res.submittedAt || ""));
                } else {
                    rowValues.push(getCellValue(res.id, col.id, col.isInternal));
                }
            }
            rows.push(rowValues.join("\t"));
        }

        navigator.clipboard.writeText(rows.join("\n"));
        toast.success("Copied to clipboard");
    };

    const handlePaste = async (text: string) => {
        if (!selection.start) return;

        const rows = text.split("\n").filter(r => (r || "").trim()).map(r => r.split("\t"));
        const updates: any[] = [];
        const warnings: string[] = [];
        const startR = selection.start.row;
        const startC = selection.start.col;

        rows.forEach((row, rIdx) => {
            row.forEach((val, cIdx) => {
                const targetR = startR + rIdx;
                const targetC = startC + cIdx;

                if (targetR < filteredResponses.length && targetC < getColumns.length) {
                    const col = getColumns[targetC];
                    const res = filteredResponses[targetR];
                    if (col && res && col.type !== "static") {
                        const trimmedVal = (val || "").trim();

                        // Basic Validation
                        let isValid = true;
                        if (col.type === "phone" && trimmedVal && !/^\d{10,12}$/.test(trimmedVal.replace(/\D/g, ''))) isValid = false;
                        if (col.type === "email" && trimmedVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedVal)) isValid = false;
                        if ((col.type === "number" || col.type === "currency") && trimmedVal && isNaN(Number(trimmedVal))) isValid = false;

                        if (!isValid) {
                            warnings.push(`Invalid ${col.type} at Row ${targetR + 1}, Col ${col.label}`);
                        }

                        updates.push({
                            responseId: res.id,
                            columnId: col.id,
                            value: trimmedVal,
                            isInternal: col.isInternal
                        });
                    }
                }
            });
        });

        if (updates.length === 0) return;

        if (warnings.length > 0) {
            if (!confirm(`${warnings.length} potential data issues found:\n${warnings.slice(0, 5).join('\n')}${warnings.length > 5 ? '\n...' : ''}\n\nProceed anyway?`)) {
                return;
            }
        }

        const loadingToast = toast.loading(`Pasting ${updates.length} values...`);
        try {
            const res = await fetch(`/api/crm/forms/${params.id}/responses`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ updates })
            });

            if (res.ok) {
                toast.success("Pasted successfully", { id: loadingToast });
                fetchData();
            } else {
                toast.error("Paste failed", { id: loadingToast });
            }
        } catch (err) {
            toast.error("Network error during paste", { id: loadingToast });
        }
    };

    const handleUpdateValue = async (responseId: string, columnId: string, value: string, isInternal: boolean) => {
        // 💎 REFRESH ENGINE: Instant Cell Closure
        setEditingCell(null);

        const cellKey = `${responseId}-${columnId}`;
        const previousData = data;

        // Prevent redundant saves if value hasn't changed
        const currentVal = getCellValue(responseId, columnId, isInternal);
        if (currentVal === value) return;

        // 💎 REFRESH ENGINE: Local Sync State (Prevents 'Vanishing' Lag)
        setPendingUpdates(prev => ({ ...prev, [cellKey]: value }));

        setData(prev => {
            if (!prev) return prev;
            if (isInternal) {
                const newInternalValues = [...(prev.internalValues || [])];
                const index = newInternalValues.findIndex(v => v.responseId === responseId && v.columnId === columnId);
                if (index > -1) {
                    newInternalValues[index] = { ...newInternalValues[index], value };
                } else {
                    newInternalValues.push({ responseId, columnId, value });
                }
                return { ...prev, internalValues: newInternalValues };
            } else {
                const newResponses = [...(prev.responses || [])];
                const respIndex = newResponses.findIndex(r => r.id === responseId);
                if (respIndex > -1) {
                    const newValues = [...(newResponses[respIndex].values || [])];
                    const valIndex = newValues.findIndex(v => v.fieldId === columnId);
                    if (valIndex > -1) {
                        newValues[valIndex] = { ...newValues[valIndex], value };
                    } else {
                        newValues.push({ fieldId: columnId, value });
                    }
                    newResponses[respIndex] = { ...newResponses[respIndex], values: newValues };
                }
                return { ...prev, responses: newResponses };
            }
        });

        setSavingCells(prev => {
            const next = new Set(prev);
            next.add(cellKey);
            return next;
        });

        try {
            if (!navigator.onLine) {
                const pendingUpdates = JSON.parse(localStorage.getItem(`offlineUpdates-${params.id}`) || '[]');
                const existingIdx = pendingUpdates.findIndex((u: any) => u.responseId === responseId && u.columnId === columnId);

                if (existingIdx > -1) {
                    pendingUpdates[existingIdx] = { ...pendingUpdates[existingIdx], value, updatedAt: Date.now() };
                } else {
                    pendingUpdates.push({
                        responseId,
                        columnId,
                        value,
                        isInternal,
                        formId: params.id,
                        tempId: crypto.randomUUID(),
                        updatedAt: Date.now()
                    });
                }

                localStorage.setItem(`offlineUpdates-${params.id}`, JSON.stringify(pendingUpdates));
                setPendingOfflineCount(pendingUpdates.length);
                toast("Saved offline. Will sync when online.", { icon: '📶' });
                return;
            }

            const res = await fetch(`/api/crm/forms/${params.id}/responses`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ responseId, columnId, value, isInternal, formId: params.id })
            });

            if (!res.ok) {
                // If it's a server error or timeout, treat as offline rather than rollback
                if (res.status >= 500 || res.status === 408) {
                    throw new Error(`Server error ${res.status}`);
                }

                if (res.status === 401 || res.status === 403) {
                    toast.error("Session expired. Please refresh.");
                    return;
                }

                toast.error("Sync failed");
                setData(previousData); // Rollback for genuine validation/permission errors
            } else {
                // 💎 Instant History Update
                setData(prev => {
                    if (!prev) return prev;
                    const col = getColumns.find(c => c.id === columnId);
                    const newActivity: FormActivity = {
                        id: crypto.randomUUID(),
                        responseId,
                        userName: "You",
                        type: "CELL_UPDATE",
                        columnName: col?.label || "Field",
                        oldValue: currentVal || "",
                        newValue: value,
                        createdAt: new Date().toISOString()
                    };
                    return { ...prev, activities: [newActivity, ...(prev.activities || [])] };
                });
            }
        } catch (err) {
            if (!navigator.onLine || String(err).includes('Network') || String(err).includes('fetch') || String(err).includes('Server error')) {
                const pendingUpdates = JSON.parse(localStorage.getItem(`offlineUpdates-${params.id}`) || '[]');
                const existingIdx = pendingUpdates.findIndex((u: any) => u.responseId === responseId && u.columnId === columnId);

                if (existingIdx > -1) {
                    pendingUpdates[existingIdx] = { ...pendingUpdates[existingIdx], value, updatedAt: Date.now() };
                } else {
                    pendingUpdates.push({
                        responseId,
                        columnId,
                        value,
                        isInternal,
                        formId: params.id,
                        tempId: crypto.randomUUID(),
                        updatedAt: Date.now()
                    });
                }

                localStorage.setItem(`offlineUpdates-${params.id}`, JSON.stringify(pendingUpdates));
                setPendingOfflineCount(pendingUpdates.length);
                toast("Network error. Saved offline for later sync.", { icon: '📶' });
            } else {
                console.error("Update error:", err);
                toast.error("Matrix error");
                setData(previousData); // Rollback
            }
        } finally {
            setSavingCells(prev => {
                const next = new Set(prev);
                next.delete(cellKey);
                return next;
            });
            // 💎 Persistence Shield: Delay cleanup to allow master state to settle
            setTimeout(() => {
                setPendingUpdates(prev => {
                    const next = { ...prev };
                    delete next[cellKey];
                    return next;
                });
            }, 1000);
        }
    };

    const handleStatusCellUpdate = async (responseId: string, columnId: string, value: string, isInternal: boolean) => {
        // 💎 REFRESH ENGINE: Instant Cell Closure
        setEditingCell(null);

        const cellKey = `${responseId}-${columnId}`;
        setSavingCells(prev => {
            const next = new Set(prev);
            next.add(cellKey);
            return next;
        });

        // 1. Optimistic Update (Immediate Feedback)
        setData(prev => {
            if (!prev) return prev;

            // 1. Update Responses for Remarks and Direct Properties
            const updatedResponses = prev.responses.map(r => {
                if (r.id === responseId) {
                    const updatedRow = { ...r };

                    // Update property directly for instant visibility in table
                    (updatedRow as any)[columnId] = value;

                    // Update remarks for audit trail
                    updatedRow.remarks = [{
                        id: 'temp-' + Date.now(),
                        remark: `Status action: ${value}`,
                        followUpStatus: value,
                        createdAt: new Date().toISOString()
                    } as any, ...(r.remarks || [])];

                    return updatedRow;
                }
                return r;
            });

            // 2. Also update internalValues array to ensure getCellValue picks it up
            const updatedInternalValues = isInternal
                ? prev.internalValues.map(iv =>
                    (iv.responseId === responseId && iv.columnId === columnId)
                        ? { ...iv, value }
                        : iv
                )
                : prev.internalValues;

            // If it was internal but didn't exist yet, we might need to push it
            if (isInternal && !prev.internalValues.find(iv => iv.responseId === responseId && iv.columnId === columnId)) {
                updatedInternalValues.push({ responseId, columnId, value });
            }

            return {
                ...prev,
                responses: updatedResponses,
                internalValues: updatedInternalValues
            };
        });

        // 2. Persistent update
        try {
            if (!navigator.onLine) {
                const pendingUpdates = JSON.parse(localStorage.getItem(`offlineUpdates-${params.id}`) || '[]');
                pendingUpdates.push({
                    responseId,
                    columnId,
                    value,
                    isInternal,
                    type: 'STATUS_UPDATE',
                    remark: `Status action: ${value}`,
                    followUpStatus: value,
                    formId: params.id,
                    tempId: crypto.randomUUID(),
                    updatedAt: Date.now()
                });
                localStorage.setItem(`offlineUpdates-${params.id}`, JSON.stringify(pendingUpdates));
                setPendingOfflineCount(pendingUpdates.length);
                toast("Interaction saved offline.", { icon: '📶' });
                return;
            }

            const res = await fetch(`/api/crm/forms/${params.id}/responses/${responseId}/remarks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    remark: `Status action: ${value}`,
                    followUpStatus: value,
                    columnId: columnId
                })
            });

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    toast.error("Session expired.");
                    return;
                }
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to log interaction");
            }

            toast.success(`Interaction logged as ${value}`, {
                icon: '📞',
                duration: 2000
            });

            // DO NOT re-fetch. Rely on optimistic state.
        } catch (e: any) {
            console.error(e);

            if (!navigator.onLine || String(e).includes('Network') || String(e).includes('fetch') || String(e).includes('Server error')) {
                const pendingUpdates = JSON.parse(localStorage.getItem(`offlineUpdates-${params.id}`) || '[]');
                pendingUpdates.push({
                    responseId,
                    columnId,
                    value,
                    isInternal,
                    type: 'STATUS_UPDATE',
                    remark: `Status action: ${value}`,
                    followUpStatus: value,
                    formId: params.id,
                    tempId: crypto.randomUUID(),
                    updatedAt: Date.now()
                });
                localStorage.setItem(`offlineUpdates-${params.id}`, JSON.stringify(pendingUpdates));
                setPendingOfflineCount(pendingUpdates.length);
                toast("Network hiccup. Saved offline.", { icon: '📶' });
            } else {
                toast.error(e.message || "Failed to log interaction");
                fetchData(currentPage, rowsPerPage, searchTerm, sortBy, sortOrder, conditions, filterConjunction, true);
            }
        } finally {
            setSavingCells(prev => {
                const next = new Set(prev);
                next.delete(cellKey);
                return next;
            });
            // 💎 Persistence Shield: Delay cleanup to allow master state to settle
            setTimeout(() => {
                setPendingUpdates(prev => {
                    const next = { ...prev };
                    delete next[cellKey];
                    return next;
                });
            }, 1000);
            setEditingCell(null);
        }
    };

    const handleUpdateRowColor = async (responseId: string, color: string | null) => {
        const previousData = data;
        setData(prev => {
            if (!prev) return prev;
            const newResponses = [...prev.responses];
            const idx = newResponses.findIndex(r => r.id === responseId);
            if (idx > -1) {
                newResponses[idx] = { ...newResponses[idx], rowColor: color || undefined };
            }
            return { ...prev, responses: newResponses };
        });
        try {
            const res = await fetch(`/api/crm/forms/${params.id}/responses`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ responseId, rowColor: color || "", formId: params.id })
            });
            if (!res.ok) {
                if (res.status >= 500 || res.status === 408) {
                    toast("Color saved locally, sync pending.", { icon: '📶' });
                    return;
                }
                toast.error("Color sync failed");
                setData(previousData);
            }
        } catch (err) {
            console.error("Row color error", err);
            if (!navigator.onLine || String(err).includes('Network') || String(err).includes('fetch')) {
                toast("Color saved locally.", { icon: '📶' });
            } else {
                setData(previousData);
            }
        }
    };

    const handleConvertToLead = async (res: FormResponse) => {
        const name = res.submittedByName || "Public User";
        const phoneField = data?.form?.fields?.find(f => f.label.toLowerCase().includes("phone") || f.type === "number");
        const emailField = data?.form?.fields?.find(f => f.label.toLowerCase().includes("email") || f.label.toLowerCase().includes("mail"));
        const phone = res.values.find(v => v.fieldId === phoneField?.id)?.value || "";
        const email = res.values.find(v => v.fieldId === emailField?.id)?.value || "";

        if (!phone) {
            const manualPhone = prompt("Phone number not found. Please enter phone manually:");
            if (!manualPhone) return;
            triggerConvert(res.id, name, manualPhone, email);
        } else {
            triggerConvert(res.id, name, phone, email);
        }
    };

    const handleFileChange = async (resId: string, colId: string, file: File) => {
        const loadingToast = toast.loading(`Uploading ${file.name}...`);
        try {
            // Mocking upload for now to show UI capability, in real SaaS we use S3/Cloudinary
            const mockUrl = `https://files.msteam.hub/${file.name.replace(/ /g, '_')}`;
            setTimeout(async () => {
                await handleUpdateValue(resId, colId, mockUrl, true);
                toast.success("File Linked Successfully", { id: loadingToast });
            }, 1000);
        } catch (err) {
            toast.error("Upload failed", { id: loadingToast });
        }
    };

    const triggerConvert = async (id: string, name: string, phone: string, email: string) => {
        const loadingToast = toast.loading("Converting to CRM Lead...");
        try {
            const res = await fetch(`/api/crm/responses/${id}/convert`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, phone, email, remark: `Converted from Form: ${data?.form?.title}` })
            });
            if (res.ok) {
                toast.success("Lead sync complete!", { id: loadingToast });
                router.push("/customers");
            } else {
                toast.error("Conversion failed", { id: loadingToast });
            }
        } catch (err) {
            toast.error("Network error", { id: loadingToast });
        }
    };

    const handleAddColumn = async () => {
        if (!newColLabel || !data) return;
        const tempId = `temp-col-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const previousData = { ...data };

        // Optimistic Column
        const newCol: InternalColumn = {
            id: tempId,
            label: newColLabel,
            type: newColType,
            options: newColOptions,
            isInternal: true,
            isOptimistic: true
        } as any;

        setData(prev => prev ? { ...prev, internalColumns: [...(prev.internalColumns || []), newCol] } : prev);
        setIsAddColumnOpen(false);
        toast.loading("Adding dimension...", { id: "add-col" });

        try {
            const res = await fetch(`/api/crm/forms/${params.id}/columns`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    label: newColLabel,
                    type: newColType,
                    options: newColType === 'user' ? selectedUserIds : newColOptions,
                    isRequired: newColSettings.isRequired,
                    isLocked: newColSettings.isLocked,
                    showInPublic: newColSettings.showInPublic,
                    visibleToRoles: newColPermissions.roles,
                    visibleToUsers: newColPermissions.users
                })
            });
            if (res.ok) {
                const result = await res.json();
                toast.success("Dimension Deployed", { id: "add-col" });
                setNewColLabel("");
                setNewColOptions([]);
                // Update with real ID
                setData(prev => {
                    if (!prev) return prev;
                    const cols = prev.internalColumns.map(c => c.id === tempId ? result.column : c);
                    return { ...prev, internalColumns: cols };
                });
            } else {
                toast.error("Failed to deploy dimension", { id: "add-col" });
                setData(previousData);
            }
        } catch (err) {
            toast.error("Network error during deployment", { id: "add-col" });
            setData(previousData);
        }
    };

    const handleDeleteColumn = async (columnId: string) => {
        if (!isMaster && !isPureMaster) return toast.error("MASTER MODE REQUIRED");
        if (!confirm("PURGE PROTOCOL: This will permanently delete the entire column and all associated data. Continue?")) return;
        if (!data) return;

        const previousData = { ...data };
        toast.loading("Purging dimension...", { id: `del-col-${columnId}` });

        if (columnId.startsWith("__")) {
            setData(prev => {
                if (!prev) return prev;
                const newPerms = { ...(prev.form.columnPermissions || { roles: {}, users: {} }) } as any;
                newPerms.deletedSystemCols = [...(newPerms.deletedSystemCols || []), columnId];
                return { ...prev, form: { ...prev.form, columnPermissions: newPerms } };
            });
        } else {
            setData(prev => prev ? { ...prev, internalColumns: prev.internalColumns.filter(c => c.id !== columnId) } : prev);
        }

        try {
            const res = await fetch(`/api/crm/forms/${params.id}/columns?columnId=${columnId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                toast.success("Dimension Purged", { id: `del-col-${columnId}` });
            } else {
                const err = await res.json();
                toast.error(err.error || "Purge Failed", { id: `del-col-${columnId}` });
                setData(previousData);
            }
        } catch (error) {
            toast.error("Network Error During Purge", { id: `del-col-${columnId}` });
            setData(previousData);
        }
    };

    const handleSaveView = async () => {
        const name = prompt("Enter view name:");
        if (!name) return;

        try {
            const res = await fetch(`/api/crm/forms/${params.id}/views`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, conditions, conjunction: filterConjunction })
            });

            if (res.ok) {
                const newView = await res.json();
                setSavedViews([newView, ...savedViews]);
                toast.success("View Archived Correctly");
            }
        } catch (err) {
            toast.error("Failed to save view");
        }
    };

    const handleDeleteView = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Destroy this architecture?")) return;

        try {
            const res = await fetch(`/api/crm/forms/${params.id}/views?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setSavedViews(savedViews.filter(v => v.id !== id));
                if (activeViewId === id) {
                    setActiveViewId(null);
                    setConditions([]);
                }
                toast.success("View Purged");
            }
        } catch (err) { toast.error("Purge failed"); }
    };

    const handleDuplicateView = async (view: any) => {
        const name = prompt("Enter name for duplicate:", `${view.name} (Copy)`);
        if (!name) return;

        try {
            const res = await fetch(`/api/crm/forms/${params.id}/views`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, conditions: view.conditions, conjunction: view.conjunction })
            });
            if (res.ok) {
                const newView = await res.json();
                setSavedViews([newView, ...savedViews]);
                toast.success("Architecture Duplicated");
            }
        } catch (err) { toast.error("Duplication failed"); }
    };

    const handleBulkVisibilityUpdate = async (type: "COLUMN" | "ROW", roles: string[]) => {
        const ids = type === "ROW" ? selectedRows : []; // Add column selection later if needed
        if (ids.length === 0) return;

        try {
            const res = await fetch(`/api/crm/forms/${params.id}/bulk/visibility`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids, type, visibleToRoles: roles, visibleToUsers: [] })
            });
            if (res.ok) {
                toast.success(`Access updated for ${ids.length} items`);
                setSelectedRows([]);
                fetchData();
            }
        } catch (err) {
            toast.error("Bulk update failed");
        }
    };

    const handleRemoveFormAccess = async (targetUserId: string | null, targetRole: string | null) => {
        if (!isMaster && !isPureMaster) {
            toast.error("Security: Access restricted to Master");
            return;
        }

        const currentUsers = data?.form?.visibleToUsers || [];
        const currentRoles = data?.form?.visibleToRoles || [];

        let newUsers = [...currentUsers];
        let newRoles = [...currentRoles];

        if (targetUserId) {
            newUsers = newUsers.filter(uid => uid !== targetUserId);
        }
        if (targetRole) {
            newRoles = newRoles.filter(r => r.toUpperCase() !== targetRole.toUpperCase());
        }

        try {
            const res = await fetch(`/api/crm/forms/${params.id}/bulk/visibility`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "FORM",
                    visibleToUsers: newUsers,
                    visibleToRoles: newRoles
                })
            });
            if (res.ok) {
                toast.success("Security protocols updated");
                fetchData();
            }
        } catch (err) {
            toast.error("Failed to update access");
        }
    };

    const handleInstantStatusUpdate = async (responseId: string, newStatus: string) => {
        // 🚀 OPTIMISTIC UI UPDATE
        const timestamp = new Date().toISOString();
        setData(prev => {
            if (!prev) return prev;
            const updatedResponses = prev.responses.map(r => {
                if (r.id === responseId) {
                    const existingRemarks = r.remarks || [];
                    const updatedRemarks = [{
                        id: `temp-${Date.now()}`,
                        followUpStatus: newStatus,
                        remark: `Status update: ${newStatus}`,
                        createdAt: timestamp,
                        authorName: user?.firstName || "You"
                    }, ...existingRemarks];

                    // Update both remarks AND the shadow property if it exists
                    return {
                        ...r,
                        remarks: updatedRemarks,
                        __followUpStatus: newStatus // Ensure system status also updates property
                    };
                }
                return r;
            });
            return { ...prev, responses: updatedResponses };
        });

        setActiveStatusDropdown(null);
        toast.success(`Matrix Transition: ${newStatus}`, {
            icon: '⚡',
            style: { borderRadius: '15px', background: '#333', color: '#fff', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }
        });

        try {
            const res = await fetch(`/api/crm/forms/${params.id}/responses/${responseId}/remarks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    remark: `Instant status transition to ${newStatus}`,
                    followUpStatus: newStatus
                })
            });
            if (!res.ok) throw new Error("Sync failed");
            // DO NOT re-fetch immediately on success to prevent flicker. 
            // The optimistic data is already correct.
        } catch (err) {
            toast.error("Status Matrix Sync Failed");
            fetchData(currentPage, rowsPerPage, debouncedSearchTerm, sortBy, sortOrder, conditions, filterConjunction, true); // Only rollback on error
        }
    };

    const toggleRowSelection = (id: string) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]);
    };

    const applySavedView = (view: any) => {
        setConditions(view.conditions);
        setFilterConjunction(view.conjunction as any);
        setActiveViewId(view.id);
        toast.success(`Matrix calibrated: ${view.name}`);
    };


    const addHubColumns = async (type: 'sales' | 'remarks') => {
        setIsAddingHubCols(true);
        const tid = toast.loading(`Generating ${type} columns...`);
        try {
            const res = await fetch(`/api/crm/forms/${params.id}/columns/hub`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type })
            });
            if (res.ok) {
                toast.success(`${type} columns initialized!`, { id: tid });
                fetchData();
            } else {
                const json = await res.json();
                toast.error(json.error || `Failed to create ${type} columns`, { id: tid });
            }
        } catch {
            toast.error("Network error", { id: tid });
        } finally {
            setIsAddingHubCols(false);
        }
    };

    const handleClearFilters = () => {
        setConditions([]);
        setActiveViewId(null);
        toast.success("Filters Neutralized");
    };

    const toggleAllRows = (count?: number) => {
        if (count) {
            setSelectedRows(filteredResponses.slice(0, count).map(r => r.id));
            toast.success(`Matrix locked: First ${count} records selected`);
        } else {
            if (selectedRows.length === filteredResponses.length) {
                setSelectedRows([]);
            } else {
                setSelectedRows(filteredResponses.map(r => r.id));
            }
        }
        setIsSelectAllMenuOpen(false);
    };



    const dynamicStats = useMemo(() => {
        if (!data || !data.responses) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const statsSource = allResponsesForFollowUps.length > 0 ? allResponsesForFollowUps : (data?.responses || []);

        const totalEntries = data?.filteredCount || statsSource.length;
        const newToday = statsSource.filter(r => new Date(r.createdAt) >= today).length;
        const newThisMonth = statsSource.filter(r => new Date(r.createdAt) >= thisMonth).length;

        // Try to find a dropdown/status column
        const statusCol = data?.internalColumns?.find((c: any) => c.type === 'dropdown');
        let statusCounts: Record<string, number> = {};

        if (statusCol && (data?.internalValues || []).length > 0) {
            const valuesToCount = statsSource === data.responses ? data.internalValues : data.internalValues; // Actually internalValues only match current responses
            // This is tricky because internalValues only come for the current page
            // For now, we'll only show status counts for the statsSource
            (data.internalValues || []).filter(v => v.columnId === statusCol.id).forEach(v => {
                statusCounts[v.value] = (statusCounts[v.value] || 0) + 1;
            });
        }

        return {
            totalEntries,
            newToday,
            newThisMonth,
            statusCounts,
            statusColName: statusCol?.label || "Status",
            statusColId: statusCol?.id
        };
    }, [data]);

    const handleDownloadPDF = (htmlContent: string, title: string = "Report") => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${title}</title>
                        <style>
                            @page { margin: 20mm; }
                            body { font-family: 'Inter', system-ui, sans-serif; padding: 0; margin: 0; }
                            .print-only { padding: 40px; }
                        </style>
                    </head>
                    <body>
                        <div class="print-only">
                            ${htmlContent}
                        </div>
                        <script>
                            window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-slate-900 border-t-indigo-600 rounded-full animate-spin mb-8 shadow-xl" />
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Booting Data Matrix v2.0</p>
        </div>
    );

    return (
        <div className={`min-h-screen flex flex-col h-screen overflow-hidden transition-all duration-700 ${isFullScreen ? 'p-0' : ''} ${canvasTheme === 'dark' ? 'bg-[#0f172a] text-slate-100' :
            canvasTheme === 'midnight' ? 'bg-[#020617] text-slate-100' :
                canvasTheme === 'ocean' ? 'bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white' :
                    canvasTheme === 'sunset' ? 'bg-gradient-to-br from-rose-900 via-purple-900 to-slate-900 text-white' :
                        canvasTheme === 'aurora' ? 'bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white' :
                            canvasTheme === 'mesh' ? 'bg-[#f8fafc] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] text-slate-900' :
                                canvasTheme === 'glass' ? 'bg-slate-200 bg-[url("https://www.transparenttextures.com/patterns/cubes.png")] text-slate-900' :
                                    'bg-[#f8fafc] text-slate-900'
            }`}>
            {/* Deletion Progress Overlay */}
            <AnimatePresence>
                {deleteProgress && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-200"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-rose-50 rounded-xl">
                                    <Trash2 className="text-rose-600 animate-pulse" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Purging Matrix Data</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Operation in progress...</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        Deleting {deleteProgress.current} / {deleteProgress.total}
                                    </span>
                                    <span className="text-sm font-black text-indigo-600">
                                        {Math.round((deleteProgress.current / deleteProgress.total) * 100)}%
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                                    <motion.div
                                        className="h-full bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(deleteProgress.current / deleteProgress.total) * 100}%` }}
                                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                                    />
                                </div>
                                <p className="text-[10px] text-center text-slate-400 font-bold italic">
                                    Please do not close this window during the purge cycle.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Premium Enterprise Header */}
            {(!isFullScreen || searchParams.get('fullview') === 'true') && (
                <header className={`h-[68px] border-b px-6 flex items-center justify-between shrink-0 z-50 shadow-sm relative transition-colors duration-500 ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                    ? 'bg-black/20 backdrop-blur-md border-white/10 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                    }`}>
                    <div className="flex items-center gap-4">
                        {searchParams.get('fullview') === 'true' ? (
                            <Link href={`/crm/forms/${params.id}/responses`} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center group shadow-lg shadow-indigo-100">
                                <ArrowLeft size={16} />
                                <span className="ml-2 text-[10px] font-black uppercase tracking-widest hidden md:block">Back to CRM</span>
                            </Link>
                        ) : (
                            <button onClick={() => router.back()} className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center group">
                                <ArrowLeft size={16} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
                            </button>
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className={`text-lg font-black tracking-tight transition-colors duration-500 ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-white' : 'text-slate-900'}`}>{data?.form?.title || "Website Matrix"}</h1>
                                {(isUserInvolved && searchParams.get('fullview') !== 'true') && (
                                    <button
                                        onClick={togglePin}
                                        className={`p-1.5 rounded-lg transition-all ${isPinned ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent')}`}
                                        title={isPinned ? "Unpin from sidebar" : "Pin to sidebar"}
                                    >
                                        {isPinned ? <Pin className="fill-current" size={16} /> : <PinOff size={16} />}
                                    </button>
                                )}
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg shadow-indigo-100 border border-indigo-400/30">
                                    <Globe size={10} className="text-white" />
                                    <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Website Interaction Mode</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{isPureMaster ? "Master Cloud" : "Network Realtime"}</span>
                                </div>
                                {isPureMaster && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200">
                                        <ShieldCheck size={10} className="text-white" />
                                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Master Auth</span>
                                    </div>
                                )}

                                {/* System Online/Offline Status Indicator */}
                                <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border shadow-sm transition-all cursor-pointer ${isOnline ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-rose-50 border-rose-200 animate-pulse'}`} onClick={handleManualSync}>
                                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isOnline ? 'text-slate-600' : 'text-rose-600'}`}>
                                        {isOnline ? 'Online' : 'Offline'}
                                    </span>
                                    {pendingOfflineCount > 0 && (
                                        <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-md ml-1 border border-amber-200">
                                            <CloudOff size={10} />
                                            {pendingOfflineCount} Pending Sync
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Fast View Switchers */}
                            <div className="flex items-center gap-4 mt-1.5">
                                <button
                                    onClick={handleClearFilters}
                                    className={`text-[10px] font-black uppercase tracking-widest transition-all ${!activeViewId && conditions.length === 0 ? 'text-indigo-600' : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}
                                >
                                    Default Canvas
                                </button>
                                {savedViews.slice(0, 3).map(view => (
                                    <button
                                        key={view.id}
                                        onClick={() => applySavedView(view)}
                                        className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeViewId === view.id ? 'text-indigo-600' : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}
                                    >
                                        {view.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 -mb-2 scrollbar-none scroll-smooth">
                        {/* Integrated Search & Actions */}
                        <div className="flex flex-nowrap items-center gap-2 w-max shrink-0 pr-4">
                            <div className="relative group shrink-0">
                                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-500' : 'text-slate-400'} group-focus-within:text-indigo-500`} size={14} />
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search records..."
                                    className={`pl-9 pr-4 py-2 border rounded-lg outline-none text-xs font-bold transition-all min-w-[200px] ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                        ? 'bg-white/5 border-white/10 text-white placeholder-slate-500 focus:bg-white/10 focus:ring-white/5'
                                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-indigo-50/50 focus:border-indigo-500'
                                        }`}
                                />
                            </div>

                            <button
                                onClick={() => window.open(`${window.location.pathname}?fullview=true`, "_blank")}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-slate-100"
                            >
                                <Maximize2 size={12} />
                                Full View
                            </button>

                            <button
                                onClick={() => setIsDynamicReportOpen(true)}
                                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-indigo-200 shadow-sm"
                            >
                                <BarChart3 size={12} />
                                Analytics
                            </button>

                            <button
                                onClick={() => window.open("/dashboard/followups", "_blank")}
                                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-rose-200 shadow-sm"
                            >
                                <Calendar size={12} />
                                Follow-up Board
                            </button>

                            <button
                                onClick={() => setIsPaymentHubOpen(true)}
                                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-emerald-200 shadow-sm"
                            >
                                <IndianRupee size={12} />
                                Payment Hub
                            </button>
                            <button
                                onClick={() => setIsBulkImportOpen(true)}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg"
                            >
                                <UploadCloud size={12} />
                                Smart Update
                            </button>

                            <button
                                onClick={() => {
                                    if (sortBy === "__mtv") {
                                        setSortBy("__submittedAt");
                                        setSortOrder("desc");
                                    } else {
                                        setSortBy("__mtv");
                                        setSortOrder("desc");
                                    }
                                }}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm ${sortBy === "__mtv"
                                    ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse ring-2 ring-amber-100'
                                    : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50')}`}
                                title="Prioritize Untouched Leads"
                            >
                                <Zap size={12} className={sortBy === "__mtv" ? "fill-current" : ""} />
                                Untouched
                            </button>

                            <button
                                onClick={() => setIsLeadAssignHubOpen(true)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
                                title="Rapid Lead Distribution Hub"
                            >
                                <Sparkles size={12} />
                                Lead Distribute
                            </button>

                            <button
                                onClick={() => setIsAIFilterOpen(true)}
                                className="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                            >
                                <Sparkles size={12} className="animate-pulse" />
                                Ask AI
                            </button>

                            <button
                                onClick={() => setIsThemePickerOpen(true)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                    ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <Palette size={12} />
                                Canvas
                            </button>

                            <button
                                onClick={() => setIsFilterBuilderOpen(true)}
                                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 border font-black text-[10px] uppercase tracking-widest ${conditions.length > 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')}`}
                            >
                                <Filter size={12} />
                                Filters
                                {conditions.length > 0 && <span className="ml-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[8px]">{conditions.length}</span>}
                            </button>

                            <button
                                onClick={() => setIsColumnManagerOpen(true)}
                                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 border font-black text-[10px] uppercase tracking-widest ${hiddenColumns.length > 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                            >
                                <Eye size={12} />
                                Columns
                                {hiddenColumns.length > 0 && <span className="ml-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[8px]">{hiddenColumns.length}</span>}
                            </button>

                            {isMaster && (
                                <button
                                    onClick={() => setIsAccessModalOpen(true)}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-lg flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                                >
                                    <Lock size={12} />
                                    Access Control
                                </button>
                            )}

                            <button
                                onClick={handleAddRow}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                            >
                                <Plus size={14} />
                                Add Row
                            </button>
                            <div className={`flex bg-slate-50 p-1 rounded-lg border transition-all ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                <button onClick={() => setCurrentView("table")} className={`p-1.5 rounded-md transition-all ${currentView === 'table' ? (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white text-indigo-400 shadow-sm border border-white/10' : 'bg-white text-indigo-600 shadow-sm border border-slate-200') : 'text-slate-400 hover:text-slate-600'}`}>
                                    <Table size={16} />
                                </button>
                                <button onClick={() => setCurrentView("kanban")} className={`p-1.5 rounded-md transition-all ${currentView === 'kanban' ? (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white text-indigo-400 shadow-sm border border-white/10' : 'bg-white text-indigo-600 shadow-sm border border-slate-200') : 'text-slate-400 hover:text-slate-600'}`}>
                                    <LayoutGrid size={16} />
                                </button>
                            </div>

                            <button
                                onClick={() => setIsAddColumnOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                            >
                                <Plus size={14} /> Add Column
                            </button>

                            <div className={`flex p-1 rounded-lg border transition-all ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                <button
                                    onClick={() => setDensity("compact")}
                                    className={`p-1.5 px-3 rounded-md transition-all flex items-center gap-2 ${density === 'compact' ? (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white text-indigo-400 shadow-sm border border-white/10' : 'bg-white text-indigo-600 shadow-sm border border-slate-200') : 'text-slate-400 hover:text-slate-600'}`}
                                    title="Compact View"
                                >
                                    <Minimize2 size={16} />
                                    <span className="text-[9px] font-black uppercase">Small</span>
                                </button>
                                <button
                                    onClick={() => setDensity("standard")}
                                    className={`p-1.5 px-3 rounded-md transition-all flex items-center gap-2 ${density === 'standard' ? (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white text-indigo-400 shadow-sm border border-white/10' : 'bg-white text-indigo-600 shadow-sm border border-slate-200') : 'text-slate-400 hover:text-slate-600'}`}
                                    title="Standard View"
                                >
                                    <Table size={16} />
                                    <span className="text-[9px] font-black uppercase">Medium</span>
                                </button>
                                <button
                                    onClick={() => setDensity("comfortable")}
                                    className={`p-1.5 px-3 rounded-md transition-all flex items-center gap-2 ${density === 'comfortable' ? (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white text-indigo-400 shadow-sm border border-white/10' : 'bg-white text-indigo-600 shadow-sm border border-slate-200') : 'text-slate-400 hover:text-slate-600'}`}
                                    title="Comfortable View"
                                >
                                    <Maximize2 size={16} />
                                    <span className="text-[9px] font-black uppercase">Large</span>
                                </button>
                            </div>

                            <button
                                onClick={() => setIsFullScreen(true)}
                                className={`p-2 rounded-lg transition-all active:scale-95 border ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                    ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                                title="Full Screen Mode"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                    </div>
                </header>
            )}

            {
                isFullScreen && (
                    <button
                        onClick={() => setIsFullScreen(false)}
                        className="fixed top-4 right-4 z-[100] p-3 bg-slate-900/80 text-white rounded-full backdrop-blur-md hover:bg-slate-900 transition-all shadow-2xl flex items-center gap-2 pr-6 group"
                    >
                        <div className="p-1 bg-white/20 rounded-full group-hover:rotate-90 transition-transform">
                            <X size={14} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Exit Matrix Focus</span>
                    </button>
                )
            }

            {/* Matrix Console */}
            <main className={`flex-1 overflow-hidden relative flex flex-col transition-all duration-500 ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-transparent' : 'bg-slate-50'
                }`}>

                {/* ☣️ MATRIX PURGE PROGRESS OVERLAY */}
                {deleteProgress && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="relative bg-white rounded-[40px] p-10 max-w-sm w-full shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] border border-white overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-slate-50">
                                <motion.div
                                    className="h-full bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                                    animate={{ width: `${(deleteProgress.current / deleteProgress.total) * 100}%` }}
                                />
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mb-6 shadow-inner ring-8 ring-rose-50/50">
                                    <Activity size={40} className="animate-pulse" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Matrix Purge in Progress</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 px-4">Sector extraction and record incineration cycle active.</p>

                                <div className="w-full space-y-2">
                                    <div className="flex justify-between items-end px-1">
                                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{deleteProgress.current} / {deleteProgress.total}</p>
                                        <p className="text-2xl font-black text-indigo-600">{Math.round((deleteProgress.current / deleteProgress.total) * 100)}<span className="text-xs">%</span></p>
                                    </div>
                                    <div className="h-4 w-full bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-50 p-1">
                                        <motion.div
                                            className="h-full bg-indigo-600 rounded-xl"
                                            animate={{ width: `${(deleteProgress.current / deleteProgress.total) * 100}%` }}
                                            transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                                        />
                                    </div>
                                </div>
                                <p className="mt-8 text-[9px] font-black text-rose-500 uppercase tracking-widest animate-pulse border border-rose-100 px-4 py-2 rounded-full bg-rose-50">CRITICAL: Stability Interlock Active</p>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* 🚀 REAL-TIME METRICS HUB */}
                {!isFullScreen && (
                    <div className="px-6 py-4 bg-white border-b border-slate-200/60 flex items-center gap-6 shrink-0 z-40 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-3 pr-6 border-r border-slate-100">
                            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200">
                                <Activity size={20} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Pulse</h4>
                                <p className="text-xs font-black text-slate-900">Performance Metrics</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                            <div
                                onClick={handleClearFilters}
                                className="flex flex-col cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-all active:scale-95 group"
                                title="Reset Matrix Protocol"
                            >
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 group-hover:text-indigo-600 transition-colors">Total Core</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-black text-slate-900">{data?.totalCount || "..."}</span>
                                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">+Live</span>
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Matrix Yield</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-black text-slate-900">84.2%</span>
                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                        <div className="h-full bg-indigo-500 w-[84%]" />
                                    </div>
                                </div>
                            </div>

                            <div
                                onClick={() => {
                                    setConditions([{ colId: "__nextFollowUpDate", op: "today", val: "" }]);
                                    toast.success("Focus Shift: Attention Matrix Locked (Today's Follow-ups)");
                                }}
                                className="flex flex-col pr-8 border-r border-slate-100 cursor-pointer hover:bg-amber-50 p-2 rounded-xl transition-all active:scale-95 group"
                                title="Filter: Today's Follow-up Protocol"
                            >
                                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-0.5 group-hover:text-amber-600">Attention Matrix</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-black text-amber-600">{todayFollowUps.length}</span>
                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-2">
                                    {teamMembers.slice(0, 3).map(m => (
                                        <div key={m.clerkId} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-slate-100 shadow-sm">
                                            <img src={getFallbackAvatar(m.clerkId, m.imageUrl)} alt="auth" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{teamMembers.length} Agents Online</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ⚡ FLASH RECOVERY: Today's High priority actions */}
                {todayFollowUps.length > 0 && !isFullScreen && (
                    <div className="px-6 py-4 bg-white/40 border-b border-slate-200 shadow-[inset_0_10px_30px_-10px_rgba(0,0,0,0.02)] overflow-x-auto custom-scrollbar flex items-center gap-4 shrink-0 transition-all">
                        <div className="flex flex-col gap-0.5 min-w-fit pr-6 border-r border-slate-200">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Flash Hub</span>
                            </div>
                            <span className="text-xl font-black tracking-tight text-slate-800">{todayFollowUps.length} Pending Actions</span>
                        </div>
                        <div className="flex items-center gap-4 py-1">
                            {todayFollowUps.slice(0, 10).map((res: any) => {
                                // Smart Search for Number
                                const phoneField = data?.form?.fields?.find(f =>
                                    f.label.toLowerCase().includes("phone") || f.label.toLowerCase().includes("number") || f.label.toLowerCase().includes("contact")
                                );
                                const phone = res.values?.find((v: any) => v.fieldId === phoneField?.id)?.value || "—";
                                const latestRemarkFull = res.remarks?.[0];
                                const latestRemark = latestRemarkFull?.remark || "Waiting for interaction protocol...";
                                const followUpCount = res.remarks?.length || 0;

                                // Find author image from teamMembers
                                const author = teamMembers.find(m => m.clerkId === latestRemarkFull?.createdById);
                                const authorImage = author?.imageUrl;
                                const authorName = author?.name || latestRemarkFull?.authorName || res.submittedByName || "Lead";

                                return (
                                    <motion.div
                                        key={`flash-${res.id}`}
                                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        onClick={() => setSelectedResponse(res)}
                                        className="min-w-[300px] max-w-[340px] bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.08)] hover:border-indigo-300 flex flex-col gap-3 transition-all cursor-pointer group hover:-translate-y-1 active:scale-95"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="relative">
                                                    <div className="relative w-10 h-10 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white font-black text-xs overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500">
                                                        <img src={getFallbackAvatar(author?.clerkId || latestRemarkFull?.createdById || res.id, authorImage)} alt="author" className="w-full h-full object-cover" title={authorName} />
                                                    </div>
                                                    {followUpCount > 0 && (
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm" title="Total interaction count">
                                                            {followUpCount}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-black uppercase text-slate-900 truncate tracking-tight">{res.submittedByName || "Lead Contact"}</p>
                                                    <p className="text-[9px] font-black text-indigo-500 flex items-center gap-1 bg-indigo-50 px-1.5 py-0.5 rounded-md w-fit"><Phone size={8} /> {phone}</p>
                                                </div>
                                            </div>
                                            <div className="w-7 h-7 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                                <ArrowUpRight size={14} />
                                            </div>
                                        </div>
                                        <div className="px-3 py-2.5 bg-slate-50/50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-colors">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <div className="w-1 h-1 rounded-full bg-indigo-400" />
                                                <span className="text-[8px] font-black uppercase text-indigo-400">Latest Pulse</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-600 line-clamp-2 leading-relaxed italic">“{latestRemark}”</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            {todayFollowUps.length > 10 && (
                                <button
                                    onClick={() => window.open("/dashboard/followups", "_blank")}
                                    className="min-w-[140px] px-6 h-[110px] rounded-[24px] border-2 border-dashed border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-white transition-all flex flex-col items-center justify-center gap-2 group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                        <Plus size={20} />
                                    </div>
                                    +{todayFollowUps.length - 10} Explorer
                                </button>
                            )}
                        </div>
                    </div>
                )}


                <AnimatePresence mode="wait">
                    {currentView === "table" ? (
                        <motion.div
                            key="table"
                            ref={tbodyScrollRef}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={`flex-1 w-full overflow-auto custom-scrollbar rounded-xl border relative transition-all duration-500 ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                ? 'bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl'
                                : 'bg-white border-slate-200 shadow-sm'
                                }`}
                        >
                            <AnimatePresence>
                                {isSyncing && (
                                    <div className="absolute top-0 left-0 right-0 z-[100] pointer-events-none">
                                        <div className="h-[3px] w-full bg-indigo-600/10 overflow-hidden">
                                            <motion.div
                                                initial={{ x: "-100%" }}
                                                animate={{ x: "100%" }}
                                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                                className="h-full w-1/3 bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </AnimatePresence>
                            <table
                                style={{ minWidth: Math.max(totalTableWidth, 1200) }}
                                className={`matrix-table table-fixed w-full border-separate border-spacing-0 transition-opacity duration-300 ${(isSyncing || isBulkDeleting) ? 'select-none cursor-wait' : ''}`}
                            >
                                <thead className="sticky top-0 z-[50]">
                                    {/* Excel Column Labels Header with Group Indication */}
                                    <tr className={`divide-x h-9 transition-colors ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                        ? 'bg-slate-900/80 divide-white/5 border-b border-white/10'
                                        : 'bg-slate-50 divide-slate-100 border-b border-slate-200'
                                        }`}>
                                        <th className={`sticky left-0 z-[45] text-[9px] font-black uppercase p-0 ${isPureMaster ? 'w-[70px]' : 'w-[56px]'} shadow-[1px_0_0_#EAECF0] transition-colors ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                            ? 'bg-slate-800 border-b border-white/10 text-slate-400 shadow-none'
                                            : 'bg-slate-200 border-b border-slate-300 text-slate-500'
                                            }`}>
                                            #
                                        </th>
                                        {getColumns.map((col, idx) => {
                                            const groupKey = getColumnGroup(col);
                                            const style = getGroupStyle(groupKey);
                                            const prevGroupKey = idx > 0 ? getColumnGroup(getColumns[idx - 1]) : null;
                                            const isGroupStart = groupKey !== prevGroupKey;

                                            return (
                                                <th
                                                    key={`excel-label-${col.id}`}
                                                    className={`border-b text-[9px] font-black uppercase p-0 h-9 text-center relative overflow-hidden transition-colors ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                        ? 'bg-slate-900 border-white/10 text-slate-500'
                                                        : `${style.headerBg} border-slate-200 text-slate-400`
                                                        }`}
                                                    style={{ width: columnWidths[col.id] || (col.id === "__profile" ? 70 : col.id === "__contributor" ? 220 : col.id === "__assigned" ? 200 : 180) }}
                                                >
                                                    <div className="flex flex-col items-center justify-center h-full">
                                                        {isGroupStart && (
                                                            <div className={`absolute top-0 left-0 right-0 h-1 ${style.accent}`} />
                                                        )}
                                                        {isGroupStart ? (
                                                            <span className={`${style.text} text-[7px] tracking-[0.2em] mb-0.5 opacity-80 uppercase`}>{style.label}</span>
                                                        ) : (
                                                            <div className="h-2" />
                                                        )}
                                                        <span className="opacity-40">{getExcelLabel(idx)}</span>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                    <tr className={`h-14 transition-colors ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                        ? 'bg-slate-900 border-b border-white/10'
                                        : 'bg-[#F9FAFB] border-b border-[#EAECF0]'
                                        }`}>
                                        <th className={`px-4 py-3 sticky left-0 z-[45] transition-colors ${isPureMaster ? 'w-[70px]' : 'w-[56px]'} ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                            ? 'bg-slate-900 border-b border-white/10 shadow-[1px_0_0_rgba(255,255,255,0.1)]'
                                            : 'bg-[#F9FAFB] border-b border-[#EAECF0] shadow-[1px_0_0_#EAECF0]'
                                            }`}>
                                            <div className="flex items-center justify-center gap-1.5 relative">
                                                <div className="relative flex items-center gap-1">
                                                    <div
                                                        onClick={() => toggleAllRows()}
                                                        className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${selectedRows.length > 0
                                                            ? (selectedRows.length === (filteredResponses?.length || 0) ? 'bg-indigo-600 border-indigo-600' : 'bg-indigo-100 border-indigo-400')
                                                            : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/5 border-white/10' : 'bg-white border-[#D0D5DD]')
                                                            }`}
                                                    >
                                                        {selectedRows.length === (filteredResponses?.length || 0) && selectedRows.length > 0 ? (
                                                            <Check size={10} className="text-white" />
                                                        ) : selectedRows.length > 0 ? (
                                                            <div className="w-2 h-0.5 bg-indigo-600 rounded" />
                                                        ) : null}
                                                    </div>

                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setIsSelectAllMenuOpen(!isSelectAllMenuOpen); }}
                                                        className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${isSelectAllMenuOpen ? 'bg-slate-200 text-indigo-600' : 'text-slate-400'}`}
                                                    >
                                                        <ChevronDown size={10} />
                                                    </button>

                                                    <AnimatePresence>
                                                        {isSelectAllMenuOpen && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                className={`absolute top-full left-0 mt-2 w-48 rounded-2xl shadow-2xl border z-[300] overflow-hidden p-1.5 backdrop-blur-3xl ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                    ? 'bg-slate-900/95 border-white/10'
                                                                    : 'bg-white border-slate-200'
                                                                    }`}
                                                            >
                                                                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Batch Control</p>
                                                                </div>
                                                                {[50, 100, 200, 500].map(num => (
                                                                    <button
                                                                        key={num}
                                                                        onClick={() => toggleAllRows(num)}
                                                                        className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold flex items-center justify-between group/row transition-all ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                            ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                                                                            : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                                                                            }`}
                                                                    >
                                                                        <span>Select First {num}</span>
                                                                        <span className="text-[10px] opacity-0 group-hover/row:opacity-100 transition-opacity">Rows</span>
                                                                    </button>
                                                                ))}
                                                                <div className="p-2 mt-1 border-t border-slate-100">
                                                                    <div className="flex gap-1.5">
                                                                        <input
                                                                            type="number"
                                                                            placeholder="Custom"
                                                                            value={customSelectCount}
                                                                            onChange={(e) => setCustomSelectCount(e.target.value)}
                                                                            className="w-full px-2 py-1.5 rounded-lg border text-[10px] font-bold bg-slate-50 outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                                                        />
                                                                        <button
                                                                            onClick={() => toggleAllRows(parseInt(customSelectCount))}
                                                                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase"
                                                                        >
                                                                            Go
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                                <span className={`text-[9px] font-black ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-500' : 'text-slate-400'}`}>ID</span>
                                            </div>
                                        </th>
                                        {getColumns.map((col, cIdx) => {
                                            const metrics = columnMetrics[col.id];
                                            const { width, left: leftOffset, isSticky } = metrics;
                                            const groupKey = getColumnGroup(col);
                                            const style = getGroupStyle(groupKey);

                                            const TypeIcon = col.type === 'static' ? (col.id === '__profile' ? Maximize2 : Users) : (COLUMN_TYPES.find(t => t.id === col.type)?.icon || Type);

                                            const isFiltered = conditions.some(c => c.colId === col.id);
                                            return (
                                                <th
                                                    key={col.id}
                                                    style={{ width, left: isSticky ? leftOffset : undefined }}
                                                    className={`px-5 py-4 border-b border-[#EAECF0] text-[12px] font-black uppercase tracking-widest text-left relative group/h ${isSticky ? 'sticky shadow-[1px_0_0_#EAECF0]' : ''} ${activeColumnFilter === col.id ? 'z-[200]' : (isSticky ? 'z-40' : 'z-20')} ${style.bg} ${style.text} ${isFiltered ? (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-emerald-500/[0.08] border-b-emerald-500/30') : ''}`}
                                                >
                                                    <div className="flex items-center justify-between gap-1 w-full h-full pb-[2px]">
                                                        <div className="flex items-center gap-2 truncate shrink">
                                                            <TypeIcon size={12} className={`${style.text} shrink-0`} />
                                                            <span className="truncate">{col.id === "__profile" ? "View" : col.label}</span>
                                                        </div>

                                                        {col.id !== "__profile" && (
                                                            <div className="flex items-center gap-0.5 shrink-0 relative">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (sortBy === col.id) {
                                                                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                                                                        } else {
                                                                            setSortBy(col.id);
                                                                            setSortOrder("asc");
                                                                        }
                                                                    }}
                                                                    className={`p-1 rounded transition-colors ${sortBy === col.id ? 'text-indigo-600 opacity-100 bg-indigo-50' : 'text-slate-400 opacity-0 group-hover/h:opacity-100 hover:bg-slate-200 focus:opacity-100'}`}
                                                                    title="Sort"
                                                                >
                                                                    {sortBy === col.id ? (sortOrder === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />) : <ArrowUpDown size={10} />}
                                                                </button>
                                                                <button title="Filter"
                                                                    onClick={(e) => {
                                                                        if (activeColumnFilter === col.id) {
                                                                            setActiveColumnFilter(null);
                                                                            setActiveColumnFilterSearch("");
                                                                        } else {
                                                                            setActiveColumnFilter(col.id);
                                                                            setActiveColumnFilterSearch("");
                                                                        }
                                                                    }}
                                                                    className={`ignore-click-outside p-1 rounded transition-colors ${conditions.some(c => c.colId === col.id) ? 'text-indigo-600 opacity-100 bg-indigo-50' : 'text-slate-400 opacity-0 group-hover/h:opacity-100 hover:bg-slate-200 focus:opacity-100'}`}
                                                                >
                                                                    <Filter size={10} />
                                                                </button>
                                                                {activeColumnFilter === col.id && (
                                                                    <div
                                                                        className={`ignore-click-outside absolute top-full right-0 mt-1 shadow-2xl rounded-xl py-0 min-w-[220px] max-w-[300px] z-[9999] max-h-80 flex flex-col font-sans border backdrop-blur-3xl ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                            ? 'bg-slate-900/95 border-white/10 text-white'
                                                                            : 'bg-white border-slate-200 text-slate-900'
                                                                            }`}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        onMouseDown={(e) => e.stopPropagation()}
                                                                    >
                                                                        <div className={`px-4 py-2.5 border-b flex items-center justify-between shrink-0 ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/5 border-white/10' : 'bg-slate-50/50 border-slate-100'
                                                                            }`}>
                                                                            <span className={`text-[9px] font-black uppercase tracking-widest ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-indigo-400' : 'text-slate-800'}`}>{col.id === "__contributor" ? "By Submitter" : `Filter ${col.label}`}</span>
                                                                            <button onClick={() => setActiveColumnFilter(null)} className={`p-1 rounded-lg transition-all ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-500 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}>
                                                                                <X size={10} />
                                                                            </button>
                                                                        </div>
                                                                        <div className={`px-4 py-2.5 border-b sticky top-0 z-10 ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-100'}`}>
                                                                            <div className="relative">
                                                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={10} />
                                                                                <input
                                                                                    autoFocus
                                                                                    placeholder="Find value..."
                                                                                    value={activeColumnFilterSearch}
                                                                                    onChange={(e) => setActiveColumnFilterSearch(e.target.value)}
                                                                                    className={`w-full pl-7 pr-3 py-1.5 rounded-lg text-[10px] font-bold outline-none transition-all border ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                                        ? 'bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-indigo-500'
                                                                                        : 'bg-slate-100/50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-300 shadow-inner'
                                                                                        }`}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div className="overflow-y-auto custom-scrollbar flex-1 py-1">
                                                                            {col.type === "date" && (
                                                                                <div className={`p-3 rounded-lg border m-1 space-y-3 shrink-0 ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                                                                                    <div className="grid grid-cols-2 gap-2">
                                                                                        <button
                                                                                            onClick={() => setConditions(prev => [...prev.filter(c => c.colId !== col.id), { colId: col.id, op: 'today', val: '' }])}
                                                                                            className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-widest text-center transition-all ${conditions.some(c => c.colId === col.id && c.op === 'today') ? 'bg-indigo-600 text-white shadow-lg' : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100')}`}
                                                                                        >
                                                                                            Today
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => setConditions(prev => [...prev.filter(c => c.colId !== col.id), { colId: col.id, op: 'this_week', val: '' }])}
                                                                                            className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-widest text-center transition-all ${conditions.some(c => c.colId === col.id && c.op === 'this_week') ? 'bg-indigo-600 text-white shadow-lg' : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100')}`}
                                                                                        >
                                                                                            This Week
                                                                                        </button>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className={`text-[9px] font-black uppercase tracking-widest mb-1.5 block ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-indigo-400' : 'text-slate-500'}`}>Specific Date</span>
                                                                                        <div className="flex gap-2">
                                                                                            <input
                                                                                                type="date"
                                                                                                className={`flex-1 text-[10px] font-bold p-1.5 rounded-lg outline-none border transition-all ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/5 border-white/10 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-600 focus:border-indigo-500 shadow-sm'}`}
                                                                                                onChange={(e) => {
                                                                                                    const val = e.target.value;
                                                                                                    if (val) {
                                                                                                        setConditions(prev => [...prev.filter(c => c.colId !== col.id || c.op !== 'exact_date'), { colId: col.id, op: 'exact_date', val }]);
                                                                                                    } else {
                                                                                                        setConditions(prev => prev.filter(c => !(c.colId === col.id && c.op === 'exact_date')));
                                                                                                    }
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="grid grid-cols-2 gap-2">
                                                                                        <div>
                                                                                            <span className={`text-[8px] font-black uppercase tracking-widest mb-1 block ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-indigo-400' : 'text-slate-500'}`}>After</span>
                                                                                            <input type="date" className={`w-full text-[9px] font-bold p-1.5 rounded-lg outline-none border transition-all ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/5 border-white/10 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`} onChange={e => {
                                                                                                const val = e.target.value;
                                                                                                if (val) setConditions(prev => [...prev.filter(c => c.colId !== col.id || c.op !== 'after'), { colId: col.id, op: 'after', val }]);
                                                                                                else setConditions(prev => prev.filter(c => !(c.colId === col.id && c.op === 'after')));
                                                                                            }} />
                                                                                        </div>
                                                                                        <div>
                                                                                            <span className={`text-[8px] font-black uppercase tracking-widest mb-1 block ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-indigo-400' : 'text-slate-500'}`}>Before</span>
                                                                                            <input type="date" className={`w-full text-[9px] font-bold p-1.5 rounded-lg outline-none border transition-all ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/5 border-white/10 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`} onChange={e => {
                                                                                                const val = e.target.value;
                                                                                                if (val) setConditions(prev => [...prev.filter(c => c.colId !== col.id || c.op !== 'before'), { colId: col.id, op: 'before', val }]);
                                                                                                else setConditions(prev => prev.filter(c => !(c.colId === col.id && c.op === 'before')));
                                                                                            }} />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {/* Universal Quick Filters: Is Empty / Is Not Empty */}
                                                                            <div className={`px-1 py-1.5 border-b flex flex-col gap-0.5 shrink-0 ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/5 border-white/10' : 'bg-slate-50/50 border-slate-100'}`}>
                                                                                {[
                                                                                    { op: 'is_empty', label: 'Is Empty' },
                                                                                    { op: 'is_not_empty', label: 'Is Not Empty' }
                                                                                ].map(({ op, label }) => {
                                                                                    const isSelected = conditions.some(c => c.colId === col.id && c.op === op);
                                                                                    return (
                                                                                        <button
                                                                                            key={op}
                                                                                            onClick={() => {
                                                                                                if (isSelected) setConditions(prev => prev.filter(c => !(c.colId === col.id && c.op === op)));
                                                                                                else setConditions(prev => [...prev.filter(c => c.colId !== col.id), { colId: col.id, op, val: '' }]);
                                                                                            }}
                                                                                            className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-md' : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-600')}`}
                                                                                        >
                                                                                            <div className={`w-3 h-3 shrink-0 rounded flex items-center justify-center border ${isSelected ? 'bg-white/20 border-white/40' : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-slate-800 border-white/10' : 'bg-slate-200 border-slate-300')}`}>
                                                                                                {isSelected && <Check size={8} className="text-white" />}
                                                                                            </div>
                                                                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-200' : 'text-slate-600')}`}>{label}</span>
                                                                                        </button>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                            {(() => {
                                                                                let availableValues: { label: string, value: string }[] = [];

                                                                                if (col.id === "__assigned") {
                                                                                    availableValues = teamMembers.map(m => {
                                                                                        const name = `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email.split('@')[0];
                                                                                        return {
                                                                                            label: name,
                                                                                            value: m.clerkId
                                                                                        };
                                                                                    }).sort((a, b) => a.label.localeCompare(b.label));

                                                                                    if (isMaster || isPureMaster) {
                                                                                        const ownerOptions = teamMembers.map(m => {
                                                                                            const name = `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email.split('@')[0];
                                                                                            return { label: `Owner: ${name}`, value: `__GLOBAL_OWNER__${m.clerkId}` };
                                                                                        }).sort((a, b) => a.label.localeCompare(b.label));

                                                                                        const strictOptions = teamMembers.map(m => {
                                                                                            const name = `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email.split('@')[0];
                                                                                            return {
                                                                                                label: `[Strict] Reassigned to ${name}`,
                                                                                                value: `__STRICT_ASSIGNED__${m.clerkId}`
                                                                                            };
                                                                                        }).sort((a, b) => a.label.localeCompare(b.label));

                                                                                        availableValues = [...availableValues, ...ownerOptions, ...strictOptions];
                                                                                    }

                                                                                    availableValues.unshift({ label: "Reassigned to Me 🎯", value: "__REASSIGNED_TO_ME__" });
                                                                                    availableValues.unshift({ label: "Unassigned", value: "" });

                                                                                } else if ((col.type === "dropdown" || col.type === "multi_select" || col.type === "user") && Array.isArray(col.options) && col.options.length > 0) {
                                                                                    availableValues = col.options.map((o: any) => {
                                                                                        if (col.type === "user" && typeof o === 'string') {
                                                                                            const tm = teamMembers.find(t => t.clerkId === o);
                                                                                            const name = tm ? (tm.firstName ? `${tm.firstName} ${tm.lastName || ''}`.trim() : (tm.email ? tm.email.split('@')[0] : o)) : o;
                                                                                            return { label: name, value: name };
                                                                                        }
                                                                                        const label = typeof o === 'string' ? o : o.label;
                                                                                        return { label, value: label };
                                                                                    });
                                                                                } else if (col.id === "__contributor") {
                                                                                    const bestNames = new Map<string, string>(); // lowercase -> display
                                                                                    const dataSource = allResponsesForFollowUps.length > 0 ? allResponsesForFollowUps : (data?.responses || []);

                                                                                    const register = (raw: string) => {
                                                                                        if (!raw) return;
                                                                                        const full = raw.trim(); const low = full.toLowerCase();
                                                                                        if (!bestNames.has(low) || (full !== low && bestNames.get(low) === low)) bestNames.set(low, full);
                                                                                    };

                                                                                    dataSource.forEach(res => register(res.submittedByName));
                                                                                    teamMembers.forEach(m => {
                                                                                        const name = `${m.firstName || ""} ${m.lastName || ""}`.trim();
                                                                                        if (name) register(name);
                                                                                        else register(m.email.split('@')[0]);
                                                                                    });

                                                                                    availableValues = Array.from(bestNames.values())
                                                                                        .map(name => ({ label: name, value: name }))
                                                                                        .sort((a, b) => a.label.localeCompare(b.label));
                                                                                } else {
                                                                                    const vals = new Set<string>();
                                                                                    const dataSource = allResponsesForFollowUps.length > 0 ? allResponsesForFollowUps : (data?.responses || []);
                                                                                    dataSource.forEach(res => {
                                                                                        const v = getCellValue(res.id, col.id, col.isInternal);
                                                                                        if (v) vals.add(v.toString());
                                                                                    });
                                                                                    availableValues = Array.from(vals)
                                                                                        .filter(Boolean)
                                                                                        .sort()
                                                                                        .map(v => {
                                                                                            let label = v;
                                                                                            if (col.type === "date") {
                                                                                                label = safeFormat(v, "dd MMM yyyy");
                                                                                            }
                                                                                            return { label, value: v };
                                                                                        });
                                                                                }

                                                                                // 🛡️ Filter & Deduplicate the display options
                                                                                const isUserCol = col.id === "__assigned" || col.id === "__contributor" || col.type === "user";

                                                                                // 1. First, pass through whitelists and active filters
                                                                                const filteredOptions = availableValues.filter(opt => {
                                                                                    if (!opt.label || !opt.label.trim()) return false;
                                                                                    if (!isUserCol) return true;
                                                                                    if (opt.value === "" || opt.value === "unassigned") return true;

                                                                                    const isInternalOp = opt.value.startsWith("__REASSIGNED") || opt.value.startsWith("__STRICT_ASSIGNED");
                                                                                    if (isInternalOp) return true;

                                                                                    // Only show users who are active in teamMembers
                                                                                    return teamMembers.some(m =>
                                                                                        m.clerkId === opt.value ||
                                                                                        m.email === opt.label ||
                                                                                        m.name === opt.label ||
                                                                                        (m.firstName && opt.label.includes(m.firstName))
                                                                                    );
                                                                                });

                                                                                // 2. Deduplicate by label
                                                                                const displayValues: typeof availableValues = [];
                                                                                const seenLabels = new Set<string>();

                                                                                filteredOptions.forEach(opt => {
                                                                                    const lowLabel = opt.label.trim().toLowerCase();
                                                                                    if (!seenLabels.has(lowLabel)) {
                                                                                        seenLabels.add(lowLabel);
                                                                                        displayValues.push(opt);
                                                                                    }
                                                                                });

                                                                                const finalDisplayOptions = activeColumnFilterSearch
                                                                                    ? displayValues.filter(o => o.label.toLowerCase().includes(activeColumnFilterSearch.toLowerCase()))
                                                                                    : displayValues;

                                                                                if (!finalDisplayOptions || finalDisplayOptions.length === 0) {
                                                                                    return <div className={`px-4 py-8 text-center text-[10px] font-bold uppercase tracking-widest ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-600' : 'text-slate-400'}`}>
                                                                                        {activeColumnFilterSearch ? `No match found` : 'No data to filter'}
                                                                                    </div>;
                                                                                }

                                                                                return finalDisplayOptions.map(opt => {
                                                                                    const isSelected = conditions.some(c => c.colId === col.id && c.val === opt.value);
                                                                                    return (
                                                                                        <button
                                                                                            key={opt.value}
                                                                                            onClick={() => {
                                                                                                if (autoApply) setIsSyncing(true); // 🔥 Immediate feedback for Status and other filters
                                                                                                setCurrentPage(1); // Reset to first page on filter change
                                                                                                if (isSelected) {
                                                                                                    setConditions(prev => prev.filter(c => !(c.colId === col.id && c.val === opt.value)));
                                                                                                } else {
                                                                                                    let autoOp = 'equals';
                                                                                                    if (col.type === "multi_select" || col.type === "user") autoOp = 'contains';
                                                                                                    setConditions(prev => [...prev.filter(c => c.colId !== col.id || c.val !== opt.value), { colId: col.id, op: autoOp, val: opt.value }]);
                                                                                                }
                                                                                            }}
                                                                                            className={`w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2 group/btn transition-all ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                                                                                        >
                                                                                            <div className={`w-3.5 h-3.5 shrink-0 rounded flex items-center justify-center border transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 shadow-sm' : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/5 border-white/20' : 'bg-slate-100 border-slate-300 group-hover/btn:border-indigo-400')}`}>
                                                                                                {isSelected && <Check size={8} className="text-white relative top-[0.5px]" strokeWidth={3} />}
                                                                                            </div>
                                                                                            <span className={`text-[11px] truncate tracking-normal normal-case transition-colors ${isSelected ? 'font-black text-indigo-500' : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'font-bold text-slate-300 group-hover/btn:text-white' : 'font-bold text-slate-600')}`} title={opt.label}>
                                                                                                {opt.label}
                                                                                            </span>
                                                                                        </button>
                                                                                    );
                                                                                });
                                                                            })()}
                                                                        </div>
                                                                        {conditions.some(c => c.colId === col.id) && (
                                                                            <div className={`p-3 border-t shrink-0 ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                                                                                <button
                                                                                    onClick={() => setConditions(prev => prev.filter(c => c.colId !== col.id))}
                                                                                    className={`w-full text-center py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border shadow-sm ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                                        ? 'bg-rose-950/40 border-rose-500/30 text-rose-400 hover:bg-rose-900/60'
                                                                                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                                                                                        }`}
                                                                                >
                                                                                    Clear Filter
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div
                                                        onMouseDown={(e) => handleResizeStart(e, col.id, width)}
                                                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-400/50 transition-colors z-50"
                                                    />
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rowVirtualizer.getVirtualItems().length > 0 && (
                                        <tr>
                                            <td
                                                style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }}
                                                colSpan={data?.form?.fields?.length ? data.form.fields.length + (data.internalColumns?.length || 0) + 1 : 100}
                                                className="border-none p-0"
                                            />
                                        </tr>
                                    )}
                                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                        const res = paginatedResponses[virtualRow.index];
                                        if (!res) return null;
                                        const rIdx = virtualRow.index;
                                        return (
                                            <tr
                                                key={res.id}

                                                data-highlighted={highlightedRowId === res.id}
                                                data-row-color={res.rowColor || ""}
                                                className={`group cursor-pointer transition-none relative [&>td]:border-r ${(res as any).isOptimistic ? 'opacity-50' : ''} ${(openColorPicker === res.id || openAssignedCell === res.id) ? 'z-[100]' : 'z-10'} 
                                                    ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? '[&>td]:border-white/5' : '[&>td]:border-[#EAECF0]'}
                                                    ${density === 'compact' ? 'h-[32px] text-[13px] font-medium tracking-tight [&>td]:!py-0 [&>td]:!px-2' : density === 'comfortable' ? 'h-[80px] text-base' : 'h-[50px] text-[14px] [&>td]:!py-2'}                                                     ${(() => {
                                                        const remarks = res.remarks || [];
                                                        const latestRemark = remarks[0];
                                                        if (latestRemark?.nextFollowUpDate && latestRemark?.followUpStatus !== 'Closed') {
                                                            const followUpDate = new Date(latestRemark.nextFollowUpDate);
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            if (followUpDate < today) {
                                                                return 'bg-rose-50/30 border-y border-rose-100 shadow-[inset_4px_0_0_#e11d48]';
                                                            }
                                                        }
                                                        return '';
                                                    })()}`}
                                            >
                                                <td className={`border-b border-[#EAECF0] text-center sticky left-0 bg-white group-hover:bg-[#F9FAFB] z-[35] 
                                                    ${isPureMaster ? 'w-[70px]' : 'w-[56px]'} 
                                                    ${density === 'compact' ? 'h-[32px]' : density === 'comfortable' ? 'h-[80px]' : 'h-[50px]'} 
                                                    overflow-visible shadow-[1px_0_0_#EAECF0]`}
                                                >
                                                    <div className="flex items-center justify-center gap-2 w-full h-full">
                                                        <div
                                                            onClick={(e) => { e.stopPropagation(); toggleRowSelection(res.id); }}
                                                            className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center cursor-pointer transition-all shadow-sm shrink-0 ${selectedRows.includes(res.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-[#D0D5DD]'}`}
                                                        >
                                                            {selectedRows.includes(res.id) && <Check size={8} className="text-white" />}
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[9px] font-black text-slate-400">
                                                                {((currentPage - 1) * rowsPerPage) + rIdx + 1}
                                                            </span>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setSelectedResponse(res); }}
                                                                className={`p-1 rounded-md transition-all ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-500 hover:text-indigo-400 hover:bg-white/10' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
                                                                title="Activity Archive"
                                                            >
                                                                <History size={10} />
                                                            </button>
                                                            {isPureMaster && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (window.confirm("Are you sure you want to delete this response? This action cannot be undone.")) {
                                                                            handleDeleteRow(res.id);
                                                                        }
                                                                    }}
                                                                    className={`p-1 px-2 border rounded-md transition-all flex items-center gap-1 mt-1 group-hover:scale-105 ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                        ? 'text-rose-400 bg-rose-950/40 border-rose-500/30 hover:bg-rose-900/60'
                                                                        : 'text-rose-500 bg-rose-50 border-rose-200 hover:bg-rose-100'
                                                                        }`}
                                                                    title="Master Purge"
                                                                >
                                                                    <Trash2 size={12} />
                                                                    <span className="text-[7px] font-black uppercase">Purge</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                {getColumns.map((col, cIdx) => {
                                                    const val = col.type === "static"
                                                        ? ""
                                                        : getCellValue(res.id, col.id, col.isInternal);

                                                    const metrics = columnMetrics[col.id];
                                                    const { width, left: leftOffset, isSticky } = metrics;
                                                    const isFocused = focusedCell?.rowId === res.id && focusedCell?.colId === col.id;

                                                    if (col.id === "__profile") {
                                                        return (
                                                            <td
                                                                key={col.id}
                                                                id={`cell-${res.id}-${col.id}`}
                                                                style={{ width, left: isSticky ? leftOffset : undefined }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFocusedCell({ rowId: res.id, colId: col.id });
                                                                }}
                                                                className={`px-4 py-2 border-b text-center transition-colors relative ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                    ? 'border-white/5 group-hover:bg-white/5'
                                                                    : 'border-[#EAECF0] group-hover:bg-[#F9FAFB]'
                                                                    } ${isSticky ? `sticky z-30 shadow-[1px_0_0_#EAECF0] ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-slate-900 border-white/10' : 'bg-white border-[#EAECF0]'}` : ''} ${isFocused ? 'ring-2 ring-inset ring-indigo-500 z-50' : ''}`}
                                                            >
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setSelectedResponse(res); setHighlightedRowId(res.id); }}
                                                                        className={`p-1.5 rounded-lg transition-all border border-transparent ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                            ? 'text-slate-400 hover:text-indigo-400 hover:bg-white/5 hover:border-white/10'
                                                                            : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100'
                                                                            }`}
                                                                    >
                                                                        <Maximize2 size={14} />
                                                                    </button>

                                                                    <div className="relative">
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); setOpenColorPicker(openColorPicker === res.id ? null : res.id); }}
                                                                            className={`ignore-click-outside p-1.5 rounded-lg transition-all border border-transparent ${res.rowColor
                                                                                ? (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-amber-400 bg-amber-950/40 border-amber-500/30' : 'text-amber-600 bg-amber-50 border-amber-200')
                                                                                : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-400 hover:text-amber-400 hover:bg-white/5 hover:border-white/10' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200')
                                                                                }`}
                                                                        >
                                                                            <Palette size={14} />
                                                                        </button>
                                                                        {openColorPicker === res.id && (
                                                                            <div
                                                                                className="ignore-click-outside absolute bottom-full left-0 mb-3 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-2xl p-2.5 border border-slate-200 z-[99999] flex gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                onMouseDown={(e) => e.stopPropagation()}
                                                                            >
                                                                                <div className="absolute -bottom-1.5 left-3 w-3 h-3 bg-white border-b border-r border-slate-200 rotate-45" />
                                                                                {[
                                                                                    "#fffbeb", "#f0fdf4", "#eff6ff", "#fdf2f8", "#fafaf9", "#fff1f2",
                                                                                    "#f5f3ff", "#fff7ed", "#eef2ff", "#fefce8", "#ecfdf5", "#ecfeff"
                                                                                ].map(c => (
                                                                                    <button
                                                                                        key={c}
                                                                                        onClick={(e) => { e.stopPropagation(); handleUpdateRowColor(res.id, c); setOpenColorPicker(null); }}
                                                                                        className="w-6 h-6 rounded-full border border-slate-200 hover:scale-110 transition-transform shadow-sm"
                                                                                        style={{ backgroundColor: c }}
                                                                                    />
                                                                                ))}
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleUpdateRowColor(res.id, null); setOpenColorPicker(null); }}
                                                                                    className="w-6 h-6 rounded-full border border-slate-200 hover:scale-110 transition-transform shadow-sm bg-white flex items-center justify-center"
                                                                                    title="Clear Color"
                                                                                >
                                                                                    <X size={10} className="text-slate-400" />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        );
                                                    }

                                                    if (col.id === "__contributor") {
                                                        return (
                                                            <td
                                                                key={col.id}
                                                                id={`cell-${res.id}-${col.id}`}
                                                                style={{ width, left: isSticky ? leftOffset : undefined }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFocusedCell({ rowId: res.id, colId: col.id });
                                                                }}
                                                                className={`px-5 py-3 border-b transition-colors relative ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                    ? 'border-white/5 group-hover:bg-white/5'
                                                                    : 'border-[#EAECF0] group-hover:bg-[#F9FAFB]'
                                                                    } ${isSticky ? `sticky z-30 shadow-[1px_0_0_#EAECF0] ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-slate-900' : 'bg-white'}` : ''} ${isFocused ? 'ring-2 ring-inset ring-indigo-500 z-50' : ''}`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm border overflow-hidden ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                        ? 'bg-indigo-950 text-indigo-400 border-indigo-500/30'
                                                                        : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                                        }`}>
                                                                        {(() => {
                                                                            const m = teamMembers.find(t => t.clerkId === res.submittedBy);
                                                                            return <img src={getFallbackAvatar(res.submittedBy || 'guest', m?.imageUrl)} alt="avatar" className="w-full h-full object-cover" />;
                                                                        })()}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className={`text-[13px] font-black truncate uppercase tracking-tight leading-none mb-1 ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-white' : 'text-slate-900'}`}>{res.submittedByName || "Guest User"}</p>
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{res.submittedAt ? format(new Date(res.submittedAt), "MMM dd, HH:mm") : "Unknown Time"}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        );
                                                    }

                                                    if (col.id === "__assigned") {
                                                        const rawAssigned = res.assignedTo || [];
                                                        const rawVisible = res.visibleToUsers || [];

                                                        const defaultVisibleIds: string[] = [];
                                                        if (res.submittedBy) defaultVisibleIds.push(res.submittedBy);
                                                        const authorityIds = teamMembers.filter(m => {
                                                            const r = (m.role || "").toUpperCase();
                                                            return r === "ADMIN" || r === "MASTER" || r === "TL";
                                                        }).map(m => m.clerkId);

                                                        const assignedUsers = Array.from(new Set([...rawAssigned, ...rawVisible, ...defaultVisibleIds]));
                                                        const isCellOpen = openAssignedCell === res.id;
                                                        return (
                                                            <td
                                                                key={col.id}
                                                                id={`cell-${res.id}-${col.id}`}
                                                                style={{ width, left: isSticky ? leftOffset : undefined }}
                                                                className={`ignore-click-outside px-5 py-3 border-b transition-colors relative cursor-pointer ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                    ? 'border-white/5 group-hover:bg-white/5'
                                                                    : 'border-[#EAECF0] group-hover:bg-[#F9FAFB]'
                                                                    } ${isSticky ? `sticky z-30 shadow-[1px_0_0_#EAECF0] ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-slate-900' : 'bg-white'}` : ''} ${isCellOpen ? 'z-[100]' : (isSticky ? 'z-30' : '')} ${isFocused ? 'ring-2 ring-inset ring-indigo-500 z-50' : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFocusedCell({ rowId: res.id, colId: col.id });
                                                                    if (isCellOpen) setOpenAssignedCell(null);
                                                                    else setOpenAssignedCell(res.id);
                                                                }}
                                                            >
                                                                {assignedUsers.length === 0 ? (
                                                                    <div className="text-[10px] font-bold text-slate-400 mt-1">Unassigned</div>
                                                                ) : (
                                                                    <div className="flex -space-x-1.5 overflow-visible py-1">
                                                                        {assignedUsers.slice(0, 5).map((uid) => {
                                                                            const m = teamMembers.find(t => t.clerkId === uid);
                                                                            const initial = m?.firstName ? (m.firstName[0]?.toUpperCase() || '?') : m?.email ? (m.email[0]?.toUpperCase() || '?') : '?';
                                                                            return (
                                                                                <div key={uid} title={m?.firstName ? `${m.firstName} ${m.lastName || ''}` : (m?.email || 'Unknown')} className={`inline-flex h-7 w-7 rounded-full ring-2 items-center justify-center text-[10px] font-black shadow-sm border shrink-0 hover:z-10 duration-200 overflow-hidden ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                                    ? 'ring-slate-900 bg-indigo-950 text-indigo-400 border-indigo-500/30 hover:ring-indigo-500'
                                                                                    : 'ring-white bg-indigo-50 text-indigo-700 border-indigo-100 hover:ring-indigo-500'
                                                                                    }`}>
                                                                                    <img src={getFallbackAvatar(uid, m?.imageUrl)} alt="avatar" className="w-full h-full object-cover" />
                                                                                </div>
                                                                            );
                                                                        })}
                                                                        {assignedUsers.length > 5 && (
                                                                            <div className="inline-flex h-7 w-7 rounded-full ring-2 ring-white bg-slate-100 items-center justify-center text-[9px] font-black text-slate-500 shadow-sm border border-slate-200 shrink-0">
                                                                                +{assignedUsers.length - 5}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Assigned Users Dropdown Modal/List */}
                                                                <AnimatePresence>
                                                                    {isCellOpen && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                                                            transition={{ duration: 0.2 }}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            onMouseDown={(e) => e.stopPropagation()}
                                                                            className="ignore-click-outside absolute top-12 left-0 z-50 w-64 bg-white/70 backdrop-blur-3xl border border-slate-200 shadow-2xl rounded-2xl p-2 flex flex-col gap-1 max-h-[300px] overflow-y-auto"
                                                                        >
                                                                            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between mb-1 sticky top-0 bg-white/80 backdrop-blur-md z-10">
                                                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authorized Access</span>
                                                                                <button onClick={() => setOpenAssignedCell(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                                                                                    <X size={12} />
                                                                                </button>
                                                                            </div>
                                                                            {assignedUsers.length === 0 ? (
                                                                                <div className="p-4 text-center text-[10px] font-bold text-slate-400">No users assigned.</div>
                                                                            ) : (
                                                                                assignedUsers.map(uid => {
                                                                                    const m = teamMembers.find(t => t.clerkId === uid);
                                                                                    let badgeText = "Viewer";
                                                                                    let badgeColor = "bg-slate-100 text-slate-500 border-slate-200";

                                                                                    if (authorityIds.includes(uid)) {
                                                                                        badgeText = "Admin";
                                                                                        badgeColor = "bg-rose-50 text-rose-600 border-rose-100";
                                                                                    } else if (res.submittedBy === uid) {
                                                                                        badgeText = "Submitter";
                                                                                        badgeColor = "bg-indigo-50 text-indigo-600 border-indigo-100";
                                                                                    } else if (rawAssigned.includes(uid)) {
                                                                                        badgeText = "Assigned";
                                                                                        badgeColor = "bg-emerald-50 text-emerald-600 border-emerald-100";
                                                                                    }

                                                                                    const initialStr = m?.firstName ? (m.firstName[0]?.toUpperCase() || '?') : m?.email ? (m.email[0]?.toUpperCase() || '?') : '?';

                                                                                    return (
                                                                                        <div key={uid} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/50 transition-colors">
                                                                                            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shadow-sm border border-slate-200 shrink-0 flex items-center justify-center text-[10px] font-black text-slate-600">
                                                                                                <img src={getFallbackAvatar(uid, m?.imageUrl)} alt="img" className="w-full h-full object-cover" />
                                                                                            </div>
                                                                                            <div className="flex-1 min-w-0">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <p className="text-[11px] font-bold text-slate-900 truncate">
                                                                                                        {m?.firstName ? `${m.firstName} ${m.lastName || ''}` : (m?.email ? m.email.split('@')[0] : 'Unknown')}
                                                                                                    </p>
                                                                                                    <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest border shrink-0 ${badgeColor}`}>
                                                                                                        {badgeText}
                                                                                                    </span>
                                                                                                </div>
                                                                                                <p className="text-[9px] text-slate-500 truncate">{m?.email || 'No email'}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })
                                                                            )}
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </td>
                                                        );
                                                    }

                                                    if (col.id === "__followup") {
                                                        const remarksCount = res.remarks?.length || 0;
                                                        return (
                                                            <td
                                                                key={col.id}
                                                                id={`cell-${res.id}-${col.id}`}
                                                                style={{ width, left: isSticky ? leftOffset : undefined }}
                                                                className={`px-5 py-3 border-b transition-colors relative cursor-pointer text-center ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                    ? 'border-white/5 group-hover:bg-white/5'
                                                                    : 'border-[#EAECF0] group-hover:bg-[#F9FAFB]'
                                                                    } ${isSticky ? `sticky z-30 shadow-[1px_0_0_#EAECF0] ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-slate-900' : 'bg-white'}` : ''} ${isFocused ? 'ring-2 ring-inset ring-indigo-500 z-50' : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFocusedCell({ rowId: res.id, colId: col.id });
                                                                    setOpenFollowUpModal({ formId: data?.form?.id || '', responseId: res.id });
                                                                }}
                                                            >
                                                                <button className="inline-flex items-center justify-center gap-1.5 px-2 py-1 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded shadow-sm text-[10px] font-black uppercase tracking-widest transition-all">
                                                                    <Calendar size={12} />
                                                                    {remarksCount > 0 ? (
                                                                        <span className="w-4 h-4 rounded bg-indigo-100 flex items-center justify-center text-indigo-700">{remarksCount}</span>
                                                                    ) : "Add"}
                                                                </button>
                                                            </td>
                                                        );
                                                    }

                                                    if (col.id === "__recentRemark") {
                                                        const latestRemark = res.remarks?.[0]?.remark || "";
                                                        return (
                                                            <td
                                                                key={col.id}
                                                                id={`cell-${res.id}-${col.id}`}
                                                                style={{ width, left: isSticky ? leftOffset : undefined }}
                                                                className={`px-5 py-3 border-b transition-colors relative cursor-pointer ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                    ? 'border-white/5 group-hover:bg-white/5'
                                                                    : 'border-[#EAECF0] group-hover:bg-[#F9FAFB]'
                                                                    } ${isSticky ? `sticky z-30 shadow-[1px_0_0_#EAECF0] ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-slate-900' : 'bg-white'}` : ''} ${isFocused ? 'ring-2 ring-inset ring-indigo-500 z-50' : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFocusedCell({ rowId: res.id, colId: col.id });
                                                                    setOpenFollowUpModal({ formId: data?.form?.id || '', responseId: res.id });
                                                                }}
                                                            >
                                                                {latestRemark ? <span className="text-xs font-bold text-indigo-600 truncate block max-w-full">{latestRemark}</span> : <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">+ Add</span>}
                                                            </td>
                                                        );
                                                    }

                                                    if (col.id === "__nextFollowUpDate") {
                                                        const latest = res.remarks?.[0];
                                                        const nextDate = latest?.nextFollowUpDate;
                                                        return (
                                                            <td
                                                                key={col.id}
                                                                id={`cell-${res.id}-${col.id}`}
                                                                style={{ width, left: isSticky ? leftOffset : undefined }}
                                                                className={`px-5 py-3 border-b transition-colors relative cursor-pointer text-center ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                    ? 'border-white/5 group-hover:bg-white/5'
                                                                    : 'border-[#EAECF0] group-hover:bg-[#F9FAFB]'
                                                                    } ${isSticky ? `sticky z-30 shadow-[1px_0_0_#EAECF0] ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-slate-900' : 'bg-white'}` : ''} ${isFocused ? 'ring-2 ring-inset ring-indigo-500 z-50' : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFocusedCell({ rowId: res.id, colId: col.id });
                                                                    setOpenFollowUpModal({ formId: data?.form?.id || '', responseId: res.id });
                                                                }}
                                                            >
                                                                {nextDate ? (
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest border px-2 py-1 rounded inline-block shadow-sm transition-all ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                        ? 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                                        }`}>
                                                                        {safeFormat(nextDate.toString(), "MMM dd")}
                                                                    </span>
                                                                ) : <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">+ Schedule</span>}
                                                            </td>
                                                        );
                                                    }

                                                    const isStatusCol = ["status", "follow-up status", "follow up status", "lead status", "call status", "interaction", "selec status", "select status", "crm tracking"].some(s => col.label?.toLowerCase().includes(s)) || col.id === "__followUpStatus";

                                                    if (isStatusCol) {
                                                        const latestStatus = col.id === "__followUpStatus" ? (res.remarks?.[0]?.followUpStatus || "") : val;
                                                        return (
                                                            <td
                                                                key={col.id}
                                                                id={`cell-${res.id}-${col.id}`}
                                                                style={{ width, left: isSticky ? leftOffset : undefined }}
                                                                className={`px-4 py-2 border-b transition-colors cursor-pointer relative text-center ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                    ? 'border-white/5 group-hover:bg-white/5'
                                                                    : 'border-[#EAECF0] group-hover:bg-[#F9FAFB]'
                                                                    } ${isSticky ? `sticky z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-slate-900 border-white/10' : 'bg-white border-[#EAECF0]'}` : ''} ${isFocused ? 'ring-2 ring-inset ring-indigo-500 z-50' : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFocusedCell({ rowId: res.id, colId: col.id });
                                                                    setStatusMatrixModal({
                                                                        rowId: res.id,
                                                                        colId: col.id,
                                                                        label: col.label || "Status",
                                                                        options: col.options || [],
                                                                        val: latestStatus,
                                                                        isInternal: col.isInternal
                                                                    });
                                                                }}
                                                            >
                                                                {latestStatus ? (
                                                                    <span className={`text-[10px] font-black uppercase border px-2 py-1 rounded inline-block tracking-widest shadow-sm transition-all ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                        ? (['Closed', 'Follow-up Done', 'Walked In', 'Call done'].includes(latestStatus) ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' :
                                                                            ['Missed', 'Not interested', 'Invalid Number'].includes(latestStatus) ? 'bg-rose-950/40 text-rose-400 border-rose-500/30' :
                                                                                ['RNR', 'RNR2 (Checked)', 'RNR3', 'Switch off', 'Call Again'].includes(latestStatus) ? 'bg-amber-950/40 text-amber-400 border-amber-500/30' :
                                                                                    ['Scheduled', 'Walk-in scheduled'].includes(latestStatus) ? 'bg-blue-950/40 text-blue-400 border-blue-500/30' :
                                                                                        'bg-indigo-950/40 text-indigo-400 border-indigo-500/30')
                                                                        : (['Closed', 'Follow-up Done', 'Walked In', 'Call done'].includes(latestStatus) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                            ['Missed', 'Not interested', 'Invalid Number'].includes(latestStatus) ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                                                ['RNR', 'RNR2 (Checked)', 'RNR3', 'Switch off', 'Call Again'].includes(latestStatus) ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                                    ['Scheduled', 'Walk-in scheduled'].includes(latestStatus) ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                                        'bg-indigo-50 text-indigo-700 border-indigo-200')
                                                                        }`}>
                                                                        {latestStatus}
                                                                    </span>
                                                                ) : <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">-</span>}
                                                            </td>
                                                        );
                                                    }

                                                    if (col.id === "__payment") {
                                                        const payments = (res as any).payments || [];
                                                        const totalAmount = payments.reduce((s: number, p: any) => s + p.amount, 0);
                                                        const totalReceived = payments.reduce((s: number, p: any) => s + p.received, 0);
                                                        const pending = totalAmount - totalReceived;
                                                        const fmt = (n: number) => n > 0 ? `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—";
                                                        return (
                                                            <td
                                                                key={col.id}
                                                                id={`cell-${res.id}-${col.id}`}
                                                                style={{ width, left: isSticky ? leftOffset : undefined }}
                                                                className={`px-3 py-2 border-b transition-colors relative text-center group/paymentcel ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                    ? 'border-white/5 hover:bg-white/5'
                                                                    : 'border-[#EAECF0] hover:bg-slate-50'
                                                                    } ${isSticky ? `sticky z-30 shadow-[1px_0_0_#EAECF0] ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-slate-900 border-white/10' : 'bg-white border-[#EAECF0]'}` : ""} ${isFocused ? 'ring-2 ring-inset ring-indigo-500 z-50' : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFocusedCell({ rowId: res.id, colId: col.id });
                                                                    setOpenPaymentModal({ formId: data?.form?.id || "", responseId: res.id });
                                                                }}
                                                            >
                                                                {(isMaster || isPureMaster) && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setIsPaymentHubOpen(true);
                                                                        }}
                                                                        className={`absolute top-1 right-1 opacity-0 group-hover/paymentcel:opacity-100 p-1 border border-transparent rounded transition-all shadow-sm ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                            ? 'bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white'
                                                                            : 'bg-white hover:bg-emerald-50 hover:border-emerald-200 text-slate-300 hover:text-emerald-600'
                                                                            }`}
                                                                        title="Open Full Payment Hub Dashboard"
                                                                    >
                                                                        <ExternalLink size={10} />
                                                                    </button>
                                                                )}
                                                                {totalAmount > 0 ? (
                                                                    <div className="flex flex-col items-center gap-0.5 mt-1">
                                                                        <span className="text-[10px] font-black text-blue-700">{fmt(totalAmount)}</span>
                                                                        <div className="flex gap-1">
                                                                            <span className="text-[9px] font-bold text-emerald-600">✓{fmt(totalReceived)}</span>
                                                                            {pending > 0 && <span className="text-[9px] font-bold text-rose-500">⏳{fmt(pending)}</span>}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <button className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded shadow-sm text-[10px] font-black uppercase tracking-widest transition-all border ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                        ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-emerald-500/50 hover:text-emerald-400'
                                                                        : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'
                                                                        }`}>
                                                                        <span>₹</span> Add
                                                                    </button>
                                                                )}
                                                            </td>
                                                        );
                                                    }


                                                    const isInternal = col.isInternal;
                                                    const isEditing = editingCell?.rowId === res.id && editingCell?.colId === col.id;
                                                    const currentClerkId = (data as any).clerkId;
                                                    const gac = colPermissions || { roles: {}, users: {} };
                                                    const rolePerm = gac.roles?.[userRole]?.[col.id];
                                                    const userPerm = gac.users?.[currentClerkId]?.[col.id];

                                                    // NEW: Logic sync with backend -- if assigned, default to edit unless hidden
                                                    const finalPerm = userPerm || rolePerm || (isInternal ? "hide" : "edit");

                                                    const canEdit = isMaster || finalPerm === "edit";
                                                    const isLocked = !!col.isLocked || !canEdit;
                                                    const isSaving = savingCells.has(`${res.id}-${col.id}`);

                                                    return (
                                                        <td
                                                            key={col.id}
                                                            id={`cell-${res.id}-${col.id}`}
                                                            style={{ width, left: isSticky ? leftOffset : undefined }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFocusedCell({ rowId: res.id, colId: col.id });

                                                                if (isStatusCol) {
                                                                    setStatusMatrixModal({
                                                                        rowId: res.id,
                                                                        colId: col.id,
                                                                        label: col.label || "Status",
                                                                        options: col.options || [],
                                                                        val: val,
                                                                        isInternal: col.isInternal
                                                                    });
                                                                    return;
                                                                }

                                                                if (!isLocked && !isEditing) {
                                                                    setEditingCell({ rowId: res.id, colId: col.id });
                                                                    setEditValue(val);
                                                                }
                                                            }}
                                                            className={`px-5 border-b transition-colors relative select-none ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                ? 'border-white/5 group-hover:bg-white/5'
                                                                : 'border-[#EAECF0] group-hover:bg-[#F9FAFB]'
                                                                } ${isSticky ? `sticky z-30 shadow-[1px_0_0_#EAECF0] ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-slate-900' : 'bg-white'}` : ''} ${isEditing ? (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-slate-800 ring-2 ring-inset ring-indigo-500 z-40 shadow-xl' : 'bg-white ring-2 ring-inset ring-indigo-500 z-40 shadow-xl') : ''} ${isFocused && !isEditing ? 'ring-2 ring-inset ring-indigo-500 z-50' : ''} ${isLocked ? (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/5 cursor-not-allowed' : 'bg-[#F9FAFB]/50 cursor-not-allowed') : 'cursor-text'} 
                                                                ${density === 'compact' ? 'py-1' : density === 'comfortable' ? 'py-6' : 'py-3'}`}
                                                        >
                                                            {isEditing ? (
                                                                <div className="w-full" onClick={(e) => e.stopPropagation()}>
                                                                    {["status", "follow-up status", "follow up status", "lead status", "call status", "interaction"].some(s => col.label?.toLowerCase().includes(s)) || col.id === "__followUpStatus" ? (
                                                                        <select
                                                                            autoFocus
                                                                            className={`w-full bg-transparent border-none focus:ring-0 p-0 font-black outline-none transition-colors ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-indigo-400' : 'text-indigo-700'} ${density === 'compact' ? 'text-[13px]' : 'text-[15px]'}`}
                                                                            value={editValue}
                                                                            onChange={(e) => {
                                                                                const newV = e.target.value;
                                                                                setEditValue(newV);
                                                                                handleStatusCellUpdate(res.id, col.id, newV, isInternal);
                                                                                setEditingCell(null);
                                                                            }}
                                                                            onBlur={() => setEditingCell(null)}
                                                                        >
                                                                            <option value="">Status...</option>
                                                                            {CALL_STATUS_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-white text-slate-900">{opt}</option>)}
                                                                        </select>
                                                                    ) : col.type === "dropdown" ? (
                                                                        <select autoFocus className={`w-full bg-transparent border-none focus:ring-0 p-0 font-bold outline-none transition-colors ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-200' : 'text-slate-900'} ${density === 'compact' ? 'text-[13px]' : 'text-[15px]'}`} value={editValue} onChange={(e) => { const newV = e.target.value; setEditValue(newV); handleUpdateValue(res.id, col.id, newV, isInternal); setEditingCell(null); }}>
                                                                            <option value="">Select...</option>
                                                                            {Array.isArray(col.options) && col.options.map((opt: any) => {
                                                                                const label = typeof opt === 'string' ? opt : opt.label;
                                                                                return <option key={label} value={label} className="bg-white text-slate-900">{label}</option>;
                                                                            })}
                                                                        </select>
                                                                    ) : col.type === "user" ? (
                                                                        <select autoFocus className={`w-full bg-transparent border-none focus:ring-0 p-0 font-bold outline-none transition-colors ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-200' : 'text-slate-900'} ${density === 'compact' ? 'text-[13px]' : 'text-[15px]'}`} value={editValue} onChange={(e) => { const newV = e.target.value; setEditValue(newV); handleUpdateValue(res.id, col.id, newV, isInternal); setEditingCell(null); }}>
                                                                            <option value="">Assigned To...</option>
                                                                            {teamMembers
                                                                                .filter(m => col.id === "__assigned" || !col.options || (Array.isArray(col.options) && col.options.length === 0) || (Array.isArray(col.options) && col.options.some((o: any) => o === m.clerkId || o.value === m.clerkId)))
                                                                                .map(m => {
                                                                                    const name = m.firstName ? `${m.firstName} ${m.lastName || ''}`.trim() : m.email.split('@')[0];
                                                                                    return <option key={m.clerkId} value={m.clerkId} className="bg-white text-slate-900">{name.toUpperCase()} ({m.role || 'STAFF'})</option>;
                                                                                })}
                                                                        </select>
                                                                    ) : col.type === "date" ? (
                                                                        <input type="date" autoFocus className={`w-full bg-transparent border-none focus:ring-0 p-0 font-bold outline-none transition-colors ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-200' : 'text-slate-900'} ${density === 'compact' ? 'text-[13px]' : 'text-[15px]'}`} value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => { handleUpdateValue(res.id, col.id, editValue, isInternal); setEditingCell(null); }} />
                                                                    ) : col.type === "number" || col.type === "currency" ? (
                                                                        <input type="text" inputMode="numeric" autoFocus className={`w-full bg-transparent border-none focus:ring-0 p-0 font-bold outline-none transition-colors ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-200' : 'text-slate-900'} ${density === 'compact' ? 'text-[13px]' : 'text-[15px]'}`} value={editValue} onChange={(e) => setEditValue(e.target.value.replace(/[^0-9+-.]/g, ''))} onBlur={() => { handleUpdateValue(res.id, col.id, editValue, isInternal); setEditingCell(null); }} />
                                                                    ) : col.type === "long_text" ? (
                                                                        <textarea autoFocus className={`w-full bg-transparent border-none focus:ring-0 p-0 font-bold outline-none min-h-[60px] resize-none transition-colors ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-200' : 'text-slate-900'} ${density === 'compact' ? 'text-[13px]' : 'text-[15px]'}`} value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => { handleUpdateValue(res.id, col.id, editValue, isInternal); setEditingCell(null); }} />
                                                                    ) : (
                                                                        <input autoFocus className={`w-full bg-transparent border-none focus:ring-0 p-0 font-bold outline-none transition-colors ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-200' : 'text-slate-900'} ${density === 'compact' ? 'text-[13px]' : 'text-[15px]'}`} value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => { handleUpdateValue(res.id, col.id, editValue, isInternal); setEditingCell(null); }} />
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-between min-h-[24px] min-w-0">
                                                                    <div className="flex items-center min-w-0 overflow-hidden">
                                                                        {col.type === "dropdown" && val ? (
                                                                            <div className="flex -space-x-1 group/badge shrink-0">
                                                                                <span className={`px-2.5 py-1 rounded-full font-black uppercase tracking-widest border transition-all ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                                    ? (val.toLowerCase() === 'paid' || val.toLowerCase().includes('done') ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 shadow-[0_4px_12px_rgba(16,185,129,0.2)]' :
                                                                                        val.toLowerCase().includes('unable') || val.toLowerCase().includes('failed') ? 'bg-rose-950/40 text-rose-400 border-rose-500/30' :
                                                                                            'bg-indigo-950/40 text-indigo-400 border-indigo-500/30')
                                                                                    : (val.toLowerCase() === 'paid' || val.toLowerCase().includes('done') ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-[0_4px_12px_rgba(16,185,129,0.1)]' :
                                                                                        val.toLowerCase().includes('unable') || val.toLowerCase().includes('failed') ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                                                            'bg-indigo-50 text-indigo-700 border-indigo-100')
                                                                                    }`} style={{ fontSize: density === 'compact' ? '9px' : '11px' }}>
                                                                                    {val}
                                                                                </span>
                                                                            </div>
                                                                        ) : col.type === "user" && val ? (
                                                                            <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border shrink-0 transition-colors ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                                ? 'bg-white/5 border-white/10'
                                                                                : 'bg-slate-50 border-slate-200'
                                                                                }`}>
                                                                                <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] font-black text-white uppercase shadow-sm">
                                                                                    {teamMembers.find(m => m.clerkId === val)?.email?.[0] || '?'}
                                                                                </div>
                                                                                <span className={`text-[11px] font-black truncate max-w-[80px] ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-300' : 'text-slate-600'
                                                                                    }`}>
                                                                                    {teamMembers.find(m => m.clerkId === val)?.firstName || val.split('_').pop()?.slice(0, 5)}
                                                                                </span>
                                                                            </div>
                                                                        ) : col.type === "date" && val ? (
                                                                            <span className={`text-[13px] font-bold flex items-center gap-1.5 uppercase tracking-tighter px-2.5 py-1.5 rounded-md shrink-0 transition-colors ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                                ? 'bg-white/5 text-slate-300'
                                                                                : 'bg-slate-100/50 text-slate-600'
                                                                                }`}>
                                                                                <Calendar size={12} className="text-rose-400" />
                                                                                {safeFormat(val, "MMM dd, yyyy")}
                                                                            </span>
                                                                        ) : col.type === "checkbox" ? (
                                                                            <div
                                                                                onClick={(e) => { e.stopPropagation(); handleUpdateValue(res.id, col.id, val === "true" ? "false" : "true", true); }}
                                                                                className={`w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center cursor-pointer shrink-0 ${val === "true" ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-100' : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200')}`}
                                                                            >
                                                                                {val === "true" && <Check size={14} className="text-white" />}
                                                                            </div>
                                                                        ) : col.type === "currency" && val ? (
                                                                            <span className={`text-[13px] font-black flex items-center gap-0.5 shrink-0 ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-white' : 'text-slate-900'}`}>
                                                                                <IndianRupee size={12} className="text-slate-400" />
                                                                                {parseFloat(val).toLocaleString('en-IN')}
                                                                            </span>
                                                                        ) : col.type === "file" && val ? (
                                                                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                                                                <a href={val} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 hover:bg-indigo-100 transition-colors shrink-0">
                                                                                    <ExternalLink size={12} />
                                                                                    <span className="text-[11px] font-black uppercase tracking-tighter">View</span>
                                                                                </a>
                                                                                <a href={val.replace('/upload/', '/upload/fl_attachment/')} download className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 hover:bg-emerald-100 transition-colors shrink-0">
                                                                                    <Download size={12} />
                                                                                    <span className="text-[11px] font-black uppercase tracking-tighter">Save</span>
                                                                                </a>
                                                                            </div>
                                                                        ) : (
                                                                            <span className={`font-bold truncate w-full block overflow-hidden whitespace-nowrap text-ellipsis ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-200' : 'text-slate-700'} ${density === 'compact' ? 'text-[13px]' : 'text-[15px]'}`}>
                                                                                {(() => {
                                                                                    if (!val || isStatusCol) return (isStatusCol ? "" : "—");
                                                                                    // Apply premium styles for sync columns by label
                                                                                    if (col.label === "Recent Remark") {
                                                                                        return <span className={`font-bold transition-colors ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-indigo-400' : 'text-indigo-600'}`}>{val}</span>;
                                                                                    }
                                                                                    if (col.label === "Next Follow-up Date") {
                                                                                        return (
                                                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg font-black text-[11px] uppercase tracking-widest shadow-sm transition-all ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                                                ? 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                                                                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                                                                                }`}>
                                                                                                <Calendar size={12} />
                                                                                                {safeFormat(val, "dd MMM")}
                                                                                            </span>
                                                                                        );
                                                                                    }
                                                                                    if (col.label === "Calling Status") {
                                                                                        return (
                                                                                            <span className={`px-3 py-1.5 rounded-lg font-black text-[11px] uppercase tracking-widest border shadow-sm transition-all ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                                                                ? (val === 'Closed' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' :
                                                                                                    val === 'Missed' ? 'bg-rose-950/40 text-rose-400 border-rose-500/30' :
                                                                                                        'bg-indigo-950/40 text-indigo-400 border-indigo-500/30')
                                                                                                : (val === 'Closed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                                                    val === 'Missed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                                                                        'bg-indigo-50 text-indigo-700 border-indigo-200')
                                                                                                }`}>
                                                                                                {val}
                                                                                            </span>
                                                                                        );
                                                                                    }
                                                                                    return val;
                                                                                })()}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {isSaving && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, scale: 0.5 }}
                                                                            animate={{ opacity: 1, scale: 1 }}
                                                                            className="ml-2 shrink-0"
                                                                        >
                                                                            <Activity size={12} className="text-indigo-500 animate-pulse" />
                                                                        </motion.div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                    {rowVirtualizer.getVirtualItems().length > 0 && (
                                        <tr>
                                            <td
                                                style={{ height: `${rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end}px` }}
                                                colSpan={data?.form?.fields?.length ? data.form.fields.length + (data.internalColumns?.length || 0) + 1 : 100}
                                                className="border-none p-0"
                                            />
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            <div className={`px-6 py-4 flex items-center justify-between sticky left-0 w-full transition-colors border-t duration-500 ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                ? 'bg-slate-900/90 border-white/10 backdrop-blur-md'
                                : 'bg-white border-[#EAECF0]'
                                }`}>
                                <div className="flex items-center gap-4">
                                    <div className={`flex items-center gap-2 border-r pr-4 ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'border-white/10' : 'border-slate-200'}`}>
                                        <span className="text-[10px] font-black uppercase text-slate-400">Rows per page:</span>
                                        <select
                                            value={rowsPerPage}
                                            onChange={(e) => {
                                                const newLimit = Number(e.target.value);
                                                setRowsPerPage(newLimit);
                                                setCurrentPage(1);
                                            }}
                                            className={`border-none rounded-lg p-1 px-2 text-[10px] font-black focus:ring-0 transition-colors ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                                ? 'bg-white/5 text-white'
                                                : 'bg-slate-50 text-slate-900'
                                                }`}
                                        >
                                            {[10, 25, 50, 100, 200, 500].map(v => (
                                                <option key={v} value={v} className="text-slate-900">
                                                    {v} Rows
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={`text-sm ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-400' : 'text-[#475467]'}`}>
                                        Showing <span className={`font-semibold ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-white' : 'text-[#101828]'}`}>{(currentPage - 1) * rowsPerPage + 1}</span> to <span className={`font-semibold ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-white' : 'text-[#101828]'}`}>{Math.min(currentPage * rowsPerPage, data?.filteredCount ?? filteredResponses.length)}</span> of <span className={`font-semibold ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-white' : 'text-[#101828]'}`}>{data?.filteredCount ?? filteredResponses.length}</span> responses
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className={`px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                            ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                                            : 'bg-white border border-[#D0D5DD] text-[#344054] hover:bg-[#F9FAFB]'
                                            }`}
                                    >
                                        <ChevronLeft size={16} /> Previous
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: data?.totalPages ?? Math.ceil(filteredResponses.length / rowsPerPage) }).map((_, i) => {
                                            const pageNum = i + 1;
                                            const totalPages = data?.totalPages ?? Math.ceil(filteredResponses.length / rowsPerPage);

                                            // Only show a few pages if too many
                                            if (Math.abs(pageNum - currentPage) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                                                if (Math.abs(pageNum - currentPage) === 3) return <span key={pageNum} className="px-2 text-slate-300">...</span>;
                                                return null;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-10 h-10 text-sm font-medium rounded-lg transition-all ${currentPage === pageNum
                                                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-600'
                                                        : (['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'text-slate-400 hover:bg-white/10' : 'text-[#667085] hover:bg-[#F9FAFB]')
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(data?.totalPages || 1, prev + 1))}
                                        disabled={currentPage === (data?.totalPages || 1)}
                                        className={`px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme)
                                            ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                                            : 'bg-white border border-[#D0D5DD] text-[#344054] hover:bg-[#F9FAFB]'
                                            }`}
                                    >
                                        Next <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="kanban"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 overflow-x-auto overflow-y-hidden p-12 flex gap-10 custom-scrollbar bg-slate-100/50"
                        >
                            {Object.entries(groupedResponses).map(([groupName, items]) => (
                                <div key={groupName} className="w-[380px] shrink-0 flex flex-col gap-6">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#7F56D9] shadow-[0_0_8px_rgba(127,86,217,0.4)]" />
                                            <h3 className="text-sm font-black text-[#101828] uppercase tracking-tight">{groupName}</h3>
                                            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full border border-indigo-100">{items.length}</span>
                                        </div>
                                        <button className="p-2 text-[#667085] hover:text-[#101828]"><MoreHorizontal size={16} /></button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-5 custom-scrollbar pb-10">
                                        {items.map(item => (
                                            <motion.div
                                                key={item.id}
                                                layoutId={item.id}
                                                onClick={() => { setSelectedResponse(item); setHighlightedRowId(item.id); }}
                                                className={`p-5 transition-all cursor-pointer group rounded-xl border-2 ${highlightedRowId === item.id ? 'bg-[#fffbeb] border-amber-300 shadow-md ring-1 ring-amber-200' : (item.rowColor ? `bg-[${item.rowColor}]` : 'bg-white')} border-[#EAECF0] shadow-sm hover:shadow-md hover:border-[#D6BBFB]`}
                                                style={item.rowColor && highlightedRowId !== item.id ? { backgroundColor: item.rowColor } : {}}
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-full bg-[#F2F4F7] text-[#344054] flex items-center justify-center text-xs font-semibold uppercase border border-[#EAECF0] overflow-hidden shadow-inner font-black">
                                                            {(() => {
                                                                const latestRemark = item.remarks?.[0];
                                                                const author = teamMembers.find(m => m.clerkId === latestRemark?.createdById);
                                                                const fallbackId = author?.clerkId || latestRemark?.createdById || item.submittedBy || item.id;
                                                                return <img src={getFallbackAvatar(fallbackId, author?.imageUrl)} title={author?.name || latestRemark?.authorName || item.submittedByName || "User"} className="w-full h-full object-cover" />;
                                                            })()}
                                                        </div>
                                                        {(item.remarks?.length || 0) > 0 && (
                                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm" title="Interactions">
                                                                {item.remarks?.length}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-black text-[#667085] uppercase tracking-widest block">{safeFormat(item.submittedAt, "MMM dd")}</span>
                                                        {(() => {
                                                            const phoneField = data?.form?.fields?.find(f =>
                                                                f.label.toLowerCase().includes("phone") || f.label.toLowerCase().includes("number")
                                                            );
                                                            const phoneVal = item.values?.find(v => v.fieldId === phoneField?.id)?.value;
                                                            if (phoneVal) return <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md mt-1 inline-flex items-center gap-1"><Phone size={8} /> {phoneVal}</span>;
                                                            return null;
                                                        })()}
                                                    </div>
                                                </div>
                                                <h4 className="text-sm font-black text-[#101828] mb-3 uppercase tracking-tight truncate">{item.submittedByName || "Public User"}</h4>

                                                <div className="space-y-2.5 mt-4">
                                                    {data?.form?.fields?.slice(0, 3).map(f => (
                                                        <div key={f.id} className="flex flex-col gap-0.5">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{f.label}</span>
                                                            <span className="text-xs font-bold text-slate-700 truncate">{getCellValue(item.id, f.id, false) || "—"}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {item.remarks?.[0] && (
                                                    <div className="mt-5 pt-4 border-t border-slate-50">
                                                        <div className="flex items-center gap-1.5 mb-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Latest Feedback</span>
                                                        </div>
                                                        <p className="text-[10px] font-medium text-slate-500 line-clamp-2 italic leading-relaxed">
                                                            "{item.remarks[0].remark}"
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="mt-5 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 text-right">
                                                    <div className="inline-flex items-center gap-1.5 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                                                        Inspect Details <ArrowUpRight size={12} />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                        <button className="w-full py-4 border-2 border-dashed border-[#EAECF0] rounded-xl text-xs font-semibold text-[#667085] hover:border-[#D6BBFB] hover:text-[#7F56D9] transition-all">+ Drop Here</button>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Filter Builder Modal             {/* 🛸 MASTER FILTER ARCHITECTURE v2 */}
            <AnimatePresence>
                {
                    isFilterBuilderOpen && (
                        <div className="fixed inset-0 flex items-center justify-center z-[999999] p-8 md:p-12">
                            {/* Backdrop with extreme blur for focus */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsFilterBuilderOpen(false)}
                                className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl"
                            />

                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 40 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 40 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="bg-slate-50 rounded-[48px] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.7)] w-full max-w-[1100px] max-h-[90vh] relative z-10 overflow-hidden flex flex-col border border-white/20"
                            >
                                {/* 💎 MODAL HEADER: COMMAND CENTER STYLE */}
                                <div className="p-10 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[28px] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200">
                                            <Filter size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Segment Intelligence</h2>
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] mt-1">Advanced Matrix Conditioning</p>
                                        </div>
                                    </div>
                                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                                        <button
                                            onClick={() => setFilterConjunction("AND")}
                                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterConjunction === 'AND' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            Logic: ALL (AND)
                                        </button>
                                        <button
                                            onClick={() => setFilterConjunction("OR")}
                                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterConjunction === 'OR' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            Logic: ANY (OR)
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={handleClearFilters}
                                            className="px-6 py-3 text-[11px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-all"
                                        >
                                            Purge All
                                        </button>
                                        <button
                                            onClick={() => setIsFilterBuilderOpen(false)}
                                            className="w-14 h-14 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-3xl transition-all border border-slate-100"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                                    {/* 🧪 ACTIVE CONDITION PIPELINE */}
                                    <div className="space-y-8">
                                        <div className="flex items-center justify-between px-2">
                                            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4">Logic Constraints <div className="h-px w-20 bg-slate-200" /></h3>
                                            <span className="text-[10px] font-black text-slate-500 bg-slate-200/50 px-4 py-1.5 rounded-full">{conditions.length} Rules Active</span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {conditions.map((cond, index) => {
                                                const field = [
                                                    { id: "__submittedAt", label: "Submitted At (Portal Protocol)", type: "date" },
                                                    { id: "__nextFollowUpDate", label: "Next Follow-up Date", type: "date" },
                                                    { id: "__assigned", label: "Assigned Users", type: "user" },
                                                    { id: "__followUpStatus", label: "Lead Tracking Status (Portal Protocol)", type: "dropdown" },
                                                    ...(data?.form?.fields || []),
                                                    ...(data?.internalColumns || [])
                                                ].find(f => f.id === cond.colId);
                                                const operators = field ? ((FILTER_OPERATORS as any)[field.type] || FILTER_OPERATORS.text) : FILTER_OPERATORS.text;
                                                const isInternalUserCol = field?.type === "user" || field?.id === "__assigned";

                                                return (
                                                    <motion.div
                                                        layout
                                                        key={index}
                                                        initial={{ x: -20, opacity: 0 }}
                                                        animate={{ x: 0, opacity: 1 }}
                                                        className="flex items-center gap-4 bg-white p-6 rounded-[36px] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all group"
                                                    >
                                                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black shrink-0 border border-indigo-100">{index + 1}</div>

                                                        <div className="flex-1 grid grid-cols-12 gap-4">
                                                            {/* Field Select */}
                                                            <div className="col-span-4 self-center">
                                                                <select
                                                                    className="w-full bg-slate-50 border-none rounded-[20px] px-6 py-4 text-[12px] font-extrabold text-slate-900 focus:ring-2 ring-indigo-500/20 appearance-none cursor-pointer hover:bg-slate-100 transition-colors uppercase tracking-tight"
                                                                    value={cond.colId}
                                                                    onChange={(e) => {
                                                                        const n = [...conditions];
                                                                        n[index].colId = e.target.value;
                                                                        setConditions(n);
                                                                    }}
                                                                >
                                                                    <option value="">Select Field Protocol</option>
                                                                    {([
                                                                        { id: "__submittedAt", label: "Submitted At", type: "date" },
                                                                        { id: "__nextFollowUpDate", label: "Next Follow-up Date", type: "date" },
                                                                        { id: "__assigned", label: "Assigned Users", type: "user" },
                                                                        { id: "__followUpStatus", label: "Lead Tracking Status", type: "dropdown", options: CALL_STATUS_OPTIONS },
                                                                        ...(data?.form?.fields || []),
                                                                        ...(data?.internalColumns || [])
                                                                    ] as any[]).filter(f => f.type !== "static").map(f => (
                                                                        <option key={f.id} value={f.id}>{f.label}</option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            {/* Operator Select */}
                                                            <div className="col-span-3 self-center border-l border-slate-100 pl-4">
                                                                <select
                                                                    className="w-full bg-transparent border-none py-4 text-[12px] font-black text-indigo-600 focus:ring-0 appearance-none cursor-pointer uppercase tracking-widest"
                                                                    value={cond.op}
                                                                    onChange={(e) => {
                                                                        const n = [...conditions];
                                                                        n[index].op = e.target.value;
                                                                        setConditions(n);
                                                                    }}
                                                                >
                                                                    {operators.map((op: any) => (
                                                                        <option key={op.value} value={op.value}>{op.label}</option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            {/* Value Input */}
                                                            <div className="col-span-5 self-center border-l border-slate-100 pl-4">
                                                                {!["is_empty", "is_not_empty", "today", "yesterday", "tomorrow", "this_week", "is_true", "is_false"].includes(cond.op) && (
                                                                    <div className="flex gap-2">
                                                                        {isInternalUserCol ? (
                                                                            <select
                                                                                className="w-full bg-slate-900 text-white border-none rounded-[20px] px-6 py-4 text-[12px] font-bold focus:ring-2 ring-indigo-500/20 appearance-none uppercase tracking-tight"
                                                                                value={cond.val}
                                                                                onChange={(e) => {
                                                                                    const n = [...conditions];
                                                                                    n[index].val = e.target.value;
                                                                                    setConditions(n);
                                                                                }}
                                                                            >
                                                                                <option value="">Assignee Agent</option>
                                                                                <option value="reassigned">🎯 Reassigned to Me</option>
                                                                                {teamMembers.map(tm => (
                                                                                    <option key={tm.clerkId} value={tm.clerkId}>{tm.firstName ? `${tm.firstName} ${tm.lastName || ''}` : tm.email}</option>
                                                                                ))}
                                                                            </select>
                                                                        ) : field?.type === "dropdown" ? (
                                                                            <select
                                                                                className="w-full bg-slate-900 text-white border-none rounded-[20px] px-6 py-4 text-[12px] font-bold focus:ring-2 ring-indigo-500/20 appearance-none uppercase tracking-tight"
                                                                                value={cond.val}
                                                                                onChange={(e) => {
                                                                                    const n = [...conditions];
                                                                                    n[index].val = e.target.value;
                                                                                    setConditions(n);
                                                                                }}
                                                                            >
                                                                                <option value="">Option Metric</option>
                                                                                {(field as any)?.options?.map((opt: any) => {
                                                                                    const label = typeof opt === 'string' ? opt : opt.label;
                                                                                    return <option key={label} value={label}>{label}</option>;
                                                                                })}
                                                                            </select>
                                                                        ) : (
                                                                            <input
                                                                                type={field?.type === 'number' ? 'number' : field?.type === 'date' ? 'date' : 'text'}
                                                                                className="w-full bg-slate-900 text-white border-none rounded-[20px] px-6 py-4 text-[12px] font-bold placeholder:text-slate-500 focus:ring-2 ring-indigo-500/20"
                                                                                placeholder="Filter key..."
                                                                                value={cond.val}
                                                                                onChange={(e) => {
                                                                                    const n = [...conditions];
                                                                                    n[index].val = e.target.value;
                                                                                    setConditions(n);
                                                                                }}
                                                                            />
                                                                        )}
                                                                        {cond.op === "between" && (
                                                                            <input
                                                                                type={field?.type === 'number' ? 'number' : field?.type === 'date' ? 'date' : 'text'}
                                                                                className="w-full bg-slate-900 text-white border-none rounded-[20px] px-6 py-4 text-[12px] font-bold placeholder:text-slate-500 focus:ring-2 ring-indigo-500/20"
                                                                                placeholder="Upper limit..."
                                                                                value={cond.val2 || ""}
                                                                                onChange={(e) => {
                                                                                    const n = [...conditions];
                                                                                    n[index].val2 = e.target.value;
                                                                                    setConditions(n);
                                                                                }}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => setConditions(conditions.filter((_, idx) => idx !== index))}
                                                            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={() => setConditions([...conditions, { colId: "", op: "equals", val: "" }])}
                                            className="w-full py-10 border-2 border-dashed border-slate-200 rounded-[44px] text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-3"
                                        >
                                            <Plus size={16} /> Injection New Condition Rule
                                        </button>
                                    </div>

                                    {/* 🔖 SAVED SEGMENTS SECTION */}
                                    <div className="pt-10 border-t border-slate-100">
                                        <div className="flex items-center gap-5 mb-8">
                                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Saved Architectures</h4>
                                            <div className="h-px flex-1 bg-slate-50" />
                                        </div>
                                        <div className="flex flex-wrap gap-4">
                                            {savedViews.map(view => (
                                                <div key={view.id} className="relative group/view">
                                                    <button
                                                        onClick={() => applySavedView(view)}
                                                        className="px-8 py-4 bg-white text-slate-900 rounded-[28px] text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:border-indigo-500 hover:shadow-2xl shadow-slate-200 transition-all flex items-center gap-3 group pr-14"
                                                    >
                                                        <Star size={14} className="group-hover:text-indigo-500 transition-colors" />
                                                        {view.name}
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteView(view.id, e)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-rose-500 hover:text-white text-rose-300 rounded-xl transition-all opacity-0 group-hover/view:opacity-100"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={handleSaveView}
                                                className="px-8 py-4 border-2 border-dashed border-slate-100 rounded-[28px] text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center gap-3"
                                            >
                                                <Save size={14} /> Persist Current Flow
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* 🔋 ACTION BAR */}
                                <div className="p-10 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-8">
                                        <div className="flex items-center gap-3 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> Matrix Active
                                        </div>
                                        <button
                                            onClick={() => setAutoApply(!autoApply)}
                                            className={`flex items-center gap-3 px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${autoApply ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                                        >
                                            <Clock size={14} /> {autoApply ? "Live Stream" : "Manual Trigger"}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <button
                                            onClick={() => setIsFilterBuilderOpen(false)}
                                            className="px-16 py-6 bg-slate-950 text-white rounded-[32px] text-[13px] font-black uppercase tracking-[0.4em] hover:bg-indigo-600 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4"
                                        >
                                            Deploy Segmentation Matrix <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >

            {/* Previous Column Modal Kept... (Simplified for this file Write) */}
            <AnimatePresence>
                {
                    isAddColumnOpen && (
                        <div className="fixed inset-0 flex items-center justify-center z-[100] p-10 overflow-hidden">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddColumnOpen(false)} className="absolute inset-0 bg-slate-900/80" />
                            <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white rounded-[70px] shadow-[0_40px_100px_rgba(0,0,0,0.3)] w-full max-w-[1100px] h-[85vh] relative z-10 border-8 border-white flex overflow-hidden">
                                <div className="w-[350px] bg-slate-50 border-r border-slate-100 p-12 overflow-y-auto custom-scrollbar">
                                    <h3 className="text-2xl font-black tracking-tighter mb-10 flex items-center gap-4"><Plus className="text-indigo-600" /> Dimension Lab</h3>
                                    <div className="space-y-3">
                                        {COLUMN_TYPES.map(type => (
                                            <button key={type.id} onClick={() => setNewColType(type.id)} className={`w-full p-6 rounded-[30px] flex items-center gap-5 transition-all ${newColType === type.id ? 'bg-white shadow-xl ring-2 ring-indigo-500 scale-105' : 'hover:bg-slate-100 text-slate-400'}`}>
                                                <div className={`p-3 rounded-2xl bg-white shadow-sm ${type.color}`}><type.icon size={20} /></div>
                                                <span className={`text-[11px] font-black uppercase tracking-widest ${newColType === type.id ? 'text-slate-900' : ''}`}>{type.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1 p-16 flex flex-col justify-between overflow-y-auto">
                                    <div className="space-y-16">
                                        <div>
                                            <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] ml-6 mb-6 block">Visual Identifier</label>
                                            <input autoFocus value={newColLabel} onChange={(e) => setNewColLabel(e.target.value)} placeholder="e.g. Production Status..." className="w-full p-10 bg-slate-50 border-4 border-transparent focus:border-indigo-600 rounded-[50px] outline-none font-black text-3xl tracking-tighter text-slate-800 transition-all shadow-inner" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-12">
                                            <div className="space-y-8">
                                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b pb-4">Constraint Systems</h4>
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[30px]">
                                                        <span className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3"><ShieldCheck size={16} className="text-indigo-500" /> Mandatory Input</span>
                                                        <button onClick={() => setNewColSettings({ ...newColSettings, isRequired: !newColSettings.isRequired })} className={`w-14 h-8 rounded-full transition-all relative ${newColSettings.isRequired ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${newColSettings.isRequired ? 'left-7' : 'left-1'}`} />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[30px]">
                                                        <span className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3"><Trash2 size={16} className="text-rose-500" /> Immutable Mode</span>
                                                        <button onClick={() => setNewColSettings({ ...newColSettings, isLocked: !newColSettings.isLocked })} className={`w-14 h-8 rounded-full transition-all relative ${newColSettings.isLocked ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${newColSettings.isLocked ? 'left-7' : 'left-1'}`} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="pt-8">
                                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b pb-4 mb-6">Access Control (RBAC)</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {AVAILABLE_ROLES.map(role => (
                                                            <button
                                                                key={role}
                                                                onClick={() => {
                                                                    const roles = newColPermissions.roles.includes(role)
                                                                        ? newColPermissions.roles.filter(r => r !== role)
                                                                        : [...newColPermissions.roles, role];
                                                                    setNewColPermissions({ ...newColPermissions, roles });
                                                                }}
                                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${newColPermissions.roles.includes(role) ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'}`}
                                                            >
                                                                {role}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="pt-8 relative">
                                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b pb-4 mb-6">Individual Analytics Access</h4>
                                                    <div className="space-y-4">
                                                        <div className="relative">
                                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                            <input
                                                                value={userSearchQuery}
                                                                onChange={(e) => searchUsers(e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                placeholder="Search users by email..."
                                                                className="w-full bg-slate-50 p-4 pl-12 rounded-2xl border-none font-bold text-[11px] shadow-inner outline-none focus:ring-1 ring-indigo-500"
                                                            />
                                                        </div>

                                                        {userResults.length > 0 && (
                                                            <div
                                                                onMouseDown={(e) => e.preventDefault()}
                                                                className="absolute left-0 right-0 top-full mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 z-20 py-4 max-h-[200px] overflow-y-auto ignore-click-outside"
                                                            >
                                                                {userResults.map(u => (
                                                                    <button
                                                                        key={u.clerkId}
                                                                        onClick={() => {
                                                                            if (!newColPermissions.users.includes(u.clerkId)) {
                                                                                setNewColPermissions({ ...newColPermissions, users: [...newColPermissions.users, u.clerkId] });
                                                                            }
                                                                            setUserResults([]);
                                                                            setUserSearchQuery("");
                                                                        }}
                                                                        className="w-full px-6 py-3 text-left hover:bg-slate-50 flex items-center justify-between"
                                                                    >
                                                                        <span className="text-[10px] font-black text-slate-700">{u.email}</span>
                                                                        <Plus size={14} className="text-indigo-600" />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <div className="flex flex-wrap gap-2">
                                                            {newColPermissions.users.map(uid => (
                                                                <div key={uid} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100">
                                                                    <span className="text-[9px] font-black">User: {uid.split('_').pop()?.slice(0, 5)}...</span>
                                                                    <X size={12} className="cursor-pointer" onClick={() => setNewColPermissions({ ...newColPermissions, users: newColPermissions.users.filter(x => x !== uid) })} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-8">
                                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b pb-4">Type Configuration</h4>
                                                {newColType === 'dropdown' ? (
                                                    <div className="space-y-4">
                                                        {newColOptions.map((opt, i) => (
                                                            <div key={i} className="flex gap-3">
                                                                <input value={opt.label} onChange={(e) => { const n = [...newColOptions]; n[i].label = e.target.value; setNewColOptions(n); }} placeholder="Status/Label..." className="flex-1 p-4 bg-slate-50 border-none rounded-2xl font-black text-xs shadow-inner" />
                                                                <button onClick={() => setNewColOptions(newColOptions.filter((_, idx) => idx !== i))} className="p-4 text-rose-500 bg-rose-50 rounded-2xl hover:bg-rose-100 transition-colors"><X size={16} /></button>
                                                            </div>
                                                        ))}
                                                        <button onClick={() => setNewColOptions([...newColOptions, { label: "New Option", color: "#6366f1" }])} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[24px] text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-all">+ Add Lifecycle Node</button>
                                                    </div>
                                                ) : newColType === 'user' ? (
                                                    <div className="space-y-6">
                                                        <div className="p-8 bg-indigo-50 rounded-[40px] border border-indigo-100 flex flex-col items-center justify-center text-center">
                                                            <Users size={32} className="text-indigo-500 mb-4 animate-bounce" />
                                                            <h5 className="text-[11px] font-black uppercase tracking-widest text-indigo-600 mb-2">Team Allocation Active</h5>
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest max-w-[200px]">Select which staff members should be available for this dimension</p>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className="relative">
                                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                                <input
                                                                    value={teamMemberSearch}
                                                                    onChange={(e) => setTeamMemberSearch(e.target.value)}
                                                                    placeholder="Quick search team..."
                                                                    className="w-full bg-slate-50 p-4 pl-12 rounded-2xl border-none font-bold text-[11px] shadow-inner outline-none focus:ring-1 ring-indigo-500"
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between px-2">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{teamMembers.length} Operatives Detected</span>
                                                                <button
                                                                    onClick={() => {
                                                                        if (selectedUserIds.length === teamMembers.length) setSelectedUserIds([]);
                                                                        else setSelectedUserIds(teamMembers.map(m => m.clerkId));
                                                                    }}
                                                                    className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                                                                >
                                                                    {selectedUserIds.length === teamMembers.length ? 'Deselect All' : 'Select All'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                                            {teamMembers
                                                                .filter(m => m.email.toLowerCase().includes(teamMemberSearch.toLowerCase()))
                                                                .map(m => (
                                                                    <button
                                                                        key={m.clerkId}
                                                                        onClick={() => setSelectedUserIds(prev => prev.includes(m.clerkId) ? prev.filter(id => id !== m.clerkId) : [...prev, m.clerkId])}
                                                                        className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${selectedUserIds.includes(m.clerkId) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black uppercase ${selectedUserIds.includes(m.clerkId) ? 'bg-white/20' : 'bg-indigo-600 text-white'}`}>
                                                                                {m.email[0]}
                                                                            </div>
                                                                            <div className="text-left">
                                                                                <p className="text-[10px] font-black truncate max-w-[100px]">{m.email.split('@')[0]}</p>
                                                                                <p className={`text-[8px] font-bold uppercase tracking-tighter ${selectedUserIds.includes(m.clerkId) ? 'text-indigo-200' : 'text-slate-400'}`}>{m.role || 'STAFF'}</p>
                                                                            </div>
                                                                        </div>
                                                                        {selectedUserIds.includes(m.clerkId) && <Check size={14} />}
                                                                    </button>
                                                                ))}
                                                        </div>
                                                        {selectedUserIds.length === 0 && (
                                                            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest text-center">Warning: No members selected. All staff will be allowed.</p>
                                                        )}
                                                    </div>
                                                ) : newColType === 'date' ? (
                                                    <div className="p-8 bg-rose-50 rounded-[40px] border border-rose-100 flex flex-col items-center justify-center text-center">
                                                        <CalendarDays size={32} className="text-rose-500 mb-4" />
                                                        <h5 className="text-[11px] font-black uppercase tracking-widest text-rose-600 mb-2">Timeline Matrix Mode</h5>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest max-w-[200px]">Automated date pickers will be enabled for this dimension</p>
                                                    </div>
                                                ) : (
                                                    <div className="p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center text-center opacity-40">
                                                        <Settings size={30} className="mb-4 text-slate-400 animate-spin-slow" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Dynamic Logic Enabled <br />For {newColType} Type</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-20 flex gap-6">
                                        <button onClick={() => setIsAddColumnOpen(false)} className="px-14 py-8 bg-slate-50 text-slate-500 rounded-[36px] text-xs font-black uppercase tracking-[0.2em]">Abort</button>
                                        <button onClick={handleAddColumn} className="flex-1 py-8 bg-slate-900 text-white rounded-[36px] text-xs font-black uppercase tracking-[0.4em] shadow-2xl">Deploy Dimension</button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >

            {/* Bulk Action Bar — Floating Permission Lab */}
            <AnimatePresence>
                {
                    selectedRows.length > 0 && (
                        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-6 bg-slate-900 border border-slate-800 p-4 px-8 rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
                            <div className="flex items-center gap-4 border-r border-slate-800 pr-6 mr-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">{selectedRows.length}</div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Records Selected</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase text-indigo-400 mr-2 tracking-tighter">Assign Leads:</span>

                                <div className="relative">
                                    <input
                                        className="bg-slate-800 border-none rounded-xl px-4 py-2 text-[9px] font-black uppercase text-white outline-none w-[150px] focus:ring-1 ring-indigo-500"
                                        placeholder="Search User..."
                                        value={userSearchQuery}
                                        onChange={(e) => searchUsers(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    {userResults.length > 0 && (
                                        <div
                                            onMouseDown={(e) => e.preventDefault()}
                                            className="absolute bottom-full mb-4 left-0 w-[200px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 overflow-hidden max-h-[200px] overflow-y-auto"
                                        >
                                            {userResults.map(u => (
                                                <button
                                                    key={u.clerkId}
                                                    onClick={() => {
                                                        fetch(`/api/crm/forms/${params.id}/responses/assign`, {
                                                            method: "PATCH",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ responseIds: selectedRows, assignedTo: [u.clerkId] })
                                                        }).then(() => {
                                                            toast.success(`Assigned to ${u.email.split('@')[0]}`);
                                                            setSelectedRows([]);
                                                            fetchData();
                                                        });
                                                        setUserResults([]);
                                                        setUserSearchQuery("");
                                                    }}
                                                    className="w-full px-4 py-2 text-left hover:bg-indigo-600 text-[9px] font-black uppercase text-slate-300 hover:text-white"
                                                >
                                                    {u.email}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => {
                                    fetch(`/api/crm/forms/${params.id}/responses/assign`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ responseIds: selectedRows, assignedTo: [] })
                                    }).then(() => {
                                        toast.success(`Leads Unassigned`);
                                        setSelectedRows([]);
                                        fetchData();
                                    });
                                }} className="px-4 py-2 bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-900/50 transition-all">Make Unassigned</button>
                                <button onClick={() => handleBulkVisibilityUpdate("ROW", [])} className="px-4 py-2 bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-900/50 transition-all">Make Public</button>
                            </div>

                            <div className="h-6 w-[1px] bg-slate-800 mx-2" />

                            {(isMaster || isPureMaster) && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                >
                                    <Trash2 size={14} />
                                    Delete Selected
                                </button>
                            )}

                            <button onClick={() => setSelectedRows([])} className="p-3 text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Column Manager Modal */}
            <AnimatePresence>
                {
                    isColumnManagerOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsColumnManagerOpen(false)}
                                className="absolute inset-0 bg-slate-900/40"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
                            >
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#F9FAFB]">
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Matrix Column Protocol</h3>
                                        <p className="text-[10px] text-slate-500 font-bold mt-1">Configure global layout & visibility</p>
                                    </div>
                                    <button onClick={() => setIsColumnManagerOpen(false)} className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                                        <X size={16} className="text-slate-400" />
                                    </button>
                                </div>
                                <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    <div className="space-y-1">
                                        {allColumns.map((col, idx) => {
                                            const isHidden = hiddenColumns.includes(col.id);
                                            return (
                                                <div
                                                    key={col.id}
                                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-100"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => moveColumn(idx, 'up')} className="p-1 hover:bg-white rounded border border-transparent hover:border-slate-200 active:scale-90"><ArrowUp size={10} /></button>
                                                            <button onClick={() => moveColumn(idx, 'down')} className="p-1 hover:bg-white rounded border border-transparent hover:border-slate-200 active:scale-90"><ArrowDown size={10} /></button>
                                                        </div>
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer ${isHidden ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`} onClick={() => {
                                                            setHiddenColumns(prev =>
                                                                isHidden ? prev.filter(id => id !== col.id) : [...prev, col.id]
                                                            );
                                                        }}>
                                                            {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                                                        </div>
                                                        <div className="cursor-pointer" onClick={() => {
                                                            setHiddenColumns(prev =>
                                                                isHidden ? prev.filter(id => id !== col.id) : [...prev, col.id]
                                                            );
                                                        }}>
                                                            <p className={`text-xs font-bold ${isHidden ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{col.id === "__profile" ? "View Action" : col.id === "__contributor" ? "Submitter Info" : col.label}</p>
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{col.isInternal ? 'Internal Matrix' : col.type === 'static' ? 'System' : 'Form Field'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isPureMaster && (col.isInternal || ["__followup", "__recentRemark", "__nextFollowUpDate", "__followUpStatus"].includes(col.id)) && col.id !== "__profile" && col.id !== "__submittedAt" && col.id !== "__contributor" && col.id !== "__assigned" && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteColumn(col.id); }}
                                                                className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100"
                                                                title="Purge Column"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                        <div
                                                            onClick={() => {
                                                                setHiddenColumns(prev =>
                                                                    isHidden ? prev.filter(id => id !== col.id) : [...prev, col.id]
                                                                );
                                                            }}
                                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${isHidden ? 'border-slate-200 bg-white' : 'border-indigo-600 bg-indigo-600 shadow-lg shadow-indigo-100'}`}
                                                        >
                                                            {!isHidden && <Check size={10} className="text-white" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                                    {(isMaster || isPureMaster) && (
                                        <div className="flex flex-col gap-2 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Sparkles size={12} className="text-indigo-600" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Master Authority</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => addHubColumns('sales')}
                                                    disabled={isAddingHubCols}
                                                    className="flex-1 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-200"
                                                >
                                                    + Sales Hub
                                                </button>
                                                <button
                                                    onClick={() => addHubColumns('remarks')}
                                                    disabled={isAddingHubCols}
                                                    className="flex-1 py-2 bg-rose-50 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-200"
                                                >
                                                    + Remark Hub
                                                </button>
                                            </div>
                                            <button
                                                onClick={handleSaveGlobalLayout}
                                                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                                            >
                                                <ShieldCheck size={14} /> Push Global Format for All
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center gap-2">
                                        {isTL && (
                                            <button
                                                onClick={handleResetToSystemDefault}
                                                className="px-4 py-2 text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                Reset to Default
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setIsColumnManagerOpen(false)}
                                            className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                                        >
                                            Apply Configuration
                                        </button>
                                    </div>
                                </div>

                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; border: 3px solid #f8fafc; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            ` }} />

            {/* Access Control Modal */}
            <AnimatePresence>
                {isAccessModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAccessModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden relative"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em]">Security Matrix Panel</h3>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Define visibility and access permissions</p>
                                </div>
                                <button onClick={() => setIsAccessModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                                    <X size={16} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="flex border-b border-slate-100 bg-[#F9FAFB] p-2">
                                <button
                                    onClick={() => setAccessTab("GLOBAL")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${accessTab === "GLOBAL" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}
                                >
                                    <ShieldCheck size={14} /> Global Protocol
                                </button>
                                <button
                                    onClick={() => setAccessTab("COLUMNS")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${accessTab === "COLUMNS" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}
                                >
                                    <Table size={14} /> Column Matrix
                                </button>
                            </div>

                            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {accessTab === "GLOBAL" ? (
                                    <>
                                        {/* Role Selection */}
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                                <ShieldCheck size={12} /> Role Based Protocol
                                            </h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                {["MASTER", "ADMIN", "TL", "STAFF", "GUEST"].map(role => {
                                                    const isActive = permRoles.includes(role);
                                                    return (
                                                        <button
                                                            key={role}
                                                            onClick={() => setPermRoles(prev => isActive ? prev.filter(r => r !== role) : [...prev, role])}
                                                            className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${isActive ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-slate-100 hover:border-slate-200'}`}
                                                        >
                                                            <span className="text-[11px] font-black uppercase tracking-widest">{role}</span>
                                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isActive ? 'bg-white border-white' : 'border-slate-200 bg-slate-50'}`}>
                                                                {isActive && <Check size={10} className="text-slate-900" />}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="h-[1px] bg-slate-100" />

                                        {/* User Selection */}
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                                <UserPlus size={12} /> Personalized Exceptions
                                            </h4>

                                            <div className="relative mb-4">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                <input
                                                    value={accessUserSearch}
                                                    onChange={(e) => searchAccessUsers(e.target.value)}
                                                    placeholder="Search by name or email..."
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-4 focus:ring-slate-50 transition-all placeholder:text-slate-300"
                                                />

                                                <AnimatePresence>
                                                    {accessUserResults.length > 0 && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 overflow-hidden ignore-click-outside"
                                                        >
                                                            {accessUserResults.map(u => (
                                                                <button
                                                                    key={u.clerkId}
                                                                    onClick={() => {
                                                                        if (!permUsers.includes(u.clerkId)) {
                                                                            setPermUsers(prev => [...prev, u.clerkId]);
                                                                        }
                                                                        setAccessUserSearch("");
                                                                        setAccessUserResults([]);
                                                                    }}
                                                                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black">{u.email[0]?.toUpperCase() || 'U'}</div>
                                                                        <div className="text-left">
                                                                            <p className="text-[11px] font-bold text-slate-900 truncate w-[200px]">{u.email}</p>
                                                                            <p className="text-[9px] text-slate-400 uppercase tracking-tighter">Authorized Identity</p>
                                                                        </div>
                                                                    </div>
                                                                    <Plus size={14} className="text-slate-300" />
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                {permUsers.length === 0 && <p className="text-[10px] text-slate-400 font-bold m-auto">No unique users specified</p>}
                                                {permUsers.map(uid => (
                                                    <div key={uid} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm group">
                                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{uid.slice(0, 12)}...</span>
                                                        <button
                                                            onClick={() => setPermUsers(prev => prev.filter(id => id !== uid))}
                                                            className="p-1 hover:bg-rose-50 rounded-md transition-colors"
                                                        >
                                                            <X size={10} className="text-slate-400 group-hover:text-rose-500" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-2">Target Role Protocol</p>
                                                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                                                    {["ADMIN", "MASTER", "TL", "STAFF", "GUEST"].map(role => (
                                                        <button
                                                            key={role}
                                                            onClick={() => { setSelectedRoleForGAC(role); setSelectedUserForGAC(null); }}
                                                            className={`flex-1 py-2 text-[9px] font-black rounded-lg transition-all ${selectedRoleForGAC === role && !selectedUserForGAC ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                                        >
                                                            {role}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-2">User Specific Override</p>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                    <input
                                                        value={accessUserSearch}
                                                        onChange={(e) => searchAccessUsers(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        placeholder="Search user ID or email..."
                                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-slate-50 transition-all placeholder:text-slate-300"
                                                    />
                                                    <AnimatePresence>
                                                        {accessUserResults.length > 0 && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                onMouseDown={(e) => e.preventDefault()}
                                                                className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 overflow-hidden ignore-click-outside"
                                                            >
                                                                {accessUserResults.map(u => (
                                                                    <button
                                                                        key={u.clerkId}
                                                                        onClick={() => {
                                                                            setSelectedUserForGAC({ id: u.clerkId, email: u.email });
                                                                            setAccessUserSearch("");
                                                                            setAccessUserResults([]);
                                                                        }}
                                                                        className="w-full p-3 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black">{u.email[0]?.toUpperCase() || 'U'}</div>
                                                                            <p className="text-[10px] font-bold text-slate-900 truncate">{u.email}</p>
                                                                        </div>
                                                                        <Plus size={12} className="text-slate-300" />
                                                                    </button>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                                {selectedUserForGAC && (
                                                    <div className="mt-2 flex items-center justify-between px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                                            <p className="text-[9px] font-black text-indigo-700 uppercase tracking-tighter">Active Override: {selectedUserForGAC.email}</p>
                                                        </div>
                                                        <button onClick={() => setSelectedUserForGAC(null)} className="text-indigo-400 hover:text-indigo-600 transition-colors">
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Column Access Rights</p>
                                            <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-50 shadow-sm bg-slate-50/30">
                                                {allColumns.map(col => {
                                                    const targetType = selectedUserForGAC ? 'users' : 'roles';
                                                    const targetId = selectedUserForGAC ? selectedUserForGAC.id : selectedRoleForGAC;
                                                    const currentPerm = colPermissions[targetType]?.[targetId]?.[col.id] || (col.isInternal ? "hide" : "read");

                                                    const setPerm = (p: string) => {
                                                        setColPermissions(prev => {
                                                            const base = prev || { roles: {}, users: {} };
                                                            return {
                                                                ...base,
                                                                [targetType]: {
                                                                    ...(base[targetType] || {}),
                                                                    [targetId]: {
                                                                        ...(base[targetType]?.[targetId] || {}),
                                                                        [col.id]: p
                                                                    }
                                                                }
                                                            };
                                                        });
                                                    };

                                                    return (
                                                        <div key={col.id} className="p-4 flex items-center justify-between hover:bg-white transition-colors group">
                                                            <div>
                                                                <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{col.label}</p>
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{col.isInternal ? "Matrix Internal" : "Form Field"}</p>
                                                            </div>
                                                            <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                                                                {[
                                                                    { id: "hide", icon: EyeOff, label: "Hide" },
                                                                    { id: "read", icon: Eye, label: "Read" },
                                                                    { id: "edit", icon: ShieldCheck, label: "Full" }
                                                                ].map(p => (
                                                                    <button
                                                                        key={p.id}
                                                                        onClick={() => setPerm(p.id)}
                                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all ${currentPerm === p.id ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                                                    >
                                                                        <p.icon size={12} />
                                                                        {p.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-[#F9FAFB] border-t border-slate-100 flex justify-between items-center">
                                <p className="text-[10px] text-slate-400 font-bold max-w-[200px]">Changes will restrict or grant access to the entire matrix workspace.</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsAccessModalOpen(false)}
                                        className="px-6 py-2.5 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={accessTab === "GLOBAL" ? handleSavePermissions : handleSaveColumnPermissions}
                                        className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-2"
                                    >
                                        <ShieldCheck size={14} /> Commit Changes
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isMounted && isAIFilterOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAIFilterOpen(false)}
                            className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-[90]"
                        />
                        <motion.div
                            initial={{ opacity: 0, x: 300, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 300, scale: 0.95 }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className="fixed right-0 top-0 bottom-0 w-full md:w-[420px] bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.05)] z-[100] flex flex-col border-l border-slate-100"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white/80">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-[14px] flex items-center justify-center shadow-lg shadow-indigo-200">
                                        <Sparkles size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-sm font-black text-slate-900 tracking-tighter">AI Assistant</h3>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Powered by Vercel SDK</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setMessages([])}
                                        className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        Clear
                                    </button>
                                    <button onClick={() => setIsAIFilterOpen(false)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
                                {messages.length === 0 && (
                                    <div className="space-y-8 py-4">
                                        <div className="flex flex-col items-center justify-center text-center space-y-3 opacity-80">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                                                <Bot size={24} className="text-indigo-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Intelligence Center</h4>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1">Select a deep analysis strategy to begin</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            {reportSuggestions.map((s, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => {
                                                        handleInputChange({ target: { value: s.query } } as any);
                                                        setTimeout(() => {
                                                            const form = document.getElementById("ai-chat-form") as HTMLFormElement;
                                                            if (form) form.requestSubmit();
                                                        }, 50);
                                                    }}
                                                    className="group text-left p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all active:scale-[0.98]"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">{s.title}</span>
                                                        <ArrowUpRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-2 line-clamp-1 group-hover:text-slate-500 transition-colors">{s.query}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {messages.map((m: any) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={m.id}
                                        className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className={`max-w-[85%] p-4 rounded-[20px] ${m.role === 'user'
                                            ? 'bg-slate-900 text-white rounded-tr-sm shadow-xl shadow-slate-200/50'
                                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm shadow-sm'
                                            }`}>
                                            <div className="text-sm font-semibold whitespace-pre-wrap leading-relaxed">
                                                {typeof (m as any).content === 'string' ? (m as any).content : (String((m as any).ui || JSON.stringify((m as any).content || '')))}
                                            </div>

                                            {/* Render Tool Invocations nicely */}
                                            {Array.isArray(m.toolInvocations) && m.toolInvocations.map((toolInvocation: any) => {
                                                if (toolInvocation.toolName === 'applyFilter' && toolInvocation.state === 'result') {
                                                    return (
                                                        <div key={toolInvocation.toolCallId} className="mt-4 p-3 bg-indigo-50/80 border border-indigo-100/50 rounded-xl">
                                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider flex items-center gap-2 mb-2">
                                                                <Filter size={12} className="text-indigo-400" /> Filters Applied
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {toolInvocation.result?.filtersApplied && Array.isArray(toolInvocation.result.filtersApplied) && toolInvocation.result.filtersApplied.map((f: any, i: number) => (
                                                                    <span key={i} className="inline-flex px-2 py-1 text-[10px] font-bold text-indigo-700 bg-white border border-indigo-100 rounded shadow-sm items-center gap-1.5 truncate max-w-[150px]">
                                                                        <span className="text-indigo-400">{String(f.operator || f.op)}</span>
                                                                        <span>{String(f.value || f.val)}</span>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>
                                    </motion.div>
                                ))}
                                {isAIFetching && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                        <div className="bg-white p-4 rounded-[20px] border border-slate-100 rounded-tl-sm min-w-[70px] flex justify-center items-center gap-1.5 shadow-sm">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                                            <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-4 bg-white border-t border-slate-100">
                                <form id="ai-chat-form" onSubmit={handleSubmit} className="relative flex items-center shadow-lg shadow-slate-100/50 rounded-2xl">
                                    <input
                                        value={input}
                                        onChange={handleInputChange}
                                        placeholder="Message AI..."
                                        className="w-full pl-5 pr-14 py-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 focus:bg-white transition-all placeholder:text-slate-400"
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        disabled={!(input || "").trim() || isAIFetching}
                                        className="absolute right-2 p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition-all active:scale-95"
                                    >
                                        <ArrowUp size={16} />
                                    </button>
                                </form>
                                <div className="mt-3 flex justify-between items-center px-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-1"><Sparkles size={10} /> AI SDK V3</p>
                                    <button
                                        onClick={(e) => { e.preventDefault(); handleGenerateReport(); }}
                                        disabled={isGeneratingReport}
                                        className="text-[9px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-600 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    >
                                        {isGeneratingReport ? "Analyzing..." : "Generate Full Report"} <ArrowUpRight size={10} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* AI Report Viewer Modal */}
            <AnimatePresence>
                {isAIReportOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAIReportOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-[32px] shadow-2xl p-8 border border-white custom-scrollbar">
                            <div className="flex justify-between items-start mb-6 sticky top-0 bg-white/80 backdrop-blur-md pt-2 pb-4 z-10 border-b border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-600 rounded-[24px]">
                                        <Activity size={32} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-black text-slate-900 tracking-tighter">AI Insight Report</h3>
                                            {isReportCached && (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-bold uppercase rounded-full border border-slate-200">Archived Analysis</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Generated by Google Gemini</p>
                                            <button
                                                onClick={() => handleGenerateReport(true)}
                                                disabled={isGeneratingReport}
                                                className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-50"
                                            >
                                                <RefreshCw size={10} className={isGeneratingReport ? "animate-spin" : ""} />
                                                {isGeneratingReport ? "Analyzing..." : "Refresh"}
                                            </button>
                                            <div className="w-1 h-1 bg-slate-300 rounded-full mx-1" />
                                            <button
                                                onClick={() => handleDownloadPDF(aiReportHtml || "", "AI Insight Report")}
                                                className="text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                            >
                                                <Download size={10} /> PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setIsAIReportOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-[20px] transition-all">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="mt-4 text-slate-800 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: aiReportHtml || "No report content generated." }}></div>

                            <div className="mt-8 flex justify-end">
                                <button onClick={() => setIsAIReportOpen(false)} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                                    Dismiss Report
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Dynamic Report Modal (Simple Stats) */}
            <AnimatePresence>
                {isDynamicReportOpen && dynamicStats && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDynamicReportOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl p-8 border border-white">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-600 rounded-[24px]">
                                        <BarChart3 size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tighter">Live Dynamic Report</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Real-time Data Matrix Aggregation</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            const el = document.getElementById('dynamic-report-content');
                                            if (el) handleDownloadPDF(el.innerHTML, "Dynamic Analytics Report");
                                        }}
                                        className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1"
                                    >
                                        <Download size={12} /> PDF Export
                                    </button>
                                    <button onClick={() => setIsDynamicReportOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-[20px] transition-all">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            <div id="dynamic-report-content" className="mt-4 space-y-6">
                                <div style={{ display: 'none' }} className="print-only-header">
                                    <h2>Dynamic CRM Report</h2>
                                    <p>Generated on: {new Date().toLocaleString()}</p>
                                    <hr style={{ margin: '20px 0' }} />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div
                                        onClick={() => { setConditions([]); setIsDynamicReportOpen(false); toast.success("Matrix Reset: All Records"); }}
                                        className="p-6 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-95 group"
                                    >
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 group-hover:text-indigo-600 transition-colors">Total Records</p>
                                        <p className="text-3xl font-black text-slate-900">{dynamicStats.totalEntries}</p>
                                    </div>
                                    <div
                                        onClick={() => {
                                            setConditions([{ colId: "__submittedAt", op: "today", val: "" }]);
                                            setIsDynamicReportOpen(false);
                                            toast.success("Focus Shift: Today's High-Priority Leads");
                                        }}
                                        className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 cursor-pointer hover:bg-emerald-100 hover:border-emerald-300 transition-all active:scale-95 group"
                                    >
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2 group-hover:bg-emerald-200 transition-colors">New Today</p>
                                        <p className="text-3xl font-black text-emerald-700">{dynamicStats.newToday}</p>
                                    </div>
                                    <div
                                        onClick={() => {
                                            setConditions([{ colId: "__submittedAt", op: "this_month", val: "" }]);
                                            setIsDynamicReportOpen(false);
                                            toast.success("Focus Shift: Monthly Yield Analysis");
                                        }}
                                        className="p-6 bg-blue-50 rounded-2xl border border-blue-100 cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-all active:scale-95 group"
                                    >
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2 group-hover:bg-blue-200 transition-colors">New This Month</p>
                                        <p className="text-3xl font-black text-blue-700">{dynamicStats.newThisMonth}</p>
                                    </div>
                                </div>

                                {Object.keys(dynamicStats.statusCounts).length > 0 && (
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 mt-6">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-200 pb-2">{dynamicStats.statusColName} Breakdown</p>
                                        <div className="space-y-3">
                                            {Object.entries(dynamicStats.statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                                                <div
                                                    key={status}
                                                    onClick={() => {
                                                        const colId = dynamicStats.statusColId || "";
                                                        if (colId) {
                                                            setConditions([{ colId, op: "equals", val: status }]);
                                                            setIsDynamicReportOpen(false);
                                                            toast.success(`Matrix Path: ${status}`);
                                                        }
                                                    }}
                                                    className="flex items-center justify-between p-2 hover:bg-white rounded-xl cursor-pointer transition-all active:scale-[0.98] group"
                                                >
                                                    <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{status || "Unspecified"}</span>
                                                    <span className="text-sm font-black text-indigo-600 px-3 py-1 bg-indigo-50 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Theme Picker Modal */}
            <AnimatePresence>
                {isThemePickerOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsThemePickerOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                        <Palette size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Canvas Design</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Select your preferred matrix aesthetic</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsThemePickerOpen(false)} className="p-3 bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all shadow-sm border border-slate-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {[
                                    { id: 'default', name: 'Original Light', desc: 'Professional & Clean', class: 'bg-[#f8fafc] border-slate-200' },
                                    { id: 'dark', name: 'Deep Slate', desc: 'Focus & Comfort', class: 'bg-[#0f172a] border-slate-800' },
                                    { id: 'midnight', name: 'Midnight', desc: 'Darker & Stealth', class: 'bg-[#020617] border-slate-900' },
                                    { id: 'ocean', name: 'Ocean Mist', desc: 'Calming Blue', class: 'bg-gradient-to-br from-blue-600 to-indigo-900 border-blue-400/30' },
                                    { id: 'sunset', name: 'Sunset Glow', desc: 'Warm & Energy', class: 'bg-gradient-to-br from-rose-600 to-purple-900 border-rose-400/30' },
                                    { id: 'aurora', name: 'Northern Lights', desc: 'Modern Vibrant', class: 'bg-gradient-to-br from-emerald-600 to-teal-900 border-emerald-400/30' },
                                    { id: 'mesh', name: 'Matrix Grid', desc: 'Structured feeling', class: 'bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] border-slate-200' },
                                    { id: 'glass', name: 'Glass Grit', desc: 'Textured Surface', class: 'bg-slate-200 bg-[url("https://www.transparenttextures.com/patterns/cubes.png")] border-slate-300' },
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => { setCanvasTheme(t.id); setIsThemePickerOpen(false); toast.success(`${t.name} Applied`); }}
                                        className={`group relative flex flex-col gap-3 p-4 rounded-3xl border-2 transition-all hover:scale-[1.05] active:scale-95 ${canvasTheme === t.id ? 'border-indigo-600 shadow-xl shadow-indigo-100 ring-4 ring-indigo-50' : 'border-slate-100 hover:border-indigo-300'
                                            }`}
                                    >
                                        <div className={`h-24 w-full rounded-2xl border ${t.class} transition-transform group-hover:rotate-1`} />
                                        <div className="text-left">
                                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{t.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 mt-0.5 line-clamp-1">{t.desc}</p>
                                        </div>
                                        {canvasTheme === t.id && (
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md">
                                                <Check size={12} strokeWidth={4} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; border: 3px solid #f8fafc; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
                tr[data-highlighted="true"] td {
                    background-color: ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'rgba(255, 251, 235, 0.1)' : '#fffbeb'} !important;
                    box-shadow: inset 0 1px 0 0 #fde68a, inset 0 -1px 0 0 #fde68a !important;
                    z-index: 10;
                }
                tr[data-highlighted="true"] td:first-child {
                    box-shadow: inset 4px 0 0 0 #fbbf24, inset 0 1px 0 0 #fde68a, inset 0 -1px 0 0 #fde68a !important;
                }
                
                /* Custom Row Colors with Dark Support */
                tr[data-row-color] td { opacity: 0.9; }
                tr[data-row-color="#fffbeb"] td { background-color: ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'rgba(255, 251, 235, 0.1)' : '#fffbeb'} !important; }
                tr[data-row-color="#f0fdf4"] td { background-color: ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'rgba(240, 253, 244, 0.1)' : '#f0fdf4'} !important; }
                tr[data-row-color="#eff6ff"] td { background-color: ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'rgba(239, 246, 255, 0.1)' : '#eff6ff'} !important; }
                tr[data-row-color="#fdf2f8"] td { background-color: ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? 'rgba(253, 242, 248, 0.1)' : '#fdf2f8'} !important; }
                
                /* Theme-Aware Table Overrides for Ultimate Matrix Feel */
                ${['dark', 'midnight', 'ocean', 'sunset', 'aurora'].includes(canvasTheme) ? `
                    .matrix-table { border-collapse: separate; border-spacing: 0; }
                    .matrix-table td, .matrix-table th { 
                        color: #f1f5f9 !important; 
                        border-color: rgba(255, 255, 255, 0.08) !important;
                        background: transparent;
                    }
                    .matrix-table input, .matrix-table select, .matrix-table textarea { 
                        color: #fff !important; 
                        background: transparent !important;
                        border: none !important;
                    }
                    .matrix-table span, .matrix-table p { color: inherit !important; }
                    .matrix-table .sticky { 
                        background-color: rgba(15, 23, 42, 0.95) !important; 
                        backdrop-filter: blur(8px);
                    }
                    .matrix-table tr:hover td { 
                        background-color: rgba(255, 255, 255, 0.03) !important; 
                    }
                ` : ''}
            ` }} />
            {/* 🛸 OVERLAY & PORTAL ARCHITECTURE v3.0 */}
            {typeof document !== 'undefined' && createPortal(
                <div className="crm-global-overlays fixed inset-0 pointer-events-none z-[10000000]">
                    <div className="pointer-events-none h-full w-full relative text-slate-900">
                        {/* 🛸 MASTER COMMAND DRAWER */}
                        <AnimatePresence>
                            {selectedResponse && (
                                <>
                                    {/* 🌌 GLASS BACKDROP */}
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        onClick={() => setSelectedResponse(null)}
                                        className="fixed inset-0 bg-slate-950/90 backdrop-blur-3xl z-[9999999] pointer-events-auto"
                                    />

                                    <motion.div
                                        initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
                                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                        className="fixed top-0 right-0 h-full w-full max-w-[800px] bg-white shadow-[-100px_0_200px_rgba(0,0,0,0.6)] z-[9999999] overflow-hidden flex flex-col border-l border-slate-100 pointer-events-auto"
                                    >
                                        {/* 🪐 SUPER HEADER: WEBSITE GRADE DESIGN */}
                                        <div className="relative p-12 overflow-hidden shrink-0 bg-slate-950">
                                            {/* Dynamic Gradient Background */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-950 to-emerald-950 opacity-40" />
                                            <div className="absolute top-0 right-0 p-20 bg-indigo-500/10 blur-[100px] rounded-full" />

                                            <div className="relative z-10 flex flex-col gap-10">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-16 h-16 rounded-[28px] bg-white text-slate-950 flex items-center justify-center shadow-2xl animate-pulse">
                                                            <Activity size={28} />
                                                        </div>
                                                        <div>
                                                            <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-none mb-2">Record Intelligence</h2>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em]">Workspace Matrix v4</span>
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedResponse(null)}
                                                        className="w-16 h-16 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 rounded-[30px] transition-all border border-white/5 group"
                                                    >
                                                        <X size={28} className="group-hover:rotate-90 transition-transform duration-500" />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="flex bg-white/5 p-1.5 rounded-[24px] border border-white/10 shadow-inner">
                                                        <button onClick={() => setDrawerTab('edit')} className={`px-10 py-3.5 rounded-[20px] text-[11px] font-black uppercase tracking-[0.3em] transition-all ${drawerTab === 'edit' ? 'bg-indigo-600 text-white shadow-2xl' : 'text-slate-400 hover:text-white'}`}>Matrix Input</button>
                                                        <button onClick={() => setDrawerTab('history')} className={`px-10 py-3.5 rounded-[20px] text-[11px] font-black uppercase tracking-[0.3em] transition-all ${drawerTab === 'history' ? 'bg-indigo-600 text-white shadow-2xl' : 'text-slate-400 hover:text-white'}`}>Audit Life</button>
                                                    </div>
                                                    <div className="h-10 w-px bg-white/10 mx-4" />
                                                    <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none">ID: {selectedResponse.id.slice(-8)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 🌊 DRAWER CORE */}
                                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-16 bg-white">
                                            <AnimatePresence mode="wait">
                                                {drawerTab === 'edit' ? (
                                                    <motion.div
                                                        key="edit-matrix" initial={{ opacity: 0, scale: 0.98, x: -15 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.98, x: -15 }}
                                                        className="space-y-16"
                                                    >
                                                        {/* 🛸 FOLLOW-UP RADAR */}
                                                        <div className="bg-slate-50 p-10 rounded-[56px] border border-slate-100 shadow-sm relative overflow-hidden group/radar">
                                                            <div className="absolute top-0 right-0 p-16 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
                                                            <div className="flex items-center justify-between mb-10 relative z-10">
                                                                <div className="flex items-center gap-6">
                                                                    <div className="w-14 h-14 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-xl">
                                                                        <Target size={22} className="animate-pulse" />
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">INTERACTION MATRIX</h3>
                                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Lifecycle & Retention Stage</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => setOpenFollowUpModal({ formId: data?.form.id || "", responseId: selectedResponse.id })}
                                                                    className="px-8 py-4 bg-indigo-600 hover:bg-slate-950 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl hover:shadow-[0_20px_40px_rgba(79,70,229,0.3)] hover:scale-[1.05] flex items-center gap-3"
                                                                >
                                                                    <Plus size={16} /> Deploy REMARK
                                                                </button>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-8 relative z-10">
                                                                <div className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-inner group hover:bg-slate-950 hover:border-slate-800 transition-all duration-500">
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 group-hover:text-indigo-400">Next Scheduled Interaction</p>
                                                                    <div className="flex items-center gap-4 text-xl font-black text-slate-950 group-hover:text-white">
                                                                        <Calendar className="text-indigo-500" size={18} />
                                                                        {selectedResponse.remarks?.[0]?.nextFollowUpDate ? safeFormat(selectedResponse.remarks[0].nextFollowUpDate, "dd MMM yyyy") : "UNAWAITED"}
                                                                    </div>
                                                                </div>
                                                                <div className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-inner group hover:bg-slate-950 hover:border-slate-800 transition-all duration-500">
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 group-hover:text-indigo-400">Execution Status</p>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-sm ${(selectedResponse.remarks?.[0]?.followUpStatus || "") === "Drained" || (selectedResponse.remarks?.[0]?.followUpStatus || "") === "Closed"
                                                                            ? "bg-rose-500 text-white shadow-rose-200"
                                                                            : "bg-emerald-500 text-white shadow-emerald-200"
                                                                            }`}>
                                                                            {selectedResponse.remarks?.[0]?.followUpStatus || "ACTIVE PIPELINE"}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {selectedResponse.remarks?.[0]?.remark && (
                                                                <div className="mt-8 p-10 bg-white rounded-[32px] border border-slate-100 relative group/remark hover:border-indigo-200 transition-all">
                                                                    <Quote size={30} className="absolute -top-4 -left-2 text-slate-100 group-hover:text-indigo-500/20 transition-colors" />
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Recent Interaction Node</p>
                                                                    <p className="text-lg font-bold text-slate-800 leading-relaxed tracking-tight italic">"{selectedResponse.remarks?.[0]?.remark}"</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* 💎 FIELD INTELLIGENCE GRID */}
                                                        <div className="space-y-12">
                                                            <div className="flex items-center gap-5 px-4">
                                                                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-6 shrink-0">DATA PROTOCOLS <div className="h-[2px] w-24 bg-slate-100" /></h3>
                                                            </div>

                                                            <div className="grid grid-cols-1 gap-12 px-2">
                                                                {[...(data?.internalColumns?.map(c => ({ ...c, label: c.label || c.id, isInternal: true })) || []), ...(data?.form?.fields?.filter(f => !["static", "header", "separator"].includes(f.type)).map(f => ({ ...f, label: f.label || f.id, isInternal: false })) || [])].map((col) => {
                                                                    const val = getCellValue(selectedResponse.id, col.id, col.isInternal);
                                                                    const isInternal = col.isInternal;

                                                                    return (
                                                                        <div key={col.id} className="group/field relative">
                                                                            <div className="flex flex-col gap-6 p-8 rounded-[48px] bg-white border-2 border-slate-100 group-hover/field:border-indigo-500/30 group-hover/field:shadow-[0_30px_70px_rgba(0,0,0,0.05)] transition-all duration-500 relative z-10">
                                                                                <div className="flex items-center justify-between relative px-2">
                                                                                    <div className="flex items-center gap-4">
                                                                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover/field:text-indigo-500 transition-colors">{col.label}</label>
                                                                                        {isInternal && <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">INTERNAL</div>}
                                                                                    </div>
                                                                                    {col.type === "dropdown" && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
                                                                                </div>

                                                                                <div className="relative px-2">
                                                                                    {col.type === "dropdown" ? (
                                                                                        <select
                                                                                            className="w-full bg-slate-50 border-none rounded-3xl px-8 py-5 text-xl font-black text-slate-950 focus:ring-2 ring-indigo-500/20 appearance-none cursor-pointer transition-all shadow-inner"
                                                                                            value={val}
                                                                                            onChange={(e) => handleUpdateValue(selectedResponse.id, col.id, e.target.value, isInternal)}
                                                                                        >
                                                                                            <option value="">Select Option Protocol...</option>
                                                                                            {col.options?.map((opt: any) => {
                                                                                                const optLabel = typeof opt === 'string' ? opt : opt.label;
                                                                                                return <option key={optLabel} value={optLabel}>{optLabel}</option>;
                                                                                            })}
                                                                                        </select>
                                                                                    ) : col.type === "user" ? (
                                                                                        <select
                                                                                            className="w-full bg-slate-50 border-none rounded-3xl px-8 py-5 text-xl font-black text-slate-950 focus:ring-2 ring-indigo-500/20 appearance-none cursor-pointer transition-all shadow-inner"
                                                                                            value={val}
                                                                                            onChange={(e) => handleUpdateValue(selectedResponse.id, col.id, e.target.value, isInternal)}
                                                                                        >
                                                                                            <option value="">Choose Agent Entity...</option>
                                                                                            {teamMembers.map(tm => (
                                                                                                <option key={tm.clerkId} value={tm.clerkId}>{tm.firstName ? `${tm.firstName} ${tm.lastName || ''}` : tm.email}</option>
                                                                                            ))}
                                                                                        </select>
                                                                                    ) : col.type === "textarea" ? (
                                                                                        <textarea
                                                                                            className="w-full bg-white border-2 border-slate-100 rounded-[32px] p-8 text-[18px] font-bold text-slate-800 focus:border-indigo-500 focus:ring-0 min-h-[140px] resize-none leading-relaxed transition-all shadow-inner"
                                                                                            value={val}
                                                                                            onChange={(e) => handleUpdateValue(selectedResponse.id, col.id, e.target.value, isInternal)}
                                                                                            placeholder={`Enter detailed ${col.label} metrics...`}
                                                                                        />
                                                                                    ) : col.type === "file" ? (
                                                                                        <div className="flex flex-col gap-6">
                                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                                {String(val || "").split(",").filter(Boolean).map((fileUrl, fIdx) => (
                                                                                                    <div key={fIdx} className="relative group/file">
                                                                                                        <div className="aspect-square bg-slate-100 rounded-[32px] overflow-hidden border-2 border-slate-200 group-hover/file:border-indigo-400 group-hover/file:shadow-2xl transition-all duration-500">
                                                                                                            <img src={fileUrl} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://img.icons8.com/color/96/file.png')} />
                                                                                                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                                                                                                <a href={fileUrl} target="_blank" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-950 hover:bg-indigo-600 hover:text-white transition-all transform hover:scale-110"><ExternalLink size={20} /></a>
                                                                                                                <button onClick={() => {
                                                                                                                    const files = String(val || "").split(",").filter(Boolean);
                                                                                                                    files.splice(fIdx, 1);
                                                                                                                    handleUpdateValue(selectedResponse.id, col.id, files.join(","), isInternal);
                                                                                                                }} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-600 hover:bg-rose-600 hover:text-white transition-all transform hover:scale-110"><Trash2 size={20} /></button>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div className="mt-4 px-2">
                                                                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{fileUrl.split('/').pop()}</p>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ))}

                                                                                                {/* Multi-Artifact Slot */}
                                                                                                <div className="relative group/upload h-full">
                                                                                                    <input
                                                                                                        type="file"
                                                                                                        onChange={(e) => {
                                                                                                            const file = e.target.files?.[0];
                                                                                                            if (file) {
                                                                                                                const currentFiles = String(val || "").split(",").filter(Boolean);
                                                                                                                if (currentFiles.length >= 4) { toast.error("Matrix storage limit reached (4 artifacts max)"); return; }
                                                                                                                toast.loading("Encrypting Artifact...");
                                                                                                                setTimeout(() => {
                                                                                                                    const mockUrl = currentFiles.length === 0 ? "https://images.unsplash.com/photo-1621252179027-94459d278660?auto=format&fit=crop&q=80&w=200" : "https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&q=80&w=200";
                                                                                                                    handleUpdateValue(selectedResponse.id, col.id, [...currentFiles, mockUrl].join(","), isInternal);
                                                                                                                    toast.dismiss();
                                                                                                                    toast.success("Artifact Synchronized");
                                                                                                                }, 1500);
                                                                                                            }
                                                                                                        }}
                                                                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                                                    />
                                                                                                    <div className="aspect-square border-[3px] border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center gap-4 group-hover/upload:border-indigo-400 group-hover/upload:bg-indigo-50/50 transition-all duration-500 shadow-inner">
                                                                                                        <div className="w-16 h-16 rounded-[22px] bg-slate-100 text-slate-400 flex items-center justify-center group-hover/upload:bg-indigo-600 group-hover/upload:text-white group-hover/upload:scale-125 group-hover/upload:rotate-12 transition-all duration-700 shadow-2xl shadow-slate-200">
                                                                                                            <UploadCloud size={28} />
                                                                                                        </div>
                                                                                                        <div className="text-center">
                                                                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Deploy Link</p>
                                                                                                            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">Secondary Artifact</p>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <input
                                                                                            type={col.type === "number" || col.type === "currency" ? "number" : col.type === "date" ? "date" : "text"}
                                                                                            className="w-full bg-slate-50 border-none rounded-3xl px-8 py-5 text-xl font-black text-slate-950 focus:ring-2 ring-indigo-500/20 appearance-none transition-all shadow-inner tracking-tight"
                                                                                            value={val}
                                                                                            onChange={(e) => handleUpdateValue(selectedResponse.id, col.id, e.target.value, isInternal)}
                                                                                            placeholder={`Inject ${col.label} value...`}
                                                                                        />
                                                                                    )}
                                                                                </div>
                                                                                <div className="absolute inset-x-12 bottom-0 h-[8px] bg-slate-100 rounded-full group-hover/field:bg-indigo-500 group-hover/field:h-[12px] group-hover/field:inset-x-0 transition-all duration-700 pointer-events-none" />
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="history-matrix" initial={{ opacity: 0, scale: 0.98, x: 15 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.98, x: 15 }}
                                                        className="space-y-12"
                                                    >
                                                        <div className="flex flex-col gap-10">
                                                            <div className="flex items-center justify-between px-6">
                                                                <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-6">Audit Lifecycle <div className="h-[2px] w-24 bg-slate-100 rounded-full" /></h3>
                                                                <span className="text-[10px] font-black text-slate-500 bg-slate-100/80 px-5 py-2 rounded-full uppercase tracking-[0.2em]">{selectedResponseActivities.length} Total Actions</span>
                                                            </div>

                                                            <div className="space-y-10 px-6 border-l-[3px] border-slate-100 ml-6 relative min-h-[200px]">
                                                                {isFetchingActivities ? (
                                                                    <div className="space-y-8 pl-12">
                                                                        {[1, 2, 3].map(i => (
                                                                            <div key={i} className="h-32 w-full bg-slate-100 animate-pulse rounded-[56px]" />
                                                                        ))}
                                                                    </div>
                                                                ) : selectedResponseActivities.length > 0 ? (
                                                                    selectedResponseActivities.map((act: any) => (
                                                                        <div key={act.id} className="relative pl-12 pb-12 group/audit">
                                                                            <div className="absolute left-[-15px] top-2 w-7 h-7 rounded-full bg-white border-[6px] border-slate-100 group-hover/audit:border-indigo-500 group-hover/audit:scale-125 transition-all duration-500 shadow-xl flex items-center justify-center">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover/audit:bg-indigo-500" />
                                                                            </div>
                                                                            <div className="flex flex-col gap-6">
                                                                                <div className="flex items-center justify-between">
                                                                                    <div className="flex items-center gap-5">
                                                                                        <div className="w-12 h-12 rounded-[18px] bg-slate-950 flex items-center justify-center text-[12px] font-black text-white shadow-xl">{act.userName[0]}</div>
                                                                                        <div>
                                                                                            <p className="text-[16px] font-black text-slate-950 mb-1 leading-none">{act.userName}</p>
                                                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{safeFormat(act.createdAt, "dd MMM yyyy, HH:mm:ss")}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="bg-slate-50/50 p-10 rounded-[56px] border border-slate-100 group-hover/audit:bg-white group-hover/audit:border-indigo-200 group-hover/audit:shadow-[0_25px_80px_rgba(0,0,0,0.06)] transition-all duration-700">
                                                                                    <div className="flex items-center gap-4 mb-6">
                                                                                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Database size={14} /></div>
                                                                                        <p className="text-[12px] text-slate-400 font-black uppercase tracking-widest">Field Updated: <span className="text-slate-950">{act.columnName}</span></p>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-8">
                                                                                        <div className="flex-1 px-8 py-5 rounded-3xl bg-rose-50/50 text-rose-600 border border-rose-100 line-through opacity-50 truncate font-bold text-[14px]">{act.oldValue || "-"}</div>
                                                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 shadow-inner"><ArrowRight size={20} className="text-slate-300 group-hover/audit:text-indigo-400 transition-colors" /></div>
                                                                                        <div className="flex-1 px-8 py-5 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-100 font-black truncate text-[14px] shadow-sm shadow-emerald-500/5">{act.newValue}</div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50 rounded-[64px] border-2 border-dashed border-slate-200 ml-[-20px]">
                                                                        <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center mb-10 shadow-2xl border border-slate-100">
                                                                            <Clock size={50} className="text-slate-200" />
                                                                        </div>
                                                                        <h4 className="text-[14px] font-black text-slate-950 uppercase tracking-[0.4em] mb-4">Silent Timeline</h4>
                                                                        <p className="text-[11px] font-bold text-slate-400 text-center max-w-[280px] leading-relaxed">No activity logs recorded for this protocol yet. The matrix is silent.</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>

                        {/* 🛸 FOLLOW-UP & REMARK MODAL (ABOVE DRAWER) */}
                        {openFollowUpModal && (
                            <div className="fixed inset-0 z-[10000001] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md pointer-events-auto">
                                <FormRemarkModal
                                    formId={openFollowUpModal.formId}
                                    responseId={openFollowUpModal.responseId}
                                    columnId={openFollowUpModal.columnId}
                                    onClose={() => setOpenFollowUpModal(null)}
                                    userRole={userRole || 'GUEST'}
                                    onSave={() => fetchData(currentPage, rowsPerPage, searchTerm, sortBy, sortOrder, conditions, filterConjunction, true)}
                                />
                            </div>
                        )}

                        {/* 🛸 OTHER MODALS PORTALED */}
                        {openPaymentModal && (
                            <div className="fixed inset-0 z-[10000002] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md pointer-events-auto">
                                <PaymentHubModal
                                    formId={openPaymentModal.formId}
                                    responseId={openPaymentModal.responseId}
                                    userRole={userRole || 'GUEST'}
                                    onClose={() => setOpenPaymentModal(null)}
                                    onSave={() => fetchData(currentPage, rowsPerPage, searchTerm, sortBy, sortOrder, conditions, filterConjunction, true)}
                                />
                            </div>
                        )}

                        {isPaymentHubOpen && (
                            <div className="fixed inset-0 z-[10000003] pointer-events-auto">
                                <PaymentHubDashboard
                                    formId={params.id as string}
                                    onClose={() => setIsPaymentHubOpen(false)}
                                />
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
            {/* BULK IMPORT MODAL */}
            {isBulkImportOpen && (
                <BulkImportModal
                    formId={params.id as string}
                    onClose={() => setIsBulkImportOpen(false)}
                    onSuccess={() => {
                        fetchData(currentPage, rowsPerPage, searchTerm, sortBy, sortOrder, conditions, filterConjunction);
                        setIsBulkImportOpen(false);
                    }}
                    availableColumns={[
                        { id: "__assigned", label: "Assigned To", isInternal: false, type: "user" },
                        { id: "__followUpStatus", label: "Calling Status", isInternal: false, type: "text" },
                        { id: "__nextFollowUpDate", label: "Next Follow-up Date", isInternal: false, type: "date" },
                        { id: "__recentRemark", label: "Recent Remark", isInternal: false, type: "text" },
                        ...(data?.form.fields || []).map(f => ({ id: f.id, label: f.label, isInternal: false, type: f.type })),
                        ...(data?.internalColumns || []).map(c => ({ id: c.id, label: c.label, isInternal: true, type: c.type }))
                    ]}
                />
            )}

            {isLeadAssignHubOpen && (
                <LeadAssignHub
                    formId={params.id as string}
                    onClose={() => setIsLeadAssignHubOpen(false)}
                    responses={data?.responses || []}
                    selectedIds={selectedRows}
                    teamMembers={teamMembers}
                    onSuccess={() => fetchData(currentPage, rowsPerPage, searchTerm, sortBy, sortOrder, conditions, filterConjunction)}
                />
            )}
            {/* PREMIUM FLOATING BATCH ACTION DOCK */}
            <AnimatePresence>
                {selectedRows.length > 0 && (
                    <motion.div
                        initial={{ y: 100, x: "-50%", opacity: 0 }}
                        animate={{ y: 0, x: "-50%", opacity: 1 }}
                        exit={{ y: 100, x: "-50%", opacity: 0 }}
                        className="fixed bottom-12 left-1/2 z-[1000] flex items-center gap-8 px-10 py-6 bg-slate-900/90 backdrop-blur-3xl border border-white/20 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] rounded-[40px] min-w-[500px]"
                    >
                        <div className="flex items-center gap-4 pr-10 border-r border-white/10 group">
                            <motion.div
                                animate={selectedRows.length > 0 ? { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] } : {}}
                                transition={{ repeat: Infinity, duration: 4 }}
                                className="w-14 h-14 rounded-3xl bg-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-[0_12px_24px_rgba(79,70,229,0.4)] border border-indigo-400/30 overflow-hidden relative"
                            >
                                <span className="relative z-10">{selectedRows.length}</span>
                                <motion.div
                                    className="absolute bottom-0 left-0 right-0 bg-white/20"
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(selectedRows.length / (filteredResponses?.length || 1)) * 100}%` }}
                                />
                            </motion.div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-1">Matrix Active</p>
                                <p className="text-lg font-black text-white tracking-tight leading-none">
                                    {selectedRows.length} <span className="text-slate-500 text-sm font-bold uppercase tracking-widest ml-1">of {filteredResponses?.length} locked</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                disabled={isBulkDeleting}
                                onClick={() => {
                                    if (window.confirm(`Are you sure you want to execute a bulk purge on ${selectedRows.length} records?`)) {
                                        handleBulkDelete();
                                        setSelectedRows([]);
                                    }
                                }}
                                className="group px-8 py-3.5 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-[0_12px_24px_rgba(244,63,94,0.3)] hover:shadow-[0_20px_40px_rgba(244,63,94,0.4)] active:scale-95 border border-rose-400/20"
                            >
                                {isBulkDeleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={16} />}
                                Execute Purge Cycle
                            </button>

                            <button
                                onClick={() => setIsLeadAssignHubOpen(true)}
                                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-[0_12px_24px_rgba(79,70,229,0.3)] hover:shadow-[0_20px_40px_rgba(79,70,229,0.4)] active:scale-95 border border-indigo-400/20"
                            >
                                <Sparkles size={16} />
                                Lead Distribute
                            </button>

                            <button
                                onClick={() => setSelectedRows([])}
                                className="px-8 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border border-white/10 hover:border-white/20 active:scale-95"
                            >
                                <X size={16} />
                                Release Sector
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PREMIUN FLOATING MAXIMIZE TOGGLE */}

            {/* Final Status Matrix Modal Replacement */}
            <AnimatePresence>
                {statusMatrixModal && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setStatusMatrixModal(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm overflow-hidden relative z-10 border-4 border-white"
                        >
                            <div className="p-8 border-b border-slate-50 bg-[#F9FAFB] flex items-center justify-between">
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">Update Dimension</h3>
                                    <p className="text-[15px] font-black text-slate-800 tracking-tighter mt-1">{statusMatrixModal.label}</p>
                                </div>
                                <button onClick={() => setStatusMatrixModal(null)} className="p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-100">
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar bg-white">
                                <div className="grid grid-cols-1 gap-2">
                                    {(statusMatrixModal.options && statusMatrixModal.options.length > 0
                                        ? statusMatrixModal.options.map((o: any) => typeof o === 'string' ? o : o.label)
                                        : CALL_STATUS_OPTIONS
                                    ).map(opt => {
                                        const isSelected = statusMatrixModal.val === opt;
                                        return (
                                            <button
                                                key={opt}
                                                onClick={() => {
                                                    if (statusMatrixModal.colId === "__followUpStatus") {
                                                        handleInstantStatusUpdate(statusMatrixModal.rowId, opt);
                                                    } else {
                                                        handleStatusCellUpdate(statusMatrixModal.rowId, statusMatrixModal.colId, opt, statusMatrixModal.isInternal);
                                                    }
                                                    setStatusMatrixModal(null);
                                                }}
                                                className={`w-full text-left px-6 py-4 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all flex items-center justify-between group ${isSelected
                                                    ? 'bg-indigo-600 text-white shadow-xl scale-[1.02]'
                                                    : 'bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'
                                                    }`}
                                            >
                                                <span>{opt}</span>
                                                {isSelected ? <CheckCircle2 size={18} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200 group-hover:border-indigo-300 transition-colors" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                                <button
                                    onClick={() => {
                                        setOpenFollowUpModal({ formId: data?.form?.id || '', responseId: statusMatrixModal.rowId });
                                        setStatusMatrixModal(null);
                                    }}
                                    className="flex-1 py-4 bg-white text-indigo-600 rounded-[20px] text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <History size={16} /> Interaction Log
                                </button>
                                <button
                                    onClick={() => setStatusMatrixModal(null)}
                                    className="flex-1 py-4 bg-slate-200 text-slate-600 rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <motion.button
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFullScreen(!isFullScreen)}
                className={`fixed bottom-10 right-10 z-[101] w-16 h-16 rounded-3xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] flex flex-col items-center justify-center transition-all duration-500 border-2 backdrop-blur-xl group ${isFullScreen
                    ? 'bg-slate-950/90 text-white border-slate-800 shadow-slate-900/40'
                    : 'bg-indigo-600/90 text-white border-indigo-400/50'
                    }`}
                title={isFullScreen ? "Exit Full View" : "Enable Full Table View"}
            >
                <div className="relative">
                    {isFullScreen ? (
                        <Minimize2 size={22} className="group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                        <Maximize2 size={22} className="group-hover:scale-110 transition-transform duration-500" />
                    )}
                    <div className={`absolute -inset-4 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isFullScreen ? 'bg-slate-500/20' : 'bg-white/20'}`} />
                </div>
                <span className="text-[7px] font-black uppercase tracking-[0.1em] mt-1.5 opacity-60 group-hover:opacity-100 transition-all">
                    {isFullScreen ? "Focus Off" : "Full Table"}
                </span>

                {/* Glow Effect */}
                {!isFullScreen && (
                    <div className="absolute inset-0 bg-indigo-500/20 rounded-3xl blur-md -z-10 animate-pulse" />
                )}
            </motion.button>
        </div>
    );
}
