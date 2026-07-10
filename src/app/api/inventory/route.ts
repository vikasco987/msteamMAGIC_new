import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error("GET /api/inventory error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, sku, quantity, type } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        sku,
        quantity: parseInt(quantity, 10) || 0,
        type
      }
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/inventory error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, quantity, action } = body;

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const currentItem = await prisma.inventoryItem.findUnique({
      where: { id }
    });

    if (!currentItem) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }

    let newQty = currentItem.quantity;
    const val = parseInt(quantity, 10) || 0;

    if (action === "increment") {
      newQty += val;
    } else if (action === "decrement") {
      newQty = Math.max(0, newQty - val);
    } else {
      newQty = Math.max(0, val);
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: { quantity: newQty }
    });

    return NextResponse.json({ item: updated }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/inventory error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    // 1. Delete associated Serial Numbers
    await prisma.serialNumber.deleteMany({
      where: { inventoryItemId: id }
    });

    // 2. Delete associated Dispatch Logs
    await prisma.dispatchLog.deleteMany({
      where: { inventoryItemId: id }
    });

    // 3. Delete the Inventory Item
    await prisma.inventoryItem.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Inventory item deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/inventory error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
