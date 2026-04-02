// // src/app/api/attendance/list/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export async function GET() {
//   try {
//     const records = await prisma.attendance.findMany({
//       orderBy: { createdAt: "desc" }, // latest first
//     });

//     return NextResponse.json(records);
//   } catch (error) {
//     console.error("Error fetching attendance:", error);
//     return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
//   }
// }




// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth, clerkClient } from "@clerk/nextjs/server";

// export async function GET(req: Request) {
//   try {
//     const { userId } = await auth();
//     if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const { searchParams } = new URL(req.url);
//     const month = searchParams.get("month");
//     const all = searchParams.get("all");

//     let whereClause: any = {};
//     if (!all) whereClause.userId = userId;

//     if (month) {
//       const startDate = new Date(`${month}-01T00:00:00.000Z`);
//       const endDate = new Date(startDate);
//       endDate.setMonth(endDate.getMonth() + 1);
//       whereClause.date = { gte: startDate, lt: endDate };
//     }

//     const records = await prisma.attendance.findMany({
//       where: whereClause,
//       orderBy: { createdAt: "desc" },
//     });

//     const recordsWithName = await Promise.all(
//       records.map(async (r) => {
//         try {
//           const user = await clerkClient.users.getUser(r.userId);
//           const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
//           return { ...r, fullName };
//         } catch {
//           return { ...r, fullName: r.userId };
//         }
//       })
//     );

//     return NextResponse.json(recordsWithName);
//   } catch (error) {
//     console.error("Error fetching attendance:", error);
//     return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
//   }
// }

// // src/app/api/attendance/list/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { clerkClient } from "@clerk/nextjs/server";

// export async function GET() {
//   try {
//     const records = await prisma.attendance.findMany({
//       orderBy: { createdAt: "desc" },
//     });

//     if (records.length === 0) {
//       return NextResponse.json({ attendances: [] });
//     }

//     // Collect unique userIds missing employeeName
//     const missingIds = records
//       .filter(r => !r.employeeName)
//       .map(r => r.userId);
//     const uniqueIds = Array.from(new Set(missingIds));

//     let userMap = new Map<string, string>();

//     // ✅ Fetch each user individually instead of getUserList
//     for (const id of uniqueIds) {
//       try {
//         const user = await clerkClient.users.getUser(id);
//         const fullName =
//           `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
//           user.username ||
//           user.emailAddresses[0]?.emailAddress ||
//           "Unknown";
//         userMap.set(id, fullName);
//       } catch (err) {
//         console.error(`⚠️ Failed to fetch user ${id}:`, err);
//         userMap.set(id, "Unknown");
//       }
//     }

//     // Enrich only if employeeName missing
//     const enriched = records.map(r => ({
//       ...r,
//       employeeName: r.employeeName || userMap.get(r.userId) || "Unknown",
//     }));

//     return NextResponse.json({ attendances: enriched });
//   } catch (error) {
//     console.error("💥 Attendance fetch failed:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch attendance" },
//       { status: 500 }
//     );
//   }
// }







// // src/app/api/attendance/list/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { clerkClient } from "@clerk/clerk-sdk-node";

// export async function GET() {
//   try {
//     const records = await prisma.attendance.findMany({
//       orderBy: { createdAt: "desc" },
//     });

//     if (records.length === 0) {
//       return NextResponse.json([]);
//     }

//     // Collect unique userIds missing employeeName
//     const missingIds = records
//       .filter(r => !r.employeeName)
//       .map(r => r.userId);
//     const uniqueIds = Array.from(new Set(missingIds));

//     const userMap = new Map<string, string>();

//     for (const id of uniqueIds) {
//       try {
//         const user = await clerkClient.users.getUser(id);

//         const fullName =
//           `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
//           user.username ||
//           "Unknown";

//         userMap.set(id, fullName);
//       } catch (err) {
//         console.error(`⚠️ Failed to fetch user ${id}:`, err);
//         userMap.set(id, "Unknown");
//       }
//     }

//     // Enrich only if employeeName missing
//     const enriched = records.map(r => ({
//       ...r,
//       employeeName: r.employeeName || userMap.get(r.userId) || "Unknown",
//     }));

//     return NextResponse.json(enriched);
//   } catch (error) {
//     console.error("💥 Attendance fetch failed:", error);
//     return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
//   }
// }











// // src/app/api/attendance/list/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { clerkClient } from "@clerk/clerk-sdk-node";

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const date = searchParams.get("date");   // ✅ YYYY-MM-DD
//     const month = searchParams.get("month"); // ✅ YYYY-MM

//     let where: any = {};

//     // ---------------- Default: Today ----------------
//     if (!date && !month) {
//       const today = new Date();
//       const startDate = new Date(today.setHours(0, 0, 0, 0));
//       const endDate = new Date(today.setHours(23, 59, 59, 999));
//       where.date = { gte: startDate, lte: endDate };
//     }

//     // ---------------- Date Filter ----------------
//     if (date) {
//       const startDate = new Date(`${date}T00:00:00.000Z`);
//       const endDate = new Date(`${date}T23:59:59.999Z`);
//       where.date = { gte: startDate, lte: endDate };
//     }

//     // ---------------- Month Filter ----------------
//     if (month) {
//       const startDate = new Date(`${month}-01T00:00:00.000Z`);
//       const endDate = new Date(startDate);
//       endDate.setMonth(endDate.getMonth() + 1);
//       where.date = { gte: startDate, lt: endDate };
//     }

//     // ---------------- Query Attendance ----------------
//     const records = await prisma.attendance.findMany({
//       where,
//       orderBy: { createdAt: "desc" },
//     });

//     if (records.length === 0) {
//       return NextResponse.json([]);
//     }

//     // ---------------- Enrich with Clerk ----------------
//     const missingIds = records
//       .filter(r => !r.employeeName)
//       .map(r => r.userId);
//     const uniqueIds = Array.from(new Set(missingIds));

//     const userMap = new Map<string, string>();

//     for (const id of uniqueIds) {
//       try {
//         const user = await clerkClient.users.getUser(id);

//         const fullName =
//           `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
//           user.username ||
//           "Unknown";

//         userMap.set(id, fullName);
//       } catch (err) {
//         console.error(`⚠️ Failed to fetch user ${id}:`, err);
//         userMap.set(id, "Unknown");
//       }
//     }

//     const enriched = records.map(r => ({
//       ...r,
//       employeeName: r.employeeName || userMap.get(r.userId) || "Unknown",
//     }));

//     return NextResponse.json(enriched);
//   } catch (error: any) {
//     console.error("💥 Attendance fetch failed:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch attendance", details: error.message },
//       { status: 500 }
//     );
//   }
// }



// // src/app/api/attendance/list/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { clerkClient } from "@clerk/clerk-sdk-node";

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const date = searchParams.get("date");   // ✅ YYYY-MM-DD
//     const month = searchParams.get("month"); // ✅ YYYY-MM

//     let where: any = {};

//     // ---------------- Default: Today ----------------
//     if (!date && !month) {
//       const today = new Date();
//       const startDate = new Date(today.setHours(0, 0, 0, 0));
//       const endDate = new Date(today.setHours(23, 59, 59, 999));
//       where.date = { gte: startDate, lte: endDate };
//     }

//     // ---------------- Date Filter ----------------
//     if (date) {
//       const startDate = new Date(`${date}T00:00:00.000Z`);
//       const endDate = new Date(`${date}T23:59:59.999Z`);
//       where.date = { gte: startDate, lte: endDate };
//     }

//     // ---------------- Month Filter ----------------
//     if (month) {
//       const startDate = new Date(`${month}-01T00:00:00.000Z`);
//       const endDate = new Date(startDate);
//       endDate.setMonth(endDate.getMonth() + 1);
//       where.date = { gte: startDate, lt: endDate };
//     }

//     // ---------------- Query Attendance ----------------
//     const records = await prisma.attendance.findMany({
//       where,
//       orderBy: { createdAt: "desc" },
//     });

//     if (!records || records.length === 0) {
//       return NextResponse.json([]);
//     }

//     // ---------------- Enrich with Clerk ----------------
//     const missingIds = records
//       .filter(r => !r.employeeName)
//       .map(r => r.userId);
//     const uniqueIds = Array.from(new Set(missingIds));

//     const userMap = new Map<string, string>();

//     for (const id of uniqueIds) {
//       try {
//         const user = await clerkClient.users.getUser(id);
//         const fullName =
//           `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
//           user.username ||
//           "Unknown";
//         userMap.set(id, fullName);
//       } catch (err) {
//         console.error(`⚠️ Failed to fetch user ${id}:`, err);
//         userMap.set(id, "Unknown");
//       }
//     }

//     const enriched = records.map(r => ({
//       ...r,
//       employeeName: r.employeeName || userMap.get(r.userId) || "Unknown",
//       checkIn: r.checkIn || null,
//       checkOut: r.checkOut || null,
//       workingHours: r.workingHours || 0,
//       overtimeHours: r.overtimeHours || 0,
//       remarks: r.remarks || null,
//       status: r.status || null,
//       verified: r.verified || false,
//       location: r.location || null,
//       deviceInfo: r.deviceInfo || null,
//       createdAt: r.createdAt,
//       updatedAt: r.updatedAt,
//     }));

//     return NextResponse.json(enriched);
//   } catch (error: any) {
//     console.error("💥 Attendance fetch failed:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch attendance", details: error.message },
//       { status: 500 }
//     );
//   }
// }
//corect


// src/app/api/attendance/list/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";

function calculateHours(checkIn?: Date | null, checkOut?: Date | null) {
  if (!checkIn || !checkOut) return { hours: 0, overtime: 0 };

  const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  const hours = diffMs / (1000 * 60 * 60);

  // office hours = 9 to 7 → 10 hours
  const baseHours = 10;
  const overtime = hours > baseHours ? hours - baseHours : 0;

  return { hours, overtime };
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const metadataRole = (clerkUser.publicMetadata as any)?.role || (clerkUser.privateMetadata as any)?.role;
    const userRole = String(metadataRole || dbUser?.role || "USER").toUpperCase();
    
    const isTeamLeader = (dbUser as any)?.isTeamLeader || userRole === "TL";
    const isPrivileged = userRole === "ADMIN" || userRole === "MASTER";

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");   // ✅ YYYY-MM-DD
    const month = searchParams.get("month"); // ✅ YYYY-MM
    const all = searchParams.get("all") === "true";

    let where: any = {};

    // Permission Filtering
    if (!isPrivileged) {
      if (isTeamLeader && all) {
        const members = await prisma.user.findMany({
          where: { leaderId: userId } as any,
          select: { clerkId: true }
        });
        const teamMemberIds = members.map(m => m.clerkId);
        where.userId = { in: [userId, ...teamMemberIds] };
      } else {
        where.userId = userId;
      }
    }
    if (isPrivileged && !all) {
      where.userId = userId;
    }

    // ---------------- Default: Today ----------------
    if (!date && !month) {
      const today = new Date();
      const startDate = new Date(today.setHours(0, 0, 0, 0));
      const endDate = new Date(today.setHours(23, 59, 59, 999));
      where.date = { gte: startDate, lte: endDate };
    }

    // ---------------- Date Filter ----------------
    if (date) {
      const startDate = new Date(`${date}T00:00:00.000Z`);
      const endDate = new Date(`${date}T23:59:59.999Z`);
      where.date = { gte: startDate, lte: endDate };
    }

    // ---------------- Month Filter ----------------
    if (month) {
      const startDate = new Date(`${month}-01T00:00:00.000Z`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      where.date = { gte: startDate, lt: endDate };
    }

    // ---------------- Query Attendance ----------------
    const records = await prisma.attendance.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    if (!records || records.length === 0) {
      return NextResponse.json([]);
    }

    // ---------------- Enrich with Clerk ----------------
    const missingIds = records
      .filter(r => !r.employeeName)
      .map(r => r.userId);
    const uniqueIds = Array.from(new Set(missingIds));

    const userMap = new Map<string, string>();

    for (const id of uniqueIds) {
      try {
        const user = await client.users.getUser(id);
        const fullName =
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.username ||
          "Unknown";
        userMap.set(id, fullName);
      } catch (err) {
        console.error(`⚠️ Failed to fetch user ${id}:`, err);
        userMap.set(id, "Unknown");
      }
    }

    // ---------------- Add Computed Fields ----------------
    const enriched = records.map(r => {
      const { hours, overtime } = calculateHours(r.checkIn, r.checkOut);

      const isLate =
        r.checkIn &&
        (new Date(r.checkIn).getHours() > 10 ||
          (new Date(r.checkIn).getHours() === 10 &&
            new Date(r.checkIn).getMinutes() > 15));

      const isEarlyLeave =
        r.checkOut && new Date(r.checkOut).getHours() < 19;

      return {
        ...r,
        employeeName: r.employeeName || userMap.get(r.userId) || "Unknown",
        checkIn: r.checkIn || null,
        checkOut: r.checkOut || null,
        workingHours: r.workingHours || hours,
        overtimeHours: r.overtimeHours || overtime,
        remarks: r.remarks || null,
        status: r.status || null,
        verified: r.verified || false,
        location: r.location || null,
        deviceInfo: r.deviceInfo || null,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        // 👇 new fields (safe additions)
        isLate,
        isEarlyLeave,
      };
    });

    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("💥 Attendance fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance", details: error.message },
      { status: 500 }
    );
  }
}
