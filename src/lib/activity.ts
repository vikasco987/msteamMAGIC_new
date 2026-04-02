import { prisma } from "@/lib/prisma";

export type ActivityType = "STATUS_CHANGE" | "NOTE_ADDED" | "PAYMENT_ADDED" | "SUBTASK_TOGGLED" | "TASK_UPDATED" | "TASK_CREATED" | "PAYMENT_DELETED";

export async function logActivity({
    taskId,
    type,
    content,
    author,
    authorId
}: {
    taskId: string;
    type: ActivityType;
    content: string;
    author: string;
    authorId: string;
}) {
    try {
        return await prisma.activity.create({
            data: {
                taskId,
                type,
                content,
                author,
                authorId
            }
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
}
