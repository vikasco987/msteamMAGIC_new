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
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const skip = (page - 1) * limit;

    const client = await getMongoClient();
    const db = client.db("Billgsoftware");
    const collection = db.collection("User");

    // First, count total distinct days to calculate total pages
    const countPipeline = [
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
        }
      },
      {
        $count: "totalDays"
      }
    ];
    
    const countResult = await collection.aggregate(countPipeline).toArray();
    const totalDays = countResult.length > 0 ? countResult[0].totalDays : 0;
    const totalPages = Math.ceil(totalDays / limit);

    // Then, fetch the paginated report
    const pipeline = [
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    const reportRaw = await collection.aggregate(pipeline).toArray();

    const report = reportRaw.map(r => ({
      date: r._id,
      count: r.count
    })).filter(r => r.date !== null);

    return NextResponse.json({
      pagination: {
        currentPage: page,
        totalPages: totalPages === 0 ? 1 : totalPages,
        totalItems: totalDays
      },
      report
    });

  } catch (error: any) {
    console.error("Error fetching POS daily report:", error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}
