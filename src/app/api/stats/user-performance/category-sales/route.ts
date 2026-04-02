// // FILE: src/app/api/stats/user-performance/category-sales/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// // Known categories mapping
// const categoryLabels: Record<string, string> = {
//   zomato: "🍽️ Zomato Onboarding",
//   swiggy: "🍔 Swiggy Onboarding",
//   combo: "🍽️🍔 Zomato + Swiggy Combo",
//   license: "🧾 Food License",
//   photo: "📸 Photo Upload",
//   account: "📂 Account Handling",
//   other: "🛠️ Other",
// };

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     let monthParam = searchParams.get("month");

//     // If no month given, use current month
//     if (!monthParam) {
//       const now = new Date();
//       const year = now.getFullYear();
//       const month = String(now.getMonth() + 1).padStart(2, "0");
//       monthParam = `${year}-${month}`; // YYYY-MM
//     }

//     const startDate = new Date(`${monthParam}-01T00:00:00Z`);
//     const endDate = new Date(startDate);
//     endDate.setMonth(startDate.getMonth() + 1);

//     const tasks = await prisma.task.findMany({
//       where: {
//         createdAt: {
//           gte: startDate,
//           lt: endDate,
//         },
//       },
//       select: {
//         title: true, // We'll match category from title
//         amount: true,
//         received: true,
//       },
//     });

//     // Initialize all categories to 0 so they always appear
//     const categoryMap: Record<
//       string,
//       { totalSales: number; totalRevenue: number; amountReceived: number }
//     > = {};
//     Object.keys(categoryLabels).forEach((cat) => {
//       categoryMap[cat] = { totalSales: 0, totalRevenue: 0, amountReceived: 0 };
//     });

//     for (const t of tasks) {
//       const titleLower = (t.title || "").toLowerCase();

//       // Try to detect category from title
//       let matchedCat: string | null = null;
//       for (const key of Object.keys(categoryLabels)) {
//         if (titleLower.includes(key)) {
//           matchedCat = key;
//           break;
//         }
//       }

//       if (!matchedCat) matchedCat = "other";

//       categoryMap[matchedCat].totalSales += 1;
//       categoryMap[matchedCat].totalRevenue += t.amount || 0;
//       categoryMap[matchedCat].amountReceived += t.received || 0;
//     }

//     // Prepare output
//     const result = Object.entries(categoryMap).map(([category, stats]) => ({
//       category,
//       label: categoryLabels[category] || category,
//       ...stats,
//     }));

//     return NextResponse.json({ data: result, month: monthParam });
//   } catch (error) {
//     console.error("Error in category-sales API:", error);
//     return NextResponse.json(
//       { error: "Failed to get category sales" },
//       { status: 500 }
//     );
//   }
// }






















// FILE: src/app/api/stats/user-performance/category-sales/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Known categories mapping
const categoryLabels: Record<string, string> = {
  zomato: "🍽️ Zomato Onboarding",
  swiggy: "🍔 Swiggy Onboarding",
  combo: "🍽️🍔 Zomato + Swiggy Combo",
  license: "🧾 Food License",
  photo: "📸 Photo Upload",
  account: "📂 Account Handling",
  other: "🛠️ Other",
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let monthParam = searchParams.get("month");

    // If no month given, use current month
    if (!monthParam) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      monthParam = `${year}-${month}`; // YYYY-MM
    }

    const startDate = new Date(`${monthParam}-01T00:00:00Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 1);

    const tasks = await prisma.task.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        title: true, // We'll match category from title
        amount: true,
        received: true,
      },
    });

    // Initialize all categories to 0 so they always appear
    const categoryMap: Record<
      string,
      { totalSales: number; totalRevenue: number; amountReceived: number }
    > = {};
    Object.keys(categoryLabels).forEach((cat) => {
      categoryMap[cat] = { totalSales: 0, totalRevenue: 0, amountReceived: 0 };
    });

    for (const t of tasks) {
      const titleLower = (t.title || "").toLowerCase();

      // Try to detect category from title
      let matchedCat: string | null = null;
      for (const key of Object.keys(categoryLabels)) {
        if (titleLower.includes(key)) {
          matchedCat = key;
          break;
        }
      }

      if (!matchedCat) matchedCat = "other";

      categoryMap[matchedCat].totalSales += 1;
      categoryMap[matchedCat].totalRevenue += t.amount || 0;
      categoryMap[matchedCat].amountReceived += t.received || 0;
    }

    // Prepare output and calculate derived fields (Pending Amount and Percentage)
    const result = Object.entries(categoryMap).map(([category, stats]) => {
      const pendingAmount = stats.totalRevenue - stats.amountReceived;
      const pendingPercentage = stats.totalRevenue > 0 
        ? (pendingAmount / stats.totalRevenue) * 100 
        : 0;

      return {
        category,
        label: categoryLabels[category] || category,
        ...stats,
        // ADDED: Calculated fields for immediate use on the frontend
        pendingAmount,
        pendingPercentage,
      };
    });

    return NextResponse.json({ data: result, month: monthParam });
  } catch (error) {
    console.error("Error in category-sales API:", error);
    return NextResponse.json(
      { error: "Failed to get category sales" },
      { status: 500 }
    );
  }
}