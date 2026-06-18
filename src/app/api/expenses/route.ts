import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { users } from "@clerk/clerk-sdk-node";

export const dynamic = "force-dynamic";

interface UserPublicMetadata {
  role?: string;
}

interface UserPrivateMetadata {
  role?: string;
}

async function getUserRole(userId: string): Promise<string | null> {
  try {
    const user = await users.getUser(userId);
    return (
      (user.publicMetadata as UserPublicMetadata)?.role ||
      (user.privateMetadata as UserPrivateMetadata)?.role ||
      null
    );
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getUserRole(userId);
    if (role !== "master") {
      return NextResponse.json({ error: "Forbidden: Master access required" }, { status: 403 });
    }

    const body = await req.json();
    const { title, amount, date, remarks } = body;

    if (!title || amount === undefined || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const expense = await prisma.generalExpense.create({
      data: {
        title,
        amount: parseFloat(amount),
        date: new Date(date),
        remarks: remarks || null
      }
    });

    return NextResponse.json({ message: "Expense created successfully", expense }, { status: 201 });

  } catch (error) {
    console.error("❌ Add Expense Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getUserRole(userId);
    if (role !== "master") {
      return NextResponse.json({ error: "Forbidden: Master access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Expense ID is required" }, { status: 400 });
    }

    await prisma.generalExpense.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Expense deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error("❌ Delete Expense Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
