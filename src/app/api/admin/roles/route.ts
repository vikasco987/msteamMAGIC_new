import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if requester is MASTER
        const client = await clerkClient();
        const requester = await client.users.getUser(userId);
        const requesterRole = String(requester.publicMetadata?.role || "user").toLowerCase();

        if (requesterRole !== "master") {
            return NextResponse.json({ error: "Forbidden: Only MASTER can manage roles" }, { status: 403 });
        }

        // Fetch all users from Prisma (to get synced roles)
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Also fetch from Clerk to see if there are users not yet in our DB
        const clerkUsersResponse = await client.users.getUserList({ limit: 100 });
        const clerkUsers = clerkUsersResponse.data;

        const formattedUsers = clerkUsers.map(u => {
            const dbUser = users.find(du => du.clerkId === u.id);
            return {
                id: u.id,
                clerkId: u.id,
                name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown",
                email: u.emailAddresses[0]?.emailAddress || "N/A",
                role: (u.publicMetadata?.role as string) || "user",
                synced: !!dbUser,
                banned: !!u.banned
            };
        });

        return NextResponse.json({ users: formattedUsers });
    } catch (error) {
        console.error("GET /api/admin/roles error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

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

        const { targetUserId, newRole } = await req.json();

        if (!targetUserId || !newRole) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Update Clerk Metadata
        await client.users.updateUserMetadata(targetUserId, {
            publicMetadata: {
                role: newRole.toLowerCase()
            }
        });

        // Sync with Prisma
        const targetUser = await client.users.getUser(targetUserId);
        await prisma.user.upsert({
            where: { clerkId: targetUserId },
            update: {
                role: newRole.toUpperCase(),
                email: targetUser.emailAddresses[0].emailAddress,
                name: `${targetUser.firstName || ""} ${targetUser.lastName || ""}`.trim() || "Unnamed",
            },
            create: {
                clerkId: targetUserId,
                role: newRole.toUpperCase(),
                email: targetUser.emailAddresses[0].emailAddress,
                name: `${targetUser.firstName || ""} ${targetUser.lastName || ""}`.trim() || "Unnamed",
            }
        });

        return NextResponse.json({ success: true, role: newRole });
    } catch (error) {
        console.error("POST /api/admin/roles error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
