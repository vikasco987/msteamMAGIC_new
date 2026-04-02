"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AttendanceCard() {
  const [status, setStatus] = useState(''); // checked-in, checked-out, none
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    setLoading(true);
    const res = await axios.post('/api/attendance/check-in');
    setStatus('checked-in');
    setLoading(false);
  };

  const handleCheckOut = async () => {
    setLoading(true);
    const res = await axios.post('/api/attendance/check-out');
    setStatus('checked-out');
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-2">Attendance</h2>
      <p>Status: {status || 'Not checked in today'}</p>
      <div className="mt-4 flex gap-2">
        <button onClick={handleCheckIn} disabled={loading || status !== ''} className="px-4 py-2 bg-green-500 text-white rounded">
          Check In
        </button>
        <button onClick={handleCheckOut} disabled={loading || status !== 'checked-in'} className="px-4 py-2 bg-red-500 text-white rounded">
          Check Out
        </button>
      </div>
    </div>
  );
}
