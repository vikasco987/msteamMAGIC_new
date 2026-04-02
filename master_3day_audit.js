const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const dates = ["2026-03-29", "2026-03-30", "2026-03-31"];
  const FORM_ID = "69b8f819a8a6f09fd11148c7";
  
  // Find "Calling Date" column
  const dateCol = await prisma.internalColumn.findFirst({
      where: { formId: FORM_ID, label: { contains: "Calling Date", mode: 'insensitive' } }
  });

  const cStatuses = ["CALL DONE", "CONNECTED", "BUSY", "INTERESTED", "SALES", "CLOSED", "SCHEDULED", "ONBOARDING"];

  for (const dateStr of dates) {
    console.log("\n--- GRAND MATRIX: " + dateStr + " ---");
    const start = new Date(dateStr + "T00:00:00.000Z");
    const end = new Date(dateStr + "T23:59:59.999Z");

    const [allRmks, allSubs, allTasks, allLeads, allVals] = await Promise.all([
        prisma.formRemark.findMany({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.formResponse.findMany({ where: { submittedAt: { gte: start, lte: end }, formId: FORM_ID } }),
        prisma.task.findMany({ where: { isHidden: false } }),
        prisma.formResponse.findMany({ where: { formId: FORM_ID } }),
        prisma.internalValue.findMany({ where: { columnId: dateCol?.id } })
    ]);

    const actors = new Set([
        ...allRmks.map(r => r.createdById),
        ...allSubs.map(s => s.submittedBy),
        ...allLeads.map(l => l.assignedTo ? l.assignedTo[l.assignedTo.length-1] : null)
    ].filter(id => id));

    const staffRaw = await prisma.user.findMany({ where: { clerkId: { in: Array.from(actors) } } });
    const staffMap = Object.fromEntries(staffRaw.map(u => [u.clerkId, u.name]));

    const report = Array.from(actors).map((uid, idx) => {
        const uLeads = allLeads.filter(l => l.assignedTo && l.assignedTo[l.assignedTo.length - 1] === uid);
        const uRmks = allRmks.filter(r => r.createdById === uid);
        const uSubs = allSubs.filter(s => s.submittedBy === uid).length;
        const uTasks = allTasks.filter(t => (t.assigneeIds || []).includes(uid));

        const rSet = new Set(uRmks.map(r => r.responseId));
        const cSet = new Set(uRmks.filter(r => cStatuses.includes((r.followUpStatus || "").toUpperCase())).map(r => r.responseId));

        // PENDING F/U: leads where Calling Date matches today but no remark created today
        const uPendingFu = uLeads.filter(l => {
            const dateVal = allVals.find(v => v.responseId === l.id)?.value;
            if (!dateVal) return false;
            try {
                const d = new Date(dateVal);
                return d.toISOString().split('T')[0] === dateStr && !rSet.has(l.id);
            } catch { return false; }
        }).length;

        return {
            "No.": idx + 1,
            "STAFF MEMBER": staffMap[uid] || uid.substring(0,8),
            "UNTOUCHED": uLeads.filter(l => !l.remarks || l.remarks.length === 0).length,
            "PP F/U": uPendingFu,
            "FORMS": uSubs,
            "REACHOUT": rSet.size,
            "CONN.": cSet.size,
            "SALES": new Set(uRmks.filter(r => ["CLOSED", "SALES", "PAID"].includes((r.followUpStatus||"").toUpperCase())).map(r => r.responseId)).size,
            "P.P WORK": uTasks.filter(t => t.status === "COMPLETED" || t.status === "DONE").length
        };
    }).filter(r => r.REACHOUT > 0 || r.FORMS > 0 || r["PP F/U"] > 0);

    if (report.length > 0) console.table(report); else console.log("No footprint detected.");
  }
  process.exit(0);
}
run();
