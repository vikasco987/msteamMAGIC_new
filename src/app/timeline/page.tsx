"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TaskTimeline from "../components/TaskTimeline";

export default function TimelinePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      const role = String(user?.publicMetadata?.role || "user").toLowerCase();
      const allowedRoles = ["seller", "admin", "master", "tl"];
      if (!allowedRoles.includes(role)) {
        router.push("/unauthorized"); // or use "/" if no custom page
      }
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) return null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-purple-800">📊 Project Timeline</h1>
      <TaskTimeline />
    </div>
  );
}

