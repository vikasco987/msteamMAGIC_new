import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata?.role as string)?.toLowerCase() || "user";

    if (!["master", "admin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    
    const profile = await prisma.employeeProfile.findUnique({
      where: { id }
    });

    if (!profile) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const expenses = await prisma.employeeExpense.findMany({
      where: {
        assignerEmail: profile.email
      },
      orderBy: {
        date: "desc"
      }
    });

    return NextResponse.json({ payrollHistory: expenses });
  } catch (error: any) {
    console.error("❌ GET Employee Payroll Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
