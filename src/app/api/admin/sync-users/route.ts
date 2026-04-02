import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        console.log("🚀 Starting Bulk MongoDB Sync...");
        const client = await clerkClient();
        const clerkUsers = await client.users.getUserList({ limit: 100 });

        let syncedCount = 0;

        for (const user of clerkUsers.data) {
            const role = (
                (user.publicMetadata?.role as string) ||
                (user.privateMetadata?.role as string) ||
                ""
            ).toUpperCase();

            // Sirf Admin ya Master ko sync karenge bulk me
            if (role === "ADMIN" || role === "MASTER") {
                await prisma.user.upsert({
                    where: { clerkId: user.id },
                    update: {
                        role: role,
                        email: user.emailAddresses[0]?.emailAddress,
                        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Admin"
                    },
                    create: {
                        clerkId: user.id,
                        email: user.emailAddresses[0]?.emailAddress || "",
                        role: role,
                        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Admin"
                    }
                });
                syncedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            syncedCount,
            message: "✅ MongoDB collection 'User' is now synced with Clerk admins!"
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
