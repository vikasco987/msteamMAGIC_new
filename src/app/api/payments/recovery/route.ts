import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { users } from "@clerk/clerk-sdk-node";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Match TaskTableView role logic exactly
async function getUserRole(userId: string): Promise<string | null> {
    try {
        const user = await users.getUser(userId);
        return (
            (user.publicMetadata as { role?: string })?.role ||
            (user.privateMetadata as { role?: string })?.role ||
            null
        );
    } catch {
        return null;
    }
}

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const searchTerm = searchParams.get("searchTerm") || "";
    const filterAssigner = searchParams.get("filterAssigner") || "all";
    const filterMember = searchParams.get("filterMember") || "all";
    const filterTaskStatus = searchParams.get("filterTaskStatus") || "all";
    const filterPriority = searchParams.get("filterPriority") || "all";
    const filterSource = searchParams.get("filterSource") || "all";

    const filterOutcome = searchParams.get("filterOutcome") || "all";
    const filterDate = searchParams.get("filterDate") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    try {
        const role = await getUserRole(userId);
        const isAdminOrMaster = role === "admin" || role === "master";
        const isSeller = role === "seller";

        // Match only tasks with pending balance (amount > received)
        // Using mongo expression to filter on computed value
        let whereClause: any = {
            AND: [
                { amount: { gt: 0 } },
                {
                    OR: [
                        { received: { lt: prisma.task.fields.amount } },
                        { received: null }
                    ]
                }
            ]
        };

        // Date Filter
        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                whereClause.createdAt.gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                whereClause.createdAt.lte = end;
            }
        } else if (filterDate !== "all") {
            const now = new Date();
            let start: Date | undefined;
            if (filterDate === "today") start = new Date(now.setHours(0, 0, 0, 0));
            else if (filterDate === "yesterday") {
                start = new Date(now.setDate(now.getDate() - 1));
                start.setHours(0, 0, 0, 0);
                const end = new Date(start);
                end.setHours(23, 59, 59, 999);
                whereClause.createdAt = { gte: start, lte: end };
                start = undefined; // handled
            }
            else if (filterDate === "last_7") start = new Date(now.setDate(now.getDate() - 7));
            else if (filterDate === "this_month") start = new Date(now.getFullYear(), now.getMonth(), 1);
            else if (filterDate === "this_year") start = new Date(now.getFullYear(), 0, 1);

            if (start) whereClause.createdAt = { gte: start };
        }

        // Outcome Filter (Check latest remark)
        if (filterOutcome !== "all") {
            whereClause.paymentRemarks = {
                some: {
                    contactOutcome: filterOutcome
                }
            };
        }

        // Role-based filtering
        const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        const { clerkClient: clerkClientRecovery } = await import("@clerk/nextjs/server");
        const clientRecovery = await clerkClientRecovery();
        const clerkUserRecovery = await clientRecovery.users.getUser(userId);
        const metadataRoleRecovery = (clerkUserRecovery.publicMetadata as any)?.role || (clerkUserRecovery.privateMetadata as any)?.role;
        const normalizedRoleRecovery = String(metadataRoleRecovery || dbUser?.role || "user").toLowerCase();

        const isTL = (dbUser as any)?.isTeamLeader || normalizedRoleRecovery === 'tl';
        let teamMemberIds: string[] = [];
        if (isTL) {
            const members = await prisma.user.findMany({
                where: { leaderId: userId } as any,
                select: { clerkId: true }
            });
            teamMemberIds = [userId, ...members.map(m => m.clerkId)]; // TL + Team
        }

        if (!isAdminOrMaster) {
            if (normalizedRoleRecovery === 'seller' || isTL) {
                whereClause.OR = [
                    { createdByClerkId: userId },
                    { assigneeId: userId },
                    { assigneeIds: { has: userId } },
                    ...(isTL && teamMemberIds.length > 0 ? [
                        { createdByClerkId: { in: teamMemberIds } },
                        { assigneeId: { in: teamMemberIds } },
                        { assigneeIds: { hasSome: teamMemberIds } }
                    ] : [])
                ];

                // If specialized member filter is requested by TL
                if (isTL && filterMember !== "all") {
                    // Safety: Ensure TL only filters their own team members
                    if (teamMemberIds.includes(filterMember)) {
                        whereClause.AND.push({
                            OR: [
                                { createdByClerkId: filterMember },
                                { assigneeId: filterMember },
                                { assigneeIds: { has: filterMember } }
                            ]
                        });
                    }
                }
            } else {
                return NextResponse.json({ tasks: [], summary: { totalPending: 0, taskCount: 0 }, role, pagination: { page, totalPages: 0 } });
            }
        }

        // Apply filters to whereClause
        if (searchTerm) {
            whereClause.AND = [
                ...(whereClause.AND || []),
                {
                    OR: [
                        { title: { contains: searchTerm, mode: "insensitive" } },
                        { shopName: { contains: searchTerm, mode: "insensitive" } },
                        { customerName: { contains: searchTerm, mode: "insensitive" } },
                        { phone: { contains: searchTerm, mode: "insensitive" } },
                        { location: { contains: searchTerm, mode: "insensitive" } }
                    ]
                }
            ];
        }

        if (filterAssigner !== "all") {
            whereClause.assignerName = filterAssigner;
        }
        if (filterTaskStatus !== "all") {
            whereClause.status = filterTaskStatus;
        }
        if (filterPriority !== "all") {
            whereClause.priority = filterPriority;
        }
        if (filterSource !== "all") {
            whereClause["customFields.source"] = filterSource;
        }

        // --- AUTOMATED CHASING LOGIC (Notifications) ---
        // Run completely asynchronously in the background so it doesn't block the API response
        (async () => {
            try {
                // Fetch all users to find Admins and Masters
                const { clerkClient } = await import("@clerk/nextjs/server");
                const client = await clerkClient();
                const allUsersResponse = await client.users.getUserList({ limit: 500 });
                const allUsers = Array.isArray(allUsersResponse) ? allUsersResponse : (allUsersResponse as any).data || [];
                
                const adminMasterIds = allUsers
                    .filter((u: any) => {
                        const r = (u.publicMetadata?.role || u.privateMetadata?.role || '').toLowerCase();
                        return r === 'admin' || r === 'master';
                    })
                    .map((u: any) => u.id);

                // 1. Follow-ups DUE TODAY
                const dueFollowUps = await prisma.paymentRemark.findMany({
                    where: {
                        nextFollowUpDate: { lte: new Date() },
                        reminderSent: false,
                        followUpStatus: { not: "completed" }
                    },
                    include: { task: true },
                    take: 10 // Limit per request
                });

                if (dueFollowUps.length > 0) {
                    await Promise.all(dueFollowUps.map(async (remark) => {
                        const amountPending = (remark.task.amount || 0) - (remark.task.received || 0);
                        const phoneInfo = remark.task.phone ? ` | 📞 ${remark.task.phone}` : '';

                        const targetUserIds = new Set<string>([...adminMasterIds]);
                        if (remark.createdById) targetUserIds.add(remark.createdById);
                        else if (remark.task.assigneeId) targetUserIds.add(remark.task.assigneeId);
                        else if (remark.task.createdByClerkId) targetUserIds.add(remark.task.createdByClerkId);

                        // Determine morning or evening in IST
                        const currentHourIST = parseInt(new Intl.DateTimeFormat('en-US', { hour: 'numeric', timeZone: 'Asia/Kolkata', hour12: false }).format(new Date()));
                        const isEvening = currentHourIST >= 16; // 4 PM onwards
                        const shiftType = isEvening ? "COLLECTION_REMINDER_EVENING" : "COLLECTION_REMINDER_MORNING";
                        const shiftLabel = isEvening ? "🌆 EVENING FOLLOW-UP" : "🌅 MORNING FOLLOW-UP";

                        // Ensure we haven't already sent a reminder for this specific shift today
                        const startOfToday = new Date();
                        startOfToday.setUTCHours(0, 0, 0, 0);

                        const existingShiftNotif = await prisma.notification.findFirst({
                            where: {
                                taskId: remark.taskId,
                                type: shiftType,
                                createdAt: { gte: startOfToday }
                            }
                        });

                        // If NOT sent yet for this shift
                        if (!existingShiftNotif) {
                            const notificationsToCreate = Array.from(targetUserIds).map(uid => ({
                                userId: uid,
                                type: shiftType,
                                content: `⏰ ${shiftLabel} DUE TODAY: ${remark.task.shopName || remark.task.title}. Assigner marked it for today. Outstanding: ₹${amountPending}${phoneInfo}`,
                                taskId: remark.taskId
                            }));

                            for (const n of notificationsToCreate) {
                                await prisma.notification.create({ data: n }).catch(() => { });
                            }

                            // If we just sent the Evening one, mark the remark as completely reminded.
                            if (isEvening) {
                                await prisma.paymentRemark.update({ where: { id: remark.id }, data: { reminderSent: true } }).catch(() => { });
                            }
                        }
                    }));
                }

                // 2. IGNORED TASKS (No update in 5 days)
                const fiveDaysAgo = new Date();
                fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

                const ignoredTasks = await prisma.task.findMany({
                    where: {
                        amount: { gt: 0 },
                        OR: [
                            { paymentRemarks: { none: {} } },
                            { paymentRemarks: { none: { createdAt: { gte: fiveDaysAgo } } } }
                        ]
                    },
                    take: 5, // Strictly limit to prevent dashboard lag
                    select: { id: true, shopName: true, title: true, createdByClerkId: true }
                });

                if (ignoredTasks.length > 0) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);

                    for (const t of ignoredTasks) {
                        const recentNotif = await prisma.notification.findFirst({
                            where: { taskId: t.id, type: "COLLECTION_IGNORE_WARNING", createdAt: { gte: yesterday } }
                        });

                        if (!recentNotif) {
                            await prisma.notification.create({
                                data: {
                                    userId: t.createdByClerkId,
                                    type: "COLLECTION_IGNORE_WARNING",
                                    content: `🚨 IGNORED: ${t.shopName || t.title} has no updates in 5 days.`,
                                    taskId: t.id
                                }
                            });
                        }
                    }
                }
            } catch (remErr) {
                console.warn("Automated chasing error:", remErr);
            }
        })();
        // --- END AUTOMATED CHASING ---

        // Efficient Summary Aggregation
        const summaryResult = await prisma.task.aggregate({
            where: whereClause,
            _sum: { amount: true, received: true },
            _count: { id: true }
        });

        const totalItems = summaryResult._count.id;
        const totalPendingAmount = (summaryResult._sum.amount || 0) - (summaryResult._sum.received || 0);

        // Fetch paginated tasks
        const tasks = await prisma.task.findMany({
            where: whereClause,
            include: {
                paymentRemarks: { orderBy: { createdAt: "desc" }, take: 5 },
                activities: { where: { type: "PAYMENT_ADDED" }, orderBy: { createdAt: "desc" }, take: 5 }
            },
            orderBy: { createdAt: "desc" },
            skip: skip,
            take: limit
        });

        const recoveryTasks = tasks.map(task => {
            const total = task.amount ?? 0;
            const received = task.received ?? 0;
            const pending = total - received;
            return {
                id: task.id,
                title: task.title,
                shopName: task.shopName,
                customerName: task.customerName,
                phone: task.phone,
                location: task.location,
                email: task.email,
                assigneeName: task.assigneeName,
                assignerName: task.assignerName || task.createdByName || "Admin",
                createdByClerkId: task.createdByClerkId,
                status: task.status,
                priority: task.priority,
                total,
                received,
                pending,
                latestRemark: task.paymentRemarks[0] || null,
                allRemarks: task.paymentRemarks,
                activities: task.activities,
                createdAt: task.createdAt,
                dueDate: task.dueDate,
                customFields: task.customFields,
            };
        });

        return NextResponse.json({
            tasks: recoveryTasks,
            role,
            summary: {
                totalPending: totalPendingAmount,
                taskCount: totalItems
            },
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(totalItems / limit),
                totalItems: totalItems
            }
        });

    } catch (error) {
        console.error("Recovery API Error:", error);
        return NextResponse.json({ error: "Failed to fetch recovery data" }, { status: 500 });
    }
}
