import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();
        const user = await currentUser();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id: formId } = await params;
        const form = await prisma.dynamicForm.findUnique({
            where: { id: formId },
            select: { createdBy: true }
        });

        const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        const metaRole = (user?.publicMetadata?.role as string || "").toUpperCase();
        const dbRole = (dbUser?.role as string || "").toUpperCase();

        const isMaster = metaRole === "ADMIN" || metaRole === "MASTER" || metaRole === "TL" ||
            dbRole === "ADMIN" || dbRole === "MASTER" || dbRole === "TL";
        const isOwner = form?.createdBy === userId;

        if (!isMaster && !isOwner) {
            console.warn(`🚫 Forbidden bulk access attempt: User=${userId}, metaRole=${metaRole}, dbRole=${dbRole}`);
            return NextResponse.json({
                error: "Forbidden: Security protocols can only be updated by Admin or Matrix Owner",
                debug: { metaRole, dbRole, isOwner }
            }, { status: 403 });
        }

        const { ids, type, visibleToRoles, visibleToUsers } = await req.json();

        if (type === "COLUMN") {
            await prisma.internalColumn.updateMany({
                where: { id: { in: ids } },
                data: { visibleToRoles, visibleToUsers }
            });
        } else if (type === "ROW") {
            await prisma.formResponse.updateMany({
                where: { id: { in: ids } },
                data: { visibleToRoles, visibleToUsers }
            });
        } else if (type === "FORM") {
            const { id } = await params;
            await prisma.dynamicForm.update({
                where: { id },
                data: { visibleToRoles, visibleToUsers }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Bulk Visibility Update Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
