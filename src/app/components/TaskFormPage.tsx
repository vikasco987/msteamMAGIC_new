// app/create-task/page.tsx (or wherever your create-task page lives)
'use client';
import TaskForm from '../components/TaskForm/TaskForm'; // adjust the path if needed

export default function TaskFormPage() {
  return (
    <div className="ml-64 h-screen overflow-y-auto p-6 bg-gradient-to-tr from-gray-50 to-purple-100">
      <TaskForm />
    </div>
  );
}
