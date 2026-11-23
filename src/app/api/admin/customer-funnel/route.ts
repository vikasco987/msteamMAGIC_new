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
    const targetUserId = (searchParams.get("userId") || "").trim();
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const db = await getPOSDb();

    // 1. Detailed View for a single Customer/Merchant
    if (targetUserId) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(targetUserId);
      const userConditions: any[] = [{ clerkId: targetUserId }];
      if (isObjectId) {
        userConditions.push({ _id: new ObjectId(targetUserId) });
      }

      const user = await db.collection("User").findOne({
        $or: userConditions,
      }, {
        projection: {
          _id: 1,
          clerkId: 1,
          name: 1,
          email: 1,
          phone: 1,
          role: 1,
          createdAt: 1,
          isDisabled: 1,
          privateMetadata: 1,
        }
      });

      if (!user) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      const effectiveClerkId = user.clerkId || String(user._id);
      const userKeys = Array.from(new Set([effectiveClerkId, user.clerkId, String(user._id)].filter(Boolean))) as string[];

      // Business Profile
      const profile = await db.collection("BusinessProfile").findOne({
        userId: { $in: userKeys }
      }, {
        sort: { updatedAt: -1 }
      });

      // Subscription Orders
      const subscriptionOrders = await db.collection("SubscriptionOrder").find({
        clerkUserId: { $in: userKeys },
      }).sort({ createdAt: -1 }).limit(20).toArray();

      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      const startOfWeek = new Date(now);
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now);
      startOfMonth.setDate(startOfMonth.getDate() - 30);
      startOfMonth.setHours(0, 0, 0, 0);

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

      const billPage = Math.max(parseInt(searchParams.get("billPage") || "1"), 1);
      const billLimit = Math.max(parseInt(searchParams.get("billLimit") || "20"), 1);
      const billSkip = (billPage - 1) * billLimit;

      // Aggregates for All Bills
      const [allBillsAgg, filteredBillsAgg, todayBillsAgg, weekBillsAgg, monthBillsAgg, recentBills] = await Promise.all([
        db.collection("BillManager").aggregate([
          { $match: { clerkUserId: { $in: userKeys }, isDeleted: false } },
          { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$total" }, avg: { $avg: "$total" } } }
        ]).toArray(),
        db.collection("BillManager").aggregate([
          { $match: { clerkUserId: { $in: userKeys }, isDeleted: false, ...customDateWhere } },
          { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$total" }, avg: { $avg: "$total" } } }
        ]).toArray(),
        db.collection("BillManager").aggregate([
          { $match: { clerkUserId: { $in: userKeys }, isDeleted: false, createdAt: { $gte: startOfToday } } },
          { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$total" } } }
        ]).toArray(),
        db.collection("BillManager").aggregate([
          { $match: { clerkUserId: { $in: userKeys }, isDeleted: false, createdAt: { $gte: startOfWeek } } },
          { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$total" } } }
        ]).toArray(),
        db.collection("BillManager").aggregate([
          { $match: { clerkUserId: { $in: userKeys }, isDeleted: false, createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$total" } } }
        ]).toArray(),
        db.collection("BillManager").find({
          clerkUserId: { $in: userKeys },
          isDeleted: false,
          ...customDateWhere,
        }, {
          projection: {
            _id: 1,
            billNumber: 1,
            total: 1,
            paymentMode: 1,
            paymentStatus: 1,
            createdAt: 1,
            customerName: 1,
            customerPhone: 1,
          }
        }).sort({ createdAt: -1 }).skip(billSkip).limit(billLimit).toArray()
      ]);

      const allStats = allBillsAgg[0] || { count: 0, total: 0, avg: 0 };
      const filteredStats = filteredBillsAgg[0] || { count: 0, total: 0, avg: 0 };
      const todayStats = todayBillsAgg[0] || { count: 0, total: 0 };
      const weekStats = weekBillsAgg[0] || { count: 0, total: 0 };
      const monthStats = monthBillsAgg[0] || { count: 0, total: 0 };

      // Daily trend for the last 14 days
      const trendDays = 14;
      const trendStartDate = new Date(now);
      trendStartDate.setDate(trendStartDate.getDate() - trendDays);
      trendStartDate.setHours(0, 0, 0, 0);

      const rawTrendBills = await db.collection("BillManager").find({
        clerkUserId: { $in: userKeys },
        isDeleted: false,
        createdAt: { $gte: trendStartDate },
      }, {
        projection: { total: 1, createdAt: 1 }
      }).toArray();

      const trends = Array.from({ length: trendDays }).map((_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (trendDays - 1 - i));
        d.setHours(0, 0, 0, 0);
        const nextD = new Date(d);
        nextD.setDate(nextD.getDate() + 1);

        const dayBills = rawTrendBills.filter((b) => {
          const bDate = new Date(b.createdAt);
          return bDate >= d && bDate < nextD;
        });

        return {
          date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
          billCount: dayBills.length,
          revenue: Math.round(dayBills.reduce((acc, curr) => acc + (curr.total || 0), 0)),
        };
      });

      return NextResponse.json({
        success: true,
        user: { ...user, id: String(user._id) },
        profile: profile ? { ...profile, id: String(profile._id) } : null,
        subscriptionOrders: subscriptionOrders.map((o) => ({ ...o, id: String(o._id) })),
        stats: {
          totalBills: allStats.count || 0,
          totalRevenue: allStats.total || 0,
          avgTicketValue: Math.round(allStats.avg || 0),
          today: {
            bills: todayStats.count || 0,
            revenue: todayStats.total || 0,
          },
          week: {
            bills: weekStats.count || 0,
            revenue: weekStats.total || 0,
          },
          month: {
            bills: monthStats.count || 0,
            revenue: monthStats.total || 0,
          },
          filteredRange: (startDateParam || endDateParam) ? {
            bills: filteredStats.count || 0,
            revenue: filteredStats.total || 0,
            avgTicketValue: Math.round(filteredStats.avg || 0),
          } : null,
        },
        trends,
        recentBills: recentBills.map((b) => ({ ...b, id: String(b._id) })),
        billPagination: {
          total: filteredStats.count || 0,
          page: billPage,
          limit: billLimit,
          pages: Math.ceil((filteredStats.count || 0) / billLimit) || 1,
        },
      });
    }

    // 2. Search / List Mode
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const limit = Math.max(parseInt(searchParams.get("limit") || "50"), 1);
    const statusParam = (searchParams.get("status") || "ALL").toUpperCase();
    const skip = (page - 1) * limit;

    const baseMatch: any = {
      role: { $ne: "ADMIN" },
    };

    if (query) {
      const regex = new RegExp(query, "i");
      // Find matching profile userIds as well
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

    // Date Range Filter (User createdAt or profile trialStartedAt)
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

    // Subscription status filters
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
        {
          $or: [
            { clerkId: { $in: activeUserIds } },
            { _id: { $in: activeOids } }
          ]
        }
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
        {
          clerkId: { $nin: activeUserIds },
          _id: { $nin: activeOids }
        }
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

    const [users, totalFiltered] = await Promise.all([
      db.collection("User").aggregate([
        { $match: baseMatch },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
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
      ]).toArray(),
      db.collection("User").countDocuments(baseMatch)
    ]);

    // Subscription orders for batch
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

    const results = users.map((u: any) => {
      const profile = u.profile || null;
      const meta = u.privateMetadata || {};

      let subPrice: number | null = null;
      if (meta.subscriptionAmountPaid !== undefined && meta.subscriptionAmountPaid !== null && Number(meta.subscriptionAmountPaid) > 0) {
        subPrice = Number(meta.subscriptionAmountPaid);
      } else if (u.clerkId && subOrderMap.has(u.clerkId)) {
        subPrice = subOrderMap.get(u.clerkId)!;
      } else if (subOrderMap.has(String(u._id))) {
        subPrice = subOrderMap.get(String(u._id))!;
      }

      const hasValidFutureEnd = profile?.premiumEndDate ? new Date(profile.premiumEndDate) >= now : false;
      const isFrozen = Boolean(profile?.isFrozen);
      const isPopupForced = Boolean(profile?.showPremiumPopup);
      const isActuallyPremium = Boolean(profile?.isPremium) && hasValidFutureEnd && !isFrozen && !isPopupForced;

      return {
        id: String(u._id),
        clerkId: u.clerkId || String(u._id),
        name: profile?.contactPersonName || u.name || "N/A",
        email: u.email || "N/A",
        phone: u.phone || profile?.contactPersonPhone || "N/A",
        businessName: profile?.businessName || u.name || "Business",
        swiggyBusinessId: profile?.swiggyBusinessId || null,
        zomatoBusinessId: profile?.zomatoBusinessId || null,
        gstNumber: profile?.gstNumber || null,
        address: profile?.businessAddress
          ? `${profile.businessAddress}${profile.district ? `, ${profile.district}` : ""}${profile.state ? `, ${profile.state}` : ""}${profile.pinCode ? ` - ${profile.pinCode}` : ""}`
          : null,
        isPremium: isActuallyPremium,
        trialStartedAt: profile?.trialStartedAt || null,
        premiumEndDate: profile?.premiumEndDate || null,
        isFrozen: isFrozen,
        showPremiumPopup: isPopupForced,
        subscriptionPrice: subPrice,
        subscriptionPendingAmount: meta.subscriptionPendingAmount !== undefined && meta.subscriptionPendingAmount !== null && Number(meta.subscriptionPendingAmount) > 0
          ? Number(meta.subscriptionPendingAmount)
          : null,
        createdAt: u.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      customers: results,
      total: totalFiltered,
      pagination: {
        total: totalFiltered,
        page,
        limit,
        pages: Math.ceil(totalFiltered / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("ADMIN CUSTOMER FUNNEL API ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message || String(error) },
      { status: 500 }
    );
  }
}
