import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const role = searchParams.get('role');

        if (!role) {
            return NextResponse.json({ error: "Missing role" }, { status: 400 });
        }

        const permission = await prisma.sidebarPermission.findUnique({
            where: { role: role.toLowerCase() }
        });

        if (!permission) {
            const DEFAULT_PERMISSIONS: Record<string, string[]> = {
                master: ['Dashboard', 'Team Board', 'Create Task', 'Assigned Task', 'Recovery Hub', 'KAM Strategy', 'Sales Matrix', 'Team Sales', 'My Growth', 'CRM Forms', 'Lead Terminal', 'Follow-up Board', 'Call Report', 'Attendance', 'Tish Control', 'Activity Log', 'Lifecycle Report', 'Customers', 'Agreements', 'Timeline', 'DB Backups'],
                admin: ['Dashboard', 'Team Board', 'Create Task', 'Assigned Task', 'Recovery Hub', 'KAM Strategy', 'Team Sales', 'My Growth', 'CRM Forms', 'Lead Terminal', 'Follow-up Board', 'Call Report', 'Attendance', 'Tish Control', 'Activity Log', 'Lifecycle Report', 'Customers', 'Agreements', 'Timeline'],
                tl: ['Dashboard', 'Team Board', 'Create Task', 'Assigned Task', 'Recovery Hub', 'KAM Strategy', 'Team Sales', 'My Growth', 'CRM Forms', 'Lead Terminal', 'Follow-up Board', 'Call Report', 'Attendance', 'Tish Control', 'Activity Log', 'Lifecycle Report', 'Customers', 'Agreements', 'Timeline'],
                seller: ['Dashboard', 'Team Board', 'Create Task', 'Assigned Task', 'Recovery Hub', 'KAM Strategy', 'My Growth', 'CRM Forms', 'Follow-up Board', 'Call Report', 'Attendance', 'Activity Log', 'Customers', 'Agreements', 'Timeline'],
                user: ['Team Board', 'Create Task', 'CRM Forms', 'Activity Log'],
                manager: ['CRM Forms', 'Follow-up Board'],
                intern: ['CRM Forms'],
                guest: ['CRM Forms']
            };
            return NextResponse.json({ sidebarItems: DEFAULT_PERMISSIONS[role.toLowerCase()] || [] });
        }

        return NextResponse.json({ sidebarItems: permission.sidebarItems });
    } catch (error) {
        console.error("GET /api/admin/sidebar/per-role error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
