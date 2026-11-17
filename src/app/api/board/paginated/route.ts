import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildTaskWhere } from "@/lib/buildTaskWhere";
import { fetchExternalBoardTasks } from "@/lib/multiDbTasks";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { where, userMap, normalizedRole } = await buildTaskWhere(req);

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const sortKey = url.searchParams.get('sortKey') || 'createdAt';
    const sortDir = (url.searchParams.get('sortDir') || 'desc') as 'asc' | 'desc';
    const pendingSalesFilter = url.searchParams.get('pendingSalesFilter'); 

    const skip = (page - 1) * limit;

    const orderBy: any = {};
    if (sortKey === 'pendingAmount') {
      orderBy['createdAt'] = 'desc';
    } else {
      orderBy[sortKey] = sortDir;
    }

    const needsInMemoryFiltering = pendingSalesFilter && pendingSalesFilter !== "all";

    // Lightweight select to avoid heavy data
    const lightweightSelect = {
      id: true,
      taskCode: true,
      title: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
      assignerName: true,
      assignerEmail: true,
      assigneeName: true,
      assigneeEmail: true,
      assigneeId: true,
      assigneeIds: true,
      amount: true,
      received: true,
      tags: true,
      highlightColor: true,
      isHidden: true,
      customFields: true,
      phone: true,
      email: true,
      shopName: true,
      location: true,
      accountNumber: true,
      ifscCode: true,
      customerName: true,
      outletName: true,
      packageAmount: true,
      startDate: true,
      endDate: true,
      timeline: true,
      aadhaarUrl: true,
      panUrl: true,
      selfieUrl: true,
      chequeUrl: true,
      menuCardUrls: true,
      attachments: true,
      notes: true, // Needed for highlights on the card
    };

    let tasks;

    if (needsInMemoryFiltering) {
      // In-memory filtering means we must fetch all matching the base where, filter them, then paginate manually.
      // This is an edge case in the existing logic that we preserve.
      let fetchedTasks = await prisma.task.findMany({
        where,
        orderBy,
        select: lightweightSelect,
      });

      if (pendingSalesFilter === "withPendingSales") {
        fetchedTasks = fetchedTasks.filter(t => (t.amount || 0) > (t.received || 0));
      } else if (pendingSalesFilter === "fullyPaidSales") {
        fetchedTasks = fetchedTasks.filter(t => (t.amount || 0) > 0 && (t.amount || 0) === (t.received || 0));
      } else if (pendingSalesFilter === "zeroAmountAndPaid") {
        fetchedTasks = fetchedTasks.filter(t => (t.amount || 0) === 0 && (t.received || 0) === 0);
      }

      tasks = fetchedTasks.slice(skip, skip + limit);
    } else {
      // Standard pagination
      tasks = await prisma.task.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: lightweightSelect,
      });
    }

    // Enrich with correct assigner/assignees using userMap (preserves existing format)
    const enrichedTasks = tasks.map((task) => {
      const assigner = userMap[task.assignerEmail ?? ""] || {
        id: "",
        name: task.assignerName || "—",
        email: task.assignerEmail || "",
      };

      const assignees = Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0
        ? task.assigneeIds.map((id) => {
          const u = userMap[id];
          return {
            id,
            name: u?.name || "—",
            email: u?.email || "",
          };
        })
        : (task.assigneeId ? [{ id: task.assigneeId, name: task.assigneeName || "—", email: task.assigneeEmail || "" }] : []);

      return {
        ...task,
        assignerName: assigner.name,
        assignees,
      };
    });

    // 🌐 Multi-Database Integration: Check if Secondary or 3rd CRM feeds are enabled
    let combinedTasks: any[] = enrichedTasks;
    try {
      const settings = await prisma.businessSettings.findFirst({
        select: { showSecondaryDbTasks: true, showThirdDbTasks: true }
      });

      const includeSecondary = !!(settings as any)?.showSecondaryDbTasks;
      const includeThird = !!(settings as any)?.showThirdDbTasks;

      if (includeSecondary || includeThird) {
        const colStatus = url.searchParams.get('status') || '';
        const search = url.searchParams.get('search') || url.searchParams.get('query') || '';
        const categories = url.searchParams.get('categories')?.split(',').filter(Boolean) || [];

        const externalTasks = await fetchExternalBoardTasks({
          includeSecondary,
          includeThird,
          status: colStatus || undefined,
          search: search || undefined,
          categories: categories.length ? categories : undefined,
        });

        if (externalTasks.length > 0) {
          // If on page 1, merge external tasks with primary tasks
          if (page === 1) {
            combinedTasks = [...externalTasks, ...enrichedTasks];
          }
        }
      }
    } catch (multiDbErr) {
      console.error("Error merging multi-database board tasks:", multiDbErr);
    }

    console.log(`📄 GET /api/board/paginated – Role: ${normalizedRole || "unknown"} – fetched ${combinedTasks.length} lightweight tasks`);

    return NextResponse.json({
      tasks: combinedTasks,
      hasMore: enrichedTasks.length === limit,
      page,
      limit,
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ GET /api/board/paginated error:", err);
    return NextResponse.json({ error: "Failed to fetch paginated tasks", details: error }, { status: 500 });
  }
}
