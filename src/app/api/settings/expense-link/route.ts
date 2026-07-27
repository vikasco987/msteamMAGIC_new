import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { users } from "@clerk/clerk-sdk-node";
import crypto from "crypto";

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

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getUserRole(userId);
    if (role !== "master") {
      return NextResponse.json({ error: "Forbidden: Master access required" }, { status: 403 });
    }

    const settings = await prisma.businessSettings.findFirst();
    return NextResponse.json({ token: settings?.publicExpenseToken || null });
  } catch (error) {
    console.error("GET Expense Link Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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

    const newToken = crypto.randomBytes(16).toString("hex");

    const existingSettings = await prisma.businessSettings.findFirst();

    if (existingSettings) {
      await prisma.businessSettings.update({
        where: { id: existingSettings.id },
        data: { publicExpenseToken: newToken }
      });
    } else {
      await prisma.businessSettings.create({
        data: { publicExpenseToken: newToken }
      });
    }

    return NextResponse.json({ token: newToken });
  } catch (error) {
    console.error("POST Expense Link Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
