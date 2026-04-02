"use client";

import { useState } from "react";
import SellerStats from "../../components/SellerStats";
import DayToDayReport from "../../components/DayToDayReport";
import SellerRemarksPage from "../remarks/page";
import { Button } from "../../../components/ui/button";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("stats");

  const tabs = [
    { id: "stats", label: "📊 Stats Overview" },
    { id: "remarks", label: "💬 Payment Remarks" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* --- Header --- */}
      <h1 className="text-2xl font-bold text-gray-800">Seller Dashboard</h1>

      {/* --- Tabs --- */}
      <div className="flex gap-3 border-b border-gray-200 pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            className={`rounded-full text-sm ${
              activeTab === tab.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* --- Tab Content --- */}
      <div className="mt-4 space-y-6">
        {activeTab === "stats" && (
          <>
            <SellerStats />
            <DayToDayReport />
          </>
        )}

        {activeTab === "remarks" && (
          <div className="border rounded-lg bg-white p-4 shadow-sm">
            <SellerRemarksPage />
          </div>
        )}
      </div>
    </div>
  );
}
