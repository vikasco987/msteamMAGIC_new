import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const pinnedForms = await prisma.dynamicForm.findMany({
            where: {
                pinnedBy: {
                    has: userId
                }
            },
            select: {
                id: true,
                title: true
            }
        });

        return NextResponse.json(pinnedForms);
    } catch (error) {
        console.error("FETCH PINNED FORMS ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
