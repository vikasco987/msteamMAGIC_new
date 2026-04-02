// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";

// export const dynamic = "force-dynamic";

// // --- GET all remarks for a task ---
// export async function GET(
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   const { id: taskId } = params;
//   if (!taskId) {
//     return NextResponse.json({ error: "Missing task ID" }, { status: 400 });
//   }

//   try {
//     const remarks = await prisma.paymentRemark.findMany({
//       where: { taskId },
//       orderBy: { createdAt: "asc" },
//       include: {
//         task: {
//           select: {
//             id: true,
//             title: true,
//             amount: true,
//             status: true,
//             shopName: true,
//             phone: true,
//           },
//         },
//       },
//     });

//     return NextResponse.json(
//       remarks.map((r) => ({
//         id: r.id,
//         remark: r.remark,
//         createdAt: r.createdAt,
//         authorName: r.authorName || "Unknown",
//         authorEmail: r.authorEmail,
//         task: r.task
//           ? {
//               id: r.task.id,
//               title: r.task.title,
//               amount: r.task.amount,
//               status: r.task.status,
//               shopName: r.task.shopName,
//               phone: r.task.phone,
//             }
//           : null,
//       }))
//     );
//   } catch (err) {
//     console.error("❌ Fetch remarks failed:", err);
//     return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
//   }
// }

// // --- POST a new remark for a task ---
// export async function POST(
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   const { userId } = await auth();
//   const { id: taskId } = params;

//   if (!userId) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }
//   if (!taskId) {
//     return NextResponse.json({ error: "Missing task ID" }, { status: 400 });
//   }

//   try {
//     const body = await req.json();
//     const { text } = body;

//     if (!text || text.trim() === "") {
//       return NextResponse.json({ error: "Remark text required" }, { status: 400 });
//     }

//     // Get user metadata
//     const user = await prisma.user.findUnique({ where: { clerkId: userId } });

//     const remark = await prisma.paymentRemark.create({
//       data: {
//         taskId,
//         remark: text,
//         authorName: user?.email ?? "Unknown",
//         authorEmail: user?.email ?? "Unknown",
//       },
//     });

//     return NextResponse.json(remark, { status: 201 });
//   } catch (err) {
//     console.error("❌ Add remark failed:", err);
//     return NextResponse.json({ error: "Failed to add remark" }, { status: 500 });
//   }
// }










// File: src/app/api/remarks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

// --- GET all remarks for a task ---
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: taskId } = params;
  if (!taskId) {
    return NextResponse.json({ error: "Missing task ID" }, { status: 400 });
  }

  try {
    const remarks = await prisma.paymentRemark.findMany({
      where: { taskId },
      orderBy: { createdAt: "asc" },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            amount: true,
            status: true,
            shopName: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(
      remarks.map((r) => ({
        id: r.id,
        remark: r.remark,
        createdAt: r.createdAt,
        authorName: r.authorName || "Unknown",
        authorEmail: r.authorEmail || "",
        task: r.task
          ? {
              id: r.task.id,
              title: r.task.title,
              amount: r.task.amount,
              status: r.task.status,
              shopName: r.task.shopName,
              phone: r.task.phone,
            }
          : null,
      }))
    );
  } catch (err) {
    console.error("❌ Fetch remarks failed:", err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

// --- POST a new remark for a task ---
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  const { id: taskId } = params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!taskId) {
    return NextResponse.json({ error: "Missing task ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { text } = body;

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Remark text required" }, { status: 400 });
    }

    // ✅ Get Clerk user directly
    const user = await currentUser();

    const remark = await prisma.paymentRemark.create({
      data: {
        taskId,
        remark: text,
        authorName: user?.fullName || "Unknown",
        authorEmail: user?.emailAddresses[0]?.emailAddress || "",
        authorId: userId, // store Clerk userId for traceability
      },
    });

    return NextResponse.json(remark, { status: 201 });
  } catch (err) {
    console.error("❌ Add remark failed:", err);
    return NextResponse.json({ error: "Failed to add remark" }, { status: 500 });
  }
}
