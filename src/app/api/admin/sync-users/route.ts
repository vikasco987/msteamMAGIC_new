import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getUserDetails } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const client = await clerkClient();
        
        // Ensure requester is Master
        const requester = (await getUserDetails(userId));
        const requesterRole = String(requester.publicMetadata?.role || "user").toLowerCase();
        
        // Actually, we can allow ADMIN to do this too, or just MASTER
        if (requesterRole !== "master" && requesterRole !== "admin") {
            return NextResponse.json({ error: "Forbidden: Only MASTER or ADMIN can sync users" }, { status: 403 });
        }

        // Fetch all Clerk Users
        const clerkUsersResponse = await client.users.getUserList({ limit: 500 });
        const clerkUsers = clerkUsersResponse.data;

        let syncedCount = 0;

        for (const u of clerkUsers) {
            const email = u.emailAddresses?.[0]?.emailAddress || "N/A";
            const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown";
            const role = (u.publicMetadata?.role as string)?.toUpperCase() || "USER";

            await prisma.user.upsert({
                where: { clerkId: u.id },
                update: {
                    email,
                    name,
                    role,
                },
                create: {
                    clerkId: u.id,
                    email,
                    name,
                    role,
                    isVerified: true
                }
            });

            // Ensure Employee Profile exists
            await prisma.employeeProfile.upsert({
                where: { email },
                update: {
                    name,
                },
                create: {
                    email,
                    name,
                }
            });

            syncedCount++;
        }

        return NextResponse.json({ success: true, message: `Successfully synced ${syncedCount} users from Clerk to Database.` });

    } catch (error) {
        console.error("Sync users error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
