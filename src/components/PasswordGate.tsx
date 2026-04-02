"use client";

import { useState, useEffect } from "react";

export default function PasswordGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const isUnlocked = sessionStorage.getItem("dashboard_unlocked");
    if (isUnlocked === "true") {
      setUnlocked(true);
    }
  }, []);

  const handleSubmit = () => {
    if (password === process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD) {
      sessionStorage.setItem("dashboard_unlocked", "true");
      setUnlocked(true);
    } else {
      setError("Incorrect password");
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-xl rounded-xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-center">
          🔒 Enter Dashboard Password
        </h2>

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border px-3 py-2 rounded mb-3"
        />

        {error && (
          <p className="text-red-600 text-sm mb-2">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
        >
          Unlock
        </button>
      </div>
    </div>
  );
}
