"use client";

import { useState } from "react";
import PaymentRemarks from "./PaymentRemarks"; // your component
import { Button } from "@/components/ui/button";

interface Task {
  id: string;
  title: string;
  amount?: number;
  status?: string;
  assignees?: { name: string; id: string }[];
}

interface Props {
  tasks: Task[];
}

export default function TaskListWithDrawer({ tasks }: Props) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setSelectedTask(null);
    setIsDrawerOpen(false);
  };

  return (
    <div className="relative">
      {/* Task List */}
      <div className="space-y-2">
        {tasks.map((task, idx) => (
          <div
            key={task.id}
            className="border rounded-lg p-4 shadow-sm bg-white cursor-pointer hover:bg-gray-50"
            onClick={() => openDrawer(task)}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                #{idx + 1} {task.title}
              </h2>
              <span className="text-red-600">₹{task.amount}</span>
            </div>
            <div className="text-sm text-gray-500">{task.status}</div>
          </div>
        ))}
      </div>

      {/* Drawer */}
      {isDrawerOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={closeDrawer}
          ></div>

          {/* Panel */}
          <div className="ml-auto w-full md:w-1/2 bg-white shadow-xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedTask.title}</h2>
              <Button onClick={closeDrawer} className="text-gray-500">
                ✕
              </Button>
            </div>

            {/* Task Info */}
            <div className="space-y-2 mb-4">
              <p>Status: {selectedTask.status}</p>
              <p>Amount: ₹{selectedTask.amount}</p>
              <p>Assignees: {selectedTask.assignees?.map(a => a.name).join(", ")}</p>
            </div>

            {/* PaymentRemarks */}
            <PaymentRemarks taskId={selectedTask.id} />
          </div>
        </div>
      )}
    </div>
  );
}
