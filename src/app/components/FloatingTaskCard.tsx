"use client";

import React from "react";
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
  task,
  isAdmin = false,
  onDelete,
  onUpdateTask,
  onClose,
}: Props) {
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
      // Enhanced styling for a more prominent and modern floating card
      className="z-[9999] fixed bg-white bg-gradient-to-br from-gray-50 to-white shadow-2xl rounded-xl border border-gray-200 overflow-hidden"
    >
      <div className="h-full w-full relative overflow-auto p-5"> {/* Increased padding for better spacing */}
        {/* Enhanced close button design */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full shadow-md transition-all duration-200 ease-in-out flex items-center justify-center"
          aria-label="Close floating task card"
        >
          <FaTimes size={18} /> {/* Slightly larger icon */}
        </button>
        {/* TaskDetailsCard content */}
        <TaskDetailsCard
          task={task}
          isAdmin={isAdmin}
          onDelete={onDelete}
          onUpdateTask={onUpdateTask}
        />

        {/* Activity Feed Section */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <TaskActivityFeed taskId={task.id} />
        </div>
      </div>
    </Rnd>
  );
}
