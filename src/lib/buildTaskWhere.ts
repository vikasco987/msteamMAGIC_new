import { NextRequest } from "next/server";
import { getUnifiedUserId, getUserDetails } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

let cachedClerkUsers: any[] | null = null;
let clerkUsersCacheTime = 0;
const CLERK_CACHE_TTL_MS = 60 * 1000; // 1 minute cache

export async function buildTaskWhere(req: NextRequest) {
  console.log(`[DEBUG buildTaskWhere] URL: ${req.url}, Cookies: ${req.cookies.getAll().map(c => c.name).join(", ")}`);
  const userId = await getUnifiedUserId(req);
  if (!userId) {
    throw new Error("Unauthorized");
  }

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

  // CLERK LOOKUP WITH DB FALLBACK & IN-MEMORY CACHE
  let allClerkUsers: any[] = [];
  try {
    if (cachedClerkUsers && Date.now() - clerkUsersCacheTime < CLERK_CACHE_TTL_MS) {
      allClerkUsers = cachedClerkUsers;
    } else {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const clerkResponse = await client.users.getUserList({ limit: 500 });
      allClerkUsers = clerkResponse.data || [];
      cachedClerkUsers = allClerkUsers;
      clerkUsersCacheTime = Date.now();
    }
  } catch (clerkErr) {
    console.warn("⚠️ Warning: Clerk users fetch failed in buildTaskWhere, falling back to cache or DB:", clerkErr);
    allClerkUsers = cachedClerkUsers || [];
  }

  // Build user map by ID and email, and also a reverse map for name-to-ID resolution
  const userMap: Record<string, { id: string; name: string; email: string }> = {};
  const nameToIdMap: Record<string, string[]> = {};
  
  // 1. Populate from Prisma User DB first (covers all registered/synced users & custom users)
  try {
    const dbUsers = await prisma.user.findMany({
      select: { clerkId: true, name: true, email: true }
    });
    dbUsers.forEach((u) => {
      const email = u.email || "";
      const name = u.name?.trim() || "Unnamed User";
      const userData = { id: u.clerkId, name, email };
      userMap[u.clerkId] = userData;
      if (email) userMap[email] = userData;
      
      const lowerName = name.toLowerCase();
      if (!nameToIdMap[lowerName]) nameToIdMap[lowerName] = [];
      if (!nameToIdMap[lowerName].includes(u.clerkId)) {
        nameToIdMap[lowerName].push(u.clerkId);
      }
    });
  } catch (dbErr) {
    console.warn("⚠️ Warning: Prisma users fetch failed in buildTaskWhere:", dbErr);
  }

  // 2. Overlay with Clerk users if available
  allClerkUsers.forEach((u) => {
    const email = u.emailAddresses?.[0]?.emailAddress || "";
    const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "Unnamed User";
    const userData = { id: u.id, name, email };
    userMap[u.id] = userData;
    if (email) userMap[email] = userData;
    
    const lowerName = name.toLowerCase();
    if (!nameToIdMap[lowerName]) nameToIdMap[lowerName] = [];
    if (!nameToIdMap[lowerName].includes(u.id)) {
      nameToIdMap[lowerName].push(u.id);
    }
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

  if (query) {
    const trimmedQuery = query.trim();
    const isTaskCode = /^t\d+$/i.test(trimmedQuery);

    if (isTaskCode) {
      // 1. Strict exact task code match when user specifically targets a task code like T105
      where.AND.push({
        taskCode: { equals: trimmedQuery, mode: 'insensitive' }
      });
    } else {
      let relatedTaskIds: string[] = [];
      try {
        const [relatedDispatchLogs, relatedSerialNumbers, locationTaskMatches] = await Promise.all([
          prisma.dispatchLog.findMany({
            where: { awbNumber: { contains: query, mode: 'insensitive' } },
            select: { taskId: true }
          }),
          prisma.serialNumber.findMany({
            where: { number: { contains: query, mode: 'insensitive' } },
            select: { taskId: true }
          }),
          // Universal Search: Support PIN code, State, City, Full Address & Location URL/text
          (async () => {
            try {
              const { MongoClient } = await import("mongodb");
              const mClient = new MongoClient(process.env.DATABASE_URL || "");
              await mClient.connect();
              const db = mClient.db();
              const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              const regex = { $regex: escaped, $options: "i" };
              const locTasks = await db.collection("Task").find({
                $or: [
                  { "customFields.pincode": regex },
                  { "customFields.city": regex },
                  { "customFields.state": regex },
                  { "customFields.fullAddress": regex },
                  { "customFields.location": regex },
                  { location: regex }
                ]
              }, { projection: { _id: 1 } }).limit(500).toArray();
              await mClient.close();
              return locTasks.map((t) => t._id.toString());
            } catch (e) {
              console.error("Error matching location/pincode in buildTaskWhere:", e);
              return [];
            }
          })()
        ]);

        relatedTaskIds = [
          ...relatedDispatchLogs.map((d: { taskId: string }) => d.taskId).filter(Boolean),
          ...relatedSerialNumbers.map((s: { taskId: string | null }) => s.taskId).filter(Boolean),
          ...locationTaskMatches
        ] as string[];
      } catch(err) {
        console.error("Error finding related AWB/Serial/Location task ids:", err);
      }

      const queryConditions: any[] = [
        { taskCode: { contains: query, mode: 'insensitive' } },
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
  }

  if (status) {
    where.AND.push({ status: { equals: status, mode: 'insensitive' } });
  }

  if (categories && categories.length > 0) {
    try {
      const { MongoClient } = await import("mongodb");
      const mClient = new MongoClient(process.env.DATABASE_URL || "");
      await mClient.connect();
      const db = mClient.db();

      const getCategoryConditions = (cat: string): any[] => {
        const c = cat.toLowerCase().trim();
        switch (c) {
          case "zomato":
            return [
              { "customFields.activeTab": { $in: ["zomato", "combo"] } },
              { title: { $regex: "zomato", $options: "i" } }
            ];
          case "swiggy":
            return [
              { "customFields.activeTab": { $in: ["swiggy", "combo"] } },
              { title: { $regex: "swiggy", $options: "i" } }
            ];
          case "ownly":
            return [
              { "customFields.activeTab": "ownly" },
              { title: { $regex: "ownly", $options: "i" } }
            ];
          case "license":
            return [
              { "customFields.activeTab": "license" },
              { title: { $regex: "license|licence|fssai", $options: "i" } }
            ];
          case "photo":
            return [
              { "customFields.activeTab": "photo" },
              { title: { $regex: "photo", $options: "i" } }
            ];
          case "account":
            return [
              { "customFields.activeTab": "account" },
              { title: { $regex: "account", $options: "i" } }
            ];
          case "printer":
            return [
              { "customFields.activeTab": "printer" },
              { title: { $regex: "printer", $options: "i" } }
            ];
          case "printer_software":
            return [
              { "customFields.activeTab": "printer_software" },
              { title: { $regex: "software", $options: "i" } }
            ];
          case "rto_printer":
            return [
              { "customFields.activeTab": "rto_printer" },
              { title: { $regex: "rto", $options: "i" } }
            ];
          case "escalation":
            return [
              { "customFields.activeTab": "escalation" },
              { title: { $regex: "escalat", $options: "i" } }
            ];
          case "toing":
            return [
              { "customFields.activeTab": "toing" },
              { title: { $regex: "toing", $options: "i" } }
            ];
          case "other":
            return [
              { "customFields.activeTab": "other" }
            ];
          default:
            return [
              { "customFields.activeTab": c },
              { title: { $regex: c, $options: "i" } }
            ];
        }
      };

      const allCatConditions = categories.flatMap(cat => getCategoryConditions(cat));
      const matchedCategoryDocs = await db.collection("Task").find(
        { $or: allCatConditions },
        { projection: { _id: 1 } }
      ).limit(5000).toArray();

      await mClient.close();
      const matchedCategoryIds = matchedCategoryDocs.map(d => d._id.toString());

      where.AND.push({
        id: { in: matchedCategoryIds }
      });
    } catch (catErr) {
      console.error("Error matching category IDs in buildTaskWhere:", catErr);
      // Fallback to title matching if MongoDB direct query fails
      where.AND.push({
        OR: categories.map(cat => ({
          title: { contains: cat, mode: 'insensitive' }
        }))
      });
    }
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
