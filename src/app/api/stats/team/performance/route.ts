import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  startOfWeek, 
  endOfWeek, 
  subWeeks, 
  startOfMonth 
} from "date-fns";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetTlId = searchParams.get("tlId");
    const getTlList = searchParams.get("getTlList") === "true";

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    
    const role = String(clerkUser.publicMetadata?.role || dbUser?.role || "user").toLowerCase();
    const isTL = dbUser?.isTeamLeader || role === 'tl';
    const isPrivileged = ['admin', 'master'].includes(role);

    if (!isTL && !isPrivileged) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    // If MASTER asks for the list of TLs
    if (getTlList && isPrivileged) {
        const tls = await prisma.user.findMany({
            where: {
                OR: [
                    { isTeamLeader: true },
                    { role: { equals: "TL", mode: "insensitive" } }
                ]
            },
            select: { clerkId: true, name: true, email: true }
        });
        return NextResponse.json({ tls });
    }

    let teamUserIds: string[] = [];
    let leaderName = "";

    if (targetTlId === "all" && isPrivileged) {
        // Aggregated view for all TLs
        const allTls = await prisma.user.findMany({
            where: {
                OR: [
                    { isTeamLeader: true },
                    { role: { equals: "TL", mode: "insensitive" } }
                ]
            },
            select: { clerkId: true }
        });
        const tlIds = allTls.map(t => t.clerkId);
        const members = await prisma.user.findMany({
            where: { leaderId: { in: tlIds } },
            select: { clerkId: true }
        });
        teamUserIds = [...tlIds, ...members.map(m => m.clerkId)];
        leaderName = "All Teams";
    } else {
        // Individual TL view
        let leaderId = userId;
        if (targetTlId && isPrivileged) {
            leaderId = targetTlId;
        }

        const leaderUser = targetTlId ? await prisma.user.findUnique({ where: { clerkId: leaderId } }) : dbUser;
        const members = await prisma.user.findMany({
            where: { leaderId: leaderId },
            select: { clerkId: true }
        });
        
        teamUserIds = [leaderId, ...members.map(m => m.clerkId)];
        leaderName = leaderUser?.name || "Unknown";
    }

    // Fetch details for member performance
    const usersInTeam = await prisma.user.findMany({
        where: { clerkId: { in: teamUserIds } },
        select: { clerkId: true, name: true, email: true }
    });

    const memberMap: Record<string, any> = {};
    usersInTeam.forEach(u => {
        memberMap[u.clerkId] = {
            clerkId: u.clerkId,
            name: u.name || "Unknown",
            email: u.email || "",
            revenue: 0,
            received: 0,
            sales: 0,
            todaySales: 0,
            yesterdaySales: 0,
            thisWeekSales: 0,
            lastWeekSales: 0,
            todayRevenue: 0,
            yesterdayRevenue: 0,
            thisWeekRevenue: 0,
            lastWeekRevenue: 0
        };
    });

    // --- DATE RANGES ---
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    
    // Today
    const todayS = startOfDay(now);
    const todayE = endOfDay(now);
    
    // Yesterday
    const yesterdayS = startOfDay(subDays(now, 1));
    const yesterdayE = endOfDay(subDays(now, 1));
    
    // This Week (Starts Monday)
    const thisWeekS = startOfWeek(now, { weekStartsOn: 1 });
    
    // Last Week (Full Week, Monday to Sunday)
    const lastWeekS = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekE = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    // Earliest date needed: min of startOfCurrentMonth and lastWeekS
    const earliestDate = startOfCurrentMonth < lastWeekS ? startOfCurrentMonth : lastWeekS;

    // 2. Fetch Tasks for the whole team
    const tasks = await prisma.task.findMany({
      where: {
        createdAt: { gte: earliestDate },
        OR: [
            { createdByClerkId: { in: teamUserIds } },
            { assigneeId: { in: teamUserIds } },
            { assigneeIds: { hasSome: teamUserIds } }
        ]
      },
      select: {
          createdByClerkId: true,
          assigneeId: true,
          assigneeIds: true,
          amount: true,
          received: true,
          createdAt: true
      }
    });

    // 3. Aggregate stats by member
    tasks.forEach(task => {
        const amount = task.amount || 0;
        const received = task.received || 0;
        const createdDate = new Date(task.createdAt);
        const member = memberMap[task.createdByClerkId];
        
        if (member) {
            // Month-to-date stats (for the matrix/table)
            if (createdDate >= startOfCurrentMonth) {
                member.revenue += amount;
                member.received += received;
                member.sales += 1;
            }

            // DoD Stats
            if (createdDate >= todayS && createdDate <= todayE) {
                member.todaySales += 1;
                member.todayRevenue += amount;
            } else if (createdDate >= yesterdayS && createdDate <= yesterdayE) {
                member.yesterdaySales += 1;
                member.yesterdayRevenue += amount;
            }

            // WoW Stats
            if (createdDate >= thisWeekS) {
                member.thisWeekSales += 1;
                member.thisWeekRevenue += amount;
            } else if (createdDate >= lastWeekS && createdDate <= lastWeekE) {
                member.lastWeekSales += 1;
                member.lastWeekRevenue += amount;
            }
        }
    });

    // 4. Calculate Team Totals (Current Month)
    const teamStats = {
        leaderName,
        totalRevenue: tasks.filter(t => t.createdAt >= startOfCurrentMonth).reduce((sum, t) => sum + (t.amount || 0), 0),
        totalReceived: tasks.filter(t => t.createdAt >= startOfCurrentMonth).reduce((sum, t) => sum + (t.received || 0), 0),
        totalSales: tasks.filter(t => t.createdAt >= startOfCurrentMonth).length,
        memberPerformance: Object.values(memberMap).sort((a: any, b: any) => b.revenue - a.revenue)
    };

    return NextResponse.json(teamStats);
  } catch (error) {
    console.error("Error in team performance API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
