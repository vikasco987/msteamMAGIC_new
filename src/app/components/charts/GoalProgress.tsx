"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";

type Goal = {
  period: string;
  revenueGoal: number;
  leadsGoal: number;
  collectionGoal: number;
};

type PerformanceStats = {
  totalRevenue: number;
  amountReceived: number;
  totalSales: number; // Assuming totalSales represents leads for simplicity
  // Add other relevant stats if available from the API
};

export default function GoalProgress() {
  const [currentMonthGoal, setCurrentMonthGoal] = useState<Goal | null>(null);
  const [currentMonthPerformance, setCurrentMonthPerformance] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGoalAndPerformance = async () => {
      setLoading(true);
      setError(null);
      const currentMonth = format(new Date(), "yyyy-MM"); // e.g., "2025-07"

      try {
        // Fetch current month's goal
        const goalRes = await fetch(`/api/stats/goals?period=${currentMonth}`);
        if (!goalRes.ok) {
          throw new Error(`Failed to fetch goal: ${goalRes.statusText}`);
        }
        const goalData = await goalRes.json();
        setCurrentMonthGoal(goalData?.[0] || null); // Assuming API returns an array

        // Fetch current month's performance stats
        // This endpoint should ideally provide current month's specific stats.
        // For now, assuming /api/stats/user-performance/overview gives current overall stats.
        // If your API has a monthly performance endpoint, use that instead.
        const performanceRes = await fetch("/api/stats/user-performance/overview");
        if (!performanceRes.ok) {
          throw new Error(`Failed to fetch performance: ${performanceRes.statusText}`);
        }
        const performanceData = await performanceRes.json();
        setCurrentMonthPerformance(performanceData);

      } catch (err: unknown) { // FIX: Type caught error as unknown
        console.error("Error fetching goal or performance data:", err);
        // Safely access the error message
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchGoalAndPerformance();
  }, []); // Run once on component mount

  if (loading) {
    return (
      <div className="rounded-xl bg-white shadow-md p-6 border border-gray-200 mb-6 text-center text-gray-600">
        Loading monthly goal progress...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white shadow-md p-6 border border-red-200 mb-6 text-center text-red-600">
        Error: {error}
      </div>
    );
  }

  const getProgressPercentage = (current: number, goal: number) => {
    if (goal <= 0) return 0; // Avoid division by zero or negative goals
    return Math.min(100, (current / goal) * 100); // Cap at 100%
  };

  const renderProgressBar = (current: number, goal: number) => {
    const percentage = getProgressPercentage(current, goal);
    const progressBarColor = percentage >= 100 ? "bg-green-500" : "bg-blue-500";
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`${progressBarColor} h-2.5 rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  const currentMonthLabel = format(new Date(), "MMMM yyyy");

  return (
    <div className="rounded-xl bg-white shadow-md p-6 border border-gray-200 mb-6 font-sans">
      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
        📊 Monthly Goal Progress - {currentMonthLabel}
      </h2>

      {!currentMonthGoal && !currentMonthPerformance ? (
        <p className="text-gray-600 text-center">
          No goal or performance data available for this month.
          <br />
          Please set a goal or ensure performance data is being tracked.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Revenue Progress */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-lg font-medium text-gray-700">Revenue:</span>
              <span className="text-lg font-semibold text-green-700">
                ₹{currentMonthPerformance?.totalRevenue?.toLocaleString() ?? 0} / ₹{currentMonthGoal?.revenueGoal?.toLocaleString() ?? 0}
              </span>
            </div>
            {renderProgressBar(
              currentMonthPerformance?.totalRevenue ?? 0,
              currentMonthGoal?.revenueGoal ?? 0
            )}
          </div>

          {/* Leads Progress */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-lg font-medium text-gray-700">Leads:</span>
              <span className="text-lg font-semibold text-purple-700">
                {currentMonthPerformance?.totalSales?.toLocaleString() ?? 0} / {currentMonthGoal?.leadsGoal?.toLocaleString() ?? 0}
              </span>
            </div>
            {renderProgressBar(
              currentMonthPerformance?.totalSales ?? 0,
              currentMonthGoal?.leadsGoal ?? 0
            )}
          </div>

          {/* Collection Progress */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-lg font-medium text-gray-700">Collection:</span>
              <span className="text-lg font-semibold text-orange-700">
                ₹{currentMonthPerformance?.amountReceived?.toLocaleString() ?? 0} / ₹{currentMonthGoal?.collectionGoal?.toLocaleString() ?? 0}
              </span>
            </div>
            {renderProgressBar(
              currentMonthPerformance?.amountReceived ?? 0,
              currentMonthGoal?.collectionGoal ?? 0
            )}
          </div>
        </div>
      )}
    </div>
  );
}