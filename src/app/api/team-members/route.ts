// import { createClerkClient } from "@clerk/backend";
// import { NextResponse } from "next/server";
// import { clerkClient } from '@clerk/clerk-sdk-node';

// // Ensure CLERK_SECRET_KEY is loaded
// const secret = process.env.CLERK_SECRET_KEY;
// if (!secret) {
//   console.error("❌ Missing CLERK_SECRET_KEY in environment variables!");
// }
// const clerk = secret ? createClerkClient({ secretKey: secret }) : null;

// export async function GET() {
//   if (!clerk) {
//     return NextResponse.json(
//       { error: "Server misconfigured: Clerk client not initialized" },
//       { status: 500 }
//     );
//   }

//   try {
//     const users = await clerk.users.getUserList();
//     const formatted = users.map((user) => ({
//       id: user.id,
//       email: user.emailAddresses[0]?.emailAddress || "no-email",
//       name:
//         [user.firstName, user.lastName].filter(Boolean).join(" ") ||
//         user.username ||
//         "Unnamed User",
//     }));
//     return NextResponse.json(formatted);
//   } catch (err) {
//     console.error("❌ Error fetching Clerk users:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch team members" },
//       { status: 500 }
//     );
//   }
// }









// import { createClerkClient } from "@clerk/backend";
// import { NextResponse } from "next/server";

// const secret = process.env.CLERK_SECRET_KEY;
// const clerk = secret ? createClerkClient({ secretKey: secret }) : null;

// export async function GET() {
//   if (!clerk) {
//     return NextResponse.json(
//       { error: "Clerk not initialized" },
//       { status: 500 }
//     );
//   }

//   try {
//     // ✅ getUserList() returns { data: [...] }
//     const { data: users } = await clerk.users.getUserList();

//     const formatted = users.map((user) => ({
//       id: user.id,
//       email: user.emailAddresses?.[0]?.emailAddress || "no-email",
//       name:
//         [user.firstName, user.lastName].filter(Boolean).join(" ") ||
//         user.username ||
//         "Unnamed User",
//     }));

//     return NextResponse.json(formatted);
//   } catch (err) {
//     console.error("❌ Error fetching Clerk users:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch team members" },
//       { status: 500 }
//     );
//   }
// }












// import { createClerkClient } from "@clerk/backend";
// import { NextResponse } from "next/server";

// const secret = process.env.CLERK_SECRET_KEY;
// const clerk = secret ? createClerkClient({ secretKey: secret }) : null;

// export async function GET() {
//   if (!clerk) {
//     return NextResponse.json(
//       { error: "Clerk not initialized" },
//       { status: 500 }
//     );
//   }

//   try {
//     let allUsers: any[] = [];
//     let page = 1;
//     let hasMore = true;

//     while (hasMore) {
//       const { data: users } = await clerk.users.getUserList({
//         limit: 100,
//         page,
//       });

//       allUsers = allUsers.concat(users);

//       if (users.length < 100) {
//         hasMore = false;
//       } else {
//         page += 1;
//       }
//     }

//     const formatted = allUsers.map((user) => ({
//       id: user.id,
//       email: user.emailAddresses?.[0]?.emailAddress || "no-email",
//       name:
//         [user.firstName, user.lastName].filter(Boolean).join(" ") ||
//         user.username ||
//         "Unnamed User",
//     }));

//     return NextResponse.json(formatted);
//   } catch (err) {
//     console.error("❌ Error fetching Clerk users:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch team members" },
//       { status: 500 }
//     );
//   }
// }















import { createClerkClient, User } from "@clerk/backend"; // This is the correct and only import needed for createClerkClient
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const secret = process.env.CLERK_SECRET_KEY;
const clerk = secret ? createClerkClient({ secretKey: secret }) : null;

export async function GET() {
  if (!clerk) {
    return NextResponse.json(
      { error: "Clerk not initialized" },
      { status: 500 }
    );
  }

  try {
    let allUsers: User[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const { data: users } = await clerk.users.getUserList({
        limit: limit,
        offset: offset,
      });

      allUsers = allUsers.concat(users);

      if (users.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    const formatted = allUsers
      .filter((user) => !user.banned)
      .map((user) => ({
      id: user.id,
      email: user.emailAddresses?.[0]?.emailAddress || "no-email",
      name:
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.username ||
        "Unnamed User",
    }));

    // Fetch custom / non-Clerk users from database
    const dbUsers = await prisma.user.findMany({
      where: {
        isDisabled: false,
        OR: [
          { clerkId: { startsWith: "custom_" } },
          { clerkId: { not: { startsWith: "user_" } } }
        ]
      },
      select: {
        clerkId: true,
        email: true,
        name: true
      }
    });

    const existingEmails = new Set(formatted.map(u => u.email.toLowerCase()));
    const customFormatted = dbUsers
      .filter(u => u.email && !existingEmails.has(u.email.toLowerCase()))
      .map(u => ({
        id: u.clerkId,
        email: u.email,
        name: u.name || u.email.split("@")[0] || "Custom User"
      }));

    return NextResponse.json([...formatted, ...customFormatted]);
  } catch (err) {
    console.error("❌ Error fetching Clerk/DB users:", err);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}
