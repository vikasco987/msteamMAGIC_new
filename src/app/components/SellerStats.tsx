"use client";

import { useEffect, useState } from "react";
import {
  MdOutlineAttachMoney,
  MdCheckCircleOutline,
  MdPendingActions,
  MdShoppingCart,
} from "react-icons/md";
import { FiLoader } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

interface Stats {
  totalRevenue: number;
  totalReceived: number;
  pendingRevenue: number;
  totalSales: number;
}

export default function SellerStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [month, setMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      setStats(null);

      try {
        const statsRes = await fetch(`/api/seller/stats?month=${month}`);
        if (!statsRes.ok) throw new Error("Failed to fetch summary stats");
        const statsData = await statsRes.json();
        setStats(statsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [month]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const staggerContainerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  return (
    <div className="p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header and Month Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            Dashboard Overview
          </h1>
          <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm p-2 hover:shadow-md">
            <label htmlFor="month-selector" className="text-gray-600 font-medium">
              Select Month:
            </label>
            <input
              id="month-selector"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-transparent border-none outline-none text-gray-800 font-bold"
            />
          </div>
        </div>

        {/* Loading and Error states */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-blue-600 py-6"
            >
              <FiLoader className="inline-block animate-spin text-3xl" />
              <p className="mt-2 text-base">Loading your data...</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              key="error-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg shadow-sm"
            >
              <h3 className="font-bold text-base mb-1">Error</h3>
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        <AnimatePresence>
          {stats && (
            <motion.div
              key="stats-cards"
              variants={staggerContainerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <StatCard
                title="Total Revenue"
                value={formatCurrency(stats.totalRevenue)}
                icon={<MdOutlineAttachMoney />}
                color="from-green-400 to-green-600"
                variant={cardVariants}
              />
              <StatCard
                title="Received"
                value={formatCurrency(stats.totalReceived)}
                icon={<MdCheckCircleOutline />}
                color="from-blue-400 to-blue-600"
                variant={cardVariants}
              />
              <StatCard
                title="Pending"
                value={formatCurrency(stats.pendingRevenue)}
                icon={<MdPendingActions />}
                color="from-yellow-400 to-yellow-600"
                variant={cardVariants}
              />
              <StatCard
                title="Total Sales"
                value={stats.totalSales.toLocaleString()}
                icon={<MdShoppingCart />}
                color="from-purple-400 to-purple-600"
                variant={cardVariants}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const StatCard = ({
  title,
  value,
  icon,
  color,
  variant,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  variant: any;
}) => (
  <motion.div
    variants={variant}
    className="relative p-6 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:scale-105 transition-transform duration-300"
  >
    <div
      className={`absolute -top-4 -right-4 p-4 rounded-full text-white text-3xl opacity-20 bg-gradient-to-br ${color}`}
    >
      {icon}
    </div>
    <div className="flex items-center gap-4 mb-2">
      <div
        className={`text-4xl p-2 rounded-lg text-white bg-gradient-to-br ${color} shadow-md`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-700">{title}</h3>
    </div>
    <p className="text-2xl font-extrabold text-gray-900 mt-2">{value}</p>
  </motion.div>
);