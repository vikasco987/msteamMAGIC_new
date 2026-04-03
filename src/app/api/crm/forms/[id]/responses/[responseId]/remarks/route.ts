import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { processRemarkAutomation } from "@/lib/automation";
import { emitMatrixUpdate } from "@/lib/socket-server";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string, responseId: string } }
) {
    try {
        const { id, responseId } = await params;
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const remarks = await (prisma as any).formRemark.findMany({
            where: { responseId },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ remarks });
    } catch (error: any) {
        console.error("Remarks API Error:", error); return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string, responseId: string } }
) {
    try {
        const { id, responseId } = await params;
        const user = await currentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { remark, nextFollowUpDate, followUpStatus, leadStatus, columnId, requestId } = body;

        if (!remark) {
            return NextResponse.json({ error: "Remark text is required" }, { status: 400 });
        }

        const cleanedFormId = id.trim();
        const cleanedResponseId = responseId.trim();

        // 🛡️ IDEMPOTENCY CHECK: Prevention of double entries via requestId
        if (requestId) {
            const existingRequest = await (prisma as any).formRemark.findFirst({
                where: { requestId: String(requestId) }
            });
            if (existingRequest) {
                console.log("⚡ IDEMPOTENCY HIT: Returning existing remark");
                return NextResponse.json({ success: true, remark: existingRequest, idempotent: true });
            }
        }

        let newRemark;
        try {
            newRemark = await (prisma as any).formRemark.create({
                data: {
                    responseId: cleanedResponseId,
                    remark,
                    requestId: requestId ? String(requestId) : null, // 🛡️ STORE IDEMPOTENCY KEY
                    nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
                    followUpStatus: followUpStatus || null,
                    leadStatus: leadStatus || null,
                    columnId: columnId?.trim() || null,
                    authorName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.emailAddresses[0].emailAddress.split('@')[0],
                    authorEmail: user.emailAddresses[0].emailAddress,
                    createdById: user.id
                }
            });
        } catch (e: any) {
            if (e.message.includes("columnId") || e.message.includes("requestId")) {
                newRemark = await (prisma as any).formRemark.create({
                    data: {
                        responseId: cleanedResponseId,
                        remark,
                        requestId: requestId ? String(requestId) : null, // 🛡️ STORE IDEMPOTENCY KEY
                        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
                        followUpStatus: followUpStatus || null,
                        authorName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.emailAddresses[0].emailAddress.split('@')[0],
                        authorEmail: user.emailAddresses[0].emailAddress,
                        createdById: user.id
                    }
                });
            }
        }
        
        // 🚀 CRITICAL PERFORMANCE ENGINE: Mark response as touched
        await prisma.formResponse.update({
            where: { id: cleanedResponseId },
            data: { isTouched: true }
        });

        // Broad-Spectrum Sync (Automation + Lifecycle)
        await Promise.all([
            prisma.formActivity.create({
                data: {
                    responseId: cleanedResponseId, userId: user.id,
                    userName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "Staff",
                    type: "NOTE_ADDED", newValue: remark, columnName: columnId ? "Status Update" : "Remark"
                }
            }),
            processRemarkAutomation({
                responseId: cleanedResponseId, remark, status: followUpStatus || null,
                userId: user.id, userName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "Staff", formId: cleanedFormId
            })
        ]);

        // 🛡️ FINANCIAL & TAXONOMY SYNC (STAYING ACCURATE)
        const remarkCols = await prisma.internalColumn.findMany({
            where: {
                formId: cleanedFormId,
                OR: [
                    { label: { in: ["Recent Remark", "Next Follow-up Date", "Follow-up Status", "Lead Status", "Status", "STATUS", "Calling Status"] } },
                    { label: { contains: "Calling Date", mode: 'insensitive' } }
                ]
            }
        });

        // 🚀 BATCH FETCH EXISTING VALUES TO PREVENT N+1 LOOKUPS (HUGE PERFORMANCE WIN)
        const existingValues = await (prisma as any).internalValue.findMany({
            where: {
                responseId: cleanedResponseId,
                columnId: { in: remarkCols.map((c: any) => c.id) }
            }
        });

        const syncToValue = async (colLabel: string, val: string) => {
            if (!val) return;
            const col = remarkCols.find(c => c.label.toUpperCase().trim() === colLabel.toUpperCase().trim());
            if (!col) return;

            // Use the pre-fetched list to avoid DB call within loop
            const existing = existingValues.find((v: any) => v.columnId === col.id);
            const valueContent = val.trim();

            if (existing) {
                if (existing.value === valueContent) return; // Skip if no change to reduce DB load
                await (prisma as any).internalValue.update({ 
                    where: { id: existing.id }, 
                    data: { value: valueContent, updatedByName: user.firstName || "System" } 
                });
            } else {
                await (prisma as any).internalValue.create({ 
                    data: { responseId: cleanedResponseId, columnId: col.id, value: valueContent, updatedByName: user.firstName || "System" } 
                });
            }
        };

        const masterStatus = followUpStatus || leadStatus || null;
        const syncTasks: Promise<void>[] = [];

        if (masterStatus) {
            const variants = ["Status", "STATUS", "Follow-up Status", "Calling Status", "Lead Status"];
            variants.forEach(v => syncTasks.push(syncToValue(v, masterStatus)));
        }

        syncTasks.push(syncToValue("Recent Remark", remark));
        if (nextFollowUpDate) syncTasks.push(syncToValue("Next Follow-up Date", String(nextFollowUpDate)));
        
        // 📅 CLOCK SYNC
        const todayStr = new Date().toISOString().split('T')[0];
        const actualCallingCols = remarkCols.filter(c => c.label.toLowerCase().includes("calling date"));
        actualCallingCols.forEach(col => syncTasks.push(syncToValue(col.label, todayStr)));

        // Execute all syncs in parallel
        await Promise.all(syncTasks);

        // 🚀 THE FINALE: BROADCAST TO MATRIX ⚡⚡⚡
        console.log("🔥 API COMPLETED SUCCESSFULLY - MATRIX READY");
        try {
            emitMatrixUpdate({ 
                formId: cleanedFormId, 
                responseId: cleanedResponseId, 
                type: "REMARK_ADDED" 
            }); 
        } catch (e) {
            console.error("Matrix Broadcast Error:", e);
        }

        return NextResponse.json({ success: true, remark: newRemark });
    } catch (error: any) {
        console.error("Remarks API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string; responseId: string }> }
) {
    try {
        const { id, responseId } = await context.params;
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const url = new URL(req.url);
        const remarkId = url.searchParams.get("remarkId");
        if (!remarkId) return NextResponse.json({ error: "Remark ID required" }, { status: 400 });
        const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!dbUser || (dbUser.role !== 'MASTER' && dbUser.role !== 'ADMIN')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const cleanedResponseId = responseId.trim();
        await (prisma as any).formRemark.delete({ where: { id: remarkId } });
        
        // 🚀 SYNC BACK: Check if any remarks remain to reset touched state
        const remainingRemarks = await (prisma as any).formRemark.count({ where: { responseId: cleanedResponseId } });
        if (remainingRemarks === 0) {
            await prisma.formResponse.update({
                where: { id: cleanedResponseId },
                data: { isTouched: false }
            });
        }

        console.log("Triggering Real-time Delete Sync Shard... 🛰️");
        await emitMatrixUpdate(); // Sync on delete too! 🛰️ (MUST AWAIT ON VERCEL)
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Remarks API Error:", error); return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
