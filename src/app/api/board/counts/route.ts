import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildTaskWhere } from "@/lib/buildTaskWhere";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { where } = await buildTaskWhere(req);
    
    // We want the counts of 'todo', 'inprogress', 'done' independently.
    // groupBy is perfect, but with complex WHERE clauses in MongoDB Prisma, it can sometimes be slow or restrictive.
    // Since it's just 3 simple queries (or a groupBy over the filtered results), we will use groupBy.
    
    // Remove status from where if it was provided in query, because we want ALL statuses to be counted for the header
    const url = new URL(req.url);
    const hasStatusParam = !!url.searchParams.get('status');
    
    // If the frontend sent status=TODO, the where clause will have status: "todo". We need to strip it to get counts for all columns!
    let countsWhere = { ...where };
    if (hasStatusParam) {
      countsWhere.AND = countsWhere.AND.filter((condition: any) => !condition.status);
    }
    
    const pendingSalesFilter = url.searchParams.get('pendingSalesFilter'); 
    const needsInMemoryFiltering = pendingSalesFilter && pendingSalesFilter !== "all";

    let counts: Record<string, number> = {
      todo: 0,
      inprogress: 0,
      done: 0
    };

    if (needsInMemoryFiltering) {
      // Edge case: must fetch minimal matching fields to filter manually
      let allTasks = await prisma.task.findMany({
        where: countsWhere,
        select: { status: true, amount: true, received: true }
      });
      
      if (pendingSalesFilter === "withPendingSales") {
        allTasks = allTasks.filter(t => (t.amount || 0) > (t.received || 0));
      } else if (pendingSalesFilter === "fullyPaidSales") {
        allTasks = allTasks.filter(t => (t.amount || 0) > 0 && (t.amount || 0) === (t.received || 0));
      } else if (pendingSalesFilter === "zeroAmountAndPaid") {
        allTasks = allTasks.filter(t => (t.amount || 0) === 0 && (t.received || 0) === 0);
      }
      
      allTasks.forEach(t => {
        const s = (t.status || "").toLowerCase();
        if (counts[s] !== undefined) counts[s]++;
      });
      
    } else {
      const grouped = await prisma.task.groupBy({
        by: ['status'],
        where: countsWhere,
        _count: {
          _all: true,
        },
      });

      grouped.forEach((g) => {
        const s = (g.status || "").toLowerCase();
        if (counts[s] !== undefined) {
          counts[s] = g._count._all;
        } else {
          counts[s] = g._count._all;
        }
      });
    }

    return NextResponse.json({ counts });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ GET /api/board/counts error:", err);
    return NextResponse.json({ error: "Failed to fetch task counts", details: error }, { status: 500 });
  }
}
