import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    // Basic auth check for secret key if provided in env
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const now = new Date();
        const dueFollowUps = await prisma.paymentRemark.findMany({
            where: {
                nextFollowUpDate: { lte: now },
                reminderSent: false,
                followUpStatus: { not: "completed" }
            },
            include: { task: true }
        });

        let notificationsCreated = 0;

        for (const remark of dueFollowUps) {
            const targetIds = new Set([
                remark.task.assigneeId,
                ...(remark.task.assigneeIds || []),
                remark.task.createdByClerkId
            ].filter(id => id));

            for (const targetId of targetIds) {
                await prisma.notification.create({
                    data: {
                        userId: targetId as string,
                        type: "COLLECTION_FOLLOWUP",
                        content: `⏰ AUTO-REMINDER: Follow-up due for "${remark.task.title}". Pending amount: ₹${(remark.task.amount || 0) - (remark.task.received || 0)}`,
                        taskId: remark.taskId
                    }
                });
                notificationsCreated++;
            }

            await prisma.paymentRemark.update({
                where: { id: remark.id },
                data: { reminderSent: true }
            });
        }

        return NextResponse.json({ 
            success: true, 
            message: `Processed ${dueFollowUps.length} follow-ups`, 
            notificationsCreated 
        });
    } catch (error) {
        console.error("Cron Reminder Error:", error);
        return NextResponse.json({ error: "Reminder processing failed" }, { status: 500 });
    }
}
