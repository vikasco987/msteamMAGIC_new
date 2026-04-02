export interface Task {
  title: string;
  status: string;
  category: string;
  assignee?: string;
  shopName?: string;
  priority?: string;
  createdAt: string;
  dueDate?: string;
}

interface FilterParams {
  filterText: string;
  selectedCategories: string[];
  selectedStatuses: string[];
  selectedAssignees: string[];
  selectedDates: string[];
  sortBy: string;
  sortDirection: "asc" | "desc";
}

export function applyBoardFilters(
  tasks: Task[],
  filters: FilterParams
): Task[] {
  let data = [...tasks];

  /* 🔍 TEXT SEARCH */
  if (filters.filterText.trim()) {
    const q = filters.filterText.toLowerCase();
    data = data.filter((t) =>
      [
        t.title,
        t.shopName,
        t.assignee,
        t.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  /* 📂 CATEGORY FILTER */
  if (filters.selectedCategories.length > 0) {
    data = data.filter((t) =>
      filters.selectedCategories.includes(t.category)
    );
  }

  /* 🏷️ STATUS FILTER */
  if (filters.selectedStatuses.length > 0) {
    data = data.filter((t) =>
      filters.selectedStatuses.includes(t.status)
    );
  }

  /* 👤 ASSIGNEE FILTER */
  if (filters.selectedAssignees.length > 0) {
    data = data.filter((t) =>
      t.assignee &&
      filters.selectedAssignees.includes(t.assignee)
    );
  }

  /* 🗓️ DATE FILTER */
  if (filters.selectedDates.length > 0) {
    const now = new Date();

    data = data.filter((t) => {
      const created = new Date(t.createdAt);

      return filters.selectedDates.some((range) => {
        switch (range) {
          case "today":
            return created.toDateString() === now.toDateString();

          case "yesterday": {
            const y = new Date();
            y.setDate(now.getDate() - 1);
            return created.toDateString() === y.toDateString();
          }

          case "last_7_days": {
            const d = new Date();
            d.setDate(now.getDate() - 7);
            return created >= d;
          }

          case "this_month":
            return (
              created.getMonth() === now.getMonth() &&
              created.getFullYear() === now.getFullYear()
            );

          case "last_month": {
            const m = new Date();
            m.setMonth(now.getMonth() - 1);
            return (
              created.getMonth() === m.getMonth() &&
              created.getFullYear() === m.getFullYear()
            );
          }

          case "this_year":
            return created.getFullYear() === now.getFullYear();

          default:
            return true;
        }
      });
    });
  }

  /* 🔃 SORTING */
  data.sort((a, b) => {
    const dir = filters.sortDirection === "asc" ? 1 : -1;

    const getValue = (task: Task) => {
      switch (filters.sortBy) {
        case "title":
          return task.title?.toLowerCase() || "";
        case "status":
          return task.status || "";
        case "priority":
          return task.priority || "";
        case "shopName":
          return task.shopName || "";
        case "dueDate":
          return task.dueDate
            ? new Date(task.dueDate).getTime()
            : 0;
        case "createdAt":
        default:
          return new Date(task.createdAt).getTime();
      }
    };

    const aVal = getValue(a);
    const bVal = getValue(b);

    if (aVal < bVal) return -1 * dir;
    if (aVal > bVal) return 1 * dir;
    return 0;
  });

  return data;
}