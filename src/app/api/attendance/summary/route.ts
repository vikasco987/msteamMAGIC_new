import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET() {
  try {
    const summaries = await prisma.attendanceSummary.findMany({
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(summaries);
  } catch (error) {
    console.error("Error fetching summary:", error);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}
