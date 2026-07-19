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
    const searchQuery = searchParams.get('search');
    const isExport = searchParams.get('export') === 'true';

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

    // Advanced Global Search Logic
    let searchFilter: any = null;
    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, 'i');
      
      // 1. Search in BusinessProfile for phone number matching the search
      const matchedProfiles = await db.collection("BusinessProfile").find({
        contactPersonPhone: { $regex: searchRegex }
      }).toArray();
      
      const matchedClerkIds = new Set<string>();
      matchedProfiles.forEach(p => {
        if (p.userId) matchedClerkIds.add(p.userId);
        if (p.createdBy) matchedClerkIds.add(p.createdBy);
      });

      // 2. Build the $or condition for User collection
      searchFilter = {
        $or: [
          { name: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
          { clerkId: { $in: Array.from(matchedClerkIds) } }
        ]
      };
    }

    // Combine date filter and search filter
    let query: any = {};
    const conditions = [];

    if (dateParam) {
      const selectedDate = new Date(dateParam);
      selectedDate.setHours(0, 0, 0, 0);
      const selectedDateEnd = new Date(selectedDate);
      selectedDateEnd.setHours(23, 59, 59, 999);
      conditions.push({ createdAt: { $gte: selectedDate, $lte: selectedDateEnd } });
    }

    if (searchFilter) {
      conditions.push(searchFilter);
    }

    if (conditions.length > 0) {
      query = { $and: conditions };
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = isExport ? 5000 : 20; // If export, fetch a large amount (e.g. 5000)
    const skip = isExport ? 0 : (page - 1) * limit;

    const totalFiltered = await collection.countDocuments(query);
    const totalPages = Math.ceil(totalFiltered / limit);

    const recentUsersCursor = collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const recentUsersRaw = await recentUsersCursor.toArray();

    // Fetch Business Profiles to get phone numbers
    const clerkIds = recentUsersRaw.map(u => u.clerkId).filter(Boolean);
    const businessProfiles = await db.collection("BusinessProfile").find({
      $or: [
        { userId: { $in: clerkIds } },
        { createdBy: { $in: clerkIds } }
      ]
    }).toArray();

    // Create a map for quick lookup
    const phoneMap = new Map();
    businessProfiles.forEach(bp => {
      if (bp.contactPersonPhone) {
        if (bp.userId) phoneMap.set(bp.userId, bp.contactPersonPhone);
        if (bp.createdBy) phoneMap.set(bp.createdBy, bp.contactPersonPhone);
      }
    });

    // Map to a cleaner format and convert ObjectIds/Dates to string
    const recentUsers = recentUsersRaw.map(u => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      phone: u.phone || phoneMap.get(u.clerkId) || null,
      role: u.role,
      isVerified: u.isVerified,
      posNotes: u.posNotes || "",
      createdAt: u.createdAt ? u.createdAt.toISOString() : null
    }));

    return NextResponse.json({
      metrics: {
        total: totalUsers,
        today: usersToday,
        last7Days: usersLast7Days,
        last30Days: usersLast30Days
      },
      pagination: {
        currentPage: page,
        totalPages: totalPages === 0 ? 1 : totalPages,
        totalItems: totalFiltered
      },
      users: recentUsers
    });

  } catch (error: any) {
    console.error("Error fetching POS signups:", error);
    return NextResponse.json({ error: "Failed to fetch signups" }, { status: 500 });
  }
}
