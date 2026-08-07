import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "All"; // "This Month", "Last 3 Months", "All"

    let dateFilter = {};
    const now = new Date();
    
    if (filter === "This Month") {
      dateFilter = {
        gte: new Date(now.getFullYear(), now.getMonth(), 1),
      };
    } else if (filter === "Last 3 Months") {
      dateFilter = {
        gte: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      };
    }

    // Fetch ledger entries
    const ledgerEntries = await prisma.employeeLedger.findMany({
      where: { 
        employeeEmail: employee.email,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
      },
      orderBy: { date: 'asc' }, // Order chronologically to calculate running balance
    });

    // We calculate running balance on the server to ensure consistency
    let runningBalance = 0;
    const entriesWithBalance = ledgerEntries.map(entry => {
      runningBalance += entry.credit - entry.debit;
      return {
        ...entry,
        balance: runningBalance
      };
    });

    // Reverse it so newest is on top for the UI
    entriesWithBalance.reverse();

    return NextResponse.json({ ledger: entriesWithBalance });

  } catch (error) {
    console.error("GET Ledger Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
