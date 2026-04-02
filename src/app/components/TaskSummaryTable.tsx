"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TaskSummaryTable() {
  const { data, error } = useSWR("/api/tasks/summary", fetcher);

  if (error) return <div>❌ Failed to load</div>;
  if (!data) return <div>⏳ Loading...</div>;

  const assignees = Object.keys(data);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">📊 Task Summary by Assignee</h2>
      <table className="min-w-full border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Assignee</th>
            <th className="p-2 border">TODO</th>
            <th className="p-2 border">In Progress</th>
            <th className="p-2 border">Done</th>
            <th className="p-2 border">Total</th>
          </tr>
        </thead>
        <tbody>
          {assignees.map((assignee) => (
            <tr key={assignee}>
              <td className="p-2 border">{assignee}</td>
              <td className="p-2 border">{data[assignee].TODO}</td>
              <td className="p-2 border">{data[assignee].INPROGRESS}</td>
              <td className="p-2 border">{data[assignee].DONE}</td>
              <td className="p-2 border font-bold">{data[assignee].TOTAL}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
