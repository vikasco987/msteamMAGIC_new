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

        const DEFAULT_PERMISSIONS: Record<string, string[]> = {
            master: ['Dashboard', 'Team Board', 'Create Task', 'Assigned Task', 'Recovery Hub', 'KAM Strategy', 'Sales Matrix', 'Team Sales', 'My Growth', 'CRM Forms', 'Lead Terminal', 'Follow-up Board', 'Call Report', 'Financial Ecosystem', 'Payment Portal', 'Profit & Loss', 'Attendance', 'Tish Control', 'Activity Log', 'Daily Payments', 'Lifecycle Report', 'Customers', 'Agreements', 'Setup Agreement', 'Timeline', 'Business Setup', 'DB Backups'],
            admin: ['Dashboard', 'Team Board', 'Create Task', 'Assigned Task', 'Recovery Hub', 'KAM Strategy', 'Team Sales', 'My Growth', 'CRM Forms', 'Lead Terminal', 'Follow-up Board', 'Call Report', 'Financial Ecosystem', 'Payment Portal', 'Attendance', 'Tish Control', 'Activity Log', 'Daily Payments', 'Lifecycle Report', 'Customers', 'Agreements', 'Setup Agreement', 'Timeline', 'Business Setup'],
            tl: ['Dashboard', 'Team Board', 'Create Task', 'Assigned Task', 'Recovery Hub', 'KAM Strategy', 'Team Sales', 'My Growth', 'CRM Forms', 'Lead Terminal', 'Follow-up Board', 'Call Report', 'Financial Ecosystem', 'Payment Portal', 'Attendance', 'Tish Control', 'Activity Log', 'Daily Payments', 'Lifecycle Report', 'Customers', 'Agreements', 'Setup Agreement', 'Timeline'],
            seller: ['Dashboard', 'Team Board', 'Create Task', 'Assigned Task', 'Recovery Hub', 'KAM Strategy', 'My Growth', 'CRM Forms', 'Payment Portal', 'Follow-up Board', 'Call Report', 'Attendance', 'Activity Log', 'Customers', 'Agreements', 'Setup Agreement', 'Timeline'],
            user: ['Team Board', 'Create Task', 'CRM Forms', 'Activity Log'],
            manager: ['CRM Forms', 'Follow-up Board'],
            intern: ['CRM Forms'],
            guest: ['CRM Forms']
        };

        let finalItems = permission ? permission.sidebarItems : (DEFAULT_PERMISSIONS[role.toLowerCase()] || []);

        // --- INJECT NEW FEATURES IF MISSING ---
        if (role.toLowerCase() === 'master') {
            const masterMustHaves = ['Employee Directory', 'Payroll Management', 'Access Control', 'Team Management', 'Employee Insights', 'Client Locator', 'DB Backups', 'POS Sign-ups'];
            masterMustHaves.forEach(item => {
                if (!finalItems.includes(item)) finalItems.push(item);
            });
        }
        if (role.toLowerCase() === 'admin') {
            const adminMustHaves = ['Payroll Management', 'Employee Insights', 'Client Locator', 'POS Sign-ups'];
            adminMustHaves.forEach(item => {
                if (!finalItems.includes(item)) finalItems.push(item);
            });
        }

        return NextResponse.json({ sidebarItems: finalItems });
    } catch (error) {
        console.error("GET /api/admin/sidebar/per-role error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
