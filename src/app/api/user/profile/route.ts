import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getUnifiedUserId } from "@/lib/auth-utils";
import { getUserDetails } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUnifiedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userEmail = "";
    let userName = "";
    let userImageUrl = "";

    if (userId.startsWith("custom_")) {
        // Fetch from Prisma for custom user
        const customUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!customUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
        userEmail = customUser.email;
        userName = customUser.name || customUser.email.split('@')[0];
        userImageUrl = "";
    } else {
        // Fetch from Clerk
        const client = await clerkClient();
        const user = (await getUserDetails(userId));
        userEmail = user.emailAddresses?.[0]?.emailAddress || "";
        userName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || userEmail.split('@')[0];
        userImageUrl = user.imageUrl || "";
    }

    if (!userEmail) {
      return NextResponse.json({ error: "No email associated with user" }, { status: 400 });
    }

    const profile = await prisma.employeeProfile.findUnique({
      where: { email: userEmail.toLowerCase().trim() },
    });

    const salaryHistory = await prisma.employeeExpense.findMany({
      where: {
        assignerEmail: userEmail.toLowerCase().trim(),
        category: "Salary"
      },
      orderBy: { date: 'desc' }
    });

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    const userInfo = {
      clerkId: userId,
      email: userEmail,
      fullName: userName,
      imageUrl: userImageUrl,
      role: dbUser?.role || "user",
      profile: profile || null,
      salaryHistory,
      isDisabled: dbUser?.isDisabled || false
    };

    return NextResponse.json({ user: userInfo });
  } catch (error: any) {
    console.error("❌ GET Employee Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUnifiedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userEmail = "";
    let userName = "";

    if (userId.startsWith("custom_")) {
        const customUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!customUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
        userEmail = customUser.email;
        userName = customUser.name || customUser.email.split('@')[0];
    } else {
        const client = await clerkClient();
        const user = (await getUserDetails(userId));
        userEmail = user.emailAddresses?.[0]?.emailAddress || "";
        userName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || userEmail.split('@')[0];
    }

    if (!userEmail) {
      return NextResponse.json({ error: "No email associated with user" }, { status: 400 });
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
      upiQrUrl,
      bankProofUrl,
      panNumber,
      panUrl,
      aadhaarNumber,
      aadhaarUrl,
      profilePhotoUrl,
      emergencyContactName,
      emergencyContactPhone,
      address,
      joiningDate,
      dob,
      bloodGroup,
      alternatePhone,
      permanentAddress,
      maritalStatus,
      gender,
    } = body;

    const emailKey = userEmail.toLowerCase().trim();

    // Check if profile exists and is locked
    const existingProfile = await prisma.employeeProfile.findUnique({
      where: { email: emailKey },
      select: { isLocked: true }
    });

    if (existingProfile?.isLocked) {
      return NextResponse.json({ error: "Your profile is locked and cannot be edited. Please contact your manager." }, { status: 403 });
    }

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
        upiQrUrl: upiQrUrl ? String(upiQrUrl).trim() : undefined,
        bankProofUrl: bankProofUrl ? String(bankProofUrl).trim() : undefined,
        panNumber: panNumber ? String(panNumber).trim() : undefined,
        panUrl: panUrl ? String(panUrl).trim() : undefined,
        aadhaarNumber: aadhaarNumber ? String(aadhaarNumber).trim() : undefined,
        aadhaarUrl: aadhaarUrl ? String(aadhaarUrl).trim() : undefined,
        profilePhotoUrl: profilePhotoUrl ? String(profilePhotoUrl).trim() : undefined,
        emergencyContactName: emergencyContactName ? String(emergencyContactName).trim() : undefined,
        emergencyContactPhone: emergencyContactPhone ? String(emergencyContactPhone).trim() : undefined,
        address: address ? String(address).trim() : undefined,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        dob: dob ? new Date(dob) : undefined,
        bloodGroup: bloodGroup ? String(bloodGroup).trim() : undefined,
        alternatePhone: alternatePhone ? String(alternatePhone).trim() : undefined,
        permanentAddress: permanentAddress ? String(permanentAddress).trim() : undefined,
        maritalStatus: maritalStatus ? String(maritalStatus).trim() : undefined,
        gender: gender ? String(gender).trim() : undefined,
      },
      create: {
        email: emailKey,
        name: name ? String(name).trim() : userName,
        phone: phone ? String(phone).trim() : null,
        department: department ? String(department).trim() : "Sales",
        designation: designation ? String(designation).trim() : null,
        accountHolderName: accountHolderName ? String(accountHolderName).trim() : null,
        bankAccount: bankAccount ? String(bankAccount).trim() : null,
        ifscCode: ifscCode ? String(ifscCode).trim() : null,
        bankName: bankName ? String(bankName).trim() : null,
        upiId: upiId ? String(upiId).trim() : null,
        upiQrUrl: upiQrUrl ? String(upiQrUrl).trim() : null,
        bankProofUrl: bankProofUrl ? String(bankProofUrl).trim() : null,
        panNumber: panNumber ? String(panNumber).trim() : null,
        panUrl: panUrl ? String(panUrl).trim() : null,
        aadhaarNumber: aadhaarNumber ? String(aadhaarNumber).trim() : null,
        aadhaarUrl: aadhaarUrl ? String(aadhaarUrl).trim() : null,
        profilePhotoUrl: profilePhotoUrl ? String(profilePhotoUrl).trim() : null,
        emergencyContactName: emergencyContactName ? String(emergencyContactName).trim() : null,
        emergencyContactPhone: emergencyContactPhone ? String(emergencyContactPhone).trim() : null,
        address: address ? String(address).trim() : null,
        joiningDate: joiningDate ? new Date(joiningDate) : null,
        dob: dob ? new Date(dob) : null,
        bloodGroup: bloodGroup ? String(bloodGroup).trim() : null,
        alternatePhone: alternatePhone ? String(alternatePhone).trim() : null,
        permanentAddress: permanentAddress ? String(permanentAddress).trim() : null,
        maritalStatus: maritalStatus ? String(maritalStatus).trim() : null,
        gender: gender ? String(gender).trim() : null,
      },
    });

    return NextResponse.json({ message: "Profile updated successfully", profile: updatedProfile });
  } catch (error: any) {
    console.error("❌ PUT Employee Profile Error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
