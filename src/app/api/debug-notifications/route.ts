import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 1. Check DB Admins
        const dbAdmins = await prisma.user.findMany({
            where: { role: { in: ["ADMIN", "MASTER", "admin", "master"] } },
            select: { clerkId: true, email: true, role: true }
        });

        // 2. Check Clerk Admins
        const client = await clerkClient();
        const clerkRes = await client.users.getUserList({ limit: 100 });
        const clerkAdmins = clerkRes.data.map(u => ({
            id: u.id,
            email: u.emailAddresses[0]?.emailAddress,
            publicRole: u.publicMetadata?.role,
            privateRole: u.privateMetadata?.role
        })).filter(u => {
            const r = ((u.publicRole as string) || (u.privateRole as string) || "").toLowerCase();
            return r === "admin" || r === "master";
        });

        return NextResponse.json({
            currentUserId: userId,
            databaseAdminsCount: dbAdmins.length,
            databaseAdmins: dbAdmins,
            clerkAdminsCount: clerkAdmins.length,
            clerkAdmins: clerkAdmins,
            message: (dbAdmins.length === 0 && clerkAdmins.length === 0)
                ? "❌ No Admins Found! Notifications will NOT be sent."
                : "✅ Admins Found! Notifications should work."
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
