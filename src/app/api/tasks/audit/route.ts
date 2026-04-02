import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims?.role as string) || "user";

    // Fallback: Check publicMetadata directly if role isn't in session claims
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    let finalRole = role;
    if (role === "user") {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        finalRole = (user.publicMetadata?.role as string) || "user";
    }

    const normalizedRole = finalRole.toLowerCase();
    const isTL = (dbUser as any)?.isTeamLeader || normalizedRole === 'tl';
    const isPrivileged = normalizedRole === "admin" || normalizedRole === "master";

    if (!isPrivileged && !isTL) {
        return NextResponse.json({ error: `Access denied. Role: ${finalRole}` }, { status: 403 });
    }

    try {
        let teamMemberIds: string[] = [];
        if (isTL && !isPrivileged) {
            const members = await prisma.user.findMany({
                where: { leaderId: userId } as any,
                select: { clerkId: true }
            });
            teamMemberIds = members.map(m => m.clerkId);
        }

        const where: any = {};
        if (!isPrivileged && isTL) {
            where.OR = [
                { createdByClerkId: userId },
                { assigneeIds: { has: userId } },
                ...(teamMemberIds.length > 0 ? [
                    { createdByClerkId: { in: teamMemberIds } },
                    { assigneeIds: { hasSome: teamMemberIds } }
                ] : [])
            ];
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                activities: {
                    orderBy: { createdAt: "asc" }
                }
            },
            orderBy: { createdAt: "desc" },
            take: 200 // Increased limit for better analysis
        });

        // ✅ ENRICH ASSIGNEE NAMES
        const allUserIds = new Set<string>();
        tasks.forEach(task => {
            if (Array.isArray(task.assigneeIds)) {
                task.assigneeIds.forEach(id => allUserIds.add(id));
            }
        });

        const userMap: Record<string, { name: string; email: string; imageUrl: string }> = {};
        if (allUserIds.size > 0) {
            try {
                const client = await clerkClient();
                const userList = await client.users.getUserList({
                    userId: Array.from(allUserIds),
                    limit: 500,
                });

                userList.data.forEach((u: any) => {
                    const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "Unknown";
                    userMap[u.id] = { name, email: u.emailAddresses[0]?.emailAddress || "", imageUrl: u.imageUrl };
                });
            } catch (err) {
                console.error("Clerk user lookup error in audit:", err);
            }
        }

        // For Bottleneck Analysis
        const statusAccumulator: { [key: string]: { totalMs: number; count: number } } = {};

        const auditData = tasks.map(task => {
            const activities = task.activities;
            const lastActivity = activities.length > 0 ? activities[activities.length - 1].createdAt : task.createdAt;

            // Enrich Assignees
            const enrichedAssignees = Array.isArray(task.assigneeIds)
                ? task.assigneeIds.map(id => ({
                    id,
                    name: userMap[id]?.name || "—",
                    email: userMap[id]?.email || "",
                    imageUrl: userMap[id]?.imageUrl || ""
                }))
                : [];

            const displayAssigneeName = enrichedAssignees.length > 0 
                ? enrichedAssignees.map(a => a.name).join(", ")
                : (task.assigneeName || "Unassigned");

            // Calculate status durations
            const statusHistory: { status: string; enterTime: Date; exitTime: Date | null; durationMs: number }[] = [];
            let currentStatusBucket = "todo";
            let lastStatusChangeTime = task.createdAt;

            activities.forEach(act => {
                if (act.type === "STATUS_CHANGE") {
                    const match = act.content.match(/to\s+([\w\s]+?)(?:\s+\(Duration|$)/i);
                    const newStatus = match ? match[1].trim().toLowerCase() : currentStatusBucket;

                    if (newStatus !== currentStatusBucket) {
                        const duration = act.createdAt.getTime() - lastStatusChangeTime.getTime();

                        statusHistory.push({
                            status: currentStatusBucket,
                            enterTime: lastStatusChangeTime,
                            exitTime: act.createdAt,
                            durationMs: duration
                        });

                        if (!statusAccumulator[currentStatusBucket]) statusAccumulator[currentStatusBucket] = { totalMs: 0, count: 0 };
                        statusAccumulator[currentStatusBucket].totalMs += duration;
                        statusAccumulator[currentStatusBucket].count += 1;

                        currentStatusBucket = newStatus;
                        lastStatusChangeTime = act.createdAt;
                    }
                }
            });

            const currentDuration = Date.now() - lastStatusChangeTime.getTime();
            statusHistory.push({
                status: currentStatusBucket,
                enterTime: lastStatusChangeTime,
                exitTime: null,
                durationMs: currentDuration
            });

            const reassignments = activities
                .filter(act => act.content.toLowerCase().includes("reassigned"))
                .map(act => ({
                    time: act.createdAt,
                    content: act.content,
                    author: act.author
                }));

            const hoursSinceLastActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
            const isStale = hoursSinceLastActivity > 48 && task.status.toLowerCase() !== "done";

            return {
                id: task.id,
                task: {
                    ...task,
                    assignees: enrichedAssignees
                },
                title: task.title,
                createdAt: task.createdAt,
                lastActivityAt: lastActivity,
                createdByName: task.createdByName || task.createdByEmail || "Unknown",
                currentStatus: task.status,
                assigneeName: displayAssigneeName,
                assignerName: task.assignerName || "Unknown",
                priority: task.priority || "Normal",
                tags: task.tags || [],
                amount: task.amount || 0,
                received: task.received || 0,
                statusHistory,
                reassignments,
                totalActivities: activities.length,
                shopName: (task.customFields as any)?.shopName || "N/A",
                isStale,
                staleHours: Math.floor(hoursSinceLastActivity)
            };
        });

        // Format Bottleneck Data
        const bottleneckData = Object.keys(statusAccumulator).map(status => ({
            status: status.toUpperCase(),
            avgDays: parseFloat((statusAccumulator[status].totalMs / statusAccumulator[status].count / (1000 * 60 * 60 * 24)).toFixed(1))
        })).sort((a, b) => b.avgDays - a.avgDays);

        const staleTasks = auditData.filter(t => t.isStale).sort((a, b) => b.staleHours - a.staleHours);

        console.log(`Audit report generated: ${tasks.length} tasks processed, ${staleTasks.length} stale, ${bottleneckData.length} bottleneck entries.`);

        return NextResponse.json({
            auditData,
            bottleneckData,
            staleTasks: staleTasks.slice(0, 10) // Top 10 most stagnant tasks
        });
    } catch (error) {
        console.error("Audit API Error:", error);
        return NextResponse.json({ error: "Failed to fetch audit data" }, { status: 500 });
    }
}
