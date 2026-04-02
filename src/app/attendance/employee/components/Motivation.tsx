// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useUser, useAuth } from "@clerk/nextjs";

// interface RankedEmployee {
//   userId?: string;
//   employeeName: string;
//   daysPresent: number;
//   daysLate: number;
//   earlyLeaves: number;
//   earlyArrival: number;
//   overtimeHours: number;
//   score: number;
//   rank: number;
//   medal?: string;
// }

// // helpers
// const pad = (n: number) => String(n).padStart(2, "0");

// function formatHours(decimal?: number) {
//   if (!decimal || decimal <= 0) return "0h";
//   const hrs = Math.floor(decimal);
//   const mins = Math.round((decimal - hrs) * 60);
//   const parts: string[] = [];
//   if (hrs) parts.push(`${hrs}h`);
//   if (mins) parts.push(`${mins}m`);
//   return parts.join(" ");
// }

// function getMedalEmoji(rank: number) {
//   if (rank === 1) return "🥇";
//   if (rank === 2) return "🥈";
//   if (rank === 3) return "🥉";
//   return "";
// }

// export default function Motivation() {
//   const { user, isLoaded } = useUser();
//   const { getToken } = useAuth();

//   const [month, setMonth] = useState(() => {
//     const now = new Date();
//     return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
//   });

//   const [loading, setLoading] = useState(false);
//   const [data, setData] = useState<RankedEmployee[]>([]);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!isLoaded || !user) return;
//     fetchData(month);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isLoaded, user?.id, month]);

//   async function fetchData(monthParam: string) {
//     setLoading(true);
//     setError(null);
//     try {
//       const token = await getToken();
//       const qs = monthParam ? `?month=${encodeURIComponent(monthParam)}` : "";
//       const res = await fetch(`/api/attendance/employeerank${qs}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!res.ok) {
//         const txt = await res.text();
//         throw new Error(txt || `HTTP ${res.status}`);
//       }
//       const json = (await res.json()) as any[];

//       // Defensive normalization
//       const normalized: RankedEmployee[] = (Array.isArray(json) ? json : []).map((it, idx) => ({
//         userId: it.userId,
//         employeeName: it.employeeName || "Unknown",
//         daysPresent: Number(it.daysPresent ?? 0) || 0,
//         daysLate: Number(it.daysLate ?? 0) || 0,
//         earlyLeaves: Number(it.earlyLeaves ?? 0) || 0,
//         earlyArrival: Number(it.earlyArrival ?? (Number(it.daysPresent ?? 0) - Number(it.daysLate ?? 0) - Number(it.earlyLeaves ?? 0))) || 0,
//         overtimeHours: Math.round((Number(it.overtimeHours ?? 0) + Number.EPSILON) * 100) / 100,
//         score: Math.round((Number(it.score ?? 0) + Number.EPSILON) * 100) / 100,
//         rank: Number(it.rank ?? (idx + 1)),
//         medal: it.medal || getMedalEmoji(Number(it.rank ?? (idx + 1))),
//       }));

//       setData(normalized);
//     } catch (err: any) {
//       console.error("Failed to fetch ranking:", err);
//       setError(err?.message || "Failed to fetch");
//       setData([]);
//     } finally {
//       setLoading(false);
//     }
//   }

//   // derived lists for top categories
//   const topConsistency = useMemo(() => [...data].sort((a, b) => b.daysPresent - a.daysPresent).slice(0, 3), [data]);
//   const topEarly = useMemo(() => [...data].sort((a, b) => b.earlyArrival - a.earlyArrival).slice(0, 3), [data]);
//   const topOvertime = useMemo(() => [...data].sort((a, b) => b.overtimeHours - a.overtimeHours).slice(0, 3), [data]);

//   const totals = useMemo(() => {
//     return data.reduce(
//       (acc, r) => {
//         acc.totalEmployees += 1;
//         acc.sumDaysPresent += r.daysPresent;
//         acc.sumOvertime += r.overtimeHours;
//         acc.sumLate += r.daysLate;
//         return acc;
//       },
//       { totalEmployees: 0, sumDaysPresent: 0, sumOvertime: 0, sumLate: 0 }
//     );
//   }, [data]);

//   return (
//     <div className="p-4 bg-gray-50 min-h-screen">
//       <h1 className="text-2xl font-bold mb-4">Employee Ranking Dashboard 🏆</h1>

//       <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <div className="flex items-center gap-3">
//           <label className="font-semibold text-gray-700">Select Month:</label>
//           <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded p-2" />
//         </div>

//         <div className="flex items-center gap-4">
//           <div className="bg-white p-3 rounded shadow text-center">
//             <div className="text-sm text-gray-500">Employees</div>
//             <div className="text-xl font-bold">{totals.totalEmployees}</div>
//           </div>
//           <div className="bg-white p-3 rounded shadow text-center">
//             <div className="text-sm text-gray-500">Avg Days Present</div>
//             <div className="text-xl font-bold">
//               {totals.totalEmployees ? (totals.sumDaysPresent / totals.totalEmployees).toFixed(2) : "0.00"}
//             </div>
//           </div>
//           <div className="bg-white p-3 rounded shadow text-center">
//             <div className="text-sm text-gray-500">Total Overtime</div>
//             <div className="text-xl font-bold">{formatHours(totals.sumOvertime)}</div>
//           </div>
//         </div>
//       </div>

//       {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

//       {loading ? (
//         <div className="text-center p-12 bg-white rounded shadow-lg">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
//           <p>Loading employee records...</p>
//         </div>
//       ) : (
//         <>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//             <div className="bg-white rounded-lg shadow p-4">
//               <h3 className="text-lg font-semibold mb-3">Most Consistent</h3>
//               {topConsistency.length === 0 ? <p className="text-gray-500">No data</p> : (
//                 <ol className="space-y-2">
//                   {topConsistency.map((r, i) => (
//                     <li key={r.employeeName} className="flex items-center justify-between">
//                       <div className="flex items-center gap-3">
//                         <span className="text-2xl">{getMedalEmoji(i + 1)}</span>
//                         <span className="font-medium">{r.employeeName}</span>
//                       </div>
//                       <div className="text-sm text-gray-600">{r.daysPresent} days</div>
//                     </li>
//                   ))}
//                 </ol>
//               )}
//             </div>

//             <div className="bg-white rounded-lg shadow p-4">
//               <h3 className="text-lg font-semibold mb-3">Early Birds</h3>
//               {topEarly.length === 0 ? <p className="text-gray-500">No data</p> : (
//                 <ol className="space-y-2">
//                   {topEarly.map((r, i) => (
//                     <li key={r.employeeName} className="flex items-center justify-between">
//                       <div className="flex items-center gap-3">
//                         <span className="text-2xl">{getMedalEmoji(i + 1)}</span>
//                         <span className="font-medium">{r.employeeName}</span>
//                       </div>
//                       <div className="text-sm text-gray-600">{r.earlyArrival} early</div>
//                     </li>
//                   ))}
//                 </ol>
//               )}
//             </div>

//             <div className="bg-white rounded-lg shadow p-4">
//               <h3 className="text-lg font-semibold mb-3">Overtime Heroes</h3>
//               {topOvertime.length === 0 ? <p className="text-gray-500">No data</p> : (
//                 <ol className="space-y-2">
//                   {topOvertime.map((r, i) => (
//                     <li key={r.employeeName} className="flex items-center justify-between">
//                       <div className="flex items-center gap-3">
//                         <span className="text-2xl">{getMedalEmoji(i + 1)}</span>
//                         <span className="font-medium">{r.employeeName}</span>
//                       </div>
//                       <div className="text-sm text-gray-600">{formatHours(r.overtimeHours)}</div>
//                     </li>
//                   ))}
//                 </ol>
//               )}
//             </div>
//           </div>

//           <div className="overflow-x-auto bg-white rounded-xl shadow-xl border border-gray-200">
//             <table className="min-w-full text-sm">
//               <thead className="bg-gray-50 sticky top-0 z-10">
//                 <tr className="text-gray-600 uppercase font-semibold tracking-wider">
//                   <th className="px-4 py-3 border-b text-center">Rank</th>
//                   <th className="px-4 py-3 border-b text-left">Employee</th>
//                   <th className="px-4 py-3 border-b text-center">Days Present</th>
//                   <th className="px-4 py-3 border-b text-center">Days Late</th>
//                   <th className="px-4 py-3 border-b text-center">Early Arrivals</th>
//                   <th className="px-4 py-3 border-b text-center">Overtime</th>
//                   <th className="px-4 py-3 border-b text-center">Score</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {data.map((rec) => {
//                   const highlight = rec.rank <= 3 ? "bg-yellow-50" : rec.rank % 2 === 0 ? "bg-gray-50" : "bg-white";
//                   return (
//                     <tr key={`${rec.employeeName}-${rec.rank}`} className={`${highlight} transition`}>
//                       <td className="px-4 py-3 border-b text-center font-bold text-purple-600">{getMedalEmoji(rec.rank)} {rec.rank}</td>
//                       <td className="px-4 py-3 border-b">{rec.employeeName}</td>
//                       <td className="px-4 py-3 border-b text-center">{rec.daysPresent}</td>
//                       <td className="px-4 py-3 border-b text-center">{rec.daysLate}</td>
//                       <td className="px-4 py-3 border-b text-center">{rec.earlyArrival}</td>
//                       <td className="px-4 py-3 border-b text-center">{formatHours(rec.overtimeHours)}</td>
//                       <td className="px-4 py-3 border-b text-center font-semibold text-blue-600">{rec.score}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }












// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useUser, useAuth } from "@clerk/nextjs";

// interface RankedEmployee {
//   userId?: string;
//   employeeName: string;
//   daysPresent: number;
//   daysLate: number;
//   earlyLeaves: number;
//   earlyArrival: number;
//   totalWorkingHours: number;
//   overtimeHours: number;
//   score: number;
//   rank: number;
//   medal?: string;
// }

// // helpers
// const pad = (n: number) => String(n).padStart(2, "0");

// function formatHours(decimal?: number) {
//   if (!decimal || decimal <= 0) return "0h";
//   const hrs = Math.floor(decimal);
//   const mins = Math.round((decimal - hrs) * 60);
//   const parts: string[] = [];
//   if (hrs) parts.push(`${hrs}h`);
//   if (mins) parts.push(`${mins}m`);
//   return parts.join(" ");
// }

// function getMedalEmoji(rank: number) {
//   if (rank === 1) return "🥇";
//   if (rank === 2) return "🥈";
//   if (rank === 3) return "🥉";
//   return "";
// }

// export default function Motivation() {
//   const { user, isLoaded } = useUser();
//   const { getToken } = useAuth();

//   const [month, setMonth] = useState(() => {
//     const now = new Date();
//     return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
//   });

//   const [loading, setLoading] = useState(false);
//   const [data, setData] = useState<RankedEmployee[]>([]);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!isLoaded || !user) return;
//     fetchData(month);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isLoaded, user?.id, month]);

//   async function fetchData(monthParam: string) {
//     setLoading(true);
//     setError(null);
//     try {
//       const token = await getToken();
//       const qs = monthParam ? `?month=${encodeURIComponent(monthParam)}` : "";
//       const res = await fetch(`/api/attendance/employeerank${qs}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!res.ok) {
//         const txt = await res.text();
//         throw new Error(txt || `HTTP ${res.status}`);
//       }
//       const json = (await res.json()) as any[];

//       // Defensive normalization
//       const normalized: RankedEmployee[] = (Array.isArray(json) ? json : []).map((it, idx) => ({
//         userId: it.userId,
//         employeeName: it.employeeName || "Unknown",
//         daysPresent: Number(it.daysPresent ?? 0),
//         daysLate: Number(it.daysLate ?? 0),
//         earlyLeaves: Number(it.earlyLeaves ?? 0),
//         earlyArrival: Number(it.earlyArrival ?? 0),
//         totalWorkingHours: Math.round((Number(it.totalWorkingHours ?? 0) + Number.EPSILON) * 100) / 100,
//         overtimeHours: Math.round((Number(it.overtimeHours ?? 0) + Number.EPSILON) * 100) / 100,
//         score: Math.round((Number(it.score ?? 0) + Number.EPSILON) * 100) / 100,
//         rank: Number(it.rank ?? (idx + 1)),
//         medal: it.medal || getMedalEmoji(Number(it.rank ?? (idx + 1))),
//       }));

//       setData(normalized);
//     } catch (err: any) {
//       console.error("Failed to fetch ranking:", err);
//       setError(err?.message || "Failed to fetch");
//       setData([]);
//     } finally {
//       setLoading(false);
//     }
//   }

//   // derived lists for top categories
//   const topConsistency = useMemo(() => [...data].sort((a, b) => b.daysPresent - a.daysPresent).slice(0, 3), [data]);
//   const topEarly = useMemo(() => [...data].sort((a, b) => b.earlyArrival - a.earlyArrival).slice(0, 3), [data]);
//   const topOvertime = useMemo(() => [...data].sort((a, b) => b.overtimeHours - a.overtimeHours).slice(0, 3), [data]);

//   const totals = useMemo(() => {
//     return data.reduce(
//       (acc, r) => {
//         acc.totalEmployees += 1;
//         acc.sumDaysPresent += r.daysPresent;
//         acc.sumOvertime += r.overtimeHours;
//         acc.sumTotalHours += r.totalWorkingHours;
//         acc.sumLate += r.daysLate;
//         return acc;
//       },
//       { totalEmployees: 0, sumDaysPresent: 0, sumOvertime: 0, sumTotalHours: 0, sumLate: 0 }
//     );
//   }, [data]);

//   return (
//     <div className="p-4 bg-gray-50 min-h-screen">
//       <h1 className="text-2xl font-bold mb-4">Employee Ranking Dashboard 🏆</h1>

//       <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <div className="flex items-center gap-3">
//           <label className="font-semibold text-gray-700">Select Month:</label>
//           <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded p-2" />
//         </div>

//         <div className="flex items-center gap-4">
//           <div className="bg-white p-3 rounded shadow text-center">
//             <div className="text-sm text-gray-500">Employees</div>
//             <div className="text-xl font-bold">{totals.totalEmployees}</div>
//           </div>
//           <div className="bg-white p-3 rounded shadow text-center">
//             <div className="text-sm text-gray-500">Avg Days Present</div>
//             <div className="text-xl font-bold">
//               {totals.totalEmployees ? (totals.sumDaysPresent / totals.totalEmployees).toFixed(2) : "0.00"}
//             </div>
//           </div>
//           <div className="bg-white p-3 rounded shadow text-center">
//             <div className="text-sm text-gray-500">Total Hours Worked</div>
//             <div className="text-xl font-bold">{formatHours(totals.sumTotalHours)}</div>
//           </div>
//           <div className="bg-white p-3 rounded shadow text-center">
//             <div className="text-sm text-gray-500">Total Overtime</div>
//             <div className="text-xl font-bold">{formatHours(totals.sumOvertime)}</div>
//           </div>
//         </div>
//       </div>

//       {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

//       {loading ? (
//         <div className="text-center p-12 bg-white rounded shadow-lg">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
//           <p>Loading employee records...</p>
//         </div>
//       ) : (
//         <>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//             <div className="bg-white rounded-lg shadow p-4">
//               <h3 className="text-lg font-semibold mb-3">Most Consistent</h3>
//               {topConsistency.length === 0 ? <p className="text-gray-500">No data</p> : (
//                 <ol className="space-y-2">
//                   {topConsistency.map((r, i) => (
//                     <li key={r.employeeName} className="flex items-center justify-between">
//                       <div className="flex items-center gap-3">
//                         <span className="text-2xl">{getMedalEmoji(i + 1)}</span>
//                         <span className="font-medium">{r.employeeName}</span>
//                       </div>
//                       <div className="text-sm text-gray-600">{r.daysPresent} days</div>
//                     </li>
//                   ))}
//                 </ol>
//               )}
//             </div>

//             <div className="bg-white rounded-lg shadow p-4">
//               <h3 className="text-lg font-semibold mb-3">Early Birds</h3>
//               {topEarly.length === 0 ? <p className="text-gray-500">No data</p> : (
//                 <ol className="space-y-2">
//                   {topEarly.map((r, i) => (
//                     <li key={r.employeeName} className="flex items-center justify-between">
//                       <div className="flex items-center gap-3">
//                         <span className="text-2xl">{getMedalEmoji(i + 1)}</span>
//                         <span className="font-medium">{r.employeeName}</span>
//                       </div>
//                       <div className="text-sm text-gray-600">{r.earlyArrival} early</div>
//                     </li>
//                   ))}
//                 </ol>
//               )}
//             </div>

//             <div className="bg-white rounded-lg shadow p-4">
//               <h3 className="text-lg font-semibold mb-3">Overtime Heroes</h3>
//               {topOvertime.length === 0 ? <p className="text-gray-500">No data</p> : (
//                 <ol className="space-y-2">
//                   {topOvertime.map((r, i) => (
//                     <li key={r.employeeName} className="flex items-center justify-between">
//                       <div className="flex items-center gap-3">
//                         <span className="text-2xl">{getMedalEmoji(i + 1)}</span>
//                         <span className="font-medium">{r.employeeName}</span>
//                       </div>
//                       <div className="text-sm text-gray-600">{formatHours(r.overtimeHours)}</div>
//                     </li>
//                   ))}
//                 </ol>
//               )}
//             </div>
//           </div>

//           <div className="overflow-x-auto bg-white rounded-xl shadow-xl border border-gray-200">
//             <table className="min-w-full text-sm">
//               <thead className="bg-gray-50 sticky top-0 z-10">
//                 <tr className="text-gray-600 uppercase font-semibold tracking-wider">
//                   <th className="px-4 py-3 border-b text-center">Rank</th>
//                   <th className="px-4 py-3 border-b text-left">Employee</th>
//                   <th className="px-4 py-3 border-b text-center">Days Present</th>
//                   <th className="px-4 py-3 border-b text-center">Days Late</th>
//                   <th className="px-4 py-3 border-b text-center">Early Arrivals</th>
//                   <th className="px-4 py-3 border-b text-center">Total Hours</th>
//                   <th className="px-4 py-3 border-b text-center">Overtime</th>
//                   <th className="px-4 py-3 border-b text-center">Score</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {data.map((rec) => {
//                   const highlight = rec.rank <= 3 ? "bg-yellow-50" : rec.rank % 2 === 0 ? "bg-gray-50" : "bg-white";
//                   return (
//                     <tr key={`${rec.employeeName}-${rec.rank}`} className={`${highlight} transition`}>
//                       <td className="px-4 py-3 border-b text-center font-bold text-purple-600">{getMedalEmoji(rec.rank)} {rec.rank}</td>
//                       <td className="px-4 py-3 border-b">{rec.employeeName}</td>
//                       <td className="px-4 py-3 border-b text-center">{rec.daysPresent}</td>
//                       <td className="px-4 py-3 border-b text-center">{rec.daysLate}</td>
//                       <td className="px-4 py-3 border-b text-center">{rec.earlyArrival}</td>
//                       <td className="px-4 py-3 border-b text-center">{formatHours(rec.totalWorkingHours)}</td>
//                       <td className="px-4 py-3 border-b text-center">{formatHours(rec.overtimeHours)}</td>
//                       <td className="px-4 py-3 border-b text-center font-semibold text-blue-600">{rec.score}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }





































// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useUser, useAuth } from "@clerk/nextjs";

// interface RankedEmployee {
//   userId?: string;
//   employeeName: string;
//   daysPresent: number;
//   daysLate: number;
//   earlyLeaves: number;
//   earlyArrival: number;
//   totalWorkingHours: number;
//   overtimeHours: number;
//   score: number;
//   rank: number;
//   medal?: string;
//   attendancePercent?: number;
// }

// // helpers
// const pad = (n: number) => String(n).padStart(2, "0");

// function formatHours(decimal?: number) {
//   if (!decimal || decimal <= 0) return "0h";
//   const hrs = Math.floor(decimal);
//   const mins = Math.round((decimal - hrs) * 60);
//   const parts: string[] = [];
//   if (hrs) parts.push(`${hrs}h`);
//   if (mins) parts.push(`${mins}m`);
//   return parts.join(" ");
// }

// function getMedalEmoji(rank: number) {
//   if (rank === 1) return "🥇";
//   if (rank === 2) return "🥈";
//   if (rank === 3) return "🥉";
//   return "";
// }

// export default function Motivation() {
//   const { user, isLoaded } = useUser();
//   const { getToken } = useAuth();

//   const [month, setMonth] = useState(() => {
//     const now = new Date();
//     return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
//   });

//   const [loading, setLoading] = useState(false);
//   const [data, setData] = useState<RankedEmployee[]>([]);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!isLoaded || !user) return;
//     fetchData(month);
//   }, [isLoaded, user?.id, month]);

//   async function fetchData(monthParam: string) {
//     setLoading(true);
//     setError(null);
//     try {
//       const token = await getToken();
//       const qs = monthParam ? `?month=${encodeURIComponent(monthParam)}` : "";
//       const res = await fetch(`/api/attendance/employeerank${qs}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!res.ok) {
//         const txt = await res.text();
//         throw new Error(txt || `HTTP ${res.status}`);
//       }
//       const json = (await res.json()) as any[];

//       // calculate days till today in the selected month
//       const [year, monthStr] = monthParam.split("-");
//       const currentDate = new Date();
//       const selectedMonth = Number(monthStr) - 1;
//       const selectedYear = Number(year);
//       const daysTillToday =
//         selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth()
//           ? currentDate.getDate()
//           : new Date(selectedYear, selectedMonth + 1, 0).getDate();

//       const normalized: RankedEmployee[] = (Array.isArray(json) ? json : []).map((it, idx) => {
//         const daysPresent = Number(it.daysPresent ?? 0);
//         const absentDays = Math.max(daysTillToday - daysPresent, 0);
//         const attendancePercent = ((daysTillToday - absentDays) / daysTillToday) * 100;

//         return {
//           userId: it.userId,
//           employeeName: it.employeeName || "Unknown",
//           daysPresent,
//           daysLate: Number(it.daysLate ?? 0),
//           earlyLeaves: Number(it.earlyLeaves ?? 0),
//           earlyArrival: Number(it.earlyArrival ?? 0),
//           totalWorkingHours: Math.round((Number(it.totalWorkingHours ?? 0) + Number.EPSILON) * 100) / 100,
//           overtimeHours: Math.round((Number(it.overtimeHours ?? 0) + Number.EPSILON) * 100) / 100,
//           score: Math.round((Number(it.score ?? 0) + Number.EPSILON) * 100) / 100,
//           rank: Number(it.rank ?? (idx + 1)),
//           medal: it.medal || getMedalEmoji(Number(it.rank ?? (idx + 1))),
//           attendancePercent: Math.round(attendancePercent * 100) / 100, // 2 decimals
//         };
//       });

//       setData(normalized);
//     } catch (err: any) {
//       console.error("Failed to fetch ranking:", err);
//       setError(err?.message || "Failed to fetch");
//       setData([]);
//     } finally {
//       setLoading(false);
//     }
//   }

//   // derived lists for top categories
//   const topConsistency = useMemo(() => [...data].sort((a, b) => b.daysPresent - a.daysPresent).slice(0, 3), [data]);
//   const topEarly = useMemo(() => [...data].sort((a, b) => b.earlyArrival - a.earlyArrival).slice(0, 3), [data]);
//   const topOvertime = useMemo(() => [...data].sort((a, b) => b.overtimeHours - a.overtimeHours).slice(0, 3), [data]);

//   const totals = useMemo(() => {
//     return data.reduce(
//       (acc, r) => {
//         acc.totalEmployees += 1;
//         acc.sumDaysPresent += r.daysPresent;
//         acc.sumOvertime += r.overtimeHours;
//         acc.sumTotalHours += r.totalWorkingHours;
//         acc.sumLate += r.daysLate;
//         return acc;
//       },
//       { totalEmployees: 0, sumDaysPresent: 0, sumOvertime: 0, sumTotalHours: 0, sumLate: 0 }
//     );
//   }, [data]);

//   return (
//     <div className="p-4 bg-gray-50 min-h-screen">
//       <h1 className="text-2xl font-bold mb-4">Employee Ranking Dashboard 🏆</h1>

//       {/* Month Selector + Stats */}
//       <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <div className="flex items-center gap-3">
//           <label className="font-semibold text-gray-700">Select Month:</label>
//           <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded p-2" />
//         </div>

//         <div className="flex items-center gap-4">
//           <div className="bg-white p-3 rounded shadow text-center">
//             <div className="text-sm text-gray-500">Employees</div>
//             <div className="text-xl font-bold">{totals.totalEmployees}</div>
//           </div>
//           <div className="bg-white p-3 rounded shadow text-center">
//             <div className="text-sm text-gray-500">Avg Days Present</div>
//             <div className="text-xl font-bold">
//               {totals.totalEmployees ? (totals.sumDaysPresent / totals.totalEmployees).toFixed(2) : "0.00"}
//             </div>
//           </div>
//           <div className="bg-white p-3 rounded shadow text-center">
//             <div className="text-sm text-gray-500">Total Hours Worked</div>
//             <div className="text-xl font-bold">{formatHours(totals.sumTotalHours)}</div>
//           </div>
//           <div className="bg-white p-3 rounded shadow text-center">
//             <div className="text-sm text-gray-500">Total Overtime</div>
//             <div className="text-xl font-bold">{formatHours(totals.sumOvertime)}</div>
//           </div>
//         </div>
//       </div>

//       {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

//       {loading ? (
//         <div className="text-center p-12 bg-white rounded shadow-lg">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
//           <p>Loading employee records...</p>
//         </div>
//       ) : (
//         <>
//           {/* Top Performers */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//             <div className="bg-white rounded-lg shadow p-4">
//               <h3 className="text-lg font-semibold mb-3">Most Consistent</h3>
//               {topConsistency.length === 0 ? <p className="text-gray-500">No data</p> : (
//                 <ol className="space-y-2">
//                   {topConsistency.map((r, i) => (
//                     <li key={r.employeeName} className="flex items-center justify-between">
//                       <div className="flex items-center gap-3">
//                         <span className="text-2xl">{getMedalEmoji(i + 1)}</span>
//                         <span className="font-medium">{r.employeeName}</span>
//                       </div>
//                       <div className="text-sm text-gray-600">{r.daysPresent} days</div>
//                     </li>
//                   ))}
//                 </ol>
//               )}
//             </div>

//             <div className="bg-white rounded-lg shadow p-4">
//               <h3 className="text-lg font-semibold mb-3">Early Birds</h3>
//               {topEarly.length === 0 ? <p className="text-gray-500">No data</p> : (
//                 <ol className="space-y-2">
//                   {topEarly.map((r, i) => (
//                     <li key={r.employeeName} className="flex items-center justify-between">
//                       <div className="flex items-center gap-3">
//                         <span className="text-2xl">{getMedalEmoji(i + 1)}</span>
//                         <span className="font-medium">{r.employeeName}</span>
//                       </div>
//                       <div className="text-sm text-gray-600">{r.earlyArrival} early</div>
//                     </li>
//                   ))}
//                 </ol>
//               )}
//             </div>

//             <div className="bg-white rounded-lg shadow p-4">
//               <h3 className="text-lg font-semibold mb-3">Overtime Heroes</h3>
//               {topOvertime.length === 0 ? <p className="text-gray-500">No data</p> : (
//                 <ol className="space-y-2">
//                   {topOvertime.map((r, i) => (
//                     <li key={r.employeeName} className="flex items-center justify-between">
//                       <div className="flex items-center gap-3">
//                         <span className="text-2xl">{getMedalEmoji(i + 1)}</span>
//                         <span className="font-medium">{r.employeeName}</span>
//                       </div>
//                       <div className="text-sm text-gray-600">{formatHours(r.overtimeHours)}</div>
//                     </li>
//                   ))}
//                 </ol>
//               )}
//             </div>
//           </div>

//           {/* Ranking Table */}
//           <div className="overflow-x-auto bg-white rounded-xl shadow-xl border border-gray-200">
//             <table className="min-w-full text-sm">
//               <thead className="bg-gray-50 sticky top-0 z-10">
//                 <tr className="text-gray-600 uppercase font-semibold tracking-wider">
//                   <th className="px-4 py-3 border-b text-center">Rank</th>
//                   <th className="px-4 py-3 border-b text-left">Employee</th>
//                   <th className="px-4 py-3 border-b text-center">Days Present</th>
//                   <th className="px-4 py-3 border-b text-center">Attendance %</th>
//                   <th className="px-4 py-3 border-b text-center">Days Late</th>
//                   <th className="px-4 py-3 border-b text-center">Early Arrivals</th>
//                   <th className="px-4 py-3 border-b text-center">Total Hours</th>
//                   <th className="px-4 py-3 border-b text-center">Overtime</th>
//                   <th className="px-4 py-3 border-b text-center">Score</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {data.map((rec) => {
//                   const highlight = rec.rank <= 3 ? "bg-yellow-50" : rec.rank % 2 === 0 ? "bg-gray-50" : "bg-white";
//                   return (
//                     <tr key={`${rec.employeeName}-${rec.rank}`} className={`${highlight} transition`}>
//                       <td className="px-4 py-3 border-b text-center font-bold text-purple-600">
//                         {getMedalEmoji(rec.rank)} {rec.rank}
//                       </td>
//                       <td className="px-4 py-3 border-b">{rec.employeeName}</td>
//                       <td className="px-4 py-3 border-b text-center">{rec.daysPresent}</td>
//                       <td className="px-4 py-3 border-b text-center text-green-600 font-semibold">
//                         {rec.attendancePercent?.toFixed(2)}%
//                       </td>
//                       <td className="px-4 py-3 border-b text-center">{rec.daysLate}</td>
//                       <td className="px-4 py-3 border-b text-center">{rec.earlyArrival}</td>
//                       <td className="px-4 py-3 border-b text-center">{formatHours(rec.totalWorkingHours)}</td>
//                       <td className="px-4 py-3 border-b text-center">{formatHours(rec.overtimeHours)}</td>
//                       <td className="px-4 py-3 border-b text-center font-semibold text-blue-600">{rec.score}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }







// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useUser, useAuth } from "@clerk/nextjs";

// interface RankedEmployee {
//   userId?: string;
//   employeeName: string;
//   daysPresent: number;
//   daysLate: number;
//   earlyLeaves: number;
//   earlyArrival: number;
//   totalWorkingHours: number;
//   overtimeHours: number;
//   score: number;
//   rank: number;
//   medal?: string;
//   attendancePercent?: number;
// }

// const pad = (n: number) => String(n).padStart(2, "0");

// function formatHours(decimal?: number) {
//   if (!decimal || decimal <= 0) return "0h";
//   const hrs = Math.floor(decimal);
//   const mins = Math.round((decimal - hrs) * 60);
//   const parts: string[] = [];
//   if (hrs) parts.push(`${hrs}h`);
//   if (mins) parts.push(`${mins}m`);
//   return parts.join(" ");
// }

// function getMedalEmoji(rank: number) {
//   if (rank === 1) return "🥇";
//   if (rank === 2) return "🥈";
//   if (rank === 3) return "🥉";
//   return "";
// }

// export default function Motivation() {
//   const { user, isLoaded } = useUser();
//   const { getToken } = useAuth();

//   const [month, setMonth] = useState(() => {
//     const now = new Date();
//     return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
//   });
//   const [loading, setLoading] = useState(false);
//   const [data, setData] = useState<RankedEmployee[]>([]);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!isLoaded || !user) return;
//     fetchData(month);
//   }, [isLoaded, user?.id, month]);

//   async function fetchData(monthParam: string) {
//     setLoading(true);
//     setError(null);
//     try {
//       const token = await getToken();
//       const qs = monthParam ? `?month=${encodeURIComponent(monthParam)}` : "";
//       const res = await fetch(`/api/attendance/employeerank${qs}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
//       const json = (await res.json()) as any[];

//       const [year, monthStr] = monthParam.split("-");
//       const currentDate = new Date();
//       const selectedMonth = Number(monthStr) - 1;
//       const selectedYear = Number(year);
//       const daysTillToday =
//         selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth()
//           ? currentDate.getDate()
//           : new Date(selectedYear, selectedMonth + 1, 0).getDate();

//       const normalized: RankedEmployee[] = (Array.isArray(json) ? json : []).map((it, idx) => {
//         const daysPresent = Number(it.daysPresent ?? 0);
//         const absentDays = Math.max(daysTillToday - daysPresent, 0);
//         const attendancePercent = ((daysTillToday - absentDays) / daysTillToday) * 100;

//         return {
//           userId: it.userId,
//           employeeName: it.employeeName || "Unknown",
//           daysPresent,
//           daysLate: Number(it.daysLate ?? 0),
//           earlyLeaves: Number(it.earlyLeaves ?? 0),
//           earlyArrival: Number(it.earlyArrival ?? 0),
//           totalWorkingHours: Math.round((Number(it.totalWorkingHours ?? 0) + Number.EPSILON) * 100) / 100,
//           overtimeHours: Math.round((Number(it.overtimeHours ?? 0) + Number.EPSILON) * 100) / 100,
//           score: Math.round((Number(it.score ?? 0) + Number.EPSILON) * 100) / 100,
//           rank: Number(it.rank ?? (idx + 1)),
//           medal: it.medal || getMedalEmoji(Number(it.rank ?? (idx + 1))),
//           attendancePercent: Math.round(attendancePercent * 100) / 100,
//         };
//       });

//       setData(normalized);
//     } catch (err: any) {
//       console.error("Failed to fetch ranking:", err);
//       setError(err?.message || "Failed to fetch");
//       setData([]);
//     } finally {
//       setLoading(false);
//     }
//   }

//   const topConsistency = useMemo(() => [...data].sort((a, b) => b.daysPresent - a.daysPresent).slice(0, 3), [data]);
//   const topEarly = useMemo(() => [...data].sort((a, b) => b.earlyArrival - a.earlyArrival).slice(0, 3), [data]);
//   const topOvertime = useMemo(() => [...data].sort((a, b) => b.overtimeHours - a.overtimeHours).slice(0, 3), [data]);

//   const totals = useMemo(() => {
//     return data.reduce(
//       (acc, r) => {
//         acc.totalEmployees += 1;
//         acc.sumDaysPresent += r.daysPresent;
//         acc.sumOvertime += r.overtimeHours;
//         acc.sumTotalHours += r.totalWorkingHours;
//         acc.sumLate += r.daysLate;
//         return acc;
//       },
//       { totalEmployees: 0, sumDaysPresent: 0, sumOvertime: 0, sumTotalHours: 0, sumLate: 0 }
//     );
//   }, [data]);

//   return (
//     <div className="p-4 md:p-8 bg-gradient-to-r from-purple-50 via-pink-50 to-yellow-50 min-h-screen">
//       <h1 className="text-3xl md:text-4xl font-bold mb-6 text-purple-700 text-center md:text-left drop-shadow-md">
//         Employee Ranking Dashboard 🏆
//       </h1>

//       {/* Month Selector + Stats */}
//       <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         {/* Month Picker Fixed on Right */}
//         <div className="flex justify-end md:absolute md:right-8 top-24">
//           <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-lg border border-purple-200">
//             <label className="font-semibold text-purple-700">Select Month:</label>
//             <input
//               type="month"
//               value={month}
//               onChange={(e) => setMonth(e.target.value)}
//               className="border border-purple-300 rounded p-2 focus:ring-2 focus:ring-purple-400"
//             />
//           </div>
//         </div>

//         <div className="flex flex-wrap gap-4 justify-center md:justify-start">
//           {[
//             { label: "Employees", value: totals.totalEmployees, color: "purple-600" },
//             { label: "Avg Days Present", value: totals.totalEmployees ? (totals.sumDaysPresent / totals.totalEmployees).toFixed(2) : "0.00", color: "green-600" },
//             { label: "Total Hours Worked", value: formatHours(totals.sumTotalHours), color: "blue-600" },
//             { label: "Total Overtime", value: formatHours(totals.sumOvertime), color: "red-600" },
//           ].map((stat) => (
//             <div
//               key={stat.label}
//               className={`bg-white p-5 rounded-2xl shadow-xl w-44 text-center hover:scale-105 transition-transform border-t-4 border-${stat.color}`}
//             >
//               <div className="text-sm text-gray-500">{stat.label}</div>
//               <div className={`text-2xl font-bold text-${stat.color}`}>{stat.value}</div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded shadow">{error}</div>}

//       {loading ? (
//         <div className="text-center p-12 bg-white rounded shadow-lg">
//           <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-purple-500 mx-auto mb-4"></div>
//           <p className="text-gray-700 font-medium">Loading employee records...</p>
//         </div>
//       ) : (
//         <>
//           {/* Top Performers */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//             {[
//               { title: "Most Consistent", list: topConsistency, valueKey: "daysPresent", color: "green-500" },
//               { title: "Early Birds", list: topEarly, valueKey: "earlyArrival", color: "yellow-500" },
//               { title: "Overtime Heroes", list: topOvertime, valueKey: "overtimeHours", color: "red-500" },
//             ].map((cat) => (
//               <div
//                 key={cat.title}
//                 className="bg-white rounded-2xl shadow-xl p-6 hover:scale-105 transition-transform relative"
//               >
//                 <h3 className="text-xl font-bold mb-3 text-purple-700">{cat.title}</h3>
//                 {cat.list.length === 0 ? (
//                   <p className="text-gray-400">No data</p>
//                 ) : (
//                   <ol className="space-y-4">
//                     {cat.list.map((r, i) => (
//                       <li
//                         key={r.employeeName}
//                         className={`flex items-center justify-between p-3 rounded-lg shadow-sm ${
//                           i === 0
//                             ? "bg-gradient-to-r from-yellow-200 to-yellow-100 border-2 border-yellow-400"
//                             : "bg-gray-50"
//                         }`}
//                       >
//                         <div className="flex items-center gap-3">
//                           <span className="text-3xl">{getMedalEmoji(i + 1)}</span>
//                           <span className="font-medium">{r.employeeName}</span>
//                         </div>
//                         <div className={`text-lg font-semibold text-${cat.color}`}>
//                           {cat.valueKey === "overtimeHours"
//                             ? formatHours(r[cat.valueKey as keyof RankedEmployee] as number)
//                             : r[cat.valueKey as keyof RankedEmployee]}
//                         </div>
//                       </li>
//                     ))}
//                   </ol>
//                 )}
//               </div>
//             ))}
//           </div>

//           {/* Ranking Table */}
//           <div className="overflow-x-auto bg-white rounded-2xl shadow-2xl border border-gray-200">
//             <table className="min-w-full text-sm md:text-base">
//               <thead className="bg-gradient-to-r from-purple-100 via-pink-100 to-yellow-100 sticky top-0 z-10">
//                 <tr className="text-gray-700 uppercase font-semibold tracking-wider">
//                   {["Rank", "Employee", "Days Present", "Attendance %", "Days Late", "Early Arrivals", "Total Hours", "Overtime", "Score"].map((th) => (
//                     <th key={th} className="px-4 py-3 border-b text-center md:text-left">{th}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {data.map((rec) => {
//                   const highlight =
//                     rec.rank <= 3
//                       ? "bg-gradient-to-r from-yellow-200 to-yellow-100"
//                       : rec.rank % 2 === 0
//                       ? "bg-gray-50"
//                       : "bg-white";
//                   return (
//                     <tr key={`${rec.employeeName}-${rec.rank}`} className={`${highlight} hover:bg-purple-50 transition`}>
//                       <td className="px-4 py-3 border-b text-center font-bold text-purple-600">{getMedalEmoji(rec.rank)} {rec.rank}</td>
//                       <td className="px-4 py-3 border-b">{rec.employeeName}</td>
//                       <td className="px-4 py-3 border-b text-center">{rec.daysPresent}</td>
//                       <td className="px-4 py-3 border-b text-center font-semibold text-green-600">{rec.attendancePercent?.toFixed(2)}%</td>
//                       <td className="px-4 py-3 border-b text-center">{rec.daysLate}</td>
//                       <td className="px-4 py-3 border-b text-center">{rec.earlyArrival}</td>
//                       <td className="px-4 py-3 border-b text-center">{formatHours(rec.totalWorkingHours)}</td>
//                       <td className="px-4 py-3 border-b text-center">{formatHours(rec.overtimeHours)}</td>
//                       <td className="px-4 py-3 border-b text-center font-semibold text-blue-600">{rec.score}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }




























// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useUser, useAuth } from "@clerk/nextjs";

// interface RankedEmployee {
//   userId?: string;
//   employeeName: string;
//   daysPresent: number;
//   daysLate: number;
//   earlyLeaves: number;
//   earlyArrival: number;
//   totalWorkingHours: number;
//   overtimeHours: number;
//   score: number;
//   rank: number;
//   medal?: string;
//   attendancePercent?: number;
// }

// const pad = (n: number) => String(n).padStart(2, "0");

// function formatHours(decimal?: number) {
//   if (!decimal || decimal <= 0) return "0h";
//   const hrs = Math.floor(decimal);
//   const mins = Math.round((decimal - hrs) * 60);
//   return `${hrs ? hrs + "h " : ""}${mins ? mins + "m" : ""}`.trim();
// }

// function getMedalEmoji(rank: number) {
//   if (rank === 1) return "🥇";
//   if (rank === 2) return "🥈";
//   if (rank === 3) return "🥉";
//   return "";
// }

// export default function Motivation() {
//   const { user, isLoaded } = useUser();
//   const { getToken } = useAuth();

//   const [month, setMonth] = useState(() => {
//     const now = new Date();
//     return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
//   });
//   const [loading, setLoading] = useState(false);
//   const [data, setData] = useState<RankedEmployee[]>([]);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!isLoaded || !user) return;
//     fetchData(month);
//   }, [isLoaded, user?.id, month]);

//   async function fetchData(monthParam: string) {
//     setLoading(true);
//     setError(null);
//     try {
//       const token = await getToken();
//       const qs = monthParam ? `?month=${encodeURIComponent(monthParam)}` : "";
//       const res = await fetch(`/api/attendance/employeerank${qs}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
//       const json = (await res.json()) as any[];

//       const [year, monthStr] = monthParam.split("-");
//       const currentDate = new Date();
//       const selectedMonth = Number(monthStr) - 1;
//       const selectedYear = Number(year);
//       const daysTillToday =
//         selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth()
//           ? currentDate.getDate()
//           : new Date(selectedYear, selectedMonth + 1, 0).getDate();

//       const normalized: RankedEmployee[] = (Array.isArray(json) ? json : []).map((it, idx) => {
//         const daysPresent = Number(it.daysPresent ?? 0);
//         const absentDays = Math.max(daysTillToday - daysPresent, 0);
//         const attendancePercent = ((daysTillToday - absentDays) / daysTillToday) * 100;

//         return {
//           userId: it.userId,
//           employeeName: it.employeeName || "Unknown",
//           daysPresent,
//           daysLate: Number(it.daysLate ?? 0),
//           earlyLeaves: Number(it.earlyLeaves ?? 0),
//           earlyArrival: Number(it.earlyArrival ?? 0),
//           totalWorkingHours: Math.round((Number(it.totalWorkingHours ?? 0) + Number.EPSILON) * 100) / 100,
//           overtimeHours: Math.round((Number(it.overtimeHours ?? 0) + Number.EPSILON) * 100) / 100,
//           score: Math.round((Number(it.score ?? 0) + Number.EPSILON) * 100) / 100,
//           rank: Number(it.rank ?? (idx + 1)),
//           medal: it.medal || getMedalEmoji(Number(it.rank ?? (idx + 1))),
//           attendancePercent: Math.round(attendancePercent * 100) / 100,
//         };
//       });

//       setData(normalized);
//     } catch (err: any) {
//       console.error("Failed to fetch ranking:", err);
//       setError(err?.message || "Failed to fetch");
//       setData([]);
//     } finally {
//       setLoading(false);
//     }
//   }

//   const topConsistency = useMemo(() => [...data].sort((a, b) => b.daysPresent - a.daysPresent).slice(0, 3), [data]);
//   const topEarly = useMemo(() => [...data].sort((a, b) => b.earlyArrival - a.earlyArrival).slice(0, 3), [data]);
//   const topOvertime = useMemo(() => [...data].sort((a, b) => b.overtimeHours - a.overtimeHours).slice(0, 3), [data]);

//   const totals = useMemo(() => {
//     return data.reduce(
//       (acc, r) => {
//         acc.totalEmployees += 1;
//         acc.sumDaysPresent += r.daysPresent;
//         acc.sumOvertime += r.overtimeHours;
//         acc.sumTotalHours += r.totalWorkingHours;
//         acc.sumLate += r.daysLate;
//         return acc;
//       },
//       { totalEmployees: 0, sumDaysPresent: 0, sumOvertime: 0, sumTotalHours: 0, sumLate: 0 }
//     );
//   }, [data]);

//   const topCategories = [
//     { title: "Most Consistent", list: topConsistency, valueKey: "daysPresent", color: "green-500", icon: "⏱️" },
//     { title: "Early Birds", list: topEarly, valueKey: "earlyArrival", color: "yellow-500", icon: "🌅" },
//     { title: "Overtime Heroes", list: topOvertime, valueKey: "overtimeHours", color: "red-500", icon: "💪" },
//   ];

//   const gradientColors = ["from-yellow-200 via-yellow-100 to-yellow-50", "from-green-200 via-green-100 to-green-50", "from-blue-200 via-blue-100 to-blue-50"];

//   return (
//     <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Employee Ranking Dashboard 🏆</h1>
//         <div className="flex items-center gap-2 bg-white p-2 rounded shadow-sm border border-gray-200">
//           <label className="font-medium text-gray-700 text-sm">Month:</label>
//           <input
//             type="month"
//             value={month}
//             onChange={(e) => setMonth(e.target.value)}
//             className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400"
//           />
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//         {[
//           { label: "Employees", value: totals.totalEmployees, color: "purple-600" },
//           { label: "Avg Days Present", value: totals.totalEmployees ? (totals.sumDaysPresent / totals.totalEmployees).toFixed(2) : "0.00", color: "green-600" },
//           { label: "Total Hours Worked", value: formatHours(totals.sumTotalHours), color: "blue-600" },
//           { label: "Total Overtime", value: formatHours(totals.sumOvertime), color: "red-600" },
//         ].map((stat) => (
//           <div
//             key={stat.label}
//             className={`bg-white p-4 rounded-lg shadow hover:shadow-md transition-all border-t-4 border-${stat.color} text-center`}
//           >
//             <div className="text-xs text-gray-500">{stat.label}</div>
//             <div className={`text-lg md:text-xl font-bold text-${stat.color}`}>{stat.value}</div>
//           </div>
//         ))}
//       </div>

//       {error && <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}

//       {loading ? (
//         <div className="text-center p-6 bg-white rounded shadow">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-blue-500 mx-auto mb-2"></div>
//           <p className="text-gray-700 text-sm font-medium">Loading employee records...</p>
//         </div>
//       ) : (
//         <>
//           {/* Top Performers */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//             {topCategories.map((cat, idx) => (
//               <div
//                 key={cat.title}
//                 className={`bg-gradient-to-r ${gradientColors[idx]} rounded-lg shadow p-4 hover:scale-105 transition-transform border-2 border-${cat.color}`}
//               >
//                 <h3 className="text-sm md:text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
//                   <span className="text-lg">{cat.icon}</span> {cat.title}
//                 </h3>
//                 {cat.list.length === 0 ? (
//                   <p className="text-gray-600 text-sm">No data</p>
//                 ) : (
//                   <ol className="space-y-2 text-sm">
//                     {cat.list.map((r, i) => (
//                       <li
//                         key={r.employeeName}
//                         className="flex items-center justify-between p-2 bg-white/70 rounded shadow-sm border border-gray-100 hover:shadow-md transition"
//                       >
//                         <div className="flex items-center gap-2">
//                           <span className="text-base">{getMedalEmoji(i + 1)}</span>
//                           <span className="font-medium text-gray-800">{r.employeeName}</span>
//                         </div>
//                         <div className={`text-sm font-bold text-${cat.color}`}>
//                           {cat.valueKey === "overtimeHours"
//                             ? formatHours(r[cat.valueKey as keyof RankedEmployee] as number)
//                             : r[cat.valueKey as keyof RankedEmployee]}
//                         </div>
//                       </li>
//                     ))}
//                   </ol>
//                 )}
//               </div>
//             ))}
//           </div>

//           {/* Ranking Table */}
//           <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
//             <table className="min-w-full text-xs md:text-sm">
//               <thead className="bg-gray-100 sticky top-0 z-10">
//                 <tr className="text-gray-700 uppercase font-medium tracking-wide">
//                   {["Rank", "Employee", "Days Present", "Attendance %", "Days Late", "Early Arrivals", "Total Hours", "Overtime", "Score"].map((th) => (
//                     <th key={th} className="px-2 py-2 border-b text-center md:text-left">{th}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {data.map((rec) => {
//                   let highlightBg = "";
//                   let textColor = "";
//                   if (rec.rank === 1) { highlightBg = "bg-yellow-100"; textColor = "text-yellow-700"; }
//                   else if (rec.rank === 2) { highlightBg = "bg-green-100"; textColor = "text-green-700"; }
//                   else if (rec.rank === 3) { highlightBg = "bg-blue-100"; textColor = "text-blue-700"; }
//                   else highlightBg = rec.rank % 2 === 0 ? "bg-gray-50" : "bg-white";

//                   return (
//                     <tr key={`${rec.employeeName}-${rec.rank}`} className={`${highlightBg} hover:bg-purple-50 transition`}>
//                       <td className={`px-2 py-2 border-b text-center font-semibold ${textColor}`}>{getMedalEmoji(rec.rank)} {rec.rank}</td>
//                       <td className={`px-2 py-2 border-b font-medium ${rec.rank <= 3 ? textColor : "text-gray-800"}`}>{rec.employeeName}</td>
//                       <td className={`px-2 py-2 border-b text-center ${rec.rank <= 3 ? textColor : ""}`}>{rec.daysPresent}</td>
//                       <td className={`px-2 py-2 border-b text-center font-semibold ${rec.rank <= 3 ? textColor : "text-green-600"}`}>{rec.attendancePercent?.toFixed(2)}%</td>
//                       <td className={`px-2 py-2 border-b text-center ${rec.rank <= 3 ? textColor : ""}`}>{rec.daysLate}</td>
//                       <td className={`px-2 py-2 border-b text-center ${rec.rank <= 3 ? textColor : ""}`}>{rec.earlyArrival}</td>
//                       <td className={`px-2 py-2 border-b text-center ${rec.rank <= 3 ? textColor : ""}`}>{formatHours(rec.totalWorkingHours)}</td>
//                       <td className={`px-2 py-2 border-b text-center ${rec.rank <= 3 ? textColor : ""}`}>{formatHours(rec.overtimeHours)}</td>
//                       <td className={`px-2 py-2 border-b text-center font-semibold ${rec.rank <= 3 ? textColor : "text-blue-600"}`}>{rec.score}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }
















"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";

interface RankedEmployee {
  userId?: string;
  employeeName: string;
  daysPresent: number;
  daysLate: number;
  earlyLeaves: number;
  earlyArrival: number;
  halfDays?: number; // New field
  totalWorkingHours: number;
  overtimeHours: number;
  score: number;
  rank: number;
  medal?: string;
  attendancePercent?: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

function formatHours(decimal?: number) {
  if (!decimal || decimal <= 0) return "0h";
  const hrs = Math.floor(decimal);
  const mins = Math.round((decimal - hrs) * 60);
  return `${hrs ? hrs + "h " : ""}${mins ? mins + "m" : ""}`.trim();
}

function getMedalEmoji(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
}

export default function Motivation() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RankedEmployee[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetchData(month);
  }, [isLoaded, user?.id, month]);

  async function fetchData(monthParam: string) {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const qs = monthParam ? `?month=${encodeURIComponent(monthParam)}` : "";
      const res = await fetch(`/api/attendance/employeerank${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
      const json = (await res.json()) as any[];

      const [year, monthStr] = monthParam.split("-");
      const currentDate = new Date();
      const selectedMonth = Number(monthStr) - 1;
      const selectedYear = Number(year);
      const daysTillToday =
        selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth()
          ? currentDate.getDate()
          : new Date(selectedYear, selectedMonth + 1, 0).getDate();

      const normalized: RankedEmployee[] = (Array.isArray(json) ? json : []).map((it, idx) => {
        const daysPresent = Number(it.daysPresent ?? 0);
        const absentDays = Math.max(daysTillToday - daysPresent, 0);
        const attendancePercent = ((daysTillToday - absentDays) / daysTillToday) * 100;

        return {
          userId: it.userId,
          employeeName: it.employeeName || "Unknown",
          daysPresent,
          halfDays: Number(it.halfDays ?? 0), // new field
          daysLate: Number(it.daysLate ?? 0),
          earlyLeaves: Number(it.earlyLeaves ?? 0),
          earlyArrival: Number(it.earlyArrival ?? 0),
          totalWorkingHours: Math.round((Number(it.totalWorkingHours ?? 0) + Number.EPSILON) * 100) / 100,
          overtimeHours: Math.round((Number(it.overtimeHours ?? 0) + Number.EPSILON) * 100) / 100,
          score: Math.round((Number(it.score ?? 0) + Number.EPSILON) * 100) / 100,
          rank: Number(it.rank ?? (idx + 1)),
          medal: it.medal || getMedalEmoji(Number(it.rank ?? (idx + 1))),
          attendancePercent: Math.round(attendancePercent * 100) / 100,
        };
      });

      setData(normalized);
    } catch (err: any) {
      console.error("Failed to fetch ranking:", err);
      setError(err?.message || "Failed to fetch");
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  const topConsistency = useMemo(() => [...data].sort((a, b) => b.daysPresent - a.daysPresent).slice(0, 3), [data]);
  const topEarly = useMemo(() => [...data].sort((a, b) => b.earlyArrival - a.earlyArrival).slice(0, 3), [data]);
  const topOvertime = useMemo(() => [...data].sort((a, b) => b.overtimeHours - a.overtimeHours).slice(0, 3), [data]);

  const totals = useMemo(() => {
    return data.reduce(
      (acc, r) => {
        acc.totalEmployees += 1;
        acc.sumDaysPresent += r.daysPresent;
        acc.sumOvertime += r.overtimeHours;
        acc.sumTotalHours += r.totalWorkingHours;
        acc.sumLate += r.daysLate;
        return acc;
      },
      { totalEmployees: 0, sumDaysPresent: 0, sumOvertime: 0, sumTotalHours: 0, sumLate: 0 }
    );
  }, [data]);

  const topCategories = [
    { title: "Most Consistent", list: topConsistency, valueKey: "daysPresent", color: "green-500", icon: "⏱️" },
    { title: "Early Birds", list: topEarly, valueKey: "earlyArrival", color: "yellow-500", icon: "🌅" },
    { title: "Overtime Heroes", list: topOvertime, valueKey: "overtimeHours", color: "red-500", icon: "💪" },
  ];

  const gradientColors = ["from-yellow-200 via-yellow-100 to-yellow-50", "from-green-200 via-green-100 to-green-50", "from-blue-200 via-blue-100 to-blue-50"];

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Employee Ranking Dashboard 🏆</h1>
        <div className="flex items-center gap-2 bg-white p-2 rounded shadow-sm border border-gray-200">
          <label className="font-medium text-gray-700 text-sm">Month:</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Employees", value: totals.totalEmployees, color: "purple-600" },
          { label: "Avg Days Present", value: totals.totalEmployees ? (totals.sumDaysPresent / totals.totalEmployees).toFixed(2) : "0.00", color: "green-600" },
          { label: "Total Hours Worked", value: formatHours(totals.sumTotalHours), color: "blue-600" },
          { label: "Total Overtime", value: formatHours(totals.sumOvertime), color: "red-600" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-white p-4 rounded-lg shadow hover:shadow-md transition-all border-t-4 border-${stat.color} text-center`}
          >
            <div className="text-xs text-gray-500">{stat.label}</div>
            <div className={`text-lg md:text-xl font-bold text-${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {error && <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}

      {loading ? (
        <div className="text-center p-6 bg-white rounded shadow">
          <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-700 text-sm font-medium">Loading employee records...</p>
        </div>
      ) : (
        <>
          {/* Top Performers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {topCategories.map((cat, idx) => (
              <div
                key={cat.title}
                className={`bg-gradient-to-r ${gradientColors[idx]} rounded-lg shadow p-4 hover:scale-105 transition-transform border-2 border-${cat.color}`}
              >
                <h3 className="text-sm md:text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
                  <span className="text-lg">{cat.icon}</span> {cat.title}
                </h3>
                {cat.list.length === 0 ? (
                  <p className="text-gray-600 text-sm">No data</p>
                ) : (
                  <ol className="space-y-2 text-sm">
                    {cat.list.map((r, i) => (
                      <li
                        key={r.employeeName}
                        className="flex items-center justify-between p-2 bg-white/70 rounded shadow-sm border border-gray-100 hover:shadow-md transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{getMedalEmoji(i + 1)}</span>
                          <span className="font-medium text-gray-800">{r.employeeName}</span>
                        </div>
                        <div className={`text-sm font-bold text-${cat.color}`}>
                          {cat.valueKey === "overtimeHours"
                            ? formatHours(r[cat.valueKey as keyof RankedEmployee] as number)
                            : r[cat.valueKey as keyof RankedEmployee]}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>

          {/* Ranking Table */}
          <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
            <table className="min-w-full text-xs md:text-sm">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr className="text-gray-700 uppercase font-medium tracking-wide">
                  {["Rank", "Employee", "Days Present", "Half Days", "Attendance %", "Days Late", "Early Arrivals", "Total Hours", "Overtime", "Score"].map((th) => (
                    <th key={th} className="px-2 py-2 border-b text-center md:text-left">{th}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((rec) => {
                  let highlightBg = "";
                  let textColor = "";
                  if (rec.rank === 1) { highlightBg = "bg-yellow-100"; textColor = "text-yellow-700"; }
                  else if (rec.rank === 2) { highlightBg = "bg-green-100"; textColor = "text-green-700"; }
                  else if (rec.rank === 3) { highlightBg = "bg-blue-100"; textColor = "text-blue-700"; }
                  else highlightBg = rec.rank % 2 === 0 ? "bg-gray-50" : "bg-white";

                  return (
                    <tr key={`${rec.employeeName}-${rec.rank}`} className={`${highlightBg} hover:bg-purple-50 transition`}>
                      <td className={`px-2 py-2 border-b text-center font-semibold ${textColor}`}>{getMedalEmoji(rec.rank)} {rec.rank}</td>
                      <td className={`px-2 py-2 border-b font-medium ${rec.rank <= 3 ? textColor : "text-gray-800"}`}>{rec.employeeName}</td>
                      <td className={`px-2 py-2 border-b text-center ${rec.rank <= 3 ? textColor : ""}`}>{rec.daysPresent}</td>
                      <td className={`px-2 py-2 border-b text-center ${rec.rank <= 3 ? textColor : ""}`}>{rec.halfDays ?? 0}</td>
                      <td className={`px-2 py-2 border-b text-center font-semibold ${rec.rank <= 3 ? textColor : "text-green-600"}`}>{rec.attendancePercent?.toFixed(2)}%</td>
                      <td className={`px-2 py-2 border-b text-center ${rec.rank <= 3 ? textColor : ""}`}>{rec.daysLate}</td>
                      <td className={`px-2 py-2 border-b text-center ${rec.rank <= 3 ? textColor : ""}`}>{rec.earlyArrival}</td>
                      <td className={`px-2 py-2 border-b text-center ${rec.rank <= 3 ? textColor : ""}`}>{formatHours(rec.totalWorkingHours)}</td>
                      <td className={`px-2 py-2 border-b text-center ${rec.rank <= 3 ? textColor : ""}`}>{formatHours(rec.overtimeHours)}</td>
                      <td className={`px-2 py-2 border-b text-center font-semibold ${rec.rank <= 3 ? textColor : "text-blue-600"}`}>{rec.score}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
