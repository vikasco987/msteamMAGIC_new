import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const assigneeName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Unknown";
    const assigneeEmail = user?.emailAddresses[0]?.emailAddress || "unknown@example.com";

    const body = await req.json();
    const { printerNo, taskId } = body;

    if (!printerNo || !taskId) {
      return NextResponse.json({ error: "Printer number and Task ID are required." }, { status: 400 });
    }

    // Create the assignment log
    const newLog = await prisma.printerAssignmentLog.create({
      data: {
        printerNo,
        taskId,
        assigneeName,
        assigneeEmail,
      },
    });

    return NextResponse.json({ success: true, data: newLog });
  } catch (error: any) {
    console.error("Failed to create printer assignment:", error);
    return NextResponse.json({ error: error.message || "Failed to create assignment" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const assignee = searchParams.get("assignee");

    const where: any = {};
    if (assignee && assignee !== "All") {
      where.assigneeName = assignee;
    }

    const logs = await prisma.printerAssignmentLog.findMany({
      where,
      orderBy: { assignedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    console.error("Failed to fetch printer assignments:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch data" }, { status: 500 });
  }
}
