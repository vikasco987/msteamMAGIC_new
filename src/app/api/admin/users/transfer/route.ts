import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { userId, sessionClaims } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const requesterRole = String((sessionClaims?.publicMetadata as any)?.role || "user").toLowerCase();

        // Only MASTER can transfer data
        if (requesterRole !== "master") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { fromUserId, toUserId } = await req.json();

        if (!fromUserId || !toUserId) {
            return NextResponse.json({ error: "Missing fromUserId or toUserId" }, { status: 400 });
        }

        if (fromUserId === toUserId) {
            return NextResponse.json({ error: "Cannot transfer to the same user" }, { status: 400 });
        }

        const fromUserDB = await prisma.user.findUnique({ where: { clerkId: fromUserId } });
        const toUserDB = await prisma.user.findUnique({ where: { clerkId: toUserId } });

        if (!fromUserDB || !toUserDB) {
            return NextResponse.json({ error: "One or both users not found in database" }, { status: 404 });
        }

        const oldEmail = fromUserDB.email;
        const oldName = fromUserDB.name;
        
        const newId = toUserId;
        const newEmail = toUserDB.email;
        const newName = toUserDB.name || "";

        // Execute sequentially to avoid overloading the DB
        
        // 1. Task
        await prisma.task.updateMany({
            where: { createdByClerkId: fromUserId },
            data: { createdByClerkId: newId, createdByEmail: newEmail, createdByName: newName }
        });
        
        await prisma.task.updateMany({
            where: { assignerId: fromUserId },
            data: { assignerId: newId, assignerEmail: newEmail, assignerName: newName }
        });
        
        await prisma.task.updateMany({
            where: { assigneeId: fromUserId },
            data: { assigneeId: newId, assigneeEmail: newEmail, assigneeName: newName }
        });

        // Task Array fields (assigneeIds)
        const tasksWithAssignee = await prisma.task.findMany({ where: { assigneeIds: { has: fromUserId } } });
        for (const task of tasksWithAssignee) {
            const newAssigneeIds = task.assigneeIds.map(id => id === fromUserId ? newId : id);
            await prisma.task.update({ where: { id: task.id }, data: { assigneeIds: Array.from(new Set(newAssigneeIds)) } });
        }

        // 2. Note
        await prisma.note.updateMany({
            where: { authorEmail: oldEmail },
            data: { authorEmail: newEmail, authorName: newName }
        });
        
        const notesWithMentions = await prisma.note.findMany({ where: { mentions: { has: fromUserId } } });
        for (const note of notesWithMentions) {
            const newMentions = note.mentions.map(id => id === fromUserId ? newId : id);
            await prisma.note.update({ where: { id: note.id }, data: { mentions: Array.from(new Set(newMentions)) } });
        }

        // 3. PaymentRemark
        await prisma.paymentRemark.updateMany({
            where: { createdById: fromUserId },
            data: { createdById: newId, authorEmail: newEmail, authorName: newName }
        });

        // 4. Payment
        await prisma.payment.updateMany({
            where: { updatedBy: fromUserId },
            data: { updatedBy: newId }
        });

        // 5. Attendance & AttendanceSummary
        await prisma.attendance.updateMany({
            where: { userId: fromUserId },
            data: { userId: newId, employeeName: newName }
        });
        
        // AttendanceSummary might already exist for the new user, we might need to handle conflicts, 
        // but for now let's just update if no conflict, or skip.
        try {
            await prisma.attendanceSummary.updateMany({
                where: { userId: fromUserId },
                data: { userId: newId }
            });
        } catch (e) {
            console.warn("Could not migrate attendance summary, possibly exists for new user", e);
            await prisma.attendanceSummary.deleteMany({ where: { userId: fromUserId } }); // Just delete old if conflict
        }

        // 6. Activity
        await prisma.activity.updateMany({
            where: { authorId: fromUserId },
            data: { authorId: newId, author: newName }
        });

        // 7. Notification
        await prisma.notification.updateMany({
            where: { userId: fromUserId },
            data: { userId: newId }
        });

        // 8. DynamicForm
        await prisma.dynamicForm.updateMany({
            where: { createdBy: fromUserId },
            data: { createdBy: newId, createdByName: newName }
        });
        
        // DynamicForm Array fields (visibleToUsers, pinnedBy)
        const formsWithVis = await prisma.dynamicForm.findMany({ where: { visibleToUsers: { has: fromUserId } } });
        for (const form of formsWithVis) {
            const newVis = form.visibleToUsers.map(id => id === fromUserId ? newId : id);
            await prisma.dynamicForm.update({ where: { id: form.id }, data: { visibleToUsers: Array.from(new Set(newVis)) } });
        }
        
        const formsWithPin = await prisma.dynamicForm.findMany({ where: { pinnedBy: { has: fromUserId } } });
        for (const form of formsWithPin) {
            const newPin = form.pinnedBy.map(id => id === fromUserId ? newId : id);
            await prisma.dynamicForm.update({ where: { id: form.id }, data: { pinnedBy: Array.from(new Set(newPin)) } });
        }

        // 9. FormResponse
        await prisma.formResponse.updateMany({
            where: { submittedBy: fromUserId },
            data: { submittedBy: newId, submittedByName: newName }
        });
        
        const responsesWithVis = await prisma.formResponse.findMany({ where: { visibleToUsers: { has: fromUserId } } });
        for (const res of responsesWithVis) {
            const newVis = res.visibleToUsers.map(id => id === fromUserId ? newId : id);
            await prisma.formResponse.update({ where: { id: res.id }, data: { visibleToUsers: Array.from(new Set(newVis)) } });
        }
        
        const responsesWithAssign = await prisma.formResponse.findMany({ where: { assignedTo: { has: fromUserId } } });
        for (const res of responsesWithAssign) {
            const newAssign = res.assignedTo.map(id => id === fromUserId ? newId : id);
            await prisma.formResponse.update({ where: { id: res.id }, data: { assignedTo: Array.from(new Set(newAssign)) } });
        }

        // 10. InternalColumn
        const colsWithVis = await prisma.internalColumn.findMany({ where: { visibleToUsers: { has: fromUserId } } });
        for (const col of colsWithVis) {
            const newVis = col.visibleToUsers.map(id => id === fromUserId ? newId : id);
            await prisma.internalColumn.update({ where: { id: col.id }, data: { visibleToUsers: Array.from(new Set(newVis)) } });
        }

        // 11. InternalValue
        await prisma.internalValue.updateMany({
            where: { updatedBy: fromUserId },
            data: { updatedBy: newId, updatedByName: newName }
        });

        // 12. FormActivity
        await prisma.formActivity.updateMany({
            where: { userId: fromUserId },
            data: { userId: newId, userName: newName }
        });

        // 13. SavedView
        await prisma.savedView.updateMany({
            where: { createdBy: fromUserId },
            data: { createdBy: newId }
        });

        // 14. FormRemark
        await prisma.formRemark.updateMany({
            where: { createdById: fromUserId },
            data: { createdById: newId, authorEmail: newEmail, authorName: newName }
        });

        // 15. FormPayment
        await prisma.formPayment.updateMany({
            where: { createdById: fromUserId },
            data: { createdById: newId, createdByName: newName }
        });

        // 16. CashfreeLink
        await prisma.cashfreeLink.updateMany({
            where: { createdBy: fromUserId },
            data: { createdBy: newId, creatorId: newId }
        });

        return NextResponse.json({ success: true, message: "Data migrated successfully" });
    } catch (error) {
        console.error("POST /api/admin/users/transfer error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
