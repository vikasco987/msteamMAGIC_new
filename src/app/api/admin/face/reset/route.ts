import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrMaster } from "@/lib/biometrics/auth";
import { logBiometricAudit } from "@/lib/biometrics/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let adminUserId = "unknown";
  try {
    const admin = await requireAdminOrMaster();
    adminUserId = admin.userId;

    const body = await req.json();
    const { targetUserId, reason, actionType } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "Target employee ID is required." }, { status: 400 });
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { error: "A valid explanation reason (minimum 5 characters) is required." },
        { status: 400 }
      );
    }

    const existingProfile = await prisma.employeeFaceProfile.findUnique({
      where: { userId: targetUserId },
    });

    if (!existingProfile) {
      return NextResponse.json({ error: "No face profile found for this employee." }, { status: 404 });
    }

    if (actionType === "purge") {
      // Complete biometric purge (e.g. employee consent withdrawal or termination)
      await prisma.employeeFaceProfile.delete({
        where: { id: existingProfile.id },
      });

      await logBiometricAudit({
        userId: targetUserId,
        actorId: adminUserId,
        action: "PURGED",
        status: "SUCCESS",
        reason,
      });

      return NextResponse.json({
        success: true,
        message: "Biometric profile purged permanently. Live record removed.",
      });
    }

    // Default reset action: Suspends profile so attendance cannot be marked with face
    const updated = await prisma.employeeFaceProfile.update({
      where: { id: existingProfile.id },
      data: {
        status: "SUSPENDED",
        updatedAt: new Date(),
      },
    });

    await logBiometricAudit({
      userId: targetUserId,
      actorId: adminUserId,
      action: "RESET",
      status: "SUCCESS",
      reason,
    });

    return NextResponse.json({
      success: true,
      message: "Face profile suspended/reset successfully. Employee must be re-enrolled before face attendance can resume.",
      profile: {
        id: updated.id,
        userId: updated.userId,
        status: updated.status,
        isLocked: updated.isLocked,
      },
    });
  } catch (error: unknown) {
    console.error("❌ Face Reset Error:", error);
    const errMessage = error instanceof Error ? error.message : "Failed to process face reset";

    if (errMessage === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (errMessage === "FORBIDDEN") {
      return NextResponse.json({ error: "Master or Admin permission required" }, { status: 403 });
    }

    return NextResponse.json(
      { error: errMessage },
      { status: 500 }
    );
  }
}
