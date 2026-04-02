// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";

// export async function GET() {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // fetch all tasks created by this user
//     const tasks = await prisma.task.findMany({
//       where: { createdByClerkId: userId },
//       select: {
//         assigneeId: true,
//         assigneeName: true,
//         status: true,
//       },
//     });

//     // group tasks by assignee
//     const grouped: Record<
//       string,
//       { assigneeName: string; todo: number; inprogress: number; done: number }
//     > = {};

//     tasks.forEach((task) => {
//       const key = task.assigneeId || "unassigned";
//       if (!grouped[key]) {
//         grouped[key] = {
//           assigneeName: task.assigneeName || "Unassigned",
//           todo: 0,
//           inprogress: 0,
//           done: 0,
//         };
//       }

//       // normalize statuses
//       const status = task.status?.toLowerCase();
//       if (status === "todo") grouped[key].todo += 1;
//       else if (status === "inprogress") grouped[key].inprogress += 1;
//       else if (status === "done") grouped[key].done += 1;
//     });

//     // convert to array for frontend
//     const report = Object.values(grouped);

//     return NextResponse.json(report);
//   } catch (e: any) {
//     return NextResponse.json(
//       { error: "Internal Error", details: e.message },
//       { status: 500 }
//     );
//   }
// }







// //C:\Users\VIKASH\OneDrive\Desktop\local\syaram\msteam\src\app\api\dashboard\assignee-summary\route.ts

// import { NextResponse } from "next/server";
// import {prisma }from "@/lib/prisma";

// export async function GET() {
//   try {
//     const tasks = await prisma.task.findMany({
//       include: {
//         assignee: { select: { id: true, name: true } },
//       },
//     });

//     // Group by assignee
//     const stats: Record<
//       string,
//       { assigneeName: string; todo: number; inProgress: number; done: number }
//     > = {};

//     tasks.forEach((task) => {
//       const key = task.assignee?.id || "unassigned";
//       if (!stats[key]) {
//         stats[key] = {
//           assigneeName: task.assignee?.name || "Unassigned",
//           todo: 0,
//           inProgress: 0,
//           done: 0,
//         };
//       }

//       if (task.status === "TODO") stats[key].todo++;
//       if (task.status === "IN_PROGRESS") stats[key].inProgress++;
//       if (task.status === "DONE") stats[key].done++;
//     });

//     return NextResponse.json(Object.values(stats));
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
//   }
// }














// app/api/tasks/stats/route.ts
import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: { assignee: true },
    });

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ error: "No tasks found in DB" }, { status: 404 });
    }

    const stats: Record<
      string,
      { todo: number; inProgress: number; done: number }
    > = {};

    for (const task of tasks) {
      const assigneeName = task.assignee?.name || "Unassigned";

      if (!stats[assigneeName]) {
        stats[assigneeName] = { todo: 0, inProgress: 0, done: 0 };
      }

      if (task.status === "Todo") stats[assigneeName].todo++;
      else if (task.status === "In Progress") stats[assigneeName].inProgress++;
      else if (task.status === "Done") stats[assigneeName].done++;
    }

    return NextResponse.json({ stats }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Error in /api/tasks/stats:", err);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: err.message || err.toString(),
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}
