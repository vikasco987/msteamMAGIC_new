import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, getUserDetails } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role verification
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    const clerkUser = await getUserDetails(userId);
    const roleFromClerk =
      (clerkUser.publicMetadata as any)?.role ||
      (clerkUser.privateMetadata as any)?.role;
    const normalizedRole = String(
      roleFromClerk || dbUser?.role || "user"
    ).toLowerCase();

    const isTL = (dbUser as any)?.isTeamLeader || normalizedRole === "tl";
    const isSeller = normalizedRole === "seller";
    const isPrivileged =
      normalizedRole === "admin" ||
      normalizedRole === "master" ||
      (dbUser as any)?.hasFullKamAccess;

    if (!isPrivileged && !isSeller && !isTL) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch all Account Handling tasks
    const tasks = await prisma.task.findMany({
      where: {
        title: "📂 Account Handling",
      },
      select: {
        id: true,
        assignerName: true,
        assigneeName: true,
        customFields: true,
      },
    });

    // Fetch Retention team members
    const retentionUsers = await prisma.user.findMany({
      where: { currentDepartment: "Retention" },
      select: { name: true, clerkId: true },
    });
    const retentionNames = new Set(
      retentionUsers.map((u) => (u.name || "").trim().toLowerCase()).filter(Boolean)
    );

    // 1. Table 1: Assign_2.0 Summary Canonical Members
    const canonicalAssigners = [
      "Vivek",
      "shravan mandal",
      "Prince Singh",
      "Priyanshu Kushwaha",
      "Yogesh",
      "kapil morya",
      "Henu",
      "Left",
    ];

    const assign2Map: Record<
      string,
      { totalCustomer: number; activeCustomer: number; waitingRenewal: number }
    > = {};

    canonicalAssigners.forEach((name) => {
      assign2Map[name] = { totalCustomer: 0, activeCustomer: 0, waitingRenewal: 0 };
    });

    // 2. Table 2: Retention Team Summary
    const canonicalRetention = ["Rishav kumar", "Chahat"];
    const retentionSummaryMap: Record<
      string,
      { totalCx: number; active: number }
    > = {};

    canonicalRetention.forEach((name) => {
      retentionSummaryMap[name] = { totalCx: 0, active: 0 };
    });

    // 3. Table 3: Retention Status Breakdown
    const retentionBreakdownMap: Record<
      string,
      {
        growing: number;
        needToFocus: number;
        conflictForWeek: number;
        askForRenewal: number;
        creticalOutlet: number;
        customerNotResponse: number;
        outletCurrentlyOff: number;
      }
    > = {};

    canonicalRetention.forEach((name) => {
      retentionBreakdownMap[name] = {
        growing: 0,
        needToFocus: 0,
        conflictForWeek: 0,
        askForRenewal: 0,
        creticalOutlet: 0,
        customerNotResponse: 0,
        outletCurrentlyOff: 0,
      };
    });

    const now = new Date();

    function normalizeAssigner(t: any, cf: any): string {
      const raw = (t.assignerName || cf.assignerName || "").trim().toLowerCase();
      if (raw.includes("vivek")) return "Vivek";
      if (raw.includes("shravan")) return "shravan mandal";
      if (raw.includes("prince")) return "Prince Singh";
      if (raw.includes("priyanshu")) return "Priyanshu Kushwaha";
      if (raw.includes("yogesh")) return "Yogesh";
      if (raw.includes("kapil")) return "kapil morya";
      if (raw.includes("henu")) return "Henu";
      return "Left";
    }

    tasks.forEach((task) => {
      const cf = (task.customFields as any) || {};
      const assigner = normalizeAssigner(task, cf);

      const customerStatus = (cf.customerStatus || "").trim().toLowerCase();
      const accountStatus = (cf.accountStatus || "").trim().toLowerCase();

      // Check dates
      const endStr = cf.endDate || cf.subscriptionEndDate;
      const end = endStr ? new Date(endStr) : null;
      const isValidEnd = end && !isNaN(end.getTime());

      let isActive = false;
      let isWaitingRenewal = false;

      if (customerStatus === "active") {
        isActive = true;
      } else if (customerStatus.includes("renewal") || customerStatus.includes("waiting")) {
        isWaitingRenewal = true;
      } else if (isValidEnd) {
        if (end >= now) {
          isActive = true;
        } else {
          const diffDays = Math.round((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 30) {
            isWaitingRenewal = true;
          }
        }
      }

      // Aggregate Table 1: Assign_2.0
      if (!assign2Map[assigner]) {
        assign2Map[assigner] = {
          totalCustomer: 0,
          activeCustomer: 0,
          waitingRenewal: 0,
        };
      }
      assign2Map[assigner].totalCustomer += 1;
      if (isActive) assign2Map[assigner].activeCustomer += 1;
      if (isWaitingRenewal) assign2Map[assigner].waitingRenewal += 1;

      // Retention Team Detection:
      const fullText = `${task.assignerName || ""} ${task.assigneeName || ""} ${cf.assignerName || ""} ${cf.assigneeName || ""} ${cf.retentionMember || ""}`.toLowerCase();
      let matchedRetention: string | null = null;
      if (fullText.includes("rishav")) {
        matchedRetention = "Rishav kumar";
      } else if (fullText.includes("chahat")) {
        matchedRetention = "Chahat";
      }

      if (matchedRetention) {
        retentionSummaryMap[matchedRetention].totalCx += 1;
        if (isActive) retentionSummaryMap[matchedRetention].active += 1;

        const b = retentionBreakdownMap[matchedRetention];
        if (accountStatus.includes("growing") && !accountStatus.includes("not")) {
          b.growing += 1;
        } else if (accountStatus.includes("need to focus")) {
          b.needToFocus += 1;
        } else if (accountStatus.includes("conflict")) {
          b.conflictForWeek += 1;
        } else if (accountStatus.includes("renewal") || accountStatus.includes("ask_for_renewal")) {
          b.askForRenewal += 1;
        } else if (accountStatus.includes("cretical") || accountStatus.includes("critical")) {
          b.creticalOutlet += 1;
        } else if (accountStatus.includes("not response") || accountStatus.includes("no response")) {
          b.customerNotResponse += 1;
        } else if (accountStatus.includes("currently off") || accountStatus.includes("off")) {
          b.outletCurrentlyOff += 1;
        }
      }
    });

    return NextResponse.json({
      assign2Data: Object.entries(assign2Map).map(([name, data]) => ({
        name,
        ...data,
      })),
      retentionSummary: Object.entries(retentionSummaryMap).map(
        ([name, data]) => ({
          name,
          ...data,
        })
      ),
      retentionBreakdown: Object.entries(retentionBreakdownMap).map(
        ([name, data]) => ({
          name,
          ...data,
        })
      ),
      totalTasksCount: tasks.length,
    });
  } catch (error) {
    console.error("Failed to generate KAM report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

