import { CheckCircle, X, Clock, MapPin, Activity, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Attendance {
  id: string;
  userId: string;
  employeeName?: string;
  checkIn?: string;
  checkOut?: string;
  workingHours?: number;
  overtimeHours?: number;
  date: string; // Normalized to YYYY-MM-DD
  status?: string;
  remarks?: string;
  location?: any;
}

interface AttendanceAnalyticsTableProps {
  month?: string;
  all?: boolean;
}

export default function AttendanceAnalyticsTable({ month: propMonth, all = false }: AttendanceAnalyticsTableProps) {
  const [month, setMonth] = useState<string>(() => {
    if (propMonth) return propMonth;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [data, setData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    if (propMonth) setMonth(propMonth);
  }, [propMonth]);

  useEffect(() => {
    const fetchMonthData = async () => {
      setLoading(true);
      try {
        const url = `/api/attendance/list?month=${month}${all ? "&all=true" : ""}`;
        const res = await fetch(url);
        const json = await res.json();
        if (Array.isArray(json)) {
          const normalized = json.map((r: any) => {
            const d = new Date(r.date);
            const yyyy = d.getUTCFullYear();
            const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
            const dd = String(d.getUTCDate()).padStart(2, "0");
            return { ...r, date: `${yyyy}-${mm}-${dd}` };
          });
          setData(normalized);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error("Failed to load analytics:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMonthData();
  }, [month, all]);

  const grouped = data.reduce((acc: any, row) => {
    if (!row.date.startsWith(month)) return acc;

    const userId = row.userId;
    const name = row.employeeName || "Unknown";
    
    if (!acc[userId]) {
      acc[userId] = {
        userId: userId,
        employee: name,
        daysPresent: 0,
        daysLate: 0,
        daysEarlyLeave: 0,
        totalHours: 0,
        totalOvertime: 0,
        records: []
      };
    }

    acc[userId].records.push(row);
    if (row.status === "Present" || !row.status) {
      acc[userId].daysPresent++;
    }

    const checkIn = row.checkIn ? new Date(row.checkIn) : null;
    const checkOut = row.checkOut ? new Date(row.checkOut) : null;

    if (checkIn) {
      const istCheckIn = new Date(checkIn.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      if (istCheckIn.getHours() > 10 || (istCheckIn.getHours() === 10 && istCheckIn.getMinutes() > 15)) {
        acc[userId].daysLate++;
      }
    }

    if (checkOut) {
      const istCheckOut = new Date(checkOut.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      if (istCheckOut.getHours() < 19) {
        acc[userId].daysEarlyLeave++;
      }
    }

    if (row.workingHours) acc[userId].totalHours += row.workingHours;
    if (row.overtimeHours) acc[userId].totalOvertime += row.overtimeHours;

    return acc;
  }, {});

  const summary = Object.values(grouped).sort((a: any, b: any) => b.daysPresent - a.daysPresent);

  function formatHours(hours?: number): string {
    if (hours == null) return "-";
    const totalMinutes = Math.round(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins}m`;
  }

  function formatTimeIST(dateStr?: string) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata"
    });
  }

  return (
    <div className="space-y-6">
      {/* Month Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Attendance Analytics</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Monthly performance & salary insights</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <Calendar size={18} className="text-indigo-500 ml-2" />
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none pr-2"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Employee</th>
                  <th className="p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Days Present</th>
                  <th className="p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Late Days</th>
                  <th className="p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Early Leave</th>
                  <th className="p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Work Hours</th>
                  <th className="p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Overtime</th>
                  <th className="p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400 font-bold">No records found for this month.</td>
                  </tr>
                ) : (
                  summary.map((row: any, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-all group">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs border border-indigo-100">
                            {row.employee.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-900">{row.employee}</p>
                            <p className="text-[10px] font-bold text-slate-400">ID: {row.userId.slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full font-black text-xs border border-emerald-100">
                          {row.daysPresent} Days
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <span className={`font-black text-xs ${row.daysLate > 3 ? 'text-rose-500' : 'text-slate-600'}`}>
                          {row.daysLate}
                        </span>
                      </td>
                      <td className="p-5 text-center font-black text-xs text-slate-600">{row.daysEarlyLeave}</td>
                      <td className="p-5 text-center font-black text-xs text-slate-900">{formatHours(row.totalHours)}</td>
                      <td className="p-5 text-center">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full font-black text-xs border border-indigo-100">
                          {formatHours(row.totalOvertime)}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <button
                          onClick={() => setSelectedUser(row)}
                          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                        >
                          Deep Report
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deep Report Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-[24px] bg-indigo-600 flex items-center justify-center text-white text-xl font-black border-4 border-white shadow-xl">
                    {selectedUser.employee.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{selectedUser.employee}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Attendance Lifecycle Trail · {month}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-rose-500 transition-all shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Present Days", val: selectedUser.daysPresent, color: "emerald", icon: CheckCircle },
                    { label: "Late Entries", val: selectedUser.daysLate, color: "rose", icon: Clock },
                    { label: "Net Work Hours", val: formatHours(selectedUser.totalHours), color: "indigo", icon: Activity },
                    { label: "Total Overtime", val: formatHours(selectedUser.totalOvertime), color: "blue", icon: TrendingUp }
                  ].map((s, i) => (
                    <div key={i} className={`p-5 rounded-[32px] bg-${s.color}-50 border border-${s.color}-100`}>
                      <div className="flex items-center justify-between mb-2">
                        <s.icon size={20} className={`text-${s.color}-500`} />
                      </div>
                      <p className={`text-2xl font-black text-${s.color}-700`}>{s.val}</p>
                      <p className={`text-[10px] font-black text-${s.color}-500 uppercase tracking-widest mt-1`}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Detailed Logs */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={18} className="text-indigo-500" />
                    Daily Lifecycle Logs
                  </h4>
                  <div className="bg-slate-50/50 rounded-[32px] border border-slate-100 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-white">
                          <th className="p-4 text-left font-black text-slate-400 uppercase tracking-widest">Date</th>
                          <th className="p-4 text-center font-black text-slate-400 uppercase tracking-widest">Check In</th>
                          <th className="p-4 text-center font-black text-slate-400 uppercase tracking-widest">Check Out</th>
                          <th className="p-4 text-center font-black text-slate-400 uppercase tracking-widest">Duration</th>
                          <th className="p-4 text-left font-black text-slate-400 uppercase tracking-widest">Location/Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedUser.records.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((rec: any, i: number) => (
                          <tr key={i} className="hover:bg-white transition-all">
                            <td className="p-4 font-black text-slate-700">
                              {new Date(rec.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="p-4 text-center">
                              <span className="px-3 py-1 bg-slate-100 rounded-lg font-bold text-slate-600">
                                {formatTimeIST(rec.checkIn)}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="px-3 py-1 bg-slate-100 rounded-lg font-bold text-slate-600">
                                {formatTimeIST(rec.checkOut)}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="font-black text-indigo-600">{formatHours(rec.workingHours)}</span>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                {rec.location && (
                                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                    <MapPin size={10} className="text-indigo-400" />
                                    {typeof rec.location === 'string' ? rec.location : (rec.location.address || 'Location Saved')}
                                  </div>
                                )}
                                <p className="text-[10px] text-slate-500 italic font-medium">{rec.remarks || rec.checkInReason || "-"}</p>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 italic">
                  * Lifecycle trails are automatically logged based on biometric/device verification.
                </p>
                <button
                  onClick={() => window.print()}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
                >
                  Export Deep Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
