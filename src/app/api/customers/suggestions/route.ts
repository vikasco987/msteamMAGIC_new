import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (query.length < 2) {
      return NextResponse.json([]);
    }

    // Fetch unique customers by name
    // We search in the Task table because that's where the user saves address details
    const tasks = await prisma.task.findMany({
      where: {
        customerName: {
          contains: query,
          mode: "insensitive",
        },
        NOT: {
          customerName: null,
        },
      },
      select: {
        customerName: true,
        customFields: true,
        shopName: true,
        phone: true,
        location: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    // Extract unique customers based on name + phone/shop combo to avoid duplicates
    const uniqueCustomers = new Map();

    tasks.forEach((task) => {
      const name = task.customerName;
      if (!uniqueCustomers.has(name)) {
        // Extract address details from customFields if they exist
        const cf = (task.customFields as any) || {};
        uniqueCustomers.set(name, {
          customerName: name,
          shopName: task.shopName || "",
          phone: task.phone || "",
          location: task.location || "",
          fullAddress: cf.fullAddress || "",
          city: cf.city || "",
          state: cf.state || "",
          pincode: cf.pincode || "",
          country: cf.country || "India",
        });
      }
    });

    return NextResponse.json(Array.from(uniqueCustomers.values()));
  } catch (error) {
    console.error("[CUSTOMER_SUGGESTIONS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
