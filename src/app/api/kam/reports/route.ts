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

    // 1. Table 1: Assign_2.0 Summary (Grouped by assignerName or customFields.assignerName)
    // Columns: Name, Total Customer, Active Customer, Waiting For renewal
    const assign2Map: Record<
      string,
      { totalCustomer: number; activeCustomer: number; waitingRenewal: number }
    > = {};

    // 2. Table 2: Retention Team Summary
    // Columns: Retention Member, Total Cx, Active
    const retentionSummaryMap: Record<
      string,
      { totalCx: number; active: number }
    > = {};

    // 3. Table 3: Retention Status Breakdown
    // Columns: Retention Team, Growing...., Need To Focus, Conflict For week, Ask_For_Renewal, cretical_outlet, Customer_not response, Outlet Currently off
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

    tasks.forEach((task) => {
      const cf = (task.customFields as any) || {};
      const assigner = (
        task.assignerName ||
        cf.assignerName ||
        "Unassigned"
      ).trim();
      const assignee = (
        task.assigneeName ||
        cf.assigneeName ||
        "Unassigned"
      ).trim();

      const customerStatus = (cf.customerStatus || "").trim().toLowerCase();
      const accountStatus = (cf.accountStatus || "").trim().toLowerCase();

      const isActive = customerStatus === "active";
      const isWaitingRenewal =
        customerStatus.includes("waiting") || customerStatus.includes("renewal");

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

      // Check if assigner or assignee is in Retention Team
      const isAssignerRetention = retentionNames.has(assigner.toLowerCase());
      const isAssigneeRetention = retentionNames.has(assignee.toLowerCase());

      const retentionMember = isAssignerRetention
        ? assigner
        : isAssigneeRetention
        ? assignee
        : null;

      if (retentionMember) {
        // Table 2 aggregation
        if (!retentionSummaryMap[retentionMember]) {
          retentionSummaryMap[retentionMember] = { totalCx: 0, active: 0 };
        }
        retentionSummaryMap[retentionMember].totalCx += 1;
        if (isActive) retentionSummaryMap[retentionMember].active += 1;

        // Table 3 aggregation
        if (!retentionBreakdownMap[retentionMember]) {
          retentionBreakdownMap[retentionMember] = {
            growing: 0,
            needToFocus: 0,
            conflictForWeek: 0,
            askForRenewal: 0,
            creticalOutlet: 0,
            customerNotResponse: 0,
            outletCurrentlyOff: 0,
          };
        }

        const b = retentionBreakdownMap[retentionMember];
        if (accountStatus.includes("growing") && !accountStatus.includes("not")) {
          b.growing += 1;
        } else if (accountStatus.includes("need to focus")) {
          b.needToFocus += 1;
        } else if (accountStatus.includes("conflict")) {
          b.conflictForWeek += 1;
        } else if (accountStatus.includes("renewal")) {
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

