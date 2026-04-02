import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q") || "";
        let reqLimit = parseInt(searchParams.get("limit") || "100");
        if (reqLimit > 500) reqLimit = 500;

        const clerk = await clerkClient();
        const response = await clerk.users.getUserList({
            query: query || undefined,
            limit: reqLimit
        });

        // clerkClient returns { data: User[], totalCount: number }
        const userList = (response.data || []).filter((u: any) => !u.banned);

        const dbUsers = await prisma.user.findMany({
            where: { clerkId: { in: userList.map(u => u.id) } },
            select: { clerkId: true, role: true }
        });
        const roleMap = new Map(dbUsers.map(u => [u.clerkId, u.role]));

        const formattedUsers = userList.map(u => ({
            clerkId: u.id,
            email: u.emailAddresses?.[0]?.emailAddress || "",
            name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown",
            firstName: u.firstName || "",
            lastName: u.lastName || "",
            imageUrl: u.imageUrl || "",
            role: roleMap.get(u.id) || (u.publicMetadata?.role as string) || "USER"
        }));

        return NextResponse.json(formattedUsers);
    } catch (error) {
        console.error("Fetch Users Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
