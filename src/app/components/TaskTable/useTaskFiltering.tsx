import { useMemo, useState } from "react";
import { Task } from "../../../types/task";
import { UserResource } from "@clerk/nextjs";
import { isToday, subDays, startOfMonth } from "date-fns";
import { ALL_COLUMNS } from "./ALL_COLUMNS";

export const useTaskFiltering = (tasks: Task[], user: UserResource) => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(10);
  const [columns, setColumns] = useState<string[]>(ALL_COLUMNS);

  const role = user?.publicMetadata?.role || "";

  const filteredTasks = useMemo(() => {
    let data = [...tasks];
    if (query) {
      data = data.filter((t) =>
        (t.title + t.customFields?.shopName + t.customFields?.email)
          .toLowerCase()
          .includes(query.toLowerCase())
      );
    }
    if (statusFilter) data = data.filter((t) => t.status === statusFilter);
    return data;
  }, [tasks, query, statusFilter]);

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * tasksPerPage;
    return filteredTasks.slice(start, start + tasksPerPage);
  }, [filteredTasks, currentPage, tasksPerPage]);

  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  return {
    query, setQuery,
    statusFilter, setStatusFilter,
    currentPage, setCurrentPage,
    tasksPerPage, setTasksPerPage,
    columns, setColumns,
    paginatedTasks,
    totalPages,
    refetchTasks: () => {}, // placeholder for api calls if needed
  };
};
