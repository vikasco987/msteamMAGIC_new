// src/app/api/onboarding/export/route.ts
// Export onboarding data as Excel

import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { auth, getUserDetails } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

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
  "🛵 Toing Onboarding",
  "🛍️ Ownly Onboarding",
  "🍽️🍔 Zomato + Swiggy Combo",
  "🧾 Food License",
  "📸 Photo Upload",
];

async function getUserRole(userId: string) {
  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  // If role is present in local MongoDB User, use it directly (saves 600-800ms Clerk HTTP round-trip)
  if (dbUser?.role) {
    return { role: String(dbUser.role).toLowerCase(), dbUser };
  }
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

    const { role } = await getUserRole(userId);
    // User requirement: "mast role can export whole" (only master or admin can export)
    if (role !== "master" && role !== "admin") {
      return NextResponse.json(
        { error: "Access Denied: Only Master role can export onboarding data." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const assigneeFilter = searchParams.get("assignee") || "";
    const assignerFilter = searchParams.get("assigner") || "";
    const accountStatusFilter = searchParams.get("accountStatus") || "";
    const titleFilter = searchParams.get("title") || "";

    const client = await getMongoClient();
    const db = client.db();

    const taskFilter: Record<string, any> = {
      title: { $in: ONBOARDING_TITLES },
    };
    if (titleFilter && titleFilter !== "All") {
      const titleList = titleFilter
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const matched = ONBOARDING_TITLES.filter((t) =>
        titleList.some((target) => t.toLowerCase().includes(target))
      );
      if (matched.length > 0) taskFilter.title = { $in: matched };
    }
    if (assigneeFilter) {
      const assigneeList = assigneeFilter
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (assigneeList.length === 1) {
        taskFilter.assigneeName = { $regex: assigneeList[0], $options: "i" };
      } else if (assigneeList.length > 1) {
        taskFilter.assigneeName = {
          $in: assigneeList.map((a) => new RegExp(`^${a}$`, "i")),
        };
      }
    }
    if (assignerFilter) {
      const assignerList = assignerFilter
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (assignerList.length === 1) {
        taskFilter.assignerName = { $regex: assignerList[0], $options: "i" };
      } else if (assignerList.length > 1) {
        taskFilter.assignerName = {
          $in: assignerList.map((a) => new RegExp(`^${a}$`, "i")),
        };
      }
    }

    const tasks = await db
      .collection("Task")
      .find(taskFilter, {
        projection: {
          _id: 1,
          title: 1,
          shopName: 1,
          customerName: 1,
          phone: 1,
          assigneeName: 1,
          assignerName: 1,
          status: 1,
          createdAt: 1,
          customFields: 1,
          restId: 1,
        },
      })
      .sort({ createdAt: -1 })
      .toArray();

    const taskIds = tasks.map((t) => t._id.toString());

    const obFilter: Record<string, any> = { taskId: { $in: taskIds } };
    if (accountStatusFilter && accountStatusFilter !== "All") {
      const statusList = accountStatusFilter
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (statusList.length === 1) {
        obFilter.accountStatus = statusList[0];
      } else if (statusList.length > 1) {
        obFilter.accountStatus = { $in: statusList };
      }
    }

    const records = await db.collection("OnboardingRecord").find(obFilter).toArray();
    const obMap: Record<string, any> = {};
    records.forEach((r) => { obMap[r.taskId] = r; });

    // Build rows
    const rows = tasks.map((task, idx) => {
      const tid = task._id.toString();
      const ob = obMap[tid] || {};
      const cf = (task.customFields as any) || {};
      return {
        "S.No": idx + 1,
        "Task Created Date": task.createdAt
          ? new Date(task.createdAt).toLocaleDateString("en-IN")
          : "",
        "Restaurant Name": task.shopName || cf.shopName || "",
        "Task Category": (task.title || "").replace(/^[^\w]*/, "").trim(),
        "Customer Name": task.customerName || cf.customerName || "",
        "Phone No": task.phone || cf.phone || "",
        "Assigned By": task.assignerName || cf.assignerName || "",
        "Assigned To": task.assigneeName || "",
        "Task Status": task.status || "",
        "Swiggy Restaurant ID": ob.swiggyRestaurantId || cf.swiggyRestaurantId || "",
        "Zomato Restaurant ID": ob.zomatoRestaurantId || cf.zomatoRestaurantId || "",
        "Account Status": ob.accountStatus || "Pending",
        "Platform": ob.platform || "",
        "Outlet Created": ob.outletCreated || "Pending",
        "Remarks": ob.remarks || "",
      };
    });

    // Create Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Onboarding");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new Response(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="onboarding_export_${Date.now()}.xlsx"`,
      },
    });
  } catch (err) {
    console.error("❌ [Onboarding Export] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

