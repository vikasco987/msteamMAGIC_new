import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const oldEmail = "dipti.magicscale@gmail.com";
  const newEmail = "dipti.singh@kravy.in";
  
  const oldUser = await prisma.user.findUnique({ where: { email: oldEmail } });
  const newUser = await prisma.user.findUnique({ where: { email: newEmail } });

  if (!oldUser || !newUser) {
    console.error("Users not found");
    return;
  }

  const oldId = oldUser.clerkId;
  const newId = newUser.clerkId;

  console.log(`Migrating from ${oldEmail} (${oldId}) to ${newEmail} (${newId})...`);

  // Tasks
  const taskAssigner = await prisma.task.updateMany({
    where: { assignerId: oldId },
    data: { assignerId: newId, assignerEmail: newEmail }
  });
  const taskAssignee = await prisma.task.updateMany({
    where: { assigneeId: oldId },
    data: { assigneeId: newId, assigneeEmail: newEmail }
  });
  const taskCreator = await prisma.task.updateMany({
    where: { createdByClerkId: oldId },
    data: { createdByClerkId: newId, createdByEmail: newEmail }
  });

  // Array fields in Task - assigneeIds
  const tasksWithOldAssignee = await prisma.task.findMany({
    where: { assigneeIds: { has: oldId } }
  });
  for (const t of tasksWithOldAssignee) {
    const newAssigneeIds = t.assigneeIds.map(id => id === oldId ? newId : id);
    // remove duplicates if any
    const uniqueIds = Array.from(new Set(newAssigneeIds));
    await prisma.task.update({
      where: { id: t.id },
      data: { assigneeIds: uniqueIds }
    });
  }

  // Notes
  const notesAuthor = await prisma.note.updateMany({
    where: { authorEmail: oldEmail },
    data: { authorEmail: newEmail }
  });
  // Mentions / ReadBy in Note
  const notesWithMentions = await prisma.note.findMany({
    where: { OR: [ { mentions: { has: oldId } }, { readBy: { has: oldId } } ] }
  });
  for (const n of notesWithMentions) {
    await prisma.note.update({
      where: { id: n.id },
      data: {
        mentions: Array.from(new Set(n.mentions.map(id => id === oldId ? newId : id))),
        readBy: Array.from(new Set(n.readBy.map(id => id === oldId ? newId : id)))
      }
    });
  }

  // PaymentRemark
  const paymentRemarks = await prisma.paymentRemark.updateMany({
    where: { createdById: oldId },
    data: { createdById: newId, authorEmail: newEmail }
  });

  // User leadership
  const userLeader = await prisma.user.updateMany({
    where: { leaderId: oldId },
    data: { leaderId: newId }
  });

  // Attendance
  const attendance = await prisma.attendance.updateMany({
    where: { userId: oldId },
    data: { userId: newId }
  });
  // AttendanceSummary can't have duplicate userId if newId already has one.
  const oldSummary = await prisma.attendanceSummary.findUnique({ where: { userId: oldId } });
  const newSummary = await prisma.attendanceSummary.findUnique({ where: { userId: newId } });
  if (oldSummary) {
    if (!newSummary) {
      await prisma.attendanceSummary.update({
        where: { id: oldSummary.id },
        data: { userId: newId }
      });
    } else {
      // merge or just delete old if new exists
      await prisma.attendanceSummary.update({
        where: { id: newSummary.id },
        data: {
          totalDays: newSummary.totalDays + oldSummary.totalDays,
          presentDays: newSummary.presentDays + oldSummary.presentDays,
          leaveDays: newSummary.leaveDays + oldSummary.leaveDays,
          overtimeHours: newSummary.overtimeHours + oldSummary.overtimeHours
        }
      });
      await prisma.attendanceSummary.delete({ where: { id: oldSummary.id } });
    }
  }

  // Activity
  const activity = await prisma.activity.updateMany({
    where: { authorId: oldId },
    data: { authorId: newId }
  });

  // Notification
  const notifications = await prisma.notification.updateMany({
    where: { userId: oldId },
    data: { userId: newId }
  });

  // DynamicForm
  const dynamicForms = await prisma.dynamicForm.updateMany({
    where: { createdBy: oldId },
    data: { createdBy: newId }
  });
  const formsWithOldId = await prisma.dynamicForm.findMany({
    where: { OR: [ { visibleToUsers: { has: oldId } }, { pinnedBy: { has: oldId } } ] }
  });
  for (const f of formsWithOldId) {
    await prisma.dynamicForm.update({
      where: { id: f.id },
      data: {
        visibleToUsers: Array.from(new Set(f.visibleToUsers.map(id => id === oldId ? newId : id))),
        pinnedBy: Array.from(new Set(f.pinnedBy.map(id => id === oldId ? newId : id)))
      }
    });
  }

  // FormResponse
  const formResponses = await prisma.formResponse.updateMany({
    where: { submittedBy: oldId },
    data: { submittedBy: newId }
  });
  const responsesWithOldId = await prisma.formResponse.findMany({
    where: { OR: [ { visibleToUsers: { has: oldId } }, { assignedTo: { has: oldId } } ] }
  });
  for (const r of responsesWithOldId) {
    await prisma.formResponse.update({
      where: { id: r.id },
      data: {
        visibleToUsers: Array.from(new Set(r.visibleToUsers.map(id => id === oldId ? newId : id))),
        assignedTo: Array.from(new Set(r.assignedTo.map(id => id === oldId ? newId : id)))
      }
    });
  }

  // InternalValue
  const internalValues = await prisma.internalValue.updateMany({
    where: { updatedBy: oldId },
    data: { updatedBy: newId }
  });

  // FormActivity
  const formActivities = await prisma.formActivity.updateMany({
    where: { userId: oldId },
    data: { userId: newId }
  });

  // SavedView
  const savedViews = await prisma.savedView.updateMany({
    where: { createdBy: oldId },
    data: { createdBy: newId }
  });

  // FormRemark
  const formRemarks = await prisma.formRemark.updateMany({
    where: { createdById: oldId },
    data: { createdById: newId, authorEmail: newEmail }
  });

  // FormPayment
  const formPayments = await prisma.formPayment.updateMany({
    where: { createdById: oldId },
    data: { createdById: newId }
  });

  // CashfreeLink
  const cashfreeLinks = await prisma.cashfreeLink.updateMany({
    where: { creatorId: oldId },
    data: { creatorId: newId }
  });

  console.log("Migration completed.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
