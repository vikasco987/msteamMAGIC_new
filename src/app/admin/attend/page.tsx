// "use client";

// import { useEffect, useState } from "react";

// type User = {
//   id: string;
//   name: string;
//   email: string;
// };

// export default function AdminAttendancePage() {
//   const [users, setUsers] = useState<User[]>([]);
//   const [loading, setLoading] = useState(false);

//   const [userId, setUserId] = useState("");
//   const [date, setDate] = useState("");
//   const [checkIn, setCheckIn] = useState("");
//   const [checkOut, setCheckOut] = useState("");
//   const [reason, setReason] = useState("");
//   const [remarks, setRemarks] = useState("");

//   /* 🔹 Fetch all users (admin only) */
//   useEffect(() => {
//     fetch("/api/admin/users")
//       .then(res => res.json())
//       .then(data => setUsers(data.users || []))
//       .catch(console.error);
//   }, []);

//   async function submitAttendance() {
//     if (!userId || !date) {
//       alert("User and date are required");
//       return;
//     }

//     setLoading(true);

//     const res = await fetch("/api/admin/attendance/update", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         userId,
//         date,
//         checkIn: checkIn || null,
//         checkOut: checkOut || null,
//         reason,
//         remarks,
//       }),
//     });

//     const data = await res.json();
//     setLoading(false);

//     if (!res.ok) {
//       alert(data.error || "Failed");
//       return;
//     }

//     alert("✅ Attendance updated successfully");
//   }

//   return (
//     <div className="max-w-xl mx-auto p-6 space-y-4">
//       <h1 className="text-xl font-bold">🛠 Admin Attendance Edit</h1>

//       {/* User dropdown */}
//       <select
//         value={userId}
//         onChange={e => setUserId(e.target.value)}
//         className="w-full border p-2 rounded"
//       >
//         <option value="">Select Employee</option>
//         {users.map(u => (
//           <option key={u.id} value={u.id}>
//             {u.name} ({u.email})
//           </option>
//         ))}
//       </select>

//       {/* Date */}
//       <input
//         type="date"
//         value={date}
//         onChange={e => setDate(e.target.value)}
//         className="w-full border p-2 rounded"
//       />

//       {/* Check in */}
//       <input
//         type="datetime-local"
//         value={checkIn}
//         onChange={e => setCheckIn(e.target.value)}
//         className="w-full border p-2 rounded"
//         placeholder="Check-in"
//       />

//       {/* Check out */}
//       <input
//         type="datetime-local"
//         value={checkOut}
//         onChange={e => setCheckOut(e.target.value)}
//         className="w-full border p-2 rounded"
//         placeholder="Check-out"
//       />

//       {/* Reason */}
//       <input
//         type="text"
//         value={reason}
//         onChange={e => setReason(e.target.value)}
//         className="w-full border p-2 rounded"
//         placeholder="Reason (optional)"
//       />

//       {/* Remarks */}
//       <textarea
//         value={remarks}
//         onChange={e => setRemarks(e.target.value)}
//         className="w-full border p-2 rounded"
//         placeholder="Remarks (optional)"
//       />

//       <button
//         onClick={submitAttendance}
//         disabled={loading}
//         className="w-full bg-black text-white p-2 rounded"
//       >
//         {loading ? "Saving..." : "Update Attendance"}
//       </button>
//     </div>
//   );
// }




"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
};

export default function AdminAttendancePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [userId, setUserId] = useState("");
  const [date, setDate] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");

  // 🔹 Load all users
  useEffect(() => {
    fetch("/api/admin/users")
      .then(res => res.json())
      .then(data => setUsers(data.users || []))
      .catch(console.error);
  }, []);

  async function submitAttendance() {
    if (!userId || !date) {
      alert("User and Date are required");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/admin/attendance/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        date,
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        reason,
        remarks,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(data.error || "Failed");
      return;
    }

    alert("✅ Attendance saved successfully");
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">🛠 Admin Attendance Editor</h1>

      <select
        value={userId}
        onChange={e => setUserId(e.target.value)}
        className="w-full border p-2 rounded"
      >
        <option value="">Select Employee</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.email})
          </option>
        ))}
      </select>

      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        type="datetime-local"
        value={checkIn}
        onChange={e => setCheckIn(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        type="datetime-local"
        value={checkOut}
        onChange={e => setCheckOut(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        type="text"
        value={reason}
        onChange={e => setReason(e.target.value)}
        className="w-full border p-2 rounded"
        placeholder="Reason (optional)"
      />

      <textarea
        value={remarks}
        onChange={e => setRemarks(e.target.value)}
        className="w-full border p-2 rounded"
        placeholder="Remarks (optional)"
      />

      <button
        onClick={submitAttendance}
        disabled={loading}
        className="w-full bg-black text-white p-2 rounded"
      >
        {loading ? "Saving..." : "Update Attendance"}
      </button>
    </div>
  );
}
