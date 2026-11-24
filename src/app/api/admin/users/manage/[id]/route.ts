import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, getUserDetails } from "@/lib/auth-utils";
import bcrypt from "bcryptjs";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const { userId: adminId } = await auth();
        if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Ensure requester is MASTER or ADMIN
        const adminDetails = await getUserDetails(adminId);
        const adminRole = String(adminDetails?.publicMetadata?.role || "").toUpperCase();

        const adminUser = await prisma.user.findFirst({
            where: adminId.length === 24
                ? { OR: [{ clerkId: adminId }, { id: adminId }] }
                : { clerkId: adminId }
        });
        const resolvedRole = (adminRole || adminUser?.role || "").toUpperCase();

        if (resolvedRole !== "MASTER" && resolvedRole !== "ADMIN") {
            return NextResponse.json({ error: "Access Denied: Only MASTER or ADMIN can view user details" }, { status: 403 });
        }

        const resolvedParams = await params;
        const targetUserId = resolvedParams.id;

        // Try lookup by clerkId or MongoDB id
        let user = await prisma.user.findUnique({
            where: { clerkId: targetUserId }
        });

        if (!user && targetUserId.length === 24) {
            user = await prisma.user.findUnique({
                where: { id: targetUserId }
            });
        }

        if (!user) {
            // Check Clerk directly in case user is in Clerk but not synced to MongoDB yet
            try {
                const clerkUser = await getUserDetails(targetUserId);
                if (clerkUser) {
                    const email = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim() || "";
                    const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User";
                    const role = String(clerkUser.publicMetadata?.role || "USER").toUpperCase();

                    user = await prisma.user.upsert({
                        where: { clerkId: targetUserId },
                        update: { email, name, role },
                        create: {
                            clerkId: targetUserId,
                            email,
                            name,
                            role
                        }
                    });
                }
            } catch (e) {
                console.error("Error checking clerk user during manage GET:", e);
            }
        }

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Fetch EmployeeProfile linked by email
        const profile = await prisma.employeeProfile.findUnique({
            where: { email: user.email }
        });

        // Fetch Recent Audit Logs for this target user (limit to last 50)
        let auditLogs: any[] = [];
        try {
            auditLogs = await prisma.userAuditLog.findMany({
                where: {
                    OR: [
                        { targetUserId: user.id },
                        { targetUserId: user.clerkId }
                    ]
                },
                orderBy: { createdAt: 'desc' },
                take: 50
            });
        } catch (e) {
            console.warn("Could not fetch user audit logs:", e);
        }

        // Fetch attendance activity summary to derive genuine active hours & activity timestamps
        const activeHours = new Array(24).fill(0);
        let recentActivities: any[] = [];
        try {
            const attendances = await prisma.attendance.findMany({
                where: { userId: user.clerkId },
                orderBy: { createdAt: 'desc' },
                take: 60,
                select: {
                    id: true,
                    type: true,
                    createdAt: true,
                    deviceInfo: true,
                    location: true
                }
            });

            attendances.forEach(att => {
                const hour = new Date(att.createdAt).getHours();
                activeHours[hour] = (activeHours[hour] || 0) + 1;
            });

            recentActivities = attendances.map(att => ({
                id: att.id,
                type: att.type || "CHECK_IN",
                createdAt: att.createdAt,
                deviceInfo: att.deviceInfo,
                location: att.location
            }));
        } catch (e) {
            console.warn("Could not calculate active hours:", e);
        }

        // Determine login provider & active session status
        const isCustomAuth = user.clerkId.startsWith("custom_");
        const authProvider = isCustomAuth ? "CUSTOM" : "CLERK";

        return NextResponse.json({
            user: {
                id: user.id,
                clerkId: user.clerkId,
                name: user.name || "User",
                email: user.email,
                phone: user.phone || "",
                role: user.role,
                isDisabled: user.isDisabled,
                isVerified: user.isVerified,
                currentDepartment: user.currentDepartment || "Digital",
                secondaryEmails: (user as any).secondaryEmails || [],
                secondaryPhones: (user as any).secondaryPhones || [],
                allowedPaths: (user as any).allowedPaths || [],
                sessionsRevokedAt: (user as any).sessionsRevokedAt || null,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                authProvider
            },
            profile: profile || {},
            auditLogs,
            activity: {
                activeHours,
                recentActivities
            }
        });

    } catch (error) {
        console.error("GET user error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const { userId: adminId } = await auth();
        if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const adminDetails = await getUserDetails(adminId);
        const adminRole = String(adminDetails?.publicMetadata?.role || "").toUpperCase();

        const adminUser = await prisma.user.findFirst({
            where: adminId.length === 24
                ? { OR: [{ clerkId: adminId }, { id: adminId }] }
                : { clerkId: adminId }
        });
        const resolvedRole = (adminRole || adminUser?.role || "").toUpperCase();

        if (resolvedRole !== "MASTER" && resolvedRole !== "ADMIN") {
            return NextResponse.json({ error: "Access Denied: Only MASTER or ADMIN can update personnel settings" }, { status: 403 });
        }

        const resolvedParams = await params;
        const targetUserId = resolvedParams.id;

        // Fetch existing user
        let user = await prisma.user.findUnique({
            where: { clerkId: targetUserId }
        });
        if (!user && targetUserId.length === 24) {
            user = await prisma.user.findUnique({
                where: { id: targetUserId }
            });
        }
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await req.json();
        const {
            name,
            email,
            phone,
            role,
            isDisabled,
            isVerified,
            department,
            designation,
            employmentStatus,
            joiningDate,
            alternateEmail,
            alternatePhone,
            emergencyContactName,
            emergencyContactPhone,
            password,
            secondaryEmails,
            secondaryPhones,
            allowedPaths,
            revokeAllSessions
        } = body;

        const updateData: any = {};
        const auditEntries: any[] = [];
        const actorName = adminUser?.name || adminDetails?.firstName || "Administrator";

        // 1. Role Change Validation & Enforcement
        if (typeof role !== 'undefined' && role !== user.role) {
            const requestedRole = String(role).toUpperCase();

            // Privilege Escalation Prevention
            if (requestedRole === "MASTER" && resolvedRole !== "MASTER") {
                return NextResponse.json({ error: "Privilege Escalation Blocked: Only MASTER can assign the MASTER role." }, { status: 403 });
            }
            if (user.role === "MASTER" && resolvedRole !== "MASTER") {
                return NextResponse.json({ error: "Privilege Escalation Blocked: Only MASTER can modify a MASTER user's role." }, { status: 403 });
            }

            updateData.role = requestedRole;

            // Sync with Clerk if it's a Clerk user
            if (!user.clerkId.startsWith("custom_")) {
                try {
                    const client = await clerkClient();
                    await client.users.updateUserMetadata(user.clerkId, {
                        publicMetadata: { role: requestedRole.toLowerCase() }
                    });
                } catch (clerkErr) {
                    console.error("Clerk role sync error:", clerkErr);
                }
            }

            auditEntries.push({
                targetUserId: user.clerkId,
                actorUserId: adminId,
                actorName,
                action: "ROLE_CHANGED",
                entityType: "User",
                fieldName: "role",
                previousValue: user.role,
                newValue: requestedRole,
                result: "SUCCESS"
            });
        }

        // 2. Status Suspension/Activation
        if (typeof isDisabled !== 'undefined' && isDisabled !== user.isDisabled) {
            if (user.role === "MASTER" && resolvedRole !== "MASTER") {
                return NextResponse.json({ error: "Access Denied: Only MASTER can suspend a MASTER administrator." }, { status: 403 });
            }

            updateData.isDisabled = Boolean(isDisabled);

            auditEntries.push({
                targetUserId: user.clerkId,
                actorUserId: adminId,
                actorName,
                action: "STATUS_TOGGLED",
                entityType: "User",
                fieldName: "isDisabled",
                previousValue: String(user.isDisabled),
                newValue: String(isDisabled),
                reason: isDisabled ? "Account Suspended by Admin" : "Account Activated by Admin",
                result: "SUCCESS"
            });
        }

        // 3. Verification status
        if (typeof isVerified !== 'undefined' && isVerified !== user.isVerified) {
            updateData.isVerified = Boolean(isVerified);
            auditEntries.push({
                targetUserId: user.clerkId,
                actorUserId: adminId,
                actorName,
                action: "VERIFICATION_CHANGED",
                entityType: "User",
                fieldName: "isVerified",
                previousValue: String(user.isVerified),
                newValue: String(isVerified),
                result: "SUCCESS"
            });
        }

        // 4. Name & Contact Phone
        if (name && name.trim() !== user.name) {
            updateData.name = name.trim();
        }
        if (typeof phone !== 'undefined' && phone !== user.phone) {
            updateData.phone = phone ? phone.trim() : null;
        }

        // 5. Password Update
        if (password && password.trim().length >= 6) {
            const hashedPassword = await bcrypt.hash(password.trim(), 10);
            updateData.password = hashedPassword;
            updateData.sessionsRevokedAt = new Date();

            auditEntries.push({
                targetUserId: user.clerkId,
                actorUserId: adminId,
                actorName,
                action: "PASSWORD_RESET",
                entityType: "User",
                fieldName: "password",
                previousValue: "[MASKED]",
                newValue: "[MASKED]",
                reason: "Password reset by administrator (sessions invalidated)",
                result: "SUCCESS"
            });
        }

        // 6. Multiple Emails & Multiple Phones
        if (Array.isArray(secondaryEmails)) {
            const sanitizedEmails = Array.from(new Set(
                secondaryEmails.map((e: string) => e.trim().toLowerCase()).filter(Boolean)
            ));
            updateData.secondaryEmails = sanitizedEmails;
        }

        if (Array.isArray(secondaryPhones)) {
            const sanitizedPhones = Array.from(new Set(
                secondaryPhones.map((p: string) => p.trim()).filter(Boolean)
            ));
            updateData.secondaryPhones = sanitizedPhones;
        }

        // 7. Granular Permission Overrides
        if (Array.isArray(allowedPaths)) {
            updateData.allowedPaths = allowedPaths;
            auditEntries.push({
                targetUserId: user.clerkId,
                actorUserId: adminId,
                actorName,
                action: "PERMISSIONS_UPDATED",
                entityType: "User",
                fieldName: "allowedPaths",
                previousValue: JSON.stringify((user as any).allowedPaths || []),
                newValue: JSON.stringify(allowedPaths),
                result: "SUCCESS"
            });
        }

        // 8. Session Revocation (Logout Everywhere)
        if (revokeAllSessions) {
            updateData.sessionsRevokedAt = new Date();
            auditEntries.push({
                targetUserId: user.clerkId,
                actorUserId: adminId,
                actorName,
                action: "SESSIONS_REVOKED",
                entityType: "User",
                fieldName: "sessionsRevokedAt",
                previousValue: "[ACTIVE_SESSIONS]",
                newValue: new Date().toISOString(),
                reason: "All active sessions revoked by administrator",
                result: "SUCCESS"
            });
        }

        // 9. Primary Email Synchronization
        const oldEmail = user.email;
        let effectiveEmail = oldEmail;
        if (email && email.toLowerCase().trim() !== oldEmail) {
            const normalizedNewEmail = email.toLowerCase().trim();

            const existingWithEmail = await prisma.user.findFirst({
                where: {
                    email: normalizedNewEmail,
                    id: { not: user.id }
                }
            });
            if (existingWithEmail) {
                return NextResponse.json({ error: "Email already in use by another user" }, { status: 400 });
            }

            updateData.email = normalizedNewEmail;
            effectiveEmail = normalizedNewEmail;

            // Synchronize across financial & employee tables
            await prisma.employeeProfile.updateMany({
                where: { email: oldEmail },
                data: { email: normalizedNewEmail }
            });
            await prisma.employeeLedger.updateMany({
                where: { employeeEmail: oldEmail },
                data: { employeeEmail: normalizedNewEmail }
            });
            await prisma.employeeAdvance.updateMany({
                where: { employeeEmail: oldEmail },
                data: { employeeEmail: normalizedNewEmail }
            });
            await prisma.employeeExpense.updateMany({
                where: { assignerEmail: oldEmail },
                data: { assignerEmail: normalizedNewEmail }
            });

            auditEntries.push({
                targetUserId: user.clerkId,
                actorUserId: adminId,
                actorName,
                action: "CONTACT_UPDATED",
                entityType: "User",
                fieldName: "email",
                previousValue: oldEmail,
                newValue: normalizedNewEmail,
                reason: "Primary email updated and synced across financial tables",
                result: "SUCCESS"
            });
        }

        // Save User model updates
        if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
                where: { id: user.id },
                data: updateData
            });
        }

        // 10. EmployeeProfile Updates
        const profileUpdates: any = {};
        if (typeof department !== 'undefined') profileUpdates.department = department;
        if (typeof designation !== 'undefined') profileUpdates.designation = designation;
        if (typeof employmentStatus !== 'undefined') profileUpdates.employmentStatus = employmentStatus;
        if (typeof joiningDate !== 'undefined') profileUpdates.joiningDate = joiningDate ? new Date(joiningDate) : null;
        if (typeof emergencyContactName !== 'undefined') profileUpdates.emergencyContactName = emergencyContactName;
        if (typeof emergencyContactPhone !== 'undefined') profileUpdates.emergencyContactPhone = emergencyContactPhone;
        if (typeof alternateEmail !== 'undefined') profileUpdates.alternateEmail = alternateEmail ? alternateEmail.toLowerCase().trim() : null;
        if (typeof alternatePhone !== 'undefined') profileUpdates.alternatePhone = alternatePhone ? alternatePhone.trim() : null;

        if (Object.keys(profileUpdates).length > 0) {
            const currentProfile = await prisma.employeeProfile.findUnique({ where: { email: effectiveEmail } });

            await prisma.employeeProfile.upsert({
                where: { email: effectiveEmail },
                update: profileUpdates,
                create: {
                    email: effectiveEmail,
                    name: updateData.name || user.name || "Employee",
                    ...profileUpdates
                }
            });

            // Privacy hardening: record field-level diffs only for values that actually changed
            for (const [key, val] of Object.entries(profileUpdates)) {
                const prevVal = currentProfile ? (currentProfile as any)[key] : null;
                const prevFormatted = prevVal instanceof Date ? prevVal.toISOString().split('T')[0] : String(prevVal || "");
                const newFormatted = val instanceof Date ? val.toISOString().split('T')[0] : String(val || "");

                if (prevFormatted !== newFormatted) {
                    auditEntries.push({
                        targetUserId: user.clerkId,
                        actorUserId: adminId,
                        actorName,
                        action: "PROFILE_UPDATED",
                        entityType: "EmployeeProfile",
                        fieldName: key,
                        previousValue: prevFormatted || "none",
                        newValue: newFormatted || "none",
                        result: "SUCCESS"
                    });
                }
            }
        }

        // 11. Write Audit Log entries
        if (auditEntries.length > 0) {
            try {
                await prisma.userAuditLog.createMany({
                    data: auditEntries
                });
            } catch (auditErr) {
                console.error("Failed to write UserAuditLog entries:", auditErr);
            }
        }

        // Fetch fresh state
        const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
        const updatedProfile = await prisma.employeeProfile.findUnique({ where: { email: effectiveEmail } });
        const recentAudit = await prisma.userAuditLog.findMany({
            where: {
                OR: [
                    { targetUserId: user.id },
                    { targetUserId: user.clerkId }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        }).catch(() => []);

        return NextResponse.json({
            success: true,
            message: "User profile & settings updated successfully",
            user: updatedUser,
            profile: updatedProfile || {},
            auditLogs: recentAudit
        });

    } catch (error) {
        console.error("Update user error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
