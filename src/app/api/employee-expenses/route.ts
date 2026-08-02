import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface UserPublicMetadata {
  role?: string;
}

interface UserPrivateMetadata {
  role?: string;
}

async function getIsPrivileged(userId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (
      (user.publicMetadata as UserPublicMetadata)?.role ||
      (user.privateMetadata as UserPrivateMetadata)?.role ||
      ""
    ).toLowerCase();
    
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    const dbRole = String(dbUser?.role || "").toLowerCase();

    return ["master", "admin", "tl"].includes(role) || ["master", "admin", "tl"].includes(dbRole);
  } catch {
    return false;
  }
}

// GET /api/employee-expenses?assignerEmail=...&month=YYYY-MM
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const assignerEmail = searchParams.get("assignerEmail");
    const monthParam = searchParams.get("month");

    let whereFilter: any = {};
    if (assignerEmail) {
      whereFilter.assignerEmail = assignerEmail;
    }

    if (monthParam && monthParam !== "all") {
      const [year, month] = monthParam.split("-").map(Number);
      if (year && month) {
        const startDate = new Date(Date.UTC(year, month - 1, 1));
        const endDate = new Date(Date.UTC(year, month, 1));
        whereFilter.date = {
          gte: startDate,
          lt: endDate,
        };
      }
    }

    const expenses = await prisma.employeeExpense.findMany({
      where: whereFilter,
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ expenses });
  } catch (error: any) {
    console.error("❌ Error fetching employee expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

// POST /api/employee-expenses
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isPrivileged = await getIsPrivileged(userId);
    if (!isPrivileged) {
      return NextResponse.json({ error: "Forbidden: Admin or Master access required" }, { status: 403 });
    }

    const body = await req.json();
    const { assignerEmail, assignerName, title, category, amount, date, remarks } = body;

    if (!assignerEmail || !title || amount == null || isNaN(Number(amount))) {
      return NextResponse.json({ error: "Missing required fields: assignerEmail, title, amount" }, { status: 400 });
    }

    const newExpense = await prisma.employeeExpense.create({
      data: {
        assignerEmail: String(assignerEmail).trim(),
        assignerName: assignerName ? String(assignerName).trim() : null,
        title: String(title).trim(),
        category: category ? String(category).trim() : "Salary",
        amount: parseFloat(String(amount)),
        date: date ? new Date(date) : new Date(),
        remarks: remarks ? String(remarks).trim() : null,
      },
    });

    return NextResponse.json({ expense: newExpense }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error creating employee expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}

// DELETE /api/employee-expenses?id=...
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isPrivileged = await getIsPrivileged(userId);
    if (!isPrivileged) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing expense ID" }, { status: 400 });
    }

    await prisma.employeeExpense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Error deleting employee expense:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
