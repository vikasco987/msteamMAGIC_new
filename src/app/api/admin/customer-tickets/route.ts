import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { auth, getUserDetails } from "@/lib/auth-utils";

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

async function getSupportTicketsCollection() {
  const client = await getMongoClient();
  const db = client.db("Billgsoftware");
  return db.collection("SupportTicket");
}

// GET /api/admin/customer-tickets - Fetch all tickets across POS software
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userDetails = await getUserDetails(userId);
    const role = String(userDetails?.publicMetadata?.role || userDetails?.privateMetadata?.role || "user").toLowerCase();
    
    // Allow master and admin
    if (role !== "master" && role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const collection = await getSupportTicketsCollection();

    const filter: any = {};

    if (category && category !== "All") {
      filter.category = { $regex: new RegExp(`^${category.trim()}$`, "i") };
    }

    if (status && status !== "All") {
      const normalizedStatus = status.trim().toUpperCase().replace(/\s+/g, "_");
      filter.status = normalizedStatus;
    }

    if (search && search.trim()) {
      const s = search.trim();
      filter.$or = [
        { ticketId: { $regex: s, $options: "i" } },
        { client: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        { remarks: { $regex: s, $options: "i" } },
        { subCategory: { $regex: s, $options: "i" } }
      ];
    }

    const tickets = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();

    // Stats calculation
    const totalCount = await collection.countDocuments();
    const openCount = await collection.countDocuments({ status: "OPEN" });
    const inProgressCount = await collection.countDocuments({ status: "IN_PROGRESS" });
    const closedCount = await collection.countDocuments({ status: "CLOSED" });

    const formatted = tickets.map((t: any) => ({
      id: t.ticketId || t._id.toString(),
      ticketId: t.ticketId || t._id.toString(),
      _id: t._id.toString(),
      category: t.category,
      subCategory: t.subCategory,
      client: t.client || t.email || "client@kravy.in",
      email: t.email,
      phone: t.phone,
      remarks: t.remarks,
      status: t.status === "CLOSED" ? "Closed" : t.status === "IN_PROGRESS" ? "In Progress" : "Open",
      adminRemark: t.adminRemark || "",
      resolvedAt: t.resolvedAt ? new Date(t.resolvedAt).toISOString() : null,
      mediaUrl: t.mediaUrl || null,
      mediaType: t.mediaType || null,
      mediaName: t.mediaName || null,
      createdAt: t.createdAt
        ? new Date(t.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : "Recent",
      rawCreatedAt: t.createdAt
    }));

    return NextResponse.json({
      success: true,
      tickets: formatted,
      stats: {
        total: totalCount,
        open: openCount,
        inProgress: inProgressCount,
        closed: closedCount
      }
    });
  } catch (error: any) {
    console.error("GET /api/admin/customer-tickets error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch tickets" }, { status: 500 });
  }
}

// PATCH /api/admin/customer-tickets - Update ticket status & resolution remark
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userDetails = await getUserDetails(userId);
    const role = String(userDetails?.publicMetadata?.role || userDetails?.privateMetadata?.role || "user").toLowerCase();
    
    if (role !== "master" && role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { ticketId, status, adminRemark } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
    }

    const collection = await getSupportTicketsCollection();

    // Match by ticketId or _id
    const matchQuery: any = {
      $or: [
        { ticketId: ticketId }
      ]
    };
    if (ObjectId.isValid(ticketId)) {
      matchQuery.$or.push({ _id: new ObjectId(ticketId) });
    }

    const updateDoc: any = {
      $set: {
        updatedAt: new Date()
      }
    };

    if (status) {
      const normalizedStatus = status.trim().toUpperCase().replace(/\s+/g, "_");
      updateDoc.$set.status = normalizedStatus;
      if (normalizedStatus === "CLOSED") {
        updateDoc.$set.resolvedAt = new Date();
      } else {
        updateDoc.$set.resolvedAt = null;
      }
    }

    if (adminRemark !== undefined) {
      updateDoc.$set.adminRemark = adminRemark;
    }

    const result = await collection.updateOne(matchQuery, updateDoc);

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Ticket updated successfully",
      updatedStatus: status,
      adminRemark
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/customer-tickets error:", error);
    return NextResponse.json({ error: error.message || "Failed to update ticket" }, { status: 500 });
  }
}
