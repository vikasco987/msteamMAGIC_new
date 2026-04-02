"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
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
  { label: "🍽️ Zomato Onboarding", value: "zomato onboarding" },
  { label: "🍔 Swiggy Onboarding", value: "swiggy onboarding" },
  { label: "🍽️🍔 Zomato + Swiggy Combo", value: "zomato + swiggy combo" },
  { label: "🧾 Food License", value: "food license" },
  { label: "📸 Photo Upload", value: "photo upload" },
  { label: "📂 Account Handling", value: "account handling" },
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
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [editingTask, setEditingTask] = useState<TaskType | null>(null);
  const [floatingTask, setFloatingTask] = useState<TaskType | null>(null);

  const [filterText, setFilterText] = useState("");
  const [sortBy, setSortBy] = useState<keyof TaskType>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedAssigners, setSelectedAssigners] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [userRole, setUserRole] = useState<string>("");
  const previousTaskCountRef = useRef<number>(0);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showAllTasksMode, setShowAllTasksMode] = useState(false);

  const hasFetchedInitially = useRef(false);
  const seenTaskIdsRef = useRef<Set<string>>(new Set());

  const handleToggleHideUnhide = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    handleFieldUpdate(taskId, { isHidden: !task.isHidden });
  };

  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});
  const lastUpdateRef = useRef<number>(0);

  const fetchTasks = useCallback(async (isInitial = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Skip auto-refresh if we just did an update (3s cooldown)
    if (!isInitial && Date.now() - lastUpdateRef.current < 3000) return;

    if (isInitial) setLoading(true);

    const role = (user.publicMetadata?.role as string || user.unsafeMetadata?.role as string || "").toLowerCase();
    const userId = user.id;
    setUserRole(role);

    try {
      const res = await fetch("/api/tasks?limit=200");
      if (!res.ok) throw new Error("Fetch failed");
      const json: { tasks: TaskType[] } = await res.json();
      const taskArray: TaskType[] = Array.isArray(json.tasks) ? json.tasks : [];

      if (!isInitial && taskArray.length === 0 && tasks.length > 5) {
         // 🛡️ Safeguard: If we had tasks but now got 0, it's likely a transient error or sync issue
         // Skip update to prevent "Invisible Tasks"
         console.warn("Fetch returned 0 tasks while state had data. Skipping wipe-out.");
         return;
      }

      const isAdminOrMaster = role === "admin" || role === "master";

      const relevantTasks = taskArray;

      const seenTaskIds = seenTaskIdsRef.current;
      const newTasks = relevantTasks.filter(task => !seenTaskIds.has(task.id));

      if (newTasks.length > 0 && !isInitial) {
        try {
          if (audioRef.current) {
            audioRef.current.volume = 1;
            await audioRef.current.play();
          }
          toast.success(`🎉 ${newTasks.length} new task(s)!`);
        } catch (err) {
          console.warn("Audio blocked", err);
        }
      }

      relevantTasks.forEach(task => seenTaskIds.add(task.id));
      
      // Update tasks while preserving pending changes
      setTasks(currentTasks => {
        // Build a map of incoming tasks for faster lookup
        const incomingTaskMap = new Map(relevantTasks.map(t => [t.id, t]));
        
        // Merge strategy: update existing, add new
        // For simplicity here, we'll replace with relevantTasks but respect pendingChanges
        return relevantTasks.map(incomingTask => {
          if (pendingChanges[incomingTask.id]) {
            return { ...incomingTask, status: pendingChanges[incomingTask.id] };
          }
          return incomingTask;
        });
      });
    } catch (err) {
      console.error("Fetch tasks error:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [user, showAllTasksMode, pendingChanges, tasks.length]); // Added tasks.length to dependency for the safeguard check

  useEffect(() => {
    if (!user?.id) return;
    if (!hasFetchedInitially.current) {
      fetchTasks(true);
      hasFetchedInitially.current = true;
    }

    let intervalId: NodeJS.Timeout;
    if (autoRefresh) {
      intervalId = setInterval(() => fetchTasks(false), 10000);
    }
    return () => clearInterval(intervalId);
  }, [user?.id, fetchTasks, autoRefresh]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    const newStatus = destination.droppableId;
    lastUpdateRef.current = Date.now();

    // 1. Update pending changes to prevent rubber-banding
    setPendingChanges(prev => ({ ...prev, [draggableId]: newStatus }));

    // 2. Optimistically update local state
    setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: newStatus } : t));

    try {
      const res = await fetch(`/api/tasks/${draggableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Update failed");
      }
      toast.success(`Task moved to ${newStatus}`);
    } catch (err: any) {
      console.error("onDragEnd Error:", err);
      toast.error(err.message || "Failed to update task. Reverting...");
      fetchTasks(false);
    } finally {
      // Small delay before clearing pending status to allow server state to propagate to GET requests
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
    
    // If updating status, track it as pending
    if (updatedFields.status) {
      setPendingChanges(prev => ({ ...prev, [taskId]: updatedFields.status! }));
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updatedFields } : t));
    
    // Provide instant feedback for reassignments
    if (updatedFields.assigneeId || updatedFields.assigneeIds) {
      toast.success("Assignment updated!");
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (!res.ok) {
         const errorData = await res.json();
         throw new Error(errorData.error || "Update failed");
      }
      if (!updatedFields.status && !updatedFields.assigneeId) {
        toast.success("Changes saved");
      }
    } catch (err: any) {
      console.error("Field update error:", err);
      toast.error(err.message || "Failed to sync changes. Reverting...");
      fetchTasks(false);
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
    // 🗑️ Optimistic UI Delete
    const originalTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast.success("Task deleted");

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Delete failed");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete from server. Reverting...");
      setTasks(originalTasks);
    }
  };

  const exportToExcel = () => {
    const headers = ["Title", "Status", "Shop Name", "Outlet Name", "Phone", "Customer Name", "Package", "Created At"];
    const rows = tasks.map(t => [
      stripEmojis(t.title),
      t.status,
      stripEmojis(t.customFields?.shopName as string),
      stripEmojis(t.customFields?.outletName as string),
      t.customFields?.phone,
      stripEmojis(t.customFields?.customerName as string),
      t.customFields?.packageAmount,
      t.createdAt ? new Date(t.createdAt).toLocaleString() : ""
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tasks_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(filterText.toLowerCase()) ||
        task.customFields?.shopName?.toString().toLowerCase().includes(filterText.toLowerCase());

      const matchesCategory = selectedCategories.length === 0 ||
        selectedCategories.includes(task.tags?.[0]?.toLowerCase() || "other");

      const matchesDate = selectedDates.length === 0 || (() => {
        const d = new Date(task.createdAt);
        if (selectedDates.includes("Today") && isToday(d)) return true;
        if (selectedDates.includes("Last 7 Days") && d >= subDays(new Date(), 7)) return true;
        if (selectedDates.includes("This Month") && d >= startOfMonth(new Date())) return true;
        return false;
      })();

      const matchesStatus = selectedStatuses.length === 0 ||
        selectedStatuses.includes((task.status || "").toLowerCase()) ||
        !!pendingChanges[task.id]; // Always show if we just moved it locally

      const matchesAssigner = selectedAssigners.length === 0 ||
        (task as any).assignerName && selectedAssigners.includes((task as any).assignerName);

      const isHidden = !showAllTasksMode && task.isHidden;

      return matchesSearch && matchesCategory && matchesDate && matchesStatus && matchesAssigner && !isHidden;
    }).sort((a, b) => {
      const valA = a[sortBy] || "";
      const valB = b[sortBy] || "";
      const dir = sortDirection === "asc" ? 1 : -1;
      return valA < valB ? -1 * dir : valA > valB ? 1 * dir : 0;
    });
  }, [tasks, filterText, selectedCategories, selectedDates, selectedAssigners, sortBy, sortDirection, showAllTasksMode, pendingChanges]);

  const allStatuses = useMemo(() => Array.from(new Set(tasks.map(t => t.status))), [tasks]);
  const allAssignees = useMemo(() => {
    const assignees = new Set<string>();
    tasks.forEach(t => {
      if (t.assigneeName) assignees.add(t.assigneeName);
      t.assignees?.forEach(a => { if (a.name) assignees.add(a.name); });
    });
    return Array.from(assignees);
  }, [tasks]);

  const allAssigners = useMemo(() => {
    const assigners = new Set<string>();
    tasks.forEach(t => {
      if ((t as any).assignerName) assigners.add((t as any).assignerName);
    });
    return Array.from(assigners);
  }, [tasks]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 bg-slate-50 min-h-screen">
      <audio ref={audioRef} src="/notification.wav" preload="auto" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Team Board</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            {filteredTasks.length} Active Tasks
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAllTasksMode(!showAllTasksMode)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${showAllTasksMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-600'
              }`}
          >
            {showAllTasksMode ? "Hide Archived" : "Show All"}
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold uppercase tracking-wider border border-emerald-100 hover:bg-emerald-100 transition-colors"
          >
            <FaFileExcel /> Export
          </button>
        </div>
      </div>

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
      />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {columns.map(col => (
            <div key={col.id} className="flex flex-col gap-4">
              <div className={`flex items-center justify-between p-4 rounded-2xl border-l-4 ${col.color} bg-white shadow-sm font-black text-slate-700 uppercase tracking-widest text-xs`}>
                <span>{col.title}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-lg text-[10px]">{filteredTasks.filter(t => (t.status || "").toLowerCase() === col.id.toLowerCase()).length}</span>
              </div>

              <Droppable droppableId={col.id}>
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="max-h-[75vh] overflow-y-auto pr-2 flex flex-col gap-4 custom-scrollbar">
                    {filteredTasks.filter(t => (t.status || "").toLowerCase() === col.id.toLowerCase()).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
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
                              onDelete={handleDeleteTask}
                              onUpdateTask={handleFieldUpdate}
                              onFloatRequest={setFloatingTask}
                            />

                            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleToggleHideUnhide(task.id)} className="text-[9px] font-black uppercase text-slate-400 hover:text-indigo-600">
                                {task.isHidden ? "Show" : "Hide"}
                              </button>
                              <button onClick={() => setEditingTask(task)} className="text-[9px] font-black uppercase text-slate-400 hover:text-indigo-600">Edit</button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={() => fetchTasks(false)}
          onDelete={handleDeleteTask}
        />
      )}

      {floatingTask && (
        <FloatingTaskCard
          task={floatingTask}
          isAdmin={userRole === "master" || userRole === "admin"}
          onDelete={handleDeleteTask}
          onUpdateTask={handleFieldUpdate}
          onClose={() => setFloatingTask(null)}
        />
      )}
    </div>
  );
}
