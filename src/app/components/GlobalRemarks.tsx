"use client";

import { useEffect, useState } from "react";

interface Remark {
  id: string;
  remark: string;
  createdAt: string;
  authorName?: string;
  task?: { id: string; title: string; amount: number; status: string } | null;
}

export default function GlobalRemarks() {
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRemarks = async () => {
      try {
        const res = await fetch("/api/remarks"); // global API with task info
        if (!res.ok) throw new Error("Failed to fetch remarks");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Invalid data format");

        // Optional: filter or map to ensure task existss
        const mapped = data.map((r: any) => ({
          id: r.id,
          remark: r.remark,
          createdAt: r.createdAt,
          authorName: r.authorName ?? "Unknown",
          task: r.task ?? null, // make sure task is either object or null
        }));

        setRemarks(mapped);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchRemarks();
  }, []);

  if (loading) return <p className="text-gray-500">Loading remarks...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="space-y-3">
      {remarks.length === 0 ? (
        <p className="text-gray-500">No remarks yet</p>
      ) : (
        remarks.map((r) => (
          <div key={r.id} className="border rounded-lg p-3 bg-gray-50 shadow-sm">
            <p className="text-sm">{r.remark}</p>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{r.authorName}</span>
              <span>{new Date(r.createdAt).toLocaleString()}</span>
            </div>
            {r.task && (
              <div className="text-xs text-blue-600 mt-1 flex justify-between items-center">
                <span>
                  Task: {r.task.title} (₹{r.task.amount})
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-white text-[10px] ${
                    r.task.status === "PENDING" ? "bg-red-600" : "bg-green-600"
                  }`}
                >
                  {r.task.status}
                </span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
