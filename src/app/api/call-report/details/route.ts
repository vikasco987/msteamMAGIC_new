import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export async function GET(req: Request) {
    try {
        const { userId: requesterId } = await auth();
        if (!requesterId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const dateParam = searchParams.get("date");
        const type = searchParams.get("type") || "COMBINED";

        if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

        const targetDate = dateParam ? parseISO(dateParam) : new Date();
        const start = startOfDay(targetDate);
        const end = endOfDay(targetDate);

        // 🛡️ ANALYTICAL ISOLATION: Fetch only remarks logged by THIS specific staff member today
        const [remarks] = await Promise.all([
            prisma.formRemark.findMany({ 
                where: {
                    createdById: userId,
                    createdAt: { gte: start, lte: end }
                }
            })
        ]);

        const responseIdInteractions = new Map<string, { type: 'NEW' | 'FOLLOWUP' }>();

        for (const r of remarks) {
            const respId = r.responseId;
            if (!responseIdInteractions.has(respId)) {
                responseIdInteractions.set(respId, { type: 'FOLLOWUP' });
            }
            if (r.columnId) {
                responseIdInteractions.get(respId)!.type = 'NEW';
            }
        }

        const targetResponseIds = Array.from(responseIdInteractions.entries())
            .filter(([_, info]) => {
                if (type === "COMBINED") return true;
                return info.type === type;
            })
            .map(([id]) => id);

        if (targetResponseIds.length === 0) {
            return NextResponse.json({ forms: [] });
        }

        // 3. Fetch full Response details grouped by Form
        // 🛡️ CRITICAL FIX: The 'remarks' sub-query MUST be filtered by createdById: userId
        // This prevents re-assigned lead remarks from leaking into the wrong staff card.
        const responses = await prisma.formResponse.findMany({
            where: { id: { in: targetResponseIds } },
            include: {
                form: {
                    include: {
                        fields: true,
                        internalColumns: true
                    }
                },
                values: true,
                internalValues: true,
                remarks: {
                    where: { createdById: userId, createdAt: { gte: start, lte: end } },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        // Group by form to handle different columns
        const groupedByForm: Record<string, any> = {};

        responses.forEach(res => {
            if (!groupedByForm[res.formId]) {
                groupedByForm[res.formId] = {
                    form: res.form,
                    responses: []
                };
            }
            
            // Preferred remark context
            const relevantRemark = res.remarks[0];

            groupedByForm[res.formId].responses.push({
                id: res.id,
                submittedByName: res.submittedByName,
                submittedAt: res.submittedAt,
                lastStatus: relevantRemark?.followUpStatus || "N/A",
                lastRemark: relevantRemark?.text || relevantRemark?.remark || "",
                interactionDate: relevantRemark?.createdAt || res.submittedAt, 
                interactedBy: relevantRemark?.authorName || "Staff Member", 
                values: res.values.map(v => ({ fieldId: v.fieldId, value: v.value })),
                internalValues: res.internalValues.map(v => ({ columnId: v.columnId, value: v.value }))
            });
        });

        return NextResponse.json({
            forms: Object.values(groupedByForm)
        });

    } catch (e: any) {
        console.error("Call report details API error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
