import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { prisma } from "@/lib/prisma";
import { currentUser as getClerkUser } from "@clerk/nextjs/server";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  const appId = process.env.CASHFREE_APP_ID?.trim();
  const secretKey = process.env.CASHFREE_SECRET_KEY?.trim();
  const env = process.env.CASHFREE_ENV?.trim()?.toUpperCase() || "PROD";


  if (action === "create-link") {
    try {
      const body = await req.json();
      const { name, email, phone, amount, totalServicePrice, purpose, createdBy, creatorId } = body;
      const finalAmount = parseFloat(amount || totalServicePrice || "0");

      if (!appId || !secretKey) {
        return NextResponse.json({ success: false, message: "Cashfree API keys missing" }, { status: 500 });
      }

      if (!finalAmount || finalAmount <= 0) {
        return NextResponse.json({ success: false, message: "Valid amount is required" }, { status: 400 });
      }

      // Basic Phone Validation
      const cleanPhone = phone?.replace(/[^0-9]/g, "");
      if (cleanPhone && cleanPhone.length !== 10) {
        return NextResponse.json({ success: false, message: "Phone number must be exactly 10 digits" }, { status: 400 });
      }

      const orderId = "LNK_" + Date.now();
      const orderUrl = env === "PROD" ? "https://api.cashfree.com/pg/orders" : "https://sandbox.cashfree.com/pg/orders";

      const orderResponse = await axios.post(
        orderUrl,
        {
          order_id: orderId,
          order_amount: finalAmount,
          order_currency: "INR",
          customer_details: {
            customer_id: email ? email.replace(/[^a-zA-Z0-9_-]/g, "_") : "guest_" + Date.now(),
            customer_name: name || "Customer",
            customer_email: email || "customer@example.com",
            customer_phone: phone || "9999999999",
          },
          order_meta: {
            return_url: `https://magicscale.in/payment-success?order_id=${orderId}`,
            total_amount: (parseFloat(totalServicePrice) || finalAmount).toString(),
          },
        },
        {
          headers: {
            "x-client-id": appId,
            "x-client-secret": secretKey,
            "x-api-version": "2022-09-01",
            "Content-Type": "application/json",
          },
        }
      );

      const sessionId = orderResponse.data.payment_session_id;
      const checkoutUrl = `https://magicscale.in/api/cashfree/checkout?session_id=${sessionId}&env=${env.toLowerCase()}`;

      // Store in DB
      // @ts-ignore - Handle possible delay in type generation
      await prisma.cashfreeLink.create({
        data: {
          orderId,
          name: name || "Customer",
          email: email || "",
          phone: phone || "",
          amount: finalAmount,
          totalAmount: parseFloat(totalServicePrice) || finalAmount,
          purpose: purpose || "Service Payment",
          paymentLink: checkoutUrl,
          paymentSessionId: sessionId,
          createdBy: createdBy || "Unknown",
          creatorId: creatorId || null,
          status: "pending"
        }
      });

      // Generate Short Link
      const shortId = crypto.randomBytes(3).toString("hex"); // 6 chars
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://magicscale.in';
      const shortUrl = `${appUrl}/p/${shortId}`;

      if (!(prisma as any).shortLink) {
        console.error("❌ ERROR: shortLink model is missing from Prisma Client. PLEASE RESTART SERVER.");
        return NextResponse.json({
          success: true,
          link_url: checkoutUrl, // Fallback to long URL if shortener is not ready
          order_id: orderId,
          warning: "Short link could not be generated. Please restart server."
        });
      }

      await (prisma as any).shortLink.create({
        data: {
          shortId,
          originalUrl: checkoutUrl,
          orderId: orderId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      return NextResponse.json({
        success: true,
        link_url: shortUrl, // Return the short URL
        order_id: orderId
      });

    } catch (error: any) {
      const cfError = error.response?.data || error.message;
      console.error("❌ CASHFREE API REJECTED REQUEST:", cfError);
      
      return NextResponse.json({ 
        success: false, 
        message: typeof cfError === 'object' ? (cfError.message || "Cashfree API Error") : cfError
      }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;

  if (action === "get-all-links") {
    try {
      const user = await getClerkUser();
      if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

      const role = String(user.publicMetadata?.role || "user").toLowerCase();
      
      let where = {};
      if (role !== "master") {
        where = { creatorId: user.id };
      }

      const links = await prisma.cashfreeLink.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50
      });
      return NextResponse.json({ success: true, links });
    } catch (error: any) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
  }

  if (action === "analytics") {
    try {
      const user = await getClerkUser();
      if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      const role = String(user.publicMetadata?.role || "user").toLowerCase();
      
      // Check for dynamic permission in database
      const permission = await prisma.sidebarPermission.findUnique({
        where: { role }
      });

      const allowedItems = permission?.sidebarItems || [];
      const hasAccess = allowedItems.includes("Payment Analytics");

      if (!hasAccess && role !== "master") {
        return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
      }

      const links = await prisma.cashfreeLink.findMany({
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json({ success: true, links });
    } catch (error: any) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
  }

  if (action === "user-details") {
    const { searchParams } = new URL(req.url);
    const identifier = searchParams.get("identifier");
    if (!identifier) return NextResponse.json({ success: false, message: "Identifier required" }, { status: 400 });

    try {
      // Find from local CashfreeLink history first
      // @ts-ignore
      const lastLink = await prisma.cashfreeLink.findFirst({
        where: {
          OR: [
            { email: identifier },
            { phone: identifier }
          ]
        },
        orderBy: { createdAt: "desc" }
      });

      if (lastLink) {
        return NextResponse.json({
          success: true,
          user: { name: lastLink.name, email: lastLink.email, phone: lastLink.phone },
          lastPayment: { plan: lastLink.purpose, amount: lastLink.amount, totalAmount: lastLink.totalAmount },
          pendingBalance: Math.max(0, lastLink.totalAmount - lastLink.amount) // Simplified
        });
      }

      // If not found in links, check Customers
      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: identifier },
            { phone: identifier }
          ]
        }
      });

      if (customer) {
        return NextResponse.json({
          success: true,
          user: { name: customer.name, email: customer.email, phone: customer.phone },
          lastPayment: null,
          pendingBalance: 0
        });
      }
      return NextResponse.json({ success: false, message: "Customer not found" });
    } catch (error: any) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
  }

  if (action === "redirect-handler") {
    const { searchParams } = new URL(req.url);
    const shortId = searchParams.get("shortId");
    if (!shortId) return NextResponse.json({ success: false, message: "Short ID required" }, { status: 400 });

    try {
      const link = await prisma.shortLink.findUnique({
        where: { shortId }
      });

      if (!link) return NextResponse.json({ success: false, message: "Link not found" });

      // Optional visit increment
      await prisma.shortLink.update({
        where: { shortId },
        data: { visits: { increment: 1 } }
      });

      return NextResponse.json({ success: true, url: link.originalUrl });
    } catch (error: any) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
  }

  if (action === "check-status") {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id");
    if (!orderId) return NextResponse.json({ success: false, message: "Order ID required" }, { status: 400 });

    const appId = process.env.CASHFREE_APP_ID?.trim();
    const secretKey = process.env.CASHFREE_SECRET_KEY?.trim();
    const env = process.env.CASHFREE_ENV?.trim()?.toUpperCase() || "PROD";

    if (!appId || !secretKey) {
      return NextResponse.json({ success: false, message: "Cashfree API keys missing" }, { status: 500 });
    }

    try {
      const fetchStatus = async (targetEnv: string) => {
        const url = targetEnv === "PROD" 
          ? `https://api.cashfree.com/pg/orders/${orderId}` 
          : `https://sandbox.cashfree.com/pg/orders/${orderId}`;
        
        return axios.get(url, {
          headers: {
            "x-client-id": appId,
            "x-client-secret": secretKey,
            "x-api-version": "2022-09-01",
          },
        });
      };

      let orderResponse;
      try {
        orderResponse = await fetchStatus(env);
      } catch (err: any) {
        // If not found in primary env, try the other one
        const alternateEnv = env === "PROD" ? "TEST" : "PROD";
        console.log(`Order ${orderId} not found in ${env}, trying ${alternateEnv}...`);
        orderResponse = await fetchStatus(alternateEnv);
      }

      const cashfreeStatus = orderResponse.data.order_status?.toUpperCase(); 
      console.log(`ORDER STATUS FOR ${orderId}:`, cashfreeStatus);

      let finalStatus = "pending";
      if (cashfreeStatus === "PAID" || cashfreeStatus === "SUCCESS") finalStatus = "paid";
      else if (cashfreeStatus === "EXPIRED") finalStatus = "expired";
      else if (cashfreeStatus === "TERMINATED" || cashfreeStatus === "FAILED") finalStatus = "failed";

      // If still pending, check payments array
      if (finalStatus === "pending" && orderResponse.data.order_amount > 0) {
        const paymentsUrl = (env === "PROD" ? `https://api.cashfree.com/pg/orders/${orderId}` : `https://sandbox.cashfree.com/pg/orders/${orderId}`) + "/payments";
        const paymentsResponse = await axios.get(paymentsUrl, {
          headers: { "x-client-id": appId, "x-client-secret": secretKey, "x-api-version": "2022-09-01" },
        });
        const hasSuccess = paymentsResponse.data.some((p: any) => p.payment_status?.toUpperCase() === "SUCCESS");
        if (hasSuccess) finalStatus = "paid";
      }

      // Update local DB
      await prisma.cashfreeLink.update({
        where: { orderId },
        data: { status: finalStatus }
      });

      return NextResponse.json({ success: true, status: finalStatus });

    } catch (error: any) {
      console.error("Cashfree Status Error:", error.response?.data || error.message);
      return NextResponse.json({ 
        success: false, 
        message: error.response?.data?.message || error.message 
      }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
