






// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getAuth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";

// const TISH_LAT = 28.5163558;
// const TISH_LNG = 77.1035919;
// const MAX_DISTANCE_METERS = 100;
// const OFFICE_START = 7; // 7 AM
// const OFFICE_END = 19; // 7 PM

// function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
//   const R = 6371e3;
//   const toRad = (x: number) => (x * Math.PI) / 180;
//   const dLat = toRad(lat2 - lat1);
//   const dLng = toRad(lng2 - lng1);

//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // ✅ Convert local day to UTC for storing in Mongo
// function getLocalDateUTC(date: Date) {
//   const localDate = new Date(date);
//   localDate.setHours(0, 0, 0, 0); // local midnight
//   const offset = localDate.getTimezoneOffset(); // minutes
//   localDate.setMinutes(localDate.getMinutes() - offset); // convert to UTC midnight
//   return localDate;
// }

// export async function POST(req: Request) {
//   try {
//     const { userId } = getAuth(req as any);
//     if (!userId)
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const { type, reason, remarks, lat, lng } = await req.json();
//     const now = new Date();

//     const todayStart = getLocalDateUTC(now);
//     const todayEnd = new Date(todayStart);
//     todayEnd.setUTCHours(23, 59, 59, 999);

//     const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
//     const deviceInfo = req.headers.get("user-agent") || "unknown device";

//     let employeeName = "Unknown";
//     try {
//       const clerkUser = await users.getUser(userId);
//       employeeName =
//         `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
//         clerkUser.username ||
//         clerkUser.emailAddresses[0]?.emailAddress ||
//         clerkUser.id;
//     } catch (err) {
//       console.error("Clerk fetch error:", err);
//     }

//     let distance: number | null = null;
//     let verified = false;
//     if (lat && lng) {
//       distance = getDistance(lat, lng, TISH_LAT, TISH_LNG);
//       verified = distance <= MAX_DISTANCE_METERS;
//     }

//     let todayRecord = await prisma.attendance.findFirst({
//       where: { userId, date: { gte: todayStart, lte: todayEnd } },
//       orderBy: { createdAt: "desc" },
//     });

//     let attendance;

//     if (type === "checkIn") {
//       if (todayRecord?.checkIn) {
//         return NextResponse.json({ error: "Already checked in today" }, { status: 400 });
//       }

//       const hour = now.getHours();
//       if (hour < OFFICE_START || hour > OFFICE_END) {
//         return NextResponse.json(
//           { error: "Check-in allowed only between 7 AM and 7 PM" },
//           { status: 400 }
//         );
//       }

//       let status = !verified ? "Unverified" : "On Time";
//       if (hour > 10 && verified) status = "Late";
//       if (hour > 10 && !reason && verified) {
//         return NextResponse.json(
//           { error: "Late check-in requires a reason" },
//           { status: 400 }
//         );
//       }

//       attendance = await prisma.attendance.create({
//         data: {
//           userId,
//           employeeName,
//           date: todayStart,
//           checkIn: now,
//           checkInReason: reason || null,
//           status,
//           verified,
//           location: { ip, lat, lng, distance },
//           deviceInfo,
//           remarks: remarks || null,
//         },
//       });
//     }

//     if (type === "checkOut") {
//       if (!todayRecord?.checkIn) {
//         return NextResponse.json({ error: "No check-in found for today" }, { status: 400 });
//       }
//       if (todayRecord.checkOut) {
//         return NextResponse.json({ error: "Already checked out today" }, { status: 400 });
//       }

//       const checkInTime = new Date(todayRecord.checkIn);
//       const checkOutTime = now;

//       const diffMs = checkOutTime.getTime() - checkInTime.getTime();
//       const workingHours = diffMs / (1000 * 60 * 60);
//       const overtimeHours = Math.max(0, workingHours - 8);

//       attendance = await prisma.attendance.update({
//         where: { id: todayRecord.id },
//         data: {
//           checkOut: checkOutTime,
//           checkOutReason: reason || null,
//           workingHours,
//           overtimeHours,
//           verified,
//           location: { ip, lat, lng, distance },
//           deviceInfo,
//           remarks: remarks || null,
//         },
//       });
//     }

//     return NextResponse.json({ success: true, attendance });
//   } catch (err: any) {
//     console.error("Attendance error:", err);
//     return NextResponse.json(
//       { error: "Something went wrong", details: err.message },
//       { status: 500 }
//     );
//   }
// }








// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getAuth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";
// import moment from "moment-timezone";

// const TISH_LAT = 28.5163558;
// const TISH_LNG = 77.1035919;
// const MAX_DISTANCE_METERS = 100;
// const OFFICE_START = 7; // 7 AM IST
// const OFFICE_END = 19; // 7 PM IST

// function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
//   const R = 6371e3;
//   const toRad = (x: number) => (x * Math.PI) / 180;
//   const dLat = toRad(lat2 - lat1);
//   const dLng = toRad(lng2 - lng1);

//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // ✅ Get today's IST start & end converted to UTC for DB
// function getISTDayRange() {
//   const now = moment().tz("Asia/Kolkata");
//   const startIST = now.clone().startOf("day");
//   const endIST = now.clone().endOf("day");

//   return {
//     startUTC: startIST.clone().utc().toDate(),
//     endUTC: endIST.clone().utc().toDate(),
//     nowIST: now,
//   };
// }

// export async function POST(req: Request) {
//   try {
//     const { userId } = getAuth(req as any);
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { type, reason, remarks, lat, lng } = await req.json();

//     const { startUTC, endUTC, nowIST } = getISTDayRange();
//     const now = nowIST.toDate();

//     const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
//     const deviceInfo = req.headers.get("user-agent") || "unknown device";

//     let employeeName = "Unknown";
//     try {
//       const clerkUser = await users.getUser(userId);
//       employeeName =
//         `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
//         clerkUser.username ||
//         clerkUser.emailAddresses[0]?.emailAddress ||
//         clerkUser.id;
//     } catch (err) {
//       console.error("Clerk fetch error:", err);
//     }

//     let distance: number | null = null;
//     let verified = false;
//     if (lat && lng) {
//       distance = getDistance(lat, lng, TISH_LAT, TISH_LNG);
//       verified = distance <= MAX_DISTANCE_METERS;
//     }

//     let todayRecord = await prisma.attendance.findFirst({
//       where: { userId, date: { gte: startUTC, lte: endUTC } },
//       orderBy: { createdAt: "desc" },
//     });

//     let attendance;

//     if (type === "checkIn") {
//       if (todayRecord?.checkIn) {
//         return NextResponse.json({ error: "Already checked in today" }, { status: 400 });
//       }

//       const hourIST = nowIST.hour();
//       if (hourIST < OFFICE_START || hourIST >= OFFICE_END) {
//         return NextResponse.json(
//           { error: "Check-in allowed only between 7 AM and 7 PM (IST)" },
//           { status: 400 }
//         );
//       }

//       let status = !verified ? "Unverified" : "On Time";
//       if (hourIST > 10 && verified) status = "Late";
//       if (hourIST > 10 && !reason && verified) {
//         return NextResponse.json(
//           { error: "Late check-in requires a reason" },
//           { status: 400 }
//         );
//       }

//       attendance = await prisma.attendance.create({
//         data: {
//           userId,
//           employeeName,
//           date: startUTC, // store UTC midnight
//           checkIn: now,
//           checkInReason: reason || null,
//           status,
//           verified,
//           location: { ip, lat, lng, distance },
//           deviceInfo,
//           remarks: remarks || null,
//         },
//       });
//     }

//     if (type === "checkOut") {
//       if (!todayRecord?.checkIn) {
//         return NextResponse.json({ error: "No check-in found for today" }, { status: 400 });
//       }
//       if (todayRecord.checkOut) {
//         return NextResponse.json({ error: "Already checked out today" }, { status: 400 });
//       }

//       const checkInTime = new Date(todayRecord.checkIn);
//       const checkOutTime = now;

//       const diffMs = checkOutTime.getTime() - checkInTime.getTime();
//       const workingHours = diffMs / (1000 * 60 * 60);
//       const overtimeHours = Math.max(0, workingHours - 8);

//       attendance = await prisma.attendance.update({
//         where: { id: todayRecord.id },
//         data: {
//           checkOut: checkOutTime,
//           checkOutReason: reason || null,
//           workingHours,
//           overtimeHours,
//           verified,
//           location: { ip, lat, lng, distance },
//           deviceInfo,
//           remarks: remarks || null,
//         },
//       });
//     }

//     return NextResponse.json({ success: true, attendance });
//   } catch (err: any) {
//     console.error("Attendance error:", err);
//     return NextResponse.json(
//       { error: "Something went wrong", details: err.message },
//       { status: 500 }
//     );
//   }
// }









// // src/app/api/attendance/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getAuth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";
// import moment from "moment-timezone";

// const TISH_LAT = 28.5163558;
// const TISH_LNG = 77.1035919;
// const MAX_DISTANCE_METERS = 100;
// const OFFICE_START = 7; // 7 AM IST
// const OFFICE_END = 19; // 7 PM IST

// function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
//   const R = 6371e3;
//   const toRad = (x: number) => (x * Math.PI) / 180;
//   const dLat = toRad(lat2 - lat1);
//   const dLng = toRad(lng2 - lng1);

//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // ✅ Get today's IST start & end converted to UTC for DB query
// function getISTDayRange() {
//   const now = moment().tz("Asia/Kolkata");
//   const startIST = now.clone().startOf("day");
//   const endIST = now.clone().endOf("day");

//   return {
//     startUTC: startIST.clone().utc().toDate(),
//     endUTC: endIST.clone().utc().toDate(),
//     startIST: startIST.toDate(), // 👈 store this in DB
//     nowIST: now,
//   };
// }

// export async function POST(req: Request) {
//   try {
//     const { userId } = getAuth(req as any);
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { type, reason, remarks, lat, lng } = await req.json();

//     const { startUTC, endUTC, startIST, nowIST } = getISTDayRange();
//     const now = nowIST.toDate();

//     const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
//     const deviceInfo = req.headers.get("user-agent") || "unknown device";

//     let employeeName = "Unknown";
//     try {
//       const clerkUser = await users.getUser(userId);
//       employeeName =
//         `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
//         clerkUser.username ||
//         clerkUser.emailAddresses[0]?.emailAddress ||
//         clerkUser.id;
//     } catch (err) {
//       console.error("Clerk fetch error:", err);
//     }

//     let distance: number | null = null;
//     let verified = false;
//     if (lat && lng) {
//       distance = getDistance(lat, lng, TISH_LAT, TISH_LNG);
//       verified = distance <= MAX_DISTANCE_METERS;
//     }

//     let todayRecord = await prisma.attendance.findFirst({
//       where: { userId, date: { gte: startUTC, lte: endUTC } },
//       orderBy: { createdAt: "desc" },
//     });

//     let attendance;

//     if (type === "checkIn") {
//       if (todayRecord?.checkIn) {
//         return NextResponse.json({ error: "Already checked in today" }, { status: 400 });
//       }

//       const hourIST = nowIST.hour();
//       if (hourIST < OFFICE_START || hourIST >= OFFICE_END) {
//         return NextResponse.json(
//           { error: "Check-in allowed only between 7 AM and 7 PM (IST)" },
//           { status: 400 }
//         );
//       }

//       let status = !verified ? "Unverified" : "On Time";
//       if (hourIST > 10 && verified) status = "Late";
//       if (hourIST > 10 && !reason && verified) {
//         return NextResponse.json(
//           { error: "Late check-in requires a reason" },
//           { status: 400 }
//         );
//       }

//       attendance = await prisma.attendance.create({
//         data: {
//           userId,
//           employeeName,
//           date: startIST, // 👈 FIX: store IST midnight instead of UTC
//           checkIn: now,
//           checkInReason: reason || null,
//           status,
//           verified,
//           location: { ip, lat, lng, distance },
//           deviceInfo,
//           remarks: remarks || null,
//         },
//       });
//     }

//     if (type === "checkOut") {
//       if (!todayRecord?.checkIn) {
//         return NextResponse.json({ error: "No check-in found for today" }, { status: 400 });
//       }
//       if (todayRecord.checkOut) {
//         return NextResponse.json({ error: "Already checked out today" }, { status: 400 });
//       }

//       const checkInTime = new Date(todayRecord.checkIn);
//       const checkOutTime = now;

//       const diffMs = checkOutTime.getTime() - checkInTime.getTime();
//       const workingHours = diffMs / (1000 * 60 * 60);
//       const overtimeHours = Math.max(0, workingHours - 8);

//       attendance = await prisma.attendance.update({
//         where: { id: todayRecord.id },
//         data: {
//           checkOut: checkOutTime,
//           checkOutReason: reason || null,
//           workingHours,
//           overtimeHours,
//           verified,
//           location: { ip, lat, lng, distance },
//           deviceInfo,
//           remarks: remarks || null,
//         },
//       });
//     }

//     return NextResponse.json({ success: true, attendance });
//   } catch (err: any) {
//     console.error("Attendance error:", err);
//     return NextResponse.json(
//       { error: "Something went wrong", details: err.message },
//       { status: 500 }
//     );
// //   }
// // }// src/app/api/attendance/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getAuth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";
// import moment from "moment-timezone";

// const TISH_LAT = 28.5163558;
// const TISH_LNG = 77.1035919;
// const MAX_DISTANCE_METERS = 100;
// const OFFICE_START = 7; // 7 AM IST
// const OFFICE_END = 19; // 7 PM IST

// function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
//   const R = 6371e3;
//   const toRad = (x: number) => (x * Math.PI) / 180;
//   const dLat = toRad(lat2 - lat1);
//   const dLng = toRad(lng2 - lng1);

//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // ✅ Get today's IST start & end, normalized to UTC for DB queries
// function getISTDayRange() {
//   const nowIST = moment().tz("Asia/Kolkata");
//   const startIST = nowIST.clone().startOf("day");
//   const endIST = nowIST.clone().endOf("day");

//   return {
//     startUTC: startIST.clone().utc().toDate(),   // for DB query
//     endUTC: endIST.clone().utc().toDate(),       // for DB query
//     todayUTC: startIST.clone().utc().toDate(),   // stored as 'date' in DB
//     nowUTC: nowIST.clone().utc().toDate(),       // exact timestamp UTC
//     nowIST,
//   };
// }

// export async function POST(req: Request) {
//   try {
//     const { userId } = getAuth(req as any);
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { type, reason, remarks, lat, lng } = await req.json();
//     const { startUTC, endUTC, todayUTC, nowUTC, nowIST } = getISTDayRange();

//     const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
//     const deviceInfo = req.headers.get("user-agent") || "unknown device";

//     let employeeName = "Unknown";
//     try {
//       const clerkUser = await users.getUser(userId);
//       employeeName =
//         `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
//         clerkUser.username ||
//         clerkUser.emailAddresses[0]?.emailAddress ||
//         clerkUser.id;
//     } catch (err) {
//       console.error("Clerk fetch error:", err);
//     }

//     let distance: number | null = null;
//     let verified = false;
//     if (lat && lng) {
//       distance = getDistance(lat, lng, TISH_LAT, TISH_LNG);
//       verified = distance <= MAX_DISTANCE_METERS;
//     }

//     // ✅ Find today's attendance record using UTC query range
//     let todayRecord = await prisma.attendance.findFirst({
//       where: { userId, date: { gte: startUTC, lte: endUTC } },
//       orderBy: { createdAt: "desc" },
//     });

//     let attendance;

//     if (type === "checkIn") {
//       if (todayRecord?.checkIn) {
//         return NextResponse.json({ error: "Already checked in today" }, { status: 400 });
//       }

//       const hourIST = nowIST.hour();
//       if (hourIST < OFFICE_START || hourIST >= OFFICE_END) {
//         return NextResponse.json(
//           { error: "Check-in allowed only between 7 AM and 7 PM (IST)" },
//           { status: 400 }
//         );
//       }

//       let status = !verified ? "Unverified" : "On Time";
//       if (hourIST > 10 && verified) status = "Late";
//       if (hourIST > 10 && !reason && verified) {
//         return NextResponse.json(
//           { error: "Late check-in requires a reason" },
//           { status: 400 }
//         );
//       }

//       attendance = await prisma.attendance.create({
//         data: {
//           userId,
//           employeeName,
//           date: todayUTC,       // ✅ store IST midnight as UTC
//           checkIn: nowUTC,      // ✅ exact UTC timestamp
//           checkInReason: reason || null,
//           status,
//           verified,
//           location: { ip, lat, lng, distance },
//           deviceInfo,
//           remarks: remarks || null,
//         },
//       });
//     }

//     if (type === "checkOut") {
//       if (!todayRecord?.checkIn) {
//         return NextResponse.json({ error: "No check-in found for today" }, { status: 400 });
//       }
//       if (todayRecord.checkOut) {
//         return NextResponse.json({ error: "Already checked out today" }, { status: 400 });
//       }

//       const checkInTime = new Date(todayRecord.checkIn);
//       const checkOutTime = nowUTC;

//       const diffMs = checkOutTime.getTime() - checkInTime.getTime();
//       const workingHours = diffMs / (1000 * 60 * 60);
//       const overtimeHours = Math.max(0, workingHours - 8);

//       attendance = await prisma.attendance.update({
//         where: { id: todayRecord.id },
//         data: {
//           checkOut: checkOutTime,
//           checkOutReason: reason || null,
//           workingHours,
//           overtimeHours,
//           verified,
//           location: { ip, lat, lng, distance },
//           deviceInfo,
//           remarks: remarks || null,
//         },
//       });
//     }

//     return NextResponse.json({ success: true, attendance });
//   } catch (err: any) {
//     console.error("Attendance error:", err);
//     return NextResponse.json(
//       { error: "Something went wrong", details: err.message },
//       { status: 500 }
//     );
//   }
// }




// // src/app/api/attendance/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getAuth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";
// import moment from "moment-timezone";

// const TISH_LAT = 28.5163558;
// const TISH_LNG = 77.1035919;
// const MAX_DISTANCE_METERS = 100;
// const OFFICE_START = 7; // 7 AM IST
// const OFFICE_END = 19;  // 7 PM IST

// function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
//   const R = 6371e3;
//   const toRad = (x: number) => (x * Math.PI) / 180;
//   const dLat = toRad(lat2 - lat1);
//   const dLng = toRad(lng2 - lng1);

//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // 🔹 Get tomorrow's IST midnight and current UTC
// function getISTDayRange() {
//   const nowIST = moment().tz("Asia/Kolkata");
//   const tomorrowIST = nowIST.clone().add(1, "day").startOf("day"); // ✅ tomorrow midnight
//   const endTomorrowIST = tomorrowIST.clone().endOf("day");

//   return {
//     startUTC: tomorrowIST.clone().utc().toDate(),    // for DB query
//     endUTC: endTomorrowIST.clone().utc().toDate(),   // for DB query
//     dateForDB: tomorrowIST.clone().utc().toDate(),   // store as 'date'
//     nowUTC: nowIST.clone().utc().toDate(),           // actual current timestamp
//   };
// }

// export async function POST(req: Request) {
//   try {
//     const { userId } = getAuth(req as any);
//     if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const { type, reason, remarks, lat, lng } = await req.json();
//     const { startUTC, endUTC, dateForDB, nowUTC } = getISTDayRange();

//     const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
//     const deviceInfo = req.headers.get("user-agent") || "unknown device";

//     let employeeName = "Unknown";
//     try {
//       const clerkUser = await users.getUser(userId);
//       employeeName =
//         `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
//         clerkUser.username ||
//         clerkUser.emailAddresses[0]?.emailAddress ||
//         clerkUser.id;
//     } catch (err) {
//       console.error("Clerk fetch error:", err);
//     }

//     let distance: number | null = null;
//     let verified = false;
//     if (lat && lng) {
//       distance = getDistance(lat, lng, TISH_LAT, TISH_LNG);
//       verified = distance <= MAX_DISTANCE_METERS;
//     }

//     // ✅ Find tomorrow's attendance record
//     let attendance = await prisma.attendance.findFirst({
//       where: { userId, date: { gte: startUTC, lte: endUTC } },
//       orderBy: { createdAt: "desc" },
//     });

//     const hourIST = moment().tz("Asia/Kolkata").hour();
//     if (hourIST < OFFICE_START || hourIST >= OFFICE_END) {
//       return NextResponse.json(
//         { error: "Check-in allowed only between 7 AM and 7 PM (IST)" },
//         { status: 400 }
//       );
//     }

//     if (type === "checkIn") {
//       if (attendance?.checkIn) {
//         return NextResponse.json({ error: "Already checked in tomorrow" }, { status: 400 });
//       }

//       let status = !verified ? "Unverified" : "On Time";
//       if (hourIST > 10 && verified) status = "Late";
//       if (hourIST > 10 && !reason && verified) {
//         return NextResponse.json({ error: "Late check-in requires a reason" }, { status: 400 });
//       }

//       attendance = await prisma.attendance.create({
//         data: {
//           userId,
//           employeeName,
//           date: dateForDB,     // ✅ store tomorrow's IST midnight
//           checkIn: nowUTC,     // actual check-in timestamp
//           checkInReason: reason || null,
//           status,
//           verified,
//           location: { ip, lat, lng, distance },
//           deviceInfo,
//           remarks: remarks || null,
//         },
//       });
//     }

//     if (type === "checkOut") {
//       if (!attendance?.checkIn) {
//         return NextResponse.json({ error: "No check-in found for tomorrow" }, { status: 400 });
//       }
//       if (attendance.checkOut) {
//         return NextResponse.json({ error: "Already checked out tomorrow" }, { status: 400 });
//       }

//       const checkInTime = new Date(attendance.checkIn);
//       const checkOutTime = nowUTC;
//       const diffMs = checkOutTime.getTime() - checkInTime.getTime();
//       const workingHours = diffMs / (1000 * 60 * 60);
//       const overtimeHours = Math.max(0, workingHours - 8);

//       attendance = await prisma.attendance.update({
//         where: { id: attendance.id },
//         data: {
//           checkOut: checkOutTime,
//           checkOutReason: reason || null,
//           workingHours,
//           overtimeHours,
//           verified,
//           location: { ip, lat, lng, distance },
//           deviceInfo,
//           remarks: remarks || null,
//         },
//       });
//     }

//     return NextResponse.json({ success: true, attendance });
//   } catch (err: any) {
//     console.error("Attendance error:", err);
//     return NextResponse.json(
//       { error: "Something went wrong", details: err.message },
//       { status: 500 }
//     );
//   }
// }












// // src/app/api/attendance/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getAuth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";
// import moment from "moment-timezone";

// const TISH_LAT = 28.5163558;
// const TISH_LNG = 77.1035919;
// const MAX_DISTANCE_METERS = 100;
// const OFFICE_START = 7; // 7 AM IST
// const OFFICE_END = 19;  // 7 PM IST

// function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
//   const R = 6371e3;
//   const toRad = (x: number) => (x * Math.PI) / 180;
//   const dLat = toRad(lat2 - lat1);
//   const dLng = toRad(lng2 - lng1);

//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // 🔹 Get tomorrow's IST midnight and current UTC
// function getISTDayRange() {
//   const nowIST = moment().tz("Asia/Kolkata");
//   const tomorrowIST = nowIST.clone().add(1, "day").startOf("day"); // ✅ tomorrow midnight
//   const endTomorrowIST = tomorrowIST.clone().endOf("day");

//   return {
//     startUTC: tomorrowIST.clone().utc().toDate(),    // for DB query
//     endUTC: endTomorrowIST.clone().utc().toDate(),   // for DB query
//     dateForDB: tomorrowIST.clone().utc().toDate(),   // store as 'date'
//     nowUTC: nowIST.clone().utc().toDate(),           // actual current timestamp
//   };
// }

// export async function POST(req: Request) {
//   try {
//     const { userId } = getAuth(req as any);
//     if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const { type, reason, remarks, lat, lng } = await req.json();
//     const { startUTC, endUTC, dateForDB, nowUTC } = getISTDayRange();

//     const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
//     const deviceInfo = req.headers.get("user-agent") || "unknown device";

//     let employeeName = "Unknown";
//     try {
//       const clerkUser = await users.getUser(userId);
//       employeeName =
//         `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
//         clerkUser.username ||
//         clerkUser.emailAddresses[0]?.emailAddress ||
//         clerkUser.id;
//     } catch (err) {
//       console.error("Clerk fetch error:", err);
//     }

//     let distance: number | null = null;
//     let verified = false;
//     if (lat && lng) {
//       distance = getDistance(lat, lng, TISH_LAT, TISH_LNG);
//       verified = distance <= MAX_DISTANCE_METERS;
//     }

//     // ✅ Find tomorrow's attendance record
//     let attendance = await prisma.attendance.findFirst({
//       where: { userId, date: { gte: startUTC, lte: endUTC } },
//       orderBy: { createdAt: "desc" },
//     });

//     const hourIST = moment().tz("Asia/Kolkata").hour();
//     if (hourIST < OFFICE_START || hourIST >= OFFICE_END) {
//       return NextResponse.json(
//         { error: "Check-in allowed only between 7 AM and 7 PM (IST)" },
//         { status: 400 }
//       );
//     }

//     if (type === "checkIn") {
//       if (attendance?.checkIn) {
//         return NextResponse.json({ error: "Already checked in tomorrow" }, { status: 400 });
//       }

//       let status = !verified ? "Unverified" : "On Time";
//       if (hourIST > 10 && verified) status = "Late";
//       if (hourIST > 10 && !reason && verified) {
//         return NextResponse.json({ error: "Late check-in requires a reason" }, { status: 400 });
//       }

//       attendance = await prisma.attendance.create({
//         data: {
//           userId,
//           employeeName,
//           date: dateForDB,     // ✅ store tomorrow's IST midnight
//           checkIn: nowUTC,     // actual check-in timestamp
//           checkInReason: reason || null,
//           status,
//           verified,
//           location: { ip, lat, lng, distance },
//           deviceInfo,
//           remarks: remarks || null,
//         },
//       });
//     }

//     if (type === "checkOut") {
//       if (!attendance?.checkIn) {
//         return NextResponse.json({ error: "No check-in found for tomorrow" }, { status: 400 });
//       }
//       if (attendance.checkOut) {
//         return NextResponse.json({ error: "Already checked out tomorrow" }, { status: 400 });
//       }

//       const checkInTime = new Date(attendance.checkIn);
//       const checkOutTime = nowUTC;
//       const diffMs = checkOutTime.getTime() - checkInTime.getTime();
//       const workingHours = diffMs / (1000 * 60 * 60);
//       const overtimeHours = Math.max(0, workingHours - 8);

//       attendance = await prisma.attendance.update({
//         where: { id: attendance.id },
//         data: {
//           checkOut: checkOutTime,
//           checkOutReason: reason || null,
//           workingHours,
//           overtimeHours,
//           verified,
//           location: { ip, lat, lng, distance },
//           deviceInfo,
//           remarks: remarks || null,
//         },
//       });
//     }

//     return NextResponse.json({ success: true, attendance });
//   } catch (err: any) {
//     console.error("Attendance error:", err);
//     return NextResponse.json(
//       { error: "Something went wrong", details: err.message },
//       { status: 500 }
//     );
//   }
// }




// // src/app/api/attendance/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getAuth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";
// import moment from "moment-timezone";

// const TISH_LAT = 28.5163558;
// const TISH_LNG = 77.1035919;
// const MAX_DISTANCE_METERS = 100;
// const OFFICE_START = 7; // 7 AM IST
// const OFFICE_END = 19;  // 7 PM IST
// const MAX_CHECKOUT_HOURS = 18; // ✅ Max 18 hours after check-in

// function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
//   const R = 6371e3;
//   const toRad = (x: number) => (x * Math.PI) / 180;
//   const dLat = toRad(lat2 - lat1);
//   const dLng = toRad(lng2 - lng1);

//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // 🔹 Get tomorrow's IST midnight and current UTC
// function getISTDayRange() {
//   const nowIST = moment().tz("Asia/Kolkata");
//   const tomorrowIST = nowIST.clone().add(1, "day").startOf("day"); // ✅ tomorrow midnight
//   const endTomorrowIST = tomorrowIST.clone().endOf("day");

//   return {
//     startUTC: tomorrowIST.clone().utc().toDate(),    // for DB query
//     endUTC: endTomorrowIST.clone().utc().toDate(),   // for DB query
//     dateForDB: tomorrowIST.clone().utc().toDate(),   // store as 'date'
//     nowUTC: nowIST.clone().utc().toDate(),           // actual current timestamp
//   };
// }

// export async function POST(req: Request) {
//   try {
//     const { userId } = getAuth(req as any);
//     if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const { type, reason, remarks, lat, lng } = await req.json();
//     const { startUTC, endUTC, dateForDB, nowUTC } = getISTDayRange();

//     const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
//     const deviceInfo = req.headers.get("user-agent") || "unknown device";

//     let employeeName = "Unknown";
//     try {
//       const clerkUser = await users.getUser(userId);
//       employeeName =
//         `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
//         clerkUser.username ||
//         clerkUser.emailAddresses[0]?.emailAddress ||
//         clerkUser.id;
//     } catch (err) {
//       console.error("Clerk fetch error:", err);
//     }

//     let distance: number | null = null;
//     let verified = false;
//     if (lat && lng) {
//       distance = getDistance(lat, lng, TISH_LAT, TISH_LNG);
//       verified = distance <= MAX_DISTANCE_METERS;
//     }

//     // ✅ Find tomorrow's attendance record
//     let attendance = await prisma.attendance.findFirst({
//       where: { userId, date: { gte: startUTC, lte: endUTC } },
//       orderBy: { createdAt: "desc" },
//     });

//     const hourIST = moment().tz("Asia/Kolkata").hour();

//     if (type === "checkIn") {
//       if (hourIST < OFFICE_START || hourIST >= OFFICE_END) {
//         return NextResponse.json(
//           { error: "Check-in allowed only between 7 AM and 7 PM (IST)" },
//           { status: 400 }
//         );
//       }

//       if (attendance?.checkIn) {
//         return NextResponse.json({ error: "Already checked in tomorrow" }, { status: 400 });
//       }

//       let status = !verified ? "Unverified" : "On Time";
//       if (hourIST > 10 && verified) status = "Late";
//       if (hourIST > 10 && !reason && verified) {
//         return NextResponse.json({ error: "Late check-in requires a reason" }, { status: 400 });
//       }

//       attendance = await prisma.attendance.create({
//         data: {
//           userId,
//           employeeName,
//           date: dateForDB,
//           checkIn: nowUTC,
//           checkInReason: reason || null,
//           status,
//           verified,
//           location: { ip, lat, lng, distance },
//           deviceInfo,
//           remarks: remarks || null,
//         },
//       });
//     }

//     if (type === "checkOut") {
//       if (!attendance?.checkIn) {
//         return NextResponse.json({ error: "No check-in found for tomorrow" }, { status: 400 });
//       }
//       if (attendance.checkOut) {
//         return NextResponse.json({ error: "Already checked out tomorrow" }, { status: 400 });
//       }

//       const checkInTime = new Date(attendance.checkIn);
//       const checkOutTime = nowUTC;
//       const diffMs = checkOutTime.getTime() - checkInTime.getTime();
//       const workingHours = diffMs / (1000 * 60 * 60);

//       if (workingHours > MAX_CHECKOUT_HOURS) {
//         return NextResponse.json(
//           { error: `Check-out must be within ${MAX_CHECKOUT_HOURS} hours of check-in` },
//           { status: 400 }
//         );
//       }

//       const overtimeHours = Math.max(0, workingHours - 8);

//       attendance = await prisma.attendance.update({
//         where: { id: attendance.id },
//         data: {
//           checkOut: checkOutTime,
//           checkOutReason: reason || null,
//           workingHours,
//           overtimeHours,
//           verified,
//           location: { ip, lat, lng, distance },
//           deviceInfo,
//           remarks: remarks || null,
//         },
//       });
//     }

//     return NextResponse.json({ success: true, attendance });
//   } catch (err: any) {
//     console.error("Attendance error:", err);
//     return NextResponse.json(
//       { error: "Something went wrong", details: err.message },
//       { status: 500 }
//     );
//   }
// }


// src/app/api/attendance/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { users } from "@clerk/clerk-sdk-node";
import moment from "moment-timezone";

const TISH_LAT = 28.5163558;
const TISH_LNG = 77.1035919;
const MAX_DISTANCE_METERS = 100;
const OFFICE_START = 7; // 7 AM IST
const OFFICE_END = 19;  // 7 PM IST
const MAX_CHECKOUT_HOURS = 18; // ✅ Max 18 hours after check-in

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 🔹 Get tomorrow's IST midnight and current UTC
function getISTDayRange() {
  const nowIST = moment().tz("Asia/Kolkata");
  const tomorrowIST = nowIST.clone().add(1, "day").startOf("day"); // ✅ tomorrow midnight
  const endTomorrowIST = tomorrowIST.clone().endOf("day");

  return {
    startUTC: tomorrowIST.clone().utc().toDate(),    // for DB query
    endUTC: endTomorrowIST.clone().utc().toDate(),   // for DB query
    dateForDB: tomorrowIST.clone().utc().toDate(),   // store as 'date'
    nowUTC: nowIST.clone().utc().toDate(),           // actual current timestamp
  };
}

export async function POST(req: Request) {
  try {
    const { userId } = getAuth(req as any);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { type, reason, remarks, lat, lng } = await req.json();
    const { startUTC, endUTC, dateForDB, nowUTC } = getISTDayRange();

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const deviceInfo = req.headers.get("user-agent") || "unknown device";

    let employeeName = "Unknown";
    try {
      const clerkUser = await users.getUser(userId);
      employeeName =
        `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
        clerkUser.username ||
        clerkUser.emailAddresses[0]?.emailAddress ||
        clerkUser.id;
    } catch (err) {
      console.error("Clerk fetch error:", err);
    }

    let distance: number | null = null;
    let verified = false;
    if (lat && lng) {
      distance = getDistance(lat, lng, TISH_LAT, TISH_LNG);
      verified = distance <= MAX_DISTANCE_METERS;
    }

    // ✅ Find tomorrow's attendance record
    let attendance = await prisma.attendance.findFirst({
      where: { userId, date: { gte: startUTC, lte: endUTC } },
      orderBy: { createdAt: "desc" },
    });

    const hourIST = moment().tz("Asia/Kolkata").hour();

    if (type === "checkIn") {
      if (hourIST < OFFICE_START || hourIST >= OFFICE_END) {
        return NextResponse.json(
          { error: "Check-in allowed only between 7 AM and 7 PM (IST)" },
          { status: 400 }
        );
      }

      if (attendance?.checkIn) {
        return NextResponse.json({ error: "Already checked in tomorrow" }, { status: 400 });
      }

      let status = !verified ? "Unverified" : "On Time";
      if (hourIST > 10 && verified) status = "Late";
      if (hourIST > 10 && !reason && verified) {
        return NextResponse.json({ error: "Late check-in requires a reason" }, { status: 400 });
      }

      attendance = await prisma.attendance.create({
        data: {
          userId,
          employeeName,
          date: dateForDB,
          checkIn: nowUTC,
          checkInReason: reason || null,
          status,
          verified,
          location: { ip, lat, lng, distance },
          deviceInfo,
          remarks: remarks || null,
        },
      });
    }

    if (type === "checkOut") {
      if (!attendance?.checkIn) {
        return NextResponse.json({ error: "No check-in found for tomorrow" }, { status: 400 });
      }
      if (attendance.checkOut) {
        return NextResponse.json({ error: "Already checked out tomorrow" }, { status: 400 });
      }

      const checkInTime = new Date(attendance.checkIn);
      const checkOutTime = nowUTC;
      const diffMs = checkOutTime.getTime() - checkInTime.getTime();
      const workingHours = diffMs / (1000 * 60 * 60);

      if (workingHours > MAX_CHECKOUT_HOURS) {
        return NextResponse.json(
          { error: `Check-out must be within ${MAX_CHECKOUT_HOURS} hours of check-in` },
          { status: 400 }
        );
      }

      const overtimeHours = Math.max(0, workingHours - 8);

      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: checkOutTime,
          checkOutReason: reason || null,
          workingHours,
          overtimeHours,
          verified,
          location: { ip, lat, lng, distance },
          deviceInfo,
          remarks: remarks || null,
        },
      });
    }

    return NextResponse.json({ success: true, attendance });
  } catch (err: any) {
    console.error("Attendance error:", err);
    return NextResponse.json(
      { error: "Something went wrong", details: err.message },
      { status: 500 }
    );
  }
}
