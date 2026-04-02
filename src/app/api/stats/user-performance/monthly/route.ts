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
      where: filter
    });

    const monthlyDataMap: { [key: string]: number } = {};

    tasks.forEach((t) => {
      const monthKey = new Date(t.createdAt).toISOString().slice(0, 7); // "2025-07"
      monthlyDataMap[monthKey] = (monthlyDataMap[monthKey] || 0) + (t.amount || 0);
    });

    return NextResponse.json(monthlyDataMap);
  } catch (err) {
    console.error("Error fetching monthly stats:", err);
    return NextResponse.json({ error: "Failed to load monthly stats" }, { status: 500 });
  }
}
