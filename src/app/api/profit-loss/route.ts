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
    // For now, let's restrict to admin/master
    if (role !== "admin" && role !== "master") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
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
      
      const rev = parseFloat(customFields.packageAmount || customFields.amount || "0");
      
      const delivery = parseFloat(customFields.deliveryCharge || "0");
      const costPrice = parseFloat(customFields.costPrice || "0");
      const exp = delivery + costPrice;

      const profit = rev - exp;

      totalRevenue += rev;
      totalExpense += exp;

      return {
        id: task.id,
        title: task.title,
        status: task.status,
        createdAt: task.createdAt,
        revenue: rev,
        expense: exp,
        profit: profit,
        deliveryCharge: delivery,
        costPrice: costPrice,
        customerName: customFields.customerName || task.assigneeName || "Unknown",
        awbNumber: customFields.awbNumber || "",
        softwareDuration: customFields.softwareDuration || "",
      };
    });

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalExpense,
        netProfit: totalRevenue - totalExpense,
      },
      tasks: formattedTasks
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
    if (role !== "admin" && role !== "master") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { taskId, costPrice, deliveryCharge, revenue } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    // Fetch the task first to retain other customFields
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { customFields: true }
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
    };

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        customFields: updatedFields
      }
    });

    return NextResponse.json({ success: true, task: updatedTask }, { status: 200 });

  } catch (error) {
    console.error("❌ Profit & Loss Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
