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

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const clerkId = searchParams.get('clerkId');
    const type = searchParams.get('type'); // 'bills' or 'items'

    if (!userId && !clerkId) {
      return NextResponse.json({ error: "userId or clerkId is required" }, { status: 400 });
    }
    
    if (type !== 'bills' && type !== 'items') {
      return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }

    const client = await getMongoClient();
    const db = client.db("Billgsoftware");
    
    const conditions: any[] = [];
    if (userId) conditions.push({ userId });
    if (clerkId) conditions.push({ clerkId });
    if (userId && clerkId) {
       conditions.push({ userId: clerkId });
       conditions.push({ clerkId: userId });
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query = { $or: conditions };

    if (type === 'bills') {
      const total = await db.collection("Bill").countDocuments(query);
      const billsRaw = await db.collection("Bill").find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
      
      const bills = billsRaw.map(b => ({
        id: b._id.toString(),
        billNo: b.billNo || b.invoiceNo || b.billNumber || "—",
        total: b.total,
        customerName: b.customerName || b.contactPerson || "Unknown",
        paymentMode: b.paymentMode || b.paymentMethod || "—",
        createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : null
      }));
      
      return NextResponse.json({ 
        success: true, 
        data: { 
          bills, 
          total, 
          totalPages: Math.ceil(total / limit),
          currentPage: page 
        } 
      });
    } else {
      const total = await db.collection("Item").countDocuments(query);
      
      // Use aggregate to lookup Category name
      const itemsRaw = await db.collection("Item").aggregate([
        { $match: query },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "Category",
            let: { catId: "$categoryId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", { $toObjectId: "$$catId" }] } } }
            ],
            as: "category"
          }
        }
      ]).toArray();
      
      const items = itemsRaw.map(i => ({
        id: i._id.toString(),
        name: i.name,
        price: i.sellingPrice || i.price,
        categoryName: i.category && i.category.length > 0 ? i.category[0].name : "Uncategorized",
        taxStatus: i.taxStatus || "Without Tax",
        isActive: i.isActive,
        createdAt: i.createdAt ? new Date(i.createdAt).toISOString() : null
      }));
      
      return NextResponse.json({ 
        success: true, 
        data: { 
          items, 
          total, 
          totalPages: Math.ceil(total / limit),
          currentPage: page 
        } 
      });
    }

  } catch (error: any) {
    console.error("Error fetching user details:", error);
    return NextResponse.json({ error: "Failed to fetch details" }, { status: 500 });
  }
}
