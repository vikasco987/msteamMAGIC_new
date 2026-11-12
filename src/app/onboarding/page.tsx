"use client";

import React from "react";
import { useUnifiedAuth as useUser } from "@/lib/useUnifiedAuth";
import OnboardingTable from "../components/OnboardingTable";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500 font-medium">Loading user...</div>
      </div>
    );
  }

  const role = user?.publicMetadata?.role;

  // Authorization check (RBAC)
  const isAuthorized =
    role === "admin" ||
    role === "master" ||
    role === "tl" ||
    role === "seller" ||
    role === "user";

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-red-200 rounded-xl p-6 max-w-md text-center shadow-sm">
          <div className="text-red-500 text-3xl mb-2">⛔</div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Access Denied</h2>
          <p className="text-sm text-gray-600">
            You are not authorized to view the Onboarding Management module.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <OnboardingTable />
    </main>
  );
}

