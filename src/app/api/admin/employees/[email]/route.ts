import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata?.role as string)?.toLowerCase() || "user";

    // Only Master can edit employee profiles completely
    if (role !== "master") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email } = params;
    if (!email) return NextResponse.json({ error: "Email parameter missing" }, { status: 400 });

    const emailKey = decodeURIComponent(email).toLowerCase().trim();
    const body = await req.json();

    const {
      name,
      phone,
      department,
      designation,
      baseSalary,
      isLocked,
      verificationStatus,
      // allow updating other fields if necessary
      address,
      permanentAddress,
      bankAccount,
      bankName,
      ifscCode,
      upiId,
      panNumber,
      aadhaarNumber
    } = body;

    const updatedProfile = await prisma.employeeProfile.upsert({
      where: { email: emailKey },
      update: {
        name: name !== undefined ? String(name).trim() : undefined,
        phone: phone !== undefined ? String(phone).trim() : undefined,
        department: department !== undefined ? String(department).trim() : undefined,
        designation: designation !== undefined ? String(designation).trim() : undefined,
        baseSalary: baseSalary !== undefined ? Number(baseSalary) : undefined,
        isLocked: isLocked !== undefined ? Boolean(isLocked) : undefined,
        verificationStatus: verificationStatus !== undefined ? String(verificationStatus) : undefined,
        address: address !== undefined ? String(address).trim() : undefined,
        permanentAddress: permanentAddress !== undefined ? String(permanentAddress).trim() : undefined,
        bankAccount: bankAccount !== undefined ? String(bankAccount).trim() : undefined,
        bankName: bankName !== undefined ? String(bankName).trim() : undefined,
        ifscCode: ifscCode !== undefined ? String(ifscCode).trim() : undefined,
        upiId: upiId !== undefined ? String(upiId).trim() : undefined,
        panNumber: panNumber !== undefined ? String(panNumber).trim() : undefined,
        aadhaarNumber: aadhaarNumber !== undefined ? String(aadhaarNumber).trim() : undefined,
      },
      create: {
        email: emailKey,
        name: name ? String(name).trim() : emailKey.split('@')[0],
        baseSalary: baseSalary !== undefined ? Number(baseSalary) : 0,
        isLocked: isLocked !== undefined ? Boolean(isLocked) : false,
        verificationStatus: verificationStatus !== undefined ? String(verificationStatus) : "PENDING",
      }
    });

    return NextResponse.json({ profile: updatedProfile, message: "Employee profile updated successfully" });
  } catch (error: any) {
    console.error("❌ PUT Admin Employee Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
