import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Extract role and email from Clerk session claims
  const role = (sessionClaims?.role as string) || "SELLER";
  const email = (sessionClaims?.email as string) || "";

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const limit = parseInt(searchParams.get("limit") || "10");
  const page = parseInt(searchParams.get("page") || "1");
  const skip = (page - 1) * limit;
  const assigneeId = searchParams.get("assigneeId");
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const progressFilter = searchParams.get("progress"); // e.g. "0", "in_progress", "100"
  const month = searchParams.get("month"); // e.g. "2026-11"

  try {
    let tasks;
    let total;

    // Filter logic based on role
    let whereClause: any = {};
    const isMaster = role === "ADMIN" || role === "MASTER";

    if (id) {
      whereClause = { id };
    } else if (isMaster) {
      whereClause = {}; // See everything
    } else {
      // Sellers see tasks they created or are assigned to AND are not hidden
      whereClause = {
        AND: [
          { isHidden: false },
          {
            OR: [
              { createdByClerkId: userId },
              { assigneeIds: { has: userId } },
              { assigneeEmail: email },
              { assignerEmail: email }
            ]
          }
        ]
      };
    }

    if (!id) {
      const filters: any[] = [];
      if (assigneeId) {
        // Resolve user in DB to check both clerkId, name, and email
        const targetUser = await prisma.user.findFirst({
          where: {
            OR: [
              { clerkId: assigneeId },
              { id: assigneeId }
            ]
          },
          select: { clerkId: true, name: true, email: true }
        });

        const assigneeOrs: any[] = [
          { assigneeIds: { has: assigneeId } },
          { assigneeId: assigneeId },
        ];

        if (targetUser) {
          if (targetUser.name) {
            assigneeOrs.push({ assigneeName: { contains: targetUser.name, mode: "insensitive" } });
          }
          if (targetUser.email) {
            assigneeOrs.push({ assigneeEmail: { equals: targetUser.email, mode: "insensitive" } });
          }
        }

        filters.push({
          OR: assigneeOrs
        });
      }
      if (status && status.trim()) {
        filters.push({ status: status.trim() });
      }
      if (progressFilter) {
        if (progressFilter === "0") {
          filters.push({
            OR: [
              { timeline: "0" },
              { timeline: null },
              { timeline: "" }
            ]
          });
        } else if (progressFilter === "100") {
          filters.push({ timeline: "100" });
        } else if (progressFilter === "in_progress") {
          filters.push({
            AND: [
              { timeline: { not: "0" } },
              { timeline: { not: "100" } },
              { timeline: { not: null } },
              { timeline: { not: "" } }
            ]
          });
        }
      }
      if (search && search.trim()) {
        const s = search.trim();
        filters.push({
          OR: [
            { title: { contains: s, mode: "insensitive" } },
            { shopName: { contains: s, mode: "insensitive" } },
            { outletName: { contains: s, mode: "insensitive" } },
            { customerName: { contains: s, mode: "insensitive" } },
          ]
        });
      }

      if (filters.length > 0) {
        if (whereClause.AND) {
          whereClause.AND.push(...filters);
        } else if (Object.keys(whereClause).length > 0) {
          whereClause = {
            AND: [whereClause, ...filters]
          };
        } else {
          whereClause = {
            AND: filters
          };
        }
      }
    }

    if (id) {
      const task = await prisma.task.findUnique({
        where: { id },
        include: {
          subtasks: true,
          notes: true,
        },
      });
      tasks = task ? [task] : [];
      total = tasks.length;
    } else {
      [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where: whereClause,
          include: {
            subtasks: true,
            notes: true,
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.task.count({ where: whereClause }),
      ]);
    }

    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      name: task.title,
      shop: task.shopName || task.outletName || "",
      customer: task.customerName || "",
      start: task.startDate || new Date().toISOString().split("T")[0],
      end: task.endDate || new Date().toISOString().split("T")[0],
      progress: task.timeline ? parseInt(task.timeline) : 0,
      assigneeIds: task.assigneeIds,
      amount: task.amount,
      received: task.received,
      paymentHistory: task.paymentHistory,
      paymentProofs: task.paymentProofs,
      customFields: task.customFields,
      subtasks: task.subtasks?.map((s) => ({
        id: s.id,
        title: s.title,
        completed: s.completed,
      })) || [],
      notes: task.notes?.map((n) => ({
        id: n.id,
        content: n.content,
        authorName: n.authorName,
        authorEmail: n.authorEmail,
        createdAt: n.createdAt,
      })) || [],
      attachments: task.attachments || [],
    }));

    return NextResponse.json({
      tasks: formattedTasks,
      total,
      page,
      limit,
      totalPages: id ? 1 : Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("❌ Timeline API Error:", err);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}
