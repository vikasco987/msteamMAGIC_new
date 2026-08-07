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
    if (role !== "master" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const adminName = user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Admin";
    const adminEmail = user.emailAddresses[0]?.emailAddress || "admin@magicscale.com";

    const body = await req.json();
    const { 
      employeeEmail, 
      employeeName,
      month, // "YYYY-MM"
      amount, 
      paymentMode, 
      referenceNo, 
      remarks 
    } = body;

    if (!employeeEmail || !month || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Validation
    const employee = await prisma.employeeProfile.findUnique({
      where: { email: employeeEmail }
    });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    
    // Validate Bank Details
    if (!employee.bankAccount && paymentMode !== "Cash") {
      return NextResponse.json({ error: "Bank Account details missing for this employee." }, { status: 400 });
    }

    // Check if payroll expense already exists for this month
    const existingExpense = await prisma.employeeExpense.findFirst({
      where: {
        assignerEmail: employeeEmail,
        category: "Salary",
        date: {
          gte: new Date(`${month}-01T00:00:00.000Z`),
          lte: new Date(`${month}-31T23:59:59.999Z`)
        }
      }
    });

    if (existingExpense && existingExpense.status === "Paid") {
      return NextResponse.json({ error: "Salary for this month is already paid and locked." }, { status: 400 });
    }

    // Generate unique Voucher No
    const voucherNo = `PAY-${new Date().getTime().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const transactionDate = new Date();

    // 2. Transaction Flow
    const result = await prisma.$transaction(async (tx) => {
      let expenseRecord;
      
      // A. Create or Update EmployeeExpense
      if (existingExpense) {
        expenseRecord = await tx.employeeExpense.update({
          where: { id: existingExpense.id },
          data: {
            amount: Number(amount),
            status: "Paid",
            paymentMode,
            referenceNo,
            remarks,
            metadata: { 
              ...(existingExpense.metadata as object || {}), 
              isLocked: true, 
              processedBy: adminName 
            }
          }
        });
      } else {
        expenseRecord = await tx.employeeExpense.create({
          data: {
            assignerEmail: employeeEmail,
            assignerName: employeeName || employee.name,
            title: `Salary for ${month}`,
            category: "Salary",
            amount: Number(amount),
            date: new Date(`${month}-01T12:00:00.000Z`),
            status: "Paid",
            paymentMode,
            referenceNo,
            remarks,
            metadata: { 
              month, 
              isLocked: true, 
              processedBy: adminName 
            }
          }
        });
      }

      // B. Create Cashbook Entry (Debit / OUT)
      await tx.cashbookEntry.create({
        data: {
          voucherNo,
          transactionDate,
          description: `Salary Payment for ${employeeName || employee.name} (${month})`,
          type: "OUT",
          category: "Payroll",
          amount: Number(amount),
          status: "Paid",
          paymentMode,
          referenceNo,
          notes: remarks,
          createdBy: adminEmail
        }
      });

      // C. Create Employee Ledger Entries
      // C1. Credit for Salary Earned
      await tx.employeeLedger.create({
        data: {
          employeeEmail,
          date: transactionDate,
          type: "Salary Credit",
          description: `Salary Earned for ${month}`,
          credit: Number(amount),
          debit: 0,
          referenceId: expenseRecord.id,
          createdBy: adminEmail
        }
      });

      // C2. Debit for Salary Paid
      await tx.employeeLedger.create({
        data: {
          employeeEmail,
          date: transactionDate,
          type: "Salary Payment",
          description: `Salary Paid via ${paymentMode || "Bank"}`,
          credit: 0,
          debit: Number(amount),
          referenceId: expenseRecord.id,
          createdBy: adminEmail
        }
      });

      return expenseRecord;
    });

    return NextResponse.json({ success: true, record: result });
  } catch (error) {
    console.error("POST /api/admin/payroll/process error:", error);
    return NextResponse.json({ error: "Failed to process payroll transaction" }, { status: 500 });
  }
}
