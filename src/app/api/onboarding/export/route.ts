// src/app/api/onboarding/export/route.ts
// Export onboarding data as Excel

import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { auth } from "@/lib/auth-utils";
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
      const matched = ONBOARDING_TITLES.filter((t) =>
        t.toLowerCase().includes(titleFilter.toLowerCase())
      );
      if (matched.length > 0) taskFilter.title = { $in: matched };
    }
    if (assigneeFilter)
      taskFilter.assigneeName = { $regex: assigneeFilter, $options: "i" };
    if (assignerFilter)
      taskFilter.assignerName = { $regex: assignerFilter, $options: "i" };

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
      obFilter.accountStatus = accountStatusFilter;
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
        "Task Start Date": ob.taskStartDate || cf.startDate || "",
        "FSSAI Number": ob.fssaiNumber || "",
        "Restaurant ID": ob.restaurantId || task.restId || cf.restId || "",
        "Re-Onboarding": ob.isReOnboarding ? "Yes" : "No",
        "Onboarded By": ob.onboardedBy || "",
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

