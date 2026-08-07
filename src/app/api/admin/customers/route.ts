import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata?.role as string)?.toLowerCase() || "user";

    // Allow Admin, Master, Seller etc. to see this, but you can restrict it to MASTER/ADMIN if needed.
    // For now, let's allow all or define a rule based on requirements.
    // Usually territory is a master/admin level tool, but sellers might use it too.
    
    // Let's fetch all tasks
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "asc" }
    });

    // Group tasks into customers
    const customersMap = new Map();

    for (const task of tasks) {
      const shopName = task.shopName?.trim() || "Unknown Restaurant";
      const phone = task.phone?.trim() || "No Phone";
      const customFields = task.customFields as any || {};
      const pincode = customFields.pincode?.trim() || "";

      // Composite key to uniquely identify a customer
      const customerKey = `${shopName.toLowerCase()}_${phone.toLowerCase()}_${pincode.toLowerCase()}`;

      if (!customersMap.has(customerKey)) {
        customersMap.set(customerKey, {
          id: Buffer.from(customerKey).toString("base64"), // Temporary unique ID
          restaurantName: shopName,
          ownerName: task.customerName || "Unknown",
          phone: phone,
          email: task.email || "",
          state: customFields.state || "",
          city: customFields.city || "",
          area: task.location || customFields.location || "",
          pincode: pincode,
          fullAddress: customFields.fullAddress || "",
          createdAt: task.createdAt,
          services: [],
          accountManagers: new Set(),
          status: "Inactive", // Will determine based on services
        });
      }

      const customer = customersMap.get(customerKey);
      
      // Collect all assignees/managers
      if (task.assignerName) customer.accountManagers.add(task.assignerName);
      if (task.assigneeName) customer.accountManagers.add(task.assigneeName);

      // We will map the service type based on customFields.activeTab or task title
      const serviceType = customFields.activeTab || task.title;
      
      // Update the customer's most recent address/details if newer tasks have them
      if (customFields.state) customer.state = customFields.state;
      if (customFields.city) customer.city = customFields.city;
      if (pincode) customer.pincode = pincode;
      if (customFields.fullAddress) customer.fullAddress = customFields.fullAddress;
      if (task.location || customFields.location) customer.area = task.location || customFields.location;

      customer.services.push({
        id: task.id,
        title: task.title,
        type: serviceType,
        status: task.status,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      });

      // Update overall customer status
      if (task.status === "in_progress" || task.status === "todo") {
        customer.status = "Active";
      }
    }

    // Convert map to array and format
    const customersArray = Array.from(customersMap.values()).map(c => ({
      ...c,
      accountManagers: Array.from(c.accountManagers).join(", ")
    }));

    // Sorting by newest first (using the first task creation date)
    customersArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ customers: customersArray });
  } catch (error: any) {
    console.error("❌ GET Admin Customers Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
