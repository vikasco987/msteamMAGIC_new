import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { auth, getUserDetails } from "@/lib/auth-utils";
import * as XLSX from "xlsx";

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

async function getPOSDb() {
  const client = await getMongoClient();
  return client.db("Billgsoftware");
}

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("query") || "").trim();
    const statusParam = (searchParams.get("status") || "ALL").toUpperCase();
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const targetUserId = (searchParams.get("userId") || "").trim();

    const db = await getPOSDb();

    // Export single customer detail with bills
    if (targetUserId) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(targetUserId);
      const userConditions: any[] = [{ clerkId: targetUserId }];
      if (isObjectId) {
        userConditions.push({ _id: new ObjectId(targetUserId) });
      }

      const user = await db.collection("User").findOne({ $or: userConditions });
      if (!user) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      const effectiveClerkId = user.clerkId || String(user._id);
      const userKeys = Array.from(new Set([effectiveClerkId, user.clerkId, String(user._id)].filter(Boolean))) as string[];

      let customDateWhere: any = {};
      if (startDateParam || endDateParam) {
        customDateWhere.createdAt = {};
        if (startDateParam) {
          const s = new Date(startDateParam);
          s.setHours(0, 0, 0, 0);
          customDateWhere.createdAt.$gte = s;
        }
        if (endDateParam) {
          const e = new Date(endDateParam);
          e.setHours(23, 59, 59, 999);
          customDateWhere.createdAt.$lte = e;
        }
      }

      const bills = await db.collection("BillManager").find({
        clerkUserId: { $in: userKeys },
        isDeleted: false,
        ...customDateWhere,
      }).sort({ createdAt: -1 }).limit(10000).toArray();

      const headers = [
        "Bill No",
        "Customer Name",
        "Customer Phone",
        "Total (₹)",
        "Payment Mode",
        "Payment Status",
        "Date",
      ];

      const rows = bills.map((b) => [
        b.billNumber || "N/A",
        b.customerName || "N/A",
        b.customerPhone || "N/A",
        b.total || 0,
        b.paymentMode || "N/A",
        b.paymentStatus || "N/A",
        b.createdAt ? new Date(b.createdAt).toLocaleString("en-IN") : "N/A",
      ]);

      const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Customer Bills");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      const filename = `Customer_Bills_${(user.name || "Customer").replace(/\s+/g, "_")}.xlsx`;
      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }

    // Export customer funnel list
    const baseMatch: any = { role: { $ne: "ADMIN" } };

    if (query) {
      const regex = new RegExp(query, "i");
      const matchingProfiles = await db.collection("BusinessProfile").find({
        $or: [
          { businessName: regex },
          { contactPersonPhone: regex },
          { contactPersonEmail: regex },
        ]
      }, { projection: { userId: 1 } }).limit(200).toArray();

      const matchedUserIds = matchingProfiles.map((p) => p.userId).filter(Boolean);
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(query);

      const orConditions: any[] = [
        { email: regex },
        { phone: regex },
        { name: regex },
        { clerkId: regex },
      ];
      if (isObjectId) {
        orConditions.push({ _id: new ObjectId(query) });
      }
      if (matchedUserIds.length > 0) {
        orConditions.push({ clerkId: { $in: matchedUserIds } });
        const validOids = matchedUserIds.filter(id => /^[0-9a-fA-F]{24}$/.test(id)).map(id => new ObjectId(id));
        if (validOids.length > 0) {
          orConditions.push({ _id: { $in: validOids } });
        }
      }
      baseMatch.$or = orConditions;
    }

    if (startDateParam || endDateParam) {
      const dateCond: any = {};
      if (startDateParam) {
        const s = new Date(startDateParam);
        s.setHours(0, 0, 0, 0);
        dateCond.$gte = s;
      }
      if (endDateParam) {
        const e = new Date(endDateParam);
        e.setHours(23, 59, 59, 999);
        dateCond.$lte = e;
      }
      baseMatch.createdAt = dateCond;
    }

    const now = new Date();

    if (statusParam === "ACTIVE") {
      const activeProfiles = await db.collection("BusinessProfile").find({
        isPremium: true,
        isFrozen: { $ne: true },
        showPremiumPopup: { $ne: true },
        premiumEndDate: { $gte: now },
      }, { projection: { userId: 1 } }).toArray();

      const activeUserIds = activeProfiles.map(p => p.userId).filter(Boolean);
      const activeOids = activeUserIds.filter(id => /^[0-9a-fA-F]{24}$/.test(id)).map(id => new ObjectId(id));

      baseMatch.$and = [
        ...(baseMatch.$and || []),
        { $or: [{ clerkId: { $in: activeUserIds } }, { _id: { $in: activeOids } }] }
      ];
    } else if (statusParam === "EXPIRED") {
      const activeProfiles = await db.collection("BusinessProfile").find({
        isPremium: true,
        isFrozen: { $ne: true },
        showPremiumPopup: { $ne: true },
        premiumEndDate: { $gte: now },
      }, { projection: { userId: 1 } }).toArray();

      const activeUserIds = activeProfiles.map(p => p.userId).filter(Boolean);
      const activeOids = activeUserIds.filter(id => /^[0-9a-fA-F]{24}$/.test(id)).map(id => new ObjectId(id));

      baseMatch.$and = [
        ...(baseMatch.$and || []),
        { clerkId: { $nin: activeUserIds }, _id: { $nin: activeOids } }
      ];
    } else if (statusParam === "PENDING") {
      baseMatch["privateMetadata.subscriptionPendingAmount"] = { $gt: 0 };
    } else if (statusParam === "PAID") {
      const subOrders = await db.collection("SubscriptionOrder").find({
        paymentStatus: "SUCCESS",
        amount: { $gt: 0 },
      }, { projection: { clerkUserId: 1 } }).toArray();
      const orderUserKeys = Array.from(new Set(subOrders.map(o => o.clerkUserId).filter(Boolean))) as string[];
      const orderOids = orderUserKeys.filter(id => /^[0-9a-fA-F]{24}$/.test(id)).map(id => new ObjectId(id));

      baseMatch.$and = [
        ...(baseMatch.$and || []),
        {
          $or: [
            { "privateMetadata.subscriptionAmountPaid": { $gt: 0 } },
            { clerkId: { $in: orderUserKeys } },
            { _id: { $in: orderOids } },
          ]
        },
        {
          $or: [
            { "privateMetadata.subscriptionPendingAmount": { $exists: false } },
            { "privateMetadata.subscriptionPendingAmount": 0 },
            { "privateMetadata.subscriptionPendingAmount": null },
            { "privateMetadata.subscriptionPendingAmount": { $lte: 0 } },
          ]
        }
      ];
    }

    const users = await db.collection("User").aggregate([
      { $match: baseMatch },
      { $sort: { createdAt: -1 } },
      { $limit: 5000 },
      {
        $lookup: {
          from: "BusinessProfile",
          let: { uClerk: "$clerkId", uId: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$userId", "$$uClerk"] },
                    { $eq: ["$userId", "$$uId"] }
                  ]
                }
              }
            },
            { $limit: 1 }
          ],
          as: "profile"
        }
      },
      { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } }
    ]).toArray();

    const userKeys = users.flatMap((u: any) => [u.clerkId, String(u._id)].filter(Boolean));
    const subOrders = await db.collection("SubscriptionOrder").find({
      clerkUserId: { $in: userKeys },
      paymentStatus: "SUCCESS",
    }, {
      projection: { clerkUserId: 1, amount: 1 },
      sort: { createdAt: -1 }
    }).toArray();

    const subOrderMap = new Map<string, number>();
    for (const order of subOrders) {
      if (!subOrderMap.has(order.clerkUserId)) {
        subOrderMap.set(order.clerkUserId, order.amount);
      }
    }

    const formatDateNumeric = (dateInput: string | Date | null | undefined): string => {
      if (!dateInput) return "N/A";
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return "N/A";
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const headers = [
      "Sr No",
      "Customer / Contact Person",
      "Business Name",
      "Mobile Number",
      "Email Address",
      "Customer / Clerk ID",
      "Swiggy Business ID",
      "Zomato Business ID",
      "GST Number",
      "Business Address",
      "Subscription Status",
      "Startup Date",
      "End Date",
      "Subscription Price (₹)",
      "Subscription Pending Amount (₹)",
    ];

    const rows = users.map((u: any, idx: number) => {
      const profile = u.profile || null;
      const meta = u.privateMetadata || {};

      const hasValidFutureEnd = profile?.premiumEndDate ? new Date(profile.premiumEndDate) >= now : false;
      const isFrozen = Boolean(profile?.isFrozen);
      const isPopupForced = Boolean(profile?.showPremiumPopup);
      const isActuallyPremium = Boolean(profile?.isPremium) && hasValidFutureEnd && !isFrozen && !isPopupForced;

      let subscriptionStatus = "Trial / Expired";
      if (isFrozen) {
        subscriptionStatus = "Frozen";
      } else if (isActuallyPremium) {
        subscriptionStatus = "Active Premium";
      }

      let subPriceStr = "Free / Trial";
      if (meta.subscriptionAmountPaid !== undefined && meta.subscriptionAmountPaid !== null && Number(meta.subscriptionAmountPaid) > 0) {
        subPriceStr = `₹${meta.subscriptionAmountPaid}`;
      } else if (u.clerkId && subOrderMap.has(u.clerkId)) {
        subPriceStr = `₹${subOrderMap.get(u.clerkId)}`;
      } else if (subOrderMap.has(String(u._id))) {
        subPriceStr = `₹${subOrderMap.get(String(u._id))}`;
      }

      let pendingPriceStr = "₹0";
      if (meta.subscriptionPendingAmount !== undefined && meta.subscriptionPendingAmount !== null && Number(meta.subscriptionPendingAmount) > 0) {
        pendingPriceStr = `₹${meta.subscriptionPendingAmount}`;
      }

      const addressStr = profile?.businessAddress
        ? `${profile.businessAddress}${profile.district ? `, ${profile.district}` : ""}${profile.state ? `, ${profile.state}` : ""}${profile.pinCode ? ` - ${profile.pinCode}` : ""}`
        : "No address specified";

      return [
        idx + 1,
        profile?.contactPersonName || u.name || "N/A",
        profile?.businessName || u.name || "Business",
        profile?.contactPersonPhone || u.phone || "N/A",
        u.email || "N/A",
        u.clerkId || String(u._id),
        profile?.swiggyBusinessId || "Not Added",
        profile?.zomatoBusinessId || "Not Added",
        profile?.gstNumber || "Not Registered",
        addressStr,
        subscriptionStatus,
        profile?.trialStartedAt ? formatDateNumeric(profile.trialStartedAt) : "N/A",
        profile?.premiumEndDate ? formatDateNumeric(profile.premiumEndDate) : "No Active Plan",
        subPriceStr,
        pendingPriceStr,
      ];
    });

    const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    sheet["!cols"] = [
      { wch: 8 },
      { wch: 28 },
      { wch: 32 },
      { wch: 18 },
      { wch: 32 },
      { wch: 36 },
      { wch: 22 },
      { wch: 22 },
      { wch: 20 },
      { wch: 45 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 24 },
      { wch: 24 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Customer Funnel");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const filename = `Customer_Funnel_Export_${statusParam}_${new Date().toISOString().split("T")[0]}.xlsx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error: any) {
    console.error("ADMIN CUSTOMER FUNNEL EXCEL EXPORT ERROR:", error);
    return NextResponse.json({ error: "Failed to export customer funnel report" }, { status: 500 });
  }
}
