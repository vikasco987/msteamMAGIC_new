// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// // Helper: calculate working hours with lunch deduction
// const calcWorkingHours = (checkIn: Date, checkOut: Date) => {
//   if (!checkIn || !checkOut) return 0;

//   const totalMs = checkOut.getTime() - checkIn.getTime();
//   let hours = totalMs / (1000 * 60 * 60);

//   // Fixed lunch: 2 PM - 3 PM
//   const lunchStart = new Date(checkIn);
//   lunchStart.setHours(14, 0, 0, 0);
//   const lunchEnd = new Date(checkIn);
//   lunchEnd.setHours(15, 0, 0, 0);

//   const overlapStart = Math.max(checkIn.getTime(), lunchStart.getTime());
//   const overlapEnd = Math.min(checkOut.getTime(), lunchEnd.getTime());

//   if (overlapEnd > overlapStart) {
//     hours -= (overlapEnd - overlapStart) / (1000 * 60 * 60);
//   }

//   return Math.max(0, Math.round((hours + Number.EPSILON) * 100) / 100);
// };

// const getMedalEmoji = (rank: number) => {
//   if (rank === 1) return "🥇";
//   if (rank === 2) return "🥈";
//   if (rank === 3) return "🥉";
//   return "";
// };

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const month = searchParams.get("month"); // YYYY-MM
//     if (!month || !/^\d{4}-\d{2}$/.test(month)) {
//       return NextResponse.json(
//         { error: "Invalid month format. Use YYYY-MM" },
//         { status: 400 }
//       );
//     }

//     const [year, monthNum] = month.split("-").map(Number);
//     const startDate = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0));
//     const endDate = new Date(
//       Date.UTC(year, monthNum - 1, new Date(year, monthNum, 0).getDate(), 23, 59, 59)
//     );

//     const records = await prisma.attendance.findMany({
//       where: { date: { gte: startDate, lte: endDate } },
//       select: {
//         userId: true,
//         employeeName: true,
//         date: true,
//         checkIn: true,
//         checkOut: true,
//       },
//     });

//     const byEmployee: Record<string, any> = {};

//     for (const r of records) {
//       const key = r.userId ?? r.employeeName ?? "unknown";
//       if (!byEmployee[key]) {
//         byEmployee[key] = {
//           userId: r.userId ?? null,
//           employeeName: r.employeeName ?? "Unknown",
//           daysPresent: 0,
//           daysLate: 0,
//           earlyLeaves: 0,
//           earlyArrival: 0,
//           overtimeHours: 0,
//           totalWorkingHours: 0,
//         };
//       }

//       const emp = byEmployee[key];
//       const checkInDate = r.checkIn ? new Date(r.checkIn) : null;
//       const checkOutDate = r.checkOut ? new Date(r.checkOut) : null;

//       if (checkInDate) {
//         emp.daysPresent += 1;
//         const checkInLocal = checkInDate.getHours() + checkInDate.getMinutes() / 60;
//         if (checkInLocal > 10) emp.daysLate += 1;
//         else emp.earlyArrival += 1;
//       }

//       if (checkOutDate) {
//         const checkOutLocal = checkOutDate.getHours() + checkOutDate.getMinutes() / 60;
//         if (checkOutLocal < 19) emp.earlyLeaves += 1;
//       }

//       if (checkInDate && checkOutDate) {
//         const workingHrs = calcWorkingHours(checkInDate, checkOutDate);
//         emp.totalWorkingHours += workingHrs;
//         emp.overtimeHours += Math.max(0, workingHrs - 8);
//       }
//     }

//     let list = Object.values(byEmployee).map((emp: any) => {
//       // ✅ Updated scoring formula to include total working hours
//       const score =
//         emp.daysPresent * 10 +      // reward presence
//         emp.earlyArrival * 2 +      // reward early arrival
//         emp.overtimeHours * 1 +     // reward overtime
//         emp.totalWorkingHours * 0.5 - // reward overall working hours (scaled)
//         emp.daysLate * 2 -          // penalty for late
//         emp.earlyLeaves * 2;        // penalty for early leave

//       return {
//         ...emp,
//         overtimeHours: Math.round((emp.overtimeHours + Number.EPSILON) * 100) / 100,
//         totalWorkingHours: Math.round((emp.totalWorkingHours + Number.EPSILON) * 100) / 100,
//         score: Math.round((score + Number.EPSILON) * 100) / 100,
//       };
//     });

//     // Sort by score → then by days present → then by overtime
//     list.sort((a: any, b: any) => {
//       if (b.score !== a.score) return b.score - a.score;
//       if (b.daysPresent !== a.daysPresent) return b.daysPresent - a.daysPresent;
//       return b.overtimeHours - a.overtimeHours;
//     });

//     // Max score for relative CGPA normalization
//     const maxScore = list.length > 0 ? list[0].score : 0;

//     list = list.map((emp: any, idx: number) => ({
//       ...emp,
//       rank: idx + 1,
//       medal: getMedalEmoji(idx + 1),
//       relativeCgpa:
//         maxScore > 0
//           ? Math.round(((emp.score / maxScore) * 10 + Number.EPSILON) * 100) / 100
//           : 0,
//     }));

//     return NextResponse.json(list);
//   } catch (e: any) {
//     console.error("💥 Employee Rank error:", e);
//     return NextResponse.json(
//       { error: "Internal Error", details: e.message },
//       { status: 500 }
//     );
//   }
// }

















// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { toZonedTime } from "date-fns-tz";

// const TIME_ZONE = "Asia/Kolkata"; // Force IST timezone

// // Helper: calculate working hours with lunch deduction
// const calcWorkingHours = (checkIn: Date, checkOut: Date) => {
//   if (!checkIn || !checkOut) return 0;

//   const totalMs = checkOut.getTime() - checkIn.getTime();
//   let hours = totalMs / (1000 * 60 * 60);

//   // Fixed lunch: 2 PM - 3 PM (IST)
//   const lunchStart = new Date(checkIn);
//   lunchStart.setHours(14, 0, 0, 0);
//   const lunchEnd = new Date(checkIn);
//   lunchEnd.setHours(15, 0, 0, 0);

//   const overlapStart = Math.max(checkIn.getTime(), lunchStart.getTime());
//   const overlapEnd = Math.min(checkOut.getTime(), lunchEnd.getTime());

//   if (overlapEnd > overlapStart) {
//     hours -= (overlapEnd - overlapStart) / (1000 * 60 * 60);
//   }

//   return Math.max(0, Math.round((hours + Number.EPSILON) * 100) / 100);
// };

// const getMedalEmoji = (rank: number) => {
//   if (rank === 1) return "🥇";
//   if (rank === 2) return "🥈";
//   if (rank === 3) return "🥉";
//   return "";
// };

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const month = searchParams.get("month"); // YYYY-MM
//     if (!month || !/^\d{4}-\d{2}$/.test(month)) {
//       return NextResponse.json(
//         { error: "Invalid month format. Use YYYY-MM" },
//         { status: 400 }
//       );
//     }

//     const [year, monthNum] = month.split("-").map(Number);

//     // Use UTC start/end and later convert to IST when needed
//     const startDate = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0));
//     const endDate = new Date(
//       Date.UTC(year, monthNum - 1, new Date(year, monthNum, 0).getDate(), 23, 59, 59)
//     );

//     const records = await prisma.attendance.findMany({
//       where: { date: { gte: startDate, lte: endDate } },
//       select: {
//         userId: true,
//         employeeName: true,
//         date: true,
//         checkIn: true,
//         checkOut: true,
//       },
//     });

//     const byEmployee: Record<string, any> = {};

//     for (const r of records) {
//       const key = r.userId ?? r.employeeName ?? "unknown";
//       if (!byEmployee[key]) {
//         byEmployee[key] = {
//           userId: r.userId ?? null,
//           employeeName: r.employeeName ?? "Unknown",
//           daysPresent: 0,
//           daysLate: 0,
//           earlyLeaves: 0,
//           earlyArrival: 0,
//           overtimeHours: 0,
//           totalWorkingHours: 0,
//         };
//       }

//       const emp = byEmployee[key];

//       // Convert UTC to IST using date-fns-tz
//       const checkInDate = r.checkIn ? toZonedTime(new Date(r.checkIn), TIME_ZONE) : null;
//       const checkOutDate = r.checkOut ? toZonedTime(new Date(r.checkOut), TIME_ZONE) : null;

//       if (checkInDate) {
//         emp.daysPresent += 1;
//         const checkInLocal = checkInDate.getHours() + checkInDate.getMinutes() / 60;
//         if (checkInLocal > 10) emp.daysLate += 1;
//         else emp.earlyArrival += 1;
//       }

//       if (checkOutDate) {
//         const checkOutLocal = checkOutDate.getHours() + checkOutDate.getMinutes() / 60;
//         if (checkOutLocal < 19) emp.earlyLeaves += 1;
//       }

//       if (checkInDate && checkOutDate) {
//         const workingHrs = calcWorkingHours(checkInDate, checkOutDate);
//         emp.totalWorkingHours += workingHrs;
//         emp.overtimeHours += Math.max(0, workingHrs - 8);
//       }
//     }

//     let list = Object.values(byEmployee).map((emp: any) => {
//       const score =
//         emp.daysPresent * 10 +
//         emp.earlyArrival * 2 +
//         emp.overtimeHours * 1 +
//         emp.totalWorkingHours * 0.5 -
//         emp.daysLate * 2 -
//         emp.earlyLeaves * 2;

//       return {
//         ...emp,
//         overtimeHours: Math.round((emp.overtimeHours + Number.EPSILON) * 100) / 100,
//         totalWorkingHours: Math.round((emp.totalWorkingHours + Number.EPSILON) * 100) / 100,
//         score: Math.round((score + Number.EPSILON) * 100) / 100,
//       };
//     });

//     list.sort((a: any, b: any) => {
//       if (b.score !== a.score) return b.score - a.score;
//       if (b.daysPresent !== a.daysPresent) return b.daysPresent - a.daysPresent;
//       return b.overtimeHours - a.overtimeHours;
//     });

//     const maxScore = list.length > 0 ? list[0].score : 0;

//     list = list.map((emp: any, idx: number) => ({
//       ...emp,
//       rank: idx + 1,
//       medal: getMedalEmoji(idx + 1),
//       relativeCgpa:
//         maxScore > 0
//           ? Math.round(((emp.score / maxScore) * 10 + Number.EPSILON) * 100) / 100
//           : 0,
//     }));

//     return NextResponse.json(list);
//   } catch (e: any) {
//     console.error("💥 Employee Rank error:", e);
//     return NextResponse.json(
//       { error: "Internal Error", details: e.message },
//       { status: 500 }
//     );
//   }
// }













// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { toZonedTime } from "date-fns-tz";

// const TIME_ZONE = "Asia/Kolkata"; // Force IST timezone

// // Helper: calculate working hours with lunch deduction
// const calcWorkingHours = (checkIn: Date, checkOut: Date) => {
//   if (!checkIn || !checkOut) return 0;

//   let hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

//   // Lunch: 2 PM - 3 PM IST
//   const lunchStart = new Date(checkIn);
//   lunchStart.setHours(14, 0, 0, 0);
//   const lunchEnd = new Date(checkIn);
//   lunchEnd.setHours(15, 0, 0, 0);

//   const overlapStart = Math.max(checkIn.getTime(), lunchStart.getTime());
//   const overlapEnd = Math.min(checkOut.getTime(), lunchEnd.getTime());

//   if (overlapEnd > overlapStart) {
//     hours -= (overlapEnd - overlapStart) / (1000 * 60 * 60);
//   }

//   return Math.max(0, Math.round((hours + Number.EPSILON) * 100) / 100);
// };

// const getMedalEmoji = (rank: number) => {
//   if (rank === 1) return "🥇";
//   if (rank === 2) return "🥈";
//   if (rank === 3) return "🥉";
//   return "";
// };

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const month = searchParams.get("month"); // YYYY-MM
//     if (!month || !/^\d{4}-\d{2}$/.test(month)) {
//       return NextResponse.json(
//         { error: "Invalid month format. Use YYYY-MM" },
//         { status: 400 }
//       );
//     }

//     const [year, monthNum] = month.split("-").map(Number);

//     const startDate = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0));
//     const endDate = new Date(
//       Date.UTC(year, monthNum - 1, new Date(year, monthNum, 0).getDate(), 23, 59, 59)
//     );

//     const records = await prisma.attendance.findMany({
//       where: { date: { gte: startDate, lte: endDate } },
//       select: {
//         userId: true,
//         employeeName: true,
//         date: true,
//         checkIn: true,
//         checkOut: true,
//       },
//     });

//     const byEmployee: Record<string, any> = {};

//     for (const r of records) {
//       const key = r.userId ?? r.employeeName ?? "unknown";
//       if (!byEmployee[key]) {
//         byEmployee[key] = {
//           userId: r.userId ?? null,
//           employeeName: r.employeeName ?? "Unknown",
//           daysPresent: 0,
//           daysLate: 0,
//           earlyLeaves: 0,
//           earlyArrival: 0,
//           overtimeHours: 0,
//           totalWorkingHours: 0,
//         };
//       }

//       const emp = byEmployee[key];

//       const checkInDate = r.checkIn ? toZonedTime(new Date(r.checkIn), TIME_ZONE) : null;
//       const checkOutDate = r.checkOut ? toZonedTime(new Date(r.checkOut), TIME_ZONE) : null;

//       if (checkInDate) {
//         emp.daysPresent += 1;
//         const checkInLocal = checkInDate.getHours() + checkInDate.getMinutes() / 60;
//         if (checkInLocal > 10) emp.daysLate += 1;
//         else emp.earlyArrival += 1;
//       }

//       if (checkOutDate) {
//         const checkOutLocal = checkOutDate.getHours() + checkOutDate.getMinutes() / 60;
//         if (checkOutLocal < 19) emp.earlyLeaves += 1;
//       }

//       if (checkInDate && checkOutDate) {
//         const workingHrs = calcWorkingHours(checkInDate, checkOutDate);
//         emp.totalWorkingHours += workingHrs;
//         emp.overtimeHours += Math.max(0, workingHrs - 8); // Reward overtime
//       }
//     }

//     let list = Object.values(byEmployee).map((emp: any) => {
//       // ⚡ Fairer scoring
//       const presenceScore = emp.daysPresent >= 8 ? 10 : (emp.daysPresent / 8) * 10;
//       const workingHoursScore = emp.totalWorkingHours; // 1 point per hour
//       const overtimeScore = emp.overtimeHours * 1.5; // extra reward
//       const earlyArrivalScore = emp.earlyArrival * 1;
//       const latePenalty = emp.daysLate * 1;
//       const earlyLeavePenalty = emp.earlyLeaves * 1;

//       const score =
//         presenceScore +
//         workingHoursScore +
//         overtimeScore +
//         earlyArrivalScore -
//         latePenalty -
//         earlyLeavePenalty;

//       return {
//         ...emp,
//         overtimeHours: Math.round((emp.overtimeHours + Number.EPSILON) * 100) / 100,
//         totalWorkingHours: Math.round((emp.totalWorkingHours + Number.EPSILON) * 100) / 100,
//         score: Math.round((score + Number.EPSILON) * 100) / 100,
//       };
//     });

//     // Sort by score → working hours → presence
//     list.sort((a: any, b: any) => {
//       if (b.score !== a.score) return b.score - a.score;
//       if (b.totalWorkingHours !== a.totalWorkingHours)
//         return b.totalWorkingHours - a.totalWorkingHours;
//       return b.daysPresent - a.daysPresent;
//     });

//     const maxScore = list.length > 0 ? list[0].score : 0;

//     list = list.map((emp: any, idx: number) => ({
//       ...emp,
//       rank: idx + 1,
//       medal: getMedalEmoji(idx + 1),
//       relativeCgpa:
//         maxScore > 0
//           ? Math.round(((emp.score / maxScore) * 10 + Number.EPSILON) * 100) / 100
//           : 0,
//     }));

//     return NextResponse.json(list);
//   } catch (e: any) {
//     console.error("💥 Employee Rank error:", e);
//     return NextResponse.json(
//       { error: "Internal Error", details: e.message },
//       { status: 500 }
//     );
//   }
// }




// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { toZonedTime } from "date-fns-tz";

// const TIME_ZONE = "Asia/Kolkata"; // Force IST timezone

// // Helper: calculate working hours with lunch deduction
// const calcWorkingHours = (checkIn: Date, checkOut: Date) => {
//   if (!checkIn || !checkOut) return 0;

//   let hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

//   // Lunch: 2 PM - 3 PM IST
//   const lunchStart = new Date(checkIn);
//   lunchStart.setHours(14, 0, 0, 0);
//   const lunchEnd = new Date(checkIn);
//   lunchEnd.setHours(15, 0, 0, 0);

//   const overlapStart = Math.max(checkIn.getTime(), lunchStart.getTime());
//   const overlapEnd = Math.min(checkOut.getTime(), lunchEnd.getTime());

//   if (overlapEnd > overlapStart) {
//     hours -= (overlapEnd - overlapStart) / (1000 * 60 * 60);
//   }

//   return Math.max(0, Math.round((hours + Number.EPSILON) * 100) / 100);
// };

// const getMedalEmoji = (rank: number) => {
//   if (rank === 1) return "🥇";
//   if (rank === 2) return "🥈";
//   if (rank === 3) return "🥉";
//   return "";
// };

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const month = searchParams.get("month"); // YYYY-MM
//     if (!month || !/^\d{4}-\d{2}$/.test(month)) {
//       return NextResponse.json(
//         { error: "Invalid month format. Use YYYY-MM" },
//         { status: 400 }
//       );
//     }

//     const [year, monthNum] = month.split("-").map(Number);

//     const startDate = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0));
//     const endDate = new Date(
//       Date.UTC(year, monthNum - 1, new Date(year, monthNum, 0).getDate(), 23, 59, 59)
//     );

//     const records = await prisma.attendance.findMany({
//       where: { date: { gte: startDate, lte: endDate } },
//       select: {
//         userId: true,
//         employeeName: true,
//         date: true,
//         checkIn: true,
//         checkOut: true,
//       },
//     });

//     const byEmployee: Record<string, any> = {};
//     const nowIST = toZonedTime(new Date(), TIME_ZONE);

//     for (const r of records) {
//       const key = r.userId ?? r.employeeName ?? "unknown";
//       if (!byEmployee[key]) {
//         byEmployee[key] = {
//           userId: r.userId ?? null,
//           employeeName: r.employeeName ?? "Unknown",
//           daysPresent: 0,
//           halfDays: 0,
//           daysLate: 0,
//           earlyLeaves: 0,
//           earlyArrival: 0,
//           overtimeHours: 0,
//           totalWorkingHours: 0,
//         };
//       }

//       const emp = byEmployee[key];

//       const checkInDate = r.checkIn ? toZonedTime(new Date(r.checkIn), TIME_ZONE) : null;
//       const checkOutDate = r.checkOut ? toZonedTime(new Date(r.checkOut), TIME_ZONE) : null;
//       const recordDate = toZonedTime(new Date(r.date), TIME_ZONE);
//       const isToday = recordDate.toDateString() === nowIST.toDateString();

//       // Count present
//       if (checkInDate) {
//         emp.daysPresent += 1;
//         const checkInLocal = checkInDate.getHours() + checkInDate.getMinutes() / 60;
//         if (checkInLocal > 10) emp.daysLate += 1;
//         else emp.earlyArrival += 1;
//       }

//       if (checkOutDate) {
//         const checkOutLocal = checkOutDate.getHours() + checkOutDate.getMinutes() / 60;
//         if (checkOutLocal < 19) emp.earlyLeaves += 1;
//       }

//       // Working hours & overtime
//       let workingHrs = 0;
//       if (checkInDate && checkOutDate) {
//         workingHrs = calcWorkingHours(checkInDate, checkOutDate);
//         emp.totalWorkingHours += workingHrs;
//         emp.overtimeHours += Math.max(0, workingHrs - 8);
//       }

//       // ⚡ Half day logic (skip current day until checkout)
//       if (!isToday && ((checkInDate && !checkOutDate) || workingHrs < 6)) {
//         emp.halfDays += 1;
//         emp.daysPresent = Math.max(emp.daysPresent - 1, 0); // Remove from present
//       }
//     }

//     let list = Object.values(byEmployee).map((emp: any) => {
//       const presenceScore = emp.daysPresent >= 8 ? 10 : (emp.daysPresent / 8) * 10;
//       const workingHoursScore = emp.totalWorkingHours;
//       const overtimeScore = emp.overtimeHours * 1.5;
//       const earlyArrivalScore = emp.earlyArrival * 1;
//       const latePenalty = emp.daysLate * 1;
//       const earlyLeavePenalty = emp.earlyLeaves * 1;

//       const score =
//         presenceScore +
//         workingHoursScore +
//         overtimeScore +
//         earlyArrivalScore -
//         latePenalty -
//         earlyLeavePenalty;

//       return {
//         ...emp,
//         overtimeHours: Math.round((emp.overtimeHours + Number.EPSILON) * 100) / 100,
//         totalWorkingHours: Math.round((emp.totalWorkingHours + Number.EPSILON) * 100) / 100,
//         score: Math.round((score + Number.EPSILON) * 100) / 100,
//       };
//     });

//     // Sort by score → working hours → presence
//     list.sort((a: any, b: any) => {
//       if (b.score !== a.score) return b.score - a.score;
//       if (b.totalWorkingHours !== a.totalWorkingHours)
//         return b.totalWorkingHours - a.totalWorkingHours;
//       return b.daysPresent - a.daysPresent;
//     });

//     const maxScore = list.length > 0 ? list[0].score : 0;

//     list = list.map((emp: any, idx: number) => ({
//       ...emp,
//       rank: idx + 1,
//       medal: getMedalEmoji(idx + 1),
//       relativeCgpa:
//         maxScore > 0
//           ? Math.round(((emp.score / maxScore) * 10 + Number.EPSILON) * 100) / 100
//           : 0,
//     }));

//     return NextResponse.json(list);
//   } catch (e: any) {
//     console.error("💥 Employee Rank error:", e);
//     return NextResponse.json(
//       { error: "Internal Error", details: e.message },
//       { status: 500 }
//     );
//   }
// }








import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toZonedTime } from "date-fns-tz";

const TIME_ZONE = "Asia/Kolkata"; // Force IST timezone

// Helper: calculate working hours with lunch deduction
const calcWorkingHours = (checkIn: Date, checkOut: Date) => {
  if (!checkIn || !checkOut) return 0;

  let hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

  // Lunch: 2 PM - 3 PM IST
  const lunchStart = new Date(checkIn);
  lunchStart.setHours(14, 0, 0, 0);
  const lunchEnd = new Date(checkIn);
  lunchEnd.setHours(15, 0, 0, 0);

  const overlapStart = Math.max(checkIn.getTime(), lunchStart.getTime());
  const overlapEnd = Math.min(checkOut.getTime(), lunchEnd.getTime());

  if (overlapEnd > overlapStart) {
    hours -= (overlapEnd - overlapStart) / (1000 * 60 * 60);
  }

  return Math.max(0, Math.round((hours + Number.EPSILON) * 100) / 100);
};

const getMedalEmoji = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // YYYY-MM
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Invalid month format. Use YYYY-MM" },
        { status: 400 }
      );
    }

    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0));
    const endDate = new Date(
      Date.UTC(year, monthNum - 1, new Date(year, monthNum, 0).getDate(), 23, 59, 59)
    );

    const records = await prisma.attendance.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      select: {
        userId: true,
        employeeName: true,
        date: true,
        checkIn: true,
        checkOut: true,
      },
    });

    const byEmployee: Record<string, any> = {};
    const nowIST = toZonedTime(new Date(), TIME_ZONE);

    for (const r of records) {
      const key = r.userId ?? r.employeeName ?? "unknown";
      if (!byEmployee[key]) {
        byEmployee[key] = {
          userId: r.userId ?? null,
          employeeName: r.employeeName ?? "Unknown",
          daysPresent: 0,
          halfDays: 0,
          daysLate: 0,
          earlyLeaves: 0,
          earlyArrival: 0,
          overtimeHours: 0,
          totalWorkingHours: 0,
        };
      }

      const emp = byEmployee[key];

      const checkInDate = r.checkIn ? toZonedTime(new Date(r.checkIn), TIME_ZONE) : null;
      const checkOutDate = r.checkOut ? toZonedTime(new Date(r.checkOut), TIME_ZONE) : null;
      const recordDate = toZonedTime(new Date(r.date), TIME_ZONE);
      const isToday = recordDate.toDateString() === nowIST.toDateString();

      // Count as present only if checked in
      if (checkInDate) {
        emp.daysPresent += 1;

        const checkInLocal = checkInDate.getHours() + checkInDate.getMinutes() / 60;
        if (checkInLocal > 10) emp.daysLate += 1;
        else emp.earlyArrival += 1;
      }

      // Early leave check
      if (checkOutDate) {
        const checkOutLocal = checkOutDate.getHours() + checkOutDate.getMinutes() / 60;
        if (checkOutLocal < 19) emp.earlyLeaves += 1;
      }

      // Working hours
      let workingHrs = 0;
      if (checkInDate && checkOutDate) {
        workingHrs = calcWorkingHours(checkInDate, checkOutDate);
        emp.totalWorkingHours += workingHrs;
        emp.overtimeHours += Math.max(0, workingHrs - 8);
      }

      // ✅ Improved Half-day logic
      // Skip current day until checkout is done
      if (!isToday) {
        // Case 1: Checked in but never checked out → half-day
        if (checkInDate && !checkOutDate) {
          emp.halfDays += 1;
          emp.daysPresent = Math.max(emp.daysPresent - 1, 0);
        }
        // Case 2: Both checkIn & checkOut exist but working hours between 3–6 hours → half-day
        else if (workingHrs > 3 && workingHrs < 6) {
          emp.halfDays += 1;
          emp.daysPresent = Math.max(emp.daysPresent - 1, 0);
        }
      }
    }

    let list = Object.values(byEmployee).map((emp: any) => {
      const presenceScore = emp.daysPresent >= 8 ? 10 : (emp.daysPresent / 8) * 10;
      const workingHoursScore = emp.totalWorkingHours;
      const overtimeScore = emp.overtimeHours * 1.5;
      const earlyArrivalScore = emp.earlyArrival * 1;
      const latePenalty = emp.daysLate * 1;
      const earlyLeavePenalty = emp.earlyLeaves * 1;

      const score =
        presenceScore +
        workingHoursScore +
        overtimeScore +
        earlyArrivalScore -
        latePenalty -
        earlyLeavePenalty;

      return {
        ...emp,
        overtimeHours: Math.round((emp.overtimeHours + Number.EPSILON) * 100) / 100,
        totalWorkingHours: Math.round((emp.totalWorkingHours + Number.EPSILON) * 100) / 100,
        score: Math.round((score + Number.EPSILON) * 100) / 100,
      };
    });

    // Sort by score → working hours → presence
    list.sort((a: any, b: any) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.totalWorkingHours !== a.totalWorkingHours)
        return b.totalWorkingHours - a.totalWorkingHours;
      return b.daysPresent - a.daysPresent;
    });

    const maxScore = list.length > 0 ? list[0].score : 0;

    list = list.map((emp: any, idx: number) => ({
      ...emp,
      rank: idx + 1,
      medal: getMedalEmoji(idx + 1),
      relativeCgpa:
        maxScore > 0
          ? Math.round(((emp.score / maxScore) * 10 + Number.EPSILON) * 100) / 100
          : 0,
    }));

    return NextResponse.json(list);
  } catch (e: any) {
    console.error("💥 Employee Rank error:", e);
    return NextResponse.json(
      { error: "Internal Error", details: e.message },
      { status: 500 }
    );
  }
}

