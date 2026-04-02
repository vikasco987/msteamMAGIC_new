// "use client";

// import { Copy } from "lucide-react";
// import { useState } from "react";

// interface CloneTaskButtonProps {
//   taskId: string;
//   onCloned?: (newTask: any) => void; // Optional callback to refresh task list
// }

// export default function CloneTaskButton({ taskId, onCloned }: CloneTaskButtonProps) {
//   const [loading, setLoading] = useState(false);

//   const handleClone = async () => {
//     if (!confirm("Duplicate this task?")) return;

//     setLoading(true);
//     try {
//       const res = await fetch(`/api/tasks/${taskId}/clone`, { method: "POST" });
//       const data = await res.json();

//       if (res.ok) {
//         alert("✅ Task duplicated!");
//         onCloned?.(data.task);
//       } else {
//         alert(`❌ ${data.error || "Failed to duplicate task"}`);
//       }
//     } catch (error) {
//       console.error("Clone error:", error);
//       alert("❌ Failed to duplicate task");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <button
//       onClick={handleClone}
//       disabled={loading}
//       title="Duplicate Task"
//       className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
//     >
//       <Copy className={`w-5 h-5 ${loading ? "opacity-50" : "text-gray-500 hover:text-gray-800"}`} />
//     </button>
//   );
// }























// "use client";

// import { Copy } from "lucide-react";
// import { useState } from "react";

// interface CloneTaskButtonProps {
//   taskId: string;
//   taskTitle?: string; // ✅ Allow passing original title
//   onCloned?: (newTask: any) => void; // Optional callback to refresh task list
// }

// export default function CloneTaskButton({ taskId, taskTitle = "", onCloned }: CloneTaskButtonProps) {
//   const [loading, setLoading] = useState(false);

//   const handleClone = async () => {
//     const newTitle = prompt(
//       "Enter a title for the cloned task:",
//       `${taskTitle || "Untitled Task"} (Copy)`
//     );

//     // ❌ Cancel cloning if user pressed Cancel
//     if (newTitle === null) return;

//     setLoading(true);
//     try {
//       const res = await fetch(`/api/tasks/${taskId}/clone`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ title: newTitle.trim() || `${taskTitle || "Untitled Task"} (Copy)` }),
//       });

//       const data = await res.json();

//       if (res.ok) {
//         alert("✅ Task duplicated!");
//         onCloned?.(data.task);
//       } else {
//         alert(`❌ ${data.error || "Failed to duplicate task"}`);
//       }
//     } catch (error) {
//       console.error("Clone error:", error);
//       alert("❌ Failed to duplicate task");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <button
//       onClick={handleClone}
//       disabled={loading}
//       title="Duplicate Task"
//       className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
//     >
//       <Copy
//         className={`w-5 h-5 ${loading ? "opacity-50" : "text-gray-500 hover:text-gray-800"}`}
//       />
//     </button>
//   );
// // }










"use client";

import { Copy } from "lucide-react";
import React, { useState } from "react";
import { toast } from "react-hot-toast";

interface CloneTaskButtonProps {
  taskId: string;
  taskTitle?: string;
  taskDetails?: any;
  onCloned?: (newTask: any) => void;
}

// Helper function to format camelCase keys into a readable string
const formatLabel = (key: string) => {
  const formatted = key.replace(/([A-Z])/g, " $1");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export default function CloneTaskButton({
  taskId,
  taskTitle = "",
  taskDetails = {},
  onCloned,
}: CloneTaskButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(`${taskTitle || "Untitled Task"} (Copy)`);

  const [selectedFields, setSelectedFields] = useState({
    description: true,
    dueDate: true,
    assignee: true,
    status: false,
    customFields: false,
  });

  const toggleField = (field: string) => {
    setSelectedFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleClone = async () => {
    setLoading(true);

    try {
      const cloneData: any = {
        title: newTitle.trim() || `${taskTitle || "Untitled Task"} (Copy)`,
      };

      if (selectedFields.description) cloneData.description = taskDetails.description;
      if (selectedFields.dueDate) cloneData.dueDate = taskDetails.dueDate;
      if (selectedFields.assignee) cloneData.assigneeId = taskDetails.assigneeId;
      if (selectedFields.status) cloneData.status = taskDetails.status;
      if (selectedFields.customFields) cloneData.customFields = taskDetails.customFields;

      // ✅ FIX: Explicitly remove notes to ensure the cloned task starts with none
      if (cloneData.notes) {
        delete cloneData.notes;
      }
      
      const res = await fetch(`/api/tasks/${taskId}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cloneData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("✅ Task duplicated!");
        onCloned?.(data.task);
      } else {
        toast.error(`❌ ${data.error || "Failed to duplicate task"}`);
      }
    } catch (error) {
      console.error("Clone error:", error);
      toast.error("❌ Failed to duplicate task");
    } finally {
      setLoading(false);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={loading}
        title="Duplicate Task"
        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Copy
          className={`w-5 h-5 ${loading ? "opacity-50" : "text-gray-500 hover:text-gray-800"}`}
        />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-[90%] max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Duplicate Task
            </h2>

            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              New Task Title:
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full p-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select fields to clone:
              </p>
              {Object.entries(selectedFields).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2 mb-1 text-gray-700 dark:text-gray-300 capitalize">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => toggleField(key)}
                  />
                  <span>{formatLabel(key)}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleClone}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? "Cloning..." : "Duplicate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}