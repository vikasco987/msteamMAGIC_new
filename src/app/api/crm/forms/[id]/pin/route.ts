import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const rawResult: any = await (prisma as any).$runCommandRaw({
            find: "DynamicForm",
            filter: { _id: { $oid: id } },
            limit: 1
        });

        const forms = rawResult.cursor?.firstBatch || [];
        const form = forms[0];

        if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

        const currentPinnedBy: string[] = Array.isArray(form.pinnedBy) ? form.pinnedBy : [];
        const isPinned = currentPinnedBy.includes(userId);

        if (isPinned) {
            await (prisma as any).$runCommandRaw({
                update: "DynamicForm",
                updates: [{
                    q: { _id: { $oid: id } },
                    u: { $pull: { pinnedBy: userId } }
                }]
            });
        } else {
            await (prisma as any).$runCommandRaw({
                update: "DynamicForm",
                updates: [{
                    q: { _id: { $oid: id } },
                    u: { $addToSet: { pinnedBy: userId } }
                }]
            });
        }

        return NextResponse.json({ success: true, isPinned: !isPinned });
    } catch (error) {
        console.error("PIN TOGGLE ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
