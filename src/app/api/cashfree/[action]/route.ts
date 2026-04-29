import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { prisma } from "@/lib/prisma";

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
      const { name, email, phone, amount, totalServicePrice, purpose, createdBy } = body;
      const finalAmount = parseFloat(amount || totalServicePrice || "0");

      if (!appId || !secretKey) {
        return NextResponse.json({ success: false, message: "Cashfree API keys missing" }, { status: 500 });
      }

      if (!finalAmount || finalAmount <= 0) {
        return NextResponse.json({ success: false, message: "Valid amount is required" }, { status: 400 });
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
          status: "pending"
        }
      });

      return NextResponse.json({
        success: true,
        link_url: checkoutUrl,
        order_id: orderId
      });

    } catch (error: any) {
      console.error("Cashfree API Error:", error.response?.data || error.message);
      return NextResponse.json({ 
        success: false, 
        message: error.response?.data?.message || error.message 
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
      // @ts-ignore
      const links = await prisma.cashfreeLink.findMany({
        orderBy: { createdAt: "desc" },
        take: 50
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
      const orderUrl = env === "PROD" 
        ? `https://api.cashfree.com/pg/orders/${orderId}` 
        : `https://sandbox.cashfree.com/pg/orders/${orderId}`;

      const orderResponse = await axios.get(orderUrl, {
        headers: {
          "x-client-id": appId,
          "x-client-secret": secretKey,
          "x-api-version": "2022-09-01",
        },
      });

      const cashfreeStatus = orderResponse.data.order_status; // PAID, ACTIVE, EXPIRED, etc.
      let finalStatus = "pending";
      if (cashfreeStatus === "PAID") finalStatus = "paid";
      else if (cashfreeStatus === "EXPIRED") finalStatus = "expired";
      else if (cashfreeStatus === "TERMINATED") finalStatus = "failed";

      // Update local DB
      // @ts-ignore
      await prisma.cashfreeLink.update({
        where: { orderId },
        data: { status: finalStatus.toLowerCase() }
      });

      return NextResponse.json({ 
        success: true, 
        status: finalStatus, 
        cashfree_status: cashfreeStatus,
        order_details: orderResponse.data 
      });

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
