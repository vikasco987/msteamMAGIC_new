import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { params } = context;
        const formId = (await params).id;
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { type } = await req.json(); // "remarks" or "sales"

        // Verify write access
        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        const form = await prisma.dynamicForm.findUnique({ where: { id: formId } });

        if (!form) {
            return NextResponse.json({ error: "Form not found" }, { status: 404 });
        }

        const isFormOwner = form.createdBy === userId;
        const userRole = (user?.role || "GUEST").toUpperCase();
        const isMaster = userRole === "MASTER" || userRole === "ADMIN" || userRole === "TL" || isFormOwner || userRole === "PURE_MASTER";

        if (!isMaster) {
            return NextResponse.json({ error: "Only admins can manage system columns" }, { status: 403 });
        }

        const currentCols = await prisma.internalColumn.findMany({
            where: { formId }
        });

        let colOrder = currentCols.length;
        const newCols = [];

        if (type === "remarks") {
            if (!currentCols.some(c => c.label === "Recent Remark")) {
                newCols.push(await prisma.internalColumn.create({
                    data: { formId, label: "Recent Remark", type: "text", options: {}, order: colOrder++ }
                }));
            }
            if (!currentCols.some(c => c.label === "Next Follow-up Date")) {
                newCols.push(await prisma.internalColumn.create({
                    data: { formId, label: "Next Follow-up Date", type: "date", options: {}, order: colOrder++ }
                }));
            }
        }
        else if (type === "sales") {
            if (!currentCols.some(c => c.label === "Amount")) {
                newCols.push(await prisma.internalColumn.create({
                    data: { formId, label: "Amount", type: "currency", options: {}, order: colOrder++ }
                }));
            }
            if (!currentCols.some(c => c.label === "Received")) {
                newCols.push(await prisma.internalColumn.create({
                    data: { formId, label: "Received", type: "currency", options: {}, order: colOrder++ }
                }));
            }
            if (!currentCols.some(c => c.label === "Pending")) {
                newCols.push(await prisma.internalColumn.create({
                    data: { formId, label: "Pending", type: "formula", defaultValue: "Amount - Received", options: {}, order: colOrder++ }
                }));
            }
        }

        return NextResponse.json({ success: true, newColumnsAdded: newCols.length });
    } catch (error: any) {
        console.error("Error creating hub columns:", error);
        return NextResponse.json({ error: "Failed to create columns", details: error.message }, { status: 500 });
    }
}
