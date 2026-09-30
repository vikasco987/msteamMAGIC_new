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
