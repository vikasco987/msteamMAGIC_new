import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrMaster } from "@/lib/biometrics/auth";
import { getUserDetails } from "@/lib/auth-utils";
import { validateImagePayload, isValidEmbedding, calculateEuclideanDistance } from "@/lib/biometrics/vectors";
import { extractFaceEmbedding } from "@/lib/biometrics/engine";
import { logBiometricAudit } from "@/lib/biometrics/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let adminUserId = "unknown";
  try {
    const admin = await requireAdminOrMaster();
    adminUserId = admin.userId;

    const body = await req.json();
    const {
      targetUserId,
      image,
      clientEmbedding,
      consentConfirmed,
      replaceExisting,
      reason,
    } = body;

    // 1. Mandatory Consent Check
    if (!consentConfirmed) {
      return NextResponse.json(
        { error: "Informed biometric consent must be explicitly confirmed before enrollment." },
        { status: 400 }
      );
    }

    // 2. Validate Target Employee
    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json({ error: "Target employee selection is required." }, { status: 400 });
    }

    const targetUser = await getUserDetails(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: "Target employee not found." }, { status: 404 });
    }

    // 3. Check Existing Face Profile
    const existingProfile = await prisma.employeeFaceProfile.findUnique({
      where: { userId: targetUserId },
    });

    if (existingProfile && !replaceExisting) {
      return NextResponse.json(
        {
          error: "Employee already has a registered face profile. Admin replacement workflow required.",
          requiresReplacement: true,
        },
        { status: 409 }
      );
    }

    if (existingProfile && replaceExisting && !reason) {
      return NextResponse.json(
        { error: "A mandatory justification reason is required when replacing an existing face profile." },
        { status: 400 }
      );
    }

    // 4. Validate & Process Image Frame
    const { buffer } = validateImagePayload(image, 500 * 1024);

    // 5. Server-Side Biometric Extraction
    const detection = await extractFaceEmbedding(buffer, clientEmbedding);

    if (!detection.hasFace || !detection.embedding) {
      await logBiometricAudit({
        userId: targetUserId,
        actorId: adminUserId,
        action: "ENROLLED",
        status: "FAILED",
        reason: detection.error || "No clear face detected in frame",
      });
      return NextResponse.json(
        { error: detection.error || "No face detected. Please ensure proper lighting and centered face." },
        { status: 400 }
      );
    }

    if (detection.multipleFaces) {
      return NextResponse.json(
        { error: "Multiple faces detected. Exactly one person must be in view." },
        { status: 400 }
      );
    }

    const newEmbedding = detection.embedding;

    // 6. Duplicate Collision Screening against all active profiles
    const allProfiles = await prisma.employeeFaceProfile.findMany({
      where: {
        status: "REGISTERED",
        userId: { not: targetUserId },
      },
      select: { userId: true, embedding: true },
    });

    for (const p of allProfiles) {
      if (isValidEmbedding(p.embedding)) {
        const dist = calculateEuclideanDistance(newEmbedding, p.embedding);
        if (dist < 0.35) { // Very close match
          await logBiometricAudit({
            userId: targetUserId,
            actorId: adminUserId,
            action: "ENROLLED",
            status: "REJECTED",
            reason: `Potential face collision with another employee (distance: ${dist.toFixed(3)})`,
          });
          return NextResponse.json(
            {
              error: "Biometric collision detected: This face is already enrolled under another staff account.",
            },
            { status: 409 }
          );
        }
      }
    }

    // 7. Persist or Replace Face Profile
    let profile;
    const now = new Date();

    if (existingProfile) {
      profile = await prisma.employeeFaceProfile.update({
        where: { id: existingProfile.id },
        data: {
          embedding: newEmbedding,
          status: "REGISTERED",
          isLocked: true,
          consentObtained: true,
          consentTimestamp: now,
          consentRecordedBy: adminUserId,
          enrolledByAdminId: adminUserId,
          updatedAt: now,
        },
      });

      await logBiometricAudit({
        userId: targetUserId,
        actorId: adminUserId,
        action: "REPLACED",
        status: "SUCCESS",
        reason: reason || "Admin re-enrollment",
      });
    } else {
      profile = await prisma.employeeFaceProfile.create({
        data: {
          userId: targetUserId,
          embedding: newEmbedding,
          status: "REGISTERED",
          isLocked: true,
          consentObtained: true,
          consentTimestamp: now,
          consentRecordedBy: adminUserId,
          enrolledByAdminId: adminUserId,
        },
      });

      await logBiometricAudit({
        userId: targetUserId,
        actorId: adminUserId,
        action: "ENROLLED",
        status: "SUCCESS",
        reason: "Initial enrollment",
      });
    }

    // Response strictly strips out the embedding array
    return NextResponse.json({
      success: true,
      message: "Face enrolled successfully and locked.",
      profile: {
        id: profile.id,
        userId: profile.userId,
        status: profile.status,
        isLocked: profile.isLocked,
        consentObtained: profile.consentObtained,
        enrolledAt: profile.enrolledAt,
      },
    });
  } catch (error: unknown) {
    console.error("❌ Face Enrollment Error:", error);
    const errMessage = error instanceof Error ? error.message : "Failed to process face enrollment";

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
