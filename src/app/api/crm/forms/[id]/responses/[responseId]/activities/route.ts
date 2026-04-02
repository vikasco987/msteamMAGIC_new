import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string, responseId: string } }
) {
    try {
        const { id: formId, responseId } = await params;
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const activities = await prisma.formActivity.findMany({
            where: { responseId },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({ activities });
    } catch (error) {
        console.error("Fetch Activities Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
