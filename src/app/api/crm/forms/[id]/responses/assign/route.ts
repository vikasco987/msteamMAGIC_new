import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await currentUser();
        const metaRole = (user?.publicMetadata?.role as string || "").toUpperCase();
        const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        const dbRole = (dbUser?.role || "").toUpperCase();
        const userRole = (metaRole || dbRole || "GUEST").toUpperCase();
        const isMaster = userRole === "ADMIN" || userRole === "MASTER" || userRole === "TL";

        const { id: formId } = await params;
        const body = await req.json();
        const { responseIds, assignedTo } = body;

        if (!Array.isArray(responseIds) || !Array.isArray(assignedTo)) {
            return NextResponse.json({ error: "Invalid payload: responseIds and assignedTo must be arrays" }, { status: 400 });
        }

        // Verify if user is master (only Master/Admin can assign usually, or form owners)
        const form = await prisma.dynamicForm.findUnique({ where: { id: formId } });
        if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

        const isOwner = form.createdBy === userId;
        if (!isMaster && !isOwner) {
            return NextResponse.json({ error: "Forbidden: Only Admins/Masters can reassign leads" }, { status: 403 });
        }

        // Update multiple responses in one shot
        const updated = await prisma.formResponse.updateMany({
            where: {
                id: { in: responseIds },
                formId: formId
            },
            data: {
                assignedTo: assignedTo
            }
        });

        return NextResponse.json({ success: true, updatedCount: updated.count, assignedTo });

    } catch (error) {
        console.error("Assign Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
