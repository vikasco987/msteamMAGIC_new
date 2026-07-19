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

    const { userIds } = await req.json();
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "An array of userIds is required" }, { status: 400 });
    }

    const client = await getMongoClient();
    const db = client.db("Billgsoftware");
    const collection = db.collection("User");

    const objectIds = userIds.map(id => {
      try {
        return new ObjectId(id);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    if (objectIds.length === 0) {
      return NextResponse.json({ error: "Invalid userIds provided" }, { status: 400 });
    }

    const result = await collection.updateMany(
      { _id: { $in: objectIds } },
      { $set: { isVerified: true } }
    );

    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error: any) {
    console.error("Error bulk verifying users:", error);
    return NextResponse.json({ error: "Failed to bulk verify users" }, { status: 500 });
  }
}
