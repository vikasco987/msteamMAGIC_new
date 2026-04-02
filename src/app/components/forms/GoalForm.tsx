"use client";

import React, { useEffect, useState } from "react";
import {
  format,
  getISOWeek,
  addMonths,
  startOfWeek,
  addWeeks,
  addDays,
} from "date-fns";
import { toast, Toaster } from "react-hot-toast"; // Import toast and Toaster

type Goal = {
  id?: string;
  period: string;
  revenueGoal: number;
  leadsGoal: number;
  collectionGoal: number;
};

const generatePeriodOptions = () => {
  const options = [];
  const now = new Date();

  for (let i = 0; i < 4; i++) {
    const month = addMonths(now, i);
    const monthValue = format(month, "yyyy-MM");
    const monthLabel = `Monthly - ${format(month, "MMMM yyyy")}`;
    options.push({ value: monthValue, label: monthLabel });
  }

  for (let i = 0; i < 5; i++) {
    const weekStart = startOfWeek(addWeeks(now, i), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    const weekValue = `${format(weekStart, "yyyy")}-W${getISOWeek(weekStart)}`;
    const weekLabel = `Weekly - Week ${getISOWeek(weekStart)} (${format(
      weekStart,
      "MMM dd"
    )}–${format(weekEnd, "MMM dd")})`;
    options.push({ value: weekValue, label: weekLabel });
  }

  options.sort((a, b) => a.value.localeCompare(b.value));
  return options;
};

export default function GoalForm() {
  const [form, setForm] = useState<Goal>({
    period: "",
    revenueGoal: 0,
    leadsGoal: 0,
    collectionGoal: 0,
  });

  const [existingGoal, setExistingGoal] = useState<Goal | null>(null);
  // Removed 'status' state as react-hot-toast will handle feedback
  const [periodOptions, setPeriodOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // State to store all goals
  const [allGoals, setAllGoals] = useState<Goal[]>([]);

  // Function to fetch all goals
  const fetchAllGoals = () => {
    fetch("/api/stats/goals")
      .then(res => res.json())
      .then(setAllGoals)
      .catch(error => console.error("Failed to fetch all goals:", error));
  };

  // Effect to fetch all goals on component mount
  useEffect(() => {
    fetchAllGoals();
  }, []);

  useEffect(() => {
    setPeriodOptions(generatePeriodOptions());
  }, []);

  useEffect(() => {
    if (form.period) {
      fetch(`/api/stats/goals?period=${form.period}`)
        .then((res) => res.json())
        .then((goalArr) => {
          const goal = goalArr?.[0]; // findMany returns an array
          if (goal) {
            setExistingGoal(goal);
            setForm(goal);
          } else {
            setExistingGoal(null);
            setForm((prev) => ({
              ...prev,
              revenueGoal: 0,
              leadsGoal: 0,
              collectionGoal: 0,
            }));
          }
        })
        .catch((err) => {
          console.error("Failed to fetch goal:", err);
          toast.error("Failed to load goal data."); // Use toast for error
        });
    }
  }, [form.period]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "period" ? value : Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToastId = toast.loading("Saving goal..."); // Show loading toast

    if (!form.period) {
      toast.dismiss(loadingToastId); // Dismiss loading toast
      toast.error("Please select a period."); // Show error toast
      return;
    }

    try {
      const res = await fetch("/api/stats/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const savedGoal = await res.json();
        setExistingGoal(savedGoal);
        toast.success("Goal saved successfully!", { id: loadingToastId }); // Update loading toast to success
        fetchAllGoals(); // Re-fetch all goals to update the list
      } else {
        const errorData = await res.json();
        toast.error(`Failed: ${errorData.error || res.statusText}`, { id: loadingToastId }); // Update loading toast to error
      }
    } catch (error) {
      console.error("Error saving goal:", error);
      toast.error("Unexpected error occurred.", { id: loadingToastId }); // Update loading toast to error
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-md space-y-4 max-w-xl mx-auto my-8 font-sans"
    >
      <Toaster position="top-center" reverseOrder={false} /> {/* Add Toaster component here */}

      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
        {existingGoal ? "Update Goal" : "Set New Goal"}
      </h2>

      {/* Period Select */}
      <div>
        <label htmlFor="period-select" className="block text-sm font-medium text-gray-700 mb-1">
          Period
        </label>
        <select
          id="period-select"
          name="period"
          value={form.period}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm appearance-none pr-8 bg-white"
        >
          <option value="">Select a period</option>
          {periodOptions.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Revenue Goal */}
      <div>
        <label htmlFor="revenue-goal" className="block text-sm font-medium text-gray-700 mb-1">
          Revenue Goal (₹)
        </label>
        <input
          type="number"
          id="revenue-goal"
          name="revenueGoal"
          value={form.revenueGoal}
          onChange={handleChange}
          required
          min={0}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
        />
      </div>

      {/* Leads Goal */}
      <div>
        <label htmlFor="leads-goal" className="block text-sm font-medium text-gray-700 mb-1">
          Leads Goal
        </label>
        <input
          type="number"
          id="leads-goal"
          name="leadsGoal"
          value={form.leadsGoal}
          onChange={handleChange}
          required
          min={0}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
        />
      </div>

      {/* Collection Goal */}
      <div>
        <label htmlFor="collection-goal" className="block text-sm font-medium text-gray-700 mb-1">
          Collection Goal (₹)
        </label>
        <input
          type="number"
          id="collection-goal"
          name="collectionGoal"
          value={form.collectionGoal}
          onChange={handleChange}
          required
          min={0}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200 ease-in-out transform hover:scale-105"
      >
        {existingGoal ? "Update Goal" : "Create Goal"}
      </button>

      {/* Removed the old status display */}

      {/* Display all goals - Attractive Layout */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
          All Set Goals
        </h3>
        {allGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allGoals.map((goal) => (
              <div
                key={goal.id || goal.period}
                className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200 hover:shadow-md transition duration-200"
              >
                <h4 className="text-lg font-semibold text-blue-800 mb-2">
                  {goal.period}
                </h4>
                <p className="text-gray-700 text-sm">
                  <span className="font-medium">Revenue Goal:</span>{" "}
                  <span className="text-green-700 font-bold">₹{goal.revenueGoal.toLocaleString()}</span>
                </p>
                <p className="text-gray-700 text-sm">
                  <span className="font-medium">Leads Goal:</span>{" "}
                  <span className="text-purple-700 font-bold">{goal.leadsGoal.toLocaleString()}</span>
                </p>
                <p className="text-gray-700 text-sm">
                  <span className="font-medium">Collection Goal:</span>{" "}
                  <span className="text-orange-700 font-bold">₹{goal.collectionGoal.toLocaleString()}</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center">No goals set yet. Start by creating one above!</p>
        )}
      </div>
    </form>
  );
}