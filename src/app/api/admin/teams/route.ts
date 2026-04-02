import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const client = await clerkClient();
        const requester = await client.users.getUser(userId);
        const requesterRole = String(requester.publicMetadata?.role || "user").toLowerCase();

        // Only MASTER can manage teams
        if (requesterRole !== "master") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch all users from DB
        const users = await prisma.user.findMany({
            orderBy: { name: 'asc' }
        });

        // Fetch all users from Clerk to ensure sync
        const clerkUsersResponse = await client.users.getUserList({ limit: 500 });
        const clerkUsers = clerkUsersResponse.data;

        const formattedUsers = clerkUsers
            .filter((u: any) => !u.banned)
            .map(u => {
            const dbUser = users.find(du => du.clerkId === u.id);
            return {
                id: u.id,
                clerkId: u.id,
                name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "Unknown",
                email: u.emailAddresses[0]?.emailAddress || "N/A",
                role: (u.publicMetadata?.role as string) || "user",
                isTeamLeader: dbUser?.isTeamLeader || false,
                leaderId: dbUser?.leaderId || null,
                synced: !!dbUser
            };
        });

        return NextResponse.json({ users: formattedUsers });
    } catch (error) {
        console.error("GET /api/admin/teams error:", error);
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
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { targetUserId, isTeamLeader, leaderId } = await req.json();

        if (!targetUserId) {
            return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
        }

        // Get target user from Clerk to ensure they exist and get details
        const targetUser = await client.users.getUser(targetUserId);

        // Determine the role string
        let newRole = (targetUser.publicMetadata?.role as string) || "user";
        if (isTeamLeader === true) {
            newRole = "TL";
        } else if (isTeamLeader === false && newRole.toUpperCase() === "TL") {
            newRole = "USER"; // Default back to user if TL status removed
        }

        // Update Clerk Metadata (Crucial for frontend role checks)
        if (isTeamLeader !== undefined) {
          await client.users.updateUserMetadata(targetUserId, {
              publicMetadata: {
                  role: newRole.toUpperCase()
              }
          });
        }

        // Update DB
        const updatedUser = await prisma.user.upsert({
            where: { clerkId: targetUserId },
            update: {
                isTeamLeader: isTeamLeader !== undefined ? isTeamLeader : undefined,
                leaderId: leaderId !== undefined ? leaderId : undefined,
                name: `${targetUser.firstName || ""} ${targetUser.lastName || ""}`.trim() || targetUser.username || "Unnamed",
                email: targetUser.emailAddresses[0].emailAddress,
                role: newRole.toUpperCase()
            },
            create: {
                clerkId: targetUserId,
                isTeamLeader: isTeamLeader || false,
                leaderId: leaderId || null,
                name: `${targetUser.firstName || ""} ${targetUser.lastName || ""}`.trim() || targetUser.username || "Unnamed",
                email: targetUser.emailAddresses[0].emailAddress,
                role: newRole.toUpperCase()
            }
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("POST /api/admin/teams error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
