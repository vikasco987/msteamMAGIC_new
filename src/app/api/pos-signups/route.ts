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
    const dateParam = searchParams.get('date');

    const client = await getMongoClient();
    const db = client.db("Billgsoftware");
    const collection = db.collection("User");

    // Fetch total signups
    const totalUsers = await collection.countDocuments();

    // Fetch today's signups
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const usersToday = await collection.countDocuments({
      createdAt: { $gte: today, $lte: todayEnd }
    });

    // Fetch last 7 days signups
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const usersLast7Days = await collection.countDocuments({
      createdAt: { $gte: last7Days, $lte: todayEnd }
    });

    // Fetch last 30 days signups
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);
    const usersLast30Days = await collection.countDocuments({
      createdAt: { $gte: last30Days, $lte: todayEnd }
    });

    // If a specific date is requested, filter by that date
    let query: any = {};
    if (dateParam) {
      const selectedDate = new Date(dateParam);
      selectedDate.setHours(0, 0, 0, 0);
      const selectedDateEnd = new Date(selectedDate);
      selectedDateEnd.setHours(23, 59, 59, 999);
      query = {
        createdAt: { $gte: selectedDate, $lte: selectedDateEnd }
      };
    } else {
      // By default, let's fetch the last 100 users to prevent massive payloads
      query = {};
    }

    const recentUsersCursor = collection.find(query).sort({ createdAt: -1 }).limit(100);
    const recentUsersRaw = await recentUsersCursor.toArray();

    // Map to a cleaner format and convert ObjectIds/Dates to string
    const recentUsers = recentUsersRaw.map(u => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isVerified: u.isVerified,
      createdAt: u.createdAt ? u.createdAt.toISOString() : null
    }));

    return NextResponse.json({
      metrics: {
        total: totalUsers,
        today: usersToday,
        last7Days: usersLast7Days,
        last30Days: usersLast30Days
      },
      users: recentUsers
    });

  } catch (error: any) {
    console.error("Error fetching POS signups:", error);
    return NextResponse.json({ error: "Failed to fetch signups" }, { status: 500 });
  }
}
