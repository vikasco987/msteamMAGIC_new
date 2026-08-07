import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata?.role as string)?.toLowerCase() || "user";

    if (!["master", "admin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    
    const profile = await prisma.employeeProfile.findUnique({
      where: { id }
    });

    if (!profile) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const timeline = [];
    
    if (profile.createdAt) {
      timeline.push({ date: profile.createdAt, title: "Profile Created", type: "system" });
    }
    
    if (profile.joiningDate) {
      timeline.push({ date: profile.joiningDate, title: "Joined Company", type: "join" });
    }
    
    if (profile.employmentStatus === "Inactive") {
      timeline.push({ 
        date: profile.lastWorkingDate || profile.updatedAt, 
        title: "Marked Inactive", 
        description: profile.exitReason || "",
        type: "exit" 
      });
    }

    if (profile.finalSettlementStatus === "Completed") {
      timeline.push({
        date: profile.updatedAt,
        title: "Final Settlement Completed",
        type: "finance"
      })
    }

    // Sort timeline by date
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ timeline });
  } catch (error: any) {
    console.error("❌ GET Employee Timeline Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
