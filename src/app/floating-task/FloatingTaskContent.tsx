// app/floating-task/FloatingTaskContent.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import FloatingTaskCard from "@/app/components/FloatingTaskCard";
import { Task } from "@/types/task";

export default function FloatingTaskContent() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get("id");

  const [task, setTask] = useState<Task | null>(null);

  useEffect(() => {
    if (taskId) {
      fetch(`/api/tasks/${taskId}`)
        .then((res) => res.json())
        .then((data) => setTask(data.task))
        .catch((err) => console.error("Failed to load task:", err));
    }
  }, [taskId]);

  if (!task) return <div className="p-4">Loading task...</div>;

  return (
    <div className="bg-white w-screen h-screen overflow-auto p-4">
      <FloatingTaskCard
        task={task}
        isAdmin
        onClose={() => window.close()}
      />
    </div>
  );
}
