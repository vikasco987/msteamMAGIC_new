import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata?.role as string)?.toLowerCase() || "user";

    if (role !== "master") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const profiles = await prisma.employeeProfile.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ profiles });
  } catch (error: any) {
    console.error("❌ GET Admin Employees Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
