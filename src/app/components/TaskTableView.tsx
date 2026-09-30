"use client";
import { useUnifiedAuth as useUser } from "@/lib/useUnifiedAuth";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Task } from "../../types/task";
import { Note } from "../../../types/note";
import HighlightColorDropdown from "../components/HighlightColorDropdown";
import TaskDetailsPanel from "./TaskDetailsPanel";

import { TaskFilters } from "./TaskFilters";


import { format } from "date-fns";
import * as Dialog from "@radix-ui/react-dialog";
import {
  FaMapMarkerAlt,
  FaSpinner,
  FaRupeeSign,
  FaCheckCircle,
  FaReceipt,
  FaTimes,
  FaWhatsapp,
  FaEllipsisV,
} from "react-icons/fa";
import toast from "react-hot-toast";
import NotesModal from "../components/NotesModal";
// ✅ Correct import path for the Copy icon component
import CopyTaskDetailsIcon from "../components/CopyTaskDetailsIcon";

import Image from "next/image";

// Define AttachmentType within this file or import if it's in a shared types file
type AttachmentType = {
  url: string;
  name?: string;
};

// PaymentProofsModal.tsx (This component is embedded directly within TaskTableView)
function PaymentProofsModal({
  urls,
  onClose,
  taskId,
  role,
  onDeleteSuccess,
}: {
  urls: string[];
  onClose: () => void;
  taskId: string;
  role: string;
  onDeleteSuccess: (url: string) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-white max-w-3xl w-full p-4 rounded shadow-lg relative">
        <button
          onClick={() => {
            if (previewUrl) {
              setPreviewUrl(null);
            } else {
              onClose();
            }
          }}
          className="absolute top-3 right-3 text-gray-600 hover:text-red-500"
          title={previewUrl ? "Back to list" : "Close modal"}
        >
          <FaTimes size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4">Payment Proofs</h2>

        {previewUrl ? (
          <div className="overflow-auto max-h-[80vh]">
            {previewUrl.toLowerCase().endsWith(".pdf") ? (
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(
                  previewUrl
                )}&embedded=true`}
                className="w-full h-[70vh] border rounded"
                title="PDF Preview"
              />
            ) : (
              <Image
                src={previewUrl}
                alt="Proof Preview"
                width={800}
                height={600}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
                unoptimized
              />
            )}
          </div>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto px-2">
            {urls
              .filter((url) => typeof url === "string")
              .map((url, i) => {
                const label = url.toLowerCase().endsWith(".pdf")
                  ? "📄 PDF Proof"
                  : "🖼️ Image Proof";
                return (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded shadow-sm"
                  >
                    <span className="text-sm text-gray-700">{label}</span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setPreviewUrl(url)}
                        className="text-purple-700 underline hover:text-purple-900 text-sm"
                      >
                        👁️ Preview
                      </button>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 underline hover:text-green-800 text-sm"
                      >
                        ⬇️ Download
                      </a>
                      {role === "master" && (
                        <button
                          onClick={async () => {
                            if (!confirm("Are you sure you want to delete this payment proof?")) return;
                            try {
                              const res = await fetch(`/api/tasks/${taskId}/payments`, {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ url }),
                              });
                              if (res.ok) {
                                toast.success("Proof deleted successfully");
                                onDeleteSuccess(url);
                              } else {
                                const data = await res.json();
                                toast.error(data.error || "Failed to delete proof");
                              }
                            } catch (err) {
                              toast.error("An error occurred while deleting proof");
                            }
                          }}
                          className="text-red-600 underline hover:text-red-800 text-sm"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  tasks: Task[];
  user: any; // UserResource from Clerk
  onTasksUpdate?: (updatedTasks: Task[]) => void;
  // Pagination & Filter Props
  currentPage: number;
  onPageChange: (page: number) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  totalItems: number;
  totalPages: number;
  query: string;
  onQueryChange: (query: string) => void;
  status: string | null;
  onStatusChange: (status: string | null) => void;
  dateFilter: string | null;
  onDateFilterChange: (dateFilter: string | null) => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  selectedAssignees: string[];
  onAssigneesChange: (assignees: string[]) => void;
  selectedAssigners: string[];
  onAssignersChange: (assigners: string[]) => void;
  salesFilter: "all" | "withSales" | "noSales";
  onSalesFilterChange: (filter: "all" | "withSales" | "noSales") => void;
  pendingSalesFilter: "all" | "withPendingSales" | "fullyPaidSales" | "zeroAmountAndPaid";
  onPendingSalesFilterChange: (filter: "all" | "withPendingSales" | "fullyPaidSales" | "zeroAmountAndPaid") => void;
  availableUsers?: {id: string, name: string, email: string}[];
  availableStatuses?: string[];
}

export default function TaskTableView({
  tasks,
  user,
  onTasksUpdate,
  currentPage,
  onPageChange,
  limit,
  onLimitChange,
  totalItems,
  totalPages,
  query,
  onQueryChange,
  status,
  onStatusChange,
  dateFilter,
  onDateFilterChange,
  selectedCategories,
  onCategoriesChange,
  selectedAssignees,
  onAssigneesChange,
  selectedAssigners,
  onAssignersChange,
  salesFilter,
  onSalesFilterChange,
  pendingSalesFilter,
  onPendingSalesFilterChange,
  availableUsers,
  availableStatuses
}: Props) {
  const [editMode, setEditMode] = useState(false);
  const [editedValues, setEditedValues] = useState<{ [key: string]: number }>(
    {}
  );
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks || []);

  // Use a separate state for filtered tasks to avoid re-filtering on every render
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks || []);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; email: string }[]>(availableUsers || []);

  useEffect(() => {
    if (availableUsers && availableUsers.length > 0) {
      setTeamMembers(availableUsers);
    }
  }, [availableUsers]);

  // ✅ The `copy` column is now initialized as a visible column
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "rowNumber",
    "highlightColor",
    "title",
    "createdAt",
    "assignerName",
    "shopName",
    "location",
    "phone",
    "email",
    "status",
    "notes",
    "amount",
    "amountReceived",
    "pendingAmount",
    "copy",
    "attachments",
    "paymentProofs",
    "tracking",
    "trackingStatus",
    "actions",
  ]);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedTaskIdForNotes, setSelectedTaskIdForNotes] = useState<
    string | null
  >(null);
  const [notesMap, setNotesMap] = useState<{ [taskId: string]: Note[] }>({});

  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<
    AttachmentType[]
  >([]);

  const [showPaymentProofsModal, setShowPaymentProofsModal] = useState(false);
  const [selectedPaymentProofs, setSelectedPaymentProofs] = useState<string[]>(
    []
  );
  const [selectedTaskIdForProofs, setSelectedTaskIdForProofs] = useState<string | null>(null);

  const [viewedTaskId, setViewedTaskId] = useState<string | null>(null);
  const [activeDropdownRow, setActiveDropdownRow] = useState<string | null>(null);

  // Pagination states are now from props

  const { user: clerkUser } = useUser();
  const currentUserId = clerkUser?.id;

  const role = (user.publicMetadata?.role as string) || "";

  useEffect(() => {
    setLocalTasks(tasks || []);
    setFilteredTasks(tasks || []); // Also update filteredTasks when tasks prop changes

    // Initialize notes map
    const initialNotes = (tasks || []).reduce(
      (acc, task) => {
        if (Array.isArray(task.notes)) {
          acc[task.id] = task.notes;
        } else {
          acc[task.id] = [];
        }
        return acc;
      },
      {} as { [taskId: string]: Note[] }
    );
    setNotesMap(initialNotes);
  }, [tasks]);

  const refetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to refetch tasks");
      }
      const data = await res.json();
      if (Array.isArray(data.tasks)) {
        setLocalTasks(data.tasks);
        onTasksUpdate?.(data.tasks);
      } else {
        console.warn("RefetchTasks: API returned non-array for tasks:", data);
        toast.error("Refetching tasks failed: Invalid data format.");
      }
    } catch (err: any) {
      console.error("❌ Error during refetch:", err);
      toast.error(`Refetch error: ${err.message || "An unknown error occurred."}`);
    }
  };

  // This memoization is now less critical as filteredTasks is managed by state
  const paginatedTasks = useMemo(() => {
    return filteredTasks;
  }, [filteredTasks]);

  const handleTasksPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    onLimitChange(Number(e.target.value));
    onPageChange(1);
  };

  const handlePageChange = (pageNumber: number) => {
    onPageChange(pageNumber);
  };

  const exportCSV = async () => {
    try {
      const exportData = filteredTasks.map((task, index) => {
        const row: Record<string, any> = {};
        
        if (visibleColumns.includes("rowNumber")) row["S. No."] = index + 1;
        if (visibleColumns.includes("title")) row["Title"] = task.title;
        if (visibleColumns.includes("status")) row["Status"] = task.status;
        if (visibleColumns.includes("shopName")) row["Shop Name"] = task.customFields?.shopName || "";
        if (visibleColumns.includes("email")) row["Email"] = task.customFields?.email || "";
        if (visibleColumns.includes("phone")) row["Phone"] = task.customFields?.phone || "";
        if (visibleColumns.includes("assignerName")) row["Assigner Name"] = task.assignerName || "";
        if (visibleColumns.includes("assignee")) row["Assignee"] = task.assignees?.map((a: any) => a?.name || a?.email).filter(Boolean).join(", ") || task.assignee?.name || "";
        if (visibleColumns.includes("createdAt")) row["Created At"] = task.createdAt ? format(new Date(task.createdAt), "dd MMM yyyy, HH:mm") : "";
        if (visibleColumns.includes("location")) row["Location"] = task.customFields?.location || "";
        if (visibleColumns.includes("notes")) row["Notes"] = (notesMap[task.id] || []).map((note) => note.content).join(" | ");
        if (visibleColumns.includes("amount")) row["Amount"] = Number(task.amount) || 0;
        if (visibleColumns.includes("amountReceived")) row["Amount Received"] = Number(task.received) || 0;
        if (visibleColumns.includes("pendingAmount")) row["Pending Amount"] = (Number(task.amount) || 0) - (Number(task.received) || 0);
        if (visibleColumns.includes("attachments")) row["Attachments"] = task.attachments?.map((a: any) => typeof a === 'string' ? a : a.url).join(" | ") || "";
        if (visibleColumns.includes("paymentProofs")) row["Payment Proofs"] = task.paymentProofs?.map((p: any) => typeof p === 'string' ? p : p.url).filter(Boolean).join(" | ") || "";
        
        return row;
      });

      const xlsx = await import("xlsx");
      const ws = xlsx.utils.json_to_sheet(exportData);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Tasks");
      xlsx.writeFile(wb, `Tasks_Report_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`);
      toast.success("Excel exported successfully!");
    } catch (err) {
      console.error("Failed to export Excel", err);
      toast.error("Failed to export Excel. Please try again.");
    }
  };

  const handleFilteredTasksChange = useCallback((newFilteredTasks: Task[]) => {
    setFilteredTasks(newFilteredTasks);
  }, []);

  const handleColumnVisibilityChange = useCallback((newColumns: string[]) => {
    setVisibleColumns(newColumns);
  }, []);

  const handleInputChange = (
    taskId: string,
    field: "amount" | "received" | "afe",
    value: number
  ) => {
    const key = `${taskId}-${field}`;
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const [editedAwbValues, setEditedAwbValues] = useState<{ [key: string]: string }>({});

  const handleAwbInputChange = (taskId: string, value: string) => {
    setEditedAwbValues((prev) => ({ ...prev, [taskId]: value }));
  };

  const handleAwbBlur = async (taskId: string) => {
    const value = editedAwbValues[taskId];
    const originalTask = localTasks.find((t) => t.id === taskId);
    const originalValue = originalTask?.customFields?.awbNumber || "";

    if (value !== undefined && value.trim() !== originalValue) {
      setIsSaving(`${taskId}-awbNumber`);
      try {
        const res = await fetch("/api/tasks/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId, field: "awbNumber", value: value.trim() }),
        });

        if (!res.ok) {
          const contentType = res.headers.get("content-type");
          const errorText = await res.text();
          let errorMessage = "Failed to update AWB number.";
          if (contentType && contentType.includes("application/json")) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error || errorMessage;
            } catch (jsonErr) {
              errorMessage = "Server returned malformed error.";
            }
          }
          toast.error(errorMessage);
        } else {
          toast.success("AWB number updated successfully!");
          await refetchTasks();
        }
      } catch (err) {
        console.error("Failed to update AWB:", err);
        toast.error("Network error");
      } finally {
        setIsSaving(null);
      }
    }

    setEditedAwbValues((prev) => {
      const newState = { ...prev };
      delete newState[taskId];
      return newState;
    });
  };

  const handleDeletePaymentProofSuccess = useCallback((deletedUrl: string) => {
    if (!selectedTaskIdForProofs) return;

    setLocalTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === selectedTaskIdForProofs
          ? {
            ...task,
            paymentProofs: (task.paymentProofs || []).filter(
              (proof: any) =>
                (typeof proof === "string" ? proof : proof.url) !== deletedUrl
            ),
          }
          : task
      )
    );

    setFilteredTasks((prevFilteredTasks) =>
      prevFilteredTasks.map((task) =>
        task.id === selectedTaskIdForProofs
          ? {
            ...task,
            paymentProofs: (task.paymentProofs || []).filter(
              (proof: any) =>
                (typeof proof === "string" ? proof : proof.url) !== deletedUrl
            ),
          }
          : task
      )
    );

    setSelectedPaymentProofs((prevProofs) =>
      prevProofs.filter((url) => url !== deletedUrl)
    );

    // If all proofs are deleted, close the modal
    if (selectedPaymentProofs.length <= 1) {
      setShowPaymentProofsModal(false);
      setSelectedTaskIdForProofs(null);
    }
  }, [selectedTaskIdForProofs, selectedPaymentProofs]);


  // const handleBlur = async (taskId: string, field: "amount" | "received") => {
  //   const key = `${taskId}-${field}`;
  //   const value = editedValues[key];

  //   const originalTask = localTasks.find((t) => t.id === taskId);
  //   const originalValue =
  //     field === "amount"
  //       ? Number(originalTask?.amount) || 0
  //       : Number(originalTask?.received) || 0;

  //   if (typeof value === "number" && !isNaN(value) && value !== originalValue) {
  //     setIsSaving(key);
  //     try {
  //       const res = await fetch("/api/tasks/update", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ taskId, field, value }),
  //       });

  //       if (!res.ok) {
  //         const contentType = res.headers.get("content-type");
  //         const errorText = await res.text();

  //         let errorMessage = "Failed to update task.";
  //         if (contentType && contentType.includes("application/json")) {
  //           try {
  //             const errorJson = JSON.parse(errorText);
  //             errorMessage = errorJson.error || errorMessage;
  //           } catch (jsonErr) {
  //             console.error("Failed to parse error JSON:", jsonErr, errorText);
  //             errorMessage = "Server returned malformed error. Contact support.";
  //           }
  //         } else {
  //           errorMessage = `Server error: ${res.status} ${res.statusText}. Please try again.`;
  //           console.error("Server returned non-JSON error:", errorText);
  //         }

  //         toast.error(errorMessage);
  //         setEditedValues((prev) => ({ ...prev, [key]: originalValue }));
  //       } else {
  //         toast.success("Task updated successfully!");
  //         await refetchTasks();
  //         setEditedValues((prev) => {
  //           const newState = { ...prev };
  //           delete newState[key];
  //           return newState;
  //         });
  //       }
  //     } catch (err: unknown) {
  //       console.error("❌ Network or unexpected error:", err);
  //       toast.error(
  //         err.message || "An unexpected error occurred while updating the task."
  //       );
  //       setEditedValues((prev) => ({ ...prev, [key]: originalValue }));
  //     } finally {
  //       setIsSaving(null);
  //     }
  //   } else {
  //     setEditedValues((prev) => {
  //       const newState = { ...prev };
  //       delete newState[key];
  //       return newState;
  //     });
  //   }
  // };






  const handleBlur = async (
    taskId: string,
    field: "amount" | "received" | "afe"
  ) => {
    // Only allow admin to update amount or received
    if ((field === "amount" || field === "received") && role !== "master") {
      toast.error("Only admins can edit this field.");
      // Remove edited value since it’s not allowed
      setEditedValues((prev) => {
        const newState = { ...prev };
        delete newState[`${taskId}-${field}`];
        return newState;
      });
      return;
    }

    const key = `${taskId}-${field}`;
    const value = editedValues[key];

    const originalTask = localTasks.find((t) => t.id === taskId);
    const originalValue =
      field === "amount"
        ? Number(originalTask?.amount) || 0
        : field === "received"
        ? Number(originalTask?.received) || 0
        : Number(originalTask?.customFields?.afe || originalTask?.customFields?.costPrice) || 0;

    if (typeof value === "number" && !isNaN(value) && value !== originalValue) {
      setIsSaving(key);
      try {
        const res = await fetch("/api/tasks/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId, field, value }),
        });

        if (!res.ok) {
          const contentType = res.headers.get("content-type");
          const errorText = await res.text();

          let errorMessage = "Failed to update task.";
          if (contentType && contentType.includes("application/json")) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error || errorMessage;
            } catch (jsonErr) {
              console.error("Failed to parse error JSON:", jsonErr, errorText);
              errorMessage = "Server returned malformed error. Contact support.";
            }
          } else {
            errorMessage = `Server error: ${res.status} ${res.statusText}. Please try again.`;
            console.error("Server returned non-JSON error:", errorText);
          }

          toast.error(errorMessage);
          setEditedValues((prev) => ({ ...prev, [key]: originalValue }));
        } else {
          toast.success("Task updated successfully!");
          // Optimistic update: Update local state immediately
          setLocalTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    ...(field === "afe"
                      ? {
                          customFields: {
                            ...(task.customFields as any || {}),
                            afe: value,
                            costPrice: String(value),
                          },
                        }
                      : { [field]: value }),
                  }
                : task
            )
          );
          setFilteredTasks((prevFilteredTasks) =>
            prevFilteredTasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    ...(field === "afe"
                      ? {
                          customFields: {
                            ...(task.customFields as any || {}),
                            afe: value,
                            costPrice: String(value),
                          },
                        }
                      : { [field]: value }),
                  }
                : task
            )
          );
          // No full refetch needed, but if onTasksUpdate is provided, call it with the updated localTasks
          onTasksUpdate?.(localTasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  ...(field === "afe"
                    ? {
                        customFields: {
                          ...(task.customFields as any || {}),
                          afe: value,
                          costPrice: String(value),
                        },
                      }
                    : { [field]: value }),
                }
              : task
          ));

          setEditedValues((prev) => {
            const newState = { ...prev };
            delete newState[key];
            return newState;
          });
        }
      } catch (err: any) {
        console.error("❌ Network or unexpected error:", err);
        toast.error(
          err.message || "An unexpected error occurred while updating the task."
        );
        setEditedValues((prev) => ({ ...prev, [key]: originalValue }));
      } finally {
        setIsSaving(null);
      }
    } else {
      setEditedValues((prev) => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }
  };

  const handleDirectUpdate = async (taskId: string, field: string, value: any, updates?: any) => {
    setIsSaving(`${taskId}-${field}`);
    try {
      const res = await fetch("/api/tasks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, field, value, updates }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to update field");
      } else {
        toast.success(updates ? "Multiple fields updated!" : `${field} updated!`);
        await refetchTasks();
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Network error");
    } finally {
      setIsSaving(null);
    }
  };






  const formatCurrency = (amount: number | string | undefined): string => {
    if (typeof amount === "string") {
      const num = parseFloat(amount);
      if (!isNaN(num)) return `₹${num.toLocaleString("en-IN")}`;
    } else if (typeof amount === "number") {
      return `₹${amount.toLocaleString("en-IN")}`;
    }
    return "—";
  };

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    if (startPage === 1 && endPage < totalPages) {
      endPage = Math.min(totalPages, maxPagesToShow);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 mt-6 overflow-hidden">
      <TaskFilters
        initialTasks={localTasks}
        notesMap={notesMap}
        onFilteredTasksChange={handleFilteredTasksChange}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        editMode={editMode}
        setEditMode={setEditMode}
        // Controlled Props
        query={query}
        onQueryChange={onQueryChange}
        status={status}
        onStatusChange={onStatusChange}
        dateFilter={dateFilter}
        onDateFilterChange={onDateFilterChange}
        selectedCategories={selectedCategories}
        onCategoriesChange={onCategoriesChange}
        selectedAssignees={selectedAssignees}
        onAssigneesChange={onAssigneesChange}
        selectedAssigners={selectedAssigners}
        onAssignersChange={onAssignersChange}
        salesFilter={salesFilter}
        onSalesFilterChange={onSalesFilterChange}
        pendingSalesFilter={pendingSalesFilter}
        onPendingSalesFilterChange={onPendingSalesFilterChange}
        availableUsers={availableUsers}
        availableStatuses={availableStatuses}
        onExport={exportCSV}
      />

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed border-collapse border border-gray-200 text-sm shadow-md rounded-md overflow-hidden">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0 z-10">
            <tr>
              {visibleColumns.includes("rowNumber") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-12">
                  S. No.
                </th>
              )}
              {visibleColumns.includes("highlightColor") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-24">
                  Highlight
                </th>
              )}
              {visibleColumns.includes("title") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
                  Title
                </th>
              )}
              {visibleColumns.includes("createdAt") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-36 cursor-pointer">
                  <div className="flex items-center">📅 Created</div>
                </th>
              )}
              {visibleColumns.includes("assignerName") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-48">
                  Assigned By → To
                </th>
              )}
              {visibleColumns.includes("shopName") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-40">
                  🏪 Shop Name
                </th>
              )}
              {visibleColumns.includes("location") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
                  📍 Location
                </th>
              )}
              {visibleColumns.includes("phone") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
                  📞 Phone
                </th>
              )}
              {visibleColumns.includes("email") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-40">
                  📧 Email
                </th>
              )}
              {visibleColumns.includes("status") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
                  Status
                </th>
              )}
              {visibleColumns.includes("notes") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-24">
                  📝 Notes
                </th>
              )}
              {visibleColumns.includes("amount") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer">
                  <div className="flex items-center justify-end">
                    <FaRupeeSign className="mr-1" /> Amount
                  </div>
                </th>
              )}
              {visibleColumns.includes("amountReceived") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer">
                  <div className="flex items-center justify-end">
                    <FaCheckCircle className="mr-1 text-emerald-600" /> Received
                  </div>
                </th>
              )}
              {visibleColumns.includes("pendingAmount") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-right w-28 cursor-pointer">
                  <div className="flex items-center justify-end">
                    <FaReceipt className="mr-1 text-rose-600" /> Pending
                  </div>
                </th>
              )}
              {/* ✅ This is the header for the copy column */}
              {visibleColumns.includes("copy") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-12">
                  📋 Copy
                </th>
              )}
              {visibleColumns.includes("attachments") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-left w-32">
                  📎 Attachments
                </th>
              )}
              {visibleColumns.includes("paymentProofs") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-32">
                  🧾 Payment Proofs
                </th>
              )}
              {visibleColumns.includes("tracking") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-24">
                  Tracking
                </th>
              )}
              {visibleColumns.includes("trackingStatus") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-32">
                  Shipment Status
                </th>
              )}
              {visibleColumns.includes("attemptsLeft") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-24">
                  Attempts
                </th>
              )}
              {visibleColumns.includes("actions") && (
                <th className="px-3 py-2 text-xs font-bold tracking-wide text-gray-700 border border-gray-200 text-center w-16">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="bg-white">
            {paginatedTasks.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="text-center px-4 py-8 text-gray-500 text-base"
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <svg
                      className="w-12 h-12 text-gray-400 mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
                    <p className="text-lg font-medium">You don't have any task 📭</p>
                    <p className="text-sm text-gray-500">
                      Adjust your filters or wait for a new task
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedTasks.map((task, index) => {
                const amount = Number(task.amount) || 0;
                const received = Number(task.received) || 0;
                const pending = amount - received;
                const rowNumber = (currentPage - 1) * limit + index + 1;
                const hasNotes = (notesMap[task.id]?.length || 0) > 0;
                const isPrinterTask = 
                  task.title?.toLowerCase().includes("printer") || 
                  task.title?.toLowerCase().includes("printer + software") || 
                  task.activeTab === "printer" || 
                  task.activeTab === "printer_software" ||
                  task.customFields?.activeTab === "printer" ||
                  task.customFields?.activeTab === "printer_software";
                const awbNumber = task.customFields?.awbNumber || task.customFields?.awb;
                const shipmentStatus = (task as any).dispatchLog?.trackingStatus || "—";

                return (
                  <tr
                    key={task.id}
                    style={{
                      backgroundColor: task.highlightColor || "transparent",
                    }}
                    className="h-12 hover:bg-blue-50 transition-all duration-150 ease-in-out"
                  >
                    {visibleColumns.includes("rowNumber") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center text-gray-700 font-medium">
                        {rowNumber}
                      </td>
                    )}
                    {visibleColumns.includes("highlightColor") && (
                      <td className="p-2 border border-gray-200">
                        <HighlightColorDropdown
                          taskId={task.id}
                          value={task.highlightColor}
                          onChange={async (newColor) => {
                            try {
                              await fetch(`/api/tasks/${task.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ highlightColor: newColor }),
                              });

                              setLocalTasks((prev) =>
                                prev.map((t) =>
                                  t.id === task.id
                                    ? { ...t, highlightColor: newColor }
                                    : t
                                )
                              );
                              handleFilteredTasksChange(
                                localTasks.map((t) =>
                                  t.id === task.id
                                    ? { ...t, highlightColor: newColor }
                                    : t
                                )
                              );
                            } catch (error) {
                              console.error(
                                "Error updating highlight color:",
                                error
                              );
                              toast.error("Failed to update highlight color.");
                            }
                          }}
                        />
                      </td>
                    )}
                    {visibleColumns.includes("title") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left font-medium text-gray-900">
                        {task.title}
                      </td>
                    )}
                    {visibleColumns.includes("createdAt") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-600">
                        {task.createdAt
                          ? format(new Date(task.createdAt), "dd MMM, HH:mm")
                          : "—"}
                      </td>
                    )}
                    {visibleColumns.includes("assignerName") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase text-gray-400">By</span>
                            {editMode && (role === "master" || role === "admin" || role === "tl") ? (
                                <select 
                                    className="text-xs font-bold text-gray-800 bg-white border border-gray-200 rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={teamMembers.find(m => m.name === task.assignerName)?.id || ""}
                                    onChange={(e) => {
                                        const member = teamMembers.find(m => m.id === e.target.value);
                                        if (member) {
                                            handleDirectUpdate(task.id, "assigner", null, {
                                                assignerName: member.name,
                                                assignerEmail: member.email
                                            });
                                        }
                                    }}
                                >
                                    <option value="">Select Assigner</option>
                                    {teamMembers.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className="text-xs font-bold text-gray-800 tracking-tight">
                                  {task.assignerName || "—"}
                                </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            {editMode && (role === "master" || role === "admin" || role === "tl") ? (
                                <div className="flex flex-col gap-1 w-full mt-1">
                                    <select 
                                        multiple
                                        className="text-[10px] font-bold text-indigo-900 bg-white border border-indigo-100 rounded-lg p-1 min-h-[80px] w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        value={task.assigneeIds || []}
                                        onChange={(e) => {
                                            const selectedIds = Array.from(e.target.selectedOptions).map(opt => opt.value);
                                            handleDirectUpdate(task.id, "assigneeIds", selectedIds);
                                        }}
                                    >
                                        {teamMembers.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Cmd+Click for Multiple</span>
                                </div>
                            ) : (
                                Array.isArray(task.assignees) && task.assignees.length > 0 ? (
                                  task.assignees.map((a, idx) => (
                                    <div key={idx} className="flex items-center gap-1 bg-indigo-50/50 pr-2 rounded-full border border-indigo-100/50 hover:bg-indigo-100 transition-colors">
                                      {a.imageUrl ? (
                                        <img src={a.imageUrl} className="w-5 h-5 rounded-full border border-white shadow-sm" alt={a.name || ""} />
                                      ) : (
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[8px] font-black uppercase border border-white">
                                          {(a.name || "U")[0]}
                                        </div>
                                      )}
                                      <span className="text-[10px] font-bold text-indigo-900">{a.name || a.email || "—"}</span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-blue-600 font-medium text-xs">
                                    {task.assigneeName || task.assigneeEmail || "—"}
                                  </span>
                                )
                            )}
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes("shopName") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-700">
                        {task.customFields?.shopName || "—"}
                      </td>
                    )}
                    {visibleColumns.includes("location") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
                        {task.customFields?.location ? (
                          <a
                            href={String(task.customFields?.location || "")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                          >
                            <FaMapMarkerAlt className="text-blue-500" /> View
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes("phone") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
                        {task.customFields?.phone || "—"}
                      </td>
                    )}
                    {visibleColumns.includes("email") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left text-gray-500">
                        {task.customFields?.email || "—"}
                      </td>
                    )}
                    {visibleColumns.includes("status") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${task.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : task.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {task.status}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes("notes") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
                        <button
                          onClick={() => {
                            setSelectedTaskIdForNotes(task.id);
                            setIsNoteModalOpen(true);
                          }}
                          className={`text-blue-600 hover:underline text-sm flex items-center gap-1 ${hasNotes ? "font-semibold" : "text-gray-500"
                            }`}
                        >
                          <span className="text-xs">📝</span>{" "}
                          {hasNotes
                            ? `View Notes (${notesMap[task.id].length})`
                            : "Add Note"}
                        </button>
                      </td>
                    )}
                    {visibleColumns.includes("amount") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right">
                        {editMode ? (
                          <div className="relative">
                            <input
                              type="number"
                              value={
                                editedValues[`${task.id}-amount`] !== undefined
                                  ? (isNaN(editedValues[`${task.id}-amount`]) ? "" : editedValues[`${task.id}-amount`])
                                  : (isNaN(amount) ? "" : amount)
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  task.id,
                                  "amount",
                                  parseFloat(e.target.value)
                                )
                              }
                              onBlur={(e) => handleBlur(task.id, "amount")}
                              className="w-full p-1 border border-gray-300 rounded-md text-right text-gray-900 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                            {isSaving === `${task.id}-amount` && (
                              <FaSpinner className="absolute right-2 top-1/2 transform -translate-y-1/2 animate-spin text-blue-500" />
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-800 font-medium">
                            {formatCurrency(amount)}
                          </span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes("amountReceived") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right">
                        {editMode ? (
                          <div className="relative">
                            <input
                              type="number"
                              value={
                                editedValues[`${task.id}-received`] !==
                                  undefined
                                  ? (isNaN(editedValues[`${task.id}-received`]) ? "" : editedValues[`${task.id}-received`])
                                  : (isNaN(received) ? "" : received)
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  task.id,
                                  "received",
                                  parseFloat(e.target.value)
                                )
                              }
                              onBlur={(e) => handleBlur(task.id, "received")}
                              className="w-full p-1 border border-gray-300 rounded-md text-right text-gray-900 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                            {isSaving === `${task.id}-received` && (
                              <FaSpinner className="absolute right-2 top-1/2 transform -translate-y-1/2 animate-spin text-blue-500" />
                            )}
                          </div>
                        ) : (
                          <span className="text-emerald-700 font-medium">
                            {formatCurrency(received)}
                          </span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes("pendingAmount") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-right">
                        <span className="text-rose-700 font-medium">
                          {formatCurrency(pending)}
                        </span>
                      </td>
                    )}
                    {/* ✅ This is the cell for the copy icon */}
                    {visibleColumns.includes("copy") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center">
                        <CopyTaskDetailsIcon
                          amount={amount}
                          received={received}
                          pending={pending}
                          updatedAt={task.updatedAt || new Date().toISOString()}
                        />
                      </td>
                    )}
                    {visibleColumns.includes("attachments") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-left">
                        {task.attachments && task.attachments.length > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedAttachments(
                                task.attachments?.map(
                                  (att: string | AttachmentType) =>
                                    typeof att === "string"
                                      ? { url: att }
                                      : att
                                ) || []
                              );
                              setAttachmentModalOpen(true);
                            }}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View {task.attachments.length} Attachment(s)
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes("paymentProofs") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center">
                        {task.paymentProofs && task.paymentProofs.length > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedPaymentProofs(
                                task.paymentProofs?.map(
                                  (proof: string | AttachmentType) =>
                                    typeof proof === "string"
                                      ? proof
                                      : proof.url
                                ) || []
                              );
                              setSelectedTaskIdForProofs(task.id);
                              setShowPaymentProofsModal(true);
                            }}
                            className="text-purple-600 hover:underline text-sm"
                          >
                            View {task.paymentProofs.length} Proof(s)
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes("tracking") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center">
                        {isPrinterTask ? (
                          editMode ? (
                            <div className="relative">
                              <input
                                type="text"
                                value={
                                  editedAwbValues[task.id] !== undefined
                                    ? editedAwbValues[task.id]
                                    : (task.customFields?.awbNumber || "")
                                }
                                onChange={(e) =>
                                  handleAwbInputChange(
                                    task.id,
                                    e.target.value
                                  )
                                }
                                onBlur={(e) => handleAwbBlur(task.id)}
                                className="w-full p-1 border border-gray-300 rounded-md text-center text-gray-900 focus:ring-blue-500 focus:border-blue-500 text-sm font-bold"
                                placeholder="Enter AWB"
                              />
                              {isSaving === `${task.id}-awbNumber` && (
                                <FaSpinner className="absolute right-1 top-1/2 transform -translate-y-1/2 animate-spin text-blue-500" />
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1 items-center">
                              {awbNumber ? (
                                <div className="flex items-center gap-1">
                                  <a 
                                    href={`/dispatch/track?awb=${awbNumber}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-0.5"
                                  >
                                    Track ({awbNumber}) ↗
                                  </a>
                                  {(() => {
                                    const shop = task.shopName || task.customFields?.shopName || "Customer";
                                    const phone = task.phone || task.customFields?.phone || "";
                                    if (!phone) return null;
                                    const cleanedPhone = phone.replace(/\D/g, "");
                                    const msg = encodeURIComponent(`Dear ${shop}, your Printer package has been shipped. Track your order live here: ${window.location.origin}/dispatch/track?awb=${awbNumber}`);
                                    return (
                                      <a
                                        href={`https://api.whatsapp.com/send?phone=91${cleanedPhone}&text=${msg}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-green-500 hover:text-green-600 text-sm ml-0.5 flex items-center justify-center"
                                        title="Share Tracking Link on WhatsApp"
                                      >
                                        <FaWhatsapp />
                                      </a>
                                    );
                                  })()}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">—</span>
                              )}
                              {Array.isArray(task.customFields?.previousDispatches) && 
                                task.customFields.previousDispatches.map((prev: any, idx: number) => {
                                  const shop = task.shopName || task.customFields?.shopName || "Customer";
                                  const phone = task.phone || task.customFields?.phone || "";
                                  const cleanedPhone = phone.replace(/\D/g, "");
                                  const msg = encodeURIComponent(`Dear ${shop}, your Printer package (Previous Shipment) RTO tracking link is: ${window.location.origin}/dispatch/track?awb=${prev.awbNumber}`);
                                  return (
                                    <div key={idx} className="flex items-center gap-1">
                                      <a
                                        href={`/dispatch/track?awb=${prev.awbNumber}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[10px] font-bold text-red-500 hover:text-red-750 underline"
                                        title={`Previous shipment status: ${prev.trackingStatus || "Unknown"}`}
                                      >
                                        RTO: {prev.awbNumber} ↗
                                      </a>
                                      {phone && (
                                        <a
                                          href={`https://api.whatsapp.com/send?phone=91${cleanedPhone}&text=${msg}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-green-400 hover:text-green-500 text-xs ml-0.5 flex items-center justify-center"
                                          title="Share Previous Tracking Link on WhatsApp"
                                        >
                                          <FaWhatsapp />
                                        </a>
                                      )}
                                    </div>
                                  );
                                })
                              }
                            </div>
                          )
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes("trackingStatus") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center font-semibold">
                        {isPrinterTask ? (
                          shipmentStatus !== "—" ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold
                              ${
                                shipmentStatus.toLowerCase() === "delivered" 
                                  ? "bg-green-100 text-green-700" 
                                  : shipmentStatus.toLowerCase() === "rto" 
                                  ? "bg-red-100 text-red-700" 
                                  : shipmentStatus.toLowerCase() === "pending"
                                  ? "bg-gray-100 text-gray-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}>
                              {shipmentStatus}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes("attemptsLeft") && (() => {
                      if (!isPrinterTask) {
                        return <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center text-gray-400">—</td>;
                      }

                      const attemptsMade = (task as any).dispatchLog?.attemptsMade ?? 0;
                      const statusLower = shipmentStatus?.toLowerCase() || "";
                      const maxAttempts = 3;
                      const remaining = Math.max(0, maxAttempts - attemptsMade);
                      
                      if (statusLower === "delivered" || statusLower === "rto" || statusLower === "—") {
                        return <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center text-gray-400">—</td>;
                      }

                      let bgColor = "bg-transparent";
                      let textColor = "text-gray-700 font-medium";
                      
                      if (remaining === 2) {
                        bgColor = "bg-orange-100";
                        textColor = "text-orange-800 font-bold animate-pulse";
                      } else if (remaining === 1 || remaining === 0) {
                        bgColor = "bg-red-100";
                        textColor = "text-red-800 font-bold animate-pulse";
                      }

                      return (
                        <td className={`border border-gray-200 px-3 py-2 whitespace-nowrap text-center transition-colors ${bgColor}`}>
                          <span className={textColor}>
                            {remaining} Left
                          </span>
                        </td>
                      );
                    })()}
                    {visibleColumns.includes("actions") && (
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setActiveDropdownRow(activeDropdownRow === task.id ? null : task.id)}
                            className="p-1 rounded-full hover:bg-gray-200 transition-colors focus:outline-none"
                            aria-label="Options"
                          >
                            <FaEllipsisV className="text-gray-600" />
                          </button>
                          {activeDropdownRow === task.id && (
                            <div className="origin-top-right absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    setViewedTaskId(task.id);
                                    setActiveDropdownRow(null);
                                  }}
                                  className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          Rows per page:
          <select
            value={limit}
            onChange={handleTasksPerPageChange}
            className="p-1 border border-gray-300 rounded-md"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={10000}>10000</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Previous
          </button>
          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded-md text-sm ${currentPage === page
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Last
          </button>
        </div>
      </div>

      {isNoteModalOpen && selectedTaskIdForNotes && (
        <NotesModal
          taskId={selectedTaskIdForNotes}
          initialNotes={notesMap[selectedTaskIdForNotes] || []}
          onClose={(updatedNotes) => {
            if (updatedNotes) {
              setNotesMap((prev) => ({
                ...prev,
                [selectedTaskIdForNotes]: updatedNotes,
              }));
            }
            setIsNoteModalOpen(false);
            setSelectedTaskIdForNotes(null);
          }}
        />
      )}

      {attachmentModalOpen && (
        <Dialog.Root
          open={attachmentModalOpen}
          onOpenChange={setAttachmentModalOpen}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full z-[100] max-h-[90vh] overflow-y-auto">
              <Dialog.Title className="text-xl font-bold mb-4">
                Attachments
              </Dialog.Title>
              <div className="space-y-4">
                {selectedAttachments.length > 0 ? (
                  selectedAttachments.map((attachment, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-100 p-3 rounded-md shadow-sm"
                    >
                      <span className="text-gray-700 text-sm font-medium">
                        {attachment.name || `Attachment ${idx + 1}`}
                      </span>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View/Download
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center">
                    No attachments available.
                  </p>
                )}
              </div>
              <Dialog.Close asChild>
                <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
                  <FaTimes size={20} />
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {showPaymentProofsModal && selectedTaskIdForProofs && (
        <PaymentProofsModal
          urls={selectedPaymentProofs}
          taskId={selectedTaskIdForProofs}
          role={role}
          onDeleteSuccess={handleDeletePaymentProofSuccess}
          onClose={() => {
            setShowPaymentProofsModal(false);
            setSelectedTaskIdForProofs(null);
          }}
        />
      )}

      {viewedTaskId && (
        <TaskDetailsPanel
          taskId={viewedTaskId}
          onClose={() => setViewedTaskId(null)}
        />
      )}
    </div>
  );
}