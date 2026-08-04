import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata?.role as string)?.toLowerCase() || "user";

    // Allow Master and Admin to view profiles
    if (role !== "master" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email } = params;
    
    if (!email) {
      return NextResponse.json({ error: "Email parameter missing" }, { status: 400 });
    }

    const profile = await prisma.employeeProfile.findUnique({
      where: { email: decodeURIComponent(email).toLowerCase().trim() },
    });

    if (!profile) {
      return NextResponse.json({ profile: null, message: "Profile not found" });
    }

    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error("❌ GET Admin Employee Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
