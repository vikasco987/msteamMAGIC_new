import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const settings = await prisma.businessSettings.findFirst();
        return NextResponse.json(settings || {});
    } catch (error) {
        console.error("GET /api/admin/settings/business error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, address, gstin, phone, email, website, logo } = body;

        const existing = await prisma.businessSettings.findFirst();

        let settings;
        if (existing) {
            settings = await prisma.businessSettings.update({
                where: { id: existing.id },
                data: { name, address, gstin, phone, email, website, logo }
            });
        } else {
            settings = await prisma.businessSettings.create({
                data: { name, address, gstin, phone, email, website, logo }
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("POST /api/admin/settings/business error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
