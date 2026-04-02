import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const MARKETING_FORM_ID = "69b8f819a8a6f09fd11148c7";

export async function GET(req: Request) {
    try {
        const { userId: authUserId } = await auth();
        if (!authUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get("days") || "7");

        const staff = await prisma.user.findMany({
            where: { role: { in: ["USER", "TL", "ADMIN", "MASTER", "SELLER", "INTERN", "GUEST", "MANAGER"] } },
            select: { clerkId: true, name: true, email: true }
        });

        const leads = await prisma.formResponse.findMany({
            where: { formId: MARKETING_FORM_ID },
            select: { 
                id: true, assignedTo: true, submittedAt: true,
                remarks: { select: { id: true }, take: 1 }
            },
            orderBy: { submittedAt: 'desc' },
            take: 2000 
        });

        const report = staff.map(user => {
            const uid = user.clerkId;
            const userLeads = leads.filter(l => l.assignedTo[l.assignedTo.length - 1] === uid);
            const dailyBreakdown: Record<string, { total: number, untouched: number }> = {};
            
            userLeads.forEach(lead => {
                const dayKey = new Date(lead.submittedAt).toISOString().split('T')[0];
                if (!dailyBreakdown[dayKey]) dailyBreakdown[dayKey] = { total: 0, untouched: 0 };
                dailyBreakdown[dayKey].total++;
                if (!lead.remarks || lead.remarks.length === 0) dailyBreakdown[dayKey].untouched++;
            });

            return {
                userId: uid,
                name: user.name || user.email.split('@')[0],
                stats: Object.entries(dailyBreakdown)
                    .map(([date, data]) => ({ date, ...data }))
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, days)
            };
        }).filter(u => u.stats.length > 0);

        return NextResponse.json({ audit: report });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
