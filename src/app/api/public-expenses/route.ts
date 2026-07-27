import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, amount, date, remarks, token } = body;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    if (!title || amount === undefined || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify token
    const settings = await prisma.businessSettings.findFirst();
    if (!settings || settings.publicExpenseToken !== token) {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
    }

    const expense = await prisma.generalExpense.create({
      data: {
        title,
        amount: parseFloat(amount),
        date: new Date(date),
        remarks: remarks || null
      }
    });

    return NextResponse.json({ message: "Expense created successfully", expense }, { status: 201 });
  } catch (error) {
    console.error("❌ Add Public Expense Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
