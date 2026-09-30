import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { name, email, phone, password } = await req.json();

        if (!email || !password || !name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (existingUser) {
            if (existingUser.password) {
                return NextResponse.json({ error: "Email already registered with custom password." }, { status: 400 });
            }
            // Update existing Clerk user with a custom password and phone
            await prisma.user.update({
                where: { email: normalizedEmail },
                data: {
                    password: hashedPassword,
                    phone: phone || existingUser.phone,
                    // They must be re-verified by the master for the new custom login
                    isVerified: false 
                }
            });
            return NextResponse.json({ success: true, message: "Account updated. Waiting for Master approval." });
        }

        // New User
        const customId = `custom_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
        
        await prisma.user.create({
            data: {
                clerkId: customId,
                email: normalizedEmail,
                name: name.trim(),
                phone: phone ? phone.trim() : null,
                password: hashedPassword,
                role: "GUEST",
                isVerified: false
            }
        });

        return NextResponse.json({ success: true, message: "Account created successfully. Waiting for Master approval." });

    } catch (error: any) {
        console.error("Signup error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
