// app/api/kam/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client"; // Import Prisma for JsonValue type

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

import { auth } from "@clerk/nextjs/server";

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
    const clerkUser = await client.users.getUser(userId);
    const roleFromClerk = (clerkUser.publicMetadata as any)?.role || (clerkUser.privateMetadata as any)?.role;
    const normalizedRole = String(roleFromClerk || dbUser?.role || 'user').toLowerCase();
    
    const isTL = (dbUser as any)?.isTeamLeader || normalizedRole === 'tl';
    let teamMemberIds: string[] = [];
    if (isTL) {
      const members = await prisma.user.findMany({
        where: { leaderId: userId } as any,
        select: { clerkId: true }
      });
      teamMemberIds = members.map(m => m.clerkId);
    }

    const isSeller = normalizedRole === "seller";
    const isPrivileged = normalizedRole === "admin" || normalizedRole === "master";

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

    if (query) {
      where.OR = [
        ...(where.OR || []),
        { shopName: { contains: query, mode: "insensitive" } },
        { customerName: { contains: query, mode: "insensitive" } },
        { assigneeName: { contains: query, mode: "insensitive" } },
        { assignerName: { contains: query, mode: "insensitive" } },
      ];
    }

    // Fetch tasks
    const [tasks, totalCount] = await Promise.all([
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
        },
        orderBy: {
          [sortKey]: sortDir,
        },
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

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
      };
    });

    return NextResponse.json({
      tasks: enrichedTasks,
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