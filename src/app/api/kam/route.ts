// app/api/kam/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client"; // Import Prisma for JsonValue type
import { MongoClient } from "mongodb";

let cachedPrimaryClient: MongoClient | null = null;
let cachedSecondaryClient: MongoClient | null = null;
let cachedFilterOptions: { assignees: string[]; assigners: string[] } | null = null;
let lastFilterOptionsTime = 0;
const FILTER_OPTIONS_CACHE_TTL = 60 * 1000; // 60 seconds TTL cache

async function getPrimaryMongoClient() {
  if (cachedPrimaryClient) return cachedPrimaryClient;
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error("DATABASE_URL is not defined");
  const client = new MongoClient(uri);
  await client.connect();
  cachedPrimaryClient = client;
  return client;
}

async function getSecondaryMongoClient() {
  if (cachedSecondaryClient) return cachedSecondaryClient;
  const uri = process.env.SECONDARY_CRM_DATABASE_URL;
  if (!uri) return null;
  try {
    const client = new MongoClient(uri);
    await client.connect();
    cachedSecondaryClient = client;
    return client;
  } catch (err) {
    return null;
  }
}

// 1. Define the type for the customFields object
// Removed '[key: string]: any;' to eliminate the 'any' type error.
// This interface now strictly defines the expected properties.
interface CustomFields {
  shopName?: string | null;
  customerName?: string | null;
  packageAmount?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  timeline?: string | null;
  // If you have other custom fields, add them here with their specific types.
  // Example: phone?: string | null; email?: string | null;
}

// 2. Define the type for the Task object returned by Prisma with the specific select fields
interface PrismaSelectedTask {
  id: string;
  createdAt: Date; // Prisma returns Date objects for datetime fields
  customFields: Prisma.JsonValue | null; // Prisma returns JSON fields as JsonValue
}

import { auth } from "@/lib/auth-utils";
import { getUserDetails } from "@/lib/auth-utils";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query = searchParams.get("query");
    const status = searchParams.get("status");
    const followUpDateFilter = searchParams.get("followUpDate");
    const lastCheckDateFilter = searchParams.get("lastCheckDate");
    const accountStatusFilter = searchParams.get("accountStatus");
    const customerStatusFilter = searchParams.get("customerStatus");
    const assignersParam = searchParams.get("assigners");
    const assigneesParam = searchParams.get("assignees");
    const sortKeyParam = searchParams.get("sortKey") || "createdAt";
    const sortDir = (searchParams.get("sortDir") || "desc") as "asc" | "desc";

    // Map frontend sort keys to Prisma sort keys if needed
    const sortKey = (sortKeyParam === "pendingAmount" || sortKeyParam === "daysRemaining") ? "createdAt" : sortKeyParam;

    // Build the query where clause
    const where: Prisma.TaskWhereInput = {
      title: "📂 Account Handling",
    };

    // Role-based filtering
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    
    // Use Clerk metadata for role if possible, fallback to DB role
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const clerkUser = (await getUserDetails(userId));
    const roleFromClerk = (clerkUser.publicMetadata as any)?.role || (clerkUser.privateMetadata as any)?.role;
    const normalizedRole = String(roleFromClerk || dbUser?.role || 'user').toLowerCase();
    
    const isTL = (dbUser as any)?.isTeamLeader || normalizedRole === 'tl';
    let teamMemberIds: string[] = [];
    if (isTL) {
      const members = await prisma.user.findMany({
        where: { leaderIds: { has: userId } } as any,
        select: { clerkId: true }
      });
      teamMemberIds = members.map(m => m.clerkId);
    }

    const isSeller = normalizedRole === "seller";
    const isPrivileged = normalizedRole === "admin" || normalizedRole === "master" || (dbUser as any)?.hasFullKamAccess;

    console.log(`[KAM API Debug] User: ${userId}, Role: ${normalizedRole}, isTL: ${isTL}, TeamCount: ${teamMemberIds.length}, isPrivileged: ${isPrivileged}`);

    if (isPrivileged) {
      // No filter for privileged roles
      console.log(`[KAM API Debug] Privileged access - fetching all items`);
    } else if (isSeller || normalizedRole === "tl" || isTL) {
      where.OR = [
        { createdByClerkId: userId },
        { assigneeIds: { has: userId } },
        { assigneeId: userId },
        ...(isTL && teamMemberIds.length > 0 ? [
          { createdByClerkId: { in: teamMemberIds } },
          { assigneeIds: { hasSome: teamMemberIds } }
        ] : [])
      ];
      console.log(`[KAM API Debug] Restricted access applied for TL/Seller. TeamMembers found: ${teamMemberIds.length}`);
    } else {
      console.warn(`[KAM API Debug] Access Denied for role: ${normalizedRole}`);
      return NextResponse.json({ tasks: [], pagination: { total: 0, page, limit, totalPages: 0 } });
    }

    // Additional filters
    if (status) {
      where.status = status;
    }

    // Has custom field / raw Mongo filters
    const needsMongoRawFilter = Boolean(
      followUpDateFilter ||
      lastCheckDateFilter ||
      accountStatusFilter ||
      customerStatusFilter ||
      assignersParam ||
      assigneesParam
    );

    let tasks: any[] = [];
    let totalCount = 0;

    if (needsMongoRawFilter) {
      const rawFilter: any = {
        title: "📂 Account Handling",
      };

      if (status) {
        rawFilter.status = status;
      }

      if (query) {
        rawFilter.$or = [
          { shopName: { $regex: query, $options: "i" } },
          { customerName: { $regex: query, $options: "i" } },
          { assigneeName: { $regex: query, $options: "i" } },
          { assignerName: { $regex: query, $options: "i" } },
        ];
      }

      // Role conditions in rawFilter
      if (!isPrivileged && (isSeller || normalizedRole === "tl" || isTL)) {
        const orClauses: any[] = [
          { createdByClerkId: userId },
          { assigneeIds: userId },
          { assigneeId: userId },
        ];
        if (isTL && teamMemberIds.length > 0) {
          orClauses.push({ createdByClerkId: { $in: teamMemberIds } });
          orClauses.push({ assigneeIds: { $in: teamMemberIds } });
        }
        if (rawFilter.$or) {
          rawFilter.$and = [{ $or: rawFilter.$or }, { $or: orClauses }];
          delete rawFilter.$or;
        } else {
          rawFilter.$or = orClauses;
        }
      }

      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];

      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 7);
      const past7DaysStr = past7.toISOString().split("T")[0];

      const past15 = new Date(now);
      past15.setDate(past15.getDate() - 15);
      const past15DaysStr = past15.toISOString().split("T")[0];

      const past30 = new Date(now);
      past30.setDate(past30.getDate() - 30);
      const past30DaysStr = past30.toISOString().split("T")[0];

      const next7 = new Date(now);
      next7.setDate(next7.getDate() + 7);
      const next7DaysStr = next7.toISOString().split("T")[0];

      const next15 = new Date(now);
      next15.setDate(next15.getDate() + 15);
      const next15DaysStr = next15.toISOString().split("T")[0];

      const next30 = new Date(now);
      next30.setDate(next30.getDate() + 30);
      const next30DaysStr = next30.toISOString().split("T")[0];

      const startOfMonthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const endOfMonthStr = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

      if (followUpDateFilter) {
        if (followUpDateFilter === "no_date") {
          const noDateConditions = [
            { "customFields.nextFollowUpDate": { $exists: false } },
            { "customFields.nextFollowUpDate": null },
            { "customFields.nextFollowUpDate": "" },
          ];
          if (rawFilter.$and) {
            rawFilter.$and.push({ $or: noDateConditions });
          } else if (rawFilter.$or) {
            rawFilter.$and = [{ $or: rawFilter.$or }, { $or: noDateConditions }];
            delete rawFilter.$or;
          } else {
            rawFilter.$or = noDateConditions;
          }
        } else if (followUpDateFilter === "has_date") {
          rawFilter["customFields.nextFollowUpDate"] = { $exists: true, $nin: [null, ""] };
        } else if (followUpDateFilter === "today") {
          rawFilter["customFields.nextFollowUpDate"] = todayStr;
        } else if (followUpDateFilter === "tomorrow") {
          rawFilter["customFields.nextFollowUpDate"] = tomorrowStr;
        } else if (followUpDateFilter === "yesterday") {
          rawFilter["customFields.nextFollowUpDate"] = yesterdayStr;
        } else if (followUpDateFilter === "overdue") {
          rawFilter["customFields.nextFollowUpDate"] = { $exists: true, $nin: [null, ""], $lt: todayStr };
        } else if (followUpDateFilter === "next_7_days") {
          rawFilter["customFields.nextFollowUpDate"] = { $gte: todayStr, $lte: next7DaysStr };
        } else if (followUpDateFilter === "next_15_days") {
          rawFilter["customFields.nextFollowUpDate"] = { $gte: todayStr, $lte: next15DaysStr };
        } else if (followUpDateFilter === "next_30_days") {
          rawFilter["customFields.nextFollowUpDate"] = { $gte: todayStr, $lte: next30DaysStr };
        } else if (followUpDateFilter === "this_month") {
          rawFilter["customFields.nextFollowUpDate"] = { $gte: startOfMonthStr, $lte: endOfMonthStr };
        }
      }

      if (lastCheckDateFilter) {
        if (lastCheckDateFilter === "no_date") {
          const noLastCheckConditions = [
            { "customFields.lastCheckOutletDate": { $exists: false } },
            { "customFields.lastCheckOutletDate": null },
            { "customFields.lastCheckOutletDate": "" },
          ];
          if (rawFilter.$and) {
            rawFilter.$and.push({ $or: noLastCheckConditions });
          } else if (rawFilter.$or) {
            rawFilter.$and = [{ $or: rawFilter.$or }, { $or: noLastCheckConditions }];
            delete rawFilter.$or;
          } else {
            rawFilter.$or = noLastCheckConditions;
          }
        } else if (lastCheckDateFilter === "has_date") {
          rawFilter["customFields.lastCheckOutletDate"] = { $exists: true, $nin: [null, ""] };
        } else if (lastCheckDateFilter === "today") {
          rawFilter["customFields.lastCheckOutletDate"] = todayStr;
        } else if (lastCheckDateFilter === "yesterday") {
          rawFilter["customFields.lastCheckOutletDate"] = yesterdayStr;
        } else if (lastCheckDateFilter === "last_7_days") {
          rawFilter["customFields.lastCheckOutletDate"] = { $gte: past7DaysStr, $lte: todayStr };
        } else if (lastCheckDateFilter === "last_15_days") {
          rawFilter["customFields.lastCheckOutletDate"] = { $gte: past15DaysStr, $lte: todayStr };
        } else if (lastCheckDateFilter === "last_30_days") {
          rawFilter["customFields.lastCheckOutletDate"] = { $gte: past30DaysStr, $lte: todayStr };
        } else if (lastCheckDateFilter === "this_month") {
          rawFilter["customFields.lastCheckOutletDate"] = { $gte: startOfMonthStr, $lte: endOfMonthStr };
        }
      }

      if (accountStatusFilter) {
        rawFilter["customFields.accountStatus"] = accountStatusFilter;
      }

      if (customerStatusFilter) {
        rawFilter["customFields.customerStatus"] = customerStatusFilter;
      }

      if (assignersParam) {
        const assignerList = assignersParam.split(",").map(a => a.trim()).filter(Boolean);
        if (assignerList.length > 0) {
          const assignerOrConditions: any[] = [
            { assignerName: { $in: assignerList } },
            { "customFields.assignerName": { $in: assignerList } }
          ];

          for (const n of assignerList) {
            assignerOrConditions.push({ assignerName: { $regex: n, $options: "i" } });
            assignerOrConditions.push({ "customFields.assignerName": { $regex: n, $options: "i" } });
          }

          rawFilter.$and = rawFilter.$and || [];
          rawFilter.$and.push({
            $or: assignerOrConditions
          });
        }
      }

      if (assigneesParam) {
        const assigneeList = assigneesParam.split(",").map(a => a.trim()).filter(Boolean);
        if (assigneeList.length > 0) {
          // Resolve matched user clerkIds
          const allDbUsers = await prisma.user.findMany({ select: { clerkId: true, name: true } });
          const matchedClerkIds = allDbUsers
            .filter(u => assigneeList.some(n => 
              u.name.trim().toLowerCase() === n.trim().toLowerCase() ||
              u.name.trim().toLowerCase().startsWith(n.trim().toLowerCase() + " ")
            ))
            .map(u => u.clerkId);

          const assigneeOrConditions: any[] = [
            { assigneeName: { $in: assigneeList } },
            { "customFields.assigneeName": { $in: assigneeList } }
          ];

          for (const n of assigneeList) {
            assigneeOrConditions.push({ assigneeName: { $regex: n, $options: "i" } });
            assigneeOrConditions.push({ "customFields.assigneeName": { $regex: n, $options: "i" } });
          }

          if (matchedClerkIds.length > 0) {
            assigneeOrConditions.push({ assigneeIds: { $in: matchedClerkIds } });
            assigneeOrConditions.push({ assigneeId: { $in: matchedClerkIds } });
          }

          rawFilter.$and = rawFilter.$and || [];
          rawFilter.$and.push({
            $or: assigneeOrConditions
          });
        }
      }

      // Execute findRaw with count
      const allMatchingRaw: any = await prisma.task.findRaw({
        filter: rawFilter,
        options: {
          sort: { [sortKey]: sortDir === "asc" ? 1 : -1 },
          skip,
          limit,
          projection: { _id: 1 }
        }
      });

      const totalCountRaw: any = await prisma.task.aggregateRaw({
        pipeline: [
          { $match: rawFilter },
          { $count: "count" }
        ]
      });

      totalCount = Array.isArray(totalCountRaw) && totalCountRaw.length > 0 ? totalCountRaw[0].count : 0;

      const pageIds = (allMatchingRaw || []).map((doc: any) => {
        return doc._id?.$oid || String(doc._id);
      });

      if (pageIds.length > 0) {
        const fetchedTasks = await prisma.task.findMany({
          where: { id: { in: pageIds } },
          select: {
            id: true,
            title: true,
            status: true,
            shopName: true,
            customerName: true,
            packageAmount: true,
            startDate: true,
            endDate: true,
            timeline: true,
            assignerName: true,
            assigneeName: true,
            assigneeIds: true,
            createdAt: true,
            amount: true,
            received: true,
            highlightColor: true,
            customFields: true,
            notes: {
              select: {
                content: true,
                authorName: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
          },
        });

        // Preserve order from findRaw
        const taskMap = new Map(fetchedTasks.map(t => [t.id, t]));
        tasks = pageIds.map((id: string) => taskMap.get(id)).filter(Boolean);
      } else {
        tasks = [];
      }
    } else {
      // Standard Prisma query
      const [fetchedTasks, count] = await Promise.all([
        prisma.task.findMany({
          where,
          select: {
            id: true,
            title: true,
            status: true,
            shopName: true,
            customerName: true,
            packageAmount: true,
            startDate: true,
            endDate: true,
            timeline: true,
            assignerName: true,
            assigneeName: true,
            assigneeIds: true,
            createdAt: true,
            amount: true,
            received: true,
            highlightColor: true,
            customFields: true,
            notes: {
              select: {
                content: true,
                authorName: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
          },
          orderBy: {
            [sortKey]: sortDir,
          },
          skip,
          take: limit,
        }),
        prisma.task.count({ where }),
      ]);
      tasks = fetchedTasks;
      totalCount = count;
    }

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
        const userList = await client.users.getUserList({
          userId: Array.from(allUserIds),
          limit: 500,
        });

        userList.data.forEach((u: any) => {
          const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "Unknown";
          userMap[u.id] = { name, email: u.emailAddresses[0]?.emailAddress || "", imageUrl: u.imageUrl };
        });
      } catch (err) {
        console.error("Clerk user lookup error:", err);
      }
    }

    console.log(`[KAM API Debug] Total Tasks Fetched: ${tasks.length}, Total Global Count: ${totalCount}`);

    // Map tasks to enriched format including the 'assignees' array expected by frontend
    const enrichedTasks = tasks.map(task => {
      const assignees = Array.isArray(task.assigneeIds)
        ? task.assigneeIds.map(id => ({
          name: userMap[id]?.name || "—",
          email: userMap[id]?.email || "",
          imageUrl: userMap[id]?.imageUrl || ""
        }))
        : [];

      // Also update the primary assigneeName string for backward compatibility or simpler logic
      const enrichedAssigneeName = assignees.length > 0
        ? assignees.map(a => a.name).join(", ")
        : (task.assigneeName || "—");

      return {
        ...task,
        assigneeName: enrichedAssigneeName,
        assignees: assignees.length > 0 ? assignees : undefined,
        recentNote: task.notes && task.notes.length > 0 ? task.notes[0] : null,
      };
    });

    // Fetch filter options (all distinct assignees and assigners across tasks)
    let filterOptions = { assignees: [] as string[], assigners: [] as string[] };
    try {
      const nowTs = Date.now();
      if (cachedFilterOptions && (nowTs - lastFilterOptionsTime < FILTER_OPTIONS_CACHE_TTL)) {
        filterOptions = cachedFilterOptions;
      } else {
        const pClient = await getPrimaryMongoClient();
        const pDb = pClient.db();
        const sClient = await getSecondaryMongoClient();
        const sDb = sClient ? sClient.db("clickup_clone") : null;

        const [pTasks, sTasks] = await Promise.all([
          pDb.collection("Task").find({ title: "📂 Account Handling" }, { projection: { assigneeName: 1, assignerName: 1, "customFields.assignerName": 1 } }).toArray(),
          sDb ? sDb.collection("Task").find({ title: "📂 Account Handling" }, { projection: { assigneeName: 1, assignerName: 1, "customFields.assignerName": 1 } }).toArray() : []
        ]);

        const optAssignees = new Set<string>();
        const optAssigners = new Set<string>();

        // Load allowed members from kam_report_teams configuration if exists
        let allowedMembersSet: Set<string> | null = null;
        try {
          const teamDoc = await pDb.collection("SystemSettings").findOne({ key: "kam_report_teams" });
          if (teamDoc && Array.isArray(teamDoc.teams) && teamDoc.teams.length > 0) {
            allowedMembersSet = new Set<string>();
            teamDoc.teams.forEach((tm: any) => {
              (tm.members || []).forEach((m: string) => {
                if (m && m.trim()) allowedMembersSet!.add(m.trim().toLowerCase());
              });
            });
          }
        } catch (err) {
          console.warn("Could not check kam_report_teams in filter options:", err);
        }

        [...pTasks, ...sTasks].forEach(t => {
          if (t.assigneeName) {
            t.assigneeName.split(",").forEach((n: string) => {
              const tr = n.trim();
              if (tr && tr !== "—" && tr !== "-") {
                if (!allowedMembersSet || allowedMembersSet.has(tr.toLowerCase())) {
                  optAssignees.add(tr);
                }
              }
            });
          }
          const a1 = (t.assignerName || "").trim();
          if (a1 && a1 !== "—" && a1 !== "-") {
            if (!allowedMembersSet || allowedMembersSet.has(a1.toLowerCase())) {
              optAssigners.add(a1);
            }
          }
          const a2 = (t.customFields?.assignerName || "").trim();
          if (a2 && a2 !== "—" && a2 !== "-") {
            if (!allowedMembersSet || allowedMembersSet.has(a2.toLowerCase())) {
              optAssigners.add(a2);
            }
          }
        });

        filterOptions = {
          assignees: Array.from(optAssignees).sort(),
          assigners: Array.from(optAssigners).sort(),
        };
        cachedFilterOptions = filterOptions;
        lastFilterOptionsTime = nowTs;
      }
    } catch (optErr) {
      console.warn("Could not load full filterOptions:", optErr);
    }

    return NextResponse.json({
      tasks: enrichedTasks,
      filterOptions,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error("❌ Failed to fetch Account Handling tasks:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}