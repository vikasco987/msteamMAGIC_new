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
    const tasks = await prisma.task.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { shopName: { contains: search, mode: 'insensitive' } },
              { customerName: { contains: search, mode: 'insensitive' } },
            ]
          } : {},
        ]
      },
      select: {
        id: true,
        title: true,
        shopName: true,
        customerName: true,
        amount: true,
        received: true,
        paymentHistory: true,
        createdAt: true,
        updatedAt: true,
        phone: true,
        location: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    const reportData: any[] = [];

    tasks.forEach(task => {
      const history = Array.isArray(task.paymentHistory) ? task.paymentHistory : [];
      
      if (history.length === 0) {
        return;
      }

      history.forEach((entry: any, index: number) => {
        const entryDate = entry.updatedAt ? new Date(entry.updatedAt) : null;
        
        // Date range filter
        if (startDate && entryDate && entryDate < new Date(startDate)) return;
        if (endDate && entryDate && entryDate > new Date(endDate)) return;

        reportData.push({
          "Date": entryDate ? entryDate.toLocaleDateString('en-IN') : "N/A",
          "Task ID": task.id,
          "Project Name": task.title,
          "Shop Name": task.shopName || "N/A",
          "Customer Name": task.customerName || "N/A",
          "Phone No.": (task as any).phone || "N/A",
          "Address": (task as any).location || "N/A",
          "Total Budget": task.amount || 0,
          "Transaction Amount": entry.received || 0,
          "UTR / Transaction No.": entry.utr || "N/A",
          "Updated By": entry.updatedBy || "System",
          "Proof URL": entry.fileUrl || "No Proof",
          "Payment #": index + 1
        });
      });
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
