import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { auth, getUserDetails } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

let cachedClient: MongoClient | null = null;

async function getMongoClient() {
  if (cachedClient) return cachedClient;
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error("DATABASE_URL is not defined");
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

async function getUserRole(userId: string) {
  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  let roleFromClerk: string | undefined;
  try {
    if (!userId.startsWith("custom_")) {
      const clerkUser = await getUserDetails(userId);
      if (clerkUser) {
        roleFromClerk =
          (clerkUser.publicMetadata as any)?.role ||
          (clerkUser.privateMetadata as any)?.role;
      }
    }
  } catch {}
  const role = String(roleFromClerk || dbUser?.role || "user").toLowerCase();
  return { role, dbUser };
}

// GET: Fetch saved column settings for onboarding table
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await getUserRole(userId);
    const client = await getMongoClient();
    const db = client.db();

    const configDoc = await db.collection("SystemSettings").findOne({
      key: "onboarding_table_column_config",
    });

    return NextResponse.json({
      success: true,
      currentUserRole: role,
      config: configDoc?.config || null,
    });
  } catch (error: any) {
    console.error("❌ [Onboarding Columns GET Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to load column settings" }, { status: 500 });
  }
}

// POST: Save column settings (Master or Admin only)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await getUserRole(userId);
    const isMasterOrAdmin = role === "master" || role === "admin";
    if (!isMasterOrAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only Master or Admin can configure column positions, freeze and visibility" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json({ error: "Missing config in request body" }, { status: 400 });
    }

    const client = await getMongoClient();
    const db = client.db();

    await db.collection("SystemSettings").updateOne(
      { key: "onboarding_table_column_config" },
      {
        $set: {
          key: "onboarding_table_column_config",
          config,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Column configuration saved successfully",
    });
  } catch (error: any) {
    console.error("❌ [Onboarding Columns POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to save column settings" }, { status: 500 });
  }
}
