// lib/colorUtils.ts

export const PRIORITY_COLOR_MAP: Record<string, string> = {
  Low: "#93c5fd",       // light blue
  Normal: "#a5b4fc",    // indigo
  High: "#fbbf24",      // amber
  Urgent: "#f87171",    // red
};

export const getPriorityColor = (priority?: string): string => {
  if (!priority) return PRIORITY_COLOR_MAP.Normal;
  return PRIORITY_COLOR_MAP[priority] || PRIORITY_COLOR_MAP.Normal;
};

export const PRIORITY_LEVELS = ["Low", "Normal", "High", "Urgent"];
