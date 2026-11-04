import { NextRequest, NextResponse } from "next/server";
import { getUnifiedUserId } from "@/lib/auth-utils";
import { generateChallenge, checkRateLimit } from "@/lib/biometrics/challenges";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUnifiedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rateCheck = checkRateLimit(`challenge:${userId}:${ip}`, 20, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action === "enroll" ? "enroll" : "verify";

    const challenge = generateChallenge(userId, action);

    return NextResponse.json({
      success: true,
      challengeId: challenge.challengeId,
      expiresAt: challenge.expiresAt,
    });
  } catch (error: any) {
    console.error("❌ Challenge generation error:", error?.message || error, error?.stack);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
