import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest, context: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await context.params;
  const { userId: submittedById } = await auth();

  try {
    const { serialNumberId, takenBy, remarks } = await req.json();

    if (!serialNumberId || !takenBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify task
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // Verify printer and get details
    const printer = await prisma.serialNumber.findUnique({
      where: { id: serialNumberId },
      include: { inventoryItem: true }
    });

    if (!printer) return NextResponse.json({ error: "Printer not found" }, { status: 404 });

    // Mark previous records for this printer/task as cancelled (if any exist)
    await prisma.printerIssueRecord.updateMany({
      where: { taskId, serialNumberId, status: "Issued" },
      data: { status: "Cancelled" }
    });

    // Create the new record
    const record = await prisma.printerIssueRecord.create({
      data: {
        taskId,
        serialNumberId,
        serialNumberStr: printer.number,
        printerName: printer.inventoryItem?.name || "Printer",
        takenBy,
        remarks,
        submittedById,
      }
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Printer form submission failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
