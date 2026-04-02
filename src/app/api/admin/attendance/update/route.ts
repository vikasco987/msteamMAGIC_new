// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth, clerkClient } from "@clerk/nextjs/server";

// export async function POST(req: Request) {
//   try {
//     // 🔐 Get logged-in user
//     const { userId } = auth();

//     if (!userId) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     // 🔎 Fetch Clerk user to check role
//     const clerkUser = await clerkClient.users.getUser(userId);
//     const role = clerkUser.publicMetadata?.role;

//     // 🛑 Admin guard
//     if (role !== "ADMIN") {
//       return NextResponse.json(
//         { error: "Admin access only" },
//         { status: 403 }
//       );
//     }

//     // 📦 Parse body
//     const body = await req.json();
//     const {
//       userId: employeeId, // 👤 employee id
//       date,               // 📅 YYYY-MM-DD
//       checkIn,            // ⏱ ISO string | null
//       checkOut,           // ⏱ ISO string | null
//       reason,             // optional
//       remarks,            // optional
//     } = body;

//     // 🧱 Validation
//     if (!employeeId || !date) {
//       return NextResponse.json(
//         { error: "userId and date are required" },
//         { status: 400 }
//       );
//     }

//     // 🕛 Normalize date (important for unique constraint)
//     const attendanceDate = new Date(date);
//     attendanceDate.setHours(0, 0, 0, 0);

//     // ⚠️ Safety check: checkout after checkin
//     if (checkIn && checkOut) {
//       if (new Date(checkOut) < new Date(checkIn)) {
//         return NextResponse.json(
//           { error: "Check-out cannot be before check-in" },
//           { status: 400 }
//         );
//       }
//     }

//     // 🔄 UPSERT attendance
//     const attendance = await prisma.attendance.upsert({
//       where: {
//         userId_date: {
//           userId: employeeId,
//           date: attendanceDate,
//         },
//       },
//       update: {
//         checkIn: checkIn ? new Date(checkIn) : null,
//         checkOut: checkOut ? new Date(checkOut) : null,
//         reason: reason || null,
//         remarks: remarks || null,
//       },
//       create: {
//         userId: employeeId,
//         date: attendanceDate,
//         checkIn: checkIn ? new Date(checkIn) : null,
//         checkOut: checkOut ? new Date(checkOut) : null,
//         reason: reason || null,
//         remarks: remarks || null,
//       },
//     });

//     // ✅ Success
//     return NextResponse.json({
//       success: true,
//       message: "Attendance updated by admin",
//       attendance,
//     });
//   } catch (error) {
//     console.error("❌ Admin attendance update failed:", error);

//     return NextResponse.json(
//       { error: "Failed to update attendance" },
//       { status: 500 }
//     );
//   }
// }



// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";

// export async function POST(req: NextRequest) {
//   try {
//     // ✅ SAME AUTH STYLE AS WORKING FILE
//     const { userId } = auth();

//     if (!userId) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     // 🔎 Fetch admin from Clerk
//     const adminUser = await users.getUser(userId);
//     const role = adminUser.publicMetadata?.role;

//     // 🛑 Admin guard
//     // if (role !== "ADMIN") {
//     //   return NextResponse.json(
//     //     { error: "Admin access only" },
//     //     { status: 403 }
//     //   );
//     // }

//     // 📦 Parse body
//     const body = await req.json();
//     const {
//       userId: employeeId,
//       date,
//       checkIn,
//       checkOut,
//       reason,
//       remarks,
//     } = body;

//     // 🧱 Validation
//     if (!employeeId || !date) {
//       return NextResponse.json(
//         { error: "userId and date are required" },
//         { status: 400 }
//       );
//     }

//     // 🕛 Normalize date
//     const attendanceDate = new Date(date);
//     attendanceDate.setHours(0, 0, 0, 0);

//     // ⚠️ Safety check
//     if (checkIn && checkOut) {
//       if (new Date(checkOut) < new Date(checkIn)) {
//         return NextResponse.json(
//           { error: "Check-out cannot be before check-in" },
//           { status: 400 }
//         );
//       }
//     }

//     // 🔄 UPSERT attendance
//     const attendance = await prisma.attendance.upsert({
//       where: {
//         userId_date: {
//           userId: employeeId,
//           date: attendanceDate,
//         },
//       },
//       update: {
//         checkIn: checkIn ? new Date(checkIn) : null,
//         checkOut: checkOut ? new Date(checkOut) : null,
//         reason: reason || null,
//         remarks: remarks || null,
//       },
//       create: {
//         userId: employeeId,
//         date: attendanceDate,
//         checkIn: checkIn ? new Date(checkIn) : null,
//         checkOut: checkOut ? new Date(checkOut) : null,
//         reason: reason || null,
//         remarks: remarks || null,
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       message: "Attendance updated by admin",
//       attendance,
//     });

//   } catch (error) {
//     console.error("❌ Admin attendance update failed:", error);
//     return NextResponse.json(
//       { error: "Failed to update attendance" },
//       { status: 500 }
//     );
//   }
// }

// export async function OPTIONS() {
//   return NextResponse.json({ ok: true });
// }





// // app/api/admin/attendance/update/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { users } from "@clerk/clerk-sdk-node";

// export async function POST(req: NextRequest) {
//   try {
//     // ✅ Auth using Tish style
//     const { userId: adminId } = auth();
//     if (!adminId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // 🔎 Fetch admin user from Clerk
//     const adminUser = await users.getUser(adminId);
//     const role = adminUser.publicMetadata?.role;

//     // 🛑 Admin guard
//     // if (role !== "ADMIN") {
//     //   return NextResponse.json(
//     //     { error: "Admin access only" },
//     //     { status: 403 }
//     //   );
//     // }

//     // 📦 Parse request body
//     const body = await req.json();
//     const {
//       attendanceId,       // optional: for updating an existing record
//       userId: employeeId, // target employee
//       date,
//       checkIn,
//       checkOut,
//       reason,
//       remarks,
//     } = body;

//     // 🧱 Validation
//     if (!employeeId || !date) {
//       return NextResponse.json(
//         { error: "userId and date are required" },
//         { status: 400 }
//       );
//     }

//     // 🕛 Normalize date
//     const attendanceDate = new Date(date);
//     attendanceDate.setHours(0, 0, 0, 0);

//     // ⚠️ Safety: check-out after check-in
//     if (checkIn && checkOut && new Date(checkOut) < new Date(checkIn)) {
//       return NextResponse.json(
//         { error: "Check-out cannot be before check-in" },
//         { status: 400 }
//       );
//     }

//     let attendance;

//     // ✏️ Update existing attendance if attendanceId provided
//     if (attendanceId) {
//       attendance = await prisma.attendance.update({
//         where: { id: attendanceId },
//         data: {
//           checkIn: checkIn ? new Date(checkIn) : null,
//           checkOut: checkOut ? new Date(checkOut) : null,
//           reason: reason || null,
//           remarks: remarks || null,
//           date: attendanceDate, // update date if needed
//         },
//       });
//     } 
//     // ➕ Create new attendance (duplicates allowed)
//     else {
//       attendance = await prisma.attendance.create({
//         data: {
//           userId: employeeId,
//           date: attendanceDate,
//           checkIn: checkIn ? new Date(checkIn) : null,
//           checkOut: checkOut ? new Date(checkOut) : null,
//           reason: reason || null,
//           remarks: remarks || null,
//         },
//       });
//     }

//     return NextResponse.json({
//       success: true,
//       message: attendanceId
//         ? "Attendance updated successfully"
//         : "Attendance created successfully",
//       attendance,
//     });
//   } catch (error) {
//     console.error("❌ Admin attendance update failed:", error);
//     return NextResponse.json(
//       { error: "Failed to update attendance" },
//       { status: 500 }
//     );
//   }
// }

// // OPTIONS for preflight (CORS)
// export async function OPTIONS() {
//   return NextResponse.json({ ok: true });
// }




import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    // ✅ Authenticate (ANY logged-in user)
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 📦 Parse request body
    const body = await req.json();
    const {
      userId: employeeId,
      date,
      checkIn,
      checkOut,
      checkInReason,
      checkOutReason,
      remarks,
    } = body;

    // 🧱 Validation
    if (!employeeId || !date) {
      return NextResponse.json(
        { error: "userId and date are required" },
        { status: 400 }
      );
    }

    // 🕛 Normalize date (important for reports)
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // ⚠️ Time validation
    if (
      checkIn &&
      checkOut &&
      new Date(checkOut).getTime() < new Date(checkIn).getTime()
    ) {
      return NextResponse.json(
        { error: "Check-out cannot be before check-in" },
        { status: 400 }
      );
    }

    // 🔄 Create attendance (duplicates allowed)
    const attendance = await prisma.attendance.create({
      data: {
        userId: employeeId,
        date: attendanceDate,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        checkInReason: checkInReason || null,
        checkOutReason: checkOutReason || null,
        remarks: remarks || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Attendance record created successfully",
      attendance,
    });

  } catch (error) {
    console.error("❌ Attendance create error:", error);
    return NextResponse.json(
      { error: "Failed to create attendance" },
      { status: 500 }
    );
  }
}

// ✅ Preflight
export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}
