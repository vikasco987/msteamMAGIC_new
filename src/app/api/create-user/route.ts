import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const clerkRole = (
      (user.publicMetadata?.role as string) ||
      (user.privateMetadata?.role as string) ||
      "user"
    ).toUpperCase();

    // 🚀 UPSERT (MongoDB compatible via Prisma)
    const syncedUser = await prisma.user.upsert({
      where: { clerkId: user.id },
      update: {
        email: user.emailAddresses[0].emailAddress,
        role: clerkRole,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed",
      },
      create: {
        clerkId: user.id,
        email: user.emailAddresses[0].emailAddress,
        role: clerkRole,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed",
      },
    });

    return new Response(JSON.stringify(syncedUser), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error("❌ User Sync Failed:", err);
    return new Response("Sync Error", { status: 500 });
  }
}
