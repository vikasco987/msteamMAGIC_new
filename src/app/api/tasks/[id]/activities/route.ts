import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: taskId } = await context.params;

    try {
        const activities = await prisma.activity.findMany({
            where: { taskId },
            orderBy: { createdAt: "desc" },
            take: 50
        });

        return NextResponse.json({ activities });
    } catch (error) {
        console.error("Failed to fetch activities:", error);
        return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
    }
}
