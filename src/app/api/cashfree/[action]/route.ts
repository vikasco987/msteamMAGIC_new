import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { prisma } from "@/lib/prisma";
import { currentUser as getClerkUser } from "@clerk/nextjs/server";
import crypto from "crypto";
import { syncPendingPaymentLinks } from "@/lib/sync-payment-links";

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

      // Run real-time auto sync for pending links
      await syncPendingPaymentLinks();

      const { searchParams } = new URL(req.url);
      const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
      const limit = Math.max(1, parseInt(searchParams.get("limit") || "20"));
      const search = searchParams.get("search") || "";
      const status = searchParams.get("status") || "all";
      const creator = searchParams.get("creator") || "all";
      const dateParam = searchParams.get("date"); // YYYY-MM-DD

      const role = String(user.publicMetadata?.role || "user").toLowerCase();
      
      let where: any = {};
      if (role !== "master") {
        where.creatorId = user.id;
      }

      if (status !== "all") {
        where.status = { equals: status, mode: "insensitive" };
      }

      if (creator !== "all") {
        where.createdBy = creator;
      }

      if (dateParam) {
        const start = new Date(dateParam);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateParam);
        end.setHours(23, 59, 59, 999);
        where.createdAt = {
          gte: start,
          lte: end
        };
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { orderId: { contains: search, mode: "insensitive" } }
        ];
      }

      const totalCount = await prisma.cashfreeLink.count({ where });
      const totalPages = Math.ceil(totalCount / limit);

      const links = await prisma.cashfreeLink.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      });

      return NextResponse.json({ 
        success: true, 
        links,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit
        }
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
  }

  if (action === "get-reports") {
    try {
      const user = await getClerkUser();
      if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

      const role = String(user.publicMetadata?.role || "user").toLowerCase();
      let where: any = {};
      if (role !== "master") {
        where.creatorId = user.id;
      }

      // Fetch all links to build reports
      const allLinks = await prisma.cashfreeLink.findMany({
        where,
        orderBy: { createdAt: "desc" }
      });

      // Group by Day
      const dayMap: Record<string, any> = {};
      // Group by Week
      const weekMap: Record<string, any> = {};
      // Group by Month
      const monthMap: Record<string, any> = {};

      allLinks.forEach((link) => {
        const dateObj = new Date(link.createdAt);
        
        // Day key: YYYY-MM-DD
        const dayKey = dateObj.toISOString().split("T")[0];
        
        // Month key: YYYY-MM
        const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        
        // Week key: YYYY-W(number)
        const tempDate = new Date(dateObj.getTime());
        tempDate.setHours(0, 0, 0, 0);
        tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
        const yearStart = new Date(tempDate.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        const weekKey = `${tempDate.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;

        const processGroup = (map: Record<string, any>, key: string, label: string) => {
          if (!map[key]) {
            map[key] = {
              key,
              label,
              totalLinks: 0,
              paidCount: 0,
              pendingCount: 0,
              totalBilled: 0,
              totalCollected: 0,
              links: []
            };
          }
          map[key].totalLinks += 1;
          map[key].totalBilled += link.totalAmount;
          map[key].links.push(link);
          if (link.status?.toLowerCase() === "paid") {
            map[key].paidCount += 1;
            map[key].totalCollected += link.amount;
          } else {
            map[key].pendingCount += 1;
          }
        };

        const dayLabel = dateObj.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
        const monthLabel = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        const weekLabel = `Week ${weekNo} (${dateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" })})`;

        processGroup(dayMap, dayKey, dayLabel);
        processGroup(weekMap, weekKey, weekLabel);
        processGroup(monthMap, monthKey, monthLabel);
      });

      return NextResponse.json({
        success: true,
        reports: {
          dayOnDay: Object.values(dayMap).sort((a: any, b: any) => b.key.localeCompare(a.key)),
          weekOnWeek: Object.values(weekMap).sort((a: any, b: any) => b.key.localeCompare(a.key)),
          monthOnMonth: Object.values(monthMap).sort((a: any, b: any) => b.key.localeCompare(a.key))
        }
      });
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
