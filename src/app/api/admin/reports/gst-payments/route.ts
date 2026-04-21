import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const role = (user?.publicMetadata?.role as string || "").toLowerCase();

  // Allow only Admin or Master to download GST reports
  if (role !== "master" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const search = searchParams.get("search");

  try {
    const where: any = {
      AND: [
        startDate ? { updatedAt: { gte: new Date(startDate) } } : {},
        endDate ? { updatedAt: { lte: new Date(endDate) } } : {},
        search ? {
          task: {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { shopName: { contains: search, mode: 'insensitive' } },
              { customerName: { contains: search, mode: 'insensitive' } },
            ]
          }
        } : {},
      ]
    };

    const payments = await prisma.payment.findMany({
      where,
      include: { task: true },
      orderBy: { updatedAt: 'desc' },
    });

    const reportData = payments.map((p, idx) => {
      const cf = (p.task.customFields as any) || {};
      const fullAddr = [cf.fullAddress, cf.city, cf.state, cf.country, cf.pincode].filter(Boolean).join(", ") || p.task.location || "N/A";

      return {
        "Date": p.updatedAt ? p.updatedAt.toLocaleDateString('en-IN') : "N/A",
        "Task ID": p.taskId,
        "Project Name": p.task.title,
        "Shop Name": p.task.shopName || "N/A",
        "Customer Name": p.task.customerName || "N/A",
        "Phone No.": (p.task as any).phone || "N/A",
        "Address": fullAddr,
        "Total Budget": p.task.amount || 0,
        "Transaction Amount": p.received || 0,
        "UTR / Transaction No.": p.utr || "N/A",
        "Updated By": p.updatedBy || "System",
        "Proof URL": p.fileUrl || "No Proof",
        "Payment #": idx + 1
      };
    });

    if (reportData.length === 0) {
      return NextResponse.json({ error: "No payment data found" }, { status: 404 });
    }

    // Create Worksheet
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    
    // Set column widths
    const wscols = [
      { wch: 12 }, // Date
      { wch: 25 }, // Task ID
      { wch: 30 }, // Project Name
      { wch: 20 }, // Shop Name
      { wch: 20 }, // Customer Name
      { wch: 15 }, // Phone No
      { wch: 35 }, // Address
      { wch: 15 }, // Total Budget
      { wch: 18 }, // Transaction Amount
      { wch: 25 }, // UTR
      { wch: 20 }, // Updated By
      { wch: 40 }, // Proof URL
      { wch: 10 }  // Payment #
    ];
    worksheet["!cols"] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "GST Payments");

    // Write to buffer
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="GST_Payment_Report_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });

  } catch (error: any) {
    console.error("Report Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
