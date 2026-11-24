import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, getUserDetails } from "@/lib/auth-utils";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "magicscale-secret-key-12345";

export async function POST(req: Request) {
    try {
        const { userId: adminId } = await auth();
        if (!adminId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const adminDetails = await getUserDetails(adminId);
        const adminRole = String(adminDetails?.publicMetadata?.role || "").toUpperCase();

        const adminUser = await prisma.user.findFirst({
            where: adminId.length === 24
                ? { OR: [{ clerkId: adminId }, { id: adminId }] }
                : { clerkId: adminId }
        });
        const resolvedRole = (adminRole || adminUser?.role || "").toUpperCase();

        // 🛡️ Security Check: MASTER-only by default
        if (resolvedRole !== "MASTER") {
            return NextResponse.json({ error: "Forbidden: Only MASTER administrators can impersonate users" }, { status: 403 });
        }

        const body = await req.json();
        const { targetUserId, reason } = body;

        if (!targetUserId) {
            return NextResponse.json({ error: "Target User ID is required" }, { status: 400 });
        }
        if (!reason || reason.trim().length < 5) {
            return NextResponse.json({ error: "A mandatory valid reason (min 5 chars) is required for impersonation" }, { status: 400 });
        }

        // Fetch target user
        let targetUser = await prisma.user.findUnique({
            where: { clerkId: targetUserId }
        });

        if (!targetUser && targetUserId.length === 24) {
            targetUser = await prisma.user.findUnique({
                where: { id: targetUserId }
            });
        }

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (targetUser.isDisabled) {
            return NextResponse.json({ error: "Cannot impersonate a suspended or disabled account" }, { status: 403 });
        }

        // 🔒 Generate time-limited secure token for target user (2 hours)
        const tokenPayload = {
            id: targetUser.id,
            userId: targetUser.id,
            clerkId: targetUser.clerkId,
            email: targetUser.email,
            name: targetUser.name,
            role: targetUser.role,
            isImpersonated: true,
            impersonatedBy: adminId,
            impersonatorName: adminUser?.name || adminDetails?.firstName || "Master Administrator",
            reason: reason.trim()
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "2h" });

        // Set secure auth cookie
        const cookieStore = await cookies();
        cookieStore.set("custom_auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 7200,
            sameSite: "lax"
        });

        // 📜 Persist Audit Log
        try {
            await prisma.userAuditLog.create({
                data: {
                    targetUserId: targetUser.clerkId,
                    actorUserId: adminId,
                    actorName: adminUser?.name || adminDetails?.firstName || "Master Administrator",
                    action: "IMPERSONATION_STARTED",
                    entityType: "User",
                    fieldName: "impersonation",
                    previousValue: "DIRECT_SESSION",
                    newValue: `IMPERSONATED_BY_${adminId}`,
                    reason: reason.trim(),
                    result: "SUCCESS"
                }
            });
        } catch (auditErr) {
            console.error("Failed to write audit log for impersonation:", auditErr);
        }

        return NextResponse.json({
            success: true,
            redirect: "/",
            message: `Successfully authenticated as ${targetUser.name || targetUser.email}`
        });

    } catch (error: any) {
        console.error("Impersonation error:", error);
        return NextResponse.json({ error: "Impersonation failed: " + error.message }, { status: 500 });
    }
}
