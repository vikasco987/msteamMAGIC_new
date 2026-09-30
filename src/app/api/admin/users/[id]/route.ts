import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-utils";
import bcrypt from "bcryptjs";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const { userId: adminId } = await auth();
        if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Ensure user is master or admin
        const adminUser = await prisma.user.findUnique({ where: { clerkId: adminId } });
        if (adminUser?.role !== "MASTER" && adminUser?.role !== "ADMIN") {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }

        const targetUserId = params.id;
        const user = await prisma.user.findUnique({
            where: { clerkId: targetUserId }
        });

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

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const { userId: adminId } = await auth();
        if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const adminUser = await prisma.user.findUnique({ where: { clerkId: adminId } });
        if (adminUser?.role !== "MASTER" && adminUser?.role !== "ADMIN") {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }

        const targetUserId = params.id;
        const { password, role, isDisabled, alternateEmail, alternatePhone } = await req.json();

        const user = await prisma.user.findUnique({
            where: { clerkId: targetUserId }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let updateData: any = {};
        
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
            
            // Note: If using Clerk, we'd also try to update Clerk's password if the user is a clerk user.
            // But if we're migrating towards custom auth, we'll just update it in DB.
            if (!targetUserId.startsWith('custom_')) {
                try {
                    await clerkClient.users.updateUser(targetUserId, { password });
                } catch (e) {
                    console.error("Could not update Clerk password", e);
                    // It's okay, maybe they just use custom login now.
                }
            }
        }

        if (role) {
            updateData.role = role;
            if (!targetUserId.startsWith('custom_')) {
                try {
                    await clerkClient.users.updateUserMetadata(targetUserId, {
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
                    if (isDisabled) {
                        await clerkClient.users.banUser(targetUserId);
                    } else {
                        await clerkClient.users.unbanUser(targetUserId);
                    }
                } catch(e) {
                    console.error("Clerk ban/unban failed", e);
                }
            }
        }

        if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
                where: { clerkId: targetUserId },
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
