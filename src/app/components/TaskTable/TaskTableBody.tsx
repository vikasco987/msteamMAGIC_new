import React from "react";
import { Task } from "@/types/task"; // Assuming Task type is defined here
import { format } from "date-fns"; // For date formatting
import { FaMapMarkerAlt } from "react-icons/fa"; // Import the map marker icon

interface TaskTableBodyProps {
  tasks?: Task[]; // Array of tasks to display
  columns?: string[]; // Array of column names to display
  editMode: boolean; // Flag to enable/disable edit mode
  editedValues: { [key: string]: number }; // Object to store edited numerical values
  handleInputChange: (taskId: string, field: string, value: number) => void; // Handler for input changes
  handleBlur: (taskId: string, field: string) => void; // Handler for blur events (e.g., saving data)
}

export const TaskTableBody: React.FC<TaskTableBodyProps> = ({
  tasks = [], // Default to empty array if tasks are not provided
  columns = [], // Default to empty array if columns are not provided
  editMode,
  editedValues,
  handleInputChange,
  handleBlur,
}) => {
  // Display a message if no tasks are available
  if (tasks.length === 0) {
    return (
      <tbody>
        <tr>
          {/* colSpan covers all columns or at least 1 */}
          <td colSpan={columns.length || 1} className="text-center py-8 text-gray-500">
            No tasks available
          </td>
        </tr>
      </tbody>
    );
  }

  // Helper function to check if a string is a Google Maps URL
  const isGoogleMapsLink = (text: string | undefined): boolean => {
    if (!text) return false;
    // This regex checks for common Google Maps URL patterns
    return /^https?:\/\/(www\.)?google\.com\/maps\//.test(text);
  };

  return (
    <tbody>
      {tasks.map((task) => (
        <tr key={task.id}>
          {columns.map((col) => {
            // Determine the content for each cell based on the column name
            if (col === "rowNumber") {
              // Display last 5 characters of task ID as a row number
              return <td key={col} className="border px-3 py-2">{task.id.slice(-5)}</td>;
            }
            if (col === "title") {
              return <td key={col} className="border px-3 py-2">{task.title}</td>;
            }
            if (col === "status") {
              return <td key={col} className="border px-3 py-2">{task.status || "—"}</td>;
            }
            if (col === "shopName") {
              return <td key={col} className="border px-3 py-2">{task.customFields?.shopName || "—"}</td>;
            }
            if (col === "email") {
              return <td key={col} className="border px-3 py-2">{task.customFields?.email || "—"}</td>;
            }
            if (col === "phone") {
              return <td key={col} className="border px-3 py-2">{task.customFields?.phone || "—"}</td>;
            }
            if (col === "assignerName") {
              return <td key={col} className="border px-3 py-2">{task.assignerName || "—"}</td>;
            }
            if (col === "assignee") {
              // Display assignee name or email, or a dash if neither is available
              return <td key={col} className="border px-3 py-2">{task.assignee?.name || task.assigneeEmail || "—"}</td>;
            }
            if (col === "createdAt") {
              // Format the creation date
              return <td key={col} className="border px-3 py-2">{format(new Date(task.createdAt), "dd MMM yyyy")}</td>;
            }
            if (col === "location") {
              const locationText = task.customFields?.location;
              return (
                <td key={col} className="border px-3 py-2">
                  {locationText && isGoogleMapsLink(locationText) ? (
                    <a
                      href={locationText}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                      title="View on Google Maps"
                    >
                      <FaMapMarkerAlt /> View Map
                    </a>
                  ) : (
                    locationText || "—"
                  )}
                </td>
              );
            }
            if (col === "notes") {
              // Display the count of notes
              return <td key={col} className="border px-3 py-2">{(task.notes || []).length}</td>;
            }
            if (col === "amount") {
              const key = `${task.id}-amount`;
              // Render input field if in edit mode, otherwise display amount
              return (
                <td key={col} className="border px-3 py-2 text-right">
                  {editMode ? (
                    <input
                      type="number"
                      value={editedValues[key] ?? task.customFields?.amount ?? 0} // Use edited value or task value
                      onChange={(e) => handleInputChange(task.id, "amount", Number(e.target.value))}
                      onBlur={() => handleBlur(task.id, "amount")}
                      className="w-24 border rounded px-2"
                    />
                  ) : (
                    `₹${task.customFields?.amount ?? 0}`
                  )}
                </td>
              );
            }
            if (col === "amountReceived") {
              const key = `${task.id}-amountReceived`;
              // Render input field if in edit mode, otherwise display amount received
              return (
                <td key={col} className="border px-3 py-2 text-right">
                  {editMode ? (
                    <input
                      type="number"
                      value={editedValues[key] ?? task.customFields?.amountReceived ?? 0}
                      onChange={(e) => handleInputChange(task.id, "amountReceived", Number(e.target.value))}
                      onBlur={() => handleBlur(task.id, "amountReceived")}
                      className="w-24 border rounded px-2"
                    />
                  ) : (
                    `₹${task.customFields?.amountReceived ?? 0}`
                  )}
                </td>
              );
            }
            if (col === "pendingAmount") {
              // Calculate pending amount
              const amount = editedValues[`${task.id}-amount`] ?? task.customFields?.amount ?? 0;
              const amountReceived = editedValues[`${task.id}-amountReceived`] ?? task.customFields?.amountReceived ?? 0;
              const pending = amount - amountReceived;
              const key = `${task.id}-pendingAmount`; // Key for pending amount if it were editable

              // Render input field if in edit mode, otherwise display pending amount
              // Note: Typically pending amount is derived, not directly editable, but included for consistency
              return (
                <td key={col} className="border px-3 py-2 text-right">
                  {editMode ? (
                    <input
                      type="number"
                      value={editedValues[key] ?? pending} // Use edited value or calculated pending
                      onChange={(e) => handleInputChange(task.id, "pendingAmount", Number(e.target.value))}
                      onBlur={() => handleBlur(task.id, "pendingAmount")}
                      className="w-24 border rounded px-2"
                      readOnly // Make it read-only as it's a derived field
                    />
                  ) : (
                    `₹${pending}`
                  )}
                </td>
              );
            }
            // Fallback for any unhandled columns
            return <td key={col} className="border px-3 py-2">—</td>;
          })}
        </tr>
      ))}
    </tbody>
  );
};
