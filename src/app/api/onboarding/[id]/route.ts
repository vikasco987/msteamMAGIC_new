// src/app/api/onboarding/[id]/route.ts
// GET single record + PATCH update onboarding fields + GET audit log

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MongoClient, ObjectId } from "mongodb";
import { auth } from "@/lib/auth-utils";
import { getUserDetails } from "@/lib/auth-utils";

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

const ALLOWED_FIELDS = [
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

// GET /api/onboarding/[id]  — id is the TASK id
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: taskId } = await params;

    const client = await getMongoClient();
    const db = client.db();

    // Fetch task
    let taskObjId: ObjectId;
    try {
      taskObjId = new ObjectId(taskId);
    } catch {
      return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
    }

    const task = await db.collection("Task").findOne(
      { _id: taskObjId },
      {
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
      }
    );

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Fetch onboarding record
    const record = await prisma.onboardingRecord.findUnique({
      where: { taskId },
    });

    // Fetch audit log
    const auditLog = await prisma.onboardingAuditLog.findMany({
      where: { taskId },
      orderBy: { changedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      task: {
        id: task._id.toString(),
        title: task.title,
        shopName: task.shopName || "",
        customerName: task.customerName || "",
        phone: task.phone || "",
        assigneeName: task.assigneeName || "",
        assignerName:
          task.assignerName || (task.customFields as any)?.assignerName || "",
        taskStatus: task.status || "",
        createdAt: task.createdAt,
      },
      record,
      auditLog,
    });
  } catch (err) {
    console.error("❌ [Onboarding GET/:id] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/onboarding/[id]  — id is the TASK id
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: taskId } = await params;
    const body = await req.json();

    // Verify task is an onboarding task
    const client = await getMongoClient();
    const db = client.db();
    let taskObjId: ObjectId;
    try {
      taskObjId = new ObjectId(taskId);
    } catch {
      return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
    }

    const task = await db.collection("Task").findOne({
      _id: taskObjId,
      title: { $in: ONBOARDING_TITLES },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found or not an onboarding task" },
        { status: 404 }
      );
    }

    // ─── If taskStatus (Team Board stage) is sent, update Task.status in Task collection ───
    if (body.taskStatus !== undefined) {
      const allowedStages = ["todo", "inprogress", "done"];
      const newStatus = String(body.taskStatus).toLowerCase().trim();
      if (allowedStages.includes(newStatus)) {
        await db.collection("Task").updateOne(
          { _id: taskObjId },
          { $set: { status: newStatus, updatedAt: new Date() } }
        );
      }
    }

    // Extract only allowed fields
    const safeFields: Record<string, any> = {};
    for (const f of ALLOWED_FIELDS) {
      if (f in body) safeFields[f] = body[f];
    }

    // If only taskStatus was updated and no onboarding record fields
    if (Object.keys(safeFields).length === 0 && body.taskStatus !== undefined) {
      return NextResponse.json({ success: true, updatedTaskStatus: body.taskStatus });
    }

    if (Object.keys(safeFields).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Get user name
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    let userName = dbUser?.name || userId;
    try {
      if (!userId.startsWith("custom_")) {
        const clerkUser = await getUserDetails(userId);
        if (clerkUser) {
          userName =
            `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
            clerkUser.username ||
            userName;
        }
      }
    } catch {}

    // Upsert
    const existing = await prisma.onboardingRecord.findUnique({
      where: { taskId },
    });

    let record;
    const auditEntries: any[] = [];

    if (existing) {
      // Build audit
      for (const [key, newVal] of Object.entries(safeFields)) {
        const oldVal = (existing as any)[key];
        if (String(oldVal ?? "") !== String(newVal ?? "")) {
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
    } else {
      record = await prisma.onboardingRecord.create({
        data: {
          taskId,
          ...safeFields,
          createdBy: userId,
          updatedBy: userId,
        },
      });
      // Log creation
      auditEntries.push({
        onboardingId: record.id,
        taskId,
        fieldName: "record",
        oldValue: null,
        newValue: "created",
        changedBy: userId,
        changedByName: userName,
      });
    }

    if (auditEntries.length > 0) {
      await prisma.onboardingAuditLog.createMany({ data: auditEntries });
    }

    return NextResponse.json({ success: true, record });
  } catch (err) {
    console.error("❌ [Onboarding PATCH/:id] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

