import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { emitMatrixUpdate } from "@/lib/socket-server";

export const maxDuration = 300; // Allow 5 minutes for large bulk imports

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: formId } = await params;
        const user = await currentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Requires Master/Admin check
        const metaRole = (user?.publicMetadata?.role as string || "").toUpperCase();
        const dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } });
        const dbRole = (dbUser?.role || "").toUpperCase();
        const userRole = (metaRole || dbRole || "GUEST").toUpperCase();

        const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.emailAddresses[0]?.emailAddress || "User";
        
        const isMaster = userRole === "ADMIN" || userRole === "MASTER" || userRole === "PURE_MASTER" || userRole === "TL";
        const isStaff = isMaster || userRole === "TL" || userRole === "SELLER" || userRole === "MANAGER";

        if (!isStaff) {
            console.error(`Forbidden bulk-import attempt by ${user.id} (${userName}) with role ${userRole}`);
            return NextResponse.json({ error: `Forbidden: You do not have permission for bulk operations (Current Role: ${userRole})` }, { status: 403 });
        }

        console.log(`Starting bulk import for form ${formId} by ${userName} (${userRole})`);

        const body = await req.json();
        const payload = body as {
            data: Record<string, string>[];
            matchColumnId: string;
            matchExcelHeader: string;
            updateColumnMap: Record<string, { id: string; isInternal: boolean }>;
            isInternalMatch: boolean;
            importMode?: 'update' | 'create' | 'upsert';
            disableActivityLogs?: boolean;
        };

        const { data, matchColumnId, matchExcelHeader, updateColumnMap, isInternalMatch, importMode = 'update', disableActivityLogs = false } = payload;

        if (!data || data.length === 0 || ((importMode === 'update' || importMode === 'upsert') && !matchColumnId)) {
            return NextResponse.json({ error: "Invalid data or match column missing" }, { status: 400 });
        }

        let successCount = 0;
        let createdCount = 0;
        let updatedCount = 0;
        let errors: string[] = [];

        // For faster mapping
        const processedInternalColumns = await prisma.internalColumn.findMany({ where: { formId } });
        const intColMap = new Map(processedInternalColumns.map(c => [c.id, c]));
        const allSystemUsers = await prisma.user.findMany({ select: { clerkId: true, name: true, email: true } });

        // Pre-index users for fast lookup
        const userByName = new Map<string, string>();
        const userByEmail = new Map<string, string>();
        for (const u of allSystemUsers) {
            if (u.name) userByName.set(u.name.toLowerCase().trim(), u.clerkId);
            userByEmail.set(u.email.toLowerCase().trim(), u.clerkId);
        }

        const findUser = (val: string) => {
            const v = val.toLowerCase().trim();
            if (!v) return null;
            const byEmail = userByEmail.get(v);
            if (byEmail) return byEmail;
            const byName = userByName.get(v);
            if (byName) return byName;
            
            // Fuzzy name check (only if really needed, but keep it minimal)
            return allSystemUsers.find(u => (u.name || "").toLowerCase().includes(v))?.clerkId || null;
        };

        // Pre-fetch all target values for matching to avoid N queries and support fuzzy matching
        let allCurrentValues: { responseId: string; value: string }[] = [];
        if (importMode === 'update' || importMode === 'upsert') {
            if (isInternalMatch) {
                allCurrentValues = await prisma.internalValue.findMany({
                    where: { columnId: matchColumnId, response: { formId } },
                    select: { responseId: true, value: true }
                });
            } else {
                allCurrentValues = await prisma.responseValue.findMany({
                    where: { fieldId: matchColumnId, response: { formId } },
                    select: { responseId: true, value: true }
                });
            }
        }

        // Index all current values for ultra-fast $O(1)$ lookups
        const exactMap = new Map<string, string>();
        const normMap = new Map<string, string>();
        const phoneMap = new Map<string, string>();

        for (const v of allCurrentValues) {
            const val = (v.value || "").trim().toLowerCase();
            const norm = val.replace(/[^a-z0-9]/g, "");
            
            if (val && !exactMap.has(val)) exactMap.set(val, v.responseId);
            if (norm && !normMap.has(norm)) normMap.set(norm, v.responseId);
            if (norm.length >= 10 && /^\d+$/.test(norm)) {
                const last10 = norm.slice(-10);
                if (!phoneMap.has(last10)) phoneMap.set(last10, v.responseId);
            }
        }

        // COLLECT ALL MATCHED RESPONSE IDs FIRST (To pre-fetch values)
        const matchedResponseIds: string[] = [];
        if (importMode === 'update' || importMode === 'upsert') {
            for (const row of data) {
                const matchValue = row[matchExcelHeader]?.toString().trim()?.toLowerCase() || "";
                if (!matchValue) continue;

                const norm = matchValue.replace(/[^a-z0-9]/g, "");

                let matchedId = exactMap.get(matchValue);
                if (!matchedId && norm) matchedId = normMap.get(norm);
                if (!matchedId && norm.length >= 10 && /^\d+$/.test(norm)) matchedId = phoneMap.get(norm.slice(-10));
                
                if (matchedId) matchedResponseIds.push(matchedId);
            }
        }

        // PRE-FETCH ALL VALUES FOR THESE RESPONSES
        const [existingInternalValues, existingResponseValues] = await Promise.all([
            prisma.internalValue.findMany({ where: { responseId: { in: matchedResponseIds } } }),
            prisma.responseValue.findMany({ where: { responseId: { in: matchedResponseIds } } })
        ]);

        const intValMap = new Map(existingInternalValues.map(v => [`${v.responseId}_${v.columnId}`, v]));
        const respValMap = new Map(existingResponseValues.map(v => [`${v.responseId}_${v.fieldId}`, v]));

        // Helper to run batches
        // Helper to generate Mongo IDs if needed
        const generateId = () => {
            const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
            const random = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
            return (timestamp + random);
        };

        // Helper to run batches
        const BATCH_SIZE = 500;
        const allAffectedIds: string[] = [];
        
        for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const batch = data.slice(i, i + BATCH_SIZE);
            
            // Maps for deduplication (preventing unique constraint crashes on duplicate rows)
            const internalValuesToCreateMap = new Map<string, any>();
            const responseValuesToCreateMap = new Map<string, any>();
            const individualOpsMap = new Map<string, any>();

            const activitiesToCreate: any[] = [];
            const responsesToCreate: any[] = [];

            // 1. Identify what to update and what to create
            const batchItems = await Promise.all(batch.map(async (row, idx) => {
                const rowIndex = i + idx;
                let responseId: string | null = null;
                let isNew = false;

                if (importMode === 'update' || importMode === 'upsert') {
                    const matchValueRaw = row[matchExcelHeader]?.toString().trim() || "";
                    const val = matchValueRaw.toLowerCase();
                    const norm = val.replace(/[^a-z0-9]/g, "");

                    let matchedId = exactMap.get(val);
                    if (!matchedId && norm) matchedId = normMap.get(norm);
                    if (!matchedId && norm.length >= 10 && /^\d+$/.test(norm)) matchedId = phoneMap.get(norm.slice(-10));

                    if (matchedId) {
                        responseId = matchedId;
                    } else if (importMode === 'upsert') {
                        isNew = true;
                        responseId = generateId();
                    } else {
                        errors.push(`Row ${rowIndex + 1}: No match found for "${matchValueRaw}"`);
                        return null;
                    }
                } else {
                    isNew = true;
                    responseId = generateId();
                }

                return { row, responseId, isNew, rowIndex };
            }));

            const validItems = batchItems.filter(item => item !== null) as { row: Record<string, string>; responseId: string; isNew: boolean; rowIndex: number }[];
            
            // 2. Queue Response creations
            for (const item of validItems) {
                if (item.isNew) {
                    responsesToCreate.push({
                        id: item.responseId,
                        formId,
                        submittedBy: user.id,
                        submittedByName: userName,
                        submittedAt: new Date(),
                        assignedTo: [user.id],
                        isTouched: false // 🚀 NEW: Start as untouched, let data presence toggle it
                    });
                    createdCount++;
                    if (!disableActivityLogs) {
                        activitiesToCreate.push({
                            responseId: item.responseId, userId: user.id, userName: userName,
                            type: "BULK_IMPORT_CREATE", columnName: "System",
                            oldValue: "None", newValue: "New Record via Bulk Upload"
                        });
                    }
                } else {
                    updatedCount++;
                }

                // 3. Build Column Values
                // Create a case-insensitive, trimmed lookup for row keys to prevent blank uploads due to Excel formatting
                const rowKeyMap = new Map<string, string>();
                Object.keys(item.row).forEach(k => {
                    const norm = k.trim().toLowerCase();
                    if (!rowKeyMap.has(norm)) rowKeyMap.set(norm, k);
                });

                // 🚀 SMART TOUCH SYNC: Track if this row should be marked as touched
                let shouldBeTouched = false;
                const statusIndicators = ["STATUS", "CALLING", "LEAD", "RESULT", "REMARK", "NOTE", "FOLLOW", "FOLLOW-UP"];

                for (let excelHeaderRaw in updateColumnMap) {
                    const mapping = updateColumnMap[excelHeaderRaw];
                    if (!mapping) continue;

                    // Support robust matching for headers with spaces/case differences
                    const targetHeaderNorm = excelHeaderRaw.trim().toLowerCase();
                    const actualKeyInRowRaw = rowKeyMap.get(targetHeaderNorm);
                    
                    if (!actualKeyInRowRaw || item.row[actualKeyInRowRaw] === undefined) {
                        // Fallback: try raw key if mapping key exactly matches Excel header
                        if (item.row[excelHeaderRaw] === undefined) {
                            console.warn(`[BulkImport] Missing key "${excelHeaderRaw}" in row ${item.rowIndex + 1}`);
                            continue;
                        }
                    }

                    const rowValueKey = actualKeyInRowRaw || excelHeaderRaw;
                    let valueToMap = (item.row[rowValueKey] ?? "").toString().trim();

                    // Check if this column is a status indicator and has data
                    const col = intColMap.get(mapping.id);
                    const colLabel = col?.label?.toUpperCase() || mapping.id.toUpperCase();
                    if (valueToMap !== "" && statusIndicators.some(ind => colLabel.includes(ind))) {
                        shouldBeTouched = true;
                    }

                    // 🛡️ SMART UPLOAD SHIELD: Prevent blank Excel cells from erasing existing database values
                    if (valueToMap === "" && !item.isNew && (importMode === 'update' || importMode === 'upsert')) {
                        continue;
                    }
                    const colIdToUpdate = mapping.id;
                    const isColInternal = mapping.isInternal;

                    if (colIdToUpdate === "__assigned") {
                        const foundUserId = findUser(valueToMap);
                        if (foundUserId) {
                             // We use set in standard field updates or special logic
                             individualOpsMap.set(`assigned_${item.responseId}`, prisma.formResponse.update({
                                 where: { id: item.responseId },
                                 data: { assignedTo: { set: [foundUserId] } }
                             }));
                        }
                        continue;
                    }

                    // 🎯 SPECIAL HANDLING FOR FOLLOW-UP SYSTEM COLUMNS
                    const followUpCols = ["__followUpStatus", "__nextFollowUpDate", "__recentRemark", "__followup"];
                    if (followUpCols.includes(colIdToUpdate)) {
                        shouldBeTouched = true; // Any system follow-up update touches the lead
                        const existingRemarks = await prisma.formRemark.findMany({
                            where: { responseId: item.responseId },
                            orderBy: { updatedAt: 'desc' },
                            take: 1
                        });
                        const latestRemark = existingRemarks[0];

                        const remarkData: any = {
                            createdById: user.id,
                            authorName: userName,
                            authorEmail: user.emailAddresses[0]?.emailAddress || null,
                            updatedAt: new Date(),
                        };

                        if (colIdToUpdate === "__followUpStatus") remarkData.followUpStatus = valueToMap;
                        if (colIdToUpdate === "__nextFollowUpDate") {
                            let dateVal = valueToMap;
                            if (valueToMap && !isNaN(Number(valueToMap))) {
                                const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                                const parsedDate = new Date(excelEpoch.getTime() + Math.round(Number(valueToMap) * 86400000));
                                if (!isNaN(parsedDate.getTime())) dateVal = parsedDate.toISOString();
                            }
                            remarkData.nextFollowUpDate = dateVal ? new Date(dateVal) : null;
                        }
                        if (colIdToUpdate === "__recentRemark" || colIdToUpdate === "__followup") remarkData.remark = valueToMap;

                        if (latestRemark) {
                            individualOpsMap.set(`remark_upd_${item.responseId}_${colIdToUpdate}`, prisma.formRemark.update({
                                where: { id: latestRemark.id },
                                data: remarkData
                            }));
                        } else {
                            // If no remark exists, create a fresh one
                            individualOpsMap.set(`remark_new_${item.responseId}_${colIdToUpdate}`, prisma.formRemark.create({
                                data: {
                                    ...remarkData,
                                    responseId: item.responseId,
                                    remark: remarkData.remark || valueToMap || "Uploaded via Smart Update",
                                    followUpStatus: remarkData.followUpStatus || "New"
                                }
                            }));
                        }
                        continue;
                    }


                    if (isColInternal) {
                        const internalCol = intColMap.get(colIdToUpdate);
                        if (internalCol?.type === 'user') {
                            const foundUserId = findUser(valueToMap);
                            if (foundUserId) valueToMap = foundUserId;
                        }
                        if (internalCol?.type === 'dropdown' && internalCol.options) {
                            const opts = internalCol.options as any[];
                            const matchedOpt = opts.find((o: any) => o.label?.toLowerCase() === valueToMap.toLowerCase());
                            if (matchedOpt) valueToMap = matchedOpt.label;
                        }
                        if (internalCol?.type === 'date' && valueToMap && !isNaN(Number(valueToMap))) {
                            const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                            const parsedDate = new Date(excelEpoch.getTime() + Math.round(Number(valueToMap) * 86400000));
                            if (!isNaN(parsedDate.getTime())) valueToMap = parsedDate.toISOString();
                        }

                        const existing = intValMap.get(`${item.responseId}_${colIdToUpdate}`);
                        if (existing) {
                            if (existing.value !== valueToMap) {
                                individualOpsMap.set(`int_${existing.id}`, prisma.internalValue.update({
                                    where: { id: existing.id },
                                    data: { value: valueToMap, updatedBy: user.id, updatedByName: userName, updatedAt: new Date() }
                                }));
                                if (!disableActivityLogs) {
                                    activitiesToCreate.push({
                                        responseId: item.responseId, userId: user.id, userName: userName,
                                        type: "BULK_IMPORT_UPDATE", columnName: internalCol?.label || excelHeaderRaw,
                                        oldValue: existing.value || "", newValue: valueToMap
                                    });
                                }
                            }
                        } else {
                            internalValuesToCreateMap.set(`${item.responseId}_${colIdToUpdate}`, {
                                responseId: item.responseId, columnId: colIdToUpdate, value: valueToMap,
                                updatedBy: user.id, updatedByName: userName, updatedAt: new Date()
                            });
                        }
                    } else {
                        const existing = respValMap.get(`${item.responseId}_${colIdToUpdate}`);
                        if (existing) {
                            if (existing.value !== valueToMap) {
                                individualOpsMap.set(`resp_${existing.id}`, prisma.responseValue.update({
                                    where: { id: existing.id },
                                    data: { value: valueToMap }
                                }));
                                if (!disableActivityLogs) {
                                    activitiesToCreate.push({
                                        responseId: item.responseId, userId: user.id, userName: userName,
                                        type: "BULK_IMPORT_UPDATE", columnName: excelHeaderRaw,
                                        oldValue: existing.value || "", newValue: valueToMap
                                    });
                                }
                            }
                        } else {
                            responseValuesToCreateMap.set(`${item.responseId}_${colIdToUpdate}`, {
                                responseId: item.responseId, fieldId: colIdToUpdate, value: valueToMap
                            });
                        }
                    }
                }

                if (shouldBeTouched) {
                    if (item.isNew) {
                        const respIndex = responsesToCreate.findIndex(r => r.id === item.responseId);
                        if (respIndex !== -1) responsesToCreate[respIndex].isTouched = true;
                    } else {
                        individualOpsMap.set(`touch_${item.responseId}`, prisma.formResponse.update({ where: { id: item.responseId }, data: { isTouched: true } }));
                    }
                }
            }

            // 4. Batch Database Operations
            // For FormResponse, using individual creates in parallel batches to be safer with ID generation
            if (responsesToCreate.length > 0) {
                const responseBatches = [];
                for (let j = 0; j < responsesToCreate.length; j += 100) {
                    const batchSlice = responsesToCreate.slice(j, j + 100);
                    responseBatches.push(Promise.all(batchSlice.map(r => prisma.formResponse.create({ data: r }))));
                }
                await Promise.all(responseBatches);
            }

            const individualOps = Array.from(individualOpsMap.values());
            const internalValuesToCreate = Array.from(internalValuesToCreateMap.values());
            const responseValuesToCreate = Array.from(responseValuesToCreateMap.values());

            const otherOps: any[] = [...individualOps];
            if (internalValuesToCreate.length > 0) {
                otherOps.push(prisma.internalValue.createMany({ data: internalValuesToCreate }));
            }
            if (responseValuesToCreate.length > 0) {
                otherOps.push(prisma.responseValue.createMany({ data: responseValuesToCreate }));
            }
            if (activitiesToCreate.length > 0) {
                otherOps.push(prisma.formActivity.createMany({ data: activitiesToCreate }));
            }

            if (otherOps.length > 0) {
                await prisma.$transaction(otherOps);
            }

            successCount += validItems.length;
            allAffectedIds.push(...validItems.map(item => item.responseId));
        }

        // 🛰️ REAL-TIME SYNERGY: Trigger the Matrix Hub Pulse across the fleet
        if (successCount > 0) {
            await emitMatrixUpdate({ 
                pulseType: "BULK_IMPORT", 
                count: successCount,
                responseIds: allAffectedIds
            });
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${successCount} records: ${updatedCount} updated, ${createdCount} created.`,
            errors: errors.length > 0 ? errors : undefined,
            successCount,
            createdCount,
            updatedCount,
            errorCount: errors.length
        });

    } catch (error: any) {
        console.error("Bulk Import Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
