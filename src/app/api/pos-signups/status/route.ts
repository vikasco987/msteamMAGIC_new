import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
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

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, status } = await req.json();
    
    if (!userId || !status) {
      return NextResponse.json({ error: "User ID and status are required" }, { status: 400 });
    }

    const client = await getMongoClient();
    const db = client.db("Billgsoftware");
    const collection = db.collection("User");

    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { leadStatus: status } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating POS lead status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
