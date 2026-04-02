import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export async function GET(req: Request) {
    try {
        const { userId: authUserId } = await auth();
        if (!authUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const dbUser = await prisma.user.findUnique({ where: { clerkId: authUserId } });
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();
        const clerkUserForRole = await client.users.getUser(authUserId);
        const metadataRole = (clerkUserForRole.publicMetadata as any)?.role || (clerkUserForRole.privateMetadata as any)?.role;
        const userRole = String(metadataRole || dbUser?.role || "USER").toUpperCase();

        const isTL = (dbUser as any)?.isTeamLeader || userRole === "TL";
        const isPrivileged = userRole === "ADMIN" || userRole === "MASTER";

        let teamMemberIds: string[] = [];
        if (isTL) {
            const members = await prisma.user.findMany({
                where: { leaderId: authUserId } as any,
                select: { clerkId: true }
            });
            teamMemberIds = members.map(m => m.clerkId);
        }

        const { searchParams } = new URL(req.url);
        const dateParam = searchParams.get("date");

        const targetDate = dateParam ? parseISO(dateParam) : new Date();
        const start = startOfDay(targetDate);
        const end = endOfDay(targetDate);

        const [remarks, allUsers] = await Promise.all([
            prisma.formRemark.findMany({ 
                where: { createdAt: { gte: start, lte: end } }
            }),
            prisma.user.findMany({
                select: { clerkId: true, name: true, email: true }
            })
        ]);

        const userNameMap = new Map<string, { name: string, email: string }>();
        allUsers.forEach(u => userNameMap.set(u.clerkId, { name: u.name || "Unknown", email: u.email || "" }));

        const connectedStatuses = [
            "CALL DONE", "CALL AGAIN", "MEETING", "DUPLICATE", "CONNECTED", "INTERESTED", "BUSY",
            "Call Again", "Call done", "Not interested", "Walk-in scheduled", "Closed", "Follow up done", "Called", "Scheduled", "Follow-up Done", "Walked In",
            "ONBOARDED", "ONBOARDING", "PAYMENT PENDING", "FOLLOW-UP DONE", "WALKED IN", "INTERESTED", "BUSY", "CONNECTED", "SALES", "CLOSED", "SCHEDULED"
        ];
        const notConnectedStatuses = [
            "RNR", "RNR 2", "RNR3", "SWITCH OFF", "INVALID NUMBER", "INCOMING NOT AVAIABLE", "WRONG NUMBER", "REJECTED",
            "RNR", "RNR2 (Checked)", "RNR3", "Switch off", "Invalid Number", "Missed"
        ];

        const ALL_VALID_STATUSES = [...connectedStatuses, ...notConnectedStatuses].map(s => s.toUpperCase());

        type Interaction = { type: 'NEW' | 'FOLLOWUP'; connected: boolean; notConnected: boolean; totalRemarks: number; };
        type UserStats = { name: string; email: string; leadsContacted: Map<string, Interaction>; rawRemarkCount: number; };

        const userStatsMap = new Map<string, UserStats>();

        for (const r of remarks) {
            let userId = "Unknown";
            if (r.createdById) {
                userId = r.createdById;
            } else if (r.authorEmail) {
                const found = allUsers.find(u => u.email?.toLowerCase() === r.authorEmail?.toLowerCase());
                if (found) userId = found.clerkId;
            } else if (r.authorName) {
                const found = allUsers.find(u => u.name?.toLowerCase() === r.authorName?.toLowerCase());
                if (found) userId = found.clerkId;
            }

            if (userId === "Unknown") continue;

            const responseId = r.responseId;
            const statusRaw = (r.followUpStatus || "").trim().toUpperCase();
            
            // 🛡️ REAR-GUARD PROTOCOL: Any remark (even N/A) with content counts as interaction
            const hasStatus = ALL_VALID_STATUSES.includes(statusRaw);
            const hasText = (r.remark || "").trim().length > 0;
            if (!hasStatus && !hasText) continue;

            if (!userStatsMap.has(userId)) {
                const identity = userNameMap.get(userId);
                userStatsMap.set(userId, {
                    name: r.authorName || identity?.name || "Support Tech",
                    email: r.authorEmail || identity?.email || "",
                    leadsContacted: new Map(),
                    rawRemarkCount: 0
                });
            }

            const userStats = userStatsMap.get(userId)!;
            userStats.rawRemarkCount++; // 🛡️ INCREMENT RAW VOLUME

            if (!userStats.leadsContacted.has(responseId)) {
                userStats.leadsContacted.set(responseId, {
                    type: r.columnId ? 'NEW' : 'FOLLOWUP',
                    connected: false,
                    notConnected: false,
                    totalRemarks: 0
                });
            }

            const inter = userStats.leadsContacted.get(responseId)!;
            inter.totalRemarks++;
            if (r.columnId) inter.type = 'NEW';

            if (connectedStatuses.some(s => s.trim().toUpperCase() === statusRaw)) {
                inter.connected = true;
            } else if (notConnectedStatuses.some(s => s.trim().toUpperCase() === statusRaw)) {
                inter.notConnected = true;
            }
        }

        const finalResults = Array.from(userStatsMap.entries()).map(([userId, user]) => {
            const stats = {
                newCalls: { count: 0, connected: 0, notConnected: 0 },
                followUps: { count: 0, connected: 0, notConnected: 0 },
                combined: { count: 0, connected: 0, notConnected: 0 },
                rawRemarks: user.rawRemarkCount
            };

            user.leadsContacted.forEach((inter) => {
                stats.combined.count++;
                if (inter.connected) stats.combined.connected++;
                else if (inter.notConnected) stats.combined.notConnected++;

                if (inter.type === 'NEW') {
                    stats.newCalls.count++;
                    if (inter.connected) stats.newCalls.connected++;
                    else if (inter.notConnected) stats.newCalls.notConnected++;
                } else {
                    stats.followUps.count++;
                    if (inter.connected) stats.followUps.connected++;
                    else if (inter.notConnected) stats.followUps.notConnected++;
                }
            });

            return { userId, name: user.name, email: user.email, stats };
        });

        const filterNonZero = (list: any[]) => list.filter(r => r.callCount > 0).sort((a, b) => b.callCount - a.callCount);

        return NextResponse.json({
            reports: finalResults, // Raw data for top cards
            followUpReport: filterNonZero(finalResults.map(r => ({ userId: r.userId, name: r.name, email: r.email, callCount: r.stats.followUps.count, connectedCount: r.stats.followUps.connected, notConnectedCount: r.stats.followUps.notConnected }))),
            newCallReport: filterNonZero(finalResults.map(r => ({ userId: r.userId, name: r.name, email: r.email, callCount: r.stats.newCalls.count, connectedCount: r.stats.newCalls.connected, notConnectedCount: r.stats.newCalls.notConnected }))),
            combinedReport: filterNonZero(finalResults.map(r => ({ userId: r.userId, name: r.name, email: r.email, callCount: r.stats.combined.count, connectedCount: r.stats.combined.connected, notConnectedCount: r.stats.combined.notConnected }))),
            totalOperators: finalResults.length
        });
    } catch (e: any) {
        console.error("Call report API error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
