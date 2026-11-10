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

export const DEFAULT_KAM_TEAMS = [
  {
    teamName: "Retention",
    tlName: "Retention Lead",
    members: ["Himanshu Sharma", "Vishal Sood", "Ansh Kushwaha", "Rishav kumar", "Chahat"],
  },
  {
    teamName: "Onboarding",
    tlName: "Himanshu Sharma",
    members: ["Mahek", "Preeti", "Sakshi", "Akansh", "Rishab"],
  },
  {
    teamName: "Digital",
    tlName: "Vishal Sood",
    members: ["Yogesh", "Sharvan", "Priyanshu", "Kapil", "Prince"],
  },
];

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await getMongoClient();
    const db = client.db();
    const doc = await db.collection("SystemSettings").findOne({ key: "kam_report_teams" });

    const teams = doc && Array.isArray(doc.teams) && doc.teams.length > 0 ? doc.teams : DEFAULT_KAM_TEAMS;

    // Also fetch all active users so client can pick from dropdown
    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true, clerkId: true, currentDepartment: true, role: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ teams, allUsers });
  } catch (err: any) {
    console.error("GET /api/kam/reports/teams error:", err);
    return NextResponse.json({ error: err.message || "Failed to load teams" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await getUserDetails(userId);
    const role = String(
      (clerkUser.publicMetadata as any)?.role ||
      (clerkUser.privateMetadata as any)?.role ||
      ""
    ).toLowerCase();

    // Allow admin, master, tl
    if (role !== "admin" && role !== "master" && role !== "tl") {
      return NextResponse.json({ error: "Forbidden: Only Admin / TL can modify team assignments" }, { status: 403 });
    }

    const body = await req.json();
    const { teams } = body;

    if (!Array.isArray(teams)) {
      return NextResponse.json({ error: "teams must be an array" }, { status: 400 });
    }

    const client = await getMongoClient();
    const db = client.db();

    await db.collection("SystemSettings").updateOne(
      { key: "kam_report_teams" },
      {
        $set: {
          key: "kam_report_teams",
          teams,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, teams });
  } catch (err: any) {
    console.error("POST /api/kam/reports/teams error:", err);
    return NextResponse.json({ error: err.message || "Failed to save teams" }, { status: 500 });
  }
}

