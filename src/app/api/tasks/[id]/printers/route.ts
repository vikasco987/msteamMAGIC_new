import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await context.params;

  try {
    const printers = await prisma.serialNumber.findMany({
      where: { taskId },
      include: { inventoryItem: true }
    });

    const records = await prisma.printerIssueRecord.findMany({
      where: { taskId }
    });

    return NextResponse.json({ printers, records });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await context.params;
  
  try {
    const { serialNumberId } = await req.json();
    if (!serialNumberId) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    // Mark active records as Cancelled
    await prisma.printerIssueRecord.updateMany({
      where: { taskId, serialNumberId, status: "Issued" },
      data: { status: "Cancelled" }
    });

    // Unlink the printer from the task
    await prisma.serialNumber.update({
      where: { id: serialNumberId },
      data: { taskId: null, status: "Returned" }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
