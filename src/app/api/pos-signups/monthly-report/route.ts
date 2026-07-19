import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { currentUser } from "@clerk/nextjs/server";

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

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await getMongoClient();
    const db = client.db("Billgsoftware");
    const collection = db.collection("User");

    const pipeline = [
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ];

    const reportRaw = await collection.aggregate(pipeline).toArray();

    const report = reportRaw.map(r => ({
      month: r._id,
      count: r.count
    })).filter(r => r.month !== null);

    return NextResponse.json({ report });

  } catch (error: any) {
    console.error("Error fetching POS monthly report:", error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}
