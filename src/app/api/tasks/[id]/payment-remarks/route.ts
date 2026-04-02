import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: taskId } = await context.params;

    try {
        const remarks = await prisma.paymentRemark.findMany({
            where: { taskId },
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json({ remarks });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch remarks" }, { status: 500 });
    }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: taskId } = await context.params;
    const user = await currentUser();
    const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.emailAddresses[0]?.emailAddress || "Unknown";

    try {
        const body = await req.json();
        const {
            remark,
            nextFollowUpDate,
            contactMethod,
            contactOutcome,
            pendingReason,
            priorityLevel
        } = body;

        const newRemark = await prisma.paymentRemark.create({
            data: {
                taskId,
                remark,
                authorName: userName,
                authorEmail: user?.emailAddresses[0]?.emailAddress,
                createdById: userId,
                nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
                contactMethod,
                contactOutcome,
                pendingReason,
                priorityLevel
            }
        });

        // Log this as activity
        await logActivity({
            taskId,
            type: "PAYMENT_ADDED", // Reusing this or adding new type
            content: `Payment recovery remark: "${remark}" (Outcome: ${contactOutcome || 'N/A'})`,
            author: userName,
            authorId: userId
        });

        return NextResponse.json({ success: true, remark: newRemark });
    } catch (error) {
        console.error("Failed to add remark:", error);
        return NextResponse.json({ error: "Failed to add remark" }, { status: 500 });
    }
}
