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

// GET /api/payroll?month=YYYY-MM
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month") || new Date().toISOString().slice(0, 7); // YYYY-MM

    const [year, month] = monthParam.split("-").map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    // 1. Fetch Users & Profiles
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" }
    });

    const profiles = await prisma.employeeProfile.findMany();
    const profileMap = new Map(profiles.map(p => [p.email.toLowerCase(), p]));

    // 2. Fetch Employee Expenses for this month
    const monthlyExpenses = await prisma.employeeExpense.findMany({
      where: {
        date: { gte: startDate, lt: endDate }
      }
    });

    // 3. Combine Data into Payroll Records
    const payrollData = users.map(u => {
      const email = u.email.toLowerCase();
      const profile = profileMap.get(email);
      const userExpenses = monthlyExpenses.filter(e => e.assignerEmail.toLowerCase() === email);

      const baseSalary = profile?.baseSalary || 0;
      const salaryExp = userExpenses.find(e => e.category === "Salary");

      const incentives = userExpenses
        .filter(e => e.category === "Incentive" || e.category === "Bonus")
        .reduce((sum, e) => sum + e.amount, 0);

      const allowances = userExpenses
        .filter(e => e.category === "Travel" || e.category === "Phone")
        .reduce((sum, e) => sum + e.amount, 0);

      const otherExpenses = userExpenses
        .filter(e => !["Salary", "Incentive", "Bonus", "Travel", "Phone"].includes(e.category))
        .reduce((sum, e) => sum + e.amount, 0);

      const totalPaidAmount = userExpenses.reduce((sum, e) => sum + e.amount, 0);
      const isSalaryPaid = Boolean(salaryExp);

      return {
        userId: u.id,
        clerkId: u.clerkId,
        name: u.name || profile?.name || u.email.split("@")[0],
        email: u.email,
        role: u.role,
        department: profile?.department || "Sales",
        phone: profile?.phone || "",
        joiningDate: profile?.joiningDate || u.createdAt,
        baseSalary,
        bankAccount: profile?.bankAccount || "",
        ifscCode: profile?.ifscCode || "",
        bankName: profile?.bankName || "",
        panNumber: profile?.panNumber || "",
        
        // Month Financial Breakdown
        incentives,
        allowances,
        otherExpenses,
        totalPaidAmount,
        salaryStatus: isSalaryPaid ? "PAID" : "UNPAID",
        salaryExpenseId: salaryExp?.id || null,
        paidDate: salaryExp?.date || null,
        paymentMode: salaryExp?.paymentMode || null,
        referenceNo: salaryExp?.referenceNo || null,
        expensesList: userExpenses
      };
    });

    // Summary Totals
    const summary = {
      totalEmployees: payrollData.length,
      totalBaseSalaryPool: payrollData.reduce((sum, p) => sum + p.baseSalary, 0),
      totalPaidSalaryPool: payrollData.reduce((sum, p) => sum + p.totalPaidAmount, 0),
      paidCount: payrollData.filter(p => p.salaryStatus === "PAID").length,
      unpaidCount: payrollData.filter(p => p.salaryStatus === "UNPAID").length,
    };

    return NextResponse.json({ summary, payroll: payrollData });
  } catch (error: any) {
    console.error("❌ Error fetching payroll data:", error);
    return NextResponse.json({ error: "Failed to fetch payroll data" }, { status: 500 });
  }
}

// POST /api/payroll (Create or update Employee Profile & Base Salary)
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isPrivileged = await getIsPrivileged(userId);
    if (!isPrivileged) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { email, name, phone, department, baseSalary, joiningDate, bankAccount, ifscCode, bankName, panNumber } = body;

    if (!email) {
      return NextResponse.json({ error: "Missing required field: email" }, { status: 400 });
    }

    const profile = await prisma.employeeProfile.upsert({
      where: { email: String(email).toLowerCase() },
      update: {
        name: name ? String(name) : undefined,
        phone: phone ? String(phone) : undefined,
        department: department ? String(department) : undefined,
        baseSalary: baseSalary !== undefined ? parseFloat(String(baseSalary)) : undefined,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        bankAccount: bankAccount ? String(bankAccount) : undefined,
        ifscCode: ifscCode ? String(ifscCode) : undefined,
        bankName: bankName ? String(bankName) : undefined,
        panNumber: panNumber ? String(panNumber) : undefined,
      },
      create: {
        email: String(email).toLowerCase(),
        name: name ? String(name) : undefined,
        phone: phone ? String(phone) : undefined,
        department: department ? String(department) : "Sales",
        baseSalary: baseSalary ? parseFloat(String(baseSalary)) : 0,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        bankAccount: bankAccount ? String(bankAccount) : undefined,
        ifscCode: ifscCode ? String(ifscCode) : undefined,
        bankName: bankName ? String(bankName) : undefined,
        panNumber: panNumber ? String(panNumber) : undefined,
      }
    });

    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error("❌ Error updating employee profile:", error);
    return NextResponse.json({ error: "Failed to update employee profile" }, { status: 500 });
  }
}

// PUT /api/payroll (Mark Monthly Salary as Paid or Unpaid)
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isPrivileged = await getIsPrivileged(userId);
    if (!isPrivileged) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { action, email, name, month, amount, paymentMode, referenceNo, remarks } = body;

    if (!email || !month) {
      return NextResponse.json({ error: "Missing required fields: email, month" }, { status: 400 });
    }

    const [year, m] = month.split("-").map(Number);
    const salaryDate = new Date(Date.UTC(year, m - 1, 1, 12, 0, 0));

    if (action === "MARK_PAID") {
      const expenseAmount = parseFloat(String(amount || 0));

      const newExpense = await prisma.employeeExpense.create({
        data: {
          assignerEmail: String(email).toLowerCase(),
          assignerName: name || email.split("@")[0],
          title: `Monthly Salary (${month})`,
          category: "Salary",
          amount: expenseAmount,
          date: salaryDate,
          status: "Paid",
          paymentMode: paymentMode ? String(paymentMode) : "Bank Transfer",
          referenceNo: referenceNo ? String(referenceNo) : null,
          remarks: remarks ? String(remarks) : `Salary paid for ${month}`
        }
      });

      return NextResponse.json({ success: true, expense: newExpense });
    } else if (action === "MARK_UNPAID") {
      const startDate = new Date(Date.UTC(year, m - 1, 1));
      const endDate = new Date(Date.UTC(year, m, 1));

      await prisma.employeeExpense.deleteMany({
        where: {
          assignerEmail: String(email).toLowerCase(),
          category: "Salary",
          date: { gte: startDate, lt: endDate }
        }
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("❌ Error updating salary status:", error);
    return NextResponse.json({ error: "Failed to update salary status" }, { status: 500 });
  }
}
