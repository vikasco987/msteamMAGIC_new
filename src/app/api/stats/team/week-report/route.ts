import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { startOfWeek, endOfWeek, format, endOfDay } from "date-fns";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetTlId = searchParams.get("tlId");
    const targetMemberId = searchParams.get("memberId");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    
    const role = String(clerkUser.publicMetadata?.role || dbUser?.role || "user").toLowerCase();
    const isTL = dbUser?.isTeamLeader || role === 'tl';
    const isPrivileged = ['admin', 'master'].includes(role);

    if (!isTL && !isPrivileged) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    let teamUserIds: string[] = [];

    if (targetMemberId) {
        if (!isPrivileged) {
            const memberUser = await prisma.user.findUnique({
                where: { clerkId: targetMemberId },
                select: { leaderId: true }
            });
            if (memberUser?.leaderId !== userId && targetMemberId !== userId) {
                return NextResponse.json({ error: "Unauthorized access to member data" }, { status: 403 });
            }
        }
        teamUserIds = [targetMemberId];
    } else if (targetTlId === "all" && isPrivileged) {
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
    } else {
        let leaderId = userId;
        if (targetTlId && isPrivileged) {
            leaderId = targetTlId;
        }
        const members = await prisma.user.findMany({
            where: { leaderId: leaderId },
            select: { clerkId: true }
        });
        teamUserIds = [leaderId, ...members.map(m => m.clerkId)];
    }

    const dateFilter: any = {};
    if (startDateParam) dateFilter.gte = new Date(startDateParam);
    if (endDateParam) dateFilter.lte = endOfDay(new Date(endDateParam));

    const tasks = await prisma.task.findMany({
      where: {
        AND: [
            {
                OR: [
                    { createdByClerkId: { in: teamUserIds } },
                    { assigneeId: { in: teamUserIds } },
                    { assigneeIds: { hasSome: teamUserIds } }
                ]
            },
            startDateParam || endDateParam ? { createdAt: dateFilter } : {}
        ]
      },
      select: {
          amount: true,
          received: true,
          createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by week
    const weekMap: Record<string, any> = {};
    tasks.forEach(task => {
        const date = new Date(task.createdAt);
        const sOfWeek = startOfWeek(date, { weekStartsOn: 1 });
        const eOfWeek = endOfWeek(date, { weekStartsOn: 1 });
        const weekKey = format(sOfWeek, 'yyyy-MM-dd');
        
        if (!weekMap[weekKey]) {
            weekMap[weekKey] = {
                week: weekKey,
                startDate: format(sOfWeek, 'yyyy-MM-dd'),
                endDate: format(eOfWeek, 'yyyy-MM-dd'),
                totalLeads: 0,
                totalRevenue: 0,
                amountReceived: 0,
                pendingAmount: 0
            };
        }
        weekMap[weekKey].totalLeads += 1;
        weekMap[weekKey].totalRevenue += (task.amount || 0);
        weekMap[weekKey].amountReceived += (task.received || 0);
        weekMap[weekKey].pendingAmount = weekMap[weekKey].totalRevenue - weekMap[weekKey].amountReceived;
    });

    const allWeeks = Object.values(weekMap).sort((a: any, b: any) => b.week.localeCompare(a.week));
    const paginatedData = allWeeks.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
        data: paginatedData,
        total: allWeeks.length,
        page,
        limit
    });
  } catch (error) {
    console.error("Error in team week report API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
