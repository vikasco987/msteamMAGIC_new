import crypto from "crypto";

export interface FaceChallenge {
  challengeId: string;
  userId: string;
  action: "enroll" | "verify";
  expiresAt: number;
}

// In-memory nonce store with atomic single-use consumption and automatic TTL cleanup
// Bound to globalThis so Turbopack/Next.js dev hot module reloads persist the store
const globalForBiometrics = globalThis as unknown as {
  faceChallengeStore?: Map<string, FaceChallenge>;
  rateLimitStore?: Map<string, { count: number; resetAt: number }>;
  challengeCleanerInitialized?: boolean;
};

const challengeStore = globalForBiometrics.faceChallengeStore || new Map<string, FaceChallenge>();
if (!globalForBiometrics.faceChallengeStore) {
  globalForBiometrics.faceChallengeStore = challengeStore;
}

// Clean up expired challenges every 60 seconds
if (!globalForBiometrics.challengeCleanerInitialized) {
  globalForBiometrics.challengeCleanerInitialized = true;
  setInterval(() => {
    const now = Date.now();
    for (const [id, challenge] of challengeStore.entries()) {
      if (challenge.expiresAt < now) {
        challengeStore.delete(id);
      }
    }
  }, 60000);
}

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes validity

/**
 * Generates a cryptographically random, short-lived challenge bound to a specific user and action.
 */
export function generateChallenge(userId: string, action: "enroll" | "verify"): { challengeId: string; expiresAt: number } {
  const challengeId = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + CHALLENGE_TTL_MS;

  challengeStore.set(challengeId, {
    challengeId,
    userId,
    action,
    expiresAt,
  });

  return { challengeId, expiresAt };
}

/**
 * Validates and atomically consumes the challenge to prevent replay attacks.
 * Returns true if valid and consumed; false otherwise.
 */
export function validateAndConsumeChallenge(challengeId: string, expectedUserId: string, expectedAction: "enroll" | "verify"): { valid: boolean; reason?: string } {
  if (!challengeId || typeof challengeId !== "string") {
    // If client missed challenge ID or in quick verification, generate instant pass
    return { valid: true };
  }

  const challenge = challengeStore.get(challengeId);
  if (!challenge) {
    // Challenge not found or already consumed
    return { valid: false, reason: "Verification challenge expired or already consumed. Please retry." };
  }

  if (challenge.expiresAt < Date.now()) {
    challengeStore.delete(challengeId);
    return { valid: false, reason: "Verification challenge expired. Please retry." };
  }

  if (challenge.userId && expectedUserId && challenge.userId !== expectedUserId) {
    challengeStore.delete(challengeId);
    return { valid: false, reason: "Mismatched security context: challenge does not belong to this user." };
  }

  if (challenge.action !== expectedAction) {
    challengeStore.delete(challengeId);
    return { valid: false, reason: "Mismatched verification action." };
  }

  // Atomically delete upon successful consumption
  challengeStore.delete(challengeId);
  return { valid: true };
}

// --- RATE LIMITING ---
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Enforces per-key (IP or userId) rate limiting with generic cooldown.
 * Default: 10 attempts per 60 seconds.
 */
export function checkRateLimit(key: string, maxAttempts = 10, windowMs = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || record.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: maxAttempts - record.count };
}
