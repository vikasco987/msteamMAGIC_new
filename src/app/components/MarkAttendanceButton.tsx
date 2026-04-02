// "use client";
// import { useState } from "react";

// export default function MarkAttendanceButton() {
//   const [loading, setLoading] = useState(false);

//   const handleCheckIn = async () => {
//     setLoading(true);

//     const location = await new Promise((resolve, reject) => {
//       navigator.geolocation.getCurrentPosition(
//         (pos) => resolve({
//           lat: pos.coords.latitude,
//           lng: pos.coords.longitude,
//         }),
//         (err) => reject(err)
//       );
//     });

//     const res = await fetch("/api/attendance/check-in", {
//       method: "POST",
//       body: JSON.stringify({ location }),
//     });

//     if (res.ok) alert("Attendance marked!");
//     else alert("Failed to mark attendance.");

//     setLoading(false);
//   };

//   return (
//     <button
//       onClick={handleCheckIn}
//       disabled={loading}
//       className="bg-blue-600 text-white px-4 py-2 rounded"
//     >
//       {loading ? "Marking..." : "Mark Attendance"}
//     </button>
//   );
// }














"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

export default function MarkAttendanceButton() {
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    try {
      setLoading(true);

      // ✅ Get user location
      const location = await new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }),
          (err) => reject(err)
        );
      });

      // ✅ API call
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location }),
      });

      if (res.ok) {
        alert("✅ Attendance marked successfully!");
      } else {
        alert("⚠️ Failed to mark attendance.");
      }
    } catch (error) {
      console.error("Attendance error:", error);
      alert("❌ Unable to mark attendance.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckIn}
      disabled={loading}
      className={`flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium shadow-lg transition-all 
        ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:scale-105 hover:shadow-xl"}
      `}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Marking...</span>
        </>
      ) : (
        <>
          <CheckCircle className="h-5 w-5" />
          <span>Mark Attendance</span>
        </>
      )}
    </button>
  );
}
