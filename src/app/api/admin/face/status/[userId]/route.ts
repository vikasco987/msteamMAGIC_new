import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrMaster } from "@/lib/biometrics/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdminOrMaster();
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "User ID parameter required" }, { status: 400 });
    }

    const profile = await prisma.employeeFaceProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        status: true,
        isLocked: true,
        consentObtained: true,
        consentTimestamp: true,
        enrolledByAdminId: true,
        enrolledAt: true,
        updatedAt: true,
        // STRICT: embedding is never selected or returned!
      },
    });

    if (!profile) {
      return NextResponse.json({
        enrolled: false,
        status: "NOT_ENROLLED",
      });
    }

    return NextResponse.json({
      enrolled: true,
      profile,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Internal Server Error";
    if (errMessage === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (errMessage === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
