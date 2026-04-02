import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

// GET — All payments for a response
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; responseId: string }> }
) {
    try {
        const { id: formId, responseId } = await params;
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payments = await (prisma as any).formPayment.findMany({
            where: { responseId },
            orderBy: { paymentDate: "desc" }
        });

        return NextResponse.json({ payments });
    } catch (error) {
        console.error("GET Payments Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST — Add a payment entry
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; responseId: string }> }
) {
    try {
        const { id: formId, responseId } = await params;
        const user = await currentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { amount, received, note, paymentDate } = body;

        if (amount === undefined || amount === null || isNaN(Number(amount))) {
            return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
        }

        const payment = await (prisma as any).formPayment.create({
            data: {
                responseId,
                formId,
                amount: Number(amount),
                received: Number(received || 0),
                note: note || null,
                paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                createdById: user.id,
                createdByName: user.firstName
                    ? `${user.firstName} ${user.lastName || ""}`.trim()
                    : user.emailAddresses[0]?.emailAddress?.split("@")[0] || "User"
            }
        });

        // Recalculate totals after addition
        const allPayments = await (prisma as any).formPayment.findMany({ where: { responseId } });
        const totalAmount = allPayments.reduce((s: number, p: any) => s + p.amount, 0);
        const totalReceived = allPayments.reduce((s: number, p: any) => s + p.received, 0);

        // Sync to internal columns: Amount, Received, Pending
        await syncPaymentColumns(formId, responseId, totalAmount, totalReceived);

        return NextResponse.json({ success: true, payment });
    } catch (error) {
        console.error("POST Payment Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE — Remove a payment entry
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; responseId: string }> }
) {
    try {
        const { id: formId, responseId } = await params;
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const url = new URL(req.url);
        const paymentId = url.searchParams.get("paymentId");
        if (!paymentId) return NextResponse.json({ error: "paymentId required" }, { status: 400 });

        await (prisma as any).formPayment.delete({ where: { id: paymentId } });

        // Recalculate totals after deletion
        const allPayments = await (prisma as any).formPayment.findMany({ where: { responseId } });
        const totalAmount = allPayments.reduce((s: number, p: any) => s + p.amount, 0);
        const totalReceived = allPayments.reduce((s: number, p: any) => s + p.received, 0);
        await syncPaymentColumns(formId, responseId, totalAmount, totalReceived);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Payment Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Helper: Sync Amount/Received/Pending to InternalColumns
async function syncPaymentColumns(formId: string, responseId: string, amount: number, received: number) {
    const pending = amount - received;
    const cols = await prisma.internalColumn.findMany({
        where: { formId, label: { in: ["Amount", "Received", "Pending"] } }
    });

    const colMap: Record<string, string> = {};
    cols.forEach(c => { colMap[c.label] = c.id; });

    const updates: { label: string; value: string }[] = [
        { label: "Amount", value: String(amount) },
        { label: "Received", value: String(received) },
        { label: "Pending", value: String(pending) }
    ];

    for (const u of updates) {
        const colId = colMap[u.label];
        if (!colId) continue;
        await (prisma as any).internalValue.upsert({
            where: { responseId_columnId: { responseId, columnId: colId } } as any,
            update: { value: u.value },
            create: { responseId, columnId: colId, value: u.value }
        });
    }
}
