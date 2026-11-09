import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, getUserDetails } from "@/lib/auth-utils";
import { MongoClient } from "mongodb";

let cachedPrimaryClient: MongoClient | null = null;
let cachedSecondaryClient: MongoClient | null = null;

async function getPrimaryMongoClient() {
  if (cachedPrimaryClient) return cachedPrimaryClient;
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error("DATABASE_URL is not defined");
  const client = new MongoClient(uri);
  await client.connect();
  cachedPrimaryClient = client;
  return client;
}

async function getSecondaryMongoClient() {
  if (cachedSecondaryClient) return cachedSecondaryClient;
  const uri = process.env.SECONDARY_CRM_DATABASE_URL;
  if (!uri) return null;
  try {
    const client = new MongoClient(uri);
    await client.connect();
    cachedSecondaryClient = client;
    return client;
  } catch (err) {
    console.error("Failed to connect to SECONDARY_CRM_DATABASE_URL:", err);
    return null;
  }
}

const DEFAULT_KAM_TEAMS = [
  {
    teamName: "Onboarding",
    tlName: "Himanshu Sharma",
    members: ["Mahek", "Preeti", "Sakshi", "Akansh", "Rishab"],
  },
  {
    teamName: "Digital",
    tlName: "Vishal Sood",
    members: ["Yogesh", "Sharvan", "Priyanshu", "Kapil", "Prince"],
  },
];

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

    const { searchParams } = new URL(req.url);
    const sourceParam = (searchParams.get("source") || "primary").toLowerCase(); // "primary" | "secondary" | "master"

    // READ-ONLY: Fetch tasks from primary DB
    let primaryTasks: any[] = [];
    try {
      const primaryClient = await getPrimaryMongoClient();
      const primaryDb = primaryClient.db();
      primaryTasks = await primaryDb
        .collection("Task")
        .find(
          { title: "📂 Account Handling" },
          { projection: { id: 1, _id: 1, assignerName: 1, assigneeName: 1, customFields: 1 } }
        )
        .toArray();
    } catch (e) {
      console.error("Error reading primary DB tasks:", e);
    }

    // READ-ONLY: Fetch tasks from secondary DB if available
    let secondaryTasks: any[] = [];
    const secondaryClient = await getSecondaryMongoClient();
    if (secondaryClient) {
      try {
        const secondaryDb = secondaryClient.db("clickup_clone");
        secondaryTasks = await secondaryDb
          .collection("Task")
          .find(
            { title: "📂 Account Handling" },
            { projection: { id: 1, _id: 1, assignerName: 1, assigneeName: 1, customFields: 1 } }
          )
          .toArray();
      } catch (e) {
        console.error("Error reading secondary DB tasks:", e);
      }
    }

    // Select tasks based on chosen source
    let tasksToProcess: any[] = [];
    if (sourceParam === "secondary") {
      tasksToProcess = secondaryTasks;
    } else if (sourceParam === "master") {
      // Combined tasks without modifying databases
      tasksToProcess = [...primaryTasks, ...secondaryTasks];
    } else {
      // Default: primary
      tasksToProcess = primaryTasks;
    }

    // Fetch active team configurations from SystemSettings or default
    let kamTeams = DEFAULT_KAM_TEAMS;
    try {
      const client = await getPrimaryMongoClient();
      const db = client.db();
      const settingsDoc = await db.collection("SystemSettings").findOne({ key: "kam_report_teams" });
      if (settingsDoc && Array.isArray(settingsDoc.teams) && settingsDoc.teams.length > 0) {
        kamTeams = settingsDoc.teams;
      }
    } catch (e) {
      console.warn("Could not load dynamic kam_report_teams, using default", e);
    }

    // 0. Build Team Groups (Onboarding, Digital, etc.)
    const teamGroupsMap: Record<
      string,
      {
        teamName: string;
        tlName: string;
        members: {
          name: string;
          totalCustomer: number;
          activeCustomer: number;
          waitingRenewal: number;
        }[];
        totalCustomer: number;
        activeCustomer: number;
        waitingRenewal: number;
      }
    > = {};

    kamTeams.forEach((t) => {
      teamGroupsMap[t.teamName] = {
        teamName: t.teamName,
        tlName: t.tlName,
        members: (t.members || []).map((m: string) => ({
          name: m,
          totalCustomer: 0,
          activeCustomer: 0,
          waitingRenewal: 0,
        })),
        totalCustomer: 0,
        activeCustomer: 0,
        waitingRenewal: 0,
      };
    });

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

    // 2. Table 2: Team Members Summary (Himanshu Sharma, Vishal Sood, Ansh Kushwaha, Rishav kumar, Chahat)
    const canonicalMembers = [
      "Himanshu Sharma",
      "Vishal Sood",
      "Ansh Kushwaha",
      "Rishav kumar",
      "Chahat",
    ];

    const retentionSummaryMap: Record<
      string,
      { totalCx: number; active: number }
    > = {};

    canonicalMembers.forEach((name) => {
      retentionSummaryMap[name] = { totalCx: 0, active: 0 };
    });

    // 3. Table 3: Member Status Breakdown
    // We include Retention members, PLUS Onboarding and Digital members as requested by user
    const retentionBreakdownMap: Record<
      string,
      {
        teamType: "Retention" | "Onboarding" | "Digital" | "Other";
        growing: number;
        needToFocus: number;
        conflictForWeek: number;
        askForRenewal: number;
        creticalOutlet: number;
        customerNotResponse: number;
        outletCurrentlyOff: number;
      }
    > = {};

    // Initialise Retention members
    canonicalMembers.forEach((name) => {
      retentionBreakdownMap[name] = {
        teamType: "Retention",
        growing: 0,
        needToFocus: 0,
        conflictForWeek: 0,
        askForRenewal: 0,
        creticalOutlet: 0,
        customerNotResponse: 0,
        outletCurrentlyOff: 0,
      };
    });

    // Initialise members from configured teams (Onboarding, Digital)
    kamTeams.forEach((team) => {
      const type = team.teamName.toLowerCase().includes("onb")
        ? "Onboarding"
        : team.teamName.toLowerCase().includes("dig")
        ? "Digital"
        : "Other";
      (team.members || []).forEach((memberName) => {
        if (!retentionBreakdownMap[memberName]) {
          retentionBreakdownMap[memberName] = {
            teamType: type as any,
            growing: 0,
            needToFocus: 0,
            conflictForWeek: 0,
            askForRenewal: 0,
            creticalOutlet: 0,
            customerNotResponse: 0,
            outletCurrentlyOff: 0,
          };
        }
      });
    });

    const now = new Date();

    function normalizeAssigner(t: any, cf: any): string {
      const raw = (t.assignerName || cf.assignerName || "").trim().toLowerCase();
      if (raw.includes("vivek")) return "Vivek";
      if (raw.includes("shravan") || raw.includes("sharvan")) return "shravan mandal";
      if (raw.includes("prince")) return "Prince Singh";
      if (raw.includes("priyanshu")) return "Priyanshu Kushwaha";
      if (raw.includes("yogesh")) return "Yogesh";
      if (raw.includes("kapil")) return "kapil morya";
      if (raw.includes("henu")) return "Henu";
      return "Left";
    }

    function canonicalTeamMember(t: any, cf: any): string | null {
      const full = `${t.assigneeName || ""} ${cf.assigneeName || ""} ${t.assignerName || ""} ${cf.assignerName || ""} ${cf.retentionMember || ""}`.toLowerCase();
      if (full.includes("himanshu")) return "Himanshu Sharma";
      if (full.includes("vishal")) return "Vishal Sood";
      if (full.includes("ansh")) return "Ansh Kushwaha";
      if (full.includes("rishav") || full.includes("rishab")) return "Rishav kumar";
      if (full.includes("chahat")) return "Chahat";
      return null;
    }

    // Helper to find matching breakdown members (Retention, Onboarding, Digital)
    function findMatchingBreakdownMembers(t: any, cf: any): string[] {
      const full = `${t.assigneeName || ""} ${cf.assigneeName || ""} ${t.assignerName || ""} ${cf.assignerName || ""} ${cf.retentionMember || ""}`.toLowerCase();
      const matched: string[] = [];

      Object.keys(retentionBreakdownMap).forEach((name) => {
        const nLower = name.trim().toLowerCase();
        let hit = false;
        if (nLower === "sharvan" || nLower === "shravan") {
          hit = full.includes("shravan") || full.includes("sharvan");
        } else if (nLower === "rishab" || nLower === "rishav") {
          hit = full.includes("rishab") || full.includes("rishav");
        } else if (full.includes(nLower)) {
          hit = true;
        }
        if (hit) matched.push(name);
      });

      return matched;
    }

    // Overall Status Totals for Cards
    const overallStatusTotals = {
      growing: 0,
      needToFocus: 0,
      conflictForWeek: 0,
      askForRenewal: 0,
      creticalOutlet: 0,
      customerNotResponse: 0,
      outletCurrentlyOff: 0,
    };

    tasksToProcess.forEach((task) => {
      const cf = (task.customFields as any) || {};
      const assigner = normalizeAssigner(task, cf);

      const customerStatus = (cf.customerStatus || "").trim().toLowerCase();
      const accountStatus = (cf.accountStatus || "").trim().toLowerCase();

      // Overall status aggregation for KPI cards
      if (accountStatus.includes("growing") && !accountStatus.includes("not")) {
        overallStatusTotals.growing += 1;
      } else if (accountStatus.includes("need to focus")) {
        overallStatusTotals.needToFocus += 1;
      } else if (accountStatus.includes("conflict")) {
        overallStatusTotals.conflictForWeek += 1;
      } else if (accountStatus.includes("renewal") || accountStatus.includes("ask_for_renewal")) {
        overallStatusTotals.askForRenewal += 1;
      } else if (accountStatus.includes("cretical") || accountStatus.includes("critical")) {
        overallStatusTotals.creticalOutlet += 1;
      } else if (accountStatus.includes("not response") || accountStatus.includes("no response")) {
        overallStatusTotals.customerNotResponse += 1;
      } else if (accountStatus.includes("currently off") || accountStatus.includes("off")) {
        overallStatusTotals.outletCurrentlyOff += 1;
      }

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

      // Aggregate Team Groups (Onboarding, Digital, etc.)
      const rawAssignerStr = `${task.assignerName || ""} ${cf.assignerName || ""} ${task.assigneeName || ""} ${cf.assigneeName || ""}`.trim().toLowerCase();
      kamTeams.forEach((t) => {
        const group = teamGroupsMap[t.teamName];
        if (!group) return;

        (t.members || []).forEach((memberName: string) => {
          const mLower = memberName.trim().toLowerCase();
          let matched = false;
          if (mLower === "sharvan" || mLower === "shravan") {
            matched = rawAssignerStr.includes("shravan") || rawAssignerStr.includes("sharvan");
          } else if (mLower === "rishab" || mLower === "rishav") {
            matched = rawAssignerStr.includes("rishab") || rawAssignerStr.includes("rishav");
          } else if (rawAssignerStr.includes(mLower)) {
            matched = true;
          }

          if (matched) {
            const memberObj = group.members.find((m) => m.name === memberName);
            if (memberObj) {
              memberObj.totalCustomer += 1;
              if (isActive) memberObj.activeCustomer += 1;
              if (isWaitingRenewal) memberObj.waitingRenewal += 1;
            }
            group.totalCustomer += 1;
            if (isActive) group.activeCustomer += 1;
            if (isWaitingRenewal) group.waitingRenewal += 1;
          }
        });
      });

      // Team Member Detection for Retention Summary:
      const matchedMember = canonicalTeamMember(task, cf);
      if (matchedMember) {
        retentionSummaryMap[matchedMember].totalCx += 1;
        if (isActive) retentionSummaryMap[matchedMember].active += 1;
      }

      // Populate Status Breakdown for Retention, Onboarding & Digital members:
      const matchedBreakdownMembers = findMatchingBreakdownMembers(task, cf);
      matchedBreakdownMembers.forEach((name) => {
        const b = retentionBreakdownMap[name];
        if (!b) return;

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
      });
    });

    return NextResponse.json({
      activeSource: sourceParam,
      hasSecondaryDb: !!process.env.SECONDARY_CRM_DATABASE_URL,
      teamGroups: Object.values(teamGroupsMap),
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
      overallStatusTotals,
      totalTasksCount: tasksToProcess.length,
      primaryCount: primaryTasks.length,
      secondaryCount: secondaryTasks.length,
    });
  } catch (error) {
    console.error("Failed to generate KAM report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
