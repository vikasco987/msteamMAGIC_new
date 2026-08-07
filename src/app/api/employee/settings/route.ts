import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.businessSettings.findFirst();
    
    // Only return safe, non-sensitive settings for the employee portal
    return NextResponse.json({
      showEmployeeSalaryHistory: settings?.showEmployeeSalaryHistory || false,
    });
  } catch (error) {
    console.error("GET /api/employee/settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
