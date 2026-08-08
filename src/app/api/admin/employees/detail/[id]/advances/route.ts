import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    // Fetch the employee first
    const employee = await prisma.employeeProfile.findUnique({
      where: { id }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const advances = await prisma.employeeAdvance.findMany({
      where: { 
        employeeEmail: employee.email,
      },
      orderBy: { requestedDate: 'desc' },
    });

    return NextResponse.json({ advances });

  } catch (error) {
    console.error("GET Advances Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userRole = (user.publicMetadata?.role as string)?.toLowerCase() || "user";
    
    // Check master/admin role or from db
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    const isMaster = userRole === "master" || dbUser?.role === "master";

    if (!isMaster) {
       return NextResponse.json({ error: "Forbidden: Only Master can grant advances" }, { status: 403 });
    }

    const { id } = await params;
    
    const employee = await prisma.employeeProfile.findUnique({
      where: { id }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const body = await req.json();
    const { amount, monthlyDeduction, purpose, paymentMode, referenceNo, remarks, action } = body;
    
    // Validation
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }
    
    if (!monthlyDeduction || isNaN(Number(monthlyDeduction)) || Number(monthlyDeduction) <= 0) {
      return NextResponse.json({ error: "Valid monthly deduction is required" }, { status: 400 });
    }
    
    if (!purpose) {
      return NextResponse.json({ error: "Purpose is required" }, { status: 400 });
    }
    
    const parsedAmount = parseFloat(String(amount));
    const parsedMonthlyDeduction = parseFloat(String(monthlyDeduction));

    // Generate Advance No
    const advanceCount = await prisma.employeeAdvance.count();
    const advanceNo = `ADV-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${(advanceCount + 1).toString().padStart(4, '0')}`;

    // If action is grant directly, we can Disburse it immediately and create Cashbook/Ledger entries.
    // If it's just request, we don't hit cashbook yet. Let's assume we are directly Disbursing it as Admin.
    
    const newAdvance = await prisma.$transaction(async (tx) => {
      // 1. Create Advance
      const advance = await tx.employeeAdvance.create({
        data: {
          employeeEmail: employee.email,
          advanceNo,
          amount: parsedAmount,
          approvedAmount: parsedAmount,
          remainingAmount: parsedAmount,
          monthlyDeduction: parsedMonthlyDeduction,
          purpose: String(purpose),
          status: "Disbursed",
          approvedBy: dbUser?.name || "Master",
          approvedDate: new Date(),
          disbursedDate: new Date(),
          paymentMode: paymentMode ? String(paymentMode) : null,
          referenceNo: referenceNo ? String(referenceNo) : null,
          remarks: remarks ? String(remarks) : null,
        }
      });
      
      // 2. Create Cashbook Entry (Money leaving the business)
      await tx.cashbookEntry.create({
        data: {
          date: new Date(),
          type: "OUT",
          amount: parsedAmount,
          category: "Employee Advance",
          partyName: employee.name || employee.email,
          description: `Advance Disbursed: ${purpose}`,
          paymentMode: paymentMode ? String(paymentMode) : "Bank Transfer",
          referenceNo: referenceNo ? String(referenceNo) : null,
          voucherNo: advanceNo,
          status: "Cleared",
        }
      });
      
      // 3. Employee Ledger Entry (Credit to employee as advance balance, wait - if it's an advance given, 
      // the ledger should show they OWE the company. If ledger balance means "Company owes employee", then Advance is a Debit (payment). 
      // Or we can record type = "Advance" with debit = amount. 
      // User said: "Grant Advance -> Ledger: Credit ₹20,000, Cashbook: Debit ₹20,000" Wait.
      // If Cashbook Debits ₹20,000 (Money out? Actually debit in cashbook is money out in traditional accounting, wait. In my earlier code, OUT is OUT.)
      // User says: "Employee Ledger Credit ₹20,000, Cashbook Debit ₹20,000"
      // Let's stick to the EmployeeLedger schema we have. Credit in our EmployeeLedger means the employee received/earned it? Wait.
      // If EmployeeLedger Credit = Company owes Employee. Then Advance given means Company paid Employee, so it should be Debit.
      // Let's just record it exactly how the user asked: "Employee Ledger Credit 20k". 
      // Let's check `EmployeeLedger` structure: `credit`, `debit`.
      
      await tx.employeeLedger.create({
        data: {
          employeeEmail: employee.email,
          date: new Date(),
          type: "Advance",
          description: `Advance Disbursed: ${purpose} (${advanceNo})`,
          credit: parsedAmount,
          debit: 0,
          referenceNo: referenceNo ? String(referenceNo) : null,
        }
      });

      return advance;
    });

    return NextResponse.json({ success: true, advance: newAdvance }, { status: 201 });
  } catch (error: any) {
    console.error("POST Advance Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
