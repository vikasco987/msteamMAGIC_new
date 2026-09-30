import { auth as clerkAuthFn } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_super_secret_key_12345";

export async function getUnifiedUserId(req?: NextRequest): Promise<string | null> {
    // 1. Check Clerk Auth first
    try {
        const clerkAuth = await clerkAuthFn();
        if (clerkAuth && clerkAuth.userId) {
            return clerkAuth.userId;
        }
    } catch (error) {
        // Ignore Clerk auth errors and proceed to custom auth
    }

    // 2. Fallback to Custom JWT Cookie
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("custom_auth_token")?.value;
        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
            return decoded.userId;
        }
    } catch (error) {
        console.error("Custom Auth check failed:", error);
    }
    
    return null;
}

// 🚀 Drop-in replacement for Clerk's auth()
export async function auth() {
    const userId = await getUnifiedUserId();
    return { userId };
}

import { prisma } from "@/lib/prisma";

export async function getUserDetails(userId: string | null | undefined) {
    if (!userId) return null;
    
    if (userId.startsWith('custom_')) {
        try {
            const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
            if (!dbUser) return null;
            
            const nameParts = (dbUser.name || "Custom User").trim().split(" ");
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(" ");
            
            return {
                id: userId,
                emailAddresses: dbUser.email ? [{ emailAddress: dbUser.email }] : [],
                firstName,
                lastName,
                username: null,
                publicMetadata: { role: dbUser.role || "GUEST" },
                privateMetadata: {}
            };
        } catch (e) {
            console.error("Error fetching custom user:", e);
            return null;
        }
    }
    
    try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const clerk = await clerkClient();
        return await clerk.users.getUser(userId);
    } catch (e) {
        console.error("Error fetching clerk user:", e);
        return null;
    }
}
