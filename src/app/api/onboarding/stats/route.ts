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
    const isMaster = role === "master";
    const isAdmin = role === "admin";
    const isTL = role === "tl" || (dbUser as any)?.isTeamLeader;
    // TL, Admin, and Master see all stats
    const isPrivileged = isMaster || isAdmin || isTL;

    const client = await getMongoClient();
    const db = client.db();

    // Build role-based filter on Task
    const taskMatch: Record<string, any> = {
      title: { $in: ONBOARDING_TITLES },
    };

    if (!isPrivileged) {
      // Normal user / Seller: created by them OR assigned to them
      taskMatch.$or = [
        { assigneeId: userId },
        { assigneeIds: userId },
        { assignerId: userId },
        { createdByClerkId: userId },
      ];
    }

    // Parallelized fast execution: task count, category counts, SLA active tasks, and scoped onboarding records
    const [taskCount, categoryAgg, obRecords, activeTasks] = await Promise.all([
      db.collection("Task").countDocuments(taskMatch),
      db
        .collection("Task")
        .aggregate([
          { $match: taskMatch },
          { $group: { _id: "$title", count: { $sum: 1 } } },
        ])
        .toArray(),
      isPrivileged
        ? db
            .collection("OnboardingRecord")
            .find({}, { projection: { accountStatus: 1, platform: 1, taskId: 1 } })
            .toArray()
        : db
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
                    {
                      $project: { accountStatus: 1, platform: 1 },
                    },
                  ],
                  as: "ob",
                },
              },
              { $unwind: "$ob" },
              { $replaceRoot: { newRoot: "$ob" } },
            ])
            .toArray(),
      // Fetch only not-done tasks for SLA (urgent/overdue) calculation
      db
        .collection("Task")
        .find(
          { ...taskMatch, status: { $ne: "done" } },
          { projection: { createdAt: 1, title: 1, status: 1 } }
        )
        .toArray(),
    ]);

    // SLA Calculation
    const now = Date.now();
    let overdueCount = 0;
    let urgentCount = 0;
    let onTrackCount = 0;

    activeTasks.forEach((t: any) => {
      const created = new Date(t.createdAt).getTime();
      let slaHours = 48;
      const title = (t.title || "").toLowerCase();
      if (title.includes("fssai") || title.includes("food license") || title.includes("license")) {
        slaHours = 24;
      } else if (title.includes("gst") || title.includes("photo")) {
        slaHours = 48;
      } else if (title.includes("zomato") || title.includes("swiggy")) {
        slaHours = 72;
      }

      const targetTime = created + slaHours * 60 * 60 * 1000;
      const remMs = targetTime - now;

      if (remMs <= 0) {
        overdueCount++;
      } else if (remMs <= 12 * 60 * 60 * 1000) {
        urgentCount++;
      } else {
        onTrackCount++;
      }
    });

    const totalTasks = taskCount;
    const totalRecords = obRecords.length;
    const statusMap: Record<string, number> = {};
    const platformMap: Record<string, number> = {};

    obRecords.forEach((ob: any) => {
      const status = ob.accountStatus || "Pending";
      statusMap[status] = (statusMap[status] || 0) + 1;

      const plat = ob.platform || "Other";
      platformMap[plat] = (platformMap[plat] || 0) + 1;
    });

    const categoryMap: Record<string, number> = {};
    categoryAgg.forEach((c) => {
      categoryMap[c._id] = c.count;
    });

    const pending = Math.max(0, totalTasks - totalRecords); // Tasks without onboarding records

    return NextResponse.json({
      totalTasks,
      totalRecords,
      pending,
      byStatus: {
        pending: (statusMap["Pending"] || 0) + pending,
        inProgress: statusMap["In Progress"] || 0,
        live: statusMap["Live"] || 0,
        complete: statusMap["Complete"] || 0,
        duplicate: statusMap["Duplicate"] || 0,
        manualUploaded: statusMap["Manual Uploaded"] || 0,
        rejected: statusMap["Rejected"] || 0,
      },
      sla: {
        overdue: overdueCount,
        urgent: urgentCount,
        onTrack: onTrackCount,
      },
      byPlatform: platformMap,
      byCategory: categoryMap,
    });
  } catch (err) {
    console.error("❌ [Onboarding Stats] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

