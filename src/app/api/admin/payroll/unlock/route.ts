import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata?.role as string)?.toLowerCase() || "user";

    // ONLY MASTER CAN UNLOCK
    if (role !== "master") {
      return NextResponse.json({ error: "Forbidden: Only Master can unlock salaries" }, { status: 403 });
    }

    const body = await req.json();
    const { expenseId, reason } = body;

    if (!expenseId || !reason || reason.trim().length < 10) {
      return NextResponse.json({ error: "A valid reason (min 10 characters) is required" }, { status: 400 });
    }

    const expense = await prisma.employeeExpense.findUnique({
      where: { id: expenseId }
    });

    if (!expense) {
      return NextResponse.json({ error: "Salary record not found" }, { status: 404 });
    }

    const metadata = (expense.metadata as any) || {};
    const auditLog = metadata.auditLog || [];

    auditLog.push({
      action: "Unlocked",
      reason: reason.trim(),
      by: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || expense.assignerEmail.split('@')[0],
      date: new Date().toISOString()
    });

    metadata.isLocked = false;
    metadata.auditLog = auditLog;

    const updated = await prisma.employeeExpense.update({
      where: { id: expenseId },
      data: {
        status: "Processing", // Reset status to Processing when unlocked
        metadata
      }
    });

    return NextResponse.json({ success: true, message: "Salary unlocked successfully", record: updated });
  } catch (error) {
    console.error("POST Payroll Unlock Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
