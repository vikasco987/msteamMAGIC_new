"use client";

import React from "react";
import Filters from "../components/Powerbi/Filters";
import MonthlyBarChart from "../components/Powerbi/MonthlyBarChart";
import DailyLineChart from "../components/Powerbi/DailyLineChart";
import ProductBarChart from "../components/Powerbi/ProductBarChart";
import SaleTypePieChart from "../components/Powerbi/SaleTypePieChart";
import PaymentModePieChart from "../components/Powerbi/PaymentModePieChart";
import CategoryTreemap from "../components/Powerbi/CategoryTreemap";

export default function FullDashboard() {
  return (
    <div className="space-y-8">
      {/* Filters */} 
      <Filters />

      {/* Charts (excluding KPICards because it's already shown in your main dashboard) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MonthlyBarChart />
        <DailyLineChart />
        <ProductBarChart />
        <SaleTypePieChart />
        <PaymentModePieChart />
        <CategoryTreemap />
      </div>
    </div>
  );
}
