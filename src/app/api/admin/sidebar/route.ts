import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const client = await clerkClient();
        const requesterResponse = await client.users.getUser(userId);
        const requesterRole = String(requesterResponse.publicMetadata?.role || "user").toLowerCase();

        if (requesterRole !== "master") {
            return NextResponse.json({ error: "Forbidden: Only MASTER can manage permissions" }, { status: 403 });
        }

        const permissions = await prisma.sidebarPermission.findMany();

        const allItems = [
            'Dashboard', 'Team Board', 'Create Task', 'Assigned Task',
            'Recovery Hub', 'KAM Strategy', 'Sales Matrix', 'Team Sales', 'My Growth', 'CRM Forms', 'Follow-up Board', 'Call Report',
            'Attendance', 'Tish Control', 'Activity Log', 'Lifecycle Report', 'Customers',
            'Agreements', 'Timeline', 'DB Backups'
        ];

        const DEFAULT_PERMISSIONS: Record<string, string[]> = {
            master: ['Dashboard', 'Team Board', 'Create Task', 'Assigned Task', 'Recovery Hub', 'KAM Strategy', 'Sales Matrix', 'Team Sales', 'My Growth', 'CRM Forms', 'Follow-up Board', 'Call Report', 'Attendance', 'Tish Control', 'Activity Log', 'Lifecycle Report', 'Customers', 'Agreements', 'Timeline', 'DB Backups'],
            admin: ['Dashboard', 'Team Board', 'Create Task', 'Assigned Task', 'Recovery Hub', 'KAM Strategy', 'Team Sales', 'My Growth', 'CRM Forms', 'Follow-up Board', 'Call Report', 'Attendance', 'Tish Control', 'Activity Log', 'Lifecycle Report', 'Customers', 'Agreements', 'Timeline'],
            tl: ['Dashboard', 'Team Board', 'Create Task', 'Assigned Task', 'Recovery Hub', 'KAM Strategy', 'Team Sales', 'My Growth', 'CRM Forms', 'Follow-up Board', 'Call Report', 'Attendance', 'Tish Control', 'Activity Log', 'Lifecycle Report', 'Customers', 'Agreements', 'Timeline'],
            seller: ['Dashboard', 'Team Board', 'Create Task', 'Assigned Task', 'Recovery Hub', 'KAM Strategy', 'My Growth', 'CRM Forms', 'Follow-up Board', 'Call Report', 'Attendance', 'Activity Log', 'Customers', 'Agreements', 'Timeline'],
            user: ['Team Board', 'Create Task', 'CRM Forms', 'Activity Log'],
            manager: ['CRM Forms', 'Follow-up Board'],
            intern: ['CRM Forms'],
            guest: ['CRM Forms']
        };

        // If a role doesn't have an override in the database, return defaults
        const roles = ['MASTER', 'ADMIN', 'TL', 'SELLER', 'USER', 'GUEST', 'MANAGER', 'INTERN'];
        const effectivePermissions = roles.map(role => {
            const roleKey = role.toLowerCase();
            const dbPerm = permissions.find(p => p.role === roleKey);
            return {
                role: roleKey,
                sidebarItems: dbPerm ? dbPerm.sidebarItems : DEFAULT_PERMISSIONS[roleKey] || []
            };
        });

        return NextResponse.json({ permissions: effectivePermissions, allItems });
    } catch (error) {
        console.error("GET /api/admin/sidebar error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const client = await clerkClient();
        const requesterResponse = await client.users.getUser(userId);
        const requesterRole = String(requesterResponse.publicMetadata?.role || "user").toLowerCase();

        if (requesterRole !== "master") {
            return NextResponse.json({ error: "Forbidden: Only MASTER can manage permissions" }, { status: 403 });
        }

        const { role, sidebarItems } = await req.json();

        if (!role || !sidebarItems) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const updatedPermission = await prisma.sidebarPermission.upsert({
            where: { role: role.toLowerCase() },
            update: { sidebarItems },
            create: { role: role.toLowerCase(), sidebarItems }
        });

        return NextResponse.json({ success: true, updatedPermission });
    } catch (error) {
        console.error("POST /api/admin/sidebar error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
