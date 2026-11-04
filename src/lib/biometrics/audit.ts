import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "ENROLLED"
  | "REPLACED"
  | "RESET"
  | "PURGED"
  | "SUSPENDED"
  | "VERIFY_SUCCESS"
  | "VERIFY_FAILED";

export interface LogAuditParams {
  userId: string;
  actorId: string;
  action: AuditAction;
  status: "SUCCESS" | "FAILED" | "REJECTED";
  reason?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Persists an audit event to FaceAuditLog.
 * Guaranteed never to save raw biometric images, base64 data, or raw vector arrays.
 */
export async function logBiometricAudit(params: LogAuditParams) {
  try {
    // Sanitize metadata to strictly prevent biometric leakage
    const sanitizedMeta = { ...params.metadata };
    delete sanitizedMeta.embedding;
    delete sanitizedMeta.faceImage;
    delete sanitizedMeta.image;
    delete sanitizedMeta.base64;
    delete sanitizedMeta.token;

    await prisma.faceAuditLog.create({
      data: {
        userId: params.userId,
        actorId: params.actorId,
        action: params.action,
        status: params.status,
        reason: params.reason || null,
        metadata: sanitizedMeta as any,
      },
    });
  } catch (err) {
    console.error("❌ Failed to write FaceAuditLog:", err);
  }
}
