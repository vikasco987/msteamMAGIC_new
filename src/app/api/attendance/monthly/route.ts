// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { clerkClient } from "@clerk/nextjs/server";

// // GET /api/attendance/monthly?month=2025-09
// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const month = searchParams.get("month"); // YYYY-MM
//     if (!month) {
//       return NextResponse.json({ error: "Month is required" }, { status: 400 });
//     }

//     const [year, monthNum] = month.split("-").map(Number);
//     const startDate = new Date(year, monthNum - 1, 1);
//     const endDate = new Date(year, monthNum, 0); // last day of month

//     // fetch attendance records for that month
//     const records = await prisma.attendance.findMany({
//       where: {
//         date: { gte: startDate, lte: endDate },
//       },
//       orderBy: { date: "asc" },
//     });

//     if (records.length === 0) {
//       return NextResponse.json({
//         headers: ["Employee"],
//         rows: [],
//       });
//     }

//     // unique employees
//     const userIds = [...new Set(records.map(r => r.userId))];

//     // fetch names from Clerk or fallback to DB
//     const userMap = new Map<string, string>();
//     for (const id of userIds) {
//       try {
//         const user = await clerkClient.users.getUser(id);
//         userMap.set(
//           id,
//           `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
//             records.find(r => r.userId === id)?.employeeName ||
//             "Unknown"
//         );
//       } catch {
//         const fallback =
//           records.find(r => r.userId === id)?.employeeName || "Unknown";
//         userMap.set(id, fallback);
//       }
//     }

//     // build headers: Employee + days + Total Hours
//     const daysInMonth = endDate.getDate();
//     const headers = [
//       "Employee",
//       ...Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`),
//       "Total Hours",
//     ];

//     // group by employee
//     const rows = userIds.map(userId => {
//       const empRecords = records.filter(r => r.userId === userId);
//       const row: Record<string, string> = {
//         Employee: userMap.get(userId) || "Unknown",
//       };
//       let totalMinutes = 0;

//       for (let d = 1; d <= daysInMonth; d++) {
//         const day = new Date(year, monthNum - 1, d).toISOString().split("T")[0];
//         const rec = empRecords.find(
//           r => r.date.toISOString().split("T")[0] === day
//         );

//         if (rec) {
//           if (rec.checkIn && rec.checkOut) {
//             row[d.toString()] = "✅";
//           } else {
//             row[d.toString()] = "⏳";
//           }
//           totalMinutes += rec.workingHours || 0;
//         } else {
//           row[d.toString()] = "❌";
//         }
//       }

//       // format hours
//       const hrs = Math.floor(totalMinutes / 60);
//       const mins = totalMinutes % 60;
//       row["Total Hours"] =
//         hrs && mins ? `${hrs} hr ${mins} min` : hrs ? `${hrs} hr` : `${mins} min`;

//       return row;
//     });

//     return NextResponse.json({ headers, rows });
//   } catch (error) {
//     console.error("💥 Monthly attendance failed:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch monthly attendance" },
//       { status: 500 }
//     );
//   }
// }













// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { clerkClient } from "@clerk/nextjs/server";

// // GET /api/attendance/monthly?month=2025-09
// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const month = searchParams.get("month"); // YYYY-MM
//     if (!month) {
//       return NextResponse.json({ error: "Month is required" }, { status: 400 });
//     }

//     const [year, monthNum] = month.split("-").map(Number);
//     const startDate = new Date(year, monthNum - 1, 1);
//     const endDate = new Date(year, monthNum, 0); // last day of month

//     // ✅ fetch attendance records
//     const records = await prisma.attendance.findMany({
//       where: {
//         date: { gte: startDate, lte: endDate },
//       },
//       orderBy: { date: "asc" },
//     });

//     // ✅ fetch ALL users from Clerk (with pagination)
//     const allUsers: any[] = [];
//     let page = 1;
//     while (true) {
//       const res = await clerkClient.users.getUserList({ limit: 100, page });
//       allUsers.push(...res.data);
//       if (!res.hasNextPage) break;
//       page++;
//     }

//     // ✅ create user map
//     const userMap = new Map<string, string>();
//     for (const u of allUsers) {
//       userMap.set(
//         u.id,
//         `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
//           u.emailAddresses[0]?.emailAddress ||
//           "Unknown"
//       );
//     }

//     // ✅ build headers: Employee + days + Total Hours
//     const daysInMonth = endDate.getDate();
//     const headers = [
//       "Employee",
//       ...Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`),
//       "Total Hours",
//     ];

//     // ✅ build rows for *all users*
//     const rows = allUsers.map((user) => {
//       const empRecords = records.filter((r) => r.userId === user.id);
//       const row: Record<string, string> = {
//         Employee: userMap.get(user.id) || "Unknown",
//       };
//       let totalMinutes = 0;

//       for (let d = 1; d <= daysInMonth; d++) {
//         const day = new Date(year, monthNum - 1, d).toISOString().split("T")[0];
//         const rec = empRecords.find(
//           (r) => r.date.toISOString().split("T")[0] === day
//         );

//         if (rec) {
//           if (rec.checkIn && rec.checkOut) {
//             row[d.toString()] = "✅"; // full attendance
//           } else {
//             row[d.toString()] = "⏳"; // partial
//           }
//           totalMinutes += rec.workingHours || 0;
//         } else {
//           row[d.toString()] = "❌"; // absent
//         }
//       }

//       // ✅ format hours
//       const hrs = Math.floor(totalMinutes / 60);
//       const mins = totalMinutes % 60;
//       row["Total Hours"] =
//         hrs && mins
//           ? `${hrs} hr ${mins} min`
//           : hrs
//           ? `${hrs} hr`
//           : `${mins} min`;

//       return row;
//     });

//     return NextResponse.json({ headers, rows });
//   } catch (error) {
//     console.error("💥 Monthly attendance failed:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch monthly attendance" },
//       { status: 500 }
//     );
//   }
// }
















// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { clerkClient } from "@clerk/nextjs/server";

// // GET /api/attendance/monthly?month=2025-09
// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const month = searchParams.get("month"); // YYYY-MM
//     if (!month) {
//       return NextResponse.json({ error: "Month is required" }, { status: 400 });
//     }

//     const [year, monthNum] = month.split("-").map(Number);
//     const startDate = new Date(year, monthNum - 1, 1);
//     const endDate = new Date(year, monthNum, 0); // last day of month

//     // fetch attendance records for that month
//     const records = await prisma.attendance.findMany({
//       where: {
//         date: { gte: startDate, lte: endDate },
//       },
//       orderBy: { date: "asc" },
//     });

//     if (records.length === 0) {
//       return NextResponse.json({
//         headers: ["Employee"],
//         rows: [],
//       });
//     }

//     // unique employees
//     const userIds = [...new Set(records.map(r => r.userId))];

//     // fetch names from Clerk or fallback to DB
//     const userMap = new Map<string, string>();
//     for (const id of userIds) {
//       try {
//         const user = await clerkClient.users.getUser(id);
//         userMap.set(
//           id,
//           `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
//             records.find(r => r.userId === id)?.employeeName ||
//             "Unknown"
//         );
//       } catch {
//         const fallback =
//           records.find(r => r.userId === id)?.employeeName || "Unknown";
//         userMap.set(id, fallback);
//       }
//     }

//     // build headers: Employee + days + Total Hours
//     const daysInMonth = endDate.getDate();
//     const headers = [
//       "Employee",
//       ...Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`),
//       "Total Hours",
//     ];

//     // group by employee
//     const rows = userIds.map(userId => {
//       const empRecords = records.filter(r => r.userId === userId);
//       const row: Record<string, string> = {
//         Employee: userMap.get(userId) || "Unknown",
//       };
//       let totalMinutes = 0;

//       for (let d = 1; d <= daysInMonth; d++) {
//         const day = new Date(year, monthNum - 1, d).toISOString().split("T")[0];
//         const rec = empRecords.find(
//           r => r.date.toISOString().split("T")[0] === day
//         );

//         if (rec) {
//           if (rec.checkIn && rec.checkOut) {
//             row[d.toString()] = "✅";
//           } else {
//             row[d.toString()] = "⏳";
//           }
//           totalMinutes += rec.workingHours || 0;
//         } else {
//           row[d.toString()] = "❌";
//         }
//       }

//       // format hours
//       const hrs = Math.floor(totalMinutes / 60);
//       const mins = totalMinutes % 60;
//       row["Total Hours"] =
//         hrs && mins ? `${hrs} hr ${mins} min` : hrs ? `${hrs} hr` : `${mins} min`;

//       return row;
//     });

//     return NextResponse.json({ headers, rows });
//   } catch (error) {
//     console.error("💥 Monthly attendance failed:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch monthly attendance" },
//       { status: 500 }
//     );
//   }
// }










// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { users } from "@clerk/clerk-sdk-node"; // ✅ use correct import

// // GET /api/attendance/monthly?month=YYYY-MM
// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const month = searchParams.get("month");
//     if (!month) return NextResponse.json({ error: "Month is required" }, { status: 400 });

//     const [year, monthNum] = month.split("-").map(Number);
//     const startDate = new Date(year, monthNum - 1, 1);
//     const endDate = new Date(year, monthNum, 0);

//     // fetch attendance records
//     const records = await prisma.attendance.findMany({
//       where: { date: { gte: startDate, lte: endDate } },
//       orderBy: { date: "asc" },
//     });

//     if (records.length === 0) {
//       return NextResponse.json({ headers: ["Employee"], rows: [] });
//     }

//     // unique userIds
//     const userIds = [...new Set(records.map(r => r.userId))];

//     // fetch names from Clerk
//     const userMap = new Map<string, string>();
//     for (const id of userIds) {
//       try {
//         const user = await users.getUser(id); // ✅ use users.getUser
//         userMap.set(
//           id,
//           `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
//             records.find(r => r.userId === id)?.employeeName ||
//             "Unknown"
//         );
//       } catch {
//         const fallback = records.find(r => r.userId === id)?.employeeName || "Unknown";
//         userMap.set(id, fallback);
//       }
//     }

//     const daysInMonth = endDate.getDate();
//     const headers = ["Employee", ...Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`), "Total Hours"];

//     const rows = userIds.map(userId => {
//       const empRecords = records.filter(r => r.userId === userId);
//       const row: Record<string, string> = { Employee: userMap.get(userId) || "Unknown" };
//       let totalMinutes = 0;

//       for (let d = 1; d <= daysInMonth; d++) {
//         const day = new Date(year, monthNum - 1, d).toISOString().split("T")[0];
//         const rec = empRecords.find(r => r.date.toISOString().split("T")[0] === day);

//         if (rec) {
//           row[d.toString()] = rec.checkIn && rec.checkOut ? "✅" : "⏳";
//           totalMinutes += rec.workingHours || 0;
//         } else {
//           row[d.toString()] = "❌";
//         }
//       }

//       const hrs = Math.floor(totalMinutes / 60);
//       const mins = totalMinutes % 60;
//       row["Total Hours"] = hrs && mins ? `${hrs} hr ${mins} min` : hrs ? `${hrs} hr` : `${mins} min`;

//       return row;
//     });

//     return NextResponse.json({ headers, rows });
//   } catch (error) {
//     console.error("💥 Monthly attendance failed:", error);
//     return NextResponse.json({ error: "Failed to fetch monthly attendance" }, { status: 500 });
//   }
// }





// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { users } from "@clerk/clerk-sdk-node";

// // Helper: format date in IST as YYYY-MM-DD
// function formatDateIST(date: Date) {
//   return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
// }

// // GET /api/attendance/monthly?month=YYYY-MM
// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const month = searchParams.get("month");
//     if (!month) return NextResponse.json({ error: "Month is required" }, { status: 400 });

//     const [year, monthNum] = month.split("-").map(Number);
//     const startDate = new Date(year, monthNum - 1, 1);
//     const endDate = new Date(year, monthNum, 0);

//     // fetch attendance records
//     const records = await prisma.attendance.findMany({
//       where: { date: { gte: startDate, lte: endDate } },
//       orderBy: { date: "asc" },
//     });

//     if (records.length === 0) {
//       return NextResponse.json({ headers: ["Employee"], rows: [] });
//     }

//     // unique userIds
//     const userIds = [...new Set(records.map(r => r.userId))];

//     // fetch names from Clerk
//     const userMap = new Map<string, string>();
//     for (const id of userIds) {
//       try {
//         const user = await users.getUser(id);
//         userMap.set(
//           id,
//           `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
//             records.find(r => r.userId === id)?.employeeName ||
//             "Unknown"
//         );
//       } catch {
//         const fallback = records.find(r => r.userId === id)?.employeeName || "Unknown";
//         userMap.set(id, fallback);
//       }
//     }

//     const daysInMonth = endDate.getDate();
//     const headers = ["Employee", ...Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`), "Total Hours"];

//     const rows = userIds.map(userId => {
//       const empRecords = records.filter(r => r.userId === userId);
//       const row: Record<string, string> = { Employee: userMap.get(userId) || "Unknown" };
//       let totalMinutes = 0;

//       for (let d = 1; d <= daysInMonth; d++) {
//         const day = formatDateIST(new Date(year, monthNum - 1, d));

//         const rec = empRecords.find(r => formatDateIST(r.date) === day);

//         if (rec) {
//           row[d.toString()] = rec.checkIn && rec.checkOut ? "✅" : "⏳";
//           totalMinutes += rec.workingHours || 0;
//         } else {
//           row[d.toString()] = "❌";
//         }
//       }

//       const hrs = Math.floor(totalMinutes / 60);
//       const mins = totalMinutes % 60;
//       row["Total Hours"] = hrs && mins ? `${hrs} hr ${mins} min` : hrs ? `${hrs} hr` : `${mins} min`;

//       return row;
//     });

//     return NextResponse.json({ headers, rows });
//   } catch (error) {
//     console.error("💥 Monthly attendance failed:", error);
//     return NextResponse.json({ error: "Failed to fetch monthly attendance" }, { status: 500 });
//   }
// }



// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { users } from "@clerk/clerk-sdk-node"; // ✅ correct import

// // GET /api/attendance/monthly?month=YYYY-MM
// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const month = searchParams.get("month");
//     if (!month)
//       return NextResponse.json({ error: "Month is required" }, { status: 400 });

//     const [year, monthNum] = month.split("-").map(Number);
//     const startDate = new Date(year, monthNum - 1, 1);
//     const endDate = new Date(year, monthNum, 0);

//     // fetch attendance records
//     const records = await prisma.attendance.findMany({
//       where: { date: { gte: startDate, lte: endDate } },
//       orderBy: { date: "asc" },
//     });

//     if (records.length === 0) {
//       return NextResponse.json({ headers: ["Employee"], rows: [] });
//     }

//     // unique userIds
//     const userIds = [...new Set(records.map((r) => r.userId))];

//     // fetch names from Clerk
//     const userMap = new Map<string, string>();
//     for (const id of userIds) {
//       try {
//         const user = await users.getUser(id);
//         userMap.set(
//           id,
//           `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
//             records.find((r) => r.userId === id)?.employeeName ||
//             "Unknown"
//         );
//       } catch {
//         const fallback =
//           records.find((r) => r.userId === id)?.employeeName || "Unknown";
//         userMap.set(id, fallback);
//       }
//     }

//     const daysInMonth = endDate.getDate();
//     const headers = [
//       "Employee",
//       ...Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`),
//       "Total Hours",
//     ];

//     const rows = userIds.map((userId) => {
//       const empRecords = records.filter((r) => r.userId === userId);
//       const row: Record<string, string> = {
//         Employee: userMap.get(userId) || "Unknown",
//       };
//       let totalMinutes = 0;

//       for (let d = 1; d <= daysInMonth; d++) {
//         const targetDay = new Date(year, monthNum - 1, d);
//         targetDay.setHours(0, 0, 0, 0); // normalize target day (local midnight)

//         const rec = empRecords.find((r) => {
//           const localDay = new Date(r.date);
//           // ✅ convert DB UTC date into local IST date
//           localDay.setMinutes(
//             localDay.getMinutes() - localDay.getTimezoneOffset()
//           );
//           localDay.setHours(0, 0, 0, 0);
//           return localDay.getTime() === targetDay.getTime();
//         });

//         if (rec) {
//           row[d.toString()] =
//             rec.checkIn && rec.checkOut ? "✅" : "⏳";
//           totalMinutes += rec.workingHours || 0;
//         } else {
//           row[d.toString()] = "❌";
//         }
//       }

//       const hrs = Math.floor(totalMinutes / 60);
//       const mins = totalMinutes % 60;
//       row["Total Hours"] =
//         hrs && mins
//           ? `${hrs} hr ${mins} min`
//           : hrs
//           ? `${hrs} hr`
//           : `${mins} min`;

//       return row;
//     });

//     return NextResponse.json({ headers, rows });
//   } catch (error) {
//     console.error("💥 Monthly attendance failed:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch monthly attendance" },
//       { status: 500 }
//     );
//   }
// }






// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { users } from "@clerk/clerk-sdk-node";

// // Helper: convert UTC date to IST date (YYYY-MM-DD)
// function getISTDate(date: Date) {
//   const utc = date.getTime();
//   const istOffset = 5.5 * 60 * 60 * 1000; // IST = UTC+5:30
//   const istTime = new Date(utc + istOffset);
//   istTime.setHours(0, 0, 0, 0); // normalize to midnight
//   return istTime.getTime();
// }

// // GET /api/attendance/monthly?month=YYYY-MM
// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const month = searchParams.get("month");
//     if (!month)
//       return NextResponse.json({ error: "Month is required" }, { status: 400 });

//     const [year, monthNum] = month.split("-").map(Number);
//     const startDate = new Date(year, monthNum - 1, 1);
//     const endDate = new Date(year, monthNum, 0);

//     // fetch attendance records
//     const records = await prisma.attendance.findMany({
//       where: { date: { gte: startDate, lte: endDate } },
//       orderBy: { date: "asc" },
//     });

//     if (records.length === 0) {
//       return NextResponse.json({ headers: ["Employee"], rows: [] });
//     }

//     // unique userIds
//     const userIds = [...new Set(records.map((r) => r.userId))];

//     // fetch names from Clerk
//     const userMap = new Map<string, string>();
//     for (const id of userIds) {
//       try {
//         const user = await users.getUser(id);
//         userMap.set(
//           id,
//           `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
//             records.find((r) => r.userId === id)?.employeeName ||
//             "Unknown"
//         );
//       } catch {
//         const fallback =
//           records.find((r) => r.userId === id)?.employeeName || "Unknown";
//         userMap.set(id, fallback);
//       }
//     }

//     const daysInMonth = endDate.getDate();
//     const headers = [
//       "Employee",
//       ...Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`),
//       "Total Hours",
//     ];

//     const rows = userIds.map((userId) => {
//       const empRecords = records.filter((r) => r.userId === userId);
//       const row: Record<string, string> = {
//         Employee: userMap.get(userId) || "Unknown",
//       };
//       let totalMinutes = 0;

//       for (let d = 1; d <= daysInMonth; d++) {
//         const targetDay = new Date(year, monthNum - 1, d);
//         targetDay.setHours(0, 0, 0, 0); // normalize target day
//         const targetTime = targetDay.getTime();

//         const rec = empRecords.find((r) => {
//           const istTime = getISTDate(r.date);
//           return istTime === targetTime;
//         });

//         if (rec) {
//           row[d.toString()] =
//             rec.checkIn && rec.checkOut ? "✅" : "⏳";
//           totalMinutes += rec.workingHours || 0;
//         } else {
//           row[d.toString()] = "❌";
//         }
//       }

//       const hrs = Math.floor(totalMinutes / 60);
//       const mins = totalMinutes % 60;
//       row["Total Hours"] =
//         hrs && mins
//           ? `${hrs} hr ${mins} min`
//           : hrs
//           ? `${hrs} hr`
//           : `${mins} min`;

//       return row;
//     });

//     return NextResponse.json({ headers, rows });
//   } catch (error) {
//     console.error("💥 Monthly attendance failed:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch monthly attendance" },
//       { status: 500 }
//     );
//   }
// }





// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { users } from "@clerk/clerk-sdk-node";

// // -------------------- Helpers --------------------
// // Hardcoded shift: subtract 1 day from a date
// function shiftDateBackOneDay(date: Date) {
//   const newDate = new Date(date);
//   newDate.setDate(newDate.getDate() - 1);
//   return newDate;
// }

// // Convert UTC date to IST calendar day object
// function getISTDateParts(date: Date) {
//   // Apply hardcoded 1-day shift
//   const shifted = shiftDateBackOneDay(date);

//   const istDate = new Date(shifted.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
//   return {
//     year: istDate.getFullYear(),
//     month: istDate.getMonth() + 1,
//     day: istDate.getDate(),
//   };
// }

// // Compare two IST dates by Y/M/D
// function isSameISTDay(date: Date, year: number, month: number, day: number) {
//   const parts = getISTDateParts(date);
//   return parts.year === year && parts.month === month && parts.day === day;
// }

// // -------------------- API --------------------
// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const month = searchParams.get("month");
//     if (!month) return NextResponse.json({ error: "Month is required" }, { status: 400 });

//     const [year, monthNum] = month.split("-").map(Number);

//     // fetch attendance
//     const records = await prisma.attendance.findMany({
//       where: {
//         date: {
//           gte: new Date(Date.UTC(year, monthNum - 1, 1)),
//           lte: new Date(Date.UTC(year, monthNum, 0, 23, 59, 59)),
//         },
//       },
//       orderBy: { date: "asc" },
//     });

//     if (!records.length) return NextResponse.json({ headers: ["Employee"], rows: [] });

//     // unique userIds
//     const userIds = [...new Set(records.map((r) => r.userId))];

//     // fetch names from Clerk
//     const userMap = new Map<string, string>();
//     for (const id of userIds) {
//       try {
//         const user = await users.getUser(id);
//         userMap.set(
//           id,
//           `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
//             records.find((r) => r.userId === id)?.employeeName ||
//             "Unknown"
//         );
//       } catch {
//         const fallback = records.find((r) => r.userId === id)?.employeeName || "Unknown";
//         userMap.set(id, fallback);
//       }
//     }

//     const daysInMonth = new Date(year, monthNum, 0).getDate();
//     const headers = ["Employee", ...Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`), "Total Hours"];

//     const rows = userIds.map((userId) => {
//       const empRecords = records.filter((r) => r.userId === userId);
//       const row: Record<string, any> = { Employee: userMap.get(userId) || "Unknown" };
//       let totalMinutes = 0;

//       for (let d = 1; d <= daysInMonth; d++) {
//         const rec = empRecords.find((r) => isSameISTDay(r.date, year, monthNum, d));

//         if (rec) {
//           row[d.toString()] = rec.checkIn && rec.checkOut ? "✅" : "⏳";
//           totalMinutes += rec.workingHours || 0;
//         } else {
//           row[d.toString()] = "❌";
//         }
//       }

//       const hrs = Math.floor(totalMinutes / 60);
//       const mins = Math.floor(totalMinutes % 60);
//       row["Total Hours"] = hrs && mins ? `${hrs} hr ${mins} min` : hrs ? `${hrs} hr` : `${mins} min`;

//       return row;
//     });

//     return NextResponse.json({ headers, rows });
//   } catch (error) {
//     console.error("💥 Monthly attendance failed:", error);
//     return NextResponse.json({ error: "Failed to fetch monthly attendance" }, { status: 500 });
//   }
// }































// // File: src/app/api/attendance/monthly/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs";

// // Helper: convert UTC date to IST and normalize to start of day
// function getISTDate(date: Date) {
//   const utc = date.getTime();
//   const istOffset = 5.5 * 60 * 60 * 1000; // IST = UTC+5:30
//   const istTime = new Date(utc + istOffset);
//   istTime.setHours(0, 0, 0, 0); // normalize to midnight
//   return istTime.getTime();
// }

// // Compare two dates (day/month/year)
// function isSameISTDay(date: Date, year: number, month: number, day: number) {
//   const parts = new Date(getISTDate(date));
//   return parts.getFullYear() === year && parts.getMonth() + 1 === month && parts.getDate() === day;
// }

// export async function GET(req: Request) {
//   try {
//     const { userId } = auth();
//     if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const { searchParams } = new URL(req.url);

//     // Accept flexible date filter: "month" (YYYY-MM) or "date" (YYYY-MM-DD)
//     const month = searchParams.get("month");
//     const dateParam = searchParams.get("date");

//     if (!month && !dateParam)
//       return NextResponse.json({ error: "Month or Date is required" }, { status: 400 });

//     let startDate: Date, endDate: Date;

//     if (month) {
//       const [year, monthNum] = month.split("-").map(Number);
//       startDate = new Date(Date.UTC(year, monthNum - 1, 1));
//       endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59));
//     } else {
//       const d = new Date(dateParam!);
//       startDate = new Date(d);
//       startDate.setHours(0, 0, 0, 0);
//       endDate = new Date(d);
//       endDate.setHours(23, 59, 59, 999);
//     }

//     // Fetch attendance only for logged-in user
//     const records = await prisma.attendance.findMany({
//       where: {
//         userId,
//         date: {
//           gte: startDate,
//           lte: endDate,
//         },
//       },
//       orderBy: { date: "asc" },
//     });

//     if (!records.length)
//       return NextResponse.json({ headers: ["Date", "Check-In", "Check-Out", "Status", "Late By", "Working Hours", "Overtime", "Remarks"], rows: [] });

//     const rows = records.map((r) => ({
//       Date: new Date(r.date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
//       "Check-In": r.checkIn ? new Date(r.checkIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }) : "-",
//       "Check-Out": r.checkOut ? new Date(r.checkOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }) : "-",
//       Status: r.status,
//       "Late By": r.lateBy || "-",
//       "Working Hours": r.workingHours ? `${Math.floor(r.workingHours / 60)} hr ${r.workingHours % 60} min` : "-",
//       Overtime: r.overtime ? `${Math.floor(r.overtime / 60)} hr ${r.overtime % 60} min` : "-",
//       Remarks: r.remarks || "-",
//     }));

//     const headers = ["Date", "Check-In", "Check-Out", "Status", "Late By", "Working Hours", "Overtime", "Remarks"];

//     return NextResponse.json({ headers, rows });
//   } catch (err) {
//     console.error("💥 Monthly attendance failed:", err);
//     return NextResponse.json({ error: "Failed to fetch attendance", details: err instanceof Error ? err.message : String(err) }, { status: 500 });
//   }
// }






// // File: src/app/api/attendance/monthly/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs";

// // Convert UTC date to IST and normalize to start of day
// function getISTDate(date: Date) {
//   const utc = date.getTime();
//   const istOffset = 5.5 * 60 * 60 * 1000;
//   const istTime = new Date(utc + istOffset);
//   istTime.setHours(0, 0, 0, 0);
//   return istTime.getTime();
// }

// // Compare two dates (day/month/year)
// function isSameISTDay(date: Date, year: number, month: number, day: number) {
//   const parts = new Date(getISTDate(date));
//   return parts.getFullYear() === year && parts.getMonth() + 1 === month && parts.getDate() === day;
// }

// export async function GET(req: Request) {
//   try {
//     const { userId } = auth();
//     if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const { searchParams } = new URL(req.url);
//     const month = searchParams.get("month"); // YYYY-MM
//     const dateParam = searchParams.get("date"); // YYYY-MM-DD

//     if (!month && !dateParam)
//       return NextResponse.json({ error: "Month or Date is required" }, { status: 400 });

//     let startDate: Date, endDate: Date;

//     if (month) {
//       const [year, monthNum] = month.split("-").map(Number);
//       startDate = new Date(Date.UTC(year, monthNum - 1, 1));
//       endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59));
//     } else {
//       const d = new Date(dateParam!);
//       startDate = new Date(d);
//       startDate.setHours(0, 0, 0, 0);
//       endDate = new Date(d);
//       endDate.setHours(23, 59, 59, 999);
//     }

//     const records = await prisma.attendance.findMany({
//       where: { userId, date: { gte: startDate, lte: endDate } },
//       orderBy: { date: "asc" },
//     });

//     if (!records.length)
//       return NextResponse.json({
//         headers: ["Date", "Check-In", "Check-Out", "Status", "Late By", "Working Hours", "Overtime", "Remarks"],
//         rows: [],
//       });

//     const rows = records.map((r) => ({
//       Date: new Date(r.date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
//       "Check-In": r.checkIn
//         ? new Date(r.checkIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })
//         : "-",
//       "Check-Out": r.checkOut
//         ? new Date(r.checkOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })
//         : "-",
//       Status: r.status,
//       "Late By": r.lateBy || "-",
//       "Working Hours": r.workingHours ? `${Math.floor(r.workingHours / 60)} hr ${r.workingHours % 60} min` : "-",
//       Overtime: r.overtime ? `${Math.floor(r.overtime / 60)} hr ${r.overtime % 60} min` : "-",
//       Remarks: r.remarks || "-",
//     }));

//     const headers = ["Date", "Check-In", "Check-Out", "Status", "Late By", "Working Hours", "Overtime", "Remarks"];
//     return NextResponse.json({ headers, rows });
//   } catch (err) {
//     console.error("💥 Monthly attendance failed:", err);
//     return NextResponse.json({ error: "Failed to fetch attendance", details: err instanceof Error ? err.message : String(err) }, { status: 500 });
//   }
// }












// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";

// export async function GET(req: Request) {
//   try {
//     // ✅ FIX: auth() is NOT async, remove await
//     const { userId } = auth();
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { searchParams } = new URL(req.url);
//     const month = searchParams.get("month"); // YYYY-MM
//     if (!month || !/^\d{4}-\d{2}$/.test(month)) {
//       return NextResponse.json(
//         { error: "Invalid month format. Use YYYY-MM" },
//         { status: 400 }
//       );
//     }

//     const startDate = new Date(`${month}-01T00:00:00.000Z`);
//     const endDate = new Date(startDate);
//     endDate.setMonth(endDate.getMonth() + 1);

//     // Fetch tasks for the logged-in user
//     const tasks = await prisma.task.findMany({
//       where: {
//         createdByClerkId: userId,
//         createdAt: { gte: startDate, lt: endDate },
//       },
//       select: {
//         id: true,
//         createdAt: true,
//         amount: true,
//         received: true,
//         shopName: true,
//         phone: true,
//       },
//     });

//     // Group tasks by shopName / phone
//     const grouped: Record<
//       string,
//       {
//         revenue: number;
//         received: number;
//         firstCreatedAt: Date;
//         phone?: string | null;
//         taskIds: string[];
//       }
//     > = {};

//     tasks.forEach((t) => {
//       const key =
//         t.shopName?.trim() || t.phone?.trim() || `Shop ${t.id.slice(-6)}`;

//       if (!grouped[key]) {
//         grouped[key] = {
//           revenue: 0,
//           received: 0,
//           firstCreatedAt: t.createdAt,
//           phone: t.phone || null,
//           taskIds: [t.id],
//         };
//       } else {
//         grouped[key].taskIds.push(t.id);
//       }

//       grouped[key].revenue += t.amount ?? 0;
//       grouped[key].received += t.received ?? 0;

//       if (t.createdAt < grouped[key].firstCreatedAt) {
//         grouped[key].firstCreatedAt = t.createdAt;
//       }
//       if (!grouped[key].phone && t.phone) {
//         grouped[key].phone = t.phone;
//       }
//     });

//     // Format for response
//     const report = Object.entries(grouped).map(([shopName, stats], i) => ({
//       taskNumber: i + 1,
//       taskId: stats.taskIds[0],
//       shopName,
//       mobileNumber: stats.phone || "-",
//       firstCreatedAt: stats.firstCreatedAt,
//       totalRevenue: stats.revenue,
//       totalReceived: stats.received,
//       pending: stats.revenue - stats.received,
//     }));

//     return NextResponse.json(report);
//   } catch (e: any) {
//     console.error("💥 Monthly report error:", e);
//     return NextResponse.json(
//       { error: "Internal Error", details: e.message },
//       { status: 500 }
//     );
//   }
// }





// // src/app/api/attendance/monthly/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";

// export async function GET(req: Request) {
//   try {
//     // ✅ Get the Authorization header
//     const authHeader = req.headers.get("Authorization");
//     if (!authHeader?.startsWith("Bearer ")) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
//     const token = authHeader.split(" ")[1];

//     // ✅ Verify token via Clerk
//     const { userId } = await auth({ token });
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // ✅ Get month query param (YYYY-MM)
//     const { searchParams } = new URL(req.url);
//     const month = searchParams.get("month");
//     if (!month || !/^\d{4}-\d{2}$/.test(month)) {
//       return NextResponse.json(
//         { error: "Invalid month format. Use YYYY-MM" },
//         { status: 400 }
//       );
//     }

//     const [year, monthNum] = month.split("-").map(Number);
//     const startDate = new Date(Date.UTC(year, monthNum - 1, 1));
//     const endDate = new Date(Date.UTC(year, monthNum, 1));

//     // ✅ Fetch attendance
//     const records = await prisma.attendance.findMany({
//       where: {
//         userId,
//         date: { gte: startDate, lt: endDate },
//       },
//       orderBy: { date: "asc" },
//       select: {
//         id: true,
//         date: true,
//         checkIn: true,
//         checkOut: true,
//         status: true,
//         workingHours: true,
//         overtimeHours: true,
//         remarks: true,
//         employeeName: true,
//         verified: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     });

//     // ✅ Compute lateBy dynamically
//     const formatted = records.map((r, i) => {
//       let lateBy = "-";
//       if (r.checkIn) {
//         const checkInHour = new Date(r.checkIn).getUTCHours() + 5.5; // IST
//         if (checkInHour > 9) {
//           const minutesLate = Math.round((checkInHour - 9) * 60);
//           lateBy = `${minutesLate} min`;
//         }
//       }
//       return {
//         serial: i + 1,
//         date: r.date.toISOString().split("T")[0],
//         checkIn: r.checkIn ?? "-",
//         checkOut: r.checkOut ?? "-",
//         status: r.status ?? (r.checkIn ? "Present" : "Absent"),
//         lateBy,
//         workingHours: r.workingHours ?? 0,
//         overtimeHours: r.overtimeHours ?? 0,
//         remarks: r.remarks ?? "-",
//         employeeName: r.employeeName ?? "-",
//         verified: r.verified ?? false,
//       };
//     });

//     return NextResponse.json(formatted);
//   } catch (e: any) {
//     console.error("💥 Monthly Attendance error:", e);
//     return NextResponse.json(
//       { error: "Internal Error", details: e.message },
//       { status: 500 }
//     );
//   }
// }





// // src/app/api/attendance/monthly/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";

// export async function GET(req: Request) {
//   try {
//     // ✅ Get the Authorization header
//     const authHeader = req.headers.get("Authorization");
//     if (!authHeader?.startsWith("Bearer ")) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
//     const token = authHeader.split(" ")[1];

//     // ✅ Verify token via Clerk
//     const { userId } = await auth({ token });
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // ✅ Get month query param (YYYY-MM)
//     const { searchParams } = new URL(req.url);
//     const month = searchParams.get("month");
//     if (!month || !/^\d{4}-\d{2}$/.test(month)) {
//       return NextResponse.json(
//         { error: "Invalid month format. Use YYYY-MM" },
//         { status: 400 }
//       );
//     }

//     const [year, monthNum] = month.split("-").map(Number);
//     const startDate = new Date(Date.UTC(year, monthNum - 1, 1));
//     const endDate = new Date(Date.UTC(year, monthNum, 1));

//     // ✅ Fetch attendance
//     const records = await prisma.attendance.findMany({
//       where: {
//         userId,
//         date: { gte: startDate, lt: endDate },
//       },
//       orderBy: { date: "asc" },
//       select: {
//         id: true,
//         date: true,
//         checkIn: true,
//         checkOut: true,
//         status: true,
//         workingHours: true,
//         overtimeHours: true,
//         remarks: true,
//         employeeName: true,
//         verified: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     });

//     // ✅ Compute lateBy dynamically
//     const formatted = records.map((r, i) => {
//       let lateBy = "-";
//       if (r.checkIn) {
//         const checkInHour = new Date(r.checkIn).getUTCHours() + 5.5; // IST
//         if (checkInHour > 9) {
//           const minutesLate = Math.round((checkInHour - 9) * 60);
//           lateBy = `${minutesLate} min`;
//         }
//       }
//       return {
//         serial: i + 1,
//         date: r.date.toISOString().split("T")[0],
//         checkIn: r.checkIn ?? "-",
//         checkOut: r.checkOut ?? "-",
//         status: r.status ?? (r.checkIn ? "Present" : "Absent"),
//         lateBy,
//         workingHours: r.workingHours ?? 0,
//         overtimeHours: r.overtimeHours ?? 0,
//         remarks: r.remarks ?? "-",
//         employeeName: r.employeeName ?? "-",
//         verified: r.verified ?? false,
//       };
//     });

//     return NextResponse.json(formatted);
//   } catch (e: any) {
//     console.error("💥 Monthly Attendance error:", e);
//     return NextResponse.json(
//       { error: "Internal Error", details: e.message },
//       { status: 500 }
//     );
//   }
// }



















// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";

// // Helper: calculate working hours excluding lunch 2–3 PM
// const calcWorkingHours = (checkIn: Date, checkOut: Date) => {
//   let ms = checkOut.getTime() - checkIn.getTime();
//   let hours = ms / (1000 * 60 * 60);

//   // Subtract lunch if check-in < 14:00 and check-out > 15:00
//   const lunchStart = new Date(checkIn);
//   lunchStart.setUTCHours(14, 0, 0, 0);
//   const lunchEnd = new Date(checkIn);
//   lunchEnd.setUTCHours(15, 0, 0, 0);

//   if (checkIn < lunchStart && checkOut > lunchEnd) {
//     hours -= 1;
//   } else if (checkIn < lunchStart && checkOut > lunchStart && checkOut <= lunchEnd) {
//     hours -= (checkOut.getTime() - lunchStart.getTime()) / (1000 * 60 * 60);
//   } else if (checkIn >= lunchStart && checkIn < lunchEnd && checkOut > lunchEnd) {
//     hours -= (lunchEnd.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
//   }
//   return hours;
// };

// // Helper: determine day type
// const calcDayType = (checkIn?: Date, checkOut?: Date, hours?: number) => {
//   if (!checkIn) return "Absent";
//   if (!checkOut) return "Half Day";
//   if (!hours || hours < 6) return "Half Day";
//   return "Full Day";
// };

// export async function GET(req: Request) {
//   try {
//     // ✅ Get Authorization header
//     const authHeader = req.headers.get("Authorization");
//     if (!authHeader?.startsWith("Bearer ")) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
//     const token = authHeader.split(" ")[1];

//     // ✅ Verify token via Clerk
//     const { userId } = await auth({ token });
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // ✅ Month query param YYYY-MM
//     const { searchParams } = new URL(req.url);
//     const month = searchParams.get("month");
//     if (!month || !/^\d{4}-\d{2}$/.test(month)) {
//       return NextResponse.json({ error: "Invalid month format. Use YYYY-MM" }, { status: 400 });
//     }

//     const [year, monthNum] = month.split("-").map(Number);
//     const startDate = new Date(Date.UTC(year, monthNum - 1, 1));
//     const endDate = new Date(Date.UTC(year, monthNum, 1));

//     // ✅ Fetch attendance records
//     const records = await prisma.attendance.findMany({
//       where: { userId, date: { gte: startDate, lt: endDate } },
//       orderBy: { date: "asc" },
//       select: {
//         id: true,
//         date: true,
//         checkIn: true,
//         checkOut: true,
//         status: true,
//         workingHours: true,
//         overtimeHours: true,
//         remarks: true,
//         employeeName: true,
//         verified: true,
//       },
//     });

//     // ✅ Format for frontend
//     const formatted = records.map((r, i) => {
//       const checkInDate = r.checkIn ? new Date(r.checkIn) : undefined;
//       const checkOutDate = r.checkOut ? new Date(r.checkOut) : undefined;

//       const workingHrs = checkInDate && checkOutDate ? calcWorkingHours(checkInDate, checkOutDate) : 0;

//       // Late (after 10 AM)
//       let lateBy = "-";
//       if (checkInDate) {
//         const checkInIST = new Date(checkInDate.getTime() + 5.5 * 60 * 60 * 1000);
//         const lateMinutes = Math.max(0, (checkInIST.getHours() * 60 + checkInIST.getMinutes()) - (10 * 60));
//         if (lateMinutes > 0) lateBy = `${lateMinutes} min`;
//       }

//       // Early checkout (before 7 PM)
//       let earlyBy = "-";
//       if (checkOutDate) {
//         const checkOutIST = new Date(checkOutDate.getTime() + 5.5 * 60 * 60 * 1000);
//         const earlyMinutes = Math.max(0, (19 * 60) - (checkOutIST.getHours() * 60 + checkOutIST.getMinutes()));
//         if (earlyMinutes > 0) earlyBy = `${earlyMinutes} min`;
//       }

//       // Overtime
//       const overtime = Math.max(0, workingHrs - 8);

//       return {
//         serial: i + 1,
//         date: r.date.toISOString().split("T")[0],
//         employeeName: r.employeeName ?? "-",
//         checkIn: r.checkIn ?? "-",
//         checkOut: r.checkOut ?? "-",
//         status: r.status ?? (r.checkIn ? "Present" : "Absent"),
//         dayType: calcDayType(checkInDate, checkOutDate, workingHrs),
//         workingHours: workingHrs,
//         overtime,
//         lateBy,
//         earlyBy,
//         verified: r.verified ? "Verified" : "Unverified",
//         remarks: r.remarks ?? "-",
//       };
//     });

//     return NextResponse.json(formatted);
//   } catch (e: any) {
//     console.error("💥 Monthly Attendance error:", e);
//     return NextResponse.json({ error: "Internal Error", details: e.message }, { status: 500 });
//   }
// }












import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { users } from "@clerk/clerk-sdk-node";

// -------------------- Helpers --------------------
// Hardcoded shift: subtract 1 day from a date
function shiftDateBackOneDay(date: Date) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() - 1);
  return newDate;
}

// Convert UTC date to IST calendar day object
function getISTDateParts(date: Date) {
  // Apply hardcoded 1-day shift
  const shifted = shiftDateBackOneDay(date);

  const istDate = new Date(shifted.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return {
    year: istDate.getFullYear(),
    month: istDate.getMonth() + 1,
    day: istDate.getDate(),
  };
}

// Compare two IST dates by Y/M/D
function isSameISTDay(date: Date, year: number, month: number, day: number) {
  const parts = getISTDateParts(date);
  return parts.year === year && parts.month === month && parts.day === day;
}

// -------------------- API --------------------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    if (!month) return NextResponse.json({ error: "Month is required" }, { status: 400 });

    const [year, monthNum] = month.split("-").map(Number);

    // fetch attendance
    const records = await prisma.attendance.findMany({
      where: {
        date: {
          gte: new Date(Date.UTC(year, monthNum - 1, 1)),
          lte: new Date(Date.UTC(year, monthNum, 0, 23, 59, 59)),
        },
      },
      orderBy: { date: "asc" },
    });

    if (!records.length) return NextResponse.json({ headers: ["Employee"], rows: [] });

    // unique userIds
    const userIds = [...new Set(records.map((r) => r.userId))];

    // fetch names from Clerk
    const userMap = new Map<string, string>();
    for (const id of userIds) {
      try {
        const user = await users.getUser(id);
        userMap.set(
          id,
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            records.find((r) => r.userId === id)?.employeeName ||
            "Unknown"
        );
      } catch {
        const fallback = records.find((r) => r.userId === id)?.employeeName || "Unknown";
        userMap.set(id, fallback);
      }
    }

    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const headers = ["Employee", ...Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`), "Total Hours"];

    const rows = userIds.map((userId) => {
      const empRecords = records.filter((r) => r.userId === userId);
      const row: Record<string, any> = { Employee: userMap.get(userId) || "Unknown" };
      let totalMinutes = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const rec = empRecords.find((r) => isSameISTDay(r.date, year, monthNum, d));

        if (rec) {
          row[d.toString()] = rec.checkIn && rec.checkOut ? "✅" : "⏳";
          totalMinutes += rec.workingHours || 0;
        } else {
          row[d.toString()] = "❌";
        }
      }

      const hrs = Math.floor(totalMinutes / 60);
      const mins = Math.floor(totalMinutes % 60);
      row["Total Hours"] = hrs && mins ? `${hrs} hr ${mins} min` : hrs ? `${hrs} hr` : `${mins} min`;

      return row;
    });

    return NextResponse.json({ headers, rows });
  } catch (error) {
    console.error("💥 Monthly attendance failed:", error);
    return NextResponse.json({ error: "Failed to fetch monthly attendance" }, { status: 500 });
  }
}




//LKJHJK