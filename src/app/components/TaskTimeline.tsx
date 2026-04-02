"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Paintbrush } from "lucide-react";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { format, differenceInCalendarDays, addDays, isToday, parseISO, startOfMonth, endOfMonth } from "date-fns";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { uploadToCloudinary } from "@/app/components/TaskForm/utils";
import { useUser, useAuth } from "@clerk/nextjs";
import { FaRegCircle, FaCheckCircle, FaPlus, FaFileImage, FaFilePdf, FaImage, FaFileAlt, FaVideo, FaTrashAlt, FaRedoAlt, FaHistory, FaUserEdit, FaCrown } from "react-icons/fa";
import ReassignTaskModal from "./ReassignTaskModal";
import TaskActivityFeed from "./TaskActivityFeed";
import PaymentHistory from "./PaymentHistory";
import PaymentSection from "../components/PaymentSection";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Note {
  id: string;
  content: string;
  authorName?: string;
  authorEmail?: string;
  createdAt?: string;
}

interface PaymentEntry {
  amount: number;
  received: number;
  updatedAt: string;
  updatedBy: string;
  fileUrl?: string | null;
}

interface Task {
  id: string;
  name: string;
  shop: string;
  customer: string;
  start: string;
  end: string;
  progress: number;
  assigneeId?: string;
  assigneeIds?: string[];
  assigneeName?: string;
  assigneeEmail?: string;
  subtasks?: Subtask[];
  notes?: Note[];
  attachments?: string[];
  amount?: number;
  received?: number;
  paymentHistory?: PaymentEntry[];
}

interface AssigneeDetails {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
}

// Dynamic dates for the timeline (Current Month)
const now = new Date();
const startDate = startOfMonth(now);
const endDate = endOfMonth(now);
const totalDays = differenceInCalendarDays(endDate, startDate) + 1;

const isImageUrl = (url: string) => {
  return /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(url);
};

interface AttachmentItemProps {
  url: string;
  index: number;
  onReupload: (oldUrl: string, file: File) => Promise<void>;
  onDelete: (url: string) => void;
}

const AttachmentItem: React.FC<AttachmentItemProps> = ({ url, index, onReupload, onDelete }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className="relative group border border-gray-200 rounded-lg overflow-hidden"
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-24 flex items-center justify-center bg-gray-100"
      >
        {isImageUrl(url) ? (
          <img
            src={url}
            alt={`Attachment ${index + 1}`}
            className="w-full h-full object-cover transition"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-500 text-center p-2">
            <FaFilePdf className="text-4xl text-red-500" />
            <span className="text-xs mt-1 truncate w-full px-1">{url.substring(url.lastIndexOf('/') + 1)}</span>
          </div>
        )}
      </a>

      {showActions && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 text-white text-xs z-10">
          <label className="cursor-pointer flex items-center gap-1 hover:text-blue-300 transition-colors">
            <FaRedoAlt /> Reupload
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  await onReupload(url, file);
                  e.target.value = '';
                }
              }}
            />
          </label>

          <button
            onClick={() => onDelete(url)}
            className="flex items-center gap-1 hover:text-red-500 transition-colors"
          >
            <FaTrashAlt /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

const fetchAssigneeDetails = async (ids: string[]): Promise<AssigneeDetails[]> => {
  if (ids.length === 0) return [];
  try {
    const res = await fetch('/api/assignees', {
      method: 'POST',
      body: JSON.stringify({ ids }),
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const errorData = await res.json();
      console.error("Failed to fetch assignee details:", errorData.error);
      return ids.map(id => ({ id, name: "Unknown", email: "", imageUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${id}` }));
    }
    const data = await res.json();
    return data.assignees;
  } catch (error) {
    console.error("Error fetching assignee details:", error);
    return ids.map(id => ({ id, name: "Unknown", email: "", imageUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${id}` }));
  }
};

export default function TaskTimeline() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [zoom, setZoom] = useState(40);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newNote, setNewNote] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [paymentUploadStatus, setPaymentUploadStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [attachmentToDeleteUrl, setAttachmentToDeleteUrl] = useState<string | null>(null);
  const [assigneeMap, setAssigneeMap] = useState<Record<string, { name: string; imageUrl: string; email: string }>>({});
  const [currentAmountInput, setCurrentAmountInput] = useState("");
  const [currentReceivedInput, setCurrentReceivedInput] = useState("");
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [mentionSearch, setMentionSearch] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const [showDocs, setShowDocs] = useState(false);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const res = await fetch("/api/assignees");
        if (res.ok) {
          const data = await res.json();
          setAllUsers(data.assignees || []);
        }
      } catch (err) {
        console.error("Failed to fetch users for mentions:", err);
      }
    };
    fetchAllUsers();
  }, []);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setNewNote(value);
    setCursorPos(position);

    const textBeforeCursor = value.substring(0, position);
    const lastAt = textBeforeCursor.lastIndexOf("@");

    if (lastAt !== -1 && (lastAt === 0 || textBeforeCursor[lastAt - 1] === " ")) {
      const searchPart = textBeforeCursor.substring(lastAt + 1);
      if (!searchPart.includes(" ")) {
        setMentionSearch(searchPart);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (targetUser: any) => {
    const textBeforeAt = newNote.substring(0, newNote.lastIndexOf("@", cursorPos - 1));
    const textAfterMention = newNote.substring(cursorPos);
    const mentionText = `@[${targetUser.name}](${targetUser.id}) `;
    setNewNote(textBeforeAt + mentionText + textAfterMention);
    setShowMentions(false);
  };

  const formatMentions = (text: string) => {
    if (!text) return "";
    const parts = text.split(/(@\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, i) => {
      const match = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        return <span key={i} className="text-blue-600 font-bold">@{match[1]}</span>;
      }
      return part;
    });
  };

  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);

  const isAdmin = useMemo(() => {
    const role = (user?.publicMetadata?.role as string || "").toLowerCase();
    return role === "master";
  }, [user]);

  const handleReassignTask = async (taskId: string, assignee: { id: string, name: string, email: string }) => {
    setShowReassignModal(false);
    if (!selectedTask) return;
    
    // 🚀 Optimistic UI
    const originalTask = { ...selectedTask };
    const updatedTask = {
      ...selectedTask,
      assigneeId: assignee.id,
      assigneeIds: [assignee.id],
      assigneeName: assignee.name,
      assigneeEmail: assignee.email,
    };

    setSelectedTask(updatedTask);
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    toast.success("Assignment updated!");

    try {
      const token = await getToken();
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          assigneeId: assignee.id, 
          assigneeIds: [assignee.id] 
        }),
      });
      if (!res.ok) throw new Error("Reassign failed");
    } catch (err) {
      setSelectedTask(originalTask);
      setTasks(prev => prev.map(t => t.id === taskId ? originalTask : t));
      toast.error("Failed to sync assignment.");
    }
  };

  const handleTakeOwnership = () => {
    setShowOwnerModal(true);
  };

  const handleTransferOwnership = async (taskId: string, member: { id: string, name: string, email: string }) => {
    setShowOwnerModal(false); // 🚀 Instant closing
    if (!selectedTask) return;
    
    // 🚀 Optimistic Update
    const originalTask = { ...selectedTask };
    const updatedTask = {
      ...selectedTask,
      assignerId: member.id,
      assignerName: member.name,
      assignerEmail: member.email,
    };

    setSelectedTask(updatedTask);
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));

    try {
      const token = await getToken();
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          assignerId: member.id,
          assignerName: member.name,
          assignerEmail: member.email
        }),
      });
      if (!res.ok) throw new Error("Transfer failed");
      toast.success(`Ownership transferred to ${member.name}`);
    } catch (err) {
      setSelectedTask(originalTask);
      setTasks(prev => prev.map(t => t.id === taskId ? originalTask : t));
      toast.error("Failed to transfer ownership.");
    }
  };

  const updateSelectedTaskFromFetched = useCallback(async () => {
    if (!selectedTaskId) return;
    const token = await getToken();
    const updatedRes = await fetch(`/api/timeline?id=${selectedTaskId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (updatedRes.ok) {
      const updatedData = await updatedRes.json();
      const updatedTask = updatedData.tasks?.[0];
      if (updatedTask) setSelectedTask(updatedTask);
    }
  }, [selectedTaskId, getToken]);


  useEffect(() => {
    if (selectedTask) {
      setCurrentAmountInput(selectedTask.amount?.toString() || "");
      setCurrentReceivedInput(""); // Always empty for incremental "Add Payment"
    }
  }, [selectedTaskId]); // Only reset when switching tasks

  const fetchTasks = useCallback(async (page: number = currentPage, limit: number = tasksPerPage) => {
    const token = await getToken();
    const res = await fetch(`/api/timeline?page=${page}&limit=${limit}`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error(`Frontend: Failed to fetch tasks: ${res.status} - ${res.statusText}`);
      setTasks([]);
      setTotalPages(1);
      return;
    }

    const data = await res.json();
    if (Array.isArray(data.tasks)) {
      setTasks(data.tasks);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
    }
  }, [getToken, currentPage, tasksPerPage]);

  useEffect(() => {
    fetchTasks();

    // 🕒 Real-time Board Update (Polling)
    // Refreshes the board for everyone every 60 seconds
    const pollInterval = setInterval(() => {
      fetchTasks();
      if (isPanelOpen && selectedTaskId) {
        updateSelectedTaskFromFetched();
      }
    }, 60000);

    return () => clearInterval(pollInterval);
  }, [currentPage, tasksPerPage, fetchTasks, isPanelOpen, selectedTaskId, updateSelectedTaskFromFetched]);

  // Update selected task separately to avoid loops
  useEffect(() => {
    if (isPanelOpen && selectedTaskId && tasks.length > 0) {
      const updated = tasks.find((t: Task) => t.id === selectedTaskId);
      if (updated) {
        setSelectedTask(prev => ({ ...prev, ...updated }));
      }
    }
  }, [tasks, selectedTaskId, isPanelOpen]);

  useEffect(() => {
    const ids = Array.from(new Set(tasks.flatMap((task) => task.assigneeIds || [])));
    if (ids.length > 0) {
      fetchAssigneeDetails(ids).then((assignees) => {
        const map: Record<string, { name: string; imageUrl: string; email: string }> = Object.fromEntries(
          assignees.map((a) => [a.id, { name: a.name, imageUrl: a.imageUrl, email: a.email }])
        );
        setAssigneeMap(map);
      });
    }
  }, [tasks]);

  const allAssignees = useMemo(() => {
    return Array.from(new Set(tasks.flatMap((task) => task.assigneeIds || [])));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let currentTasks = [...tasks];
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      currentTasks = currentTasks.filter(task =>
        task.name.toLowerCase().includes(lowerSearchTerm) ||
        task.shop.toLowerCase().includes(lowerSearchTerm) ||
        task.customer.toLowerCase().includes(lowerSearchTerm)
      );
    }
    if (selectedAvatar) {
      currentTasks = currentTasks.filter(task =>
        (task.assigneeIds || []).includes(selectedAvatar)
      );
    }
    return currentTasks;
  }, [tasks, searchTerm, selectedAvatar]);

  const handleTaskClick = useCallback(async (task: Task) => {
    setSelectedTaskId(task.id);
    setSelectedTask(task);
    setIsPanelOpen(true);
    setShowPaymentHistory(false);

    try {
      const token = await getToken();
      const res = await fetch(`/api/timeline?id=${task.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error(`Frontend: Failed to fetch single task: ${res.status}`);
        return;
      }

      const data = await res.json();
      const fullTask = data.tasks?.[0];
      if (fullTask) {
        setSelectedTask(fullTask);
      }
    } catch (err) {
      console.error("Failed to fetch full task data:", err);
    }
  }, [getToken]);

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    // Optimistic update
    setSelectedTask(prev => {
      if (!prev || prev.id !== taskId) return prev;
      return {
        ...prev,
        subtasks: prev.subtasks?.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s)
      };
    });

    const token = await getToken();
    const res = await fetch(`/api/subtasks/${subtaskId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.error(`Failed to toggle subtask: ${res.status}`);
      // Revert optimistic update or re-fetch
      await updateSelectedTaskFromFetched();
    } else {
      await fetchTasks();
      await updateSelectedTaskFromFetched();
    }
  };

  const addSubtask = async () => {
    if (!selectedTask || newSubtask.trim() === "") return;
    const token = await getToken();
    const res = await fetch(`/api/tasks/${selectedTask.id}/subtasks`, {
      method: "POST",
      body: JSON.stringify({ title: newSubtask }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      console.error(`Failed to add subtask: ${res.status}`);
      return;
    }
    setNewSubtask("");
    await fetchTasks();
    await updateSelectedTaskFromFetched();
  };

  const addNote = async () => {
    if (!selectedTask || newNote.trim() === "") return;
    const token = await getToken();
    const res = await fetch(`/api/tasks/${selectedTask.id}/notes`, {
      method: "POST",
      body: JSON.stringify({
        content: newNote,
        authorName: user?.fullName || "Anonymous",
        authorEmail: user?.primaryEmailAddress?.emailAddress || user?.id || "unknown@example.com",
        createdAt: new Date().toISOString(),
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      console.error(`Failed to add note: ${res.status}`);
      return;
    }
    setNewNote("");
    await fetchTasks();
    await updateSelectedTaskFromFetched();
  };

  const handleReuploadAttachment = async (oldUrl: string, file: File) => {
    if (!selectedTask) return;
    setUploadStatus("Uploading new file...");
    try {
      const newUrl = await uploadToCloudinary(file, setUploadStatus);
      if (!newUrl) {
        setUploadStatus("❌ Cloudinary upload failed.");
        setTimeout(() => setUploadStatus(""), 3000);
        return;
      }

      const token = await getToken();
      const res = await fetch(`/api/tasks/${selectedTask.id}/attachments`, {
        method: "PATCH",
        body: JSON.stringify({ oldUrl, newUrl }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setUploadStatus(`❌ Reupload failed`);
      } else {
        setUploadStatus("✅ File replaced!");
        await fetchTasks();
        await updateSelectedTaskFromFetched();
      }
      setTimeout(() => setUploadStatus(""), 2000);
    } catch (err) {
      console.error("Error reuploading attachment:", err);
      setUploadStatus("❌ An error occurred");
      setTimeout(() => setUploadStatus(""), 3000);
    }
  };

  const handleNewAttachmentUpload = async (file: File) => {
    if (!selectedTask) return;
    setUploadStatus("Uploading new attachment...");
    try {
      const newUrl = await uploadToCloudinary(file, setUploadStatus);
      if (!newUrl) {
        setUploadStatus("❌ Cloudinary upload failed.");
        setTimeout(() => setUploadStatus(""), 3000);
        return;
      }

      const token = await getToken();
      const res = await fetch(`/api/tasks/${selectedTask.id}/attachments`, {
        method: "POST",
        body: JSON.stringify({ url: newUrl }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setUploadStatus(`❌ Upload failed`);
      } else {
        setUploadStatus("✅ New file uploaded!");
        await fetchTasks();
        await updateSelectedTaskFromFetched();
      }
      setTimeout(() => setUploadStatus(""), 3000);
    } catch (err) {
      console.error("Error uploading new attachment:", err);
      setUploadStatus("❌ An error occurred");
      setTimeout(() => setUploadStatus(""), 3000);
    }
  };

  const handleDeleteAttachment = useCallback((url: string) => {
    if (!selectedTask) return;
    setAttachmentToDeleteUrl(url);
    setShowConfirmDeleteModal(true);
  }, [selectedTask]);

  const confirmDeleteAttachment = async () => {
    if (!selectedTask || !attachmentToDeleteUrl) return;

    setShowConfirmDeleteModal(false);
    setUploadStatus("Deleting file...");

    try {
      const token = await getToken();
      const res = await fetch(`/api/tasks/${selectedTask.id}/attachments`, {
        method: "DELETE",
        body: JSON.stringify({ url: attachmentToDeleteUrl }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setUploadStatus(`❌ Delete failed`);
      } else {
        setUploadStatus("✅ File deleted!");
        await fetchTasks();
        await updateSelectedTaskFromFetched();
      }
    } catch (err) {
      console.error("Error deleting attachment:", err);
      setUploadStatus("❌ Error deleting attachment");
    } finally {
      setAttachmentToDeleteUrl(null);
      setTimeout(() => setUploadStatus(""), 3000);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const newReceive = Number(currentReceivedInput) || 0;
    const currentTotalReceived = selectedTask.received || 0;
    const totalAmount = Number(currentAmountInput) || 0;

    // 💰 Validation: Total Received <= Total Amount
    if (newReceive + currentTotalReceived > totalAmount) {
      toast.error(`Invalid Amount! Total received (₹${newReceive + currentTotalReceived}) cannot exceed total amount (₹${totalAmount})`);
      return;
    }

    const formData = new FormData();
    formData.append("amount", currentAmountInput);
    formData.append("received", currentReceivedInput);

    const fileInput = (e.target as HTMLFormElement).paymentFile as HTMLInputElement;
    const hasFile = fileInput?.files?.[0];
    if (hasFile) {
      formData.append("file", hasFile);
      setPaymentUploadStatus("Uploading file...");
    }

    const userName = user?.firstName || user?.primaryEmailAddress?.emailAddress || "Unknown User";
    formData.append("updatedBy", String(userName));
    formData.append("updatedAt", new Date().toISOString());

    // Skip "Syncing..." for normal updates to make it feel instant
    if (!hasFile) setPaymentUploadStatus("");

    // 🚀 FULL Optimistic Update (Immediate UI response)
    const originalSelectedTask = { ...selectedTask };
    const originalTasks = [...tasks];
    
    const amountVal = Number(currentAmountInput) || selectedTask.amount || 0;
    const addedReceived = Number(currentReceivedInput) || 0;
    const newTotalReceived = (selectedTask.received || 0) + addedReceived;

    const optimisticHistoryEntry: PaymentEntry = {
      amount: amountVal,
      received: newTotalReceived,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.firstName || "You",
      fileUrl: null 
    };

    const updatedTask = {
      ...selectedTask,
      amount: amountVal,
      received: newTotalReceived,
      paymentHistory: [optimisticHistoryEntry, ...(selectedTask.paymentHistory || [])]
    };

    // Update state immediately
    setSelectedTask(updatedTask);
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? updatedTask : t));
    
    // Clear inputs immediately for "Instant" feel
    setCurrentReceivedInput(""); 
    toast.success("Balance updated!");

    try {
      const token = await getToken();
      const res = await fetch(`/api/tasks/${selectedTask.id}/payments`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment update failed");

      // Replace with real data in background (silent sync)
      setSelectedTask(data.task);
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? data.task : t));
      setCurrentAmountInput(data.task.amount?.toString() || "");
      
      // ✅ SUCCESS is now silent for a cleaner feel (Toast handles it)
      setPaymentUploadStatus(""); // Clear it instantly
    } catch (err: any) {
      console.error("Payment failed:", err);
      setSelectedTask(originalSelectedTask);
      setTasks(originalTasks);
      setCurrentReceivedInput(addedReceived.toString()); 
      
      setPaymentUploadStatus(`❌ Error: ${err.message}`);
      toast.error(err.message || "Failed to sync payment.");
    } finally {
      // Small safety timeout for status
      if (paymentUploadStatus.startsWith("❌")) {
         setTimeout(() => setPaymentUploadStatus(""), 3000);
      }
    }
  };

  const handleTogglePaymentHistory = useCallback(async () => {
    if (!selectedTaskId) return;
    setShowPaymentHistory(prev => !prev);
    if (!showPaymentHistory) {
      await updateSelectedTaskFromFetched();
    }
  }, [selectedTaskId, showPaymentHistory, updateSelectedTaskFromFetched]);

  const handleTasksPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTasksPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className="space-y-4 p-4 bg-white rounded-xl shadow-md overflow-x-auto relative">
      {/* DOCUMENTATION MODAL */}
      <AnimatePresence>
        {showDocs && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-white border border-gray-200 rounded-[32px] p-8 shadow-2xl custom-scrollbar text-gray-800"
            >
              <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
                <div className="flex items-center gap-3 text-purple-600">
                  <FaFileAlt size={24} />
                  <h2 className="text-2xl font-black">Timeline & Payment Guide</h2>
                </div>
                <button 
                  onClick={() => setShowDocs(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                >
                  <FaPlus className="rotate-45" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Section 1 */}
                <section className="space-y-2">
                  <h3 className="text-purple-600 font-black flex items-center gap-2">
                    📊 1. Timeline Navigation
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    Yahan aapko sabhi projects ek calendar view mein dikhenge. 
                    <span className="text-purple-700 font-bold block mt-1">• Blue/Grey Bar:</span> Yeh project ka duration (Start to End date) batata hai.
                    <span className="text-purple-700 font-bold block">• Progress %:</span> Bar ke andar ka number project ki completion status dikhata hai.
                  </p>
                </section>

                {/* Section 2 */}
                <section className="space-y-2">
                  <h3 className="text-purple-600 font-black flex items-center gap-2">
                    💰 2. Payment Update Kaise Karein?
                  </h3>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Kisi bhi task par click karein, right side mein <span className="text-black font-bold">"Payments"</span> section milega.
                    </p>
                    <ul className="text-xs text-gray-500 space-y-2 list-disc ml-4">
                      <li><b>Total Amount:</b> Pure project ki final deal value.</li>
                      <li><b>Add Received:</b> Jitne paise customer ne abhi diye (yeh value history mein jud jayegi).</li>
                      <li><b>Proof Upload:</b> Aap payment ka screenshot ya invoice bhi upload kar sakte hain.</li>
                    </ul>
                  </div>
                </section>

                {/* Section 3 */}
                <section className="space-y-2">
                  <h3 className="text-purple-600 font-black flex items-center gap-2">
                    📝 3. Collaboration (Notes & Subtasks)
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Har task ke andar aap <span className="text-black font-bold">Subtasks</span> bana sakte hain taaki team member unhe tick kar sake. 
                    <span className="bg-purple-50 px-1 rounded">@Mention</span> feature use karke aap kisi bhi team member ko note mein tag kar sakte hain, unhe turant notification mil jayega.
                  </p>
                </section>

                {/* Section 4 */}
                <section className="space-y-2">
                  <h3 className="text-purple-600 font-black flex items-center gap-2">
                    📂 4. Attachments & Proofs
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Aap "Files" section mein design files, PDFs ya photographs upload kar sakte hain. 
                    Koi purani file replace karni ho toh <b>Reupload</b> button use karein.
                  </p>
                </section>
              </div>

              <div className="mt-12 flex justify-center">
                <button 
                  onClick={() => setShowDocs(false)}
                  className="px-10 py-4 rounded-full bg-purple-600 text-white font-black hover:bg-purple-700 transition-all shadow-xl shadow-purple-200"
                >
                  OK, Got it!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowDocs(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 text-xs font-black transition-all"
          >
            <FaHistory className="text-purple-500" />
            HOW TO USE?
          </button>
          <span className="text-sm font-medium text-gray-600">Assignees:</span>
          {allAssignees.map((id) => (
            <Image
              key={id}
              src={assigneeMap[id]?.imageUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${id}`}
              alt={assigneeMap[id]?.name || "Avatar"}
              width={32}
              height={32}
              unoptimized
              className={`w-8 h-8 rounded-full cursor-pointer border-2 ${selectedAvatar === id ? "border-blue-500" : "border-transparent"}`}
              onClick={() => setSelectedAvatar(prev => prev === id ? null : id)}
              title={assigneeMap[id]?.name || id}
            />
          ))}
        </div>
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm w-64"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Tasks/page:</label>
          <select
            value={tasksPerPage}
            onChange={handleTasksPerPageChange}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
          >
            {[5, 10, 15, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Zoom:</label>
          <input
            type="range" min={20} max={100}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-24"
          />
        </div>
      </div>

      <hr className="my-4" />

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-sm border-r border-b w-[50px]">#</th>
              <th className="p-2 text-sm border-r border-b w-[250px] text-left">Task</th>
              {Array.from({ length: totalDays }).map((_, i) => {
                const current = addDays(startDate, i);
                const isTodayColumn = isToday(current);
                return (
                  <th
                    key={i}
                    className={`text-[10px] p-1 text-center border-r border-b ${isTodayColumn ? "bg-yellow-100 font-bold" : "bg-gray-50"}`}
                    style={{ minWidth: `${zoom}px` }}
                  >
                    {format(current, "dd")}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr><td colSpan={totalDays + 2} className="text-center py-8 text-gray-500">No tasks found</td></tr>
            ) : (
              filteredTasks.map((task, index) => {
                const startOffset = Math.max(0, differenceInCalendarDays(new Date(task.start), startDate));
                const duration = differenceInCalendarDays(new Date(task.end), new Date(task.start)) + 1;

                return (
                  <tr key={task.id} className="h-12 border-b hover:bg-gray-50 transition-colors">
                    <td className="p-2 border-r text-center text-xs text-gray-500">
                      {(currentPage - 1) * tasksPerPage + index + 1}
                    </td>
                    <td
                      onClick={() => handleTaskClick(task)}
                      className="p-2 border-r cursor-pointer leading-tight min-w-[150px] max-w-[250px]"
                    >
                      <div className="font-semibold text-sm text-gray-800 truncate">📁 {task.name}</div>
                      <div className="text-[11px] text-gray-500 truncate font-medium">{task.shop}</div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {task.assigneeIds?.map((id) => (
                          <div key={id} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md text-[9px] font-bold border border-indigo-100 uppercase tracking-tight">
                            <Image 
                              src={assigneeMap[id]?.imageUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${id}`} 
                              alt="A" width={10} height={10} className="rounded-full" unoptimized 
                            />
                            {assigneeMap[id]?.name || "..."}
                          </div>
                        ))}
                      </div>
                    </td>
                    {Array.from({ length: totalDays }).map((_, i) => {
                      const isBar = i >= startOffset && i < startOffset + duration;
                      const bgColor = task.progress === 100 ? "bg-green-500" : task.progress > 0 ? "bg-blue-500" : "bg-gray-300";

                      return (
                        <td
                          key={i}
                          onClick={() => handleTaskClick(task)}
                          className={`border-r p-0 ${isBar ? "cursor-pointer" : ""}`}
                        >
                          {isBar && (
                            <div className={`h-8 mx-0.5 rounded-sm ${bgColor} relative flex items-center justify-center`}>
                              <div className="absolute left-0 h-full bg-white/20 rounded-sm" style={{ width: `${task.progress}%` }} />
                              <span className="text-[9px] text-white font-bold z-10">{task.progress}%</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >Prev</button>
          <div className="flex gap-1">
            {pageNumbers.map(n => (
              <button
                key={n} onClick={() => setCurrentPage(n)}
                className={`px-3 py-1 text-sm rounded ${currentPage === n ? "bg-blue-600 text-white" : "bg-white border"}`}
              >{n}</button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >Next</button>
        </div>
      )}

      <Dialog.Root open={isPanelOpen} onOpenChange={setIsPanelOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40 animate-fade-in" />
          <Dialog.Content className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-gray-100 z-50 shadow-2xl overflow-y-auto animate-slide-in-right">
            <Dialog.Title className="sr-only">Task Details</Dialog.Title>
            {selectedTask && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">{selectedTask.name}</h2>
                  <Dialog.Close className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <FaPlus className="rotate-45" />
                  </Dialog.Close>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm space-y-4">
                  <h3 className="font-semibold text-gray-800">Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Shop</p>
                      <p className="font-medium">{selectedTask.shop}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Customer</p>
                      <p className="font-medium">{selectedTask.customer}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Start</p>
                      <p className="font-medium">{selectedTask.start ? format(parseISO(selectedTask.start), "MMM dd, yyyy") : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">End</p>
                      <p className="font-medium">{selectedTask.end ? format(parseISO(selectedTask.end), "MMM dd, yyyy") : "N/A"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 uppercase mb-2">Progress ({selectedTask.progress}%)</p>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${selectedTask.progress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Assignees</h3>
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={() => setShowReassignModal(true)}
                         className="p-2 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors border border-purple-100"
                         title="Reassign Task"
                       >
                         <FaUserEdit size={14} />
                       </button>
                       {isAdmin && (
                         <button 
                           onClick={handleTakeOwnership}
                           className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors border border-amber-100"
                           title="Take Ownership (Become Assigner)"
                         >
                           <FaCrown size={14} />
                         </button>
                       )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.assigneeIds?.map(id => (
                      <Image
                        key={id}
                        src={assigneeMap[id]?.imageUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${id}`}
                        alt="Assignee" width={32} height={32} title={assigneeMap[id]?.name || id}
                        unoptimized
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      />
                    )) || <p className="text-sm text-gray-400">No assignees</p>}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm space-y-4">
                  <h3 className="font-semibold text-gray-800">Subtasks</h3>
                  <div className="space-y-2">
                    {selectedTask.subtasks?.map(s => (
                      <label key={s.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                        <input type="checkbox" checked={s.completed} onChange={() => toggleSubtask(selectedTask.id, s.id)} className="hidden" />
                        {s.completed ? <FaCheckCircle className="text-green-500" /> : <FaRegCircle className="text-gray-300" />}
                        <span className={`text-sm ${s.completed ? "line-through text-gray-400" : "text-gray-700"}`}>{s.title}</span>
                      </label>
                    ))}
                    <div className="flex gap-2 mt-4">
                      <input
                        type="text" value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                        placeholder="Add subtask..." className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      />
                      <button onClick={addSubtask} disabled={!newSubtask.trim()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">Add</button>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm space-y-4">
                  <h3 className="font-semibold text-gray-800">Notes</h3>
                  <div className="max-h-60 overflow-y-auto space-y-3">
                    {selectedTask.notes?.map((note, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm border-l-4 border-blue-400">
                        <p className="text-gray-700 whitespace-pre-wrap">{formatMentions(note.content)}</p>
                        <p className="text-[10px] text-gray-500 mt-2 font-medium">{note.authorName} • {note.createdAt ? format(parseISO(note.createdAt), "MMM dd, HH:mm") : ""}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 relative">
                    <AnimatePresence>
                      {showMentions && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full left-0 mb-2 w-64 bg-white border rounded-lg shadow-xl z-50 overflow-hidden"
                        >
                          <div className="p-2 bg-gray-50 border-b text-[10px] font-bold text-gray-500 uppercase">Suggesting Teammates</div>
                          <div className="max-h-48 overflow-y-auto">
                            {allUsers
                              .filter(u => u.name.toLowerCase().includes(mentionSearch.toLowerCase()))
                              .map(u => (
                                <button
                                  key={u.id}
                                  onClick={() => insertMention(u)}
                                  className="w-full text-left p-2 hover:bg-blue-50 flex items-center gap-3 transition-colors"
                                >
                                  <Image src={u.imageUrl} alt={u.name} width={24} height={24} className="rounded-full" unoptimized />
                                  <div>
                                    <div className="text-sm font-medium text-gray-800">{u.name}</div>
                                    <div className="text-[10px] text-gray-400">{u.email}</div>
                                  </div>
                                </button>
                              ))}
                            {allUsers.filter(u => u.name.toLowerCase().includes(mentionSearch.toLowerCase())).length === 0 && (
                              <div className="p-4 text-center text-xs text-gray-400">No users found</div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <textarea
                      value={newNote}
                      onChange={handleNoteChange}
                      placeholder="Add a note... use @ to mention teammates"
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <button onClick={addNote} disabled={!newNote.trim()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 w-full">Post Note</button>
                  </div>
                </div>

                <PaymentSection
                  selectedTask={selectedTask}
                  user={user}
                  amount={currentAmountInput}
                  setAmount={setCurrentAmountInput}
                  received={currentReceivedInput}
                  setReceived={setCurrentReceivedInput}
                  paymentUploadStatus={paymentUploadStatus}
                  setPaymentUploadStatus={setPaymentUploadStatus}
                  handlePaymentSubmit={handlePaymentSubmit}
                  showPaymentHistory={showPaymentHistory}
                  setShowPaymentHistory={setShowPaymentHistory}
                  handleTogglePaymentHistory={handleTogglePaymentHistory}
                />

                <TaskActivityFeed taskId={selectedTask.id} />
              </div>
            )}
            {showReassignModal && selectedTask && (
              <ReassignTaskModal 
                taskId={selectedTask.id}
                onClose={() => setShowReassignModal(false)}
                onReassign={handleReassignTask}
              />
            )}
            {showOwnerModal && selectedTask && (
              <ReassignTaskModal 
                taskId={selectedTask.id}
                title="Transfer Ownership"
                onClose={() => setShowOwnerModal(false)}
                onReassign={handleTransferOwnership}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={showConfirmDeleteModal} onOpenChange={setShowConfirmDeleteModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl z-[101] max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this attachment?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirmDeleteModal(false)} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
              <button onClick={confirmDeleteAttachment} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm">Delete</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}