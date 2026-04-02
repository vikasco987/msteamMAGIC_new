import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { startOfDay, endOfDay, subDays, format, parseISO } from "date-fns";

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
                    { isHidden: false },
                    { isHidden: false }
                ]
            },
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

    // Group by day
    const dayMap: Record<string, any> = {};
    tasks.forEach(task => {
        const dateStr = format(new Date(task.createdAt), 'yyyy-MM-dd');
        if (!dayMap[dateStr]) {
            dayMap[dateStr] = {
                date: dateStr,
                totalLeads: 0,
                totalRevenue: 0,
                amountReceived: 0,
                pendingAmount: 0
            };
        }
        dayMap[dateStr].totalLeads += 1;
        dayMap[dateStr].totalRevenue += (task.amount || 0);
        dayMap[dateStr].amountReceived += (task.received || 0);
        dayMap[dateStr].pendingAmount = dayMap[dateStr].totalRevenue - dayMap[dateStr].amountReceived;
    });

    const allDays = Object.values(dayMap).sort((a: any, b: any) => b.date.localeCompare(a.date));
    const paginatedData = allDays.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
        data: paginatedData,
        total: allDays.length,
        page,
        limit
    });
  } catch (error) {
    console.error("Error in team day report API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
