// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import dynamic from 'next/dynamic';
// import axios from 'axios';

// // Dynamically import the Webcam component to ensure it's only rendered on the client side
// const Webcam = dynamic(() => import('react-webcam'), { ssr: false });

// export default function AttendanceDashboardPage() {
//   const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
//   const [status, setStatus] = useState('');
//   const webcamRef = useRef<any>(null);

//   // Get user's location on page load
//   useEffect(() => {
//     // Check if the geolocation API is available in the browser
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (pos) => {
//           setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
//         },
//         (err) => {
//           console.error('Location access denied', err);
//           setStatus('❌ Location access denied');
//         }
//       );
//     } else {
//       setStatus('❌ Geolocation is not supported by your browser.');
//     }
//   }, []);

//   // Capture image from webcam
//   const capture = (): string | null => {
//     if (webcamRef.current) {
//       return webcamRef.current.getScreenshot();
//     }
//     return null;
//   };

//   // Handle check-in logic
//   const handleCheckIn = async () => {
//     setStatus('⏳ Checking in...');
//     const capturedImage = capture();

//     if (!capturedImage) {
//       setStatus('❌ Failed to capture image. Please try again.');
//       return;
//     }

//     if (!location) {
//       setStatus('❌ Location not available. Please ensure location services are enabled.');
//       return;
//     }

//     try {
//       await axios.post('/api/attendance/check-in', {
//         faceImage: capturedImage,
//         location,
//       });
//       setStatus('✅ Check-in successful');
//     } catch (error: any) {
//       const message = error?.response?.data?.message || '❌ Check-in failed. Please try again.';
//       setStatus(message);
//       console.error('Check-in error:', message);
//     }
//   };

//   // Handle check-out logic
//   const handleCheckOut = async () => {
//     setStatus('⏳ Checking out...');
//     try {
//       await axios.post('/api/attendance/check-out');
//       setStatus('✅ Checked out successfully');
//     } catch (error: any) {
//       const message = error?.response?.data?.message || '❌ Check-out failed. Please try again.';
//       setStatus(message);
//       console.error('Check-out error:', message);
//     }
//   };

//   return (
//     <div className="p-6 max-w-lg mx-auto space-y-4">
//       <h1 className="text-2xl font-bold">🕒 Attendance Dashboard</h1>

//       {/* Location Status */}
//       {location ? (
//         <p>📍 Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
//       ) : (
//         <p>📍 Getting your location...</p>
//       )}

//       {/* Webcam View */}
//       <Webcam
//         ref={webcamRef}
//         screenshotFormat="image/jpeg"
//         className="rounded shadow w-full aspect-video bg-gray-200"
//       />

//       {/* Action Buttons */}
//       <div className="flex gap-4">
//         <button
//           className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
//           onClick={handleCheckIn}
//         >
//           📸 Check In
//         </button>
//         <button
//           className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
//           onClick={handleCheckOut}
//         >
//           👋 Check Out
//         </button>
//       </div>

//       {/* Status Message */}
//       {status && (
//         <div className="mt-4 text-sm font-medium p-3 rounded" style={{
//           backgroundColor: status.includes('✅') ? '#d4edda' : status.includes('❌') ? '#f8d7da' : '#e2e6ea',
//           color: status.includes('✅') ? '#155724' : status.includes('❌') ? '#721c24' : '#383d41'
//         }}>
//           {status}
//         </div>
//       )}
//     </div>
//   );
// }




import AttendanceButtons from "../../components/AttendanceButtons";

export default function HomePage() {
  return (
    <main className="flex justify-center items-center min-h-screen">
      <AttendanceButtons />
    </main>
  );
}
