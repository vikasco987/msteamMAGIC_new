"use client";

import React, { useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import { FaTimes } from "react-icons/fa";
import TaskDetailsCard from "./TaskDetailsCard";
import TaskActivityFeed from "./TaskActivityFeed";
import { Task } from "../../types/task";

interface Props {
  task: Task;
  isAdmin?: boolean;
  onDelete?: (taskId: string) => void;
  onUpdateTask?: (taskId: string, updatedFields: Partial<Task>) => void;
  onClose: () => void;
}

export default function FloatingTaskCard({
  task: initialTask,
  isAdmin = false,
  onDelete,
  onUpdateTask,
  onClose,
}: Props) {
  const [task, setTask] = useState<Task>(initialTask);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFullTask = async () => {
      try {
        const res = await fetch(`/api/tasks?id=${initialTask.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.tasks && data.tasks.length > 0) {
            setTask(data.tasks[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load full task details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFullTask();
  }, [initialTask.id]);

  return (
    <Rnd
      default={{
        x: 100,
        y: 100,
        width: 450,
        height: 600,
      }}
      minWidth={360}
      minHeight={300}
      bounds="window"
      className="z-[9999] fixed bg-white bg-gradient-to-br from-gray-50 to-white shadow-2xl rounded-xl border border-gray-200 overflow-hidden"
    >
      <div className="h-full w-full relative overflow-auto p-5">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full shadow-md transition-all duration-200 ease-in-out flex items-center justify-center"
          aria-label="Close floating task card"
        >
          <FaTimes size={18} />
        </button>
        
        {loading && (
          <div className="absolute top-4 left-4 z-10 text-xs font-bold text-indigo-500 animate-pulse bg-indigo-50 px-2 py-1 rounded-md">
            Loading full details...
          </div>
        )}

        <TaskDetailsCard
          task={task}
          isAdmin={isAdmin}
          onDelete={onDelete}
          onUpdateTask={(id, fields) => {
            setTask({ ...task, ...fields });
            if (onUpdateTask) onUpdateTask(id, fields);
          }}
        />

        <div className="mt-8 pt-6 border-t border-gray-100">
          <TaskActivityFeed taskId={task.id} />
        </div>
      </div>
    </Rnd>
  );
}
