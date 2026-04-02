import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// GET — Payment Hub analytics for a form
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: formId } = await params;
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const range = searchParams.get("range") || "today"; // today | yesterday | week | month | custom
        const from = searchParams.get("from");
        const to = searchParams.get("to");

        const now = new Date();

        let startDate: Date;
        let endDate: Date = new Date(now);
        endDate.setHours(23, 59, 59, 999);

        switch (range) {
            case "yesterday": {
                const y = new Date(now);
                y.setDate(now.getDate() - 1);
                startDate = new Date(y); startDate.setHours(0, 0, 0, 0);
                endDate = new Date(y); endDate.setHours(23, 59, 59, 999);
                break;
            }
            case "week": {
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay()); // Sunday
                startDate.setHours(0, 0, 0, 0);
                break;
            }
            case "month": {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                startDate.setHours(0, 0, 0, 0);
                break;
            }
            case "custom": {
                startDate = from ? new Date(from) : new Date(now); startDate.setHours(0, 0, 0, 0);
                endDate = to ? new Date(to) : new Date(now); endDate.setHours(23, 59, 59, 999);
                break;
            }
            default: { // today
                startDate = new Date(now); startDate.setHours(0, 0, 0, 0);
                break;
            }
        }

        const payments = await (prisma as any).formPayment.findMany({
            where: {
                formId,
                paymentDate: { gte: startDate, lte: endDate }
            },
            orderBy: { paymentDate: "desc" },
            include: {
                response: {
                    select: {
                        id: true,
                        submittedByName: true,
                        values: { take: 3 }
                    }
                }
            }
        });

        const totalAmount = payments.reduce((s: number, p: any) => s + p.amount, 0);
        const totalReceived = payments.reduce((s: number, p: any) => s + p.received, 0);
        const totalPending = totalAmount - totalReceived;

        // Group by day for chart
        const byDay: Record<string, { amount: number; received: number; count: number }> = {};
        payments.forEach((p: any) => {
            const day = new Date(p.paymentDate).toISOString().split("T")[0];
            if (!byDay[day]) byDay[day] = { amount: 0, received: 0, count: 0 };
            byDay[day].amount += p.amount;
            byDay[day].received += p.received;
            byDay[day].count++;
        });

        return NextResponse.json({
            payments,
            summary: {
                totalAmount,
                totalReceived,
                totalPending,
                count: payments.length
            },
            byDay,
            range,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });
    } catch (error) {
        console.error("Payment Hub Analytics Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
