// import { NextResponse } from "next/server";
// import { auth } from "@clerk/nextjs/server";
// import { clerkClient } from "@clerk/clerk-sdk-node";

// export async function GET(req: Request) {
//   const { userId } = auth(req); // ✅ IMPORTANT

//   if (!userId) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const list = await clerkClient.users.getUserList({ limit: 200 });

//   return NextResponse.json({
//     users: list.data.map(u => ({
//       id: u.id,
//       name:
//         `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
//         u.emailAddresses[0]?.emailAddress ||
//         "Unknown",
//     })),
//   });
// }




// //PENDING RAKHTA HUN




import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { users } from "@clerk/clerk-sdk-node";

export async function GET(req: NextRequest) {
  try {
    // ✅ SAME AUTH STYLE AS YOUR WORKING FILE
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Fetch all users from Clerk
    const userList = await users.getUserList({ limit: 200 });

    const formattedUsers = userList
      .filter((u: any) => !u.banned)
      .map((u: any) => ({
      id: u.id,
      name:
        `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
        u.username ||
        u.emailAddresses?.[0]?.emailAddress ||
        "Unknown",
      email: u.emailAddresses?.[0]?.emailAddress || "",
    }));

    return NextResponse.json(
      { users: formattedUsers },
      { status: 200 }
    );

  } catch (err) {
    console.error("❌ GET /api/admin/users error:", err);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}
