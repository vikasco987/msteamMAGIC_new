import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const { userId } = await auth();
        const user = await currentUser();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 🛡️ SECURITY GUARD: Only MASTER can bypass organization boundaries
        const userRole = (user?.publicMetadata?.role as string || "").toUpperCase();
        if (userRole !== "MASTER") {
            return NextResponse.json({ error: "FORBIDDEN: Neural Console access is restricted to MASTER." }, { status: 403 });
        }

        const client = await clerkClient();
        
        // Fetch all organizations in the instance
        const orgs = await client.organizations.getOrganizationList({
            limit: 100,
            includeMembersCount: true,
        });

        // Also check which orgs the current user is already in
        const memberships = await client.users.getOrganizationMembershipList({
            userId,
            limit: 100,
        });

        const joinedOrgIds = new Set(memberships.data.map(m => m.organization.id));

        const result = orgs.data.map(org => ({
            id: org.id,
            name: org.name,
            slug: org.slug,
            imageUrl: org.imageUrl,
            membersCount: org.membersCount,
            isJoined: joinedOrgIds.has(org.id),
        }));

        return NextResponse.json({ organizations: result });
    } catch (error: any) {
        console.error("Super Admin Orgs GET Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        const user = await currentUser();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 🛡️ SECURITY GUARD: Role enforcement
        const userRole = (user?.publicMetadata?.role as string || "").toUpperCase();
        if (userRole !== "MASTER") {
            return NextResponse.json({ error: "FORBIDDEN: Unauthorized membership injection attempt." }, { status: 403 });
        }

        const body = await req.json();
        const { organizationId } = body;

        if (!organizationId) return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });

        const client = await clerkClient();

        // 🚀 Super Admin Power: Force join the organization as an admin
        try {
            await client.organizations.createOrganizationMembership({
                organizationId,
                userId,
                role: "org:admin",
            });
            return NextResponse.json({ success: true, message: "Successfully joined organization as Admin" });
        } catch (err: any) {
            // If already a member, just return success
            if (err.errors?.[0]?.code === "form_identifier_exists") {
                return NextResponse.json({ success: true, message: "Already a member" });
            }
            throw err;
        }

    } catch (error: any) {
        console.error("Super Admin Orgs POST Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
