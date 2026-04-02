import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.DATABASE_URL;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetDbName = searchParams.get("db"); // Optional snapshot DB name

    if (!uri) {
      return NextResponse.json({ error: "Database URI missing" }, { status: 500 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    
    // Switch to target DB if provided, otherwise use default from URI
    const db = targetDbName ? client.db(targetDbName) : client.db();
    
    // Get all collection names and counts
    const collectionsRaw = await db.listCollections().toArray();
    
    const collectionsWithCounts = await Promise.all(
      collectionsRaw
        .filter(c => !c.name.startsWith('system.'))
        .map(async (c) => {
          const count = await db.collection(c.name).countDocuments();
          return {
            name: c.name,
            count: count
          };
        })
    );
    
    await client.close();

    // Sort by name
    collectionsWithCounts.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(collectionsWithCounts);
  } catch (error: any) {
    console.error("List collections error:", error);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}
