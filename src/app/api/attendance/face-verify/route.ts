import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, getUserDetails } from "@/lib/auth-utils";
import { validateAndConsumeChallenge, checkRateLimit } from "@/lib/biometrics/challenges";
import { validateImagePayload, calculateEuclideanDistance, DEFAULT_FACE_MATCH_THRESHOLD } from "@/lib/biometrics/vectors";
import { extractFaceEmbedding } from "@/lib/biometrics/engine";
import { logBiometricAudit } from "@/lib/biometrics/audit";
import moment from "moment-timezone";

export const dynamic = "force-dynamic";

const OFFICE_LOCATION = { lat: 28.532676, lng: 77.089221 };
const GEOFENCE_RADIUS_METERS = 100;
const OFFICE_START = 7;
const OFFICE_END = 19;
const MAX_CHECKOUT_HOURS = 16;

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getISTDayRange() {
  const nowIST = moment().tz("Asia/Kolkata");
  const todayIST = nowIST.clone().startOf("day");
  const endTodayIST = todayIST.clone().endOf("day");

  return {
    startUTC: todayIST.clone().utc().toDate(),
    endUTC: endTodayIST.clone().utc().toDate(),
    dateForDB: todayIST.clone().utc().toDate(),
    nowUTC: nowIST.clone().utc().toDate(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const deviceInfo = req.headers.get("user-agent") || "unknown device";

    // 1. Rate Limiting Check (Max 6 attempts per minute per user)
    const rateCheck = checkRateLimit(`face-verify:${userId}`, 6, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait 1 minute before trying again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      challengeId,
      image,
      clientEmbedding,
      type, // 'checkIn' or 'checkOut'
      reason,
      remarks,
      lat,
      lng,
    } = body;

    if (!type || (type !== "checkIn" && type !== "checkOut")) {
      return NextResponse.json({ error: "Action type must be checkIn or checkOut." }, { status: 400 });
    }

    // 2. Validate and Atomically Consume Challenge (Anti-Replay)
    const challengeResult = validateAndConsumeChallenge(challengeId, userId, "verify");
    if (!challengeResult.valid) {
      console.warn(`[FaceVerify] Challenge validation failed for userId ${userId}:`, challengeResult.reason);
      return NextResponse.json(
        { error: challengeResult.reason || "Verification challenge expired or already consumed. Please retry capture." },
        { status: 400 }
      );
    }
    console.log(`[FaceVerify] Challenge validated successfully for userId: ${userId}`);

    // 3. Fetch Registered Face Profile
    const profile = await prisma.employeeFaceProfile.findUnique({
      where: { userId },
    });

    if (!profile || profile.status !== "REGISTERED") {
      console.warn(`[FaceVerify] No active profile for userId: ${userId}. Profile:`, profile);
      return NextResponse.json(
        {
          error: "No active face registration found. Please request Admin to enroll your face first.",
          notEnrolled: true,
        },
        { status: 403 }
      );
    }
    console.log(`[FaceVerify] Found registered profile for userId: ${userId}`);

    // 4. Validate & Decode Image Payload
    const { buffer } = validateImagePayload(image, 500 * 1024);

    // 5. Server-Side Biometric Extraction
    const detection = await extractFaceEmbedding(buffer, clientEmbedding);
    if (!detection.hasFace || !detection.embedding) {
      await logBiometricAudit({
        userId,
        actorId: userId,
        action: "VERIFY_FAILED",
        status: "FAILED",
        reason: detection.error || "No face detected in verification frame",
      });
      return NextResponse.json(
        { error: detection.error || "No clear face recognized. Please face the camera directly." },
        { status: 400 }
      );
    }

    // 6. Match Verification against Enrolled Vector
    const distance = calculateEuclideanDistance(detection.embedding, profile.embedding);
    const threshold = parseFloat(process.env.FACE_MATCH_THRESHOLD || "") || DEFAULT_FACE_MATCH_THRESHOLD;
    const isMatch = distance <= threshold;

    if (!isMatch) {
      await logBiometricAudit({
        userId,
        actorId: userId,
        action: "VERIFY_FAILED",
        status: "REJECTED",
        reason: `Distance score ${distance.toFixed(3)} exceeded threshold ${threshold}`,
        metadata: { score: distance },
      });
      return NextResponse.json(
        { error: "Face does not match registered profile. Verification failed." },
        { status: 403 }
      );
    }

    // 7. Resolve Employee Name safely
    let employeeName = "Employee";
    try {
      const u = (await getUserDetails(userId)) as any;
      employeeName = `${u?.firstName || ""} ${u?.lastName || ""}`.trim() || u?.username || u?.emailAddresses?.[0]?.emailAddress || "Employee";
    } catch {
      employeeName = "Employee";
    }

    // 8. Geofencing check
    let verified = false;
    let locationDistance: number | null = null;
    if (lat && lng) {
      locationDistance = getDistanceInMeters(lat, lng, OFFICE_LOCATION.lat, OFFICE_LOCATION.lng);
      verified = locationDistance <= GEOFENCE_RADIUS_METERS;
    }

    // 9. Existing Attendance Logic Execution (Atomic Date & Times)
    const { startUTC, endUTC, dateForDB, nowUTC } = getISTDayRange();
    const hourIST = moment().tz("Asia/Kolkata").hour();

    let attendance = await prisma.attendance.findFirst({
      where: { userId, date: { gte: startUTC, lte: endUTC } },
      orderBy: { createdAt: "desc" },
    });

    if (type === "checkIn") {
      if (hourIST < OFFICE_START || hourIST >= OFFICE_END) {
        return NextResponse.json(
          { error: "Check-in allowed only between 7 AM and 7 PM (IST)" },
          { status: 400 }
        );
      }

      if (attendance?.checkIn) {
        return NextResponse.json({ error: "Already checked in today" }, { status: 400 });
      }

      let status = !verified ? "Unverified" : "On Time";
      if (hourIST > 10 && verified) status = "Late";
      if (hourIST > 10 && !reason && verified) {
        return NextResponse.json({ error: "Late check-in requires a reason" }, { status: 400 });
      }

      attendance = await prisma.attendance.create({
        data: {
          userId,
          employeeName,
          date: dateForDB,
          checkIn: nowUTC,
          checkInReason: reason || null,
          status,
          verified: true, // Face Verified
          location: { ip, lat, lng, distance: locationDistance },
          deviceInfo,
          remarks: remarks ? `[Face Verified] ${remarks}` : "[Face Verified]",
        },
      });
    }

    if (type === "checkOut") {
      if (!attendance?.checkIn) {
        return NextResponse.json({ error: "No check-in found for today" }, { status: 400 });
      }
      if (attendance.checkOut) {
        return NextResponse.json({ error: "Already checked out today" }, { status: 400 });
      }

      const checkInTime = new Date(attendance.checkIn);
      const checkOutTime = nowUTC;
      const diffMs = checkOutTime.getTime() - checkInTime.getTime();
      const workingHours = diffMs / (1000 * 60 * 60);

      if (workingHours > MAX_CHECKOUT_HOURS) {
        return NextResponse.json(
          { error: `Check-out must be within ${MAX_CHECKOUT_HOURS} hours of check-in` },
          { status: 400 }
        );
      }

      const overtimeHours = Math.max(0, workingHours - 8);

      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: checkOutTime,
          checkOutReason: reason || null,
          workingHours,
          overtimeHours,
          verified: true,
          location: { ip, lat, lng, distance: locationDistance },
          deviceInfo,
          remarks: remarks ? `[Face Verified] ${remarks}` : "[Face Verified]",
        },
      });
    }

    // 10. Audit Success
    await logBiometricAudit({
      userId,
      actorId: userId,
      action: "VERIFY_SUCCESS",
      status: "SUCCESS",
      metadata: { action: type, distanceScore: distance },
    });

    console.log("✅ [FaceVerify SUCCESS] Biometric verification completed:", {
      userId,
      employeeName,
      action: type,
      distanceScore: Number(distance.toFixed(4)),
      geofenceVerified: verified,
      attendanceId: attendance?.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Face verification successful. ${type === "checkIn" ? "Checked In" : "Checked Out"} recorded.`,
      attendance,
    });
  } catch (error: unknown) {
    console.error("❌ [FaceVerify ERROR]:", error);
    const errMessage = error instanceof Error ? error.message : "Failed to process face verification";
    return NextResponse.json(
      { error: errMessage },
      { status: 500 }
    );
  }
}
