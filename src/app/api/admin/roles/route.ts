import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getUserDetails } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if requester is MASTER
        const client = await clerkClient();
        const requester = (await getUserDetails(userId));
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
                banned: !!dbUser?.isDisabled,
                // Only consider them unverified if they have a custom password but are explicitly marked as not verified
                isVerified: dbUser ? (dbUser.password ? dbUser.isVerified : true) : true,
                isCustom: false
            };
        });

        const customUsers = users
            .filter(du => du.clerkId.startsWith("custom_"))
            .map(du => ({
                id: du.clerkId,
                clerkId: du.clerkId,
                name: du.name || "Unknown",
                email: du.email,
                role: du.role,
                synced: true,
                banned: !!du.isDisabled,
                isVerified: du.isVerified,
                isCustom: true
            }));

        const allUsers = [...formattedUsers, ...customUsers];

        return NextResponse.json({ users: allUsers });
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
        const requester = (await getUserDetails(userId));
        const requesterRole = String(requester.publicMetadata?.role || "user").toLowerCase();

        if (requesterRole !== "master") {
            return NextResponse.json({ error: "Forbidden: Only MASTER can manage roles" }, { status: 403 });
        }

        const { targetUserId, newRole } = await req.json();

        if (!targetUserId || !newRole) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (targetUserId.startsWith("custom_")) {
            // It's a custom user, update in Prisma only
            await prisma.user.update({
                where: { clerkId: targetUserId },
                data: {
                    role: newRole.toUpperCase(),
                    isVerified: true // Assigning a role verifies them
                }
            });
            return NextResponse.json({ success: true, role: newRole });
        }

        // Update Clerk Metadata for Clerk users
        await client.users.updateUserMetadata(targetUserId, {
            publicMetadata: {
                role: newRole.toLowerCase()
            }
        });

        // Sync with Prisma
        const targetUser = (await getUserDetails(targetUserId));
        await prisma.user.upsert({
            where: { clerkId: targetUserId },
            update: {
                role: newRole.toUpperCase(),
                email: targetUser.emailAddresses[0].emailAddress,
                name: `${targetUser.firstName || ""} ${targetUser.lastName || ""}`.trim() || "Unnamed",
                isVerified: true
            },
            create: {
                clerkId: targetUserId,
                role: newRole.toUpperCase(),
                email: targetUser.emailAddresses[0].emailAddress,
                name: `${targetUser.firstName || ""} ${targetUser.lastName || ""}`.trim() || "Unnamed",
                isVerified: true
            }
        });

        return NextResponse.json({ success: true, role: newRole });
    } catch (error) {
        console.error("POST /api/admin/roles error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
