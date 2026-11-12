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

    // Title filter (category)
    if (titleFilter && titleFilter !== "All") {
      // Find exact title that contains the filter value
      const matchedTitles = ONBOARDING_TITLES.filter((t) =>
        t.toLowerCase().includes(titleFilter.toLowerCase())
      );
      if (matchedTitles.length > 0) {
        taskFilter.title = { $in: matchedTitles };
      }
    }

    // Assignee filter
    if (assigneeFilter) {
      taskFilter.assigneeName = {
        $regex: assigneeFilter.trim(),
        $options: "i",
      };
    }

    // Assigner filter
    if (assignerFilter) {
      taskFilter.assignerName = {
        $regex: assignerFilter.trim(),
        $options: "i",
      };
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

    // ─── Fetch tasks from MongoDB ─────────────────────────────────────────────
    const sortField =
      sortKey === "createdAt" ? "createdAt" : sortKey === "shopName" ? "shopName" : "createdAt";

    const [tasks, totalTaskCount] = await Promise.all([
      taskCol
        .find(taskFilter, {
          projection: {
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
          },
        })
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .toArray(),
      taskCol.countDocuments(taskFilter),
    ]);

    // ─── Fetch onboarding records for these tasks ─────────────────────────────
    const taskIds = tasks.map((t) => t._id.toString());
    let obRecords: Record<string, any> = {};

    if (taskIds.length > 0) {
      const obFilter: Record<string, any> = {
        taskId: { $in: taskIds },
      };
      // Apply onboarding-specific filters
      if (accountStatusFilter && accountStatusFilter !== "All") {
        obFilter.accountStatus = accountStatusFilter;
      }
      if (platformFilter && platformFilter !== "All") {
        obFilter.platform = platformFilter;
      }
      if (outletCreatedFilter && outletCreatedFilter !== "All") {
        obFilter.outletCreated = outletCreatedFilter;
      }
      if (isReOnboardingFilter !== "") {
        obFilter.isReOnboarding = isReOnboardingFilter === "true";
      }

      const records = await obCol.find(obFilter).toArray();
      records.forEach((r) => {
        obRecords[r.taskId] = r;
      });
    }

    // ─── Merge task + onboarding record ───────────────────────────────────────
    const enriched = tasks.map((task) => {
      const tid = task._id.toString();
      const ob = obRecords[tid] || {};
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
        isReOnboarding: ob.isReOnboarding ?? false,
        onboardedBy: ob.onboardedBy || task.assigneeName || "",
        accountStatus: ob.accountStatus || "Pending",
        platform: ob.platform || derivePlatform(task.title),
        outletCreated: ob.outletCreated || "Pending",
        remarks: ob.remarks || "",
        hasRecord: !!ob._id,
      };
    });

    // ─── If onboarding-specific filters applied, filter merged results ─────────
    // (Already filtered at DB level above when taskIds known)

    // ─── Filter options ───────────────────────────────────────────────────────
    const [assigneeNames, assignerNames] = await Promise.all([
      taskCol
        .distinct("assigneeName", { title: { $in: ONBOARDING_TITLES } }),
      taskCol
        .distinct("assignerName", { title: { $in: ONBOARDING_TITLES } }),
    ]);

    return NextResponse.json({
      tasks: enriched,
      pagination: {
        total: totalTaskCount,
        page,
        limit,
        totalPages: Math.ceil(totalTaskCount / limit),
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
          "Pending",
          "In Progress",
          "Live",
          "Complete",
          "Duplicate",
          "Manual Uploaded",
          "Rejected",
        ],
        platforms: ["Zomato", "Swiggy", "Both", "Other"],
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
  if (title.includes("Swiggy") && title.includes("Zomato")) return "Both";
  if (title.includes("Zomato")) return "Zomato";
  if (title.includes("Swiggy")) return "Swiggy";
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

