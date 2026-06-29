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
