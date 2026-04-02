import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await currentUser();
        const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        const userRole = ((user?.publicMetadata?.role as string) || dbUser?.role || "GUEST").toUpperCase();
        const isMaster = ["ADMIN", "MASTER", "TL"].includes(userRole);

        if (!isMaster) {
            return NextResponse.json({ error: "Forbidden: Admin/TL access only" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = Math.min(parseInt(searchParams.get("limit") || "15"), 50); // Hard limit reduced for speed
        const skip = (page - 1) * limit;
        const search = searchParams.get("search") || "";
        const formId = searchParams.get("formId");
        const assignedTo = searchParams.get("assignedTo");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const submitterId = searchParams.get("submitterId");
        const conditionsStr = searchParams.get("conditions") || "[]";
        
        let conditions: any[] = [];
        try { conditions = JSON.parse(conditionsStr); } catch (e) {}

        // TL Scope
        let teamMemberIds: string[] = [];
        if (userRole === "TL") {
            const members = await prisma.user.findMany({
                where: { leaderId: userId },
                select: { clerkId: true }
            });
            teamMemberIds = [userId, ...members.map(m => m.clerkId)];
        }

        // 🏎️ ACCELERATED SEARCH (Pre-filter IDs)
        let searchableResponseIds: string[] | undefined = undefined;
        if (search && search.length > 2) {
             const [valMatches, intMatches] = await Promise.all([
                 prisma.responseValue.findMany({
                     where: { value: { contains: search, mode: 'insensitive' } },
                     select: { responseId: true },
                     take: 1000
                 }),
                 prisma.internalValue.findMany({
                     where: { value: { contains: search, mode: 'insensitive' } },
                     select: { responseId: true },
                     take: 1000
                 })
             ]);
             searchableResponseIds = [...new Set([...valMatches.map(m => m.responseId), ...intMatches.map(m => m.responseId)])];
        }

        const where: any = {
            ...(formId ? { formId } : {}),
            ...(assignedTo ? (assignedTo === "unassigned" ? { assignedTo: { isEmpty: true } } : { assignedTo: { has: assignedTo } }) : {}),
            ...(submitterId ? { submittedBy: submitterId } : {}),
            ...(startDate || endDate ? {
                submittedAt: {
                    ...(startDate ? { gte: new Date(startDate) } : {}),
                    ...(endDate ? { lte: new Date(endDate) } : {}),
                }
            } : {}),
            ...(userRole === "TL" ? {
                OR: [
                    { assignedTo: { hasSome: teamMemberIds } },
                    { submittedBy: { in: teamMemberIds } }
                ]
            } : {}),
            AND: [
                ...(searchableResponseIds ? [{ id: { in: searchableResponseIds } }] : 
                   search ? [{ submittedByName: { contains: search, mode: 'insensitive' } }] : []),
                // Advanced Conditions
                ...conditions.map(c => {
                    const { colId, val } = c;
                    if (!val) return {};
                    if (colId === "__status") {
                        if (val === "New Lead") {
                             return {
                                 OR: [
                                     { remarks: { some: { followUpStatus: { equals: val, mode: "insensitive" } } } },
                                     { remarks: { none: {} } }
                                 ]
                             };
                        }
                        return { remarks: { some: { followUpStatus: { equals: val, mode: "insensitive" } } } };
                    }
                    if (colId === "__assigned") {
                        return val === "unassigned" ? { assignedTo: { isEmpty: true } } : { assignedTo: { has: val } };
                    }
                    if (colId === "submittedByName") {
                        return { submittedByName: { contains: val, mode: 'insensitive' } };
                    }
                    return {
                        OR: [
                            { values: { some: { fieldId: colId, value: { contains: val, mode: 'insensitive' } } } },
                            { internalValues: { some: { columnId: colId, value: { contains: val, mode: 'insensitive' } } } }
                        ]
                    };
                })
            ]
        };

        const fetchData = async () => {
            return await prisma.formResponse.findMany({
                where,
                select: {
                    id: true,
                    formId: true,
                    submittedByName: true,
                    submittedBy: true,
                    submittedAt: true,
                    assignedTo: true,
                    visibleToUsers: true,
                    values: { select: { fieldId: true, value: true } },
                    internalValues: { select: { columnId: true, value: true } },
                    remarks: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: { followUpStatus: true, remark: true }
                    }
                },
                orderBy: { submittedAt: 'desc' },
                skip,
                take: limit
            });
        };

        // Get unique submitters for this specific form to populate dropdown
        const getUniqueSubmitters = async () => {
            if (!formId) return [];
            const submitters = await prisma.formResponse.findMany({
                where: { formId },
                select: { submittedBy: true, submittedByName: true },
                distinct: ['submittedBy']
            });
            return submitters;
        };

        const [total, responses, formStructure, uniqueSubmitters] = await Promise.all([
            prisma.formResponse.count({ where }),
            fetchData(),
            formId ? prisma.dynamicForm.findUnique({
                where: { id: formId },
                include: { fields: true, internalColumns: true }
            }) : null,
            getUniqueSubmitters()
        ]);

        return NextResponse.json({
            responses,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            formStructure,
            uniqueSubmitters
        });
    } catch (error) {
        console.error("Leads Fetch Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { userId: currentUserId } = await auth();
        if (!currentUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { ids, assignedTo } = await req.json();
        if (!ids || !Array.isArray(ids)) return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
        await prisma.formResponse.updateMany({ where: { id: { in: ids } }, data: { assignedTo: assignedTo } });
        return NextResponse.json({ success: true, count: ids.length });
    } catch (e) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
