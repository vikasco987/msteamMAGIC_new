import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { startOfDay, endOfDay, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";

const MARKETING_FORM_ID = "69b8f819a8a6f09fd11148c7";

export async function GET(req: Request) {
    try {
        const { userId: authUserId } = await auth();
        if (!authUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const startParam = searchParams.get("start");
        const endParam = searchParams.get("end");
        const rangeType = searchParams.get("range") || "TODAY";

        const now = new Date();
        let start: Date = startOfDay(now);
        let end: Date = endOfDay(now);

        if (rangeType === "WEEK") {
            start = startOfWeek(now, { weekStartsOn: 1 });
            end = endOfWeek(now, { weekStartsOn: 1 });
        } else if (startParam && endParam) {
            start = startOfDay(parseISO(startParam));
            end = endOfDay(parseISO(endParam));
        }

        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        const [staff, responsesData, remarkStats, allTasks, monthlyGoal] = await Promise.all([
            prisma.user.findMany({
                where: { role: { in: ["USER", "TL", "ADMIN", "MASTER", "SELLER", "INTERN", "GUEST", "MANAGER"] } },
                select: { clerkId: true, name: true, email: true }
            }),
            prisma.formResponse.findMany({
                where: { formId: MARKETING_FORM_ID },
                select: {
                    id: true, assignedTo: true, submittedBy: true, submittedAt: true,
                    remarks: { orderBy: { createdAt: 'desc' }, take: 1 }
                }
            }),
            prisma.formRemark.findMany({
                where: { createdAt: { gte: start, lte: end } }
            }),
            prisma.task.findMany({
                where: { 
                    isHidden: false,
                    createdAt: { gte: monthStart } // 🚀 OPTIMIZATION: Only fetch MTD tasks
                }
            }),
            prisma.goal.findUnique({
                where: { period: format(now, "yyyy-MM") }
            }).catch(() => null)
        ]);

        const connectedStatuses = ["CALL DONE", "CALL AGAIN", "MEETING", "DUPLICATE", "CONNECTED", "INTERESTED", "BUSY"];
        const onboardingStatusesLower = ["onboarding", "onboarded", "onb", "closed-onboarding"];

        const report = staff.map(user => {
            const uid = user.clerkId;
            const uName = (user.name || "").toLowerCase();
            const uEmail = (user.email || "").toLowerCase();

            // PILLAR 1: LEAD CAPACITY
            const userLeads = responsesData.filter(r => {
                const activeAssignee = r.assignedTo.length > 0 ? r.assignedTo[r.assignedTo.length - 1] : null;
                return activeAssignee === uid;
            });
            const untouchedCount = userLeads.filter(r => !r.remarks || r.remarks.length === 0).length;
            const pendingCount = userLeads.filter(r => {
                const remarksForLead = r.remarks || [];
                if (remarksForLead.length === 0) return false;
                const latestRemark = remarksForLead[0];
                if (!latestRemark.nextFollowUpDate) return false;
                const scheduled = new Date(latestRemark.nextFollowUpDate);
                const isScheduledForDay = scheduled >= start && scheduled <= end;
                const userRemarksThisWindow = remarkStats.filter(rem => rem.createdById === uid);
                const touchedToday = userRemarksThisWindow.some(rem => rem.responseId === r.id);
                return isScheduledForDay && !touchedToday;
            }).length;

            const userCreatedTodayCount = responsesData.filter(r => r.submittedBy === uid && r.submittedAt >= start && r.submittedAt <= end).length;

            // 🛡️ PILLAR 2: REVENUE FLOW (DYNAMIC FINANCIAL RECTIFICATION)
            const userTasks = allTasks.filter(t => {
                const matchID = t.createdByClerkId === uid;
                const matchName = t.createdByName && (t.createdByName.toLowerCase() === uName || t.createdByName.toLowerCase().includes(uName));
                const matchEmail = t.createdByEmail && t.createdByEmail.toLowerCase() === uEmail;
                return matchID || matchName || matchEmail;
            });

            // Since allTasks is already filtered for the month, userTasks represents MTD tasks
            const mtdSalesTotal = userTasks.filter(t => (t.status || "").toLowerCase() === "done")
                                              .reduce((acc, t) => acc + (t.amount || 0), 0);
            const mtdReceivedTotal = userTasks.reduce((acc, t) => acc + (t.received || 0), 0);
            const mtdPendingTotal = userTasks.filter(t => (t.status || "").toLowerCase() !== "done")
                                                .reduce((acc, t) => acc + (Math.max(0, (t.amount || 0) - (t.received || 0))), 0);
            
            // 💎 GAP SHARD: Difference between expected and actual production
            const revenueGap = userTasks.reduce((acc, t) => acc + (Math.max(0, (t.amount || 0) - (t.received || 0))), 0);

            const todaySalesCount = userTasks.filter(t => {
                const isDone = (t.status || "").toLowerCase() === "done";
                const ref = t.createdAt || new Date();
                return isDone && ref >= start && ref <= end;
            }).length;

            // 🛡️ PILLAR 3: INTERACTION LOGIC
            const ALL_VALID_STATUSES = [...connectedStatuses, "RNR", "SWITCH OFF", "INVALID NUMBER"].map(s => s.toUpperCase());
            const userRemarks = remarkStats.filter(r => r.createdById === uid);
            const filterInteracted = (r: any) => {
                const statusRaw = (r.followUpStatus || "").trim().toUpperCase();
                const hasStatus = ALL_VALID_STATUSES.includes(statusRaw);
                const hasText = (r.remark || "").trim().length > 0;
                return hasStatus || hasText;
            };
            const reachoutSet = new Set(userRemarks.filter(filterInteracted).map(r => r.responseId));
            const connSet = new Set(userRemarks.filter(r => connectedStatuses.map(s => s.toUpperCase()).includes((r.followUpStatus || "").trim().toUpperCase())).map(r => r.responseId));

            const newRemarks = userRemarks.filter(r => r.columnId);
            const newReachCount = new Set(newRemarks.filter(filterInteracted).map(r => r.responseId)).size;
            const newConnCount = new Set(newRemarks.filter(r => connectedStatuses.map(s => s.toUpperCase()).includes((r.followUpStatus || "").trim().toUpperCase())).map(r => r.responseId)).size;

            const fuRemarks = userRemarks.filter(r => !r.columnId);
            const fuCallsCount = new Set(fuRemarks.filter(filterInteracted).map(r => r.responseId)).size;
            const fuConnCount = new Set(fuRemarks.filter(r => connectedStatuses.map(s => s.toUpperCase()).includes((r.followUpStatus || "").trim().toUpperCase())).map(r => r.responseId)).size;

            const todayOnbCount = new Set(userRemarks.filter(r => onboardingStatusesLower.includes((r.followUpStatus || "").toLowerCase())).map(r => r.responseId)).size;

            const todoTasksCount = userTasks.filter(t => (t.status || "").toLowerCase() === "todo").length;
            const progressTasksCount = userTasks.filter(t => (t.status || "").toLowerCase() === "inprogress").length;

            return {
                userId: uid,
                name: user.name || user.email.split('@')[0],
                email: user.email,
                untouched: untouchedCount,
                pending: pendingCount,
                submissionsFilled: userCreatedTodayCount,
                created: userLeads.length,
                reachout: reachoutSet.size,
                connected: connSet.size,
                newReachout: newReachCount,
                newConnected: newConnCount,
                followupCalls: fuCallsCount,
                followupConnected: fuConnCount,
                todayOnb: todayOnbCount,
                sales: todaySalesCount,
                totalSales: mtdSalesTotal,
                todo: todoTasksCount,
                progress: progressTasksCount,
                paymentPending: mtdPendingTotal,
                receivedAmount: mtdReceivedTotal,
                revenueGap: revenueGap
            };
        });

        // 🛡️ RECHOUT-ONLY PROTOCOL: Filter out users with ZERO total activity
        const activeReport = report.filter(u =>
            u.reachout > 0 ||
            u.todo > 0 ||
            u.progress > 0 ||
            u.totalSales > 0 ||
            u.receivedAmount > 0 ||
            u.submissionsFilled > 0
        );

        const sortedReport = activeReport.sort((a, b) => b.reachout - a.reachout);
        return NextResponse.json({ report: sortedReport, goals: monthlyGoal });

    } catch (error: any) {
        console.error("Matrix API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
