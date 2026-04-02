"use client";

import React, { useEffect, useState } from "react";
//import DayReportTable from "../components/tables/DayReportTable";
import DayReportTable from "../../components/tables/DayReportTable";
import WeekReportTable from "../../components/tables/WeekReportTable";
import MonthReportTable from "../../components/tables/MonthReportTable";

export default function AllReportsSection() {
  const [dayData, setDayData] = useState([]);
  const [weekData, setWeekData] = useState([]);
  const [monthData, setMonthData] = useState([]);

  useEffect(() => {
    fetch("/api/stats/user-performance/day-report?page=1&limit=10")
      .then((res) => res.json())
      .then((json) => setDayData(json.data || []))
      .catch(() => setDayData([]));

    fetch("/api/stats/user-performance/week-report?page=1&limit=10")
      .then((res) => res.json())
      .then((json) => setWeekData(json.data || []))
      .catch(() => setWeekData([]));

    fetch("/api/stats/user-performance/mom-table?page=1&limit=10")
      .then((res) => res.json())
      .then((json) => setMonthData(json.data || []))
      .catch(() => setMonthData([]));
  }, []);

  return (
    <div className="space-y-8">
      <DayReportTable data={dayData} />
      <WeekReportTable data={weekData} />
      <MonthReportTable data={monthData} />
    </div>
  );
}
