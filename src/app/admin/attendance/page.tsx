// src/app/admin/attendance/page.tsx

"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function AttendanceAdminPage() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    axios.get("/api/attendance/list").then((res) => setRecords(res.data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Attendance Records</h1>
      <div className="overflow-auto">
        <table className="min-w-full border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">User ID</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Check-In</th>
              <th className="p-2 border">Check-Out</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record: any) => (
              <tr key={record.id}>
                <td className="p-2 border">{record.userId}</td>
                <td className="p-2 border">{new Date(record.date).toLocaleDateString()}</td>
                <td className="p-2 border">{new Date(record.checkIn).toLocaleTimeString()}</td>
                <td className="p-2 border">
                  {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
