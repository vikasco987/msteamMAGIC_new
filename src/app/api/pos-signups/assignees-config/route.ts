import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

let cachedClient: MongoClient | null = null;

async function getMongoClient() {
  if (cachedClient) return cachedClient;

  const uri = process.env.POS_DATABASE_URL;
  if (!uri) {
    throw new Error("POS_DATABASE_URL is not defined in environment variables.");
  }

  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await getMongoClient();
    const db = client.db("Billgsoftware");

    const settingsDoc = await db.collection("SystemSettings").findOne({ key: "pos_allowed_assignees" });
    const allowedNames: string[] = settingsDoc?.allowedNames || [];

    // Also get all available team members from CRM prisma
    const allMembers = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({
      allowedNames,
      allMembers
    });
  } catch (error: any) {
    console.error("Error fetching allowed assignees:", error);
    return NextResponse.json({ error: "Failed to fetch assignees config" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { allowedNames } = await req.json();

    if (!Array.isArray(allowedNames)) {
      return NextResponse.json({ error: "allowedNames must be an array" }, { status: 400 });
    }

    const client = await getMongoClient();
    const db = client.db("Billgsoftware");

    await db.collection("SystemSettings").updateOne(
      { key: "pos_allowed_assignees" },
      {
        $set: {
          key: "pos_allowed_assignees",
          allowedNames,
          updatedAt: new Date(),
          updatedBy: user.id
        }
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, allowedNames });
  } catch (error: any) {
    console.error("Error saving allowed assignees:", error);
    return NextResponse.json({ error: "Failed to save assignees config" }, { status: 500 });
  }
}

