import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses?.[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json({ error: "No email associated with Clerk user" }, { status: 400 });
    }

    const profile = await prisma.employeeProfile.findUnique({
      where: { email: userEmail.toLowerCase().trim() },
    });

    const userInfo = {
      clerkId: userId,
      email: userEmail,
      fullName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || userEmail.split('@')[0],
      imageUrl: user.imageUrl,
      profile: profile || null,
    };

    return NextResponse.json({ user: userInfo });
  } catch (error: any) {
    console.error("❌ GET Employee Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses?.[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json({ error: "No email associated with Clerk user" }, { status: 400 });
    }

    const body = await req.json();
    const {
      name,
      phone,
      department,
      designation,
      accountHolderName,
      bankAccount,
      ifscCode,
      bankName,
      upiId,
      panNumber,
      aadhaarNumber,
      emergencyContactName,
      emergencyContactPhone,
      address,
    } = body;

    const emailKey = userEmail.toLowerCase().trim();

    const updatedProfile = await prisma.employeeProfile.upsert({
      where: { email: emailKey },
      update: {
        name: name ? String(name).trim() : undefined,
        phone: phone ? String(phone).trim() : undefined,
        department: department ? String(department).trim() : undefined,
        designation: designation ? String(designation).trim() : undefined,
        accountHolderName: accountHolderName ? String(accountHolderName).trim() : undefined,
        bankAccount: bankAccount ? String(bankAccount).trim() : undefined,
        ifscCode: ifscCode ? String(ifscCode).trim() : undefined,
        bankName: bankName ? String(bankName).trim() : undefined,
        upiId: upiId ? String(upiId).trim() : undefined,
        panNumber: panNumber ? String(panNumber).trim() : undefined,
        aadhaarNumber: aadhaarNumber ? String(aadhaarNumber).trim() : undefined,
        emergencyContactName: emergencyContactName ? String(emergencyContactName).trim() : undefined,
        emergencyContactPhone: emergencyContactPhone ? String(emergencyContactPhone).trim() : undefined,
        address: address ? String(address).trim() : undefined,
      },
      create: {
        email: emailKey,
        name: name ? String(name).trim() : user.firstName || emailKey.split('@')[0],
        phone: phone ? String(phone).trim() : null,
        department: department ? String(department).trim() : "Sales",
        designation: designation ? String(designation).trim() : null,
        accountHolderName: accountHolderName ? String(accountHolderName).trim() : null,
        bankAccount: bankAccount ? String(bankAccount).trim() : null,
        ifscCode: ifscCode ? String(ifscCode).trim() : null,
        bankName: bankName ? String(bankName).trim() : null,
        upiId: upiId ? String(upiId).trim() : null,
        panNumber: panNumber ? String(panNumber).trim() : null,
        aadhaarNumber: aadhaarNumber ? String(aadhaarNumber).trim() : null,
        emergencyContactName: emergencyContactName ? String(emergencyContactName).trim() : null,
        emergencyContactPhone: emergencyContactPhone ? String(emergencyContactPhone).trim() : null,
        address: address ? String(address).trim() : null,
      },
    });

    return NextResponse.json({ message: "Profile updated successfully", profile: updatedProfile });
  } catch (error: any) {
    console.error("❌ PUT Employee Profile Error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
