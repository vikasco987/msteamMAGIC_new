import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await currentUser();
        const userRole = (user?.publicMetadata?.role as string || "GUEST").toUpperCase();
        const isMaster = userRole === "ADMIN" || userRole === "MASTER" || userRole === "TL";

        const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        const isTL = dbUser?.isTeamLeader || userRole === "TL";
        let teamMemberIds: string[] = [];
        if (isTL) {
            const members = await prisma.user.findMany({
                where: { leaderId: userId },
                select: { clerkId: true }
            });
            teamMemberIds = members.map(m => m.clerkId);
        }

        // Fetch all responses that have remarks
        // We include form details and values to show customer info
        const responses = await prisma.formResponse.findMany({
            where: {
                remarks: {
                    some: {
                        nextFollowUpDate: { not: null }
                    }
                }
            },
            include: {
                remarks: { orderBy: { createdAt: "desc" } },
                form: {
                    select: {
                        id: true,
                        title: true,
                        fields: true
                    }
                },
                values: true
            },
            orderBy: { submittedAt: "desc" }
        });

        // If not Master, filter by assignment, submission, or team
        const filtered = isMaster ? responses : responses.filter(res => {
            const assignees = (res as any).assignedTo || [];
            const isAssignedToMe = assignees.includes(userId);
            const isSubmittedByMe = res.submittedBy === userId;

            const isAssignedToTeam = isTL && teamMemberIds.some(id => assignees.includes(id));
            const isSubmittedByTeam = isTL && teamMemberIds.includes(res.submittedBy || "");

            return isAssignedToMe || isSubmittedByMe || isAssignedToTeam || isSubmittedByTeam;
        });

        return NextResponse.json({
            success: true,
            data: filtered,
            userRole
        });
    } catch (error) {
        console.error("Follow-up Board API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await currentUser();
        const userRole = (user?.publicMetadata?.role as string || "GUEST").toUpperCase();
        const isMaster = userRole === "ADMIN" || userRole === "MASTER" || userRole === "TL";

        if (!isMaster) {
            return NextResponse.json({ error: "Permission denied: Only Admin/Master can remove follow-ups" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const responseId = searchParams.get("responseId");

        if (!responseId) {
            return NextResponse.json({ error: "Missing responseId" }, { status: 400 });
        }

        // Logic: Clear all nextFollowUpDates for this response so it stops appearing in board
        await prisma.formRemark.updateMany({
            where: { responseId },
            data: {
                nextFollowUpDate: null,
                followUpStatus: "Closed"
            }
        });

        return NextResponse.json({ success: true, message: "Follow-up removed from board" });
    } catch (error) {
        console.error("Follow-up Board Delete Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
