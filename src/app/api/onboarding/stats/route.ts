// src/app/api/onboarding/stats/route.ts
// Returns dashboard card counts for onboarding module

import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { auth, getUserDetails } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

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

const ONBOARDING_TITLES = [
  "🍽️ Zomato Onboarding",
  "🍔 Swiggy Onboarding",
  "🍽️🍔 Zomato + Swiggy Combo",
  "🧾 Food License",
  "📸 Photo Upload",
];

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

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, dbUser } = await getUserRole(userId);
    const isPrivileged = role === "admin" || role === "master";
    const isTL = role === "tl" || (dbUser as any)?.isTeamLeader;

    const client = await getMongoClient();
    const db = client.db();

    // Build role-based filter on Task
    const taskMatch: Record<string, any> = {
      title: { $in: ONBOARDING_TITLES },
    };

    if (!isPrivileged && !isTL) {
      // Normal user / Seller: created by them OR assigned to them
      taskMatch.$or = [
        { assigneeId: userId },
        { assigneeIds: userId },
        { assignerId: userId },
        { createdByClerkId: userId },
      ];
    } else if (isTL) {
      // TL: see their own + team members' tasks
      const members = await prisma.user.findMany({
        where: { leaderIds: { has: userId } } as any,
        select: { clerkId: true },
      });
      const memberIds = [userId, ...members.map((m) => m.clerkId)];
      taskMatch.$or = [
        { assigneeId: { $in: memberIds } },
        { assigneeIds: { $in: memberIds } },
        { assignerId: { $in: memberIds } },
        { createdByClerkId: { $in: memberIds } },
      ];
    }

    // Total onboarding tasks for this user's scope
    const totalTasks = await db.collection("Task").countDocuments(taskMatch);

    // Aggregate onboarding records joined with user's scoped tasks
    const statsAgg = await db
      .collection("Task")
      .aggregate([
        { $match: taskMatch },
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
            as: "obRecord",
          },
        },
        {
          $unwind: {
            path: "$obRecord",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: {
              accountStatus: "$obRecord.accountStatus",
              platform: "$obRecord.platform",
              hasRecord: { $cond: [{ $ifNull: ["$obRecord._id", false] }, true, false] },
            },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const statusMap: Record<string, number> = {};
    const platformMap: Record<string, number> = {};
    let totalRecords = 0;

    statsAgg.forEach((item) => {
      const { accountStatus, platform, hasRecord } = item._id;
      if (hasRecord) {
        totalRecords += item.count;
        const status = accountStatus || "Pending";
        statusMap[status] = (statusMap[status] || 0) + item.count;

        const plat = platform || "Other";
        platformMap[plat] = (platformMap[plat] || 0) + item.count;
      }
    });

    // Count by category (title) within user's scoped tasks
    const categoryAgg = await db
      .collection("Task")
      .aggregate([
        { $match: taskMatch },
        { $group: { _id: "$title", count: { $sum: 1 } } },
      ])
      .toArray();

    const categoryMap: Record<string, number> = {};
    categoryAgg.forEach((c) => {
      categoryMap[c._id] = c.count;
    });

    const pending = totalTasks - totalRecords; // Tasks without onboarding records

    return NextResponse.json({
      totalTasks,
      totalRecords,
      pending: Math.max(0, pending),
      byStatus: {
        pending: (statusMap["Pending"] || 0) + Math.max(0, pending),
        inProgress: statusMap["In Progress"] || 0,
        live: statusMap["Live"] || 0,
        complete: statusMap["Complete"] || 0,
        duplicate: statusMap["Duplicate"] || 0,
        manualUploaded: statusMap["Manual Uploaded"] || 0,
        rejected: statusMap["Rejected"] || 0,
      },
      byPlatform: platformMap,
      byCategory: categoryMap,
    });
  } catch (err) {
    console.error("❌ [Onboarding Stats] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

