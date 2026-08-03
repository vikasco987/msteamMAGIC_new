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
    const { assignerEmail, assignerName, employees, splitEqually, title, category, amount, date, remarks } = body;

    if (splitEqually && Array.isArray(employees) && employees.length > 0) {
      if (!title || amount == null || isNaN(Number(amount))) {
        return NextResponse.json({ error: "Missing required fields: title, amount" }, { status: 400 });
      }

      const totalAmount = parseFloat(String(amount));
      const perPersonAmount = parseFloat((totalAmount / employees.length).toFixed(2));
      const expDate = date ? new Date(date) : new Date();
      const splitRemarks = remarks ? `${remarks.trim()} (Equal Split among ${employees.length} employees)` : `Equal Split among ${employees.length} employees (Total ₹${totalAmount})`;

      const createdExpenses = await prisma.$transaction(
        employees.map((emp: { email: string; name?: string }) =>
          prisma.employeeExpense.create({
            data: {
              assignerEmail: String(emp.email).trim(),
              assignerName: emp.name ? String(emp.name).trim() : null,
              title: String(title).trim(),
              category: category ? String(category).trim() : "Other",
              amount: perPersonAmount,
              date: expDate,
              status: body.status ? String(body.status) : "Paid",
              paymentMode: body.paymentMode ? String(body.paymentMode) : null,
              referenceNo: body.referenceNo ? String(body.referenceNo) : null,
              remarks: splitRemarks,
            },
          })
        )
      );

      return NextResponse.json({ message: "Split expenses created successfully", count: createdExpenses.length, expenses: createdExpenses }, { status: 201 });
    }

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
        status: body.status ? String(body.status) : "Paid",
        paymentMode: body.paymentMode ? String(body.paymentMode) : null,
        referenceNo: body.referenceNo ? String(body.referenceNo) : null,
        remarks: remarks ? String(remarks).trim() : null,
      },
    });

    return NextResponse.json({ expense: newExpense }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error creating employee expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}

// PUT /api/employee-expenses (Edit existing expense)
export async function PUT(req: NextRequest) {
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
    const { id, assignerEmail, assignerName, title, category, amount, date, status, paymentMode, referenceNo, remarks } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing expense ID" }, { status: 400 });
    }

    const updateData: any = {};
    if (assignerEmail) updateData.assignerEmail = String(assignerEmail).trim();
    if (assignerName !== undefined) updateData.assignerName = assignerName ? String(assignerName).trim() : null;
    if (title) updateData.title = String(title).trim();
    if (category) updateData.category = String(category).trim();
    if (amount !== undefined && !isNaN(Number(amount))) updateData.amount = parseFloat(String(amount));
    if (date) updateData.date = new Date(date);
    if (status) updateData.status = String(status);
    if (paymentMode !== undefined) updateData.paymentMode = paymentMode ? String(paymentMode).trim() : null;
    if (referenceNo !== undefined) updateData.referenceNo = referenceNo ? String(referenceNo).trim() : null;
    if (remarks !== undefined) updateData.remarks = remarks ? String(remarks).trim() : null;

    const updatedExpense = await prisma.employeeExpense.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ expense: updatedExpense });
  } catch (error: any) {
    console.error("❌ Error updating employee expense:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
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
