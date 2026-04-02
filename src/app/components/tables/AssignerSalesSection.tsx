"use client";
import React from "react";
import DayReportByAssignerTable from "./DayReportByAssignerTable";
import WeekReportByAssignerTable from "./AssignerReportTable";

export default function AssignerSalesSection() {
  return (
    <div className="space-y-8">
      {/* Day-by-Day Sales */}
      <div>
        <DayReportByAssignerTable />
      </div>

      {/* Week-by-Week Sales */}
      <div>
        <WeekReportByAssignerTable />
      </div>
    </div>
  );
}
