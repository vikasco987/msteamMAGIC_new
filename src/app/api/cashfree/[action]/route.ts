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
      const { name, email, phone, amount, totalServicePrice, purpose, createdBy, creatorId, acceptPartial, firstMinPartialAmount } = body;
      const billedAmount = acceptPartial && firstMinPartialAmount ? parseFloat(firstMinPartialAmount) : parseFloat(amount || totalServicePrice || "0");
      const finalTotalAmount = parseFloat(totalServicePrice) || parseFloat(amount || "0");

      if (!appId || !secretKey) {
        return NextResponse.json({ success: false, message: "Cashfree API keys missing" }, { status: 500 });
      }

      if (!finalTotalAmount || finalTotalAmount <= 0) {
        return NextResponse.json({ success: false, message: "Valid amount is required" }, { status: 400 });
      }

      // Basic Phone Validation
      const cleanPhone = phone?.replace(/[^0-9]/g, "");
      if (cleanPhone && cleanPhone.length !== 10) {
        return NextResponse.json({ success: false, message: "Phone number must be exactly 10 digits" }, { status: 400 });
      }

      // Call magicscale.in to generate the link and save to its database
      const backendUrl = "https://magicscale.in/api/cashfree/create-link";
      const msResponse = await axios.post(backendUrl, body);
      const data = msResponse.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to generate link via MagicScale API");
      }

      const checkoutUrl = data.original_url;
      const orderId = data.order_id;
      const shortUrl = data.link_url;

      // Store in local DB so it appears on msteam dashboard
      // @ts-ignore - Handle possible delay in type generation
      await prisma.cashfreeLink.create({
        data: {
          orderId,
          name: name || "Customer",
          email: email || "",
          phone: phone || "",
          amount: billedAmount,
          totalAmount: finalTotalAmount,
          purpose: purpose || "Service Payment",
          paymentLink: checkoutUrl,
          paymentSessionId: "PROXIED",
          createdBy: createdBy || "Unknown",
          creatorId: creatorId || null,
          status: "pending"
        }
      });

      return NextResponse.json({
        success: true,
        link_url: shortUrl, // Returns the magicscale.in short URL
        order_id: orderId,
        original_url: checkoutUrl
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

      return NextResponse.json({ success: true, url: link.originalUrl }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
  }

  if (action === "check-status") {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id");
    if (!orderId) return NextResponse.json({ success: false, message: "Order ID required" }, { status: 400 });

    try {
      // Proxy status check to magicscale.in backend to handle actual status tracking (whether Razorpay or Cashfree)
      const backendUrl = `https://magicscale.in/api/cashfree/check-status?order_id=${orderId}`;
      const msResponse = await axios.get(backendUrl);
      const data = msResponse.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to check status via MagicScale API");
      }

      const finalStatus = data.status || "pending";

      // Update local DB
      await prisma.cashfreeLink.update({
        where: { orderId },
        data: { status: finalStatus }
      });

      return NextResponse.json({ success: true, status: finalStatus });
    } catch (error: any) {
      console.error("Status Check Proxy Error:", error.response?.data || error.message);
      return NextResponse.json({ 
        success: false, 
        message: error.response?.data?.message || error.message 
      }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
