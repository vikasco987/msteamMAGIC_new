import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const shops = await prisma.task.findMany({ select: { shopName: true }, distinct: ["shopName"] });
    const assignees = await prisma.task.findMany({ select: { assigneeName: true }, distinct: ["assigneeName"] });
    const tags = await prisma.task.findMany({ select: { tags: true } });

    const uniqueTags = Array.from(new Set(tags.flatMap((t) => t.tags || [])));

    return NextResponse.json({
      shopNames: shops.map((s) => s.shopName).filter(Boolean),
      assigneeNames: assignees.map((a) => a.assigneeName).filter(Boolean),
      tags: uniqueTags,
    });
  } catch (error) {
    console.error("Filter options error:", error);
    return NextResponse.json({ error: "Failed to load filter options" }, { status: 500 });
  }
}
