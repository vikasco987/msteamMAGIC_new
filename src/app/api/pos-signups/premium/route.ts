import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserDetails } from "@/lib/auth-utils";

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

// GET: Fetch detailed premium information for a specific customer/user
export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const clerkId = searchParams.get("clerkId");

    if (!userId && !clerkId) {
      return NextResponse.json({ error: "Missing customer identifier" }, { status: 400 });
    }

    const client = await getMongoClient();
    const db = client.db("Billgsoftware");

    // Fetch user details
    let query: any = {};
    if (userId) {
      try {
        query._id = new ObjectId(userId);
      } catch (e) {
        query._id = userId;
      }
    } else if (clerkId) {
      query.clerkId = clerkId;
    }

    const posUser = await db.collection("User").findOne(query);
    const resolvedClerkId = posUser?.clerkId || clerkId;

    // Fetch BusinessProfile
    let profile = null;
    if (resolvedClerkId) {
      profile = await db.collection("BusinessProfile").findOne({
        $or: [{ userId: resolvedClerkId }, { createdBy: resolvedClerkId }]
      });
    }

    // Fetch subscription history if any
    let subscriptionOrders: any[] = [];
    if (resolvedClerkId) {
      subscriptionOrders = await db.collection("SubscriptionOrder").find({
        clerkUserId: resolvedClerkId
      }).sort({ createdAt: -1 }).toArray();
    }

    const now = new Date();
    let status = "Not Activated";
    let daysRemaining = null;

    if (profile && profile.premiumEndDate) {
      const endDate = new Date(profile.premiumEndDate);
      const diff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 0) {
        status = "Active";
        daysRemaining = diff;
      } else {
        status = "Expired";
        daysRemaining = 0;
      }
    } else if (profile && profile.isPremium) {
      status = "Active";
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: posUser ? posUser._id.toString() : userId,
        name: posUser?.name || "Customer",
        email: posUser?.email || "—",
        phone: posUser?.phone || profile?.contactPersonPhone || "—",
        clerkId: resolvedClerkId,
        businessName: profile?.businessName || "—"
      },
      premium: {
        status,
        isPremium: Boolean(profile?.isPremium),
        startDate: profile?.trialStartedAt ? new Date(profile.trialStartedAt).toISOString() : null,
        endDate: profile?.premiumEndDate ? new Date(profile.premiumEndDate).toISOString() : null,
        daysRemaining,
        amountPaid: (posUser?.privateMetadata as any)?.subscriptionAmountPaid ?? null,
        businessProfileId: profile ? profile._id.toString() : null
      },
      history: subscriptionOrders.map(o => ({
        id: o._id.toString(),
        merchantOrderId: o.merchantOrderId,
        amount: o.amount,
        paymentStatus: o.paymentStatus,
        paymentMode: o.paymentMode || o.items?.[0]?.paymentMode || "—",
        paymentReference: o.paymentReference || o.items?.[0]?.paymentReference || "—",
        items: o.items || [],
        createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null
      }))
    });
  } catch (error: any) {
    console.error("Error fetching customer premium details:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

// POST: Activate or Renew Premium for a customer
export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Allow ADMIN, MASTER, SELLER, TL
    const dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } });
    const clerkUser = await getUserDetails(user.id);
    const roleFromClerk = (clerkUser.publicMetadata as any)?.role || (clerkUser.privateMetadata as any)?.role;
    const normalizedRole = String(roleFromClerk || dbUser?.role || "user").toLowerCase();
    const isTL = (dbUser as any)?.isTeamLeader || normalizedRole === "tl";
    const isAuthorized =
      normalizedRole === "admin" ||
      normalizedRole === "master" ||
      normalizedRole === "seller" ||
      isTL ||
      (dbUser as any)?.hasFullKamAccess;

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to activate premium." }, { status: 403 });
    }

    const body = await req.json();
    const { userId, clerkId, durationDays, planName, exactEndDate, amountPaid, paymentMode, paymentReference } = body;

    const now = new Date();
    let newEndDate: Date;
    let startDate = now;

    if (exactEndDate) {
      // Direct exact end date chosen by admin
      const parsedEnd = new Date(exactEndDate);
      if (isNaN(parsedEnd.getTime())) {
        return NextResponse.json({ error: "Invalid exact expiry date provided" }, { status: 400 });
      }
      // If date string only has YYYY-MM-DD, set to end of day 23:59:59
      if (exactEndDate.length <= 10) {
        parsedEnd.setHours(23, 59, 59, 999);
      }
      newEndDate = parsedEnd;
    } else {
      const days = parseInt(durationDays);
      if (!days || isNaN(days) || days <= 0) {
        return NextResponse.json({ error: "Invalid duration or expiry date provided" }, { status: 400 });
      }
      newEndDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    }

    const client = await getMongoClient();
    const db = client.db("Billgsoftware");

    // Resolve user & clerkId
    let query: any = {};
    if (userId) {
      try {
        query._id = new ObjectId(userId);
      } catch (e) {
        query._id = userId;
      }
    } else if (clerkId) {
      query.clerkId = clerkId;
    }

    const posUser = await db.collection("User").findOne(query);
    const resolvedClerkId = posUser?.clerkId || clerkId;

    if (!resolvedClerkId) {
      return NextResponse.json({ error: "Could not find a valid account or business profile for this customer" }, { status: 404 });
    }

    // Find existing BusinessProfile
    const profile = await db.collection("BusinessProfile").findOne({
      $or: [{ userId: resolvedClerkId }, { createdBy: resolvedClerkId }]
    });

    // If using durationDays without exactEndDate, handle smart extension
    if (!exactEndDate) {
      const days = parseInt(durationDays);
      if (profile && profile.premiumEndDate) {
        const existingEnd = new Date(profile.premiumEndDate);
        if (existingEnd.getTime() > now.getTime()) {
          startDate = profile.trialStartedAt ? new Date(profile.trialStartedAt) : now;
          newEndDate = new Date(existingEnd.getTime() + days * 24 * 60 * 60 * 1000);
        }
      }
    } else {
      if (profile && profile.trialStartedAt) {
        startDate = new Date(profile.trialStartedAt);
      }
    }

    // Amount paid parsed
    const parsedAmount = amountPaid !== undefined && amountPaid !== null && amountPaid !== ""
      ? parseFloat(String(amountPaid)) || 0
      : null;

    if (profile) {
      await db.collection("BusinessProfile").updateOne(
        { _id: profile._id },
        {
          $set: {
            isPremium: true,
            trialStartedAt: startDate,
            premiumEndDate: newEndDate,
            showPremiumPopup: false,
            updatedAt: now
          }
        }
      );
    } else {
      // If no business profile yet, create one with the premium flag
      await db.collection("BusinessProfile").insertOne({
        userId: resolvedClerkId,
        createdBy: resolvedClerkId,
        businessName: posUser?.name ? `${posUser.name}'s Business` : "My Business",
        isPremium: true,
        trialStartedAt: startDate,
        premiumEndDate: newEndDate,
        showPremiumPopup: false,
        createdAt: now,
        updatedAt: now
      });
    }

    // Save subscriptionAmountPaid in User's privateMetadata (standard Kravy POS structure)
    if (parsedAmount !== null && posUser) {
      const currentPrivateMeta = (posUser.privateMetadata as any) || {};
      await db.collection("User").updateOne(
        { _id: posUser._id },
        {
          $set: {
            "privateMetadata.subscriptionAmountPaid": parsedAmount,
            updatedAt: now
          }
        }
      );
    }

    const calculatedDays = Math.ceil((newEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Record an activation order / transaction for audit history
    await db.collection("SubscriptionOrder").insertOne({
      merchantOrderId: `MANUAL_${Date.now()}`,
      clerkUserId: resolvedClerkId,
      customer: {
        name: posUser?.name || "Customer",
        phone: posUser?.phone || profile?.contactPersonPhone || "",
        email: posUser?.email || ""
      },
      items: [
        {
          id: exactEndDate ? `plan_custom_${newEndDate.toISOString().slice(0, 10)}` : `plan_${durationDays}d`,
          name: planName || (exactEndDate ? `Validity till ${newEndDate.toISOString().slice(0, 10)}` : `${durationDays} Days Premium Plan`),
          price: parsedAmount || 0,
          quantity: 1,
          paymentMode: paymentMode || "Manual / Cash",
          paymentReference: paymentReference || "",
          activatedBy: user.emailAddresses[0]?.emailAddress || user.id,
          role: normalizedRole
        }
      ],
      amount: parsedAmount || 0,
      paymentMode: paymentMode || "Manual / Cash",
      paymentReference: paymentReference || "",
      paymentStatus: "SUCCESS",
      activationType: "MANUAL_PANEL",
      createdAt: now,
      updatedAt: now
    });

    return NextResponse.json({
      success: true,
      message: `Premium updated successfully! Valid till ${newEndDate.toLocaleDateString()}${parsedAmount !== null ? ` (₹${parsedAmount})` : ""}`,
      premium: {
        status: calculatedDays > 0 ? "Active" : "Expired",
        isPremium: true,
        startDate: startDate.toISOString(),
        endDate: newEndDate.toISOString(),
        daysRemaining: Math.max(0, calculatedDays),
        amountPaid: parsedAmount !== null ? parsedAmount : ((posUser?.privateMetadata as any)?.subscriptionAmountPaid ?? null)
      }
    });
  } catch (error: any) {
    console.error("Error activating premium:", error);
    return NextResponse.json({ error: error.message || "Failed to activate premium" }, { status: 500 });
  }
}

