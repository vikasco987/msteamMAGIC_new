import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getUserDetails } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clerkClient();
    const user = (await getUserDetails(userId));
    const role = (user.publicMetadata?.role as string)?.toLowerCase() || "user";

    if (role !== "master") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const profiles = await prisma.employeeProfile.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Resolve corresponding canonical user account (clerkId) for each profile
    const emails = profiles.map(p => p.email.toLowerCase().trim());
    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { clerkId: true, email: true },
    });
    const emailToUserId = new Map(users.map(u => [u.email.toLowerCase().trim(), u.clerkId]));

    const enrichedProfiles = profiles.map(p => ({
      ...p,
      userId: emailToUserId.get(p.email.toLowerCase().trim()) || null,
    }));

    return NextResponse.json({ profiles: enrichedProfiles });
  } catch (error: any) {
    console.error("❌ GET Admin Employees Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
