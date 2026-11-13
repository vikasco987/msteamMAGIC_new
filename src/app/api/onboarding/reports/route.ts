import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { auth } from "@/lib/auth-utils";

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

// Dynamic Platform Derivation Helper
function derivePlatform(title: string, obPlatform?: string): string {
  if (obPlatform && obPlatform.trim()) {
    const p = obPlatform.trim();
    if (p.toLowerCase().includes("combo") || (p.toLowerCase().includes("swiggy") && p.toLowerCase().includes("zomato"))) {
      return "Both";
    }
    return p;
  }
  if (!title) return "Other";
  const t = title.toLowerCase();
  if ((t.includes("swiggy") && t.includes("zomato")) || t.includes("combo")) return "Both";
  if (t.includes("swiggy")) return "Swiggy";
  if (t.includes("zomato")) return "Zomato";
  if (t.includes("toing") || t.includes("twing")) return "Toing";
  if (t.includes("only") || t.includes("ownly") || t.includes("owlny")) return "Only";
  if (t.includes("fssai") || t.includes("license") || t.includes("licence") || t.includes("linces")) return "FSSAI / License";
  if (t.includes("meesho")) return "Meesho";
  if (t.includes("rapido")) return "Rapido";
  return "Other";
}

// Normalized status classification
function normalizeStatus(taskStatus?: string, obAccountStatus?: string): { displayStatus: string; category: "Live" | "Pending" | "Duplicate" | "Other" } {
  const ob = obAccountStatus ? obAccountStatus.trim() : "";
  const ts = taskStatus ? taskStatus.trim().toLowerCase() : "todo";

  // Check OnboardingRecord status first if present
  if (ob) {
    const obLower = ob.toLowerCase();
    if (obLower === "live" || obLower === "account live" || obLower === "complete") {
      return { displayStatus: ob, category: "Live" };
    }
    if (obLower === "duplicate" || obLower === "duplicate listing") {
      return { displayStatus: ob, category: "Duplicate" };
    }
    if (
      obLower === "pending" ||
      obLower === "in progress" ||
      obLower === "vaiting for approvel" ||
      obLower === "work in manu" ||
      obLower === "menu updated" ||
      obLower === "menu pending" ||
      obLower === "cretical" ||
      obLower === "hold from customer side" ||
      obLower === "cx onboarding not willing to pay"
    ) {
      return { displayStatus: ob, category: "Pending" };
    }
    return { displayStatus: ob, category: "Other" };
  }

  // Derive from Task.status
  if (ts === "done") {
    return { displayStatus: "Live", category: "Live" };
  }
  if (ts === "inprogress") {
    return { displayStatus: "In Progress", category: "Pending" };
  }
  if (ts === "todo") {
    return { displayStatus: "Pending", category: "Pending" };
  }

  return { displayStatus: taskStatus || "Pending", category: "Pending" };
}

// Aging bucket helper
function getAgingBucket(ageDays: number): string {
  if (ageDays <= 1) return "0–1 Days";
  if (ageDays <= 3) return "2–3 Days";
  if (ageDays <= 7) return "4–7 Days";
  if (ageDays <= 15) return "8–15 Days";
  if (ageDays <= 30) return "16–30 Days";
  return "30+ Days";
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateRange = searchParams.get("dateRange") || "last7Days"; // default 'last7Days'
    const customFrom = searchParams.get("dateFrom") || "";
    const customTo = searchParams.get("dateTo") || "";
    const selectedEmployee = searchParams.get("employee") || "All";
    const selectedPlatform = searchParams.get("platform") || "All";
    const selectedStatus = searchParams.get("status") || "All";
    const selectedPriority = searchParams.get("priority") || "All";
    const selectedScope = searchParams.get("scope") || "allTasks"; // 'allTasks' | 'onboardingOnly'
    const hiddenEmployeesParam = searchParams.get("hiddenEmployees") || "";

    const hiddenEmployeesSet = new Set(
      hiddenEmployeesParam
        ? hiddenEmployeesParam.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
        : []
    );

    const client = await getMongoClient();
    const db = client.db();
    const taskCol = db.collection("Task");
    const userCol = db.collection("User");

    // Fetch all users for resolving names and for Employee Visibility settings
    const allUsers = await userCol.find({}, { projection: { clerkId: 1, name: 1, email: 1, role: 1 } }).toArray();
    const userMap: Record<string, string> = {};
    const userEmailMap: Record<string, string> = {};
    const allEmployeeNamesSet = new Set<string>();

    allUsers.forEach((u) => {
      const resolvedName = u.name || u.email?.split("@")[0] || "Unknown User";
      if (u.clerkId) {
        userMap[u.clerkId] = resolvedName;
        userEmailMap[u.clerkId] = u.email || "";
      }
      allEmployeeNamesSet.add(resolvedName);
    });

    // Date bounds calculation
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (dateRange === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (dateRange === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      startDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
      endDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
    } else if (dateRange === "last7Days") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = new Date(now);
    } else if (dateRange === "last15Days") {
      startDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      endDate = new Date(now);
    } else if (dateRange === "last30Days") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = new Date(now);
    } else if (dateRange === "thisWeek") {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
      startDate = new Date(d.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
    } else if (dateRange === "lastWeek") {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day - 6; // Previous Monday
      startDate = new Date(d.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      const endW = new Date(startDate);
      endW.setDate(endW.getDate() + 6);
      endW.setHours(23, 59, 59, 999);
      endDate = endW;
    } else if (dateRange === "thisMonth") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (dateRange === "lastMonth") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (dateRange === "custom" && (customFrom || customTo)) {
      if (customFrom) startDate = new Date(customFrom);
      if (customTo) {
        endDate = new Date(customTo);
        endDate.setHours(23, 59, 59, 999);
      }
    }

    // Build Task query
    const taskMatch: Record<string, any> = {};

    if (selectedScope === "onboardingOnly") {
      taskMatch.title = {
        $in: [
          "🍽️ Zomato Onboarding",
          "🍔 Swiggy Onboarding",
          "🍽️🍔 Zomato + Swiggy Combo",
          "🧾 Food License",
          "📸 Photo Upload",
        ],
      };
    }

    if (startDate || endDate) {
      const dateQueries: any[] = [];
      const objQuery: Record<string, any> = {};
      const strQuery: Record<string, any> = {};

      if (startDate) {
        objQuery.$gte = startDate;
        strQuery.$gte = startDate.toISOString();
      }
      if (endDate) {
        objQuery.$lte = endDate;
        strQuery.$lte = endDate.toISOString();
      }

      dateQueries.push({ createdAt: objQuery }, { createdAt: strQuery });
      taskMatch.$or = dateQueries;
    }

    // Aggregation pipeline joined with OnboardingRecord
    const pipeline: any[] = [
      { $match: taskMatch },
      {
        $lookup: {
          from: "OnboardingRecord",
          let: { tid: "$_id", tidStr: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$taskId", "$$tid"] },
                    { $eq: ["$taskId", "$$tidStr"] },
                  ],
                },
              },
            },
          ],
          as: "obData",
        },
      },
      {
        $addFields: {
          obRecord: { $arrayElemAt: ["$obData", 0] },
        },
      },
    ];

    const rawRecords = await taskCol.aggregate(pipeline).toArray();

    // In-memory data enrichment & multi-assignee expansion
    const allPlatformsFound = new Set<string>(["Swiggy", "Zomato", "Both", "Toing", "Only", "FSSAI / License", "Other"]);
    const allStatusesFound = new Set<string>(["Live", "Pending", "Duplicate", "In Progress", "done", "inprogress", "todo"]);
    const allPrioritiesFound = new Set<string>(["Normal", "High"]);

    const enriched = rawRecords.map((t: any) => {
      const ob = t.obRecord || {};
      const cf = t.customFields || {};

      // Multi-assignee list extraction
      const assignedEmployees: string[] = [];
      if (Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0) {
        t.assigneeIds.forEach((id: string) => {
          const resolved = userMap[id] || id;
          if (resolved && !assignedEmployees.includes(resolved)) {
            assignedEmployees.push(resolved);
            allEmployeeNamesSet.add(resolved);
          }
        });
      }
      if (t.assigneeName && !assignedEmployees.includes(t.assigneeName)) {
        assignedEmployees.push(t.assigneeName);
        allEmployeeNamesSet.add(t.assigneeName);
      }
      if (t.assignedTo && !assignedEmployees.includes(t.assignedTo)) {
        assignedEmployees.push(t.assignedTo);
        allEmployeeNamesSet.add(t.assignedTo);
      }
      if (assignedEmployees.length === 0) {
        assignedEmployees.push("Unassigned");
      }

      const primaryAssignedTo = assignedEmployees[0] || "Unassigned";
      const onboardedByName = ob.onboardedBy || primaryAssignedTo;

      // Status
      const { displayStatus, category } = normalizeStatus(t.status, ob.accountStatus);
      allStatusesFound.add(displayStatus);
      if (ob.accountStatus) allStatusesFound.add(ob.accountStatus);
      if (t.status) allStatusesFound.add(t.status);

      // Platform
      const platform = derivePlatform(t.title, ob.platform);
      allPlatformsFound.add(platform);

      // Priority
      const priority = t.priority ? (t.priority === "high" ? "High" : t.priority) : "Normal";
      allPrioritiesFound.add(priority);

      // Created date & Age in days
      const createdAtDate = t.createdAt ? new Date(t.createdAt) : new Date();
      const ageDays = Math.max(0, Math.floor((now.getTime() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24)));
      const agingBucket = getAgingBucket(ageDays);

      // Credentials
      const restaurantId = ob.restaurantId || ob.swiggyRestaurantId || ob.zomatoRestaurantId || t.restId || cf.restId || "";
      const fssaiNumber = ob.fssaiNumber || cf.fssai || cf.fssaiNumber || "";
      const phone = t.phone || cf.phone || "";
      const shopName = t.shopName || cf.shopName || "Unnamed Restaurant";
      const customerName = t.customerName || cf.customerName || "";

      return {
        id: t._id.toString(),
        taskId: t._id.toString(),
        shopName,
        customerName,
        phone,
        title: t.title,
        platform,
        accountStatus: category, // 'Live' | 'Pending' | 'Duplicate' | 'Other'
        displayStatus,
        rawStatus: ob.accountStatus || t.status || "todo",
        assignedEmployees,
        assignedTo: primaryAssignedTo,
        onboardedBy: onboardedByName,
        createdByName: t.createdByName || "System",
        assignerName: t.assignerName || t.createdByName || "System",
        priority,
        isReOnboarding: !!ob.isReOnboarding,
        outletCreated: ob.outletCreated || (category === "Live" ? "Yes" : "Pending"),
        restaurantId,
        fssaiNumber,
        remarks: ob.remarks || "",
        createdAt: createdAtDate.toISOString(),
        updatedAt: (ob.updatedAt || t.updatedAt || t.createdAt || new Date()).toISOString(),
        ageDays,
        agingBucket,
      };
    });

    // Apply global filters
    const filtered = enriched.filter((item: any) => {
      // Platform filter
      if (selectedPlatform && selectedPlatform !== "All") {
        if (item.platform !== selectedPlatform) return false;
      }
      // Status filter
      if (selectedStatus && selectedStatus !== "All") {
        const matchesCategory = item.accountStatus.toLowerCase() === selectedStatus.toLowerCase();
        const matchesDisplay = item.displayStatus.toLowerCase() === selectedStatus.toLowerCase();
        const matchesRaw = item.rawStatus.toLowerCase() === selectedStatus.toLowerCase();
        if (!matchesCategory && !matchesDisplay && !matchesRaw) return false;
      }
      // Priority filter
      if (selectedPriority && selectedPriority !== "All") {
        if (item.priority !== selectedPriority) return false;
      }
      // Employee filter
      if (selectedEmployee && selectedEmployee !== "All") {
        const hasEmp = item.assignedEmployees.some(
          (empName: string) => empName.toLowerCase() === selectedEmployee.toLowerCase()
        );
        if (!hasEmp && item.onboardedBy.toLowerCase() !== selectedEmployee.toLowerCase()) {
          return false;
        }
      }
      return true;
    });

    // ─── 1. Overview Dashboard Metrics ───────────────────────────────────────
    const totalOnboarding = filtered.length;
    const liveAccounts = filtered.filter((r) => r.accountStatus === "Live").length;
    const pendingAccounts = filtered.filter((r) => r.accountStatus === "Pending").length;
    const duplicateAccounts = filtered.filter((r) => r.accountStatus === "Duplicate").length;
    const otherAccounts = Math.max(0, totalOnboarding - liveAccounts - pendingAccounts - duplicateAccounts);

    const livePct = totalOnboarding > 0 ? Math.round((liveAccounts / totalOnboarding) * 100) : 0;
    const pendingPct = totalOnboarding > 0 ? Math.round((pendingAccounts / totalOnboarding) * 100) : 0;
    const duplicatePct = totalOnboarding > 0 ? Math.round((duplicateAccounts / totalOnboarding) * 100) : 0;
    const otherPct = Math.max(0, 100 - livePct - pendingPct - duplicatePct);

    // ─── 2. Employee Performance (ALL EMPLOYEES & MULTI-ASSIGNEE SUPPORT) ────
    const employeeMap: Record<
      string,
      {
        employee: string;
        assigned: number;
        onboarded: number;
        live: number;
        pending: number;
        duplicate: number;
        reOnboardCount: number;
        totalAgeDays: number;
      }
    > = {};

    // Initialize every employee from database so even those with 0 or few tasks appear
    allEmployeeNamesSet.forEach((emp) => {
      employeeMap[emp] = {
        employee: emp,
        assigned: 0,
        onboarded: 0,
        live: 0,
        pending: 0,
        duplicate: 0,
        reOnboardCount: 0,
        totalAgeDays: 0,
      };
    });

    // Credit each employee in assignedEmployees for their assigned tasks
    filtered.forEach((r) => {
      r.assignedEmployees.forEach((emp: string) => {
        if (!employeeMap[emp]) {
          employeeMap[emp] = {
            employee: emp,
            assigned: 0,
            onboarded: 0,
            live: 0,
            pending: 0,
            duplicate: 0,
            reOnboardCount: 0,
            totalAgeDays: 0,
          };
        }
        employeeMap[emp].assigned += 1;
        if (r.accountStatus === "Live") {
          employeeMap[emp].live += 1;
          employeeMap[emp].onboarded += 1;
        }
        if (r.accountStatus === "Pending") {
          employeeMap[emp].pending += 1;
        }
        if (r.accountStatus === "Duplicate") {
          employeeMap[emp].duplicate += 1;
        }
        if (r.isReOnboarding) {
          employeeMap[emp].reOnboardCount += 1;
        }
        employeeMap[emp].totalAgeDays += r.ageDays;
      });
    });

    // Filter out hidden employees for Employee Performance (while keeping them in rawRecords and admin switcher)
    const allEmployeePerformanceList = Object.values(employeeMap).map((e) => {
      const liveConversion = e.assigned > 0 ? Math.round((e.live / e.assigned) * 100) : 0;
      const avgDays = e.assigned > 0 ? (e.totalAgeDays / e.assigned).toFixed(1) : "0";
      const isHidden = hiddenEmployeesSet.has(e.employee.toLowerCase());
      return {
        employee: e.employee,
        assigned: e.assigned,
        onboarded: e.onboarded,
        live: e.live,
        pending: e.pending,
        duplicate: e.duplicate,
        liveConversionPct: liveConversion,
        avgDays: `${avgDays} days`,
        reOnboardCount: e.reOnboardCount,
        isHidden,
      };
    });

    // Only visible employees in performance table unless employee filter was explicitly selected
    const employeePerformance = allEmployeePerformanceList
      .filter((e) => (selectedEmployee !== "All" ? true : !e.isHidden && (e.assigned > 0 || !hiddenEmployeesParam)))
      .sort((a, b) => b.assigned - a.assigned);

    // ─── 3. Platform-wise Report (Dynamic from actual platforms) ─────────────
    const platformBreakdown: Record<string, { total: number; live: number; pending: number; duplicate: number }> = {};

    Array.from(allPlatformsFound).forEach((p) => {
      platformBreakdown[p] = { total: 0, live: 0, pending: 0, duplicate: 0 };
    });

    filtered.forEach((r) => {
      const p = r.platform || "Other";
      if (!platformBreakdown[p]) {
        platformBreakdown[p] = { total: 0, live: 0, pending: 0, duplicate: 0 };
      }
      platformBreakdown[p].total += 1;
      if (r.accountStatus === "Live") platformBreakdown[p].live += 1;
      if (r.accountStatus === "Pending") platformBreakdown[p].pending += 1;
      if (r.accountStatus === "Duplicate") platformBreakdown[p].duplicate += 1;
    });

    const platformWise = Object.entries(platformBreakdown)
      .map(([platform, stats]) => {
        const conversion = stats.total > 0 ? Math.round((stats.live / stats.total) * 100) : 0;
        return {
          platform,
          total: stats.total,
          live: stats.live,
          pending: stats.pending,
          duplicate: stats.duplicate,
          conversionRate: `${conversion}%`,
        };
      })
      .filter((p) => p.total > 0 || ["Swiggy", "Zomato", "Both", "Toing", "Only", "FSSAI / License"].includes(p.platform))
      .sort((a, b) => b.total - a.total);

    // ─── 4. Pending & Ageing Report ──────────────────────────────────────────
    const ageingBuckets: Record<string, number> = {
      "0–1 Days": 0,
      "2–3 Days": 0,
      "4–7 Days": 0,
      "8–15 Days": 0,
      "16–30 Days": 0,
      "30+ Days": 0,
    };

    const pendingTasksList = filtered.filter((r) => r.accountStatus === "Pending");

    pendingTasksList.forEach((r) => {
      const bucket = r.agingBucket;
      if (ageingBuckets[bucket] !== undefined) {
        ageingBuckets[bucket] += 1;
      } else {
        ageingBuckets["30+ Days"] += 1;
      }
    });

    const pendingAgeingSummary = Object.entries(ageingBuckets).map(([range, count]) => ({
      range,
      records: count,
    }));

    // ─── 5. Daily / Monthly Trend Report ─────────────────────────────────────
    const trendMap: Record<string, { label: string; created: number; live: number }> = {};
    filtered.forEach((r) => {
      const date = new Date(r.createdAt);
      const monthKey = date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      if (!trendMap[monthKey]) {
        trendMap[monthKey] = { label: monthKey, created: 0, live: 0 };
      }
      trendMap[monthKey].created += 1;
      if (r.accountStatus === "Live") {
        trendMap[monthKey].live += 1;
      }
    });

    // ─── 6. Duplicate & Re-Onboarding Report ─────────────────────────────────
    const duplicates = filtered.filter((r) => r.accountStatus === "Duplicate" || r.isReOnboarding);
    const dupByPlatform: Record<string, number> = {};
    filtered
      .filter((r) => r.accountStatus === "Duplicate")
      .forEach((r) => {
        dupByPlatform[r.platform] = (dupByPlatform[r.platform] || 0) + 1;
      });

    const duplicateSummary = {
      totalDuplicates: filtered.filter((r) => r.accountStatus === "Duplicate").length,
      totalReOnboardings: filtered.filter((r) => r.isReOnboarding).length,
      byPlatform: dupByPlatform,
    };

    // ─── 7. Data Quality Report ──────────────────────────────────────────────
    const dataQuality = [
      {
        field: "Restaurant ID",
        missingCount: filtered.filter((r) => !r.restaurantId?.trim()).length,
        key: "restaurantId",
      },
      {
        field: "FSSAI Number",
        missingCount: filtered.filter((r) => !r.fssaiNumber?.trim()).length,
        key: "fssaiNumber",
      },
      {
        field: "Phone Number",
        missingCount: filtered.filter((r) => !r.phone?.trim()).length,
        key: "phone",
      },
      {
        field: "Onboarded By",
        missingCount: filtered.filter((r) => !r.onboardedBy || r.onboardedBy === "Unassigned").length,
        key: "onboardedBy",
      },
      {
        field: "Remarks",
        missingCount: filtered.filter((r) => !r.remarks?.trim()).length,
        key: "remarks",
      },
    ];

    // ─── 8. Outlet Creation Report ───────────────────────────────────────────
    const outletCreatedYes = filtered.filter((r) => r.outletCreated === "Yes").length;
    const outletCreatedPending = filtered.filter((r) => r.outletCreated === "Pending" || !r.outletCreated).length;
    const outletCreatedNo = filtered.filter((r) => r.outletCreated === "No").length;
    const outletCompletionPct = totalOnboarding > 0 ? Math.round((outletCreatedYes / totalOnboarding) * 100) : 0;

    const outletByEmployee: Record<string, { created: number; pending: number }> = {};
    filtered.forEach((r) => {
      const emp = r.assignedTo || "Unassigned";
      if (!outletByEmployee[emp]) outletByEmployee[emp] = { created: 0, pending: 0 };
      if (r.outletCreated === "Yes") outletByEmployee[emp].created += 1;
      else outletByEmployee[emp].pending += 1;
    });

    const outletCreation = {
      totalCreated: outletCreatedYes,
      pendingCreation: outletCreatedPending,
      notApplicable: outletCreatedNo,
      completionRate: `${outletCompletionPct}%`,
      missingRestaurantId: dataQuality[0].missingCount,
      byEmployee: Object.entries(outletByEmployee).map(([employee, val]) => ({
        employee,
        created: val.created,
        pending: val.pending,
      })),
    };

    // Return full real-time database-backed report payload
    return NextResponse.json({
      success: true,
      dataDate: dateRange === "thisMonth" ? "November 2026" : dateRange,
      filters: {
        employees: Array.from(allEmployeeNamesSet).sort(),
        allEmployeesWithVisibility: allEmployeePerformanceList.map((e) => ({
          name: e.employee,
          totalAssigned: e.assigned,
          isHidden: e.isHidden,
        })),
        platforms: Array.from(allPlatformsFound).filter(Boolean).sort(),
        statuses: Array.from(allStatusesFound).filter(Boolean).sort(),
        priorities: Array.from(allPrioritiesFound).filter(Boolean).sort(),
      },
      overview: {
        totalOnboarding,
        liveAccounts,
        pending: pendingAccounts,
        duplicate: duplicateAccounts,
        distribution: {
          livePct,
          pendingPct,
          otherPct,
          duplicatePct,
        },
      },
      employeePerformance,
      platformWise,
      pendingAgeing: {
        summary: pendingAgeingSummary,
        tasks: pendingTasksList.slice(0, 50),
      },
      trends: Object.values(trendMap),
      duplicateReport: {
        summary: duplicateSummary,
        records: duplicates.slice(0, 50),
      },
      dataQuality,
      outletCreation,
      rawRecords: filtered,
    });
  } catch (error: any) {
    console.error("❌ [Onboarding Reports API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
