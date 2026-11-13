// src/app/api/onboarding/route.ts
// Onboarding Management Module — Main API Route
// Handles GET (list with server-side filtering + pagination) and POST (upsert record)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MongoClient, ObjectId } from "mongodb";
import { auth, getUserDetails } from "@/lib/auth-utils";

// ─── MongoDB client helpers ───────────────────────────────────────────────────
let cachedClient: MongoClient | null = null;

async function getMongoClient() {
  if (cachedClient) return cachedClient;
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error("DATABASE_URL is not defined");
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

// ─── Onboarding task title patterns ───────────────────────────────────────────
const ONBOARDING_TITLES = [
  "🍽️ Zomato Onboarding",
  "🍔 Swiggy Onboarding",
  "🍽️🍔 Zomato + Swiggy Combo",
  "🧾 Food License",
  "📸 Photo Upload",
];

// ─── Helper: get user role ─────────────────────────────────────────────────────
async function getUserRole(userId: string) {
  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  let roleFromClerk: string | undefined;
  try {
    if (!userId.startsWith("custom_")) {
      const clerkUser = await getUserDetails(userId);
      if (clerkUser) {
        roleFromClerk =
          (clerkUser.publicMetadata as any)?.role ||
          (clerkUser.privateMetadata as any)?.role;
      }
    }
  } catch {}
  const role = String(
    roleFromClerk || dbUser?.role || "user"
  ).toLowerCase();
  return { role, dbUser };
}

// ─── GET — list onboarding records ────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, dbUser } = await getUserRole(userId);
    const isPrivileged = role === "admin" || role === "master";
    const isTL = role === "tl" || (dbUser as any)?.isTeamLeader;
    const isSeller = role === "seller";

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const skip = (page - 1) * limit;

    // Filters
    const query = searchParams.get("query") || "";
    const titleFilter = searchParams.get("title") || ""; // e.g. "Zomato Onboarding"
    const assigneeFilter = searchParams.get("assignee") || "";
    const assignerFilter = searchParams.get("assigner") || "";
    const accountStatusFilter = searchParams.get("accountStatus") || "";
    const platformFilter = searchParams.get("platform") || "";
    const outletCreatedFilter = searchParams.get("outletCreated") || "";
    const isReOnboardingFilter = searchParams.get("isReOnboarding") || "";
    const timeElapsedFilter = searchParams.get("timeElapsed") || "";
    const timelineSlaFilter = searchParams.get("timelineSla") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const sortKey = searchParams.get("sortKey") || "createdAt";
    const sortDir = searchParams.get("sortDir") === "asc" ? 1 : -1;

    const client = await getMongoClient();
    const db = client.db();
    const taskCol = db.collection("Task");
    const obCol = db.collection("OnboardingRecord");

    // ─── Build MongoDB task filter ────────────────────────────────────────────
    const taskFilter: Record<string, any> = {
      title: { $in: ONBOARDING_TITLES },
    };

    // Role-based restriction
    if (!isPrivileged && !isTL) {
      // Seller / user: only tasks where they are assignee or assigner
      taskFilter.$or = [
        { assigneeId: userId },
        { assigneeIds: userId },
        { assignerId: userId },
        { createdByClerkId: userId },
      ];
    } else if (isTL) {
      // TL: see tasks where they or their team members are assignee/assigner
      const members = await prisma.user.findMany({
        where: { leaderIds: { has: userId } } as any,
        select: { clerkId: true },
      });
      const memberIds = [userId, ...members.map((m) => m.clerkId)];
      taskFilter.$or = [
        { assigneeId: { $in: memberIds } },
        { assigneeIds: { $in: memberIds } },
        { assignerId: { $in: memberIds } },
        { createdByClerkId: { $in: memberIds } },
      ];
    }

    // Title filter (category, supports comma-separated list)
    if (titleFilter && titleFilter !== "All") {
      const titleList = titleFilter
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const matchedTitles = ONBOARDING_TITLES.filter((t) =>
        titleList.some((target) => t.toLowerCase().includes(target))
      );
      if (matchedTitles.length > 0) {
        taskFilter.title = { $in: matchedTitles };
      }
    }

    // Assignee filter (supports single or comma-separated list)
    if (assigneeFilter) {
      const assigneeList = assigneeFilter
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (assigneeList.length === 1) {
        taskFilter.assigneeName = {
          $regex: assigneeList[0],
          $options: "i",
        };
      } else if (assigneeList.length > 1) {
        taskFilter.assigneeName = {
          $in: assigneeList.map((a) => new RegExp(`^${a}$`, "i")),
        };
      }
    }

    // Assigner filter (supports single or comma-separated list of assigners)
    if (assignerFilter) {
      const assignerList = assignerFilter
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (assignerList.length === 1) {
        taskFilter.assignerName = {
          $regex: assignerList[0],
          $options: "i",
        };
      } else if (assignerList.length > 1) {
        taskFilter.assignerName = {
          $in: assignerList.map((a) => new RegExp(`^${a}$`, "i")),
        };
      }
    }

    // Date range filter (task createdAt)
    if (dateFrom || dateTo) {
      taskFilter.createdAt = {};
      if (dateFrom) taskFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        taskFilter.createdAt.$lte = end;
      }
    }

    // Time Elapsed filter (task age calculated from now)
    if (timeElapsedFilter && timeElapsedFilter !== "All") {
      const elapsedList = timeElapsedFilter
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const now = new Date();
      const elapsedOrConditions: any[] = [];

      elapsedList.forEach((filterVal) => {
        if (filterVal === "today") {
          // Under 24h
          const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          elapsedOrConditions.push({ createdAt: { $gte: since } });
        } else if (filterVal === "1-2days") {
          // 24h to 48h
          const from = new Date(now.getTime() - 48 * 60 * 60 * 1000);
          const to = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          elapsedOrConditions.push({ createdAt: { $gte: from, $lt: to } });
        } else if (filterVal === "3-5days") {
          // 3 to 5 days
          const from = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
          const to = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
          elapsedOrConditions.push({ createdAt: { $gte: from, $lt: to } });
        } else if (filterVal === "6-10days") {
          // 6 to 10 days
          const from = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
          const to = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
          elapsedOrConditions.push({ createdAt: { $gte: from, $lt: to } });
        } else if (filterVal === "11-20days") {
          // 11 to 20 days
          const from = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
          const to = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
          elapsedOrConditions.push({ createdAt: { $gte: from, $lt: to } });
        } else if (filterVal === "20plus") {
          // 20+ days
          const cutoff = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
          elapsedOrConditions.push({ createdAt: { $lt: cutoff } });
        }
      });

      if (elapsedOrConditions.length > 0) {
        taskFilter.$and = taskFilter.$and || [];
        taskFilter.$and.push({ $or: elapsedOrConditions });
      }
    }

    // Timeline SLA filter
    if (timelineSlaFilter && timelineSlaFilter !== "All") {
      const slaList = timelineSlaFilter
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const now = new Date();
      const slaOrConditions: any[] = [];

      // Helper for deadline cutoff per task category:
      // FSSAI/License = 24h, Zomato/Swiggy = 72h, Other = 48h
      const categories = [
        { regex: /fssai|license|licence/i, hours: 24 },
        { regex: /zomato|swiggy/i, hours: 72 },
        { regex: /.*/, hours: 48 }, // fallback
      ];

      slaList.forEach((slaVal) => {
        if (slaVal === "completed") {
          slaOrConditions.push({ status: "done" });
        } else if (slaVal === "overdue") {
          // Overdue means: status != 'done' AND createdAt < (now - slaHours)
          categories.forEach((cat) => {
            const cutoff = new Date(now.getTime() - cat.hours * 60 * 60 * 1000);
            slaOrConditions.push({
              title: { $regex: cat.regex },
              status: { $ne: "done" },
              createdAt: { $lt: cutoff },
            });
          });
        } else if (slaVal === "urgent") {
          // Urgent: status != 'done' AND remaining <= 12 hours (i.e. createdAt between (now - slaHours) and (now - slaHours + 12h))
          categories.forEach((cat) => {
            const minCreated = new Date(now.getTime() - cat.hours * 60 * 60 * 1000);
            const maxCreated = new Date(now.getTime() - (cat.hours - 12) * 60 * 60 * 1000);
            slaOrConditions.push({
              title: { $regex: cat.regex },
              status: { $ne: "done" },
              createdAt: { $gte: minCreated, $lte: maxCreated },
            });
          });
        } else if (slaVal === "on-track") {
          // On Track / Within SLA: status != 'done' AND createdAt >= (now - slaHours)
          categories.forEach((cat) => {
            const cutoff = new Date(now.getTime() - cat.hours * 60 * 60 * 1000);
            slaOrConditions.push({
              title: { $regex: cat.regex },
              status: { $ne: "done" },
              createdAt: { $gte: cutoff },
            });
          });
        }
      });

      if (slaOrConditions.length > 0) {
        taskFilter.$and = taskFilter.$and || [];
        taskFilter.$and.push({ $or: slaOrConditions });
      }
    }

    // Text search (shopName, customerName, phone)
    if (query) {
      taskFilter.$and = taskFilter.$and || [];
      taskFilter.$and.push({
        $or: [
          { shopName: { $regex: query, $options: "i" } },
          { customerName: { $regex: query, $options: "i" } },
          { phone: { $regex: query, $options: "i" } },
          { assigneeName: { $regex: query, $options: "i" } },
        ],
      });
    }

    // ─── Build MongoDB Aggregation Pipeline ──────────────────────────────────
    // Step 1: Base match on Task collection
    const pipeline: any[] = [{ $match: taskFilter }];

    const hasObFilter =
      (accountStatusFilter && accountStatusFilter !== "All") ||
      (platformFilter && platformFilter !== "All") ||
      (outletCreatedFilter && outletCreatedFilter !== "All") ||
      isReOnboardingFilter !== "";

    // If onboarding-specific filters are active, we must join OnboardingRecord before pagination
    if (hasObFilter) {
      pipeline.push(
        {
          $lookup: {
            from: "OnboardingRecord",
            let: { tid: "$_id", tidStr: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$taskId", "$$tid"] },
                      { $eq: ["$taskId", "$$tidStr"] },
                    ],
                  },
                },
              },
            ],
            as: "obData",
          },
        },
        {
          $addFields: {
            obRecord: { $arrayElemAt: ["$obData", 0] },
          },
        }
      );

      // Match onboarding-specific filters at database level
      const obMatch: Record<string, any> = {};
      if (accountStatusFilter && accountStatusFilter !== "All") {
        const statusList = accountStatusFilter
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        if (statusList.length === 1) {
          if (statusList[0] === "Pending") {
            obMatch.$or = [
              { "obRecord.accountStatus": "Pending" },
              { obRecord: { $exists: false } },
              { "obRecord.accountStatus": { $exists: false } },
            ];
          } else {
            obMatch["obRecord.accountStatus"] = statusList[0];
          }
        } else if (statusList.length > 1) {
          const hasPending = statusList.includes("Pending");
          if (hasPending) {
            obMatch.$or = [
              { "obRecord.accountStatus": { $in: statusList } },
              { obRecord: { $exists: false } },
              { "obRecord.accountStatus": { $exists: false } },
            ];
          } else {
            obMatch["obRecord.accountStatus"] = { $in: statusList };
          }
        }
      }

      if (platformFilter && platformFilter !== "All") {
        const platformList = platformFilter
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        if (platformList.length === 1) {
          obMatch.$or = [
            { "obRecord.platform": platformList[0] },
            { title: { $regex: platformList[0], $options: "i" } },
          ];
        } else if (platformList.length > 1) {
          obMatch.$or = [
            { "obRecord.platform": { $in: platformList } },
            {
              $or: platformList.map((p) => ({
                title: { $regex: p, $options: "i" },
              })),
            },
          ];
        }
      }

      if (outletCreatedFilter && outletCreatedFilter !== "All") {
        const outletList = outletCreatedFilter
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        if (outletList.length === 1) {
          if (outletList[0] === "Pending") {
            obMatch.$or = [
              { "obRecord.outletCreated": "Pending" },
              { obRecord: { $exists: false } },
              { "obRecord.outletCreated": { $exists: false } },
            ];
          } else {
            obMatch["obRecord.outletCreated"] = outletList[0];
          }
        } else if (outletList.length > 1) {
          const hasPending = outletList.includes("Pending");
          if (hasPending) {
            obMatch.$or = [
              { "obRecord.outletCreated": { $in: outletList } },
              { obRecord: { $exists: false } },
              { "obRecord.outletCreated": { $exists: false } },
            ];
          } else {
            obMatch["obRecord.outletCreated"] = { $in: outletList };
          }
        }
      }

      if (isReOnboardingFilter !== "") {
        obMatch["obRecord.isReOnboarding"] = isReOnboardingFilter === "true";
      }

      if (Object.keys(obMatch).length > 0) {
        pipeline.push({ $match: obMatch });
      }
    }

    // Step 2: Sorting and Pagination with Facet (extracting total count, dynamic filter options, and paginated records)
    const sortField =
      sortKey === "createdAt" ? "createdAt" : sortKey === "shopName" ? "shopName" : "createdAt";

    const dataStages: any[] = [
      { $sort: { [sortField]: sortDir } },
      { $skip: skip },
      { $limit: limit },
    ];

    // If we didn't join OnboardingRecord earlier, join it now ONLY for the paginated 10 records
    if (!hasObFilter) {
      dataStages.push(
        {
          $lookup: {
            from: "OnboardingRecord",
            let: { tid: "$_id", tidStr: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$taskId", "$$tid"] },
                      { $eq: ["$taskId", "$$tidStr"] },
                    ],
                  },
                },
              },
            ],
            as: "obData",
          },
        },
        {
          $addFields: {
            obRecord: { $arrayElemAt: ["$obData", 0] },
          },
        }
      );
    }

    dataStages.push({
      $project: {
        _id: 1,
        title: 1,
        shopName: 1,
        customerName: 1,
        phone: 1,
        assigneeName: 1,
        assignerName: 1,
        assigneeId: 1,
        assignerId: 1,
        createdAt: 1,
        status: 1,
        customFields: 1,
        restId: 1,
        obRecord: 1,
      },
    });

    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        filterOptions: [
          {
            $group: {
              _id: null,
              assignees: { $addToSet: "$assigneeName" },
              assigners: { $addToSet: "$assignerName" },
            },
          },
        ],
        data: dataStages,
      },
    });

    const aggResult = await taskCol.aggregate(pipeline).toArray();
    const facetData = aggResult[0] || { metadata: [], data: [], filterOptions: [] };
    const totalCount = facetData.metadata[0]?.total || 0;
    const rawTasks = facetData.data || [];

    // Extract filter option names computed in the same pipeline pass
    const filterOptionsGroup = facetData.filterOptions?.[0] || {};
    const assigneeNames: string[] = filterOptionsGroup.assignees || [];
    const assignerNames: string[] = filterOptionsGroup.assigners || [];

    // Step 3: Efficient Batch Fetch of recent notes only for the paginated tasks
    const pageTaskIds = rawTasks.map((t: any) => t._id);
    const pageTaskIdsStr = pageTaskIds.map((id: any) => id.toString());
    
    let taskNotesMap: Record<string, any[]> = {};
    if (pageTaskIds.length > 0) {
      const recentNotes = await db
        .collection("Note")
        .find({
          taskId: { $in: [...pageTaskIds, ...pageTaskIdsStr] },
        })
        .sort({ createdAt: -1 })
        .toArray();

      for (const note of recentNotes) {
        const tidStr = note.taskId?.toString();
        if (!tidStr) continue;
        if (!taskNotesMap[tidStr]) {
          taskNotesMap[tidStr] = [];
        }
        if (taskNotesMap[tidStr].length < 3) {
          taskNotesMap[tidStr].push({
            id: note._id?.toString(),
            content: note.content || "",
            authorName: note.authorName || "Anonymous",
            authorEmail: note.authorEmail || "",
            fileUrl: note.fileUrl || null,
            createdAt: note.createdAt,
          });
        }
      }
    }

    // ─── Merge task + onboarding record ───────────────────────────────────────
    const enriched = rawTasks.map((task: any) => {
      const tid = task._id.toString();
      const ob = task.obRecord || {};
      const cf = (task.customFields as any) || {};
      return {
        id: tid,
        taskId: tid,
        title: task.title,
        shopName: task.shopName || cf.shopName || "",
        customerName: task.customerName || cf.customerName || "",
        phone: task.phone || cf.phone || "",
        assigneeName: task.assigneeName || "",
        assignerName: task.assignerName || cf.assignerName || "",
        taskStatus: task.status || "",
        createdAt: task.createdAt,
        // Onboarding record fields
        onboardingId: ob._id?.toString() || null,
        taskStartDate: ob.taskStartDate || cf.startDate || "",
        fssaiNumber: ob.fssaiNumber || "",
        restaurantId: ob.restaurantId || task.restId || cf.restId || "",
        swiggyRestaurantId: ob.swiggyRestaurantId || cf.swiggyRestaurantId || "",
        zomatoRestaurantId: ob.zomatoRestaurantId || cf.zomatoRestaurantId || "",
        isReOnboarding: ob.isReOnboarding ?? false,
        onboardedBy: ob.onboardedBy || task.assigneeName || "",
        accountStatus: ob.accountStatus || "Pending",
        platform: ob.platform || derivePlatform(task.title),
        outletCreated: ob.outletCreated || "Pending",
        remarks: ob.remarks || "",
        hasRecord: !!ob._id,
        // Team Board Notes / Remarks
        recentNotes: taskNotesMap[tid] || [],
      };
    });

    return NextResponse.json({
      tasks: enriched,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      filterOptions: {
        titles: ONBOARDING_TITLES.map((t) => t.replace(/^[^\w]*/, "").trim()),
        assignees: assigneeNames
          .filter((n): n is string => !!n && n !== "—")
          .sort(),
        assigners: assignerNames
          .filter((n): n is string => !!n && n !== "—")
          .sort(),
        accountStatuses: [
          "ACCOUNT LIVE",
          "COMPLETE",
          "DUPLICATE LISTING",
          "Menu updated",
          "VAITING FOR APPROVEL",
          "WORK IN MANU",
          "Menu pending",
          "Re--Onboarding",
          "Cretical",
          "Hold From Customer side",
          "Cx Onboarding not willing to pay",
          "Pending",
        ],
        platforms: [
          "Swiggy and Zomato combo",
          "Swiggy",
          "Zomato",
          "Rapido",
          "Only",
          "Toing",
          "FSSAI",
          "Other",
        ],
        outletCreatedOptions: ["Pending", "Yes", "No"],
      },
    });
  } catch (err) {
    console.error("❌ [Onboarding GET] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── Helper: derive platform from task title ───────────────────────────────────
function derivePlatform(title: string): string {
  if (!title) return "";
  const t = title.toLowerCase();
  if (t.includes("swiggy") && t.includes("zomato")) return "Swiggy and Zomato combo";
  if (t.includes("zomato")) return "Zomato";
  if (t.includes("swiggy")) return "Swiggy";
  if (t.includes("rapido")) return "Rapido";
  if (t.includes("toing")) return "Toing";
  if (t.includes("only") || t.includes("ownly")) return "Only";
  if (t.includes("license") || t.includes("fssai")) return "FSSAI";
  return "Other";
}

// ─── POST — upsert onboarding record fields ───────────────────────────────────
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { taskId, ...fields } = body;

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    // Verify task exists and is an onboarding task
    const client = await getMongoClient();
    const db = client.db();
    const task = await db.collection("Task").findOne({
      _id: new ObjectId(taskId),
      title: { $in: ONBOARDING_TITLES },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found or not an onboarding task" },
        { status: 404 }
      );
    }

    // Allowed onboarding fields (never touch task source fields)
    const allowedFields = [
      "taskStartDate",
      "fssaiNumber",
      "restaurantId",
      "swiggyRestaurantId",
      "zomatoRestaurantId",
      "isReOnboarding",
      "onboardedBy",
      "accountStatus",
      "platform",
      "outletCreated",
      "remarks",
    ];

    const safeFields: Record<string, any> = {};
    for (const f of allowedFields) {
      if (f in fields) safeFields[f] = fields[f];
    }

    // Upsert
    const { role, dbUser } = await getUserRole(userId);
    const userName = (dbUser as any)?.name || userId;

    const existing = await prisma.onboardingRecord.findUnique({
      where: { taskId },
    });

    let record;
    if (existing) {
      // Build audit log entries for changed fields
      const auditEntries = [];
      for (const [key, newVal] of Object.entries(safeFields)) {
        const oldVal = (existing as any)[key];
        if (String(oldVal) !== String(newVal)) {
          auditEntries.push({
            onboardingId: existing.id,
            taskId,
            fieldName: key,
            oldValue: oldVal != null ? String(oldVal) : null,
            newValue: newVal != null ? String(newVal) : null,
            changedBy: userId,
            changedByName: userName,
          });
        }
      }

      record = await prisma.onboardingRecord.update({
        where: { taskId },
        data: { ...safeFields, updatedBy: userId },
      });

      // Create audit logs
      if (auditEntries.length > 0) {
        await prisma.onboardingAuditLog.createMany({ data: auditEntries });
      }
    } else {
      record = await prisma.onboardingRecord.create({
        data: {
          taskId,
          ...safeFields,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    return NextResponse.json({ success: true, record });
  } catch (err) {
    console.error("❌ [Onboarding POST] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

