import AttendanceTable from "../components/AttendanceTable";

export default function AttendancePage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">📋 Attendance Records</h1>
      <AttendanceTable />
    </div>
  );
}
