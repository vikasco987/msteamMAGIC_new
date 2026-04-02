// // /app/api/attendance/check-out/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@clerk/nextjs/server";
// import { prisma } from "@/lib/prisma";

// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = auth();
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const attendance = await prisma.attendance.findFirst({
//       where: {
//         userId,
//         date: {
//           gte: today,
//         },
//       },
//     });

//     if (!attendance) {
//       return NextResponse.json({ error: "No check-in found for today" }, { status: 400 });
//     }

//     if (attendance.checkOut) {
//       return NextResponse.json({ error: "Already checked out today" }, { status: 400 });
//     }

//     const updated = await prisma.attendance.update({
//       where: { id: attendance.id },
//       data: { checkOut: new Date() },
//     });

//     return NextResponse.json({ success: true, attendance: updated }, { status: 200 });
//   } catch (error) {
//     console.error("Check-out Error:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error during check-out" },
//       { status: 500 }
//     );
//   }
// }




// /app/api/attendance/check-out/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"; // 👈 use `auth` instead of getAuth

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth(); // 👈 works reliably in App Router

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: { gte: today },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "No check-in found for today" },
        { status: 400 }
      );
    }

    if (attendance.checkOut) {
      return NextResponse.json(
        { error: "Already checked out today" },
        { status: 400 }
      );
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { checkOut: new Date() },
    });

    return NextResponse.json({ success: true, attendance: updated });
  } catch (error) {
    console.error("Check-out Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during check-out" },
      { status: 500 }
    );
  }
}
