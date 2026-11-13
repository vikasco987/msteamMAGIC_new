import { NextRequest } from "next/server";
import { getUnifiedUserId, getUserDetails } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

export async function buildTaskWhere(req: NextRequest) {
  const userId = await getUnifiedUserId(req);
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const client = await clerkClient();
  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  
  let metadataRole = dbUser?.role;
  if (!userId.startsWith("custom_")) {
      try {
          const clerkUserForRole = (await getUserDetails(userId));
          metadataRole = (clerkUserForRole.publicMetadata as any)?.role || (clerkUserForRole.privateMetadata as any)?.role || metadataRole;
      } catch (e) {}
  }
  
  const normalizedRole = String(metadataRole || "user").toLowerCase();
  const userIsPrivilegedFixed = normalizedRole === "admin" || normalizedRole === "master";

  const url = new URL(req.url);

  // BULK CLERK LOOKUP: Fetch all users once for efficiency and filtering
  const clerkResponse = await client.users.getUserList({ limit: 500 });
  const allClerkUsers = clerkResponse.data;

  // Build user map by ID and email, and also a reverse map for name-to-ID resolution
  const userMap: Record<string, { id: string; name: string; email: string }> = {};
  const nameToIdMap: Record<string, string[]> = {};
  
  allClerkUsers.forEach((u) => {
    const email = u.emailAddresses?.[0]?.emailAddress || "";
    const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "Unnamed User";
    const userData = { id: u.id, name, email };
    userMap[u.id] = userData;
    if (email) userMap[email] = userData;
    
    const lowerName = name.toLowerCase();
    if (!nameToIdMap[lowerName]) nameToIdMap[lowerName] = [];
    nameToIdMap[lowerName].push(u.id);
  });

  // Extract filters and sorting from searchParams
  const query = url.searchParams.get('query')?.toLowerCase() || url.searchParams.get('search')?.toLowerCase();
  const status = url.searchParams.get('status');
  const categories = url.searchParams.get('categories')?.split(',').filter(Boolean);
  const assignees = url.searchParams.get('assignees')?.split(',').filter(Boolean);
  const assigners = url.searchParams.get('assigners')?.split(',').filter(Boolean);
  const dateFilter = url.searchParams.get('dateFilter');
  const salesFilter = url.searchParams.get('salesFilter'); // all, withSales, noSales

  // Build where clause
  // Team Leader Logic: If user is TL, they can see their team's tasks
  const isTL = (dbUser as any)?.isTeamLeader || normalizedRole === 'tl';

  let teamMemberIds: string[] = [];
  if (isTL) {
    const members = await prisma.user.findMany({
      where: { leaderIds: { has: userId } } as any,
      select: { clerkId: true }
    });
    teamMemberIds = members.map(m => m.clerkId);
  }

  const userFilter = userIsPrivilegedFixed
    ? {}
    : {
      OR: [
        { createdByClerkId: userId },
        { assigneeId: userId },
        { assigneeIds: { has: userId } },
        ...(isTL && teamMemberIds.length > 0 ? [
          { createdByClerkId: { in: teamMemberIds } },
          { assigneeId: { in: teamMemberIds } },
          { assigneeIds: { hasSome: teamMemberIds } }
        ] : [])
      ],
    };

  const where: any = {
    AND: [
      userFilter,
    ]
  };

  // 🛡️ UNIVERSAL HIDE PROTOCOL: Only Master/Admin see hidden tasks
  if (!userIsPrivilegedFixed) {
    where.AND.push({ isHidden: false });
  }

  if (query) {
    let relatedTaskIds: string[] = [];
    try {
      const relatedDispatchLogs = await prisma.dispatchLog.findMany({
        where: { awbNumber: { contains: query, mode: 'insensitive' } },
        select: { taskId: true }
      });
      const relatedSerialNumbers = await prisma.serialNumber.findMany({
        where: { number: { contains: query, mode: 'insensitive' } },
        select: { taskId: true }
      });

      relatedTaskIds = [
        ...relatedDispatchLogs.map((d: { taskId: string }) => d.taskId).filter(Boolean),
        ...relatedSerialNumbers.map((s: { taskId: string | null }) => s.taskId).filter(Boolean)
      ] as string[];
    } catch(err) {
      console.error("Error finding related AWB/Serial task ids:", err);
    }

    const queryConditions: any[] = [
      { title: { contains: query, mode: 'insensitive' } },
      { shopName: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { phone: { contains: query, mode: 'insensitive' } },
      { customerName: { contains: query, mode: 'insensitive' } }
    ];

    if (relatedTaskIds.length > 0) {
      queryConditions.push({ id: { in: relatedTaskIds } });
    }

    if (/^[0-9a-fA-F]{24}$/.test(query)) {
      queryConditions.push({ id: query });
    }

    where.AND.push({
      OR: queryConditions
    });
  }

  if (status) {
    where.AND.push({ status: { equals: status, mode: 'insensitive' } });
  }

  if (categories && categories.length > 0) {
    where.AND.push({
      OR: categories.map(cat => ({
        title: { contains: cat, mode: 'insensitive' }
      }))
    });
  }

  if (assignees && assignees.length > 0) {
    const resolvedAssigneeIds = assignees.flatMap(a => {
      const lower = a.toLowerCase();
      const ids = nameToIdMap[lower] || [];
      const directMatch = userMap[a]?.id;
      return [...ids, ...(directMatch ? [directMatch] : [])];
    });

    where.AND.push({
      OR: [
        { assigneeName: { in: assignees } },
        { assigneeEmail: { in: assignees } },
        { assigneeId: { in: resolvedAssigneeIds } },
        { assigneeIds: { hasSome: [...assignees, ...resolvedAssigneeIds] } }
      ]
    });
  }

  if (assigners && assigners.length > 0) {
    const resolvedAssignerIds = assigners.flatMap(a => {
      const lower = a.toLowerCase();
      const ids = nameToIdMap[lower] || [];
      const directMatch = userMap[a]?.id;
      return [...ids, ...(directMatch ? [directMatch] : [])];
    });

    where.AND.push({
      OR: [
        { assignerName: { in: assigners } },
        { assignerEmail: { in: assigners } },
        { createdByName: { in: assigners } },
        { createdByClerkId: { in: [...assigners, ...resolvedAssignerIds] } },
        { assignerId: { in: [...assigners, ...resolvedAssignerIds] } }
      ]
    });
  }

  if (dateFilter) {
    const filters = dateFilter.split(',').filter(Boolean);
    const dateConditions: any[] = [];
    const now = new Date();

    for (const filter of filters) {
      let startDate: Date | null = null;
      let endDate: Date | null = new Date(now);

      switch (filter) {
        case "today":
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "yesterday":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "last_7_days":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "last_15_days":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 14);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "last_30_days":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 29);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "last_60_days":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 59);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "this_month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "last_month":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          break;
        case "this_year":
          startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
      }

      if (startDate && endDate) {
        dateConditions.push({
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        });
      }
    }

    if (dateConditions.length > 0) {
      where.AND.push({
        OR: dateConditions
      });
    }
  }

  if (salesFilter === "withSales") {
    where.AND.push({ amount: { gt: 0 } });
  } else if (salesFilter === "noSales") {
    where.AND.push({
      OR: [
        { amount: 0 },
        { amount: null }
      ]
    });
  }

  return { where, userMap, normalizedRole, userIsPrivilegedFixed };
}
