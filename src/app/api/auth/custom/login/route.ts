import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_super_secret_key_12345";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (!user || !user.password) {
            return NextResponse.json({ error: "Invalid credentials or account not setup for custom login." }, { status: 401 });
        }

        if (user.isDisabled) {
            return NextResponse.json({ error: "Your account has been disabled." }, { status: 403 });
        }

        if (!user.isVerified) {
            return NextResponse.json({ error: "Your account is pending verification by the Master." }, { status: 403 });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.clerkId, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const response = NextResponse.json({ success: true, message: "Logged in successfully" });
        
        // Set HTTP-only cookie
        response.cookies.set({
            name: 'custom_auth_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;

    } catch (error: any) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
