// /app/tish/page.tsx
"use client";

import React from "react";
import PaymentHistory from "../components/PaymentHistory";

export default function TishViewPage() {
  const [tasks, setTasks] = React.useState([]);

  React.useEffect(() => {
    fetch("/api/timeline?limit=100&page=1")
      .then((res) => res.json())
      .then((data) => {
        setTasks(data.tasks || []);
      });
  }, []);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Tish View</h1>

      {tasks.map((task) => (
        <div
          key={task.id}
          className="border border-gray-200 rounded-md p-4 shadow-sm bg-white"
        >
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-700">{task.name}</h2>
            <p className="text-sm text-gray-500">
              Shop: {task.shop} | Customer: {task.customer}
            </p>
            <p className="text-sm text-gray-500">
              Duration: {task.start} - {task.end}
            </p>
          </div>

          {/* Payment History Section (self-fetching per task) */}
          <div className="mt-6">
            <PaymentHistory taskId={task.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
