export function formatDateTime(dateString: string | Date | null) {
  if (!dateString) return "-";
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short", // Fri
    day: "2-digit",  // 15
    month: "long",   // August
    year: "numeric", // 2025
    hour: "numeric", // 5
    minute: "2-digit", // 05
    hour12: true, // AM/PM
  }).format(date);
}
