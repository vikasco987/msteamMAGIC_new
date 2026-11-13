import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getUserDetails } from "@/lib/auth-utils";

// Global cache for clerk users to avoid extremely slow API load times
let cachedClerkUsers: any[] | null = null;
let clerkUsersCacheTime = 0;
const CACHE_DURATION_MS = 60000; // 1 minute

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const client = await clerkClient();
        const requester = await prisma.user.findUnique({ where: { clerkId: userId } });
        const requesterRole = String(requester?.role || "user").toLowerCase();

        // Only MASTER can manage teams
        if (requesterRole !== "master") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 1. Fetch all users from DB
        const users = await prisma.user.findMany({
            orderBy: { name: 'asc' }
        });

        // 2. Fetch all users from Clerk to ensure sync (WITH CACHING)
        let clerkUsers: any[] = [];
        try {
            if (cachedClerkUsers && Date.now() - clerkUsersCacheTime < CACHE_DURATION_MS) {
                clerkUsers = cachedClerkUsers;
            } else {
                const clerkUsersResponse = await client.users.getUserList({ limit: 500 });
                clerkUsers = clerkUsersResponse.data;
                cachedClerkUsers = clerkUsers;
                clerkUsersCacheTime = Date.now();
            }
        } catch (e) {
            console.error("Error loading clerk users in /api/admin/teams:", e);
        }

        // Map clerk users
        const clerkUserIds = new Set<string>();
        const formattedClerkUsers = clerkUsers.map(u => {
            clerkUserIds.add(u.id);
            const dbUser = users.find(du => du.clerkId === u.id);
            return {
                id: u.id,
                clerkId: u.id,
                name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "Unknown",
                email: u.emailAddresses[0]?.emailAddress || "N/A",
                role: (u.publicMetadata?.role as string) || dbUser?.role || "user",
                isTeamLeader: dbUser?.isTeamLeader || false,
                leaderIds: dbUser?.leaderIds || [],
                currentDepartment: dbUser?.currentDepartment || "Digital",
                synced: !!dbUser,
                banned: !!u.banned || !!dbUser?.isDisabled
            };
        });

        // Also include DB users that might not be in Clerk (e.g. custom signups, local users)
        const customDbUsers = users
            .filter(du => !clerkUserIds.has(du.clerkId))
            .map(du => ({
                id: du.clerkId,
                clerkId: du.clerkId,
                name: du.name || "Unknown",
                email: du.email || "N/A",
                role: du.role || "user",
                isTeamLeader: du.isTeamLeader || false,
                leaderIds: du.leaderIds || [],
                currentDepartment: du.currentDepartment || "Digital",
                synced: true,
                banned: !!du.isDisabled
            }));

        const allFormattedUsers = [...formattedClerkUsers, ...customDbUsers];

        return NextResponse.json({ users: allFormattedUsers });
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
        const requester = (await getUserDetails(userId));
        const requesterRole = String(requester.publicMetadata?.role || "user").toLowerCase();

        if (requesterRole !== "master") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { targetUserId, isTeamLeader, hasFullKamAccess, leaderIds, currentDepartment } = await req.json();

        if (!targetUserId) {
            return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
        }
        
        const existingDbUser = await prisma.user.findUnique({ where: { clerkId: targetUserId } });
        const previousDepartment = existingDbUser?.currentDepartment || "Digital";

        // Get target user details (via unified auth which supports both clerk and custom DB users)
        const targetUser = await getUserDetails(targetUserId);

        // Determine the role string
        let newRole = (targetUser?.publicMetadata?.role as string) || existingDbUser?.role || "user";
        if (isTeamLeader === true) {
            newRole = "TL";
        } else if (isTeamLeader === false && newRole.toUpperCase() === "TL") {
            newRole = "USER"; // Default back to user if TL status removed
        }

        // Update Clerk Metadata if it's a Clerk user (Crucial for frontend role checks)
        if (isTeamLeader !== undefined && !targetUserId.startsWith('custom_')) {
          try {
            await client.users.updateUserMetadata(targetUserId, {
                publicMetadata: {
                    role: newRole.toUpperCase()
                }
            });
          } catch (e) {
            console.error("Failed to update Clerk user metadata in teams API:", e);
          }
        }

        const userName = targetUser 
          ? `${targetUser.firstName || ""} ${targetUser.lastName || ""}`.trim() || targetUser.username || "Unnamed"
          : existingDbUser?.name || "Unnamed";
        const userEmail = targetUser?.emailAddresses?.[0]?.emailAddress || existingDbUser?.email || "N/A";

        // Update DB
        const updatedUser = await prisma.user.upsert({
            where: { clerkId: targetUserId },
            update: {
                isTeamLeader: isTeamLeader !== undefined ? isTeamLeader : undefined,
                hasFullKamAccess: hasFullKamAccess !== undefined ? hasFullKamAccess : undefined,
                leaderIds: leaderIds !== undefined ? leaderIds : undefined,
                currentDepartment: currentDepartment !== undefined ? currentDepartment : undefined,
                name: userName,
                email: userEmail,
                role: newRole.toUpperCase()
            },
            create: {
                clerkId: targetUserId,
                isTeamLeader: isTeamLeader || false,
                hasFullKamAccess: hasFullKamAccess || false,
                leaderIds: leaderIds || [],
                currentDepartment: currentDepartment || "Digital",
                name: userName,
                email: userEmail,
                role: newRole.toUpperCase()
            }
        });

        if (currentDepartment !== undefined && currentDepartment !== previousDepartment) {
            await prisma.departmentHistoryLog.create({
                data: {
                    userId: updatedUser.id,
                    previousDepartment,
                    newDepartment: currentDepartment,
                    changedBy: userId
                }
            });
        }

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("POST /api/admin/teams error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
