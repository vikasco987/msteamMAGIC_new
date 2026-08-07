import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, parseISO, getDaysInMonth, isValid } from "date-fns";

const calcWorkingHours = (checkIn: Date, checkOut: Date) => {
  let ms = checkOut.getTime() - checkIn.getTime();
  let hours = ms / (1000 * 60 * 60);

  const lunchStart = new Date(checkIn);
  lunchStart.setUTCHours(14, 0, 0, 0);
  const lunchEnd = new Date(checkIn);
  lunchEnd.setUTCHours(15, 0, 0, 0);

  if (checkIn < lunchStart && checkOut > lunchEnd) {
    hours -= 1;
  } else if (checkIn < lunchStart && checkOut > lunchStart && checkOut <= lunchEnd) {
    hours -= (checkOut.getTime() - lunchStart.getTime()) / (1000 * 60 * 60);
  } else if (checkIn >= lunchStart && checkIn < lunchEnd && checkOut > lunchEnd) {
    hours -= (lunchEnd.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
  }

  return Math.max(0, hours);
};

const calcDayType = (checkIn?: Date, checkOut?: Date, hours?: number) => {
  if (!checkIn) return "Absent";
  if (!checkOut) return "Half-Day";
  if (!hours || hours < 6) return "Half-Day";
  return "Full Day";
};

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata?.role as string)?.toLowerCase() || "user";

    // Only allow master or admin (if you choose)
    if (!["master", "admin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date"); // e.g., "2026-08-01"
    
    if (!dateParam) return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
    
    const targetDate = new Date(dateParam);
    if (!isValid(targetDate)) return NextResponse.json({ error: "Invalid date" }, { status: 400 });

    const start = startOfMonth(targetDate);
    const end = endOfMonth(targetDate);
    const totalDaysInMonth = getDaysInMonth(targetDate);
    const monthString = targetDate.toLocaleString('default', { month: 'long' });
    const yearString = targetDate.getFullYear().toString();

    // Fetch all employee profiles
    const employees = await prisma.employeeProfile.findMany({
      orderBy: { name: "asc" }
    });

    // Fetch attendance for the month
    const attendances = await prisma.attendance.findMany({
      where: {
        date: { gte: start, lte: end }
      }
    });

    // Fetch salary expenses for the month
    const expenses = await prisma.employeeExpense.findMany({
      where: {
        category: "Salary",
        date: { gte: start, lte: end }
      }
    });

    // Fetch all Users to map email to clerkId
    const users = await prisma.user.findMany({
      select: { clerkId: true, email: true, name: true }
    });

    // Process data
    let totalPayroll = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalLocked = 0;

    const payrollData = employees.map(emp => {
      // Find the corresponding User record for this EmployeeProfile
      const matchingUser = users.find(u => u.email === emp.email || u.name === emp.name);
      
      const empAttendances = attendances.filter(a => 
        a.employeeName === emp.name || 
        a.userId === emp.email || 
        (matchingUser && a.userId === matchingUser.clerkId)
      );
      let present = 0, halfDay = 0, paidLeave = 0, holiday = 0, weeklyOff = 0;
      empAttendances.forEach(a => {
        const status = (a.status || "").toLowerCase();
        
        let dayType = "Absent";
        if (a.checkIn) {
          const checkInDate = new Date(a.checkIn);
          const checkOutDate = a.checkOut ? new Date(a.checkOut) : undefined;
          const workingHrs = checkOutDate ? calcWorkingHours(checkInDate, checkOutDate) : 0;
          dayType = calcDayType(checkInDate, checkOutDate, workingHrs);
        }

        if (dayType === "Full Day") present++;
        else if (dayType === "Half-Day") halfDay++;
        else if (status.includes("paid leave")) paidLeave++;
        else if (status.includes("holiday")) holiday++;
        else if (status.includes("weekly off") || status.includes("weekend")) weeklyOff++;
      });

      const payableDays = present + (halfDay * 0.5) + paidLeave + holiday + weeklyOff;
      const absent = totalDaysInMonth - payableDays;
      const attendancePercent = totalDaysInMonth > 0 ? (payableDays / totalDaysInMonth) * 100 : 0;
      
      const baseSalary = emp.baseSalary || 0;
      const calculatedSalary = totalDaysInMonth > 0 ? (baseSalary / totalDaysInMonth) * payableDays : 0;

      // Check if salary already processed
      const existingExpense = expenses.find(e => e.assignerEmail === emp.email);
      const isLocked = existingExpense?.metadata && (existingExpense.metadata as any).isLocked === true;
      const expenseAmount = existingExpense ? existingExpense.amount : calculatedSalary;

      totalPayroll += expenseAmount;
      if (existingExpense?.status === "Paid") totalPaid += expenseAmount;
      else totalPending += expenseAmount;

      if (isLocked) totalLocked++;

      return {
        employeeId: emp.id,
        name: emp.name || "Unknown",
        email: emp.email,
        department: emp.department || "N/A",
        designation: emp.designation || "N/A",
        bank: {
          accountHolderName: emp.accountHolderName,
          bankAccount: emp.bankAccount,
          ifscCode: emp.ifscCode,
          bankName: emp.bankName,
          upiId: emp.upiId
        },
        employmentStatus: emp.employmentStatus || "Active",
        baseSalary,
        totalWorkingDays: totalDaysInMonth,
        payableDays,
        attendanceBreakdown: { present, halfDay, paidLeave, holiday, weeklyOff, absent },
        attendancePercent: attendancePercent.toFixed(1),
        calculatedSalary: calculatedSalary.toFixed(2),
        status: existingExpense ? existingExpense.status : "Pending",
        expenseRecord: existingExpense || null,
        isLocked
      };
    });

    const summary = {
      employees: employees.length,
      payroll: totalPayroll.toFixed(2),
      paid: totalPaid.toFixed(2),
      pending: totalPending.toFixed(2),
      locked: totalLocked
    };

    return NextResponse.json({ payroll: payrollData, summary });
  } catch (error) {
    console.error("GET Payroll Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata?.role as string)?.toLowerCase() || "user";

    if (!["master", "admin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { 
      email, name, monthDate, baseSalary, totalWorkingDays, payableDays, 
      calculatedAmount, adjustment, finalAmount, paymentMode, paymentDate, remarks, status
    } = body;

    if (!email || !monthDate || finalAmount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const targetDate = new Date(monthDate);
    const start = startOfMonth(targetDate);
    const end = endOfMonth(targetDate);
    const monthString = targetDate.toLocaleString('default', { month: 'long' });
    const yearString = targetDate.getFullYear().toString();

    // Check for duplicate
    const existing = await prisma.employeeExpense.findFirst({
      where: {
        assignerEmail: email,
        category: "Salary",
        date: { gte: start, lte: end }
      }
    });

    const isLocked = status === "Paid";
    const auditEvent = {
      action: existing ? "Reprocessed" : "Processed",
      amount: finalAmount,
      by: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || email.split('@')[0],
      date: new Date().toISOString()
    };

    if (existing) {
      const existingMetadata = (existing.metadata as any) || {};
      
      if (existingMetadata.isLocked) {
        return NextResponse.json({ error: "Record is locked. Please unlock it first." }, { status: 403 });
      }

      const auditLog = existingMetadata.auditLog || [];
      auditLog.push(auditEvent);

      const metadata = {
        salaryMonth: monthString,
        salaryYear: yearString,
        attendanceDays: payableDays,
        workingDays: totalWorkingDays,
        calculatedAmount,
        adjustment,
        finalAmount,
        isLocked,
        auditLog
      };

      // Update existing
      const updated = await prisma.employeeExpense.update({
        where: { id: existing.id },
        data: {
          amount: parseFloat(finalAmount),
          paymentMode,
          date: new Date(paymentDate || Date.now()),
          remarks,
          status,
          metadata
        }
      });
      return NextResponse.json({ success: true, message: "Salary record updated", record: updated });
    } else {
      const metadata = {
        salaryMonth: monthString,
        salaryYear: yearString,
        attendanceDays: payableDays,
        workingDays: totalWorkingDays,
        calculatedAmount,
        adjustment,
        finalAmount,
        isLocked,
        auditLog: [auditEvent]
      };

      // Create new
      const created = await prisma.employeeExpense.create({
        data: {
          assignerEmail: email,
          assignerName: name,
          title: `Salary - ${monthString} ${yearString}`,
          category: "Salary",
          amount: parseFloat(finalAmount),
          date: new Date(paymentDate || Date.now()),
          status,
          paymentMode,
          remarks,
          metadata
        }
      });
      return NextResponse.json({ success: true, message: "Salary processed successfully", record: created });
    }
  } catch (error) {
    console.error("POST Payroll Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
