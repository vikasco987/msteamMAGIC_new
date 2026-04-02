import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const form = await prisma.dynamicForm.findUnique({
            where: { id },
            select: { columnPermissions: true }
        });

        return NextResponse.json(form?.columnPermissions || {});
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();
        const user = await currentUser();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const form = await prisma.dynamicForm.findUnique({
            where: { id },
            select: { createdBy: true }
        });

        const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });

        const metaRole = (user?.publicMetadata?.role as string || "").toUpperCase();
        const dbRole = (dbUser?.role as string || "").toUpperCase();

        const isMaster = metaRole === "ADMIN" || metaRole === "MASTER" || metaRole === "TL" ||
            dbRole === "ADMIN" || dbRole === "MASTER" || dbRole === "TL";
        const isOwner = form?.createdBy === userId;

        if (!isMaster && !isOwner) {
            console.warn(`🚫 Forbidden access attempt: User=${userId}, metaRole=${metaRole}, dbRole=${dbRole}`);
            return NextResponse.json({
                error: "Forbidden: Only Admin or Matrix Owner can update security protocols",
                debug: { metaRole, dbRole, isOwner }
            }, { status: 403 });
        }
        const { roles, users } = await req.json();

        await prisma.dynamicForm.update({
            where: { id },
            data: {
                columnPermissions: {
                    roles: roles || {},
                    users: users || {}
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Column Permissions Update Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
