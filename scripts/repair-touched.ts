import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function repair() {
    console.log("🚀 Starting Smart Touched-State Repair...");
    
    // 1. Find all responses that have remarks
    const withRemarks = await prisma.formResponse.findMany({
        where: {
            OR: [
                { remarks: { some: {} } },
                { payments: { some: {} } },
                { internalValues: { some: { 
                    column: { label: { in: ["Status", "Calling Status", "Lead Status", "Calling Date"] } },
                    value: { notIn: ["", "-", "null", "undefined"] }
                } } }
            ]
        },
        select: { id: true }
    });

    const ids = withRemarks.map(r => r.id);
    console.log(`🔍 Found ${ids.length} leads that should be marked as TOUCHED.`);

    if (ids.length > 0) {
        const result = await prisma.formResponse.updateMany({
            where: { id: { in: ids } },
            data: { isTouched: true }
        });
        console.log(`✅ Successfully repaired ${result.count} leads.`);
    } else {
        console.log("✨ No repairs needed. All states are consistent.");
    }

    // 2. Double check: Mark leads with EMPTY values as NOT touched
    // Actually, we don't want to over-reset, but we can ensure empty ones are false.
    // For now, let's just focus on fixing the ones that SHOULD be touched.

    console.log("🛰️ Repair Cycle Complete.");
}

repair()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
