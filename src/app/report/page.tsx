// // pages/ReportPage.tsx
// "use client";

// import React, { useState, useEffect } from 'react';
// import { useUser } from '@clerk/nextjs';
// import  TaskTableView  from '../components/TaskTableView'; // Adjust path as needed
// import { Task } from '../../types/task'; // Adjust path as needed
// import toast from 'react-hot-toast';

// export default function ReportPage() {
//   const { user, isLoaded } = useUser();
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const fetchTasks = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await fetch('/api/tasks');
//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.error || 'Failed to fetch tasks');
//       }
//       const data = await res.json();
//       if (Array.isArray(data.tasks)) {
//         setTasks(data.tasks);
//       } else {
//         console.warn("API returned non-array for tasks:", data);
//         setTasks([]); // Ensure tasks is always an array
//         toast.error("Failed to load tasks: Invalid data format.");
//       }
//     } catch (err: any) {
//       console.error("Error fetching tasks:", err);
//       setError(err.message || 'An error occurred while fetching tasks.');
//       toast.error(err.message || 'Failed to load tasks.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     // Only fetch if user is loaded and has an allowed role
//     if (isLoaded && user && (user.publicMetadata?.role === "admin" || user.publicMetadata?.role === "seller" || user.publicMetadata?.role === "master")) {
//       fetchTasks();
//     } else if (isLoaded && !user) {
//       setLoading(false); // User not logged in
//     } else if (isLoaded && user && user.publicMetadata?.role !== "admin" && user.publicMetadata?.role !== "seller" && user.publicMetadata?.role !== "master") {
//       setLoading(false); // User logged in but unauthorized role
//       setError("⛔ Access Denied: You do not have the required role to view this page.");
//     }
//   }, [isLoaded, user]); // Re-fetch when user object or loading state changes

//   if (!isLoaded || loading) {
//     return <div className="p-6 text-gray-500 text-center py-8">Loading user and tasks...</div>;
//   }

//   if (error) {
//     return <div className="text-center py-8 text-red-600">Error: {error}</div>;
//   }

//   // After loading, if user is null (not signed in) or role is not allowed
//   const role = user?.publicMetadata?.role;
//   if (!user || (role !== "admin" && role !== "seller" && role !== "master")) {
//     return <div className="p-6 text-red-500 text-center py-8">
//              ⛔ Access Denied: Please sign in with an authorized account.
//            </div>;
//   }

//   return (
//     <main className="container mx-auto px-4 py-8">
//       <h1 className="text-3xl font-bold text-gray-900 mb-6">📋 Task Dashboard</h1>
//       {/* Pass setTasks directly to TaskTableView */}
//       <TaskTableView tasks={tasks} user={user} onTasksUpdate={setTasks} />
//     </main>
//   );
// }













// pages/ReportPage.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import TaskTableView from '../components/TaskTableView'; // Adjust path as needed
import { Task } from '../../types/task'; // Adjust path as needed
import toast from 'react-hot-toast';

// Define the expected structure of the API response
interface ApiResponse {
  tasks: Task[];
}

export default function ReportPage() {
  const { user, isLoaded } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination and Filter States
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  // Debouncing Search Query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, status, limit]);

  // Re-fetch when page, limit, debouncedQuery, or status changes
  useEffect(() => {
    const normalizedRole = String(user?.publicMetadata?.role || "").toLowerCase();
    if (isLoaded && user && (normalizedRole === "admin" || normalizedRole === "seller" || normalizedRole === "master" || normalizedRole === "tl")) {
      fetchTasks();
    }
  }, [isLoaded, user, currentPage, limit, debouncedQuery, status]);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        listView: "true",
        page: currentPage.toString(),
        limit: limit.toString(),
        query: debouncedQuery,
        status: status || "",
      });

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch tasks');
      }

      const data = await res.json();

      if (Array.isArray(data.tasks)) {
        setTasks(data.tasks);
        setTotalItems(data.totalCount || 0);
        setTotalPages(data.totalPages || 0);
      } else {
        console.warn("API returned non-array for tasks:", data);
        setTasks([]);
        toast.error("Failed to load tasks: Invalid data format.");
      }
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
      setError(err.message || 'An error occurred while fetching tasks.');
      toast.error(err.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || (loading && tasks.length === 0)) {
    return <div className="p-6 text-gray-500 text-center py-8">Loading tasks...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Error: {error}</div>;
  }

  const role = String(user?.publicMetadata?.role || "").toLowerCase();
  if (!user || (role !== "admin" && role !== "seller" && role !== "master" && role !== "tl")) {
    return <div className="p-6 text-red-500 text-center py-8">
      ⛔ Access Denied: Please sign in with an authorized account.
    </div>;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">📋 Task Dashboard</h1>
        {loading && <div className="text-blue-500 flex items-center gap-2"><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>Refreshing...</div>}
      </div>

      <TaskTableView
        tasks={tasks}
        user={user}
        onTasksUpdate={setTasks}
        // Pagination & Filter Props
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        limit={limit}
        onLimitChange={setLimit}
        totalItems={totalItems}
        totalPages={totalPages}
        query={query}
        onQueryChange={setQuery}
        status={status}
        onStatusChange={setStatus}
      />
    </main>
  );
}