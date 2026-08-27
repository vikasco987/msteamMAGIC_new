import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Authorization check
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const metadataRole = (clerkUser.publicMetadata as any)?.role || (clerkUser.privateMetadata as any)?.role;
    const normalizedRole = String(metadataRole || dbUser?.role || "user").toLowerCase();

    if (normalizedRole !== "master" && normalizedRole !== "admin") {
      return NextResponse.json({ error: "Forbidden: Master/Admin role required" }, { status: 403 });
    }

    const body = await req.json();
    const { sellerId, month, year, target } = body;

    if (!sellerId || month === undefined || year === undefined || target === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const monthInt = parseInt(month, 10);
    const yearInt = parseInt(year, 10);
    const targetFloat = parseFloat(target);

    if (isNaN(monthInt) || isNaN(yearInt) || isNaN(targetFloat)) {
      return NextResponse.json({ error: "Invalid data types for month/year/target" }, { status: 400 });
    }

    // Upsert target
    const sellerTarget = await prisma.sellerTarget.upsert({
      where: {
        sellerId_month_year: {
          sellerId,
          month: monthInt,
          year: yearInt
        }
      },
      update: {
        target: targetFloat
      },
      create: {
        sellerId,
        month: monthInt,
        year: yearInt,
        target: targetFloat
      }
    });

    return NextResponse.json({ success: true, target: sellerTarget }, { status: 200 });

  } catch (error: any) {
    console.error("🔥 Error in /api/seller-targets POST:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
