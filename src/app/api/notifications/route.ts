import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const showAll = url.searchParams.get("all") === "true";

        console.log(`DEBUG: Fetching alerts for userId: ${userId}`);
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: showAll ? 1000 : 20,
        });
        console.log(`DEBUG: Found ${notifications.length} alerts for ${userId}`);

        const unreadCount = await prisma.notification.count({
            where: { userId, isRead: false },
        });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id, all } = await req.json();

        if (all) {
            await prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true },
            });
        } else if (id) {
            await prisma.notification.update({
                where: { id },
                data: { isRead: true },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update notification:", error);
        return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
    }
}
