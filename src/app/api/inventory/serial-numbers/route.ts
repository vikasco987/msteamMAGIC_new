import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const itemName = searchParams.get("itemName") || "Printer";

    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { name: itemName },
      include: {
        serialNumbers: {
          where: status ? { status } : undefined,
          include: {
            task: {
              include: {
                dispatchLog: true
              }
            }
          },
          orderBy: { number: "asc" }
        }
      }
    });

    if (!inventoryItem) {
      return NextResponse.json({ serialNumbers: [] }, { status: 200 });
    }

    return NextResponse.json({ serialNumbers: inventoryItem.serialNumbers }, { status: 200 });
  } catch (error) {
    console.error("GET /api/inventory/serial-numbers error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { itemName, serialNumbers } = body;

    if (!itemName || !Array.isArray(serialNumbers) || serialNumbers.length === 0) {
      return NextResponse.json({ error: "itemName and non-empty serialNumbers array are required" }, { status: 400 });
    }

    // Find the inventory item
    let inventoryItem = await prisma.inventoryItem.findUnique({
      where: { name: itemName }
    });

    if (!inventoryItem) {
      // Create if it doesn't exist
      inventoryItem = await prisma.inventoryItem.create({
        data: {
          name: itemName,
          type: "HARDWARE",
          quantity: 0
        }
      });
    }

    let addedCount = 0;
    const errors: string[] = [];

    for (const num of serialNumbers) {
      const cleanNum = String(num).trim();
      if (!cleanNum) continue;

      try {
        // Check if serial number already exists in database
        const existing = await prisma.serialNumber.findUnique({
          where: { number: cleanNum }
        });

        if (existing) {
          // If it already exists, skip it or report it
          errors.push(`Serial ${cleanNum} already exists.`);
          continue;
        }

        // Create the serial number
        await prisma.serialNumber.create({
          data: {
            number: cleanNum,
            status: "Available",
            inventoryItemId: inventoryItem.id
          }
        });
        addedCount++;
      } catch (err: any) {
        errors.push(`Error adding ${cleanNum}: ${err.message}`);
      }
    }

    // Update quantity of inventory item by the added serial count
    if (addedCount > 0) {
      await prisma.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: {
          quantity: {
            increment: addedCount
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      addedCount,
      errors
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/inventory/serial-numbers error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, status, deleteAction } = body;

    if (!id) {
      return NextResponse.json({ error: "Serial ID is required" }, { status: 400 });
    }

    const serial = await prisma.serialNumber.findUnique({
      where: { id }
    });

    if (!serial) {
      return NextResponse.json({ error: "Serial number not found" }, { status: 404 });
    }

    if (deleteAction) {
      await prisma.serialNumber.delete({
        where: { id }
      });

      if (serial.status === "Available") {
        await prisma.inventoryItem.update({
          where: { id: serial.inventoryItemId },
          data: { quantity: { decrement: 1 } }
        });
      }

      return NextResponse.json({ success: true, message: "Serial deleted" }, { status: 200 });
    }

    const updated = await prisma.serialNumber.update({
      where: { id },
      data: { status }
    });

    if (serial.status === "Available" && status !== "Available") {
      await prisma.inventoryItem.update({
        where: { id: serial.inventoryItemId },
        data: { quantity: { decrement: 1 } }
      });
    } else if (serial.status !== "Available" && status === "Available") {
      await prisma.inventoryItem.update({
        where: { id: serial.inventoryItemId },
        data: { quantity: { increment: 1 } }
      });
    }

    return NextResponse.json({ serial: updated }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/inventory/serial-numbers error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
