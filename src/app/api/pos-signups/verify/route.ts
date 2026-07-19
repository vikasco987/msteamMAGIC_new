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
    // Verify that the person making this request is authorized in the CRM
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const client = await getMongoClient();
    const db = client.db("Billgsoftware");
    const collection = db.collection("User");

    // Update the user's isVerified status to true
    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isVerified: true } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found in POS database" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "User verified successfully" });
  } catch (error: any) {
    console.error("Error verifying POS user:", error);
    return NextResponse.json({ error: "Failed to verify user" }, { status: 500 });
  }
}
