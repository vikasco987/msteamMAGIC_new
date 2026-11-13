"use client";
import { useUnifiedAuth as useUser, useAuth } from "@/lib/useUnifiedAuth";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";


import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Task as TaskType } from "../../types/task"; // Ensure this path is correct

import EditTaskModal from "./EditTaskModal";
import TaskDetailsCard from "./TaskDetailsCard";
import FloatingTaskCard from "./FloatingTaskCard";
import toast from "react-hot-toast";

import { FaFileExcel } from "react-icons/fa";
import { format, isToday, subDays, startOfMonth, startOfYear } from 'date-fns';

import { BoardFilters } from "./BoardFilters";

// --- Helper function to strip emojis ---
const stripEmojis = (str: string | null | undefined): string => {
  if (!str) return "";
  // This regex matches various emoji ranges and variation selectors
  return str.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2B50}\u{2B55}\u{2934}\u{2935}\u{3030}\u{303D}\u{3297}\u{3299}]/gu, '').trim();
};

const TASK_CATEGORIES = [
  { label: "🍽️ Zomato Onboarding", value: "zomato" },
  { label: "🍔 Swiggy Onboarding", value: "swiggy" },
  { label: "🛵 Toing Onboarding", value: "toing" },
  { label: "🛍️ Ownly Onboarding", value: "ownly" },
  { label: "🧾 Food License", value: "license" },
  { label: "📸 Photo Upload", value: "photo" },
  { label: "📂 Account Handling", value: "account" },
  { label: "🖨️ Printer Setup", value: "printer" },
  { label: "🖨️💻 Printer + Software", value: "printer_software" },
  { label: "🔄 RTO Printer", value: "rto_printer" },
  { label: "⚠️ Escalation", value: "escalation" },
  { label: "🛠️ Other", value: "other" },
];

const columns = [
  {
    id: "todo",
    title: "📝 To Do",
    color: "border-blue-500",
    bgColor: "bg-gradient-to-br from-blue-100 to-blue-50",
  },
  {
    id: "inprogress",
    title: "⏳ In Progress",
    color: "border-yellow-600",
    bgColor: "bg-gradient-to-br from-yellow-100 to-yellow-50",
  },
  {
    id: "done",
    title: "✅ Done",
    color: "border-green-500",
    bgColor: "bg-gradient-to-br from-green-100 to-green-50",
  },
];

const getTaskBgColor = (task: TaskType) => {
  if (task.customFields?.activeTab === "escalation") {
    return "bg-red-50 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] border-2";
  }
  if (task.status === "done") return "bg-emerald-50/50 border-emerald-100";
  if (!task.createdAt) return "bg-white border-slate-100";

  const elapsedHrs = (Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60);
  const p = (task.priority || "").toLowerCase();

  // Urgent/High: gets critical quickly
  if (p === "urgent" || p === "high") {
    if (elapsedHrs > 24) return "bg-rose-50 border-rose-200";
    if (elapsedHrs > 12) return "bg-orange-50 border-orange-200";
    if (elapsedHrs > 4) return "bg-amber-50 border-amber-200";
    return "bg-white border-slate-100";
  } 
  // Medium
  else if (p === "medium") {
    if (elapsedHrs > 48) return "bg-rose-50 border-rose-200";
    if (elapsedHrs > 24) return "bg-orange-50 border-orange-200";
    if (elapsedHrs > 12) return "bg-amber-50 border-amber-200";
    return "bg-white border-slate-100";
  } 
  // Low or Unassigned
  else {
    if (elapsedHrs > 72) return "bg-rose-50 border-rose-200";
    if (elapsedHrs > 48) return "bg-orange-50 border-orange-200";
    if (elapsedHrs > 24) return "bg-amber-50 border-amber-200";
    return "bg-white border-slate-100";
  }
};

export default function Board() {
  const { user } = useUser();
  const { getToken } = useAuth();
  
  // Independent Column State
  const [columnsData, setColumnsData] = useState<Record<string, { tasks: TaskType[], page: number, hasMore: boolean, loading: boolean }>>({
    todo: { tasks: [], page: 1, hasMore: true, loading: false },
    inprogress: { tasks: [], page: 1, hasMore: true, loading: false },
    done: { tasks: [], page: 1, hasMore: true, loading: false },
  });

  const [counts, setCounts] = useState<Record<string, number>>({ todo: 0, inprogress: 0, done: 0 });
  const [totalActiveTasks, setTotalActiveTasks] = useState(0);

  const [editingTask, setEditingTask] = useState<TaskType | null>(null);
  const [floatingTask, setFloatingTask] = useState<TaskType | null>(null);

  const [filterText, setFilterText] = useState("");
  const [sortBy, setSortBy] = useState<keyof TaskType>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedAssigners, setSelectedAssigners] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>(["last_15_days"]);

  const [allAssignees, setAllAssignees] = useState<string[]>([]);
  const [allAssigners, setAllAssigners] = useState<string[]>([]);
  const [allStatuses, setAllStatuses] = useState<string[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showAllTasksMode, setShowAllTasksMode] = useState(false);

  const hasFetchedInitially = useRef(false);
  const seenTaskIdsRef = useRef<Set<string>>(new Set());

  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});
  const lastUpdateRef = useRef<number>(0);

  const buildQueryParams = (colId: string, page: number, limit: number = 20) => {
    const params = new URLSearchParams();
    params.set('status', colId);
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    params.set('sortKey', sortBy);
    params.set('sortDir', sortDirection);
    if (filterText) params.set('search', filterText);
    if (selectedCategories.length) params.set('categories', selectedCategories.join(','));
    if (selectedAssignees.length) params.set('assignees', selectedAssignees.join(','));
    if (selectedAssigners.length) params.set('assigners', selectedAssigners.join(','));
    if (selectedDates.length) params.set('dateFilter', selectedDates.join(','));
    return params.toString();
  };

  const fetchOptions = useCallback(async () => {
    try {
      const res = await fetch('/api/board/options');
      if (res.ok) {
        const json = await res.json();
        setAllAssignees(json.allAssignees || []);
        setAllAssigners(json.allAssigners || []);
        setAllStatuses(json.allStatuses || []);
      }
    } catch (e) {}
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      const params = buildQueryParams('', 1, 1);
      const res = await fetch('/api/board/counts?' + params);
      if (res.ok) {
        const json = await res.json();
        setCounts(json.counts || { todo: 0, inprogress: 0, done: 0 });
        const total = (json.counts?.todo || 0) + (json.counts?.inprogress || 0) + (json.counts?.done || 0);
        setTotalActiveTasks(total);
      }
    } catch (err) {}
  }, [filterText, selectedCategories, selectedAssignees, selectedAssigners, selectedDates]);

  const fetchColumnTasks = useCallback(async (colId: string, page: number, isInitial: boolean = false, isAutoRefresh: boolean = false) => {
    if (!isAutoRefresh) {
      setColumnsData(prev => ({
        ...prev,
        [colId]: { ...prev[colId], loading: true }
      }));
    }

    try {
      const q = buildQueryParams(colId, page, 20);
      const res = await fetch("/api/board/paginated?" + q);
      if (!res.ok) throw new Error("Fetch failed");
      const json = await res.json();
      
      const newTasks: TaskType[] = json.tasks || [];
      const hasMore = json.hasMore;

      // New tasks notification logic (only on auto-refresh or initial)
      const seenTaskIds = seenTaskIdsRef.current;
      const trulyNewTasks = newTasks.filter(task => !seenTaskIds.has(task.id));
      if (trulyNewTasks.length > 0 && !isInitial && page === 1) {
        try {
          if (audioRef.current) { audioRef.current.volume = 1; audioRef.current.play(); }
          toast.success(`🎉 ${trulyNewTasks.length} new task(s)!`);
        } catch (err) {}
      }
      newTasks.forEach(t => seenTaskIds.add(t.id));

      setColumnsData(prev => {
        // If it's page 1 AND not an auto-refresh, we are applying a filter or initial load, so reset tasks.
        // If it's auto-refresh, we keep existing tasks and merge new ones to avoid resetting scroll/pagination.
        const existingTasks = (page === 1 && !isAutoRefresh) ? [] : prev[colId].tasks;
        
        // Merge strategy: preserve pending changes
        const mergedTasks = [...newTasks, ...existingTasks].map(incomingTask => {
          if (pendingChanges[incomingTask.id]) {
            return { ...incomingTask, status: pendingChanges[incomingTask.id] };
          }
          return incomingTask;
        });

        // Unique by ID to avoid duplicates if items shifted
        const uniqueTasks = Array.from(new Map(mergedTasks.map(item => [item.id, item])).values());

        return {
          ...prev,
          [colId]: { tasks: uniqueTasks, page: isAutoRefresh ? prev[colId].page : page, hasMore: isAutoRefresh ? prev[colId].hasMore : hasMore, loading: false }
        };
      });
    } catch (err) {
      console.error("Fetch tasks error for column", colId, err);
      setColumnsData(prev => ({
        ...prev,
        [colId]: { ...prev[colId], loading: false }
      }));
    }
  }, [filterText, sortBy, sortDirection, selectedCategories, selectedAssignees, selectedAssigners, selectedDates, pendingChanges]);

  // Load all columns for page 1
  const loadAllColumns = useCallback(async (isInitial = false, isAutoRefresh = false) => {
    if (!user) return;
    if (isInitial) setLoading(true);
    
    const role = (user.publicMetadata?.role as string || user.unsafeMetadata?.role as string || "").toLowerCase();
    setUserRole(role);

    await Promise.all([
      fetchColumnTasks("todo", 1, isInitial, isAutoRefresh),
      fetchColumnTasks("inprogress", 1, isInitial, isAutoRefresh),
      fetchColumnTasks("done", 1, isInitial, isAutoRefresh),
      fetchCounts()
    ]);

    if (isInitial) setLoading(false);
  }, [user, fetchColumnTasks, fetchCounts]);

  useEffect(() => {
    if (!user?.id) return;
    if (!hasFetchedInitially.current) {
      loadAllColumns(true);
      fetchOptions();
      hasFetchedInitially.current = true;
    } else {
      // If any dependency changed (like search), reset pages and reload
      loadAllColumns(false);
    }

    let intervalId: NodeJS.Timeout;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        // Only run auto-refresh if we haven't manually updated in the last 3s
        if (Date.now() - lastUpdateRef.current >= 3000) {
          loadAllColumns(false, true);
        }
      }, 10000);
    }
    return () => clearInterval(intervalId);
  }, [user?.id, loadAllColumns, fetchOptions, autoRefresh]);

  // Infinite Scroll Observer
  const observer = useRef<IntersectionObserver | null>(null);
  const lastTaskElementRef = useCallback((node: HTMLDivElement | null, colId: string) => {
    if (columnsData[colId].loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && columnsData[colId].hasMore) {
        fetchColumnTasks(colId, columnsData[colId].page + 1, false);
      }
    });

    if (node) observer.current.observe(node);
  }, [columnsData, fetchColumnTasks]);


  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;
    const newStatus = destCol;

    lastUpdateRef.current = Date.now();
    setPendingChanges(prev => ({ ...prev, [draggableId]: newStatus }));

    // Optimistic Update across columns
    setColumnsData(prev => {
      const next = { ...prev };
      const taskIndex = next[sourceCol].tasks.findIndex(t => t.id === draggableId);
      if (taskIndex > -1) {
        const [task] = next[sourceCol].tasks.splice(taskIndex, 1);
        task.status = newStatus;
        next[destCol].tasks.splice(destination.index, 0, task);
      }
      return next;
    });

    setCounts(prev => ({
      ...prev,
      [sourceCol]: Math.max(0, (prev[sourceCol] || 0) - 1),
      [destCol]: (prev[destCol] || 0) + 1
    }));

    try {
      const res = await fetch(`/api/tasks/${draggableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(`Task moved to ${newStatus}`);
      fetchCounts(); // Update counts since task moved
    } catch (err: any) {
      toast.error(err.message || "Failed to update task. Reverting...");
      loadAllColumns(false); // Refetch everything to revert
    } finally {
      setTimeout(() => {
        setPendingChanges(prev => {
          const next = { ...prev };
          delete next[draggableId];
          return next;
        });
      }, 5000);
    }
  };

  const handleFieldUpdate = async (taskId: string, updatedFields: Partial<TaskType>) => {
    lastUpdateRef.current = Date.now();
    
    if (updatedFields.status) {
      setPendingChanges(prev => ({ ...prev, [taskId]: updatedFields.status! }));
    }

    // Apply update to the task in whichever column it is
    setColumnsData(prev => {
      const next = { ...prev };
      for (const col of Object.keys(next)) {
        next[col].tasks = next[col].tasks.map(t => t.id === taskId ? { ...t, ...updatedFields } : t);
      }
      return next;
    });
    
    if (updatedFields.assigneeId || updatedFields.assigneeIds) {
      toast.success("Assignment updated!");
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (!res.ok) throw new Error("Update failed");
      if (!updatedFields.status && !updatedFields.assigneeId) {
        toast.success("Changes saved");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to sync changes. Reverting...");
      loadAllColumns(false);
    } finally {
      if (updatedFields.status) {
        setTimeout(() => {
          setPendingChanges(prev => {
            const next = { ...prev };
            delete next[taskId];
            return next;
          });
        }, 5000);
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    // Optimistic Delete
    setColumnsData(prev => {
      const next = { ...prev };
      for (const col of Object.keys(next)) {
        next[col].tasks = next[col].tasks.filter(t => t.id !== taskId);
      }
      return next;
    });
    toast.success("Task deleted");

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Delete failed");
      fetchCounts();
    } catch (err) {
      toast.error("Failed to delete from server. Reverting...");
      loadAllColumns(false);
    }
  };

  const exportToExcel = async () => {
    try {
      const xlsx = await import("xlsx");
      // Fetch all for export without pagination limit using the paginated endpoint
      const q = buildQueryParams("", 1, 5000);
      const res = await fetch(`/api/board/paginated?${q}`);
      const json = await res.json();
      const allTasks: TaskType[] = json.tasks || [];
      
      const exportData = allTasks.map(t => ({
        "Task ID": t.id || "-",
        "Title": t.title ? String(t.title).trim() : "-",
        "Status": t.status || "-",
        "Priority": t.priority || "-",
        "Shop Name": t.shopName || t.customFields?.shopName || "-",
        "Outlet Name": t.customFields?.outletName || "-",
        "Customer Name": t.customerName || t.customFields?.customerName || "-",
        "Phone": t.phone || t.customFields?.phone || "-",
        "Email": t.email || t.customFields?.email || "-",
        "Package": t.customFields?.packageAmount || "-",
        "Assignees": t.assignees?.map(a => a.name).join(", ") || t.assigneeName || "-",
        "Created At": t.createdAt ? new Date(t.createdAt).toLocaleString() : "-"
      }));

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(exportData);
      xlsx.utils.book_append_sheet(wb, ws, "Tasks");
      
      xlsx.writeFile(wb, `Tasks_Export_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success("Excel exported successfully!");
    } catch (err) {
      console.error("Excel generation failed:", err);
      toast.error("Failed to export Excel.");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 bg-slate-50 min-h-screen">
      <audio ref={audioRef} src="/notification.wav" preload="auto" />

      <BoardFilters
        filterText={filterText}
        setFilterText={setFilterText}
        sortBy={sortBy}
        setSortBy={(val) => setSortBy(val as keyof TaskType)}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        selectedStatuses={selectedStatuses}
        setSelectedStatuses={setSelectedStatuses}
        selectedAssignees={selectedAssignees}
        setSelectedAssignees={setSelectedAssignees}
        selectedAssigners={selectedAssigners}
        setSelectedAssigners={setSelectedAssigners}
        selectedDates={selectedDates}
        setSelectedDates={setSelectedDates}
        allCategories={TASK_CATEGORIES}
        allStatuses={allStatuses}
        allAssignees={allAssignees}
        allAssigners={allAssigners}
        showAllTasksMode={showAllTasksMode}
        setShowAllTasksMode={setShowAllTasksMode}
        exportToExcel={exportToExcel}
        activeTasksCount={totalActiveTasks}
      />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {columns.map(col => {
            const colData = columnsData[col.id] || { tasks: [], loading: false, hasMore: false };
            const count = counts[col.id] || colData.tasks.length;

            // Only display tasks if they match the selected status (if any are selected in global filter)
            // But since the API already filters it, we just map over the API returned ones.
            return (
              <div key={col.id} className="flex flex-col gap-4">
                <div className={`flex items-center justify-between p-4 rounded-2xl border-l-4 ${col.color} bg-white shadow-sm font-black text-slate-700 uppercase tracking-widest text-xs`}>
                  <span>{col.title}</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-lg text-[10px]">{count}</span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="max-h-[75vh] overflow-y-auto pr-2 flex flex-col gap-4 custom-scrollbar">
                      {colData.tasks.map((task, index) => {
                        const isLastItem = index === colData.tasks.length - 1;
                        return (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided) => (
                              <div
                                ref={(el) => {
                                  provided.innerRef(el);
                                  if (isLastItem) lastTaskElementRef(el, col.id);
                                }}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`${getTaskBgColor(task)} p-4 rounded-3xl shadow-sm border hover:shadow-md transition-shadow group relative`}
                                style={{
                                  ...provided.draggableProps.style,
                                  borderLeft: task.highlightColor ? `4px solid ${task.highlightColor}` : undefined
                                }}
                              >
                                <TaskDetailsCard
                                  task={task}
                                  isAdmin={userRole === "master"}
                                  isTL={userRole === "tl"}
                                  onDelete={handleDeleteTask}
                                  onUpdateTask={handleFieldUpdate}
                                  onFloatRequest={setFloatingTask}
                                />
                                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => setEditingTask(task)} className="text-[9px] font-black uppercase text-slate-400 hover:text-indigo-600">Edit</button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {colData.loading && (
                        <div className="flex justify-center p-4">
                          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {editingTask && (
        <EditTaskModal 
          taskId={editingTask.id} 
          isOpen={!!editingTask} 
          onClose={(updatedFields) => {
            if (updatedFields) handleFieldUpdate(editingTask.id, updatedFields);
            setEditingTask(null);
          }} 
        />
      )}

      {floatingTask && (
        <FloatingTaskCard
          task={floatingTask}
          onClose={() => setFloatingTask(null)}
          onUpdate={handleFieldUpdate}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}
