import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id: responseId } = await params;
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { name, phone, email, remark } = body;

        if (!name || !phone) return NextResponse.json({ error: "Name and Phone required" }, { status: 400 });

        const customer = await prisma.customer.upsert({
            where: { phone },
            update: {
                name,
                email: email || undefined,
                remarks: { push: remark ? [remark] : [] }
            },
            create: {
                name,
                phone,
                email: email || null,
                remarks: remark ? [remark] : []
            }
        });

        return NextResponse.json({ customer });
    } catch (error) {
        console.error("Convert to Lead Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
