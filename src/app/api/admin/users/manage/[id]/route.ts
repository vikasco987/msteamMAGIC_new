import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-utils";
import bcrypt from "bcryptjs";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
    try {
        const { userId: adminId } = await auth();
        if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Ensure user is master or admin
        const adminDetails = await getUserDetails(adminId);
        const adminRole = String(adminDetails?.publicMetadata?.role || "").toUpperCase();

        const adminUser = await prisma.user.findFirst({
            where: {
                OR: [{ clerkId: adminId }, { id: adminId }]
            }
        });
        const resolvedRole = (adminRole || adminUser?.role || "").toUpperCase();

        if (resolvedRole !== "MASTER" && resolvedRole !== "ADMIN") {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
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
            // Also check clerk directly in case user is in Clerk but not synced yet
            try {
                const clerkUser = await getUserDetails(targetUserId);
                if (clerkUser) {
                    const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";
                    const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User";
                    const role = String(clerkUser.publicMetadata?.role || "USER").toUpperCase();
                    
                    // Upsert into DB so they exist
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
                console.error("Error checking clerk user:", e);
            }
        }

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const profile = await prisma.employeeProfile.findUnique({
            where: { email: user.email }
        });

        return NextResponse.json({
            user,
            profile: profile || {}
        });

    } catch (error) {
        console.error("GET user error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
    try {
        const { userId: adminId } = await auth();
        if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const adminDetails = await getUserDetails(adminId);
        const adminRole = String(adminDetails?.publicMetadata?.role || "").toUpperCase();

        const adminUser = await prisma.user.findFirst({
            where: {
                OR: [{ clerkId: adminId }, { id: adminId }]
            }
        });
        const resolvedRole = (adminRole || adminUser?.role || "").toUpperCase();

        if (resolvedRole !== "MASTER" && resolvedRole !== "ADMIN") {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }

        const resolvedParams = await params;
        const targetUserId = resolvedParams.id;
        const { password, role, isDisabled, alternateEmail, alternatePhone } = await req.json();

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

        let updateData: any = {};
        
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
            
            if (!targetUserId.startsWith('custom_')) {
                try {
                    const client = await clerkClient();
                    await client.users.updateUser(user.clerkId, { password });
                } catch (e) {
                    console.error("Could not update Clerk password", e);
                }
            }
        }

        if (role) {
            updateData.role = role.toUpperCase();
            if (!targetUserId.startsWith('custom_')) {
                try {
                    const client = await clerkClient();
                    await client.users.updateUserMetadata(user.clerkId, {
                        publicMetadata: { role: role.toUpperCase() }
                    });
                } catch (e) {
                    console.error("Clerk metadata update failed", e);
                }
            }
        }

        if (typeof isDisabled !== 'undefined') {
            updateData.isDisabled = isDisabled;
            if (!targetUserId.startsWith('custom_')) {
                try {
                    const client = await clerkClient();
                    if (isDisabled) {
                        await client.users.banUser(user.clerkId);
                    } else {
                        await client.users.unbanUser(user.clerkId);
                    }
                } catch(e) {
                    console.error("Clerk ban/unban failed", e);
                }
            }
        }

        if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
                where: { id: user.id },
                data: updateData
            });
        }

        // Update employee profile if provided
        if (alternateEmail || alternatePhone) {
            const profileData: any = {};
            if (alternateEmail) profileData.alternateEmail = alternateEmail;
            if (alternatePhone) profileData.alternatePhone = alternatePhone;

            await prisma.employeeProfile.upsert({
                where: { email: user.email },
                update: profileData,
                create: {
                    email: user.email,
                    name: user.name,
                    ...profileData
                }
            });
        }

        return NextResponse.json({ success: true, message: "User updated successfully" });

    } catch (error) {
        console.error("Update user error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
