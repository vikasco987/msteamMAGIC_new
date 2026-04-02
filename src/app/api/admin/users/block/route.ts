import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const client = await clerkClient();
        const requester = await client.users.getUser(userId);
        const requesterRole = String(requester.publicMetadata?.role || "user").toLowerCase();

        if (requesterRole !== "master") {
            return NextResponse.json({ error: "Forbidden: Only MASTER can manage roles" }, { status: 403 });
        }

        const { targetUserId, action } = await req.json();

        if (!targetUserId || !action) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (action === "ban") {
            await client.users.banUser(targetUserId);
            // Optionally clear access in Prisma or retain them as just banned inactive
        } else if (action === "unban") {
            await client.users.unbanUser(targetUserId);
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        return NextResponse.json({ success: true, action, targetUserId });
    } catch (error: any) {
        console.error("POST /api/admin/users/block error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
