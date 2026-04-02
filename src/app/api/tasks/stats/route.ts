import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

type Row = {
  assignee: string;
  todo: number;
  inprogress: number;
  done: number;
  total: number;
};

function normalizeStatus(input?: string): "todo" | "inprogress" | "done" | "unknown" {
  const k = (input || "").toString().trim().toLowerCase().replace(/[\s_-]/g, "");
  if (["todo", "backlog", "open", "new"].includes(k)) return "todo";
  if (["inprogress", "inprogess", "wip", "doing", "ongoing"].includes(k)) return "inprogress";
  if (["done", "completed", "complete", "closed", "resolved", "finished", "finished"].includes(k)) return "done";
  return "unknown";
}

export async function GET() {
  try {
    // 1️⃣ Fetch all tasks with assigneeIds
    const tasks = await prisma.task.findMany({
      where: {
        isHidden: false
      },
      select: {
        status: true,
        assigneeIds: true,
      },
    });

    // 2️⃣ Collect all unique assigneeIds
    const allIds = new Set<string>();
    tasks.forEach(t => {
      (t.assigneeIds || []).forEach(id => allIds.add(id));
    });

    // 3️⃣ Fetch Clerk users in BATCH (Much faster than individual calls)
    const userMap: Record<string, string> = {};
    const idsToFetch = Array.from(allIds).filter(id => id && id.startsWith('user_'));

    if (idsToFetch.length > 0) {
      try {
        const clerk = await clerkClient();
        const response = await clerk.users.getUserList({
          userId: idsToFetch,
          limit: 100
        });
        response.data.forEach(u => {
          userMap[u.id] = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || u.id;
        });
      } catch (err) {
        console.error("Clerk batch fetch error:", err);
      }
    }

    // 4️⃣ Build stats per assignee
    const map: Record<string, Row> = {};
    tasks.forEach(t => {
      const bucket = normalizeStatus(t.status);
      if (bucket === "unknown") return;

      const assignees = t.assigneeIds?.length ? t.assigneeIds : ["unassigned"];

      assignees.forEach(uid => {
        const display = uid === "unassigned" ? "Unassigned" : userMap[uid] || uid;

        if (!map[uid]) {
          map[uid] = { assignee: display, todo: 0, inprogress: 0, done: 0, total: 0 };
        }

        map[uid][bucket] += 1;
        map[uid].total += 1;
      });
    });

    // 5️⃣ Filter to standard team members only (as in the original filtered requirements)
    const defaultAssignees = ["Akash Verma", "Prince", "Ravi kant", "Rishi", "Sachin", "Vikash Bidawat"];
    let data = Object.values(map).filter(d => defaultAssignees.includes(d.assignee));

    // Fallback: If no data matches the 6 names above, show all to avoid an empty dashboard
    if (data.length === 0) {
      data = Object.values(map).sort((a, b) => a.assignee.localeCompare(b.assignee));
    } else {
      data.sort((a, b) => a.assignee.localeCompare(b.assignee));
    }

    // 6️⃣ Calculate aggregated totals
    const totals = data.reduce(
      (acc, curr) => {
        acc.todo += curr.todo;
        acc.inprogress += curr.inprogress;
        acc.done += curr.done;
        return acc;
      },
      { todo: 0, inprogress: 0, done: 0 }
    );

    return NextResponse.json({ success: true, data, totals }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/tasks/stats failed:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch task stats", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
