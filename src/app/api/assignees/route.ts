import { NextRequest, NextResponse } from "next/server";
import { users } from "@clerk/clerk-sdk-node";

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();

    const promises = ids.map(async (id: string) => {
      try {
        const user = await users.getUser(id);
        return {
          id: user.id,
          name: user.firstName || user.username || "Unnamed",
          email: user.emailAddresses[0]?.emailAddress || "",
          imageUrl: user.imageUrl,
        };
      } catch {
        return {
          id,
          name: "Unknown",
          email: "",
          imageUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${id}`,
        };
      }
    });

    const assignees = await Promise.all(promises);
    return NextResponse.json({ assignees });
  } catch (err) {
    console.error("Error in /api/assignees:", err);
    return NextResponse.json({ error: "Failed to fetch assignees" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const clerkUsers = await users.getUserList({
      limit: 100,
    });

    const assignees = clerkUsers
      .filter((user: any) => !user.banned)
      .map((user: any) => ({
      id: user.id,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Unnamed",
      email: user.emailAddresses[0]?.emailAddress || "",
      imageUrl: user.imageUrl,
    }));

    return NextResponse.json({ assignees });
  } catch (err) {
    console.error("Error in /api/assignees GET:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}