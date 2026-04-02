import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        const { userId } = await auth();

        let userRole = null;
        if (userId) {
            const dbUser = await prisma.user.findUnique({
                where: { clerkId: userId },
                select: { role: true }
            });
            userRole = dbUser?.role || null;
        }

        const form = await prisma.dynamicForm.findUnique({
            where: { id },
            include: { fields: { orderBy: { order: "asc" } } }
        });

        if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

        return NextResponse.json({ form, userRole });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { title, description, isPublished, fields, visibleToRoles, visibleToUsers, defaultColumnOrder, defaultHiddenColumns } = body;
 
         // Simple update for metadata
         const updateData: any = {};
         if (title !== undefined) updateData.title = title;
         if (description !== undefined) updateData.description = description;
         if (isPublished !== undefined) updateData.isPublished = isPublished;
         if (visibleToRoles !== undefined) updateData.visibleToRoles = visibleToRoles;
         if (visibleToUsers !== undefined) updateData.visibleToUsers = visibleToUsers;
         if (defaultColumnOrder !== undefined) updateData.defaultColumnOrder = defaultColumnOrder;
         if (defaultHiddenColumns !== undefined) updateData.defaultHiddenColumns = defaultHiddenColumns;
 
         const form = await prisma.dynamicForm.update({
             where: { id },
             data: updateData
         });

        if (fields) {
            const existingFields = await prisma.formField.findMany({ where: { formId: id } });
            const fieldsToDelete = existingFields.filter(ex => !fields.some((f: any) => f.id === ex.id));

            // Safely delete removed fields and their response values first to avoid constraint errors
            if (fieldsToDelete.length > 0) {
                const deleteIds = fieldsToDelete.map(f => f.id);
                await prisma.responseValue.deleteMany({ where: { fieldId: { in: deleteIds } } });
                await prisma.formField.deleteMany({ where: { id: { in: deleteIds } } });
            }

            // Update or Create fields
            for (let i = 0; i < fields.length; i++) {
                const f = fields[i];
                const isExisting = f.id && existingFields.some(ex => ex.id === f.id);

                if (isExisting) {
                    await prisma.formField.update({
                        where: { id: f.id },
                        data: {
                            label: f.label,
                            type: f.type,
                            placeholder: f.placeholder,
                            required: f.required || false,
                            options: f.options || [],
                            order: i
                        }
                    });
                } else {
                    await prisma.formField.create({
                        data: {
                            formId: id,
                            label: f.label,
                            type: f.type,
                            placeholder: f.placeholder,
                            required: f.required || false,
                            options: f.options || [],
                            order: i
                        }
                    });
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = resolvedParams.id;

        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        if (!id || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
            return NextResponse.json({ error: "Invalid form ID format" }, { status: 400 });
        }

        const existingForm = await prisma.dynamicForm.findUnique({ where: { id } });
        if (!existingForm) {
            return NextResponse.json({ error: "Form not found" }, { status: 404 });
        }

        // 1️⃣ Find all fields and columns
        const fields = await prisma.formField.findMany({ where: { formId: id } });
        const fieldIds = fields.map(f => f.id);

        const internalCols = await prisma.internalColumn.findMany({ where: { formId: id } });
        const colIds = internalCols.map(c => c.id);

        const responses = await prisma.formResponse.findMany({ where: { formId: id } });
        const responseIds = responses.map(r => r.id);

        // 2️⃣ Delete all deep child relations (Values, Activities, Views, Analysis)
        if (fieldIds.length > 0) {
            await prisma.responseValue.deleteMany({ where: { fieldId: { in: fieldIds } } });
        }

        if (colIds.length > 0) {
            await prisma.internalValue.deleteMany({ where: { columnId: { in: colIds } } });
        }

        if (responseIds.length > 0) {
            // Failsafe delete values again by responseId to be 100% sure
            await prisma.responseValue.deleteMany({ where: { responseId: { in: responseIds } } });
            await prisma.internalValue.deleteMany({ where: { responseId: { in: responseIds } } });
            await prisma.formActivity.deleteMany({ where: { responseId: { in: responseIds } } });
        }

        // 3️⃣ Delete mid-level relations (Responses, Fields, Columns, Views, Analysis)
        await prisma.formResponse.deleteMany({ where: { formId: id } });
        await prisma.formField.deleteMany({ where: { formId: id } });
        await prisma.internalColumn.deleteMany({ where: { formId: id } });
        await prisma.savedView.deleteMany({ where: { formId: id } });
        await prisma.aIAnalysis.deleteMany({ where: { formId: id } });

        // 4️⃣ Finally delete the Form itself
        await prisma.dynamicForm.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("DELETE FORM ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
