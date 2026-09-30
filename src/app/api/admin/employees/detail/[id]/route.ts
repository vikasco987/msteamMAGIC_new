import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@/lib/auth-utils";
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
    const user = (userId.startsWith('custom_') ? { id: userId, emailAddresses: [], firstName: 'Custom', lastName: 'User', publicMetadata: {}, privateMetadata: {} } as any : await client.users.getUser(userId));
    const role = (user.publicMetadata?.role as string)?.toLowerCase() || "user";

    if (!["master", "admin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    if (!id) return NextResponse.json({ error: "ID parameter missing" }, { status: 400 });

    const profile = await prisma.employeeProfile.findUnique({
      where: { id }
    });

    if (!profile) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error("❌ GET Employee Detail Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
