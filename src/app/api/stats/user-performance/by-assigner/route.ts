// FILE: src/app/api/stats/user-performance/by-assigner/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

const safeFloat = (v: any): number => {
  if (v == null || v === "") return 0;
  const n = parseFloat(String(v));
  return isNaN(n) || !isFinite(n) ? 0 : n;
};

export async function GET(req: Request) {
  try {
    const t_start = performance.now();
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month"); // format: YYYY-MM

    let startDate: Date;
    let endDate: Date;

    if (monthParam) {
      // Parse YYYY-MM into start & end of month
      const [year, month] = monthParam.split("-").map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 1);
    } else {
      // Default: current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    // Role and Team check
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    
    const role = String(clerkUser.publicMetadata?.role || dbUser?.role || "user").toLowerCase();
    const isTL = dbUser?.isTeamLeader || role === 'tl';
    const isPrivileged = ['admin', 'master'].includes(role);
    const t_auth_end = performance.now();
    console.log(`[SALES_DASH_PERF] by-assigner | Auth: ${(t_auth_end - t_start).toFixed(2)}ms`);

    let filter: any = {
      createdAt: {
        gte: startDate,
        lt: endDate,
      },
    };

    // ---- User IDs calculation ----
    const t_userids_start = performance.now();
    let userIds: string[] = [userId];
    if (!isPrivileged) {
      if (isTL) {
        const members = await prisma.user.findMany({
          where: { leaderIds: { has: userId } },
          select: { clerkId: true }
        });

        userIds = [userId, ...members.map(m => m.clerkId)];
      }
      filter = {
        ...filter,
        OR: [
          { createdByClerkId: { in: userIds } },
          { assigneeId: { in: userIds } },
          { assigneeIds: { hasSome: userIds } }
        ]
      };
    }
    const t_userids_end = performance.now();
    console.log(`[SALES_DASH_PERF] by-assigner | userIds calc: ${(t_userids_end - t_userids_start).toFixed(2)}ms`);

        const matchConditions: any = {
      createdAt: {
        $gte: { $date: startDate.toISOString() },
        $lt: { $date: endDate.toISOString() }
      }
    };
    if (!isPrivileged) {
      matchConditions.$or = [
        { createdByClerkId: { $in: userIds } },
        { assigneeId: { $in: userIds } },
        { assigneeIds: { $in: userIds } }
      ];
    }

    const aggPipeline = [
      { $match: matchConditions },
      {
        $project: {
          aName: { $ifNull: ["$assignerName", ""] },
          cName: { $ifNull: ["$createdByName", ""] },
          aEmail: { $ifNull: ["$assignerEmail", ""] },
          cEmail: { $ifNull: ["$createdByEmail", ""] },
          amount: { $ifNull: ["$amount", 0] },
          received: { $ifNull: ["$received", 0] },
          deliveryCharge: { $convert: { input: "$customFields.deliveryCharge", to: "double", onError: 0, onNull: 0 } },
          costPrice: { $convert: { input: "$customFields.costPrice", to: "double", onError: 0, onNull: 0 } }
        }
      },
      {
        $project: {
          amount: 1, received: 1, deliveryCharge: 1, costPrice: 1,
          name: {
            $cond: {
              if: { $ne: ["$aName", ""] }, then: "$aName",
              else: {
                $cond: { if: { $ne: ["$cName", ""] }, then: "$cName", else: "Unknown" }
              }
            }
          },
          email: {
            $cond: {
              if: { $ne: ["$aEmail", ""] }, then: "$aEmail",
              else: {
                $cond: { if: { $ne: ["$cEmail", ""] }, then: "$cEmail", else: "" }
              }
            }
          }
        }
      },
      {
        $project: {
          amount: 1, received: 1, deliveryCharge: 1, costPrice: 1, name: 1, email: 1,
          key: {
            $cond: { if: { $ne: ["$email", ""] }, then: "$email", else: "$name" }
          }
        }
      },
      {
        $group: {
          _id: "$key",
          name: { $first: "$name" },
          email: { $first: "$email" },
          totalRevenue: { $sum: "$amount" },
          amountReceived: { $sum: "$received" },
          taskDirectExpense: { $sum: { $add: ["$deliveryCharge", "$costPrice"] } },
          totalSales: {
            $sum: { $cond: { if: { $gt: ["$amount", 0] }, then: 1, else: 0 } }
          }
        }
      }
    ];

    // ---- Parallel DB fetch ----
    const t_parallel_start = performance.now();
    const [aggTasks, employeeExpenses] = await Promise.all([
      prisma.task.aggregateRaw({ pipeline: aggPipeline }) as unknown as any[],
      prisma.employeeExpense.findMany({
        where: {
          date: { gte: startDate, lt: endDate },
        },
      }),
    ]);
    const t_parallel_end = performance.now();
    console.log(`[SALES_DASH_PERF] by-assigner | Parallel DB: ${(t_parallel_end - t_parallel_start).toFixed(2)}ms`);

    // ---- JS grouping/calculation ----
    const t_js_start = performance.now();
    // ✅ Group by assigner
    const assignerMap: Record<
      string,
      {
        name: string;
        email: string;
        totalRevenue: number;
        amountReceived: number;
        totalSales: number;
        taskDirectExpense: number;
        employeeManualExpense: number;
        totalExpense: number;
      }
    > = {};

    for (const task of aggTasks) {
      const name = task.name || "Unknown";
      const email = task.email || "";
      const key = task._id || email || name;

      assignerMap[key] = {
        name,
        email,
        totalRevenue: task.totalRevenue || 0,
        amountReceived: task.amountReceived || 0,
        totalSales: task.totalSales || 0,
        taskDirectExpense: task.taskDirectExpense || 0,
        employeeManualExpense: 0,
        totalExpense: 0,
      };
    }

    // Process employee expenses
    for (const exp of employeeExpenses) {
      const email = exp.assignerEmail?.trim().toLowerCase() || "";
      const name = exp.assignerName?.trim() || "Unknown";
      const key = email || name;

      if (!assignerMap[key]) {
        // If assigner has expenses but no tasks
        assignerMap[key] = {
          name,
          email,
          totalRevenue: 0,
          amountReceived: 0,
          totalSales: 0,
          taskDirectExpense: 0,
          employeeManualExpense: 0,
          totalExpense: 0,
        };
      }
      assignerMap[key].employeeManualExpense += safeFloat(exp.amount);
    }

    // ✅ Convert to array & add pending/totalExpense
    const data = Object.values(assignerMap).map((a) => {
      a.totalExpense = a.taskDirectExpense + a.employeeManualExpense;
      return {
        ...a,
        pendingAmount: a.totalRevenue - a.amountReceived,
      };
    });

    const t_js_end = performance.now();
    console.log(`[SALES_DASH_PERF] by-assigner | JS calculation: ${(t_js_end - t_js_start).toFixed(2)}ms`);
    const t_total = performance.now();
    console.log(`[SALES_DASH_PERF] by-assigner | Total API: ${(t_total - t_start).toFixed(2)}ms`);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in /by-assigner:", error);
    return NextResponse.json(
      { error: "Failed to fetch assigner stats" },
      { status: 500 }
    );
  }
}
