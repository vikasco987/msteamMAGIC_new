import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { users } from "@clerk/clerk-sdk-node";

export const dynamic = "force-dynamic";

interface UserPublicMetadata {
  role?: string;
}

interface UserPrivateMetadata {
  role?: string;
}

async function getUserRole(userId: string): Promise<string | null> {
  try {
    const user = await users.getUser(userId);
    return (
      (user.publicMetadata as UserPublicMetadata)?.role ||
      (user.privateMetadata as UserPrivateMetadata)?.role ||
      null
    );
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getUserRole(userId);
    
    // Allow access for specific roles, or keep it open if desired
    // User requested specifically for master role only
    if (role !== "master") {
      return NextResponse.json({ error: "Forbidden: Master access required" }, { status: 403 });
    }

    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: "Printer Setup", mode: "insensitive" } },
          { title: { contains: "Printer + Software", mode: "insensitive" } },
        ]
      },
      orderBy: { createdAt: "desc" },
    });

    let totalRevenue = 0;
    let totalExpense = 0;

    const formattedTasks = tasks.map((task) => {
      const customFields = task.customFields as any || {};
      
      const rev = parseFloat(customFields.packageAmount || customFields.amount || task.amount?.toString() || "0");
      const received = parseFloat(customFields.amountReceived || task.received?.toString() || "0");
      
      const delivery = parseFloat(customFields.deliveryCharge || "0");
      const costPrice = parseFloat(customFields.costPrice || "0");
      const exp = delivery + costPrice;

      const profit = rev - exp;
      const cashProfit = received - exp;

      totalRevenue += rev;
      totalExpense += exp;

      return {
        id: task.id,
        title: task.title,
        status: task.status,
        createdAt: task.createdAt,
        revenue: rev,
        received: received,
        expense: exp,
        profit: profit,
        cashProfit: cashProfit,
        deliveryCharge: delivery,
        costPrice: costPrice,
        customerName: customFields.customerName || task.assigneeName || "Unknown",
        awbNumber: customFields.awbNumber || "",
        softwareDuration: customFields.softwareDuration || "",
      };
    });

    const totalReceived = formattedTasks.reduce((acc, t) => acc + t.received, 0);

    // Grouping for Reports
    const dayReportMap: Record<string, any> = {};
    const weekReportMap: Record<string, any> = {};
    const monthReportMap: Record<string, any> = {};

    formattedTasks.forEach(task => {
      const date = new Date(task.createdAt);
      // Format manual since date-fns might have different locale/version quirks
      const d = date.getDate().toString().padStart(2, '0');
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const y = date.getFullYear();
      
      const dayKey = `${y}-${m}-${d}`;
      const monthKey = `${y}-${m}`;
      
      // Simple ISO week logic
      const dCopy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = dCopy.getUTCDay() || 7;
      dCopy.setUTCDate(dCopy.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(dCopy.getUTCFullYear(),0,1));
      const weekNo = Math.ceil((((dCopy.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
      const weekKey = `${dCopy.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;

      const updateMap = (map: Record<string, any>, key: string) => {
        if (!map[key]) {
          map[key] = { dateKey: key, totalRevenue: 0, totalReceived: 0, totalExpense: 0, netProfit: 0, cashProfit: 0, tasksCount: 0 };
        }
        map[key].totalRevenue += task.revenue;
        map[key].totalReceived += task.received;
        map[key].totalExpense += task.expense;
        map[key].netProfit += task.profit;
        map[key].cashProfit += task.cashProfit;
        map[key].tasksCount += 1;
      };

      updateMap(dayReportMap, dayKey);
      updateMap(weekReportMap, weekKey);
      updateMap(monthReportMap, monthKey);
    });

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalReceived,
        totalExpense,
        netProfit: totalRevenue - totalExpense,
        cashProfit: totalReceived - totalExpense,
      },
      tasks: formattedTasks,
      dayReport: Object.values(dayReportMap).sort((a, b) => b.dateKey.localeCompare(a.dateKey)),
      weekReport: Object.values(weekReportMap).sort((a, b) => b.dateKey.localeCompare(a.dateKey)),
      monthReport: Object.values(monthReportMap).sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Profit & Loss Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getUserRole(userId);
    if (role !== "master") {
      return NextResponse.json({ error: "Forbidden: Master access required" }, { status: 403 });
    }

    const body = await req.json();
    const { taskId, costPrice, deliveryCharge, revenue, received } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    // Fetch the task first to retain other customFields
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { customFields: true, amount: true, received: true }
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const currentFields = existingTask.customFields as Record<string, any> || {};

    const updatedFields = {
      ...currentFields,
      costPrice: costPrice !== undefined ? costPrice.toString() : currentFields.costPrice,
      deliveryCharge: deliveryCharge !== undefined ? deliveryCharge.toString() : currentFields.deliveryCharge,
      packageAmount: revenue !== undefined ? revenue.toString() : currentFields.packageAmount,
      amount: revenue !== undefined ? revenue.toString() : currentFields.amount,
      amountReceived: received !== undefined ? received.toString() : currentFields.amountReceived,
    };

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        customFields: updatedFields,
        // Sync top-level fields too
        amount: revenue !== undefined ? parseFloat(revenue) : existingTask.amount,
        received: received !== undefined ? parseFloat(received) : existingTask.received,
      }
    });

    return NextResponse.json({ success: true, task: updatedTask }, { status: 200 });

  } catch (error) {
    console.error("❌ Profit & Loss Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
