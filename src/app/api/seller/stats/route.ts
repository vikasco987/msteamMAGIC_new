// // src/app/api/seller/stats/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";

// export async function GET(req: Request) {
//   try {
   
//     const { userId } = await auth();

//     if (!userId) {
//       console.error("❌ Unauthorized request - no userId from Clerk");
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     const { searchParams } = new URL(req.url);
//     const month = searchParams.get("month"); // YYYY-MM

//     if (!month) {
//       return NextResponse.json(
//         { error: "Month query param required (YYYY-MM)" },
//         { status: 400 }
//       );
//     }

//     const startDate = new Date(`${month}-01T00:00:00.000Z`);
//     const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));

//     // Fetch tasks for this seller
//     const tasks = await prisma.task.findMany({
//       where: {
//         createdByClerkId: userId, // ✅ only seller’s tasks
//         createdAt: {
//           gte: startDate,
//           lt: endDate,
//         },
//       },
//       select: {
//         amount: true,
//         received: true,
//         createdAt: true,
//       },
//     });

//     if (!tasks || tasks.length === 0) {
//       console.warn(`⚠️ No tasks found for sellerId=${userId}, month=${month}`);
//     }

//     // Debug log
//     console.log(`📦 Tasks for seller ${userId} in ${month}:`, tasks);

//     // Revenue calculations
//     const totalRevenue = tasks.reduce((sum, t) => sum + (t.amount ?? 0), 0);
//     const totalReceived = tasks.reduce((sum, t) => sum + (t.received ?? 0), 0);
//     const pendingAmount = totalRevenue - totalReceived;

//     return NextResponse.json(
//       {
//         sellerId: userId,
//         month,
//         totalRevenue,
//         totalReceived,
//         pendingAmount,
//         taskCount: tasks.length,
//       },
//       { status: 200 }
//     );
//   } catch (error: any) {
//     console.error("🔥 Error in /api/seller/stats:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error", details: error.message },
//       { status: 500 }
//     );
//   }
// }














import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const safeFloat = (v: any): number => {
  if (v == null || v === "") return 0;
  const n = parseFloat(String(v));
  return isNaN(n) || !isFinite(n) ? 0 : n;
};

export async function GET(req: Request) {
  try {
    const { userId } = await auth(); // ⚡️ no need for await here

    if (!userId) {
      console.error("❌ Unauthorized request - no userId from Clerk");
      
    // Fetch Seller Target
    const monthInt = parseInt(month.split("-")[1], 10);
    const yearInt = parseInt(month.split("-")[0], 10);
    const targetSellerId = userIds.length === 1 ? userIds[0] : null;

    let target = 0;
    if (targetSellerId) {
      const sellerTarget = await prisma.sellerTarget.findUnique({
        where: {
          sellerId_month_year: {
            sellerId: targetSellerId,
            month: monthInt,
            year: yearInt
          }
        }
      });
      if (sellerTarget) {
        target = sellerTarget.target;
      }
    }

    // Target calculations
    const achieved = totalRevenue;
    const achievementPercentage = target > 0 ? Math.min((achieved / target) * 100, 100) : 0;
    const remaining = Math.max(target - achieved, 0);

    // Days remaining logic
    const today = new Date();
    const isCurrentMonth = today.getMonth() + 1 === monthInt && today.getFullYear() === yearInt;
    
    let daysRemaining = 0;
    if (isCurrentMonth) {
      const endOfMonth = new Date(yearInt, monthInt, 0);
      daysRemaining = endOfMonth.getDate() - today.getDate();
    } else if (today < new Date(yearInt, monthInt - 1, 1)) {
      // Future month
      daysRemaining = new Date(yearInt, monthInt, 0).getDate();
    } // Else past month (daysRemaining = 0)

    let requiredDaily = 0;
    if (daysRemaining > 0 && remaining > 0) {
      requiredDaily = remaining / daysRemaining;
    } else if (daysRemaining === 0 && remaining > 0) {
      requiredDaily = remaining; // Requires all remaining today!
    }

    let status = "NO_TARGET";
    if (target > 0) {
      if (achieved >= target) {
        status = "ACHIEVED";
      } else {
        const daysInMonth = new Date(yearInt, monthInt, 0).getDate();
        const monthProgress = isCurrentMonth ? (today.getDate() / daysInMonth) * 100 : (daysRemaining === 0 ? 100 : 0);
        const expectedAchievement = target * (monthProgress / 100);
        
        if (achieved >= expectedAchievement * 0.9) { // 10% tolerance
          status = "ON_TRACK";
        } else {
          status = "BEHIND";
        }
      }
    }

    return NextResponse.json({
        target,
        achievementPercentage,
        remaining,
        daysRemaining,
        requiredDaily,
        status, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // YYYY-MM
    const assignerId = searchParams.get("assignerId");

    if (!month) {
      return NextResponse.json(
        { error: "Month query param required (YYYY-MM)" },
        { status: 400 }
      );
    }

    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const metadataRole = (clerkUser.publicMetadata as any)?.role || (clerkUser.privateMetadata as any)?.role;
    const normalizedRole = String(metadataRole || dbUser?.role || "user").toLowerCase();

    
    let userIds = [userId];
    // Master can filter by assignerId
    if (normalizedRole === "master" && assignerId) {
      userIds = [assignerId];
    }
    // TL should only see their own sales in "My Growth" as per request

    // Fetch tasks created by this seller (or team) for the month
    const tasks = await prisma.task.findMany({
      where: {
        createdByClerkId: { in: userIds },
        isHidden: false,
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        amount: true,
        received: true,
        createdAt: true,
        customFields: true,
      },
    });

    // Fetch emails to get Employee Expenses
    const targetUsers = await prisma.user.findMany({
      where: { clerkId: { in: userIds } },
      select: { email: true }
    });
    const emails = targetUsers.map(u => u.email).filter(Boolean);

    const expenses = await prisma.employeeExpense.findMany({
      where: {
        date: { gte: startDate, lt: endDate },
        assignerEmail: { in: emails as string[] }
      }
    });

    if (!tasks.length) {
      console.warn(`⚠️ No tasks found for sellerId=${userId}, month=${month}`);
    } else {
      console.log(`📦 Found ${tasks.length} tasks for seller ${userId} in ${month}`);
    }

    // Revenue calculations
    let totalTaskDirectExpense = 0;
    const totalRevenue = tasks.reduce((sum, t) => {
      const customFields = (t.customFields as any) || {};
      const delivery = safeFloat(customFields.deliveryCharge);
      const costPrice = safeFloat(customFields.costPrice);
      totalTaskDirectExpense += (delivery + costPrice);
      
      return sum + (t.amount ?? 0);
    }, 0);
    const totalReceived = tasks.reduce((sum, t) => sum + (t.received ?? 0), 0);
    const pendingRevenue = totalRevenue - totalReceived;
    const totalSales = tasks.filter((t) => (t.amount ?? 0) > 0).length;

    const employeeManualExpenses = expenses.reduce((sum, e) => sum + safeFloat(e.amount), 0);
    const totalExpense = totalTaskDirectExpense + employeeManualExpenses;

    return NextResponse.json(
      {
        sellerId: userId,
        month,
        totalRevenue,
        totalReceived,
        pendingRevenue,
        totalSales,
        totalExpense,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("🔥 Error in /api/seller/stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
