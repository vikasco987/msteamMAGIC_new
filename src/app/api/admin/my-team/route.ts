import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!dbUser || (!dbUser.isTeamLeader && dbUser.role !== "TL")) {
            // Not a TL, but maybe an admin/master wants to see this?
            // For now, restrict to TL only or Master
            if (dbUser?.role !== "MASTER" && dbUser?.role !== "ADMIN") {
               return NextResponse.json({ error: "Forbidden: Not a Team Leader" }, { status: 403 });
            }
        }

        // Fetch members where leaderId is the current user
        const members = await prisma.user.findMany({
            where: dbUser?.role === "MASTER" ? {} : { leaderId: userId },
            select: {
                clerkId: true,
                name: true,
                email: true,
                role: true
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ members });
    } catch (error) {
        console.error("GET /api/admin/my-team error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
