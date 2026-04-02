import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    
    const role = String(clerkUser.publicMetadata?.role || dbUser?.role || "user").toLowerCase();
    const isTL = dbUser?.isTeamLeader || role === 'tl';
    const isPrivileged = ['admin', 'master'].includes(role);

    let filter: any = {};

    if (!isPrivileged) {
      let userIds = [userId];
      if (isTL) {
          const members = await prisma.user.findMany({
              where: { leaderId: userId },
              select: { clerkId: true }
          });
          userIds = [userId, ...members.map(m => m.clerkId)];
      }
      
      filter = {
          OR: [
              { createdByClerkId: { in: userIds } },
              { assigneeId: { in: userIds } },
              { assigneeIds: { hasSome: userIds } }
          ]
      };
    }

    const tasks = await prisma.task.findMany({
      where: filter,
      select: {
        assigneeName: true,
        amount: true,
      },
    });

    const grouped: Record<string, number> = {};

    for (const task of tasks) {
      const name = task.assigneeName || "Unassigned";
      grouped[name] = (grouped[name] || 0) + (task.amount || 0);
    }

    return NextResponse.json(grouped);
  } catch (error) {
    console.error("Error in by-assignee stats:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
