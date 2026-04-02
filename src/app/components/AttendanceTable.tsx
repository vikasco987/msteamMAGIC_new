"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import MonthlyAttendanceTable from "./MonthlyAttendanceTable";
import AttendanceAnalyticsTable from "./AttendanceAnalyticsTable";
import AttendancePivotTable from "./AttendancePivotTable";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  CheckCircle,
  XCircle,
  Clock,
  UserMinus,
  ArrowUpCircle,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface Attendance {
  id: string;
  userId: string;
  employeeName?: string;
  faceImage?: string;
  location?: any;
  deviceInfo?: string;
  checkIn?: string;
  checkOut?: string;
  checkInReason?: string;
  checkOutReason?: string;
  date: string;
  status?: string;
  verified?: boolean;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

interface AttendanceTableProps {
  all?: boolean;
}

// -------------------- Helpers --------------------
function formatDateMinusOne(dateString?: string): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    date.setDate(date.getDate() - 1);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return dateString;
  }
}

function formatTime(dateString?: string): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return dateString;
  }
}

// Convert ISO string to local "datetime-local" input value (IST)
// Convert UTC ISO string → "YYYY-MM-DDTHH:mm" in IST for datetime-local input
function toLocalInputValue(isoStr?: string): string {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "";
  // sv-SE locale gives "YYYY-MM-DD HH:mm:ss" in the given timezone
  const istStr = d.toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" });
  return istStr.slice(0, 16).replace(" ", "T"); // Convert to "YYYY-MM-DDTHH:mm"
}

// Convert datetime-local input value (IST) back to UTC ISO string
function fromLocalInputValue(localStr: string): string {
  if (!localStr) return "";
  // Append IST offset (+05:30) so Date.parse treats it as IST, not local browser time
  return new Date(localStr + ":00+05:30").toISOString();
}

function formatDecimalHours(decimalHours?: number): string {
  if (decimalHours == null) return "-";
  const hrs = Math.floor(decimalHours);
  const mins = Math.round((decimalHours - hrs) * 60);
  if (hrs && mins) return `${hrs} hr ${mins} min`;
  if (hrs) return `${hrs} hr`;
  if (mins) return `${mins} min`;
  return "0 min";
}

function calculateLateBy(checkIn?: string): string {
  if (!checkIn) return "-";
  const actualCheckIn = new Date(checkIn);
  const officeStart = new Date(checkIn);
  officeStart.setHours(10, 0, 0, 0);
  if (actualCheckIn <= officeStart) return "On Time";
  const diffMs = actualCheckIn.getTime() - officeStart.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (hrs && mins) return `${hrs} hr ${mins} min`;
  if (hrs) return `${hrs} hr`;
  if (mins) return `${mins} min`;
  return "-";
}

function calculateWorkingHours(checkIn?: string, checkOut?: string): number {
  if (!checkIn || !checkOut) return 0;
  const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (diffMs <= 0) return 0;
  return Math.max(0, diffMs / (1000 * 60 * 60) - 1);
}

function calculateOvertime(checkIn?: string, checkOut?: string): number {
  const hours = calculateWorkingHours(checkIn, checkOut);
  return hours > 8 ? hours - 8 : 0;
}

// -------------------- Edit Modal --------------------
function EditAttendanceModal({
  record,
  onClose,
  onSaved,
}: {
  record: Attendance;
  onClose: () => void;
  onSaved: (updated: Attendance) => void;
}) {
  const [checkIn, setCheckIn] = useState(toLocalInputValue(record.checkIn));
  const [checkOut, setCheckOut] = useState(toLocalInputValue(record.checkOut));
  const [checkInReason, setCheckInReason] = useState(record.checkInReason || "");
  const [checkOutReason, setCheckOutReason] = useState(record.checkOutReason || "");
  const [status, setStatus] = useState(record.status || "");
  const [verified, setVerified] = useState(record.verified ?? false);
  const [remarks, setRemarks] = useState(record.remarks || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/attendance/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceId: record.id,
          checkIn: checkIn ? fromLocalInputValue(checkIn) : null,
          checkOut: checkOut ? fromLocalInputValue(checkOut) : null,
          checkInReason,
          checkOutReason,
          status,
          verified,
          remarks,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }
      const data = await res.json();
      toast.success("Attendance updated!");
      onSaved(data.attendance);
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-700">
          <div>
            <h2 className="text-white font-bold text-base tracking-tight">Edit Attendance</h2>
            <p className="text-slate-300 text-xs mt-0.5">{record.employeeName || record.userId} · {formatDateMinusOne(record.date)}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Check In (IST)</label>
              <input
                type="datetime-local"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 bg-slate-50"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Check Out (IST)</label>
              <input
                type="datetime-local"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Check-In Reason</label>
              <input
                value={checkInReason}
                onChange={(e) => setCheckInReason(e.target.value)}
                placeholder="Entry reason..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 bg-slate-50"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Check-Out Reason</label>
              <input
                value={checkOutReason}
                onChange={(e) => setCheckOutReason(e.target.value)}
                placeholder="Exit reason..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 bg-slate-50"
              >
                <option value="">-- Select --</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Half-Day">Half-Day</option>
                <option value="Leave">Leave</option>
                <option value="Unverified">Unverified</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Verified</label>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => setVerified(true)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${verified ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50'}`}
                >
                  ✓ Verified
                </button>
                <button
                  onClick={() => setVerified(false)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!verified ? 'bg-red-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-red-50'}`}
                >
                  ✗ Pending
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add admin remarks..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 bg-slate-50 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button onClick={onClose} className="px-5 py-2 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-slate-800 transition">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition shadow-lg disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// -------------------- Component --------------------
export default function AttendanceTable({ all = false }: AttendanceTableProps) {
  const { user, isLoaded } = useUser();
  const [data, setData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"daily" | "monthly" | "analytics" | "pivot">("daily");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);

  // Check if master/admin
  const role = (user?.publicMetadata?.role as string || "").toUpperCase();
  const isMasterOrAdmin = role === "MASTER" || role === "ADMIN";

  useEffect(() => {
    if (view !== "daily") return;
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const url = `/api/attendance/list?date=${selectedDate}${all ? "&all=true" : ""}`;
        const res = await fetch(url);
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } catch (err) {
        console.error("Failed to load attendance:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [selectedDate, view, all]);

  const handleRecordSaved = (updated: Attendance) => {
    setData((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
  };

  const handleDeleteRecord = async (attendanceId: string, employeeName: string) => {
    if (!confirm(`Are you sure you want to completely delete the attendance record for ${employeeName}?`)) return;
    
    try {
      const res = await fetch("/api/attendance/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceId }),
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Attendance deleted successfully");
      setData((prev) => prev.filter((r) => r.id !== attendanceId));
    } catch (err) {
      toast.error("Failed to delete attendance record");
      console.error(err);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
          Attendance Dashboard 📅
        </h1>
        <div className="flex items-center gap-4 flex-wrap">
          {view === "daily" && (
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-[180px]"
            />
          )}
          <Select value={view} onValueChange={(value: any) => setView(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily View</SelectItem>
              <SelectItem value="monthly">Monthly View</SelectItem>
              <SelectItem value="analytics">Analytics View</SelectItem>
              <SelectItem value="pivot">Pivot View</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => window.print()}>Export</Button>
        </div>
      </div>

      {loading && view === "daily" ? (
        <div className="flex items-center justify-center p-12">
          <svg
            className="animate-spin h-8 w-8 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="ml-4 text-gray-600">Loading attendance...</p>
        </div>
      ) : (
        <motion.div
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {view === "monthly" ? (
            <MonthlyAttendanceTable month={selectedDate.slice(0, 7)} all={all} />
          ) : view === "analytics" ? (
            <AttendanceAnalyticsTable month={selectedDate.slice(0, 7)} all={all} />
          ) : view === "pivot" ? (
            <AttendancePivotTable month={selectedDate.slice(0, 7)} all={all} />
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto relative">
                <table className="min-w-full text-sm divide-y divide-gray-200">
                  <thead className="sticky top-0 bg-gray-100 shadow-sm z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Check In</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Check Out</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Late By</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Working Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Overtime</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</th>
                      {isMasterOrAdmin && (
                        <th className="px-6 py-3 text-center text-xs font-semibold text-indigo-600 uppercase tracking-wider">Edit</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={isMasterOrAdmin ? 11 : 10} className="px-6 py-4 text-center text-sm text-gray-500">
                          No attendance records found for {selectedDate}.
                        </td>
                      </tr>
                    ) : (
                      data.map((row) => {
                        const workingHrs = calculateWorkingHours(row.checkIn, row.checkOut);
                        const overtime = calculateOvertime(row.checkIn, row.checkOut);
                        const lateBy = calculateLateBy(row.checkIn);
                        return (
                          <tr key={row.id} className="odd:bg-white even:bg-gray-50 hover:bg-indigo-50/30 transition-colors duration-150 group">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {row.employeeName || row.userId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDateMinusOne(row.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                              {formatTime(row.checkIn)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                              {row.checkOut ? (
                                <span className="text-gray-700">{formatTime(row.checkOut)}</span>
                              ) : (
                                <span className="text-amber-500 font-bold text-xs bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">Working...</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {lateBy !== "On Time" && lateBy !== "-" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <Clock className="w-3 h-3" />
                                  {lateBy}
                                </span>
                              ) : lateBy === "On Time" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3" />
                                  On Time
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-[120px] truncate" title={row.checkInReason || row.checkOutReason || ""}>
                              {row.checkInReason || row.checkOutReason || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center justify-start gap-2">
                                {row.status === "Present" && <CheckCircle className="text-green-500 w-4 h-4 shrink-0" />}
                                {row.status === "Absent" && <XCircle className="text-red-500 w-4 h-4 shrink-0" />}
                                {row.status === "Half-Day" && <UserMinus className="text-orange-500 w-4 h-4 shrink-0" />}
                                {row.status === "Leave" && <XCircle className="text-yellow-500 w-4 h-4 shrink-0" />}
                                {row.status === "Unverified" && <Clock className="text-red-400 w-4 h-4 shrink-0" />}
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                  row.status === "Present" ? "bg-green-100 text-green-800" :
                                  row.status === "Leave" ? "bg-yellow-100 text-yellow-800" :
                                  row.status === "Half-Day" ? "bg-orange-100 text-orange-800" :
                                  row.status === "Unverified" ? "bg-red-100 text-red-700" :
                                  "bg-gray-100 text-gray-700"
                                }`}>
                                  {row.status || "N/A"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                workingHrs >= 8 ? "bg-green-100 text-green-800" :
                                workingHrs > 0 ? "bg-orange-100 text-orange-800" :
                                "bg-gray-100 text-gray-500"
                              }`}>
                                {formatDecimalHours(workingHrs)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                              {overtime > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <ArrowUpCircle className="w-3 h-3" />
                                  {formatDecimalHours(overtime)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-[120px]">
                              <span title={row.remarks}>
                                {row.remarks && row.remarks.length > 20
                                  ? `${row.remarks.slice(0, 20)}...`
                                  : row.remarks || "-"}
                              </span>
                            </td>
                            {isMasterOrAdmin && (
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => setEditingRecord(row)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                                    title="Edit Attendance"
                                  >
                                    <Pencil size={11} />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRecord(row.id, row.employeeName || row.userId)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                                    title="Delete Attendance"
                                  >
                                    <Trash2 size={11} />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingRecord && (
          <EditAttendanceModal
            record={editingRecord}
            onClose={() => setEditingRecord(null)}
            onSaved={handleRecordSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
