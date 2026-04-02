import { useState } from "react";
import toast from "react-hot-toast";
import { Task } from "../../../types/task";

export const useTaskEditing = (tasks: Task[], onTasksUpdate?: (t: Task[]) => void, refetchTasks?: () => void) => {
  const [editMode, setEditMode] = useState(false);
  const [editedValues, setEditedValues] = useState<{ [key: string]: number }>({});
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const handleInputChange = (taskId: string, field: string, value: number) => {
    setEditedValues((prev) => ({ ...prev, [`${taskId}-${field}`]: value }));
  };

  const handleBlur = async (taskId: string, field: string) => {
    const key = `${taskId}-${field}`;
    const value = editedValues[key];
    setIsSaving(key);
    try {
      await fetch("/api/tasks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, field, value }),
      });
      toast.success("Updated!");
      refetchTasks?.();
    } catch {
      toast.error("Update failed");
    } finally {
      setIsSaving(null);
    }
  };

  return {
    editMode, setEditMode,
    editedValues, handleInputChange, handleBlur, isSaving,
    exportCSV: () => toast.success("Exported! (Add XLSX logic here)")
  };
};
