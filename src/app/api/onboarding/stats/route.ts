// src/app/api/onboarding/stats/route.ts
// Returns dashboard card counts for onboarding module

import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { auth } from "@/lib/auth-utils";
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

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await getMongoClient();
    const db = client.db();

    // Total onboarding tasks
    const totalTasks = await db
      .collection("Task")
      .countDocuments({ title: { $in: ONBOARDING_TITLES } });

    // Count onboarding records by accountStatus
    const statusAgg = await db
      .collection("OnboardingRecord")
      .aggregate([
        {
          $group: {
            _id: "$accountStatus",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const statusMap: Record<string, number> = {};
    statusAgg.forEach((s) => {
      statusMap[s._id || "Pending"] = s.count;
    });

    // Count by platform
    const platformAgg = await db
      .collection("OnboardingRecord")
      .aggregate([
        {
          $group: {
            _id: "$platform",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const platformMap: Record<string, number> = {};
    platformAgg.forEach((p) => {
      platformMap[p._id || "Other"] = p.count;
    });

    // Count by category (title)
    const categoryAgg = await db
      .collection("Task")
      .aggregate([
        { $match: { title: { $in: ONBOARDING_TITLES } } },
        { $group: { _id: "$title", count: { $sum: 1 } } },
      ])
      .toArray();

    const categoryMap: Record<string, number> = {};
    categoryAgg.forEach((c) => {
      categoryMap[c._id] = c.count;
    });

    const totalRecords = await db.collection("OnboardingRecord").countDocuments();
    const pending = totalTasks - totalRecords; // Tasks without onboarding records

    return NextResponse.json({
      totalTasks,
      totalRecords,
      pending: Math.max(0, pending),
      byStatus: {
        pending: statusMap["Pending"] || 0,
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

