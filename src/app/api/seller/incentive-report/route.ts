import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
// @ts-ignore
import ExcelJS from "exceljs";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // YYYY-MM
    const assignerId = searchParams.get("assignerId");
    const t1r = parseInt(searchParams.get("t1r") || "5000", 10);
    const t1i = parseInt(searchParams.get("t1i") || "500", 10);
    const t2r = parseInt(searchParams.get("t2r") || "4000", 10);
    const t2i = parseInt(searchParams.get("t2i") || "300", 10);

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Invalid month format. Use YYYY-MM" }, { status: 400 });
    }

    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const metadataRole = (clerkUser.publicMetadata as any)?.role || (clerkUser.privateMetadata as any)?.role;
    const normalizedRole = String(metadataRole || dbUser?.role || "user").toLowerCase();

    let userIds = [userId];
    if (normalizedRole === "master" && assignerId) {
      userIds = [assignerId];
    }

    // Fetch tasks for the logged-in seller or team
    const tasks = await prisma.task.findMany({
      where: { 
        createdByClerkId: { in: userIds }, 
        createdAt: { gte: startDate, lt: endDate } 
      },
      select: {
        id: true,
        createdAt: true,
        amount: true,
        received: true,
        shopName: true,
        phone: true,
      },
    });

    // Group tasks by shopName or phone
    const grouped: Record<
      string,
      { revenue: number; received: number; firstCreatedAt: Date; phone?: string | null; taskIds: string[] }
    > = {};

    tasks.forEach((t) => {
      const key = t.shopName?.trim() || t.phone?.trim() || `Shop ${t.id.slice(-6)}`;
      if (!grouped[key]) {
        grouped[key] = {
          revenue: 0,
          received: 0,
          firstCreatedAt: t.createdAt,
          phone: t.phone || null,
          taskIds: [t.id],
        };
      } else {
        grouped[key].taskIds.push(t.id);
      }
      grouped[key].revenue += t.amount ?? 0;
      grouped[key].received += t.received ?? 0;
      if (t.createdAt < grouped[key].firstCreatedAt) grouped[key].firstCreatedAt = t.createdAt;
      if (!grouped[key].phone && t.phone) grouped[key].phone = t.phone;
    });

    const dataRows = Object.entries(grouped).map(([shopName, stats]) => ({
      shopName,
      taskId: stats.taskIds[0] || "-",
      mobile: stats.phone || "-",
      date: stats.firstCreatedAt.toLocaleDateString(),
      totalRevenue: stats.revenue,
      totalReceived: stats.received,
      pending: stats.revenue - stats.received,
    }));

    // Generate Excel using exceljs (using the provided logic)
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Incentive Dashboard');

    worksheet.columns = [
      { header: 'Shop Name', key: 'shopName', width: 25 },
      { header: 'Task ID', key: 'taskId', width: 25 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'First Task Date', key: 'date', width: 18 },
      { header: 'Total Revenue', key: 'revenue', width: 15 },
      { header: 'Total Received', key: 'received', width: 15 },
      { header: 'Pending', key: 'pending', width: 15 },
      { header: `Incentive (≥${t1r})`, key: 'inc500', width: 18 },
      { header: `Incentive (${t2r}-${t1r - 1})`, key: 'inc300', width: 20 },
      { header: 'Total Incentive', key: 'totalRow', width: 18 },
      { header: 'Status', key: 'status', width: 22 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2C3E50' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    let totalAssignerIncentive = 0;

    dataRows.forEach((row, index) => {
      const revenue = Number(row.totalRevenue) || 0;
      const received = Number(row.totalReceived) || 0;
      const pending = Number(row.pending) || 0;

      let inc500 = 0;
      let inc300 = 0;
      let status = 'Given';

      if (pending > 0) {
        status = 'Not Received Fully';
      } else {
        if (revenue >= t1r) {
          inc500 = t1i;
        } else if (revenue >= t2r && revenue < t1r) {
          inc300 = t2i;
        } else {
          status = 'Not Given (Low Revenue)';
        }
      }

      const totalRowVal = inc500 + inc300;
      if (status === 'Given') {
        totalAssignerIncentive += totalRowVal;
      }

      const rowData = worksheet.addRow({
        shopName: row.shopName,
        taskId: row.taskId,
        mobile: row.mobile,
        date: row.date,
        revenue: revenue,
        received: received,
        pending: pending,
        inc500: inc500,
        inc300: inc300,
        totalRow: totalRowVal,
        status: status
      });

      rowData.alignment = { horizontal: 'center', vertical: 'middle' };
      const isEven = index % 2 === 0;
      const fillColor = isEven ? 'F4F6F7' : 'FFFFFF';

      rowData.eachCell((cell: any) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: fillColor }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'D0D3D4' } },
          left: { style: 'thin', color: { argb: 'D0D3D4' } },
          bottom: { style: 'thin', color: { argb: 'D0D3D4' } },
          right: { style: 'thin', color: { argb: 'D0D3D4' } }
        };
      });
    });

    const totalRowIndex = dataRows.length + 2;
    worksheet.getCell(`J${totalRowIndex}`).value = 'TOTAL INCENTIVE:';
    worksheet.getCell(`J${totalRowIndex}`).font = { bold: true };
    worksheet.getCell(`J${totalRowIndex}`).alignment = { horizontal: 'right' };

    worksheet.getCell(`K${totalRowIndex}`).value = totalAssignerIncentive;
    worksheet.getCell(`K${totalRowIndex}`).font = { bold: true, color: { argb: '27AE60' } };
    worksheet.getCell(`K${totalRowIndex}`).alignment = { horizontal: 'center' };

    // Write to buffer instead of file
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="Incentive_Report_${month}${assignerId ? '_' + assignerId : ''}.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (e: any) {
    console.error("💥 Incentive report error:", e);
    return NextResponse.json({ error: "Internal Error", details: e.message }, { status: 500 });
  }
}
